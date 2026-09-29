import { randomUUID } from 'node:crypto';
import { createBookSchema, updateBookSchema, createPageSchema, reorderSchema, transitionSchema } from '@studio/schemas';
import { transaction } from '../../infrastructure/database/pool.js';
import { assertEditable, assertRevision, assertTransition, assertPageOrder } from './rules.js';
import { findBook, detail, insertBook, bumpRevision, writePage } from './repository.js';
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
          age_min = ?, age_max = ?, cover_asset_id = ? WHERE id = ?`,
          [input.title, input.description, input.ageRange?.min ?? null, input.ageRange?.max ?? null, input.cover, book.version_id]);
      });
    },
    savePage(id, raw, pageId) {
      const input = createPageSchema.parse(raw);
      return mutate(id, input.revision, (connection, book) => writePage(connection, book, input.document, pageId));
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
        await connection.execute('UPDATE book_versions SET status = ? WHERE id = ?', [input.status, book.version_id]);
        await connection.execute(`INSERT INTO book_status_history
          (id, book_version_id, from_status, to_status, actor_id, comment, created_at)
          VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))`,
          [randomUUID(), book.version_id, book.status, input.status, actorId, input.comment || null]);
      }, false);
    },
  };
}
