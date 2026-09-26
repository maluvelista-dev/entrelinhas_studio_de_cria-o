import { AppError } from '../errors.js';
import { requirePermission } from '../modules/auth/permissions.js';

export function sessionToken(req, cookieName) {
  const candidates = (req.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith(cookieName + '='));
  if (candidates.length !== 1) return null;
  const token = candidates[0].slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function requireAccess(auth, cookieName) {
  return async (req, _res, next) => {
    req.actor = await auth.authenticate(sessionToken(req, cookieName));
    if (!req.actor) throw new AppError(401, 'AUTH_REQUIRED', 'Entre para acessar o Studio.');
    next();
  };
}
export function permit(permission) {
  return (req, _res, next) => { requirePermission(req.actor, permission); next(); };
}
export function createLoginLimiter() {
  const buckets = new Map();
  let active = 0;
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key);
    const key = req.ip;
    const entry = buckets.get(key) || { count: 0, expires: now + 15 * 60 * 1000 };
    if (entry.count >= 10 || active >= 2 || (buckets.size >= 500 && !buckets.has(key))) {
      res.set('Retry-After', '900');
      throw new AppError(429, 'LOGIN_LIMIT', 'Muitas tentativas. Aguarde antes de tentar novamente.');
    }
    entry.count++;
    buckets.set(key, entry);
    active++;
    let released = false;
    const release = () => { if (!released) { active--; released = true; } };
    res.once('finish', release); res.once('close', release);
    next();
  };
}
