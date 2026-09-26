import { test, expect } from '@playwright/test';
test('Engine renders, resizes and releases its canvas when navigating', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Usuário', { exact: true }).fill(process.env.E2E_USERNAME);
  await page.getByLabel('Senha', { exact: true }).fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: /Visualização/ }).click();
  await expect(page.getByText('Cena renderizada.', { exact: true })).toBeVisible();
  const canvas = page.getByRole('img', { name: 'Cena de validação do Engine' });
  await expect(canvas).toHaveCount(1);
  // Read actual WebGL pixels: the center must be the green parent, not a blank canvas.
  const pixel = await canvas.evaluate(element => {
    const gl = element.getContext('webgl2') || element.getContext('webgl');
    const rgba = new Uint8Array(4);
    gl.readPixels(Math.floor(element.width/2), Math.floor(element.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return [...rgba];
  });
  expect(pixel).toEqual([57, 119, 103, 255]);
  await page.screenshot({ path: '.local/qa-engine.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => canvas.evaluate(element => element.width)).toBeLessThan(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Meus livros/ }).click();
  await expect(canvas).toHaveCount(0);
  await page.getByRole('button', { name: /Visualização/ }).click();
  await expect(page.getByText('Cena renderizada.', { exact: true })).toBeVisible();
  await expect(canvas).toHaveCount(1);
  expect(errors).toEqual([]);
});
