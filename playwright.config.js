import { defineConfig } from '@playwright/test';
import { assertTestDatabase } from './apps/api/src/config.js';
assertTestDatabase();
export default defineConfig({
  testDir: './tests/e2e', globalSetup: './tests/e2e/setup.js', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5173', browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node --env-file=.env.test apps/api/src/server.js',
      url: 'http://127.0.0.1:3000/api/health', reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js preview apps/studio --config apps/studio/vite.config.js --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: false },
  ],
});
