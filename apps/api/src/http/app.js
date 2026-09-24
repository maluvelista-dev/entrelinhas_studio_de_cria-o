import express from "express";
import { ZodError } from "zod";
import { idSchema } from "@studio/schemas";
import { AppError } from "../errors.js";
import { createBookService } from "../modules/books/service.js";
import { createLibraryService } from "../modules/library/service.js";

export function createApp({ pool, storage }) {
  const app = express();
  const books = createBookService(pool, storage);
  const library = createLibraryService(pool, storage);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    // Loopback-only server; reject cross-origin browser mutations as an extra local guard.
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      (req.get("sec-fetch-site") === "cross-site" ||
        (req.get("origin") &&
          ![
            "http://127.0.0.1:5173",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
          ].includes(req.get("origin"))))
    ) {
      return next(new AppError(403, "ORIGIN_DENIED", "Origem não autorizada."));
    }
    next();
  });
  app.use(express.json({ limit: "256kb" }));
  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", database: "MariaDB" });
    } catch {
      res
        .status(503)
        .json({
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "MariaDB indisponível.",
          },
        });
    }
  });
  app.param("bookId", (req, _res, next, value) => {
    const parsed = idSchema.safeParse(value);
    if (!parsed.success)
      return next(new AppError(400, "INVALID_ID", "Identificador inválido."));
    next();
  });
  const base = "/api/internal/books";
  app.get(base, async (_req, res) => res.json(await books.list()));
  app.post(base, async (req, res) =>
    res.status(201).json(await books.create(req.body)),
  );
  app.get(base + "/:bookId", async (req, res) =>
    res.json(await books.get(req.params.bookId)),
  );
  app.put(base + "/:bookId", async (req, res) =>
    res.json(await books.update(req.params.bookId, req.body)),
  );
  app.post(base + "/:bookId/pages", async (req, res) =>
    res.status(201).json(await books.savePage(req.params.bookId, req.body)),
  );
  app.put(base + "/:bookId/pages/:pageId", async (req, res) => {
    idSchema.parse(req.params.pageId);
    res.json(
      await books.savePage(req.params.bookId, req.body, req.params.pageId),
    );
  });
  app.put(base + "/:bookId/page-order", async (req, res) =>
    res.json(await books.reorder(req.params.bookId, req.body)),
  );
  app.post(base + "/:bookId/transitions", async (req, res) =>
    res.json(await books.transition(req.params.bookId, req.body)),
  );
  app.get("/api/internal/library", async (_req, res) =>
    res.json(await library.list()),
  );
  app.post("/api/internal/library", async (req, res) =>
    res.status(201).json(await library.create(req.body)),
  );
  app.get("/api/internal/assets", async (_req, res) =>
    res.json(await library.assets()),
  );
  app.use((_req, _res, next) =>
    next(new AppError(404, "NOT_FOUND", "Recurso não encontrado.")),
  );
  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError)
      return res.status(422).json({
        error: {
          code: "INVALID_INPUT",
          message: "Confira os dados informados.",
          fields: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
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
