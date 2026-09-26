import { expect, test } from 'vitest';
import { interpretScene } from './scene.js';
const root = { id: 'root', kind: 'rectangle', width: 100, height: 80, color: '#123456', position: { x: 0.5, y: 0.5 }, coordinateSpace: 'normalized' };
const scene = { schemaVersion: 1, width: 800, height: 600, background: '#ffffff', entities: [root] };
test('interpretation resolves normalized children and relative offsets in parent dimensions', () => {
  const child = { ...root, id: 'child', parentId: 'root', offset: { x: 0.1, y: 0 }, pivot: { x: 0.5, y: 0.5 } };
  const input = { ...scene, entities: [child, root] };
  const before = JSON.stringify(input);
  const result = interpretScene(input);
  expect(result.nodes.map(node => node.entity.id)).toEqual(['root', 'child']);
  expect(result.nodes[1].world.slice(4)).toEqual([410, 300]);
  expect(JSON.stringify(input)).toBe(before);
  expect(interpretScene(JSON.parse(JSON.stringify(result.scene)))).toEqual(result);
});
test('rejects unknown versions, executable fields, cycles, duplicates and missing parents', () => {
  for (const input of [ { ...scene, schemaVersion: 2 }, { ...scene, script: 'alert(1)' },
    { ...scene, entities: [root, root] },
    { ...scene, entities: [{ ...root, parentId: 'missing' }] },
    { ...scene, entities: [{ ...root, parentId: 'root' }] },
    { ...scene, entities: [{ ...root, parentId: 'child' }, { ...root, id: 'child', parentId: 'root' }] },
    { ...scene, entities: [{ ...root, rotation: Infinity }] } ]) {
    expect(() => interpretScene(input)).toThrow();
  }
});
test('rejects accumulated transforms too large for rendering', () => {
  expect(() => interpretScene({ ...scene, entities: [
    { ...root, scaleX: 100000 },
    { ...root, id: 'child', parentId: 'root', scaleX: 100000 },
  ] })).toThrow('limites');
});
