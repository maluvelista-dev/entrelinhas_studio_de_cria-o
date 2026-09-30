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
export function createRigService(pool, storage) {
  return {
    async get(id) { return dto(await find(pool, id)); },
    async update(id, raw) {
      const input = inputSchema.parse(raw);
      return transaction(pool, async connection => {
        const row = await find(connection, id, true);
        if (row.revision !== input.revision) throw new AppError(409, 'REVISION_CONFLICT', 'O personagem foi alterado. Recarregue antes de salvar.');
        if (row.owner_book_id) assertEditable((await findBook(connection, row.owner_book_id, true)).status);
        const assets = new Map();
        for (const view of input.definition.perspectives) for (const part of view.parts) {
          if (Math.abs(part.scaleX) < 0.001 || Math.abs(part.scaleY) < 0.001) throw new AppError(422, 'INVALID_SCALE', 'As escalas das partes não podem ser zero ou menores que 0,001.');
          if (!part.assetId || assets.has(part.assetId)) continue;
          if (!z.uuid().safeParse(part.assetId).success) throw new AppError(422, 'INVALID_ASSET', 'Selecione imagens importadas na Biblioteca.');
          const [[asset]] = await connection.execute('SELECT id, owner_book_id, media_type, width, height, storage_key FROM assets WHERE id = ?', [part.assetId]);
          if (!asset || (asset.owner_book_id && asset.owner_book_id !== row.owner_book_id) || !['image/png', 'image/webp'].includes(asset.media_type) || !asset.width || !asset.height || !await storage.exists(asset.storage_key)) {
            throw new AppError(422, 'INVALID_ASSET', 'Uma imagem está ausente, sem dimensões ou pertence a outro livro.');
          }
          assets.set(asset.id, { kind: 'sprite', width: asset.width, height: asset.height, color: '#ffffff' });
        }
        const definition = { ...input.definition, id: 'character_' + id, name: row.name.slice(0, 120) };
        try {
          for (const view of definition.perspectives) createCharacter(definition, { id: 'validation', perspective: view.id }, assets);
        } catch { throw new AppError(422, 'INVALID_RIG', 'A hierarquia ou suas transformações excedem os limites do personagem.'); }
        await connection.execute('UPDATE library_items SET definition_json = ?, revision = revision + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [JSON.stringify(definition), id]);
        return { id, revision: row.revision + 1, definition };
      });
    },
  };
}
