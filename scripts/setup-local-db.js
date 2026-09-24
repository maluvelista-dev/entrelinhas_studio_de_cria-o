import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { access, writeFile } from 'node:fs/promises';

// Run once. Never reset existing databases/users or overwrite credential files.
const productionTest = process.argv.includes('--production-test');
const databaseNames = productionTest ? ['book_studio_test'] : ['book_studio', 'book_studio_test'];
const envPaths = productionTest ? ['.env.production-test'] : ['.env', '.env.test'];
for (const file of envPaths) {
  try { await access(file); throw new Error(`${file} já existe. Setup recusado para preservar credenciais.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const port = Number(process.env.SETUP_DB_PORT || (productionTest ? 3307 : 3306));
const admin = await mysql.createConnection({ host: '127.0.0.1', port,
  user: process.env.SETUP_DB_USER || 'root', password: process.env.SETUP_DB_PASSWORD || '' });
try {
  const [[server]] = await admin.query('SELECT VERSION() AS version');
  if (!server.version.includes('MariaDB')) throw new Error('Servidor não é MariaDB.');
  if (productionTest && !server.version.startsWith('11.4.')) throw new Error('Alvo de produção esperado: MariaDB 11.4.');
  for (const name of databaseNames) {
    const [[found]] = await admin.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [name]);
    if (found) throw new Error(`Banco ${name} já existe. Setup recusado, sem alterações.`);
  }
  const users = productionTest ? ['book_studio_test_runner'] : ['book_studio_app', 'book_studio_migrator', 'book_studio_test_runner'];
  for (const user of users) {
    const [found] = await admin.execute('SELECT User FROM mysql.user WHERE User = ?', [user]);
    if (found.length) throw new Error(`Usuário ${user} já existe. Setup recusado.`);
  }
  const passwords = Object.fromEntries(users.map(user => [user, randomBytes(32).toString('hex')]));
  for (const name of databaseNames) await admin.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [name]);
  for (const user of users) {
    await admin.query("CREATE USER ?@'127.0.0.1' IDENTIFIED BY ?", [user, passwords[user]]);
    const database = user === 'book_studio_test_runner' ? 'book_studio_test' : 'book_studio';
    const privileges = user === 'book_studio_app' ? 'SELECT, INSERT, UPDATE, DELETE' : 'ALL PRIVILEGES';
    await admin.query(`GRANT ${privileges} ON ??.* TO ?@'127.0.0.1'`, [database, user]);
  }
  function config(database, user) {
    return `DB_HOST=127.0.0.1\nDB_PORT=${port}\nDB_NAME=${database}\nDB_USER=${user}\nDB_PASSWORD=${passwords[user]}\nSTORAGE_ROOT=./storage\n`;
  }
  if (!productionTest) {
    await writeFile('.env', config('book_studio', 'book_studio_app') +
      `DB_MIGRATION_USER=book_studio_migrator\nDB_MIGRATION_PASSWORD=${passwords.book_studio_migrator}\nAPI_PORT=3000\n`, { flag: 'wx' });
  }
  await writeFile(productionTest ? '.env.production-test' : '.env.test',
    config('book_studio_test', 'book_studio_test_runner') +
    `TEST_DB_TARGET=${productionTest ? 'production' : 'local'}\nEXPECTED_DB_VERSION=${productionTest ? '11.4.' : server.version.split('-')[0]}\n`, { flag: 'wx' });
  console.log(`MariaDB ${server.version}: bancos/usuários exclusivos configurados. Credenciais gravadas apenas nos arquivos .env ignorados.`);
} finally { await admin.end(); }
