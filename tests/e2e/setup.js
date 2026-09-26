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
    await migrate(pool);
    process.env.E2E_USERNAME = 'e2e-' + randomBytes(8).toString('hex');
    process.env.E2E_PASSWORD = randomBytes(24).toString('base64url');
    await createAuthService(pool).createUser({ username: process.env.E2E_USERNAME, password: process.env.E2E_PASSWORD,
      displayName: 'Administrador E2E', role: 'ADMIN' });
  } finally { await pool.end(); }
}
