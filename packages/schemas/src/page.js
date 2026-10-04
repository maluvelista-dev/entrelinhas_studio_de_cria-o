import { z } from 'zod';
import { pageDocumentSchema as legacy, pageContentSchema, revisionSchema } from './index.js';
const finite = z.number().finite().min(-100000).max(100000);
const scale = finite.refine(value => Math.abs(value) >= 0.001);
export const pageSceneSchema = z.strictObject({ schemaVersion: z.literal(2), width: z.number().int().min(1).max(4096), height: z.number().int().min(1).max(4096),
  characters: z.array(z.strictObject({ id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/), characterId: z.uuid(), rigRevision: revisionSchema,
    perspective: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/), x: finite, y: finite, rotation: finite, scaleX: scale, scaleY: scale,
    poseId: z.uuid().nullable(), animationId: z.uuid().nullable(),
  })).max(8),
}).superRefine((scene, ctx) => { if (new Set(scene.characters.map(c => c.id)).size !== scene.characters.length) ctx.addIssue({ code: 'custom', message: 'Instâncias duplicadas.' }); });
const current = z.strictObject({ schemaVersion: z.literal(2), content: pageContentSchema, scene: pageSceneSchema,
  timeline: z.array(z.never()).max(0), automaticAnimations: z.array(z.never()).max(0), premiumInteractions: z.array(z.never()).max(0) });
export const pageDocumentSchema = z.union([legacy, current]);
export const createPageSchema = z.strictObject({ revision: revisionSchema, document: pageDocumentSchema });
export function editablePage(page) {
  return { schemaVersion: 2, content: page.content, scene: page.scene.schemaVersion === 2 ? page.scene : { schemaVersion: 2, width: 1024, height: 768, characters: [] }, timeline: [], automaticAnimations: [], premiumInteractions: [] };
}
