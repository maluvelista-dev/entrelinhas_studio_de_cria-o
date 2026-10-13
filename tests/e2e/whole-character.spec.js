import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { assertTestDatabase, readConfig } from '../../apps/api/src/config.js';
import { createPool } from '../../apps/api/src/infrastructure/database/pool.js';
import { createAuthService } from '../../apps/api/src/modules/auth/service.js';

test('cadastra PNG inteiro pequeno sem exigir partes ou articulações', async ({ page, context, baseURL }) => {
  assertTestDatabase();
  const pool = createPool(readConfig().database);
  try {
    const session = await createAuthService(pool).login({ username: process.env.E2E_USERNAME, password: process.env.E2E_PASSWORD });
    await context.addCookies([{ name: 'studio_session', value: session.token, url: baseURL, httpOnly: true, sameSite: 'Strict' }]);
  } finally { await pool.end(); }
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Biblioteca/ }).click();
  const name = 'Personagem inteiro ' + Date.now();
  await page.getByLabel('Nome do elemento').fill(name);
  await page.getByRole('button', { name: 'Criar personagem e adicionar imagens' }).click();
  await page.getByRole('button', { name: /Frente.*Abrir imagens e partes/ }).click();
  await expect(page.getByLabel('Pivô X', { exact: true })).toBeHidden();
  await expect(page.getByLabel('Nome da pose', { exact: true })).toBeHidden();
  const buffer = await sharp({ create: { width: 240, height: 320, channels: 4, background: '#33bb99' } }).png().toBuffer();
  expect(buffer.length).toBeLessThan(3 * 1024);
  await page.getByLabel('Enviar imagem inteira desta perspectiva').setInputFiles({ name: 'inteiro.png', mimeType: 'image/png', buffer });
  await page.getByRole('button', { name: 'Salvar imagem', exact: true }).click();
  await expect(page.getByText(/^Imagem salva\./)).toBeVisible();
  const catalog = await (await page.request.get('/api/internal/library')).json();
  const character = catalog.find(item => item.name === name);
  const saved = await (await page.request.get('/api/internal/library/' + character.id + '/rig')).json();
  expect(saved.definition).toMatchObject({ width: 240, height: 320 });
  expect(saved.definition.perspectives).toHaveLength(1);
  expect(saved.definition.perspectives[0].parts).toHaveLength(1);
  expect(saved.definition.perspectives[0].anchors).toEqual([]);
  expect(saved.definition.perspectives[0].parts[0].assetId).toBeTruthy();
  await page.reload();
  await page.getByRole('button', { name: /Biblioteca/ }).click();
  await page.getByRole('button', { name: 'Abrir ' + name, exact: true }).click();
  await page.getByRole('button', { name: 'Perspectivas e partes' }).click();
  await expect(page.getByRole('img', { name: 'Prévia de Frente' })).toBeVisible();
  await page.screenshot({ path: '.local/qa-character-perspectives.png', fullPage: true });
  await page.getByRole('button', { name: /Frente.*Abrir imagens e partes/ }).click();
  await expect(page.getByRole('img', { name: 'Montagem do personagem no Engine' })).toBeVisible();
  await page.screenshot({ path: '.local/qa-character-whole.png', fullPage: true });
  expect(errors).toEqual([]);
});
