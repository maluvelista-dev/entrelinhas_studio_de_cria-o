import { randomUUID } from 'node:crypto';
import { templateSchema } from '@studio/schemas/motion';
import { characterSchema } from '@studio/schemas/character';
import { transaction } from '../../infrastructure/database/pool.js';
import { findBook } from '../books/repository.js';
import { assertEditable } from '../books/rules.js';
import { AppError } from '../../errors.js';
export function validateTemplate(raw) {
  const value = templateSchema.parse(raw), motion = value.definition;
  const first = motion.transforms || motion.keyframes[0].transforms;
  const parts = motion.skeleton.map(part => { const transform = first.find(t => t.id === part.id); if (!transform) throw new AppError(422, 'INVALID_MOTION', 'Pose incompleta.'); return { id: part.id, parentId: part.parentId, assetId: null, pivot: part.pivot, position: { x: transform.x, y: transform.y }, rotation: transform.rotation, scaleX: transform.scaleX, scaleY: transform.scaleY, opacity: transform.opacity }; });
  if (parts.length !== first.length) throw new AppError(422, 'INVALID_MOTION', 'Partes incompatíveis.');
  characterSchema.parse({ schemaVersion: 1, id: 'motion', name: 'Motion', width: 1024, height: 1024, perspectives: [{ id: motion.perspective, rootId: parts.find(p => p.parentId === null)?.id, parts, anchors: [] }] });
  return value;
}
export async function insertTemplate(connection, raw) {
  const input = validateTemplate(raw), id = randomUUID();
  if (input.ownerBookId) assertEditable((await findBook(connection, input.ownerBookId, true)).status);
  await connection.execute('INSERT INTO motion_templates (id, name, kind, owner_book_id, definition_json, created_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(3))', [id, input.name, input.kind, input.ownerBookId, JSON.stringify(input.definition)]);
  return { id, ...input };
}
export function templateDto(row) { return { id: row.id, ...templateSchema.parse({ name: row.name, kind: row.kind, ownerBookId: row.owner_book_id, definition: typeof row.definition_json === 'string' ? JSON.parse(row.definition_json) : row.definition_json }) }; }
export function createTemplateService(pool) {
  return {
    async list() { const [rows] = await pool.query('SELECT id, name, kind, owner_book_id, definition_json FROM motion_templates ORDER BY created_at, id'); return rows.map(templateDto); },
    create(raw) { return transaction(pool, connection => insertTemplate(connection, raw)); },
  };
}
