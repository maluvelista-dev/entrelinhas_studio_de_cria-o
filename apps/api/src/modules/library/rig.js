import { randomUUID } from 'node:crypto';
import { normalizeImage } from '../assets/image.js';
import { z } from 'zod';
import { characterSchema } from '@studio/schemas/character';
import { revisionSchema } from '@studio/schemas';
import { createCharacter } from '@studio/engine';
import { AppError } from '../../errors.js';
import { transaction } from '../../infrastructure/database/pool.js';
import { findBook } from '../books/repository.js';
import { assertEditable } from '../books/rules.js';
const inputSchema = z.strictObject({ revision: revisionSchema, definition: characterSchema });
async function find(connection, id, lock = false) {
  const [[row]] = await connection.execute('SELECT id, name, kind, owner_book_id, revision, definition_json FROM library_items WHERE id = ?' + (lock ? ' FOR UPDATE' : ''), [id]);
  if (!row || row.kind !== 'CHARACTER') throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Personagem não encontrado.');
  return row;
}
function dto(row) {
  const definition = typeof row.definition_json === 'string' ? JSON.parse(row.definition_json) : row.definition_json;
  return { id: row.id, revision: row.revision, definition: Object.keys(definition).length ? definition : null };
}
export async function saveRig(connection, storage, row, input) {
  const id = row.id;
        const assets = new Map();
        for (const view of input.definition.perspectives) for (const part of view.parts) {
          if (Math.abs(part.scaleX) < 0.001 || Math.abs(part.scaleY) < 0.001) throw new AppError(422, 'INVALID_SCALE', 'As escalas das partes não podem ser zero ou menores que 0,001.');
          if (!part.assetId || assets.has(part.assetId)) continue;
          if (!z.uuid().safeParse(part.assetId).success) throw new AppError(422, 'INVALID_ASSET', 'Selecione imagens importadas na Biblioteca.');
          const [[asset]] = await connection.execute('SELECT id, owner_book_id, owner_character_id, media_type, width, height, storage_key FROM assets WHERE id = ?', [part.assetId]);
          if (!asset || (asset.owner_character_id && asset.owner_character_id !== id) || (asset.owner_book_id && asset.owner_book_id !== row.owner_book_id) || !['image/png', 'image/webp'].includes(asset.media_type) || !asset.width || !asset.height || !await storage.exists(asset.storage_key)) {
            throw new AppError(422, 'INVALID_ASSET', 'Uma imagem está ausente, sem dimensões ou pertence a outro livro.');
          }
          assets.set(asset.id, { kind: 'sprite', width: asset.width, height: asset.height, color: '#ffffff' });
        }
        const definition = { ...input.definition, id: 'character_' + id, name: row.name.slice(0, 120) };
        try {
          for (const view of definition.perspectives) createCharacter(definition, { id: 'validation', perspective: view.id }, assets);
        } catch { throw new AppError(422, 'INVALID_RIG', 'A hierarquia ou suas transformações excedem os limites do personagem.'); }
        await connection.execute('UPDATE library_items SET definition_json = ?, revision = revision + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [JSON.stringify(definition), id]);
        return { id, revision: row.revision + 1, definition, assets: await images(connection, id) };
}
async function images(connection, id) {
  const [rows] = await connection.execute('SELECT id, original_name AS name, media_type AS mediaType, width, height, byte_size AS byteSize, owner_book_id AS ownerBookId, owner_character_id AS ownerCharacterId, perspective_id AS perspectiveId, part_id AS partId FROM assets WHERE owner_character_id = ? ORDER BY created_at, id', [id]);
  return rows;
}
async function editable(connection, id, revision) {
  const row = await find(connection, id, true);
  if (row.revision !== revision) throw new AppError(409, 'REVISION_CONFLICT', 'O personagem foi alterado. Recarregue antes de salvar.');
  if (row.owner_book_id) assertEditable((await findBook(connection, row.owner_book_id, true)).status);
  return row;
}
export function createRigService(pool, storage) {
  return {
    async get(id) { return transaction(pool, async connection => ({ ...dto(await find(connection, id)), assets: await images(connection, id) })); },
    async update(id, raw) {
      const input = inputSchema.parse(raw);
      return transaction(pool, async connection => saveRig(connection, storage, await editable(connection, id, input.revision), input));
    },
    async upload(id, perspectiveId, partId, raw, file) {
      const fields = z.strictObject({ revision: z.string().regex(/^[1-9][0-9]*$/), definition: z.string().max(256 * 1024) }).parse(raw);
      let json;
      try { json = JSON.parse(fields.definition); } catch { throw new AppError(400, 'INVALID_JSON', 'Estrutura JSON inválida.'); }
      const input = inputSchema.parse({ revision: Number(fields.revision), definition: json });
      const part = input.definition.perspectives.find(view => view.id === perspectiveId)?.parts.find(part => part.id === partId);
      if (!part) throw new AppError(422, 'INVALID_PART', 'Selecione uma perspectiva e uma parte existentes na estrutura.');
      const image = await normalizeImage(file);
      const assetId = randomUUID(), key = 'characters/' + id + '/' + assetId + '.' + image.extension;
      const metadata = await storage.put(key, image.bytes);
      try {
        return await transaction(pool, async connection => {
          const row = await editable(connection, id, input.revision);
          await connection.execute('INSERT INTO assets (id, owner_book_id, owner_character_id, perspective_id, part_id, storage_key, original_name, media_type, byte_size, checksum, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))',
            [assetId, row.owner_book_id, id, perspectiveId, partId, key, perspectiveId + ' / ' + partId, image.mediaType, metadata.byteSize, metadata.checksum, image.width, image.height]);
          part.assetId = assetId;
          return saveRig(connection, storage, row, input);
        });
      } catch (error) {
        try { const [[existing]] = await pool.execute('SELECT id FROM assets WHERE id = ?', [assetId]); if (!existing) await storage.delete(key); }
        catch { console.error('ASSET_RECONCILIATION_REQUIRED', assetId); }
        throw error;
      }
    },
  };
}
