import { AppError } from '../../errors.js';

export function assertEditable(status) {
  if (status !== 'DRAFT') throw new AppError(409, 'NOT_EDITABLE', 'Devolva o livro a rascunho antes de editar.');
}
export function assertRevision(actual, expected) {
  if (actual !== expected) throw new AppError(409, 'REVISION_CONFLICT', 'O livro foi alterado. Recarregue antes de tentar novamente.');
}
export function assertTransition(from, to) {
  if (!((from === 'DRAFT' && to === 'REVIEW') || (from === 'REVIEW' && to === 'DRAFT'))) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Transição indisponível. Publicação ainda não está habilitada.');
  }
}
export function assertPageOrder(existingIds, desiredIds) {
  const unique = new Set(desiredIds);
  if (unique.size !== existingIds.length || desiredIds.length !== existingIds.length ||
      existingIds.some(id => !unique.has(id))) {
    throw new AppError(422, 'INVALID_ORDER', 'Informe cada página deste livro exatamente uma vez.');
  }
}
