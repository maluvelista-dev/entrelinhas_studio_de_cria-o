import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { transaction } from '../../infrastructure/database/pool.js';
import { findBook } from '../books/repository.js';
import { assertEditable } from '../books/rules.js';
import { AppError } from '../../errors.js';
import { normalizeImage } from './image.js';
const inputSchema = z.strictObject({ name: z.string().trim().min(1).max(200).refine(value => [...value].every(char => char.codePointAt(0) >= 32 && char.codePointAt(0) !== 127)),
  kind: z.enum(['CHARACTER', 'OBJECT', 'BACKGROUND']),
  ownerBookId: z.preprocess(value => value === '' || value === undefined ? null : value, z.uuid().nullable()),
});
export function createAssetService(pool, storage) {
  return {
    async import(raw, file) {
      const input = inputSchema.parse(raw);
      const image = await normalizeImage(file);
      const id = randomUUID(), key = 'illustrations/' + id + '.' + image.extension;
      const metadata = await storage.put(key, image.bytes);
      try {
        await transaction(pool, async connection => {
          if (input.ownerBookId) {
            const book = await findBook(connection, input.ownerBookId, true);
            assertEditable(book.status);
          }
          await connection.execute(`INSERT INTO assets
            (id, owner_book_id, storage_key, original_name, media_type, byte_size, checksum, width, height, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))`,
          [id, input.ownerBookId, key, input.name, image.mediaType, metadata.byteSize, metadata.checksum, image.width, image.height]);
          await connection.execute(`INSERT INTO library_items
            (id, kind, name, owner_book_id, asset_id, schema_version, definition_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, '{}', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))`,
          [randomUUID(), input.kind, input.name, input.ownerBookId, id]);
        });
      } catch (error) {
        // A commit acknowledgement can fail after the server committed: verify before compensating.
        try {
          const [[existing]] = await pool.execute('SELECT id FROM assets WHERE id = ?', [id]);
          if (!existing) await storage.delete(key);
        } catch { console.error('ASSET_RECONCILIATION_REQUIRED', id); }
        throw error;
      }
      return { id, name: input.name, ownerBookId: input.ownerBookId, mediaType: image.mediaType,
        width: image.width, height: image.height, byteSize: metadata.byteSize };
    },
    async content(id) {
      const [[asset]] = await pool.execute('SELECT storage_key, media_type FROM assets WHERE id = ?', [id]);
      if (!asset || !['image/png', 'image/webp'].includes(asset.media_type)) throw new AppError(404, 'ASSET_NOT_FOUND', 'Imagem não encontrada.');
      try { return { mediaType: asset.media_type, stream: await storage.openRead(asset.storage_key) }; }
      catch (error) {
        if (error.code === 'ENOENT') throw new AppError(404, 'ASSET_NOT_FOUND', 'Arquivo da imagem não encontrado.');
        throw error;
      }
    },
  };
}
