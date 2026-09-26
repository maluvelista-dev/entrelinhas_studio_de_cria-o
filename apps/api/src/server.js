import { readConfig } from './config.js';
import { createPool } from './infrastructure/database/pool.js';
import { FilesystemStorage } from './infrastructure/storage/filesystem.js';
import { createApp } from './http/app.js';
const config = readConfig();
const pool = createPool(config.database);
const storage = new FilesystemStorage(config.storageRoot);
const server = createApp({ pool, storage, security: config.security }).listen(config.apiPort, '127.0.0.1', () => {
  console.log(`API local: http://127.0.0.1:${config.apiPort}`);
});
async function stop() {
  server.close(async () => { await pool.end(); });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
