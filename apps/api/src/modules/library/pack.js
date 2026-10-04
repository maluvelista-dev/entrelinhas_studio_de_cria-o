import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { characterSchema } from '@studio/schemas/character';
import { poseSchema, animationSchema } from '@studio/schemas/motion';
import { compatible } from '@studio/engine/motion';
import { transaction } from '../../infrastructure/database/pool.js';
import { findBook } from '../books/repository.js';
import { assertEditable } from '../books/rules.js';
import { normalizeImage } from '../assets/image.js';
import { saveRig } from './rig.js';
import { templateDto, validateTemplate, insertTemplate } from './templates.js';
import { AppError } from '../../errors.js';
const LIMIT = 16 * 1024 * 1024;
export const characterPackSchema = z.strictObject({ format: z.literal('book-studio-character'), version: z.literal(1), name: z.string().trim().min(1).max(200), description: z.string().max(5000), definition: characterSchema,
  images: z.array(z.strictObject({ id: z.uuid(), mediaType: z.enum(['image/png','image/webp']), base64: z.string().max(14 * 1024 * 1024) })).max(128),
  templates: z.array(z.strictObject({ name: z.string().trim().min(1).max(200), kind: z.enum(['POSE','ANIMATION']), definition: z.union([poseSchema, animationSchema]) })).max(100),
});
export function createPackService(pool, storage) {
  return {
    async export(id) {
      return transaction(pool, async connection => {
        const [[item]] = await connection.execute('SELECT id, kind, name, description, owner_book_id, definition_json FROM library_items WHERE id = ?', [id]);
        if (!item || item.kind !== 'CHARACTER') throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Personagem não encontrado.');
        const definition = characterSchema.parse(typeof item.definition_json === 'string' ? JSON.parse(item.definition_json) : item.definition_json);
        const ids = [...new Set(definition.perspectives.flatMap(view => view.parts.map(part => part.assetId)).filter(Boolean))];
        if (ids.length > 128) throw new AppError(422, 'PACK_LIMIT', 'O pacote admite até 128 imagens.');
        let size = 0; const images = [];
        for (const assetId of ids) {
          const [[asset]] = await connection.execute('SELECT id, storage_key, media_type, byte_size, owner_book_id, owner_character_id FROM assets WHERE id = ?', [assetId]);
          if (!asset || (asset.owner_character_id && asset.owner_character_id !== item.id) || (asset.owner_book_id && asset.owner_book_id !== item.owner_book_id) || !['image/png','image/webp'].includes(asset.media_type)) throw new AppError(422, 'INVALID_ASSET', 'Imagem indisponível para exportar.');
          size += Number(asset.byte_size); if (size > LIMIT) throw new AppError(422, 'PACK_LIMIT', 'O pacote admite até 16 MB de imagens.');
          const chunks = []; let actual = 0;
          try { for await (const chunk of await storage.openRead(asset.storage_key)) { actual += chunk.length; if (actual > Number(asset.byte_size)) throw new Error('size'); chunks.push(chunk); } }
          catch { throw new AppError(422, 'INVALID_ASSET', 'Não foi possível ler uma imagem do personagem.'); }
          images.push({ id: asset.id, mediaType: asset.media_type, base64: Buffer.concat(chunks).toString('base64') });
        }
        const [rows] = await connection.execute('SELECT id, name, kind, owner_book_id, definition_json FROM motion_templates WHERE owner_book_id IS NULL OR owner_book_id = ?', [item.owner_book_id]);
        const templates = rows.map(templateDto).filter(template => compatible(definition, template.definition)).map(({ name, kind, definition }) => ({ name, kind, definition }));
        const pack = characterPackSchema.parse({ format: 'book-studio-character', version: 1, name: item.name, description: item.description, definition, images, templates });
        if (Buffer.byteLength(JSON.stringify(pack)) > 25 * 1024 * 1024) throw new AppError(422, 'PACK_LIMIT', 'Pacote completo excede 25 MB.');
        return pack;
      });
    },
    async import(raw, file) {
      const { ownerBookId } = z.strictObject({ ownerBookId: z.preprocess(value => value === '' || value === undefined ? null : value, z.uuid().nullable()) }).parse(raw);
      if (!file || !file.originalname.toLowerCase().endsWith('.character.json')) throw new AppError(422, 'INVALID_PACK', 'Selecione um arquivo .character.json.');
      let data; try { data = JSON.parse(file.buffer.toString('utf8')); } catch { throw new AppError(422, 'INVALID_PACK', 'Pacote JSON inválido.'); }
      const pack = characterPackSchema.parse(data), referenced = new Set(pack.definition.perspectives.flatMap(view => view.parts.map(part => part.assetId)).filter(Boolean));
      if (referenced.size !== pack.images.length || new Set(pack.images.map(image => image.id)).size !== pack.images.length || pack.images.some(image => !referenced.has(image.id))) throw new AppError(422, 'INVALID_PACK', 'Imagens ausentes, duplicadas ou não utilizadas no pacote.');
      for (const template of pack.templates) { validateTemplate({ ...template, ownerBookId }); if (!compatible(pack.definition, template.definition)) throw new AppError(422, 'INVALID_PACK', 'Pose ou animação incompatível no pacote.'); }
      let bytes = 0; const prepared = [];
      for (const image of pack.images) {
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64)) throw new AppError(422, 'INVALID_PACK', 'Imagem codificada incorretamente.');
        const buffer = Buffer.from(image.base64, 'base64');
        if (buffer.toString('base64') !== image.base64) throw new AppError(422, 'INVALID_PACK', 'Imagem codificada incorretamente.');
        bytes += buffer.length; if (bytes > LIMIT) throw new AppError(413, 'PACK_LIMIT', 'O pacote admite até 16 MB de imagens.');
        prepared.push({ oldId: image.id, id: randomUUID(), image: await normalizeImage({ buffer, originalname: 'image.' + image.mediaType.split('/')[1], mimetype: image.mediaType }) });
      }
      if (prepared.reduce((sum, value) => sum + value.image.bytes.length, 0) > LIMIT) throw new AppError(413, 'PACK_LIMIT', 'Imagens processadas excedem 16 MB.');
      const id = randomUUID(), written = [];
      try {
        for (const asset of prepared) { asset.key = 'characters/' + id + '/' + asset.id + '.' + asset.image.extension; asset.metadata = await storage.put(asset.key, asset.image.bytes); written.push(asset.key); }
        return await transaction(pool, async connection => {
          if (ownerBookId) assertEditable((await findBook(connection, ownerBookId, true)).status);
          await connection.execute("INSERT INTO library_items (id, kind, name, description, owner_book_id, asset_id, schema_version, definition_json, created_at, updated_at) VALUES (?, 'CHARACTER', ?, ?, ?, NULL, 1, '{}', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))", [id, pack.name, pack.description, ownerBookId]);
          const definition = structuredClone(pack.definition);
          for (const asset of prepared) {
            const view = definition.perspectives.find(view => view.parts.some(part => part.assetId === asset.oldId)), part = view.parts.find(part => part.assetId === asset.oldId);
            await connection.execute('INSERT INTO assets (id, owner_book_id, owner_character_id, perspective_id, part_id, storage_key, original_name, media_type, byte_size, checksum, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))', [asset.id, ownerBookId, id, view.id, part.id, asset.key, view.id + ' / ' + part.id, asset.image.mediaType, asset.metadata.byteSize, asset.metadata.checksum, asset.image.width, asset.image.height]);
            for (const perspective of definition.perspectives) for (const part of perspective.parts) if (part.assetId === asset.oldId) part.assetId = asset.id;
          }
          await saveRig(connection, storage, { id, name: pack.name, owner_book_id: ownerBookId, revision: 1 }, { definition });
          for (const template of pack.templates) await insertTemplate(connection, { ...template, ownerBookId });
          return { id, name: pack.name, description: pack.description, kind: 'CHARACTER', ownerBookId, assetId: null, schemaVersion: 1, revision: 2 };
        });
      } catch (error) {
        try { const [[existing]] = await pool.execute('SELECT id FROM library_items WHERE id = ?', [id]); if (!existing) for (const key of written) await storage.delete(key); }
        catch { console.error('PACK_RECONCILIATION_REQUIRED', id); }
        throw error;
      }
    },
  };
}
