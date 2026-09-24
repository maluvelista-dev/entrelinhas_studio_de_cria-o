import path from 'node:path';

export function readConfig(env = process.env) {
  for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!env[key]) throw new Error(`Configuração ausente: ${key}`);
  }
  const port = Number(env.DB_PORT || 3306);
  const apiPort = Number(env.API_PORT || 3000);
  if (![port, apiPort].every(value => Number.isInteger(value) && value > 0 && value <= 65535)) {
    throw new Error('Porta inválida na configuração.');
  }
  return { database: { host: env.DB_HOST, port, database: env.DB_NAME,
    user: env.DB_USER, password: env.DB_PASSWORD },
    apiPort, storageRoot: path.resolve(env.STORAGE_ROOT || 'storage') };
}
export function assertTestDatabase(env = process.env) {
  if (env.DB_NAME !== 'book_studio_test' || env.DB_USER !== 'book_studio_test_runner' ||
      !['local', 'production'].includes(env.TEST_DB_TARGET) || !env.EXPECTED_DB_VERSION) {
    throw new Error('Integração exige banco/usuário exclusivos, TEST_DB_TARGET e EXPECTED_DB_VERSION.');
  }
  if (!['127.0.0.1', 'localhost'].includes(env.DB_HOST)) {
    throw new Error('Integração destrutiva permitida somente em instância isolada no loopback.');
  }
}
