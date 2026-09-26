// @vitest-environment jsdom
import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookForm } from './BookForm.jsx';
afterEach(cleanup);
it('valida idades antes de enviar e preserva os dados digitados', async () => {
  const save = vi.fn();
  const user = userEvent.setup();
  render(<BookForm onSave={save} />);
  await user.type(screen.getByLabelText('Título do livro'), 'A árvore');
  await user.type(screen.getByLabelText(/Identificador/), 'a-arvore');
  await user.type(screen.getByLabelText('Idade mínima'), '7');
  await user.type(screen.getByLabelText('Idade máxima'), '3');
  await user.click(screen.getByRole('button', { name: 'Criar livro' }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole('alert').textContent).toContain('idades');
  await user.clear(screen.getByLabelText('Idade máxima'));
  await user.type(screen.getByLabelText('Idade máxima'), '9');
  await user.click(screen.getByRole('button', { name: 'Criar livro' }));
  expect(save).toHaveBeenCalledWith({ title: 'A árvore', slug: 'a-arvore', description: '', ageRange: { min: 7, max: 9 }, cover: null });
});
