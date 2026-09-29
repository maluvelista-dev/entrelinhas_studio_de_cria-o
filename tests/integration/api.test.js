import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import sharp from "sharp";
import path from "node:path";
import supertest from "supertest";
import { createAuthService } from "../../apps/api/src/modules/auth/service.js";
import { beforeAll, afterAll, it, expect } from "vitest";
import { emptyPage } from "@studio/schemas";
import { readConfig, assertTestDatabase } from "../../apps/api/src/config.js";
import {
  createPool,
  transaction,
} from "../../apps/api/src/infrastructure/database/pool.js";
import { migrate } from "../../apps/api/src/infrastructure/database/migrate.js";
import { FilesystemStorage } from "../../apps/api/src/infrastructure/storage/filesystem.js";
import { createApp } from "../../apps/api/src/http/app.js";

let pool, storage, app, root, adminCookie, adminId;
const testPassword = 'Integration-password-2026!';
function request(application) {
  return Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method => [method, path =>
    supertest(application)[method](path).set('Origin', 'http://127.0.0.1:5173').set('Cookie', adminCookie || '')]));
}
const base = "/api/internal/books";
async function createBook(slug = "livro-" + randomUUID()) {
  const result = await request(app)
    .post(base)
    .send({ title: "A árvore 🌳", slug })
    .expect(201);
  return result.body;
}
beforeAll(async () => {
  assertTestDatabase();
  pool = createPool(readConfig().database);
  const [[server]] = await pool.query(
    "SELECT VERSION() AS version, @@sql_mode AS sqlMode, @@collation_server AS collation",
  );
  expect(server.version).toContain("MariaDB");
  expect(server.version.startsWith(process.env.EXPECTED_DB_VERSION)).toBe(true);
  console.log(
    "MIGRATION_TARGET",
    JSON.stringify({ target: process.env.TEST_DB_TARGET, ...server }),
  );
  // Fixed allowlist and isolated test credentials, checked before any destructive action.
  const connection = await pool.getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of [
      "auth_sessions",
      "users",
      "book_status_history",
      "library_items",
      "pages",
      "books",
      "book_versions",
      "assets",
      "schema_migrations",
    ]) {
      await connection.query("DROP TABLE IF EXISTS ??", [table]);
    }
  } finally {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    connection.release();
  }
  expect(await migrate(pool, { through: "001_content.sql" })).toEqual([
    "001_content.sql",
  ]);
  root = await mkdtemp(path.join(os.tmpdir(), "book-studio-integration-"));
  storage = new FilesystemStorage(root);
  app = createApp({ pool, storage });
  // Real content before second migration verifies upgrade preserves previous data.
  const id = randomUUID();
  await pool.execute(
    "INSERT INTO books(id,slug,created_at,updated_at) VALUES (?,'migration-marker',UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))",
    [id],
  );
  expect(await migrate(pool)).toEqual(["002_status_history.sql", "003_access_control.sql", "004_image_dimensions.sql"]);
  const [[marker]] = await pool.execute("SELECT id FROM books WHERE id = ?", [
    id,
  ]);
  expect(marker.id).toBe(id);
  expect(await migrate(pool)).toEqual([]);
  const admin = await createAuthService(pool).createUser({ username: 'test-admin', displayName: 'Admin de teste', role: 'ADMIN', password: testPassword });
  adminId = admin.id;
  const login = await supertest(app).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173').send({ username: 'test-admin', password: testPassword }).expect(200);
  adminCookie = login.headers['set-cookie'][0].split(';')[0];
});
afterAll(async () => {
  if (pool) await pool.end();
  if (root) await rm(root, { recursive: true, force: true });
});
it("persiste livros, Unicode, páginas, reordenação e rejeita edição concorrente", async () => {
  let book = await createBook();
  await request(app)
    .post(base)
    .send({ title: "Duplicado", slug: book.slug })
    .expect(409);
  for (const text of ["Primeira página 🦊", "Segunda página"]) {
    book = (
      await request(app)
        .post(base + "/" + book.id + "/pages")
        .send({ revision: book.revision, document: emptyPage(text) })
        .expect(201)
    ).body;
  }
  const order = book.pages.map((page) => page.id).reverse();
  book = (
    await request(app)
      .put(base + "/" + book.id + "/page-order")
      .send({ revision: book.revision, pageIds: order })
      .expect(200)
  ).body;
  expect(book.pages.map((page) => page.position)).toEqual([1, 2]);
  expect(book.pages[1].content.text).toBe("Primeira página 🦊");
  await request(app)
    .put(base + "/" + book.id + "/page-order")
    .send({ revision: book.revision, pageIds: [order[0], order[0]] })
    .expect(422);
  const input = {
    revision: book.revision,
    title: "Nova edição",
    description: "Texto com ' aspas",
    ageRange: { min: 3, max: 7 },
    cover: null,
  };
  const concurrent = await Promise.all([
    request(app)
      .put(base + "/" + book.id)
      .send(input),
    request(app)
      .put(base + "/" + book.id)
      .send(input),
  ]);
  expect(concurrent.map((result) => result.status).sort()).toEqual([200, 409]);
  // New pool and app emulate reconnection without depending on process memory.
  const secondPool = createPool(readConfig().database);
  try {
    const secondApp = createApp({ pool: secondPool, storage });
    const loaded = (
      await request(secondApp)
        .get(base + "/" + book.id)
        .expect(200)
    ).body;
    expect(loaded.title).toBe("Nova edição");
    expect(loaded.pages[1].content.text).toBe("Primeira página 🦊");
    expect(loaded.revision).toBe(book.revision + 1);
  } finally {
    await secondPool.end();
  }
});
it("mantém workflow e histórico atômicos e bloqueia publicação", async () => {
  let book = await createBook();
  book = (
    await request(app)
      .post(base + "/" + book.id + "/transitions")
      .send({
        revision: book.revision,
        status: "REVIEW",
        comment: "Conferir texto",
      })
      .expect(200)
  ).body;
  expect(book.history).toHaveLength(1);
  expect(book.history[0].actorId).toBe(adminId);
  await request(app)
    .post(base + "/" + book.id + "/pages")
    .send({ revision: book.revision, document: emptyPage() })
    .expect(409);
  for (const status of ["READY_TO_PUBLISH", "PUBLISHED"]) {
    await request(app)
      .post(base + "/" + book.id + "/transitions")
      .send({ revision: book.revision, status })
      .expect(409);
  }
  book = (
    await request(app)
      .post(base + "/" + book.id + "/transitions")
      .send({ revision: book.revision, status: "DRAFT" })
      .expect(200)
  ).body;
  expect(book.history).toHaveLength(2);
  await pool.query(
    "CREATE TRIGGER fail_history BEFORE INSERT ON book_status_history FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test failure'",
  );
  try {
    await request(app)
      .post(base + "/" + book.id + "/transitions")
      .send({ revision: book.revision, status: "REVIEW" })
      .expect(500);
    const actual = (await request(app).get(base + "/" + book.id)).body;
    expect(actual.status).toBe("DRAFT");
    expect(actual.revision).toBe(book.revision);
    expect(actual.history).toHaveLength(2);
  } finally {
    await pool.query("DROP TRIGGER fail_history");
  }
});
it("constraints reais recusam órfãos, faixa inválida, JSON e posições duplicadas", async () => {
  let book = await createBook();
  const other = await createBook();
  const [[version]] = await pool.execute(
    "SELECT working_version_id AS id FROM books WHERE id = ?",
    [book.id],
  );
  const [[otherVersion]] = await pool.execute(
    "SELECT working_version_id AS id FROM books WHERE id = ?",
    [other.id],
  );
  await expect(
    pool.execute("UPDATE books SET working_version_id = ? WHERE id = ?", [
      otherVersion.id,
      book.id,
    ]),
  ).rejects.toThrow();
  await expect(
    pool.execute(
      "UPDATE book_versions SET age_min = 9, age_max = 2 WHERE id = ?",
      [version.id],
    ),
  ).rejects.toThrow();
  book = (
    await request(app)
      .post(base + "/" + book.id + "/pages")
      .send({ revision: book.revision, document: emptyPage() })
      .expect(201)
  ).body;
  book = (
    await request(app)
      .post(base + "/" + book.id + "/pages")
      .send({ revision: book.revision, document: emptyPage() })
      .expect(201)
  ).body;
  await expect(
    pool.execute("UPDATE pages SET position = 1 WHERE id = ?", [
      book.pages[1].id,
    ]),
  ).rejects.toThrow();
  await expect(
    pool.execute("UPDATE pages SET content_json = 'invalid' WHERE id = ?", [
      book.pages[0].id,
    ]),
  ).rejects.toThrow();
  await pool.query(
    "CREATE TRIGGER fail_order BEFORE UPDATE ON pages FOR EACH ROW BEGIN IF NEW.position = 2 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test failure'; END IF; END",
  );
  try {
    await request(app)
      .put(base + "/" + book.id + "/page-order")
      .send({
        revision: book.revision,
        pageIds: book.pages.map((page) => page.id).reverse(),
      })
      .expect(500);
    const actual = (await request(app).get(base + "/" + book.id)).body;
    expect(actual.pages).toEqual(book.pages);
    expect(actual.revision).toBe(book.revision);
  } finally {
    await pool.query("DROP TRIGGER fail_order");
  }
});
it("rollback remove criação parcial e protege checksum de migration", async () => {
  const id = randomUUID();
  await expect(
    transaction(pool, async (connection) => {
      await connection.execute(
        "INSERT INTO books(id,slug,created_at,updated_at) VALUES (?, ?, UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))",
        [id, id],
      );
      throw new Error("failure after insert");
    }),
  ).rejects.toThrow();
  const [rows] = await pool.execute("SELECT * FROM books WHERE id = ?", [id]);
  expect(rows).toHaveLength(0);
  const [[migration]] = await pool.query(
    "SELECT checksum FROM schema_migrations WHERE name = '002_status_history.sql'",
  );
  await pool.query(
    "UPDATE schema_migrations SET checksum = 'changed' WHERE name = '002_status_history.sql'",
  );
  try {
    await expect(migrate(pool)).rejects.toThrow("alterada");
  } finally {
    await pool.execute(
      "UPDATE schema_migrations SET checksum = ? WHERE name = '002_status_history.sql'",
      [migration.checksum],
    );
  }
});
it("valida referência e escopo de assets na Library e capa", async () => {
  const owner = await createBook();
  const other = await createBook();
  const id = randomUUID(),
    key = "objects/" + id + ".png";
  const info = await storage.put(key, Buffer.from("fixture"));
  await pool.execute(
    `INSERT INTO assets(id,owner_book_id,storage_key,original_name,media_type,byte_size,checksum,created_at)
    VALUES (?,?,?,'fixture.png','image/png',?,?,UTC_TIMESTAMP(3))`,
    [id, owner.id, key, info.byteSize, info.checksum],
  );
  await request(app)
    .post("/api/internal/library")
    .send({
      name: "Árvore",
      kind: "OBJECT",
      ownerBookId: owner.id,
      assetId: id,
    })
    .expect(201);
  for (const ownerBookId of [null, other.id]) {
    await request(app)
      .post("/api/internal/library")
      .send({ name: "Árvore", kind: "OBJECT", ownerBookId, assetId: id })
      .expect(422);
  }
  await request(app)
    .post("/api/internal/library")
    .send({ name: "Som", kind: "AUDIO", ownerBookId: owner.id, assetId: id })
    .expect(422);
  await storage.delete(key);
  await request(app)
    .post("/api/internal/library")
    .send({
      name: "Ausente",
      kind: "OBJECT",
      ownerBookId: owner.id,
      assetId: id,
    })
    .expect(422);
  await request(app)
    .put(base + "/" + owner.id)
    .send({ revision: owner.revision, title: owner.title, cover: id })
    .expect(422);
});
it("valida HTTP, não expõe drafts e omite detalhes de falhas", async () => {
  await request(app)
    .post(base)
    .send({ title: "", slug: "INVALID" })
    .expect(422);
  await request(app)
    .post(base)
    .set("Content-Type", "application/json")
    .send("{broken")
    .expect(400);
  await request(app)
    .post(base)
    .set("Origin", "https://outside.example")
    .send({ title: "x", slug: "x" })
    .expect(403);
  await request(app).get("/books").expect(404);
  await request(app).get("/api/books").expect(404);
  await request(app).get("/storage/objects/a.png").expect(404);
  const failedApp = createApp({
    pool: {
      query: async () => {
        throw new Error("password=secret");
      },
    },
    storage,
  });
  const result = await request(failedApp).get("/api/health").expect(503);
  expect(JSON.stringify(result.body)).not.toContain("secret");
  const book = await createBook();
  await request(app)
    .post(base + "/" + book.id + "/pages")
    .send({
      revision: book.revision,
      document: { ...emptyPage(), schemaVersion: 2 },
    })
    .expect(422);
});

