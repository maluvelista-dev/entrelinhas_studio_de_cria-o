import { randomUUID } from 'node:crypto';
import { readConfig } from '../apps/api/src/config.js';
import { createPool, transaction } from '../apps/api/src/infrastructure/database/pool.js';
import { FilesystemStorage } from '../apps/api/src/infrastructure/storage/filesystem.js';
const config = readConfig();
const pool = createPool(config.database);
const storage = new FilesystemStorage(config.storageRoot);
// Tiny valid PNG fixture, generated only when this command is explicitly requested.
const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const id = randomUUID();
const key = `objects/${id}.png`;
try {
  const metadata = await storage.put(key, bytes);
  try {
    await transaction(pool, connection => connection.execute(`INSERT INTO assets
      (id, owner_book_id, storage_key, original_name, media_type, byte_size, checksum, created_at)
      VALUES (?, NULL, ?, 'Fixture de validação.png', 'image/png', ?, ?, UTC_TIMESTAMP(3))`,
      [id, key, metadata.byteSize, metadata.checksum]));
  } catch (error) { await storage.delete(key); throw error; }
  console.log(`Fixture criada: ${id}`);
} finally { await pool.end(); }
