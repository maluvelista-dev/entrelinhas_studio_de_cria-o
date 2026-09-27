import { test, expect } from '@playwright/test';
test('personagem: sprites, perspectivas, anchors e desmontagem', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByLabel('Usuário', { exact: true }).fill(process.env.E2E_USERNAME);
  await page.getByLabel('Senha', { exact: true }).fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: /Visualização/ }).click();
  await page.getByRole('tab', { name: 'Personagem', exact: true }).click();
  await expect(page.getByText('Personagem renderizado.', { exact: true })).toBeVisible();
  const canvas = page.getByRole('img', { name: 'Personagem com hierarquia, pivôs e anchors' });
  await expect(canvas).toHaveCount(1);
  const hand = await canvas.evaluate(element => {
    const gl = element.getContext('webgl2') || element.getContext('webgl');
    const rgba = new Uint8Array(4);
    gl.readPixels(Math.floor(element.width * 284/800), element.height - 1 - Math.floor(element.height * 309.6/520), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return [...rgba];
  });
  expect(hand).toEqual([244, 189, 140, 255]);
  await page.getByText('Coordenadas dos anchors', { exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'original.handRight' })).toContainText('284.0');
  await expect(page.getByRole('row').filter({ hasText: 'comparison.handRight' })).toContainText('400.8');
  for (const [width, height] of [[1366, 768], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: '.local/qa-character-' + width + '.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('combobox', { name: 'Perspectiva', exact: true }).selectOption('side');
  await expect(page.getByText('Personagem renderizado.', { exact: true })).toBeVisible();
  await page.getByLabel('Mostrar pivôs e anchors').uncheck();
  await expect(page.getByText('Personagem renderizado.', { exact: true })).toBeVisible();
  await expect(canvas).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('tab', { name: 'Coordenadas', exact: true }).click();
  await expect(canvas).toHaveCount(0);
  await page.getByRole('tab', { name: 'Personagem', exact: true }).click();
  await expect(page.getByText('Personagem renderizado.', { exact: true })).toBeVisible();
  await expect(canvas).toHaveCount(1);
  expect(errors).toEqual([]);
});