it("autentica, limita perfis e não serializa credenciais nem campos internos", async () => {
  const auth = createAuthService(pool);
  const editor = await auth.createUser({ username: 'editor-test', displayName: 'Editor', role: 'EDITOR', password: testPassword });
  const reviewer = await auth.createUser({ username: 'reviewer-test', displayName: 'Revisor', role: 'REVIEWER', password: testPassword });
  const loginAs = async username => {
    const response = await supertest(app).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173')
      .send({ username, password: testPassword }).expect(200);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(response.body).not.toHaveProperty('token');
    expect(JSON.stringify(response.body)).not.toContain(testPassword);
    return cookie.split(';')[0];
  };
  const editorCookie = await loginAs('editor-test');
  const reviewerCookie = await loginAs('reviewer-test');
  const as = (cookie, method, path) => supertest(app)[method](path).set('Origin', 'http://127.0.0.1:5173').set('Cookie', cookie);
  await supertest(app).get(base).expect(401);
  await supertest(app).get('/api/internal/users').expect(401);
  await as(reviewerCookie, 'get', base).expect(200);
  await as(reviewerCookie, 'post', base).send({ title: 'Não permitido', slug: 'forbidden' }).expect(403);
  await as(editorCookie, 'get', '/api/internal/users').expect(403);
  const book = (await as(editorCookie, 'post', base).send({ title: 'Editor cria', slug: 'editor-' + randomUUID() }).expect(201)).body;
  let reviewed = (await as(editorCookie, 'post', base + '/' + book.id + '/transitions')
    .send({ revision: book.revision, status: 'REVIEW' }).expect(200)).body;
  await as(editorCookie, 'post', base + '/' + book.id + '/transitions')
    .send({ revision: reviewed.revision, status: 'DRAFT' }).expect(403);
  reviewed = (await as(reviewerCookie, 'post', base + '/' + book.id + '/transitions')
    .send({ revision: reviewed.revision, status: 'DRAFT' }).expect(200)).body;
  expect(reviewed.history.map(item => item.actorId)).toEqual([editor.id, reviewer.id]);
  await as(editorCookie, 'get', base + '?include=password_hash').expect(422);
  await as(editorCookie, 'get', base + '/invalid-id').expect(400);
  await as(editorCookie, 'put', base + '/' + book.id).send({ revision: reviewed.revision, title: 'x', role: 'ADMIN' }).expect(422);
  await supertest(app).post('/api/auth/login').send({ username: 'test-admin', password: testPassword }).expect(403);
  await supertest(app).post('/api/auth/login').set('Origin', 'https://bad.example').send({ username: 'test-admin', password: testPassword }).expect(403);
  const users = (await request(app).get('/api/internal/users').expect(200)).body;
  for (const user of users) expect(Object.keys(user).sort()).toEqual(['active', 'displayName', 'id', 'permissions', 'role', 'username'].sort());
  await request(app).put('/api/internal/users/' + editor.id)
    .send({ displayName: 'Editor', role: 'REVIEWER', active: true }).expect(200);
  await as(editorCookie, 'get', base).expect(401);
  await request(app).put('/api/internal/users/' + reviewer.id)
    .send({ displayName: 'Revisor', role: 'REVIEWER', active: false }).expect(200);
  await as(reviewerCookie, 'get', base).expect(401);
  await request(app).put('/api/internal/users/' + adminId)
    .send({ displayName: 'Admin', role: 'EDITOR', active: true }).expect(409);
});

