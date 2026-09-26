import { it, expect } from 'vitest';
import { emptyPage } from '@studio/schemas';
import { serializeUser, serializeBook, serializeBookSummary, serializePage, serializeLibraryItem, serializeAsset } from './serializers.js';
it('campos novos/sensíveis nunca se propagam para DTOs, inclusive estruturas aninhadas', () => {
  const secret = { password_hash: 'SENSITIVE', password: 'SENSITIVE', token: 'SENSITIVE', token_hash: 'SENSITIVE',
    storage_key: 'SENSITIVE', dbPassword: 'SENSITIVE', internal: { secret: 'SENSITIVE' } };
  expect(JSON.stringify(serializeUser({ ...secret, id: 'u', username: 'name', display_name: 'Nome', role: 'EDITOR', active: true }))).not.toContain('SENSITIVE');
  const page = { ...emptyPage('Texto permitido'), ...secret, content: { text: 'Texto permitido', ...secret },
    scene: { schemaVersion: 1, entities: [], ...secret } };
  const book = { ...secret, pages: [page], ageRange: { min: 3, max: 7, ...secret }, history: [{ ...secret, comment: 'Revisar' }] };
  for (const value of [serializePage(page), serializeBook(book), serializeBookSummary(secret), serializeLibraryItem(secret), serializeAsset(secret)]) {
    expect(JSON.stringify(value)).not.toContain('SENSITIVE');
  }
  expect(serializeBook(book).pages[0].content).toEqual({ text: 'Texto permitido', narration: null });
});
