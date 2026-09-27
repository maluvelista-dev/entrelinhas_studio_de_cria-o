import { characterSchema, characterInstanceSchema } from '@studio/schemas/character';
import { interpretScene } from './scene.js';
import { localToWorld, normalizedToPixels } from './coordinates.js';

export function createCharacter(input, instanceInput, assets) {
  const definition = characterSchema.parse(input);
  const instance = characterInstanceSchema.parse(instanceInput);
  const perspective = definition.perspectives.find(view => view.id === instance.perspective);
  if (!perspective) throw new Error('Perspectiva indisponível.');
  const entityId = partId => instance.id + '__part__' + partId;
  const rootId = instance.id + '__instance';
  const entities = [{ id: rootId, kind: 'group', width: definition.width, height: definition.height,
    color: '#ffffff', position: { x: instance.transform.x, y: instance.transform.y },
    rotation: instance.transform.rotation, scaleX: instance.transform.scaleX, scaleY: instance.transform.scaleY }];
  for (const part of perspective.parts) {
    const asset = part.assetId === null ? { kind: 'group', width: definition.width, height: definition.height, color: '#ffffff' } : assets.get(part.assetId);
    if (!asset) throw new Error('Asset ausente para a parte ' + part.id + '.');
    const node = { id: entityId(part.id), parentId: part.parentId ? entityId(part.parentId) : rootId,
      kind: asset.kind, width: asset.width, height: asset.height, color: asset.color || '#ffffff',
      position: part.position, rotation: part.rotation, scaleX: part.scaleX, scaleY: part.scaleY,
      pivot: part.pivot, opacity: part.opacity, visible: part.visible, zIndex: part.zIndex };
    if (asset.kind === 'sprite') node.assetId = part.assetId;
    entities.push(node);
  }
  const interpreted = interpretScene({ schemaVersion: 1, width: definition.width, height: definition.height, background: '#ffffff', entities });
  const nodes = perspective.parts.map(part => ({
    partId: part.id, ...interpreted.nodes.find(node => node.entity.id === entityId(part.id)),
  }));
  return { definition, instance, perspective, nodes, entities: interpreted.scene.entities };
}

export function resolveAnchor(character, reference) {
  if (typeof reference !== 'string') throw new Error('Referência de anchor inválida.');
  const [instanceId, name, extra] = reference.split('.');
  if (extra !== undefined || instanceId !== character.instance.id || !name) throw new Error('Referência de anchor inválida.');
  const anchor = character.perspective.anchors.find(item => item.name === name);
  if (!anchor) throw new Error('Anchor inexistente: ' + name + '.');
  const node = character.nodes.find(item => item.partId === anchor.partId);
  const local = anchor.coordinateSpace === 'normalized' ? normalizedToPixels(anchor.position, node.entity) : anchor.position;
  return localToWorld(local, node.world);
}