it("expira/revoga sessões, redefine senhas e limita tentativas de login", async () => {
  const user = await createAuthService(pool).createUser({ username: 'session-test', displayName: 'Sessão', role: 'EDITOR', password: testPassword });
  const login = (application, password = testPassword) => supertest(application).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173').send({ username: 'session-test', password });
  const first = await login(app).expect(200);
  const firstCookie = first.headers['set-cookie'][0].split(';')[0];
  const [[session]] = await pool.execute('SELECT token_hash FROM auth_sessions WHERE user_id=?', [user.id]);
  expect(session.token_hash).not.toBe(firstCookie.split('=')[1]);
  await pool.execute('UPDATE auth_sessions SET last_seen_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 31 MINUTE) WHERE user_id=?', [user.id]);
  await supertest(app).get(base).set('Cookie', firstCookie).expect(401);
  const second = await login(app).expect(200);
  const secondCookie = second.headers['set-cookie'][0].split(';')[0];
  expect(secondCookie).not.toBe(firstCookie);
  await request(app).post('/api/internal/users/' + user.id + '/password').send({ password: 'A-new-test-password-2026!' }).expect(200);
  await supertest(app).get(base).set('Cookie', secondCookie).expect(401);
  const freshApp = createApp({ pool, storage });
  await login(freshApp).expect(401);
  const third = await login(freshApp, 'A-new-test-password-2026!').expect(200);
  const thirdCookie = third.headers['set-cookie'][0].split(';')[0];
  await supertest(freshApp).post('/api/auth/logout').set('Origin', 'http://127.0.0.1:5173').set('Cookie', thirdCookie).send({}).expect(204);
  await supertest(freshApp).get(base).set('Cookie', thirdCookie).expect(401);
  const secureApp = createApp({ pool, storage, security: { origins: ['https://studio.example'], secureCookies: true } });
  const secure = await supertest(secureApp).post('/api/auth/login').set('Origin', 'https://studio.example')
    .send({ username: 'session-test', password: 'A-new-test-password-2026!' }).expect(200);
  expect(secure.headers['set-cookie'][0]).toContain('__Host-studio_session=');
  expect(secure.headers['set-cookie'][0]).toContain('Secure');
  const limitedApp = createApp({ pool, storage });
  for (let index = 0; index < 10; index++) {
    await supertest(limitedApp).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173')
      .send({ username: 'missing-account', password: 'wrong-password' }).expect(401);
  }
  await supertest(limitedApp).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173')
    .send({ username: 'missing-account', password: 'wrong-password' }).expect(429);
});


