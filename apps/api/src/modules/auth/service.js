import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { hashPassword, verifyPassword } from './passwords.js';
import { transaction } from '../../infrastructure/database/pool.js';
import { AppError } from '../../errors.js';
import { requirePermission } from './permissions.js';

export const usernameSchema = z.string().min(3).max(80).regex(/^[a-z0-9][a-z0-9._-]*$/);
export const roleSchema = z.enum(['ADMIN', 'EDITOR', 'REVIEWER']);
export const passwordSchema = z.string().min(12).max(128);
export const newUserSchema = z.strictObject({
  username: usernameSchema, displayName: z.string().trim().min(1).max(120),
  role: roleSchema, password: passwordSchema,
});
export const updateUserSchema = z.strictObject({
  displayName: z.string().trim().min(1).max(120), role: roleSchema, active: z.boolean(),
});
export const loginSchema = z.strictObject({ username: usernameSchema, password: z.string().min(1).max(128) });
const digest = token => createHash('sha256').update(token).digest('hex');
const invalidLogin = () => new AppError(401, 'INVALID_CREDENTIALS', 'Usuário ou senha inválidos.');
export const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

export function createAuthService(pool) {
  return {
    async login(raw, previousToken) {
      const input = loginSchema.parse(raw);
      const [[user]] = await pool.execute('SELECT * FROM users WHERE username = ?', [input.username]);
      const verified = await verifyPassword(input.password, user?.password_hash);
      if (!verified || !user?.active) throw invalidLogin();
      const token = randomBytes(32).toString('hex');
      await transaction(pool, async connection => {
        const [[current]] = await connection.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [user.id]);
        if (!current.active || current.password_hash !== user.password_hash) throw invalidLogin();
        if (previousToken) await connection.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [digest(previousToken)]);
        await connection.execute('DELETE FROM auth_sessions WHERE user_id = ? AND expires_at <= UTC_TIMESTAMP(3)', [user.id]);
        const [sessions] = await connection.execute('SELECT token_hash FROM auth_sessions WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
        for (const session of sessions.slice(4)) await connection.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [session.token_hash]);
        await connection.execute(`INSERT INTO auth_sessions(token_hash,user_id,created_at,last_seen_at,expires_at)
          VALUES (?,?,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3),DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 8 HOUR))`, [digest(token), user.id]);
      });
      return { user, token };
    },
    async authenticate(token) {
      if (!token) return null;
      const [[user]] = await pool.execute(`SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)
        AND s.last_seen_at > DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 30 MINUTE) AND u.active = TRUE`, [digest(token)]);
      if (!user) return null;
      await pool.execute('UPDATE auth_sessions SET last_seen_at = UTC_TIMESTAMP(3) WHERE token_hash = ?', [digest(token)]);
      return user;
    },
    async logout(token) {
      if (token) await pool.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [digest(token)]);
    },
    async listUsers() {
      const [rows] = await pool.query('SELECT id,username,display_name,role,active,created_at FROM users ORDER BY username');
      return rows;
    },
    async createUser(raw, actorId) {
      const input = newUserSchema.parse(raw);
      const passwordHash = await hashPassword(input.password);
      const id = randomUUID();
      const insert = connection => connection.execute(`INSERT INTO users(id,username,display_name,password_hash,role,active,created_at,updated_at)
        VALUES (?,?,?,?,?,TRUE,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))`,
        [id, input.username, input.displayName, passwordHash, input.role]);
      if (actorId) {
        await transaction(pool, async connection => {
          const [[actor]] = await connection.execute('SELECT * FROM users WHERE id=? FOR UPDATE', [actorId]);
          requirePermission(actor, 'users:manage');
          await insert(connection);
        });
      } else {
        // Bootstrap/test fixtures are trusted local callers; HTTP always supplies actorId.
        await insert(pool);
      }
      return { id, username: input.username, display_name: input.displayName, role: input.role, active: true };
    },
    async updateUser(id, raw, actorId) {
      const input = updateUserSchema.parse(raw);
      return transaction(pool, async connection => {
        const [users] = await connection.query('SELECT * FROM users ORDER BY id FOR UPDATE');
        const actor = users.find(user => user.id === actorId);
        requirePermission(actor, 'users:manage');
        const target = users.find(user => user.id === id);
        if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
        if (id === actorId && (!input.active || input.role !== 'ADMIN')) {
          throw new AppError(409, 'SELF_LOCKOUT', 'Você não pode remover seu próprio acesso administrativo.');
        }
        await connection.execute('UPDATE users SET display_name=?,role=?,active=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?',
          [input.displayName, input.role, input.active, id]);
        if (!input.active || input.role !== target.role) await connection.execute('DELETE FROM auth_sessions WHERE user_id = ?', [id]);
        return { ...target, display_name: input.displayName, role: input.role, active: input.active };
      });
    },
    async resetPassword(id, raw, actorId) {
      const { password } = z.strictObject({ password: passwordSchema }).parse(raw);
      const passwordHash = await hashPassword(password);
      return transaction(pool, async connection => {
        const [users] = await connection.query('SELECT * FROM users ORDER BY id FOR UPDATE');
        requirePermission(users.find(user => user.id === actorId), 'users:manage');
        if (!users.some(user => user.id === id)) throw new AppError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
        await connection.execute('UPDATE users SET password_hash=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?', [passwordHash, id]);
        await connection.execute('DELETE FROM auth_sessions WHERE user_id=?', [id]);
      });
    },
  };
}
