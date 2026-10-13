import { characterSchema } from '@studio/schemas/character';
import { poseSchema } from '@studio/schemas/motion';
function skeleton(view) { return view.parts.map(p => ({ id: p.id, parentId: p.parentId, pivot: p.pivot })).sort((a,b) => a.id.localeCompare(b.id)); }
export function capturePose(input, perspective) {
  const definition = characterSchema.parse(input), view = definition.perspectives.find(v => v.id === perspective);
  if (!view) throw new Error('Perspectiva incompatível.');
  return poseSchema.parse({ schemaVersion: 1, perspective, skeleton: skeleton(view), transforms: view.parts.map(p => ({ id: p.id, x: p.position.x, y: p.position.y, rotation: p.rotation, scaleX: p.scaleX, scaleY: p.scaleY, opacity: p.opacity })) });
}
export function compatible(input, motion) {
  const parsed=characterSchema.safeParse(input);if(!parsed.success) return false;
  const definition = parsed.data, view = definition.perspectives.find(v => v.id === motion.perspective);
  return Boolean(view && JSON.stringify(skeleton(view)) === JSON.stringify([...motion.skeleton].sort((a,b) => a.id.localeCompare(b.id))));
}
export function applyPose(input, raw) {
  const pose = poseSchema.parse(raw), definition = characterSchema.parse(input);
  if (!compatible(definition, pose)) throw new Error('Pose incompatível com partes, hierarquia ou pivôs.');
  const view = definition.perspectives.find(v => v.id === pose.perspective);
  if (pose.transforms.length !== view.parts.length) throw new Error('Pose incompleta.');
  for (const part of view.parts) {
    const transform = pose.transforms.find(p => p.id === part.id); if (!transform) throw new Error('Parte ausente na pose.');
    part.position = { x: transform.x, y: transform.y }; part.rotation = transform.rotation;
    part.scaleX = transform.scaleX; part.scaleY = transform.scaleY; part.opacity = transform.opacity;
  }
  return definition;
}
export function presetAnimation(input, perspective, partId, preset) {
  const pose = capturePose(input, perspective), frames = [0, 0.5, 1].map(time => ({ time, transforms: structuredClone(pose.transforms) }));
  const part = frames[1].transforms.find(p => p.id === partId); if (!part) throw new Error('Parte inexistente.');
  if (preset === 'wave') part.rotation += Math.PI / 4;
  else if (preset === 'blink') part.opacity = 0;
  else if (preset === 'jump') part.y -= 80;
  else if (preset === 'idle') part.scaleY *= 1.03;
  else throw new Error('Preset não registrado.');
  return { schemaVersion: 1, perspective, skeleton: pose.skeleton, duration: 1, ease: 'sine.inOut', keyframes: frames };
}