it('imports private images atomically and enforces scope, roles and content validation', async () => {
  const endpoint = '/api/internal/assets';
  const bytes = await sharp({ create: { width: 32, height: 24, channels: 4, background: '#55aaff80' } }).png().toBuffer();
  const upload = (owner = '', application = app) => request(application).post(endpoint)
    .field('name', 'Test illustration').field('kind', 'BACKGROUND').field('ownerBookId', owner)
    .attach('file', bytes, { filename: 'scene.png', contentType: 'image/png' });
  const asset = (await upload().expect(201)).body;
  expect(asset).toMatchObject({ width: 32, height: 24, mediaType: 'image/png', ownerBookId: null });
  expect(Object.keys(asset).sort()).toEqual(['id', 'name', 'ownerBookId', 'mediaType', 'width', 'height', 'byteSize'].sort());
  const content = endpoint + '/' + asset.id + '/content';
  await supertest(app).get(content).expect(401);
  const downloaded = await request(createApp({ pool, storage })).get(content).expect(200);
  expect(downloaded.headers['content-type']).toContain('image/png');
  expect(downloaded.headers['cache-control']).toContain('no-store');
  expect((await sharp(downloaded.body).metadata()).width).toBe(32);
  const items = (await request(app).get('/api/internal/library').expect(200)).body;
  expect(items.some(item => item.assetId === asset.id)).toBe(true);
  let book = await createBook();
  const privateAsset = (await upload(book.id).expect(201)).body;
  await request(app).post(base).send({ title: 'Invalid scope', slug: 'scope-' + randomUUID(), cover: privateAsset.id }).expect(422);
  book = (await request(app).put(base + '/' + book.id).send({ revision: book.revision, title: book.title, cover: privateAsset.id }).expect(200)).body;
  expect((await request(app).get(base).expect(200)).body.find(item => item.id === book.id).cover).toBe(privateAsset.id);
  await request(app).post(base + '/' + book.id + '/transitions').send({ revision: book.revision, status: 'REVIEW' }).expect(200);
  await upload(book.id).expect(409);
  await upload(randomUUID()).expect(404);
  await request(app).get(endpoint + '/invalid/content').expect(400);
  await request(app).get(endpoint + '/' + randomUUID() + '/content').expect(404);
  await request(app).post(endpoint).field('name', 'Fake').field('kind', 'BACKGROUND')
    .attach('file', Buffer.from('<svg/>'), { filename: 'fake.png', contentType: 'image/png' }).expect(415);
  await request(app).post(endpoint).field('name', 'Extra').field('kind', 'BACKGROUND').field('role', 'ADMIN')
    .attach('file', bytes, 'scene.png').expect(422);
  const auth = createAuthService(pool);
  await auth.createUser({ username: 'upload-reviewer', displayName: 'Reader', role: 'REVIEWER', password: testPassword });
  const fresh = createApp({ pool, storage });
  const login = await supertest(fresh).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173')
    .send({ username: 'upload-reviewer', password: testPassword }).expect(200);
  const cookie = login.headers['set-cookie'][0].split(';')[0];
  await supertest(fresh).get(content).set('Cookie', cookie).expect(200);
  await supertest(fresh).post(endpoint).set('Origin', 'http://127.0.0.1:5173').set('Cookie', cookie).attach('file', bytes, 'scene.png').expect(403);
  const { readdir } = await import('node:fs/promises');
  const before = await readdir(path.join(root, 'illustrations'));
  await pool.query("CREATE TRIGGER reject_image_item BEFORE INSERT ON library_items FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test failure'");
  try { await upload().expect(500); } finally { await pool.query('DROP TRIGGER reject_image_item'); }
  expect(await readdir(path.join(root, 'illustrations'))).toEqual(before);
});
