import { BookOpen } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge.jsx';
export function BookCard({ book, index = 0, busy, onOpen }) {
  return <button className="book-card" disabled={busy} onClick={() => onOpen(book.id)}>
    <div className={'book-cover cover-' + (index % 4)}>
      <BookOpen aria-hidden="true" className="cover-art" />
      <span className="cover-kicker">ENTRELINHAS · HISTÓRIAS</span>
      <strong>{book.title}</strong>
      <small>Versão {book.version} · Capa não exibida</small>
    </div>
    <div className="book-card-details">
      <h3>{book.title}</h3>
      <StatusBadge status={book.status} />
      <p>{book.pageCount} páginas</p>
      <p>Última edição: {new Date(book.updatedAt).toLocaleDateString('pt-BR')}</p>
    </div>
  </button>;
}
