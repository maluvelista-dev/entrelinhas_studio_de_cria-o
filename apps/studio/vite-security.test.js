import { it, expect } from 'vitest';
import { createServer } from 'vite';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

it('Vite não publica arquivos privados do workspace por /@fs/', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const privateFile = path.join(root, '.local', 'security-test-' + randomUUID() + '.txt');
  await mkdir(path.dirname(privateFile), { recursive: true });
  await writeFile(privateFile, 'synthetic-private-marker');
  const server = await createServer({
    root: fileURLToPath(new URL('./', import.meta.url)),
    configFile: fileURLToPath(new URL('./vite.config.js', import.meta.url)),
    logLevel: 'silent', server: { port: 0, strictPort: false },
  });
  try {
    await server.listen();
    const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
    expect((await fetch(origin + '/')).status).toBe(200);
    const location = '/@fs/' + privateFile.replaceAll('\\', '/');
    for (const suffix of ['', '?raw']) {
      const response = await fetch(origin + location + suffix);
      expect(response.status).toBe(403);
      expect((await response.text()).includes('synthetic-private-marker')).toBe(false);
    }
  } finally { await server.close(); await unlink(privateFile); }
});
