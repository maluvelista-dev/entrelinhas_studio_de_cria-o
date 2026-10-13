import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
const localEnv = parseEnv(readFileSync(new URL('../.env', import.meta.url), 'utf8'));
const apiPort = process.env.API_PORT || localEnv.API_PORT || '3000';
const children = [
  spawn(process.execPath, ['--env-file=.env', '--watch', 'apps/api/src/server.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['../../node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], {
    cwd: new URL('../apps/studio/', import.meta.url), stdio: 'inherit',
    env: { ...process.env, API_PORT: apiPort },
  }),
];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
children.forEach(child => {
  child.on('error', () => stop(1));
  child.on('exit', code => stop(code ?? 1));
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
