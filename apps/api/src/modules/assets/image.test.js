import sharp from 'sharp';
import { expect, test } from 'vitest';
import { normalizeImage, IMAGE_BYTE_LIMIT } from './image.js';
const pixels = { create: { width: 24, height: 16, channels: 4, background: '#6399cc80' } };
test('decodes and rewrites PNG and WebP, retaining dimensions and alpha without EXIF', async () => {
  for (const format of ['png', 'webp']) {
    const buffer = await sharp(pixels).withExif({ IFD0: { Artist: 'private metadata' } }).toFormat(format).toBuffer();
    const image = await normalizeImage({ buffer, originalname: 'arte.' + format, mimetype: 'image/' + format });
    expect(image).toMatchObject({ width: 24, height: 16, mediaType: 'image/' + format });
    const metadata = await sharp(image.bytes).metadata();
    expect(metadata.exif).toBeUndefined(); expect(metadata.hasAlpha).toBe(true);
  }
});
test('rejects forged, corrupt, oversized and dimension-exceeding images', async () => {
  const png = await sharp(pixels).png().toBuffer();
  for (const file of [
    { buffer: Buffer.from('<svg onload="alert(1)"></svg>'), originalname: 'fake.png', mimetype: 'image/png' },
    { buffer: png, originalname: 'fake.webp', mimetype: 'image/webp' },
    { buffer: png.subarray(0, 30), originalname: 'broken.png', mimetype: 'image/png' },
    { buffer: Buffer.alloc(IMAGE_BYTE_LIMIT + 1), originalname: 'large.png', mimetype: 'image/png' },
    { buffer: await sharp({ create: { width: 4097, height: 1, channels: 3, background: 'white' } }).png().toBuffer(), originalname: 'wide.png', mimetype: 'image/png' },
  ]) await expect(normalizeImage(file)).rejects.toHaveProperty('status');
});
