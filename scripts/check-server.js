import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function check(directory) {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${file.name}`;
    if (file.isDirectory()) await check(path);
    else if (path.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
      if (result.status !== 0) throw new Error(`Sintaxe inválida: ${path}`);
      if (path.includes('/src/') && !path.endsWith('.test.js') && !path.endsWith('/server.js')) {
        await import(new URL(`../${path}`, import.meta.url));
      }
    }
  }
}
await check('apps/api/src');
await check('packages/schemas/src');
await check('scripts');
console.log('API e schemas: sintaxe e imports válidos.');
