import { createCharacter, resolveAnchor } from '../src/character.js';
import { localToWorld } from '../src/coordinates.js';
// Tiny bundled white PNG exercises sprite decoding; colored shapes are technical fixtures.
const whitePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';
export const characterAssets = new Map([
  ['body', { kind: 'rectangle', width: 120, height: 150, color: '#6366f1' }],
  ['sideBody', { kind: 'rectangle', width: 90, height: 150, color: '#6366f1' }],
  ['head', { kind: 'ellipse', width: 100, height: 100, color: '#f4bd8c' }],
  ['arm', { kind: 'rectangle', width: 30, height: 100, color: '#818cf8' }],
  ['hand', { kind: 'sprite', width: 30, height: 28, color: '#f4bd8c', source: whitePixel }],
  ['leg', { kind: 'rectangle', width: 36, height: 125, color: '#334155' }],
  ['eye', { kind: 'ellipse', width: 10, height: 14, color: '#172033' }],
  ['mouth', { kind: 'rectangle', width: 24, height: 5, color: '#92400e' }],
]);
const part = (id, parentId, assetId, x, y, pivot = { x: 0, y: 0 }) => ({ id, parentId, assetId, position: { x, y }, pivot });
const front = {
  id: 'front', rootId: 'root',
  parts: [
    part('root', null, null, 0, 0),
    part('body', 'root', 'body', 0, 120, { x: 0.5, y: 0 }),
    part('head', 'body', 'head', 60, -8, { x: 0.5, y: 1 }),
    part('leftEye', 'head', 'eye', 27, 42), part('rightEye', 'head', 'eye', 64, 42),
    part('mouth', 'head', 'mouth', 38, 72),
    part('leftArm', 'body', 'arm', 0, 10, { x: 0.5, y: 0 }),
    part('rightArm', 'body', 'arm', 120, 10, { x: 0.5, y: 0 }),
    part('leftHand', 'leftArm', 'hand', 0, 100), part('rightHand', 'rightArm', 'hand', 0, 100),
    part('leftLeg', 'body', 'leg', 28, 150, { x: 0.5, y: 0 }),
    part('rightLeg', 'body', 'leg', 92, 150, { x: 0.5, y: 0 }),
  ],
  anchors: [
    { name: 'handLeft', partId: 'leftHand', position: { x: 0.5, y: 1 }, coordinateSpace: 'normalized' },
    { name: 'handRight', partId: 'rightHand', position: { x: 0.5, y: 1 }, coordinateSpace: 'normalized' },
    { name: 'footLeft', partId: 'leftLeg', position: { x: 0.5, y: 1 }, coordinateSpace: 'normalized' },
    { name: 'footRight', partId: 'rightLeg', position: { x: 0.5, y: 1 }, coordinateSpace: 'normalized' },
    { name: 'head', partId: 'head', position: { x: 0.5, y: 0 }, coordinateSpace: 'normalized' },
  ],
};
const side = structuredClone(front);
side.id = 'side';
side.parts.find(p => p.id === 'body').assetId = 'sideBody';
side.parts.find(p => p.id === 'leftEye').visible = false;
side.parts.find(p => p.id === 'head').position.x = 45;
side.parts.find(p => p.id === 'rightArm').position.x = 80;
side.parts.find(p => p.id === 'rightLeg').position.x = 64;
export const validationCharacter = { schemaVersion: 1, id: 'validationFigure', name: 'Personagem de validação', width: 200, height: 400, perspectives: [front, side] };

export function characterPreview(perspective = 'front', debug = true) {
  const original = createCharacter(validationCharacter, { id: 'original', perspective, transform: { x: 230, y: 90, scaleX: 0.9, scaleY: 0.9 } }, characterAssets);
  const changed = structuredClone(validationCharacter);
  changed.perspectives.find(view => view.id === perspective).parts.find(p => p.id === 'rightArm').rotation = -Math.PI/2;
  const comparison = createCharacter(changed, { id: 'comparison', perspective, transform: { x: 570, y: 90, scaleX: -0.9, scaleY: 0.9 } }, characterAssets);
  const characters = [original, comparison];
  const entities = characters.flatMap(character => character.entities);
  const anchors = characters.flatMap(character => character.perspective.anchors.map(anchor => ({
    reference: character.instance.id + '.' + anchor.name,
    ...resolveAnchor(character, character.instance.id + '.' + anchor.name),
  })));
  if (debug) {
    for (const character of characters) for (const node of character.nodes) {
      const position = localToWorld({ x: node.transform.pivotX, y: node.transform.pivotY }, node.world);
      entities.push({ id: 'pivot__' + node.entity.id, kind: 'rectangle', width: 6, height: 6,
        color: '#1d4ed8', position, pivot: { x: 0.5, y: 0.5 }, zIndex: 999 });
    }
    anchors.forEach((anchor, index) => entities.push({ id: 'anchor__' + index, kind: 'ellipse', width: 10, height: 10,
      color: '#b45309', position: { x: anchor.x, y: anchor.y }, pivot: { x: 0.5, y: 0.5 }, zIndex: 1000 }));
  }
  return { scene: { schemaVersion: 1, width: 800, height: 520, background: '#f8fafc', entities }, anchors, character: original };
}
