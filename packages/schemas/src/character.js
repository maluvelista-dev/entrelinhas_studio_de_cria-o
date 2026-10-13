import { z } from 'zod';
import { poseSchema, animationSchema } from './motion.js';
import { actionTypes } from './action-catalog.js';
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
    id, name: z.string().trim().min(1).max(120).optional(), rootId: id,
    parts: z.array(z.strictObject({
      id, name: z.string().trim().min(1).max(120).optional(), parentId: id.nullable(), assetId: z.union([id, z.uuid()]).nullable(), position: point,
      rotation: finite.default(0), scaleX: finite.default(1), scaleY: finite.default(1),
      pivot: pivot.default({ x: 0, y: 0 }), opacity: z.number().min(0).max(1).default(1),
      visible: z.boolean().default(true), zIndex: z.number().int().min(-1000).max(1000).default(0),
    })).min(1).max(128),
    behaviors: z.array(z.strictObject({
      action: z.enum(actionTypes), aimPartId:id.optional(), motion: z.union([poseSchema,animationSchema]).nullable(),
      images: z.array(z.strictObject({partId:id,sourcePartId:id})).max(16),
    })).max(114).optional(),
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
    const behaviors=new Set();
    for(const binding of view.behaviors || []) {
      if(binding.aimPartId && !parts.has(binding.aimPartId)) issue('Parte de orientação inexistente.');
      if(behaviors.has(binding.action)) issue('Ação mapeada duas vezes.');behaviors.add(binding.action);
      if(!binding.motion && !binding.images.length) issue('Associe uma pose, animação ou imagem alternativa.');
      if(new Set(binding.images.map(i=>i.partId)).size!==binding.images.length) issue('Imagem alternativa duplicada.');
      for(const image of binding.images) if(!parts.get(image.partId)?.assetId || !parts.get(image.sourcePartId)?.assetId) issue('Imagem alternativa exige partes com imagens.');
      if(binding.motion) {
        const m=binding.motion, skeleton=view.parts.map(p=>({id:p.id,parentId:p.parentId,pivot:p.pivot})).sort((a,b)=>a.id.localeCompare(b.id));
        if(m.perspective!==view.id || JSON.stringify(skeleton)!==JSON.stringify([...m.skeleton].sort((a,b)=>a.id.localeCompare(b.id)))) issue('Movimento incompatível com a estrutura.');
        const frames=m.keyframes || [{transforms:m.transforms}];
        for(const frame of frames) if(frame.transforms.length!==parts.size || frame.transforms.some(t=>!parts.has(t.id))) issue('Movimento incompleto.');
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
