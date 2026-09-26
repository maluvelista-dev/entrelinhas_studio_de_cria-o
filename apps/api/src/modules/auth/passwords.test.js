import { it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './passwords.js';
it('usa salt único e verifica senha sem armazenar texto claro', async () => {
  const password = 'test-password-long-enough';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  expect(first).not.toBe(second);
  expect(first).not.toContain(password);
  expect(await verifyPassword(password, first)).toBe(true);
  expect(await verifyPassword('wrong', first)).toBe(false);
  expect(await verifyPassword(password, null)).toBe(false);
});
