import { expect, test } from 'vitest';
import { normalizedToPixels, pixelsToNormalized, localToWorld, worldToLocal, composeTransform, multiply } from './coordinates.js';

test('normalized coordinates and relative offsets retain proportions at multiple sizes', () => {
  for (const size of [{ width: 800, height: 600 }, { width: 320, height: 240 }]) {
    const point = { x: 0.25, y: 0.75 };
    expect(pixelsToNormalized(normalizedToPixels(point, size), size)).toEqual(point);
  }
  expect(() => pixelsToNormalized({ x: 1, y: 1 }, { width: 0, height: 1 })).toThrow();
});

test('parent rotation, mirrored scale and pivot round trip without losing local coordinates', () => {
  const parent = composeTransform({ x: 100, y: 50, rotation: Math.PI / 2, scaleX: 2, scaleY: 1 });
  const child = composeTransform({ x: 10, y: 20, scaleX: -1, pivotX: 5 });
  const matrix = multiply(parent, child);
  const world = localToWorld({ x: 5, y: 0 }, matrix);
  expect(world.x).toBeCloseTo(80);
  expect(world.y).toBeCloseTo(70);
  const local = worldToLocal(world, matrix);
  expect(local.x).toBeCloseTo(5);
  expect(local.y).toBeCloseTo(0);
});

test('singular transforms and non-finite numbers fail explicitly', () => {
  expect(() => worldToLocal({ x: 0, y: 0 }, composeTransform({ scaleX: 0 }))).toThrow();
  expect(() => composeTransform({ x: Infinity })).toThrow();
});
