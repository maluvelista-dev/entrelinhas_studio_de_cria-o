import { randomUUID } from 'node:crypto';
import { createLibrarySchema, updateLibrarySchema } from '@studio/schemas/library';
import { revisionInputSchema } from '@studio/schemas';
import { AppError } from '../../errors.js';
import { transaction } from '../../infrastructure/database/pool.js';
import { findBook } from '../books/repository.js';
import { assertEditable, assertRevision } from '../books/rules.js';

export async function assertAssetReference(connection, storage, assetId, ownerBookId, mediaPrefix) {
  if (!assetId) return;
  const [[asset]] = await connection.execute('SELECT * FROM assets WHERE id = ?', [assetId]);
  if (!asset || asset.owner_character_id || (asset.owner_book_id !== null && asset.owner_book_id !== ownerBookId) ||
      (mediaPrefix && !asset.media_type.startsWith(mediaPrefix))) {
    throw new AppError(422, 'INVALID_ASSET', 'Asset inexistente, incompatível ou pertencente a outro livro.');
  }
  if (!await storage.exists(asset.storage_key)) throw new AppError(422, 'MISSING_ASSET', 'Arquivo do asset não encontrado.');
}
const fields = 'id, name, kind, owner_book_id AS ownerBookId, asset_id AS assetId, schema_version AS schemaVersion, description, revision';
async function findItem(connection, id, lock = false) {
  const [[item]] = await connection.execute('SELECT ' + fields + ' FROM library_items WHERE id = ?' + (lock ? ' FOR UPDATE' : ''), [id]);
  if (!item) throw new AppError(404, 'LIBRARY_NOT_FOUND', 'Elemento não encontrado.');
  return item;
}
export function createLibraryService(pool, storage) {
  return {
    async list() {
      const [rows] = await pool.query(`SELECT id, name, kind, owner_book_id AS ownerBookId,
        asset_id AS assetId, schema_version AS schemaVersion, description, revision, created_at AS createdAt
        FROM library_items ORDER BY created_at DESC, id`);
      return rows;
    },
    get(id) { return findItem(pool, id); },
    async remove(id, raw) {
      const input = revisionInputSchema.parse(raw);
      const files = await transaction(pool, async connection => {
        const item = await findItem(connection, id, true);
        assertRevision(item.revision, input.revision);
        if (!['CHARACTER', 'BACKGROUND', 'OBJECT'].includes(item.kind)) throw new AppError(422, 'INVALID_LIBRARY_KIND', 'A exclusão está disponível para personagens, cenários e objetos.');
        if (item.ownerBookId) assertEditable((await findBook(connection, item.ownerBookId, true)).status);
        // Scene saves acquire the same item lock before persisting references.
        // A current locking read also sees a save committed while we waited.
        const [pages] = await connection.execute("SELECT id FROM pages WHERE JSON_SEARCH(scene_json, 'one', ?) IS NOT NULL LIMIT 1 FOR UPDATE", [id]);
        if (pages.length) throw new AppError(409, 'LIBRARY_IN_USE', 'Este elemento está em uso em uma página. Remova suas instâncias e salve as páginas antes de excluir o cadastro.');
        const [ownedFiles] = await connection.execute('SELECT id, storage_key FROM assets WHERE owner_character_id = ? FOR UPDATE', [id]);
        await connection.execute('DELETE FROM character_snapshots WHERE character_id = ?', [id]);
        await connection.execute('DELETE FROM scene_item_snapshots WHERE library_item_id = ?', [id]);
        await connection.execute('UPDATE library_items SET asset_id = NULL WHERE id = ?', [id]);
        await connection.execute('DELETE FROM assets WHERE owner_character_id = ?', [id]);
        await connection.execute('DELETE FROM library_items WHERE id = ?', [id]);
        return ownedFiles;
      });
      // Only private images owned by this character are removed. Shared assets
      // remain available; storage cleanup never precedes the database commit.
      for (const file of files) {
        try { await storage.delete(file.storage_key); }
        catch { console.error('ASSET_DELETE_RECONCILIATION_REQUIRED', file.id); }
      }
      return { deleted: true };
    },
    update(id, raw) {
      const input = updateLibrarySchema.parse(raw);
      return transaction(pool, async connection => {
        const item = await findItem(connection, id, true);
        if (item.revision !== input.revision) throw new AppError(409, 'REVISION_CONFLICT', 'Este elemento foi alterado. Recarregue antes de salvar novamente.');
        if (item.ownerBookId) {
          const book = await findBook(connection, item.ownerBookId, true);
          assertEditable(book.status);
        }
        await assertAssetReference(connection, storage, input.assetId, item.ownerBookId, item.kind === 'AUDIO' ? 'audio/' : 'image/');
        await connection.execute('UPDATE library_items SET name = ?, description = ?, asset_id = ?, revision = revision + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?',
          [input.name, input.description, input.assetId, id]);
        return findItem(connection, id);
      });
    },
    async assets() {
      const [rows] = await pool.query(`SELECT id, original_name AS name, media_type AS mediaType,
        owner_book_id AS ownerBookId, width, height, byte_size AS byteSize FROM assets WHERE owner_character_id IS NULL ORDER BY original_name`);
      return rows;
    },
    async create(raw) {
      const input = createLibrarySchema.parse(raw);
      return transaction(pool, async connection => {
        if (input.ownerBookId) {
          const book = await findBook(connection, input.ownerBookId, true);
          assertEditable(book.status);
        }
        await assertAssetReference(connection, storage, input.assetId, input.ownerBookId,
          input.kind === 'AUDIO' ? 'audio/' : 'image/');
        const id = randomUUID();
        await connection.execute(`INSERT INTO library_items
          (id, kind, name, owner_book_id, asset_id, schema_version, definition_json, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, '{}', ?, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
          [id, input.kind, input.name, input.ownerBookId, input.assetId, input.description]);
        return { id, ...input, revision: 1 };
      });
    },
  };
}
