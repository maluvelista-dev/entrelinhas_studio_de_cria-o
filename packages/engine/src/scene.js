import { sceneSchema } from '@studio/schemas/scene';
import { composeTransform, multiply, normalizedToPixels } from './coordinates.js';
export function interpretScene(input) {
  const scene = sceneSchema.parse(input);
  const source = new Map(scene.entities.map(entity => [entity.id, entity]));
  const resolved = new Map();
  function resolve(entity) {
    if (resolved.has(entity.id)) return resolved.get(entity.id);
    const parent = entity.parentId ? resolve(source.get(entity.parentId)) : null;
    const size = parent?.entity || scene;
    const position = entity.coordinateSpace === 'normalized' ? normalizedToPixels(entity.position, size) : entity.position;
    const offset = normalizedToPixels(entity.offset, size);
    const transform = { x: position.x + offset.x, y: position.y + offset.y,
      rotation: entity.rotation, scaleX: entity.scaleX, scaleY: entity.scaleY,
      pivotX: entity.pivot.x * entity.width, pivotY: entity.pivot.y * entity.height };
    const local = composeTransform(transform);
    const world = parent ? multiply(parent.world, local) : local;
    if (!world.every(value => Number.isFinite(value) && Math.abs(value) <= 1e9)) throw new Error('Transformação excede os limites do Engine.');
    const result = { entity, transform, world };
    resolved.set(entity.id, result);
    return result;
  }
  scene.entities.forEach(resolve);
  return { scene, nodes: [...resolved.values()] };
}
