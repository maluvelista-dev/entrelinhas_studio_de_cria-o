import { randomUUID } from 'node:crypto';
import { pageDocumentSchema } from '@studio/schemas';
import { AppError } from '../../errors.js';

export async function findBook(connection, id, lock = false) {
  const [[book]] = await connection.execute(`SELECT b.id, b.slug, b.created_at,
    b.updated_at, v.id AS version_id, v.version, v.revision, v.status, v.title, v.description,
    v.age_min, v.age_max, v.cover_asset_id, v.schema_version,
    published.version AS published_version
    FROM books b JOIN book_versions v ON v.id = b.working_version_id
    LEFT JOIN book_versions published ON published.id = b.published_version_id
    WHERE b.id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  if (!book) throw new AppError(404, 'BOOK_NOT_FOUND', 'Livro não encontrado.');
  return book;
}
function parseJson(value) { return typeof value === 'string' ? JSON.parse(value) : value; }
export function pageDto(row) {
  const document = pageDocumentSchema.parse({
    schemaVersion: row.schema_version, content: parseJson(row.content_json),
    scene: parseJson(row.scene_json), timeline: parseJson(row.timeline_json),
    automaticAnimations: parseJson(row.automatic_animations_json),
    premiumInteractions: parseJson(row.premium_interactions_json),
  });
  return { id: row.id, position: row.position, ...document };
}
export async function detail(connection, id) {
  const book = await findBook(connection, id);
  const [pages] = await connection.execute('SELECT * FROM pages WHERE book_version_id = ? ORDER BY position', [book.version_id]);
  const [history] = await connection.execute(`SELECT h.id, h.from_status AS fromStatus, h.to_status AS toStatus,
    h.actor_id AS actorId, u.display_name AS actorName, h.comment, h.created_at AS createdAt
    FROM book_status_history h LEFT JOIN users u ON u.id = h.actor_id
    WHERE h.book_version_id = ? ORDER BY h.created_at, h.id`, [book.version_id]);
  return {
    id: book.id, slug: book.slug, title: book.title, description: book.description,
    ageRange: book.age_min === null ? null : { min: book.age_min, max: book.age_max },
    cover: book.cover_asset_id, status: book.status, schemaVersion: book.schema_version,
    version: book.version, workingVersion: book.version, publishedVersion: book.published_version,
    revision: book.revision, createdAt: book.created_at, updatedAt: book.updated_at,
    pages: pages.map(pageDto), history,
  };
}
export async function insertBook(connection, input) {
  const id = randomUUID();
  const versionId = randomUUID();
  await connection.execute(`INSERT INTO books(id, slug, created_at, updated_at)
    VALUES (?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`, [id, input.slug]);
  await connection.execute(`INSERT INTO book_versions
    (id, book_id, version, status, title, description, age_min, age_max, cover_asset_id,
      schema_version, revision, created_at, updated_at)
    VALUES (?, ?, 1, 'DRAFT', ?, ?, ?, ?, ?, 1, 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
    [versionId, id, input.title, input.description, input.ageRange?.min ?? null,
      input.ageRange?.max ?? null, input.cover]);
  await connection.execute('UPDATE books SET working_version_id = ? WHERE id = ?', [versionId, id]);
  return id;
}
export async function bumpRevision(connection, book) {
  await connection.execute('UPDATE book_versions SET revision = revision + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [book.version_id]);
  await connection.execute('UPDATE books SET updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [book.id]);
}
export async function writePage(connection, book, document, pageId) {
  const fields = [document.schemaVersion, JSON.stringify(document.content), JSON.stringify(document.scene),
    JSON.stringify(document.timeline), JSON.stringify(document.automaticAnimations), JSON.stringify(document.premiumInteractions)];
  if (pageId) {
    const [result] = await connection.execute(`UPDATE pages SET schema_version = ?, content_json = ?,
      scene_json = ?, timeline_json = ?, automatic_animations_json = ?, premium_interactions_json = ?,
      updated_at = UTC_TIMESTAMP(3) WHERE id = ? AND book_version_id = ?`, [...fields, pageId, book.version_id]);
    if (!result.affectedRows) throw new AppError(404, 'PAGE_NOT_FOUND', 'Página não encontrada neste livro.');
  } else {
    const [[{ count }]] = await connection.execute('SELECT COUNT(*) AS count FROM pages WHERE book_version_id = ?', [book.version_id]);
    if (count >= 500) throw new AppError(422, 'PAGE_LIMIT', 'Limite inicial de 500 páginas por livro.');
    await connection.execute(`INSERT INTO pages
      (id, book_version_id, position, schema_version, content_json, scene_json, timeline_json,
      automatic_animations_json, premium_interactions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
      [randomUUID(), book.version_id, count + 1, ...fields]);
  }
}
