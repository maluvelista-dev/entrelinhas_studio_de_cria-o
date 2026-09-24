import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['--env-file=.env', '--watch', 'apps/api/src/server.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['../../node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], {
    cwd: new URL('../apps/studio/', import.meta.url), stdio: 'inherit',
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
