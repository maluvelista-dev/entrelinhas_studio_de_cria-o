import { z } from 'zod';
export const logicalId = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const number = z.number().finite().min(-100000).max(100000);
export const pointSchema = z.strictObject({ x: number, y: number });
export const targetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('point'), point: pointSchema }),
  z.strictObject({ kind: z.literal('anchor'), instanceId: logicalId, anchor: logicalId }),
]);
const moving = { actorId: logicalId, sourceAnchor: logicalId.nullable(), target: targetSchema, duration: z.number().min(0.1).max(30) };
export const actionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('movement.moveTo'), ...moving }),
  z.strictObject({ type: z.literal('object.carry'), ...moving, objectId: logicalId }),
  z.strictObject({ type: z.literal('object.grab'), actorId: logicalId, objectId: logicalId, anchor: logicalId }),
  z.strictObject({ type: z.literal('object.release'), actorId: logicalId, objectId: logicalId }),
]);
export const programSchema = z.strictObject({ schemaVersion: z.literal(1),
  trigger: z.discriminatedUnion('type', [z.strictObject({ type: z.literal('manual') }), z.strictObject({ type: z.literal('input.tap'), instanceId: logicalId })]),
  actions: z.array(actionSchema).max(32),
}).superRefine((program, ctx) => { if (program.actions.reduce((sum, a) => sum + (a.duration || 0), 0) > 120) ctx.addIssue({ code: 'custom', message: 'A sequência admite até 120 segundos.' }); });
export const emptyProgram = () => ({ schemaVersion: 1, trigger: { type: 'manual' }, actions: [] });
export const sceneObjectSchema = z.strictObject({ id: logicalId, libraryId: z.uuid(), revision: z.number().int().positive(),
  x: number, y: number, rotation: number, scaleX: number.refine(n => Math.abs(n) >= 0.001), scaleY: number.refine(n => Math.abs(n) >= 0.001),
  anchors: z.array(z.strictObject({ name: logicalId, position: pointSchema })).max(32),
}).superRefine((object, ctx) => { if (new Set(object.anchors.map(a => a.name)).size !== object.anchors.length) ctx.addIssue({ code: 'custom', message: 'Anchor duplicado.' }); });
