import { it, expect } from 'vitest';
import { readConfig, assertTestDatabase } from './config.js';
it('recusa configuração ausente, porta inválida e banco não isolado', () => {
  expect(() => readConfig({})).toThrow('DB_HOST');
  expect(() => readConfig({ DB_HOST: '127.0.0.1', DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'b', DB_PORT: 'x' })).toThrow('Porta');
  const env = { DB_NAME: 'book_studio_test', DB_USER: 'book_studio_test_runner', DB_HOST: '127.0.0.1',
    TEST_DB_TARGET: 'local', EXPECTED_DB_VERSION: '10.4.' };
  expect(() => assertTestDatabase(env)).not.toThrow();
  for (const override of [{ DB_NAME: 'book_studio' }, { DB_USER: 'root' }, { DB_HOST: 'production.example' }, { EXPECTED_DB_VERSION: '' }]) {
    expect(() => assertTestDatabase({ ...env, ...override })).toThrow();
  }
});
