import { randomUUID } from 'node:crypto';
import { librarySchema } from '@studio/schemas';
import { AppError } from '../../errors.js';
import { transaction } from '../../infrastructure/database/pool.js';
import { findBook } from '../books/repository.js';
import { assertEditable } from '../books/rules.js';

export async function assertAssetReference(connection, storage, assetId, ownerBookId, mediaPrefix) {
  if (!assetId) return;
  const [[asset]] = await connection.execute('SELECT * FROM assets WHERE id = ?', [assetId]);
  if (!asset || (asset.owner_book_id !== null && asset.owner_book_id !== ownerBookId) ||
      (mediaPrefix && !asset.media_type.startsWith(mediaPrefix))) {
    throw new AppError(422, 'INVALID_ASSET', 'Asset inexistente, incompatível ou pertencente a outro livro.');
  }
  if (!await storage.exists(asset.storage_key)) throw new AppError(422, 'MISSING_ASSET', 'Arquivo do asset não encontrado.');
}
export function createLibraryService(pool, storage) {
  return {
    async list() {
      const [rows] = await pool.query(`SELECT id, name, kind, owner_book_id AS ownerBookId,
        asset_id AS assetId, schema_version AS schemaVersion, created_at AS createdAt
        FROM library_items ORDER BY created_at DESC, id`);
      return rows;
    },
    async assets() {
      const [rows] = await pool.query(`SELECT id, original_name AS name, media_type AS mediaType,
        owner_book_id AS ownerBookId FROM assets ORDER BY original_name`);
      return rows;
    },
    async create(raw) {
      const input = librarySchema.parse(raw);
      return transaction(pool, async connection => {
        if (input.ownerBookId) {
          const book = await findBook(connection, input.ownerBookId, true);
          assertEditable(book.status);
        }
        await assertAssetReference(connection, storage, input.assetId, input.ownerBookId,
          input.kind === 'AUDIO' ? 'audio/' : 'image/');
        const id = randomUUID();
        await connection.execute(`INSERT INTO library_items
          (id, kind, name, owner_book_id, asset_id, schema_version, definition_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 1, '{}', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
          [id, input.kind, input.name, input.ownerBookId, input.assetId]);
        return { id, ...input };
      });
    },
  };
}
