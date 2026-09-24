import { mkdtemp, rm, writeFile, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, it, expect } from 'vitest';
import { FilesystemStorage } from './filesystem.js';
const roots = [];
async function setup() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'book-studio-storage-'));
  roots.push(root);
  return { root, storage: new FilesystemStorage(path.join(root, 'assets')) };
}
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
it('grava, lê, recusa sobrescrita e remove', async () => {
  const { storage } = await setup();
  const bytes = Buffer.from('conteúdo');
  const result = await storage.put('objects/a.png', bytes);
  expect(result.byteSize).toBe(bytes.length);
  expect(await storage.exists('objects/a.png')).toBe(true);
  await expect(storage.put('objects/a.png', bytes)).rejects.toMatchObject({ code: 'EEXIST' });
  const chunks = [];
  for await (const chunk of await storage.openRead('objects/a.png')) chunks.push(chunk);
  expect(Buffer.concat(chunks)).toEqual(bytes);
  await storage.delete('objects/a.png');
  expect(await storage.exists('objects/a.png')).toBe(false);
});
it('recusa traversal, caminhos absolutos, nomes reservados e symlink', async () => {
  const { root, storage } = await setup();
  for (const key of ['../outside', '/tmp/a', 'C:\\a', 'objects/../a', 'objects/CON.txt', 'objects/a.']) {
    await expect(storage.put(key, Buffer.from('x'))).rejects.toThrow();
  }
  await storage.put('objects/a', Buffer.from('x'));
  await symlink(root, path.join(root, 'assets', 'linked'), 'junction');
  await expect(storage.exists('linked/a')).rejects.toThrow('Symlinks');
});
it('propaga erro de escrita sem transformar falha em sucesso', async () => {
  const { root } = await setup();
  await writeFile(path.join(root, 'blocked'), 'arquivo');
  const storage = new FilesystemStorage(path.join(root, 'blocked'));
  await expect(storage.put('objects/a', Buffer.from('x'))).rejects.toThrow();
});
