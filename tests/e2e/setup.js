import { randomBytes } from 'node:crypto';
import { assertTestDatabase, readConfig } from '../../apps/api/src/config.js';
import { createPool } from '../../apps/api/src/infrastructure/database/pool.js';
import { migrate } from '../../apps/api/src/infrastructure/database/migrate.js';
import { createAuthService } from '../../apps/api/src/modules/auth/service.js';
export default async function setup() {
  assertTestDatabase();
  const pool = createPool(readConfig().database);
  try {
    const [[row]] = await pool.query('SELECT VERSION() AS version');
    if (!row.version.includes('MariaDB') || !row.version.startsWith(process.env.EXPECTED_DB_VERSION)) throw new Error('Versão de teste inesperada.');
    // The guarded, isolated test database must not retain integration rows whose temporary files were removed.
    const connection = await pool.getConnection();
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const table of ['motion_templates', 'character_snapshots', 'auth_sessions', 'users', 'book_status_history', 'library_items', 'pages', 'books', 'book_versions', 'assets', 'schema_migrations']) {
        await connection.query('DROP TABLE IF EXISTS ??', [table]);
      }
    } finally { await connection.query('SET FOREIGN_KEY_CHECKS = 1'); connection.release(); }
    await migrate(pool);
    process.env.E2E_USERNAME = 'e2e-' + randomBytes(8).toString('hex');
    process.env.E2E_PASSWORD = randomBytes(24).toString('base64url');
    await createAuthService(pool).createUser({ username: process.env.E2E_USERNAME, password: process.env.E2E_PASSWORD,
      displayName: 'Administrador E2E', role: 'ADMIN' });
  } finally { await pool.end(); }
}
