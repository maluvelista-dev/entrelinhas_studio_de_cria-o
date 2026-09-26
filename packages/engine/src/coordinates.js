function finite(...values) {
  if (!values.every(Number.isFinite)) throw new Error('Coordenadas devem ser finitas.');
}
function dimensions({ width, height }) {
  finite(width, height);
  if (width <= 0 || height <= 0) throw new Error('Dimensões devem ser positivas.');
}
export function normalizedToPixels({ x, y }, size) {
  dimensions(size); finite(x, y);
  return { x: x * size.width, y: y * size.height };
}
export function pixelsToNormalized({ x, y }, size) {
  dimensions(size); finite(x, y);
  return { x: x / size.width, y: y / size.height };
}
// Affine matrices: [a, b, c, d, tx, ty]; angles in radians, Y down.
export function composeTransform({ x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1, pivotX = 0, pivotY = 0 } = {}) {
  finite(x, y, rotation, scaleX, scaleY, pivotX, pivotY);
  const a = Math.cos(rotation) * scaleX, b = Math.sin(rotation) * scaleX;
  const c = -Math.sin(rotation) * scaleY, d = Math.cos(rotation) * scaleY;
  return [a, b, c, d, x - pivotX * a - pivotY * c, y - pivotX * b - pivotY * d];
}
export function multiply(p, m) {
  finite(...p, ...m);
  return [p[0]*m[0]+p[2]*m[1], p[1]*m[0]+p[3]*m[1],
    p[0]*m[2]+p[2]*m[3], p[1]*m[2]+p[3]*m[3],
    p[0]*m[4]+p[2]*m[5]+p[4], p[1]*m[4]+p[3]*m[5]+p[5]];
}
export function localToWorld({ x, y }, m) {
  finite(x, y, ...m);
  return { x: m[0]*x + m[2]*y + m[4], y: m[1]*x + m[3]*y + m[5] };
}
export function worldToLocal({ x, y }, m) {
  finite(x, y, ...m);
  const det = m[0]*m[3] - m[1]*m[2];
  if (Math.abs(det) < 1e-12) throw new Error('Transformação não invertível.');
  const dx = x-m[4], dy = y-m[5];
  return { x: (m[3]*dx-m[2]*dy)/det, y: (-m[1]*dx+m[0]*dy)/det };
}
