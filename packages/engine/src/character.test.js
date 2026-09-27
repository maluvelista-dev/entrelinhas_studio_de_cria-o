import { expect, test } from 'vitest';
import { createCharacter, resolveAnchor } from './character.js';
const shape = { width: 100, height: 100, color: '#ffffff', kind: 'rectangle' };
const assets = new Map([['body', shape], ['hand', { ...shape, width: 20, height: 40 }]]);
const manifest = {
  schemaVersion: 1, id: 'figure', name: 'Figura', width: 200, height: 300,
  perspectives: [{ id: 'front', rootId: 'root', parts: [
    { id: 'root', parentId: null, assetId: null, position: { x: 0, y: 0 } },
    { id: 'body', parentId: 'root', assetId: 'body', position: { x: 50, y: 50 } },
    { id: 'hand', parentId: 'body', assetId: 'hand', position: { x: 100, y: 0 }, pivot: { x: 0.5, y: 0 } },
  ], anchors: [{ name: 'handRight', partId: 'hand', position: { x: 0.5, y: 1 }, coordinateSpace: 'normalized' }] }],
};
test('root transforms all descendants and anchors respect part pivots and parent scale/rotation', () => {
  const result = createCharacter(manifest, { id: 'luna', perspective: 'front', transform: { x: 300, y: 200, rotation: Math.PI/2, scaleX: 2 } }, assets);
  const anchor = resolveAnchor(result, 'luna.handRight');
  expect(anchor.x).toBeCloseTo(210);
  expect(anchor.y).toBeCloseTo(500);
  expect(() => resolveAnchor(result, 'luna.missing')).toThrow();
  expect(() => resolveAnchor(result, 'other.handRight')).toThrow();
});
test('local changes affect only the selected branch; input and serialized definition stay intact', () => {
  const before = JSON.stringify(manifest);
  const first = createCharacter(manifest, { id: 'luna', perspective: 'front' }, assets);
  const changed = structuredClone(manifest);
  changed.perspectives[0].parts[2].rotation = Math.PI;
  const second = createCharacter(changed, { id: 'luna', perspective: 'front' }, assets);
  expect(first.nodes.find(n => n.partId === 'body').world).toEqual(second.nodes.find(n => n.partId === 'body').world);
  expect(resolveAnchor(first, 'luna.handRight')).not.toEqual(resolveAnchor(second, 'luna.handRight'));
  expect(JSON.stringify(manifest)).toBe(before);
  expect(createCharacter(JSON.parse(JSON.stringify(first.definition)), { id: 'luna', perspective: 'front' }, assets).definition).toEqual(first.definition);
});
test('rejects missing assets, perspectives, duplicated parts, disconnected roots and invalid anchors', () => {
  expect(() => createCharacter(manifest, { id: 'luna', perspective: 'side' }, assets)).toThrow();
  expect(() => createCharacter(manifest, { id: 'luna', perspective: 'front' }, new Map())).toThrow();
  for (const change of [
    value => value.perspectives[0].parts.push(value.perspectives[0].parts[1]),
    value => { value.perspectives[0].parts[1].parentId = null; },
    value => { value.perspectives[0].parts[1].parentId = 'hand'; },
    value => { value.perspectives[0].anchors[0].partId = 'missing'; },
    value => { value.perspectives[0].parts[1].pivot = { x: 2, y: 0 }; },
    value => { value.perspectives[0].parts[1].rotation = Infinity; },
    value => { value.perspectives[0].parts[1].token = 'secret'; },
  ]) {
    const invalid = structuredClone(manifest); change(invalid);
    expect(() => createCharacter(invalid, { id: 'luna', perspective: 'front' }, assets)).toThrow();
  }
});
test('named local anchors remain available on mirrored and invisible parts', () => {
  const input = structuredClone(manifest);
  input.perspectives[0].anchors.push({ name: 'shoulder', partId: 'body', position: { x: 100, y: 0 }, coordinateSpace: 'local' });
  input.perspectives[0].parts[1].visible = false;
  const result = createCharacter(input, { id: 'luna', perspective: 'front', transform: { x: 300, scaleX: -1 } }, assets);
  expect(resolveAnchor(result, 'luna.shoulder')).toEqual({ x: 150, y: 50 });
  expect(resolveAnchor(result, 'luna.handRight')).toEqual({ x: 150, y: 90 });
});
