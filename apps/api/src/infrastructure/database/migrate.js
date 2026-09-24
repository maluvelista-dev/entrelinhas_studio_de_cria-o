import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = new URL('../../../migrations/', import.meta.url);
export async function migrate(pool, { through } = {}) {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [[server]] = await connection.query('SELECT VERSION() AS version');
    if (!server.version.includes('MariaDB')) throw new Error('Somente MariaDB é suportado.');
    const [[lock]] = await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':migrations'), 10) AS acquired");
    if (lock.acquired !== 1) throw new Error('Outra migration está em execução.');
    locked = true;
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(180) PRIMARY KEY, checksum CHAR(64) NOT NULL,
      state VARCHAR(20) NOT NULL, applied_at DATETIME(3) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    const names = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
    const applied = [];
    for (const name of names) {
      if (through && name > through) break;
      const sql = await readFile(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const [[previous]] = await connection.execute('SELECT * FROM schema_migrations WHERE name = ?', [name]);
      if (previous) {
        if (previous.state !== 'complete' || previous.checksum !== checksum) {
          throw new Error(`Migration ${name} incompleta ou alterada; consulte docs/DATABASE.md para recuperação.`);
        }
        continue;
      }
      await connection.execute("INSERT INTO schema_migrations(name, checksum, state) VALUES (?, ?, 'running')", [name, checksum]);
      // Explicit delimiter: these migrations contain plain DDL, no stored procedures.
      for (const statement of sql.split('-- statement-break').map(value => value.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
      await connection.execute("UPDATE schema_migrations SET state = 'complete', applied_at = UTC_TIMESTAMP(3) WHERE name = ?", [name]);
      applied.push(name);
    }
    return applied;
  } finally {
    if (locked) await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':migrations'))");
    connection.release();
  }
}
