import { z } from 'zod';
const id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const finite = z.number().finite().min(-100000).max(100000);
const scale = finite.refine(value => Math.abs(value) >= 0.001, 'Escala inválida.');
export const transformsSchema = z.array(z.strictObject({ id, x: finite, y: finite, rotation: finite, scaleX: scale, scaleY: scale, opacity: z.number().min(0).max(1) })).min(1).max(128).superRefine((parts, ctx) => { if (new Set(parts.map(p => p.id)).size !== parts.length) ctx.addIssue({ code: 'custom', message: 'Parte duplicada.' }); });
const skeleton = z.array(z.strictObject({ id, parentId: id.nullable(), pivot: z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }) })).min(1).max(128);
export const poseSchema = z.strictObject({ schemaVersion: z.literal(1), perspective: id, skeleton, transforms: transformsSchema });
export const animationSchema = z.strictObject({ schemaVersion: z.literal(1), perspective: id, skeleton,
  duration: z.number().min(0.1).max(60), ease: z.enum(['none', 'power1.inOut', 'sine.inOut']),
  keyframes: z.array(z.strictObject({ time: z.number().min(0).max(60), transforms: transformsSchema })).min(2).max(24),
}).superRefine((animation, ctx) => {
  const frames = animation.keyframes;
  if (frames[0].time !== 0 || frames.at(-1).time !== animation.duration || frames.some((frame, i) => i && frame.time <= frames[i-1].time)) ctx.addIssue({ code: 'custom', message: 'Keyframes devem começar em zero, terminar na duração e ter tempos crescentes.' });
  const ids = animation.skeleton.map(p => p.id).sort().join(',');
  for (const frame of frames) if (frame.transforms.map(p => p.id).sort().join(',') !== ids) ctx.addIssue({ code: 'custom', message: 'Partes dos keyframes incompatíveis.' });
  for (const part of frames[0].transforms) for (const frame of frames.slice(1)) {
    const next = frame.transforms.find(p => p.id === part.id);
    if (next && (Math.sign(part.scaleX) !== Math.sign(next.scaleX) || Math.sign(part.scaleY) !== Math.sign(next.scaleY))) ctx.addIssue({ code: 'custom', message: 'Não interpolar escala através de zero.' });
  }
});
const fields = { name: z.string().trim().min(1).max(200), ownerBookId: z.uuid().nullable().default(null) };
export const templateSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...fields, kind: z.literal('POSE'), definition: poseSchema }),
  z.strictObject({ ...fields, kind: z.literal('ANIMATION'), definition: animationSchema }),
]);
