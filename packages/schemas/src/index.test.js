import { describe, it, expect } from 'vitest';
import { createBookSchema, ageRangeSchema, pageDocumentSchema, emptyPage, librarySchema } from './index.js';
describe('contratos versionados', () => {
  it('valida faixa etária, slug e campos desconhecidos', () => {
    expect(ageRangeSchema.safeParse({ min: 8, max: 3 }).success).toBe(false);
    expect(ageRangeSchema.safeParse({ min: 3, max: 8 }).success).toBe(true);
    for (const slug of ['LIVRO', '../livro', 'a b']) {
      expect(createBookSchema.safeParse({ title: 'Livro', slug }).success).toBe(false);
    }
    expect(createBookSchema.safeParse({ title: 'Livro', slug: 'livro', status: 'PUBLISHED' }).success).toBe(false);
  });
  it('preserva Unicode e recusa cenas não suportadas e versões desconhecidas', () => {
    const document = emptyPage('Olá, coração! 🌳');
    expect(pageDocumentSchema.parse(JSON.parse(JSON.stringify(document)))).toEqual(document);
    expect(pageDocumentSchema.safeParse({ ...document, schemaVersion: 2 }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ ...document, scene: { schemaVersion: 1, entities: [{}] } }).success).toBe(false);
    expect(librarySchema.safeParse({ kind: 'SCRIPT', name: 'código' }).success).toBe(false);
  });
});
