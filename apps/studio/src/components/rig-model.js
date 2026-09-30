import { createCharacter, worldToLocal } from '@studio/engine';
import { characterSchema } from '@studio/schemas/character';
export function newPart(id, parentId = null) {
  return { id, parentId, assetId: null, position: { x: 0, y: 0 }, rotation: 0, scaleX: 1, scaleY: 1,
    pivot: { x: 0, y: 0 }, opacity: 1, visible: true, zIndex: 0 };
}
export function newDefinition(item) {
  return { schemaVersion: 1, id: 'character_' + item.id, name: item.name.slice(0, 120), width: 1024, height: 1024,
    perspectives: [{ id: 'front', rootId: 'root', parts: [newPart('root')], anchors: [] }] };
}
export function descendants(view, id) {
  const result = new Set([id]);
  for (let changed = true; changed;) {
    changed = false;
    for (const part of view.parts) if (result.has(part.parentId) && !result.has(part.id)) { result.add(part.id); changed = true; }
  }
  return result;
}
export function previewRig(definition, perspective, assets) {
  const map = new Map(assets.map(asset => [asset.id, { kind: 'sprite', width: asset.width, height: asset.height }]));
  return createCharacter(characterSchema.parse(definition), { id: 'editor', perspective }, map);
}
export function pivotAt(part, node, worldPoint) {
  const local = worldToLocal(worldPoint, node.world);
  const pivot = { x: Math.max(0, Math.min(1, local.x / node.entity.width)), y: Math.max(0, Math.min(1, local.y / node.entity.height)) };
  const dx = (pivot.x - part.pivot.x) * node.entity.width, dy = (pivot.y - part.pivot.y) * node.entity.height;
  // Compensate in parent coordinates so editing a pivot does not move the artwork or its descendants.
  return { ...part, pivot, position: {
    x: part.position.x + Math.cos(part.rotation) * part.scaleX * dx - Math.sin(part.rotation) * part.scaleY * dy,
    y: part.position.y + Math.sin(part.rotation) * part.scaleX * dx + Math.cos(part.rotation) * part.scaleY * dy,
  } };
}
