import { z } from 'zod';
const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const finite = z.number().finite().min(-100000).max(100000);
const point = z.strictObject({ x: finite, y: finite });
const pivot = z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
export const characterInstanceSchema = z.strictObject({
  id, perspective: id,
  transform: z.strictObject({ x: finite.default(0), y: finite.default(0),
    rotation: finite.default(0), scaleX: finite.default(1), scaleY: finite.default(1),
  }).default({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }),
});
export const characterSchema = z.strictObject({
  schemaVersion: z.literal(1), id, name: z.string().trim().min(1).max(120),
  width: z.number().positive().max(4096), height: z.number().positive().max(4096),
  perspectives: z.array(z.strictObject({
    id, rootId: id,
    parts: z.array(z.strictObject({
      id, parentId: id.nullable(), assetId: z.union([id, z.uuid()]).nullable(), position: point,
      rotation: finite.default(0), scaleX: finite.default(1), scaleY: finite.default(1),
      pivot: pivot.default({ x: 0, y: 0 }), opacity: z.number().min(0).max(1).default(1),
      visible: z.boolean().default(true), zIndex: z.number().int().min(-1000).max(1000).default(0),
    })).min(1).max(128),
    anchors: z.array(z.strictObject({ name: id, partId: id, position: point,
      coordinateSpace: z.enum(['local', 'normalized']),
    })).max(128).default([]),
  })).min(1).max(8),
}).superRefine((definition, context) => {
  const issue = message => context.addIssue({ code: 'custom', message });
  const views = new Set();
  for (const view of definition.perspectives) {
    if (views.has(view.id)) issue('Perspectiva duplicada.');
    views.add(view.id);
    const parts = new Map();
    for (const part of view.parts) {
      if (parts.has(part.id)) issue('Parte duplicada.');
      parts.set(part.id, part);
    }
    if (!parts.has(view.rootId) || parts.get(view.rootId).parentId !== null) issue('Root inválido.');
    for (const part of view.parts) {
      if (part.parentId === null && part.id !== view.rootId) issue('Parte desconectada do root.');
      let current = part; const seen = new Set();
      while (current) {
        if (seen.has(current.id)) { issue('Ciclo entre partes.'); break; }
        seen.add(current.id);
        if (current.parentId === null) break;
        if (!parts.has(current.parentId)) { issue('Parent inexistente.'); break; }
        current = parts.get(current.parentId);
      }
    }
    const anchors = new Set();
    for (const anchor of view.anchors) {
      if (anchors.has(anchor.name)) issue('Anchor duplicado.');
      anchors.add(anchor.name);
      if (!parts.has(anchor.partId)) issue('Parte do anchor inexistente.');
    }
  }
});
