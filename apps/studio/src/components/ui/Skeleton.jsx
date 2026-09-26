export function Skeleton() {
  return <div className="panel loading" role="status" aria-label="Carregando seu espaço de criação">
    <span className="sr-only">Carregando seu espaço de criação…</span>
    <div className="skeleton-line" /><div className="skeleton-grid">{[0, 1, 2].map(item => <div className="skeleton-card" key={item} />)}</div>
  </div>;
}
