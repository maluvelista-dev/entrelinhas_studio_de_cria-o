import { describe, it, expect } from 'vitest';
import { assertEditable, assertPageOrder, assertRevision, assertTransition } from './rules.js';
describe('regras editoriais', () => {
  it('permite revisão e aprovação, mas não publicação ou salto de etapas', () => {
    expect(() => assertTransition('DRAFT', 'REVIEW')).not.toThrow();
    expect(() => assertTransition('REVIEW', 'DRAFT')).not.toThrow();
    expect(() => assertTransition('REVIEW', 'READY_TO_PUBLISH')).not.toThrow();
    expect(() => assertTransition('READY_TO_PUBLISH', 'DRAFT')).not.toThrow();
    for (const [from, to] of [['DRAFT', 'PUBLISHED'], ['DRAFT', 'READY_TO_PUBLISH'], ['READY_TO_PUBLISH', 'PUBLISHED'], ['DRAFT', 'DRAFT']]) {
      expect(() => assertTransition(from, to)).toThrow();
    }
    expect(() => assertEditable('REVIEW')).toThrow();
    expect(() => assertEditable('PUBLISHED')).toThrow();
    expect(() => assertEditable('READY_TO_PUBLISH')).toThrow();
  });
  it('não aceita revisão desatualizada ou reordenação parcial/duplicada', () => {
    expect(() => assertRevision(2, 1)).toThrow();
    expect(() => assertPageOrder(['a', 'b'], ['b', 'a'])).not.toThrow();
    for (const order of [['a'], ['a', 'a'], ['a', 'c']]) expect(() => assertPageOrder(['a', 'b'], order)).toThrow();
  });
});
