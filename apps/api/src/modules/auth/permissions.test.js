import { it, expect } from 'vitest';
import { requirePermission, permissionsFor } from './permissions.js';
it('nega por padrão e limita revisores e editores às ações permitidas', () => {
  expect(permissionsFor('UNKNOWN')).toEqual([]);
  expect(() => requirePermission(null, 'books:read')).toThrow();
  expect(() => requirePermission({ active: true, role: 'REVIEWER' }, 'books:write')).toThrow();
  expect(() => requirePermission({ active: true, role: 'EDITOR' }, 'users:manage')).toThrow();
  expect(() => requirePermission({ active: false, role: 'ADMIN' }, 'books:read')).toThrow();
  expect(() => requirePermission({ active: true, role: 'ADMIN' }, 'users:manage')).not.toThrow();
});
