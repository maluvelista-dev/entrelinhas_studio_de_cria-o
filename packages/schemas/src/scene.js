import { z } from 'zod';
const number = z.number().finite().min(-100000).max(100000);
const point = z.strictObject({ x: number, y: number });
const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,199}$/);
export const sceneSchema = z.strictObject({
  schemaVersion: z.literal(1),
  width: z.number().finite().positive().max(4096),
  height: z.number().finite().positive().max(4096),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  entities: z.array(z.strictObject({
    id, parentId: id.nullable().default(null),
    kind: z.enum(['rectangle', 'ellipse', 'group', 'sprite']),
    assetId: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/).optional(),
    width: z.number().finite().positive().max(4096),
    height: z.number().finite().positive().max(4096),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    position: point,
    coordinateSpace: z.enum(['local', 'normalized']).default('local'),
    offset: point.default({ x: 0, y: 0 }),
    rotation: number.default(0),
    scaleX: number.default(1), scaleY: number.default(1),
    pivot: z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).default({ x: 0, y: 0 }),
    opacity: z.number().min(0).max(1).default(1),
    visible: z.boolean().default(true), zIndex: z.number().int().min(-1000).max(1000).default(0),
  })).max(500),
}).superRefine((scene, context) => {
  const map = new Map();
  for (const entity of scene.entities) {
    if (map.has(entity.id)) context.addIssue({ code: 'custom', message: 'ID duplicado.' });
    if ((entity.kind === 'sprite') !== (entity.assetId !== undefined)) context.addIssue({ code: 'custom', message: 'Referência de sprite inválida.' });
    map.set(entity.id, entity);
  }
  for (const entity of scene.entities) {
    const seen = new Set([entity.id]);
    let parentId = entity.parentId;
    while (parentId !== null) {
      if (!map.has(parentId)) { context.addIssue({ code: 'custom', message: 'Parent inexistente.' }); break; }
      if (seen.has(parentId)) { context.addIssue({ code: 'custom', message: 'Ciclo na hierarquia.' }); break; }
      seen.add(parentId); parentId = map.get(parentId).parentId;
    }
  }
});
