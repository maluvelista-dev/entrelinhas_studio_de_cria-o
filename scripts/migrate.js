import { readConfig } from '../apps/api/src/config.js';
import { createPool } from '../apps/api/src/infrastructure/database/pool.js';
import { migrate } from '../apps/api/src/infrastructure/database/migrate.js';
const { database } = readConfig();
if (!process.env.DB_MIGRATION_USER || !process.env.DB_MIGRATION_PASSWORD) throw new Error('Configure o usuário de migrations.');
const pool = createPool({ ...database, user: process.env.DB_MIGRATION_USER, password: process.env.DB_MIGRATION_PASSWORD });
try { console.log({ applied: await migrate(pool) }); } finally { await pool.end(); }
