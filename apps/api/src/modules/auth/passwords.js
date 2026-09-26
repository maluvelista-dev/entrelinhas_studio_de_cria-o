import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, options);
  return 'scrypt$' + salt + '$' + hash.toString('hex');
}
export async function verifyPassword(password, encoded) {
  const valid = typeof encoded === 'string' && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded);
  const [, salt, expected] = valid ? encoded.split('$') : ['scrypt', '0'.repeat(32), '0'.repeat(128)];
  const actual = await derive(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex')) && valid;
}
