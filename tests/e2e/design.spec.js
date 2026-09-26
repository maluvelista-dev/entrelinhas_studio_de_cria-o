import { test, expect } from '@playwright/test';
test('Tema A: telas existentes nas três resoluções desktop', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: '.local/theme-a-login.png', fullPage: true });
  await page.getByLabel('Usuário', { exact: true }).fill(process.env.E2E_USERNAME);
  await page.getByLabel('Senha', { exact: true }).fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  for (const [width, height] of [[1366, 768], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: /Meus livros/ }).click();
    await expect(page.getByRole('heading', { name: 'Sua estante' })).toBeVisible();
    await page.screenshot({ path: '.local/theme-a-books-' + width + '.png', fullPage: true });
    await page.getByRole('button', { name: /Novo livro/ }).click();
    await page.getByLabel('Título do livro').fill('Uma história com título longo: a aventura de Luna, Pingo e Teca na floresta das estrelas');
    await page.getByLabel('Identificador (slug)').fill('teste-visual');
    await page.getByLabel('Idade mínima').fill('8');
    await page.getByLabel('Idade máxima').fill('4');
    await page.getByRole('button', { name: 'Criar livro', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('idades');
    await page.screenshot({ path: '.local/theme-a-form-' + width + '.png', fullPage: true });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: /Biblioteca/ }).click();
    await expect(page.getByRole('heading', { name: 'Adicionar ao catálogo' })).toBeVisible();
    await page.screenshot({ path: '.local/theme-a-library-' + width + '.png', fullPage: true });
    await page.getByRole('button', { name: /Acessos/ }).click();
    await expect(page.getByRole('heading', { name: 'Novo acesso' })).toBeVisible();
    await page.screenshot({ path: '.local/theme-a-access-' + width + '.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
