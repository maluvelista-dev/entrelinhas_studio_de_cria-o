import { describe, it, expect } from 'vitest';
import { assertEditable, assertPageOrder, assertRevision, assertTransition } from './rules.js';
describe('regras editoriais', () => {
  it('permite apenas rascunho e revisão nesta fase', () => {
    expect(() => assertTransition('DRAFT', 'REVIEW')).not.toThrow();
    expect(() => assertTransition('REVIEW', 'DRAFT')).not.toThrow();
    for (const [from, to] of [['DRAFT', 'PUBLISHED'], ['REVIEW', 'READY_TO_PUBLISH'], ['DRAFT', 'DRAFT']]) {
      expect(() => assertTransition(from, to)).toThrow();
    }
    expect(() => assertEditable('REVIEW')).toThrow();
    expect(() => assertEditable('PUBLISHED')).toThrow();
  });
  it('não aceita revisão desatualizada ou reordenação parcial/duplicada', () => {
    expect(() => assertRevision(2, 1)).toThrow();
    expect(() => assertPageOrder(['a', 'b'], ['b', 'a'])).not.toThrow();
    for (const order of [['a'], ['a', 'a'], ['a', 'c']]) expect(() => assertPageOrder(['a', 'b'], order)).toThrow();
  });
});
