import { randomBytes } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { readConfig } from '../apps/api/src/config.js';
import { createPool } from '../apps/api/src/infrastructure/database/pool.js';
import { createAuthService } from '../apps/api/src/modules/auth/service.js';
const pool = createPool(readConfig().database);
const connection = await pool.getConnection();
let locked = false;
let credentialsWritten = false;
const file = '.local/admin-initial.txt';
try {
  const [[lock]] = await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':bootstrap-admin'), 10) AS acquired");
  if (lock.acquired !== 1) throw new Error('Outro bootstrap está em execução.');
  locked = true;
  const [[{ count }]] = await connection.query('SELECT COUNT(*) AS count FROM users');
  if (count !== 0) throw new Error('Já existem usuários. Use a gestão de acessos; bootstrap recusado.');
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = randomBytes(24).toString('base64url');
  await mkdir('.local', { recursive: true });
  await writeFile(file, `Usuário: ${username}\nSenha inicial: ${password}\n\nAbra o Studio e use Acessos para definir sua senha. Depois remova este arquivo local.\n`, { flag: 'wx', mode: 0o600 });
  credentialsWritten = true;
  await createAuthService(connection).createUser({ username, password, displayName: 'Administração', role: 'ADMIN' });
  credentialsWritten = false;
  console.log('Administrador criado. Credencial inicial somente em .local/admin-initial.txt (ignorado pelo Git).');
} finally {
  if (credentialsWritten) await unlink(file);
  if (locked) await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':bootstrap-admin'))");
  connection.release();
  await pool.end();
}
