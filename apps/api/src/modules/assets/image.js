import sharp from 'sharp';
import { AppError } from '../../errors.js';
export const IMAGE_BYTE_LIMIT = 10 * 1024 * 1024;
function animatedPng(bytes) {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') return true;
    offset += length + 12;
  }
  return false;
}
export async function normalizeImage(file) {
  if (!file?.buffer?.length) throw new AppError(422, 'FILE_REQUIRED', 'Selecione uma imagem PNG ou WebP.');
  if (file.buffer.length > IMAGE_BYTE_LIMIT) throw new AppError(413, 'IMAGE_TOO_LARGE', 'A imagem deve ter até 10 MB.');
  const png = file.buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = file.buffer.toString('ascii', 0, 4) === 'RIFF' && file.buffer.toString('ascii', 8, 12) === 'WEBP';
  const format = png ? 'png' : webp ? 'webp' : null;
  if (!format || file.mimetype !== 'image/' + format || !file.originalname.toLowerCase().endsWith('.' + format))
    throw new AppError(415, 'INVALID_IMAGE_TYPE', 'Envie PNG ou WebP com formato e extensão correspondentes.');
  try {
    const image = sharp(file.buffer, { limitInputPixels: 4096 * 4096, failOn: 'warning' });
    const meta = await image.metadata();
    if (meta.format !== format || (meta.pages ?? 1) > 1 || meta.loop !== undefined || (png && animatedPng(file.buffer)))
      throw new AppError(422, 'ANIMATED_IMAGE', 'Envie uma imagem estática, sem animação.');
    if (!meta.width || !meta.height || meta.width > 4096 || meta.height > 4096)
      throw new AppError(422, 'IMAGE_DIMENSIONS', 'A imagem deve ter no máximo 4096 × 4096 pixels.');
    const output = image.rotate();
    const { data, info } = await (format === 'png' ? output.png() : output.webp({ lossless: true })).toBuffer({ resolveWithObject: true });
    if (data.length > IMAGE_BYTE_LIMIT) throw new AppError(413, 'IMAGE_TOO_LARGE', 'A imagem processada excede 10 MB. Use uma imagem menor.');
    return { bytes: data, mediaType: 'image/' + format, extension: format, width: info.width, height: info.height };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(422, 'INVALID_IMAGE', 'Imagem inválida, danificada ou acima do limite de pixels.');
  }
}
