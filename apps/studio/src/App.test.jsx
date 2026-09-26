// @vitest-environment jsdom
import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.jsx';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('mostra falha da API e permite recarregar', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch', fetch);
  render(<App user={{ displayName: "Editor", role: "EDITOR", permissions: ["books:read", "books:write", "library:read"] }} onLogout={() => {}} />);
  expect((await screen.findByRole('alert')).textContent).toContain('conectar');
  fetch.mockResolvedValue({ ok: true, json: async () => [] });
  await userEvent.click(screen.getByRole('button', { name: 'Recarregar' }));
  expect(await screen.findByText('A próxima grande história é sua')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
it('erro ao salvar mantém o formulário e o texto para nova tentativa', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_path, options) => ({
    ok: options.method !== 'POST',
    json: async () => options.method === 'POST' ?
      { error: { code: 'DUPLICATE', message: 'Este identificador já está em uso.' } } : [],
  })));
  render(<App user={{ displayName: "Editor", role: "EDITOR", permissions: ["books:read", "books:write", "library:read"] }} onLogout={() => {}} />);
  await screen.findByText('A próxima grande história é sua');
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Novo livro/ }));
  await user.type(screen.getByLabelText('Título do livro'), 'Meu livro');
  await user.type(screen.getByLabelText(/Identificador/), 'meu-livro');
  await user.click(screen.getByRole('button', { name: 'Criar livro', exact: true }));
  expect((await screen.findByRole('alert')).textContent).toContain('já está em uso');
  expect(screen.getByLabelText('Título do livro').value).toBe('Meu livro');
});
