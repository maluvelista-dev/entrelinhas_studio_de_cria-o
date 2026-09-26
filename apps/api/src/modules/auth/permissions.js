import { AppError } from '../../errors.js';
const grants = Object.freeze({
  ADMIN: ['books:read', 'books:write', 'books:submit', 'books:return', 'library:read', 'library:write', 'users:manage'],
  EDITOR: ['books:read', 'books:write', 'books:submit', 'library:read', 'library:write'],
  REVIEWER: ['books:read', 'books:return', 'library:read'],
});
export function permissionsFor(role) { return [...(grants[role] || [])]; }
export function requirePermission(user, permission) {
  if (!user) throw new AppError(401, 'AUTH_REQUIRED', 'Entre para acessar o Studio.');
  if (!user.active || !permissionsFor(user.role).includes(permission)) {
    throw new AppError(403, 'ACCESS_DENIED', 'Seu perfil não permite esta ação.');
  }
}
