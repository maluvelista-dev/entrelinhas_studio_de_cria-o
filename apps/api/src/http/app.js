import { createPackService, characterPackSchema } from '../modules/library/pack.js';
import { packUpload } from './pack-upload.js';
import { createTemplateService } from '../modules/library/templates.js';
import { createRigService } from '../modules/library/rig.js';
import { pipeline } from 'node:stream/promises';
import { createAssetService } from '../modules/assets/service.js';
import { imageUpload } from './upload.js';
import express from 'express';
import { z, ZodError } from 'zod';
import { idSchema, transitionSchema } from '@studio/schemas';
import { AppError } from '../errors.js';
import { createBookService } from '../modules/books/service.js';
import { createLibraryService } from '../modules/library/service.js';
import { createAuthService, SESSION_LIFETIME_MS } from '../modules/auth/service.js';
import { requireAccess, permit, sessionToken, createLoginLimiter } from './access.js';
import { requirePermission } from '../modules/auth/permissions.js';
import { serializeTemplate, serializePagePreview, serializeRig, serializeBook, serializeBookSummary, serializeUser, serializeLibraryItem, serializeAsset } from './serializers.js';

export function createApp({ pool, storage, security = { origins: ['http://127.0.0.1:5173', 'http://localhost:5173'], secureCookies: false } }) {
  const app = express();
  const books = createBookService(pool, storage);
  const library = createLibraryService(pool, storage);
  const packs = createPackService(pool, storage);
  const templates = createTemplateService(pool);
  const rigs = createRigService(pool, storage);
  const auth = createAuthService(pool);
  const assets = createAssetService(pool, storage);
  const cookieName = security.secureCookies ? '__Host-studio_session' : 'studio_session';
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: security.secureCookies, path: '/' };
  const authenticated = requireAccess(auth, cookieName);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'X-Frame-Options': 'DENY' });
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.get('sec-fetch-site') === 'cross-site' || !security.origins.includes(req.get('origin'))) {
        return next(new AppError(403, 'ORIGIN_DENIED', 'Origem não autorizada.'));
      }
      if (!(req.method === 'POST' && (req.path === '/api/internal/assets' || req.path === '/api/internal/character-packs' || /^\/api\/internal\/library\/[0-9a-f-]{36}\/rig\/[a-zA-Z][a-zA-Z0-9_-]{0,79}\/[a-zA-Z][a-zA-Z0-9_-]{0,79}\/image$/.test(req.path)) && req.is('multipart/form-data')) && !req.is('application/json')) return next(new AppError(415, 'JSON_REQUIRED', 'Use conteúdo JSON.'));
    }
    next();
  });
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', (req, _res, next) => { z.strictObject({}).parse(req.query); next(); });
  app.get('/api/health', async (_req, res) => {
    try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }
    catch { res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Serviço indisponível.' } }); }
  });
  app.post('/api/auth/login', createLoginLimiter(), async (req, res) => {
    const { user, token } = await auth.login(req.body, sessionToken(req, cookieName));
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: SESSION_LIFETIME_MS });
    res.json({ user: serializeUser(user) });
  });
  app.get('/api/auth/session', async (req, res) => {
    const user = await auth.authenticate(sessionToken(req, cookieName));
    res.json({ user: user ? serializeUser(user) : null });
  });
  app.post('/api/auth/logout', async (req, res) => {
    z.strictObject({}).parse(req.body ?? {});
    await auth.logout(sessionToken(req, cookieName));
    res.clearCookie(cookieName, cookieOptions).status(204).end();
  });

  // Every internal route is authenticated before any resource lookup.
  const internal = express.Router();
  app.use('/api/internal', authenticated, internal);
  for (const parameter of ['bookId', 'pageId', 'userId', 'assetId', 'itemId']) {
    internal.param(parameter, (_req, _res, next, value) => {
      if (!idSchema.safeParse(value).success) throw new AppError(400, 'INVALID_ID', 'Identificador inválido.');
      next();
    });
  }
  function route(method, path, permission, handler, serializer, status = 200) {
    if (!permission || typeof serializer !== 'function') throw new Error('Rota exige permissão e serializer.');
    internal[method](path, permit(permission), async (req, res) => res.status(status).json(serializer(await handler(req))));
  }
  const arrayOf = serialize => values => values.map(serialize);
  route('get', '/books', 'books:read', () => books.list(), arrayOf(serializeBookSummary));
  route('post', '/books', 'books:write', req => books.create(req.body), serializeBook, 201);
  route('get', '/books/:bookId', 'books:read', req => books.get(req.params.bookId), serializeBook);
  route('put', '/books/:bookId', 'books:write', req => books.update(req.params.bookId, req.body), serializeBook);
  route('post', '/books/:bookId/pages', 'books:write', req => books.savePage(req.params.bookId, req.body), serializeBook, 201);
  route('put', '/books/:bookId/pages/:pageId', 'books:write', req => books.savePage(req.params.bookId, req.body, req.params.pageId), serializeBook);
  route('put', '/books/:bookId/page-order', 'books:write', req => books.reorder(req.params.bookId, req.body), serializeBook);
  route('post', '/books/:bookId/transitions', 'books:read', req => {
    const input = transitionSchema.parse(req.body);
    if (input.status === 'REVIEW') requirePermission(req.actor, 'books:submit');
    else if (input.status === 'DRAFT') requirePermission(req.actor, 'books:return');
    else throw new AppError(409, 'INVALID_TRANSITION', 'Publicação ainda não está habilitada.');
    return books.transition(req.params.bookId, input, req.actor.id);
  }, serializeBook);
  internal.post('/character-packs', permit('library:write'), packUpload((body, file) => packs.import(body, file), serializeLibraryItem));
  route('get', '/library/:itemId/pack', 'library:read', req => packs.export(req.params.itemId), value => characterPackSchema.parse(value));
  route('get', '/templates', 'library:read', () => templates.list(), arrayOf(serializeTemplate));
  route('post', '/templates', 'library:write', req => templates.create(req.body), serializeTemplate, 201);
  route('post', '/books/:bookId/scene-preview', 'books:read', req => books.preview(req.params.bookId, req.body), serializePagePreview);
  route('get', '/library', 'library:read', () => library.list(), arrayOf(serializeLibraryItem));
  route('post', '/library', 'library:write', req => library.create(req.body), serializeLibraryItem, 201);
  route('get', '/library/:itemId', 'library:read', req => library.get(req.params.itemId), serializeLibraryItem);
  route('put', '/library/:itemId', 'library:write', req => library.update(req.params.itemId, req.body), serializeLibraryItem);
  route('get', '/library/:itemId/rig', 'library:read', req => rigs.get(req.params.itemId), serializeRig);
  route('put', '/library/:itemId/rig', 'library:write', req => rigs.update(req.params.itemId, req.body), serializeRig);
  internal.post('/library/:itemId/rig/:perspectiveId/:partId/image', permit('library:write'), imageUpload((body, file, req) => rigs.upload(req.params.itemId, req.params.perspectiveId, req.params.partId, body, file), serializeRig, { fieldSize: 256 * 1024 }));
  internal.post('/assets', permit('library:write'), imageUpload((body, file) => assets.import(body, file), serializeAsset));
  // Binary image representation: fixed allowlisted MIME, authenticated ID lookup; never expose storage paths.
  internal.get('/assets/:assetId/content', permit('library:read'), async (req, res) => {
    const content = await assets.content(req.params.assetId);
    res.set({ 'Content-Type': content.mediaType, 'Content-Disposition': 'inline', 'Cross-Origin-Resource-Policy': 'same-origin' });
    await pipeline(content.stream, res);
  });
  route('get', '/assets', 'library:read', () => library.assets(), arrayOf(serializeAsset));
  route('get', '/users', 'users:manage', () => auth.listUsers(), arrayOf(serializeUser));
  route('post', '/users', 'users:manage', req => auth.createUser(req.body, req.actor.id), serializeUser, 201);
  route('put', '/users/:userId', 'users:manage', req => auth.updateUser(req.params.userId, req.body, req.actor.id), serializeUser);
  route('post', '/users/:userId/password', 'users:manage',
    req => auth.resetPassword(req.params.userId, req.body, req.actor.id), () => ({ updated: true }));
  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.')));
  app.use((error, _req, res, _next) => {
    if (res.headersSent) { res.destroy(); return; }
    if (error instanceof ZodError)
      return res.status(422).json({
        error: {
          code: "INVALID_INPUT",
          message: "Confira os dados informados.",
          fields: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: "Valor inválido.",
          })),
        },
      });
    if (error instanceof AppError)
      return res
        .status(error.status)
        .json({ error: { code: error.code, message: error.message } });
    if (error.type === "entity.parse.failed")
      return res
        .status(400)
        .json({ error: { code: "INVALID_JSON", message: "JSON inválido." } });
    if (error.type === "entity.too.large")
      return res
        .status(413)
        .json({
          error: {
            code: "BODY_TOO_LARGE",
            message: "Conteúdo acima do limite.",
          },
        });
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({
          error: {
            code: "DUPLICATE",
            message: "Este identificador já está em uso.",
          },
        });
    if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code))
      return res
        .status(409)
        .json({
          error: {
            code: "CONCURRENT_CHANGE",
            message: "Edição concorrente. Recarregue e tente novamente.",
          },
        });
    if (
      [
        "ECONNREFUSED",
        "ETIMEDOUT",
        "PROTOCOL_CONNECTION_LOST",
        "ER_ACCESS_DENIED_ERROR",
      ].includes(error.code)
    ) {
      return res
        .status(503)
        .json({
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "MariaDB indisponível.",
          },
        });
    }
    return res
      .status(500)
      .json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Não foi possível concluir a operação.",
        },
      });
  });
  return app;
}
