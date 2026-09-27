import { expect, test, vi } from 'vitest';
import { AssetManager } from './asset-manager.js';
const assets = new Map([['hand', { kind: 'sprite', source: '/hand.png' }]]);
test('deduplicates concurrent loads and releases each owned resource once', async () => {
  const resource = {}, load = vi.fn(async () => resource), destroy = vi.fn();
  const manager = new AssetManager(assets, { load, destroy });
  const results = await Promise.all([manager.load('hand'), manager.load('hand')]);
  expect(results).toEqual([resource, resource]); expect(load).toHaveBeenCalledTimes(1);
  await manager.dispose(); await manager.dispose();
  expect(destroy).toHaveBeenCalledTimes(1);
  await expect(manager.load('hand')).rejects.toThrow('encerrado');
});
test('missing assets fail; failed loads can retry; disposal during loading frees late resources', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
  const manager = new AssetManager(assets, { load, destroy: vi.fn() });
  await expect(manager.load('missing')).rejects.toThrow('cadastrado');
  await expect(manager.load('hand')).rejects.toThrow('offline');
  await manager.load('hand'); expect(load).toHaveBeenCalledTimes(2); await manager.dispose();
  let finish; const destroy = vi.fn();
  const slow = new AssetManager(assets, { load: () => new Promise(resolve => { finish = resolve; }), destroy });
  const pending = slow.load('hand'); await Promise.resolve();
  const disposed = slow.dispose(); finish({});
  await expect(pending).rejects.toThrow('encerrado'); await disposed;
  expect(destroy).toHaveBeenCalledTimes(1);
});
