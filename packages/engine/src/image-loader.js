import { Texture } from 'pixi.js';
// Sources are application-registered PNG/WebP resources, not character JSON fields.
export async function loadImageTexture(descriptor) {
  const url = new URL(descriptor.source, globalThis.location.href);
  const embedded = /^data:image\/(png|webp);base64,/.test(descriptor.source);
  const privateImage = /^\/api\/internal\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/content$/i.test(url.pathname) && !url.search && !url.hash;
  if (!embedded && (url.origin !== globalThis.location.origin || (!/\.(png|webp)$/i.test(url.pathname) && !privateImage))) throw new Error('Origem ou formato de imagem não permitido.');
  const image = new globalThis.Image();
  image.src = url.href;
  await image.decode();
  if (image.naturalWidth > 4096 || image.naturalHeight > 4096) throw new Error('Imagem excede o limite de dimensões.');
  return Texture.from(image);
}
