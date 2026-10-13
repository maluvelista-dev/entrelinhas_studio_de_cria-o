import { createPageSchema } from '@studio/schemas/page';
import { resolvePageScene } from './scene.js';
import { randomUUID } from 'node:crypto';
import { createBookSchema, updateBookSchema, reorderSchema, transitionSchema, revisionInputSchema } from '@studio/schemas';
import { AppError } from '../../errors.js';
import { transaction } from '../../infrastructure/database/pool.js';
import { assertEditable, assertRevision, assertTransition, assertPageOrder } from './rules.js';
import { findBook, detail, insertBook, bumpRevision, writePage, pageDto } from './repository.js';
import { assertAssetReference } from '../library/service.js';

export function createBookService(pool, storage) {
  async function mutate(id, revision, action, editable = true) {
    return transaction(pool, async connection => {
      const book = await findBook(connection, id, true);
      assertRevision(book.revision, revision);
      if (editable) assertEditable(book.status);
      await action(connection, book);
      await bumpRevision(connection, book);
      return detail(connection, id);
    });
  }
  return {
    async list() {
      const [rows] = await pool.query(`SELECT b.id, b.slug, v.title, v.status, v.revision,
        v.version, v.cover_asset_id AS cover, b.updated_at AS updatedAt,
        (SELECT COUNT(*) FROM pages p WHERE p.book_version_id = v.id) AS pageCount
        FROM books b JOIN book_versions v ON v.id = b.working_version_id
        ORDER BY b.updated_at DESC, b.id`);
      return rows;
    },
    get(id) { return transaction(pool, connection => detail(connection, id)); },
    create(raw) {
      const input = createBookSchema.parse(raw);
      return transaction(pool, async connection => {
        await assertAssetReference(connection, storage, input.cover, null, 'image/');
        const id = await insertBook(connection, input);
        return detail(connection, id);
      });
    },
    update(id, raw) {
      const input = updateBookSchema.parse(raw);
      return mutate(id, input.revision, async (connection, book) => {
        await assertAssetReference(connection, storage, input.cover, id, 'image/');
        await connection.execute(`UPDATE book_versions SET title = ?, description = ?,
          age_min = ?, age_max = ?, cover_asset_id = ?, editorial_category = ? WHERE id = ?`,
          [input.title, input.description, input.ageRange?.min ?? null, input.ageRange?.max ?? null, input.cover, input.editorialCategory, book.version_id]);
      });
    },
    savePage(id, raw, pageId) {
      const input = createPageSchema.parse(raw);
      return mutate(id, input.revision, async (connection, book) => {
        if (input.document.schemaVersion >= 2) await resolvePageScene(connection, storage, input.document.scene, id, true);
        return writePage(connection, book, input.document, pageId);
      });
    },
    deletePage(id, pageId, raw) {
      const input = revisionInputSchema.parse(raw);
      return mutate(id, input.revision, async (connection, book) => {
        const [result] = await connection.execute('DELETE FROM pages WHERE id = ? AND book_version_id = ?', [pageId, book.version_id]);
        if (!result.affectedRows) throw new AppError(404, 'PAGE_NOT_FOUND', 'Página não encontrada neste livro.');
        const [pages] = await connection.execute('SELECT id FROM pages WHERE book_version_id = ? ORDER BY position FOR UPDATE', [book.version_id]);
        for (const [index, page] of pages.entries()) await connection.execute('UPDATE pages SET position = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [index + 1, page.id]);
      });
    },
    duplicatePage(id, pageId, raw) {
      const input = revisionInputSchema.parse(raw);
      return mutate(id, input.revision, async (connection, book) => {
        const [[page]] = await connection.execute('SELECT * FROM pages WHERE id = ? AND book_version_id = ? FOR UPDATE', [pageId, book.version_id]);
        if (!page) throw new AppError(404, 'PAGE_NOT_FOUND', 'Página não encontrada neste livro.');
        const { id: _id, position: _position, ...document } = pageDto(page);
        if (document.schemaVersion >= 2) await resolvePageScene(connection, storage, document.scene, id, true);
        await writePage(connection, book, document);
      });
    },
    remove(id, raw) {
      const input = revisionInputSchema.parse(raw);
      return transaction(pool, async connection => {
        const book = await findBook(connection, id, true);
        assertRevision(book.revision, input.revision); assertEditable(book.status);
        const [[references]] = await connection.execute(`SELECT
          (SELECT COUNT(*) FROM assets WHERE owner_book_id = ?) +
          (SELECT COUNT(*) FROM library_items WHERE owner_book_id = ?) +
          (SELECT COUNT(*) FROM motion_templates WHERE owner_book_id = ?) AS total`, [id, id, id]);
        if (references.total || book.published_version) throw new AppError(409, 'BOOK_IN_USE', 'Este livro possui arquivos, elementos exclusivos, animações ou publicação. A exclusão está bloqueada para preservar esse conteúdo.');
        await connection.execute('UPDATE books SET working_version_id = NULL, published_version_id = NULL WHERE id = ?', [id]);
        await connection.execute('DELETE p FROM pages p JOIN book_versions v ON v.id = p.book_version_id WHERE v.book_id = ?', [id]);
        await connection.execute('DELETE h FROM book_status_history h JOIN book_versions v ON v.id = h.book_version_id WHERE v.book_id = ?', [id]);
        await connection.execute('DELETE FROM book_versions WHERE book_id = ?', [id]);
        await connection.execute('DELETE FROM books WHERE id = ?', [id]);
        return { deleted: true };
      });
    },
    preview(id, raw) {
      const input = createPageSchema.parse(raw);
      return transaction(pool, async connection => {
        const book = await findBook(connection, id); assertRevision(book.revision, input.revision);
        if (input.document.schemaVersion < 2) return { width: 1024, height: 768, characters: [] };
        return resolvePageScene(connection, storage, input.document.scene, id);
      });
    },
    reorder(id, raw) {
      const input = reorderSchema.parse(raw);
      return mutate(id, input.revision, async (connection, book) => {
        const [pages] = await connection.execute('SELECT id, position FROM pages WHERE book_version_id = ? FOR UPDATE', [book.version_id]);
        assertPageOrder(pages.map(page => page.id), input.pageIds);
        const offset = Math.max(0, ...pages.map(page => page.position)) + 1;
        await connection.execute('UPDATE pages SET position = position + ? WHERE book_version_id = ?', [offset, book.version_id]);
        for (const [index, pageId] of input.pageIds.entries()) {
          await connection.execute('UPDATE pages SET position = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [index + 1, pageId]);
        }
      });
    },
    transition(id, raw, actorId) {
      const input = transitionSchema.parse(raw);
      return mutate(id, input.revision, async (connection, book) => {
        assertTransition(book.status, input.status);
        if (input.status === 'READY_TO_PUBLISH') {
          const [pages] = await connection.execute('SELECT * FROM pages WHERE book_version_id = ? ORDER BY position FOR UPDATE', [book.version_id]);
          if (!pages.length) throw new AppError(409, 'EMPTY_BOOK', 'Adicione pelo menos uma página antes de aprovar o livro.');
          await assertAssetReference(connection, storage, book.cover_asset_id, id, 'image/');
          for (const row of pages) {
            const page = pageDto(row);
            if (page.schemaVersion >= 2) await resolvePageScene(connection, storage, page.scene, id);
          }
        }
        await connection.execute('UPDATE book_versions SET status = ? WHERE id = ?', [input.status, book.version_id]);
        await connection.execute(`INSERT INTO book_status_history
          (id, book_version_id, from_status, to_status, actor_id, comment, created_at)
          VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))`,
          [randomUUID(), book.version_id, book.status, input.status, actorId, input.comment || null]);
      }, false);
    },
  };
}
