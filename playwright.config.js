import { defineConfig } from '@playwright/test';
import { assertTestDatabase } from './apps/api/src/config.js';
assertTestDatabase();
const apiPort = Number(process.env.E2E_API_PORT || 3000);
const studioPort = Number(process.env.E2E_STUDIO_PORT || 5173);
if (![apiPort, studioPort].every(port => Number.isInteger(port) && port > 0 && port <= 65535) || apiPort === studioPort) throw new Error('Portas E2E inválidas.');
const origin = 'http://127.0.0.1:' + studioPort;
process.env.API_PORT = String(apiPort);
process.env.APP_ORIGIN = origin;
export default defineConfig({
  testDir: './tests/e2e', globalSetup: './tests/e2e/setup.js', workers: 1, timeout: 60000,
  use: { baseURL: origin, browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node --env-file=.env.test apps/api/src/server.js',
      url: 'http://127.0.0.1:' + apiPort + '/api/health', reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js preview apps/studio --config apps/studio/vite.config.js --host 127.0.0.1 --port ' + studioPort + ' --strictPort', url: origin, reuseExistingServer: false },
  ],
});
