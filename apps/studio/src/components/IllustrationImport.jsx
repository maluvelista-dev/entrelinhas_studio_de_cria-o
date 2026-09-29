import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './ui/Button.jsx';
export function IllustrationImport({ books, busy, onImport }) {
  const picker = useRef(null);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('BACKGROUND');
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!file || !['image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Selecione um PNG ou WebP de até 10 MB.'); return;
    }
    const data = new FormData();
    data.append('name', name); data.append('kind', kind); data.append('ownerBookId', owner); data.append('file', file);
    if (await onImport(data)) { setFile(null); setName(''); picker.current.value = ''; }
  }
  return <section className="panel illustration-import">
    <div className="section-heading"><div><h2><Upload aria-hidden="true" size={22} /> Importar ilustração</h2>
      <p className="muted">A imagem será adicionada à Biblioteca e poderá ser usada como capa.</p></div></div>
    <form onSubmit={submit}><fieldset disabled={busy} className="form-stack">
      <div className="upload-fields">
        <label>Arquivo da ilustração<input ref={picker} type="file" accept="image/png,image/webp,.png,.webp" required
          onChange={event => { const chosen = event.target.files?.[0] || null; setFile(chosen); setError(''); if (chosen && !name) setName(chosen.name.replace(/\.[^.]+$/, '').slice(0, 200)); }} />
          <small>PNG ou WebP estático · até 10 MB · até 4096 × 4096 pixels.</small></label>
        <label>Nome da ilustração<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Tipo da ilustração<select value={kind} onChange={event => setKind(event.target.value)}>
          <option value="BACKGROUND">Cenário</option><option value="CHARACTER">Personagem</option><option value="OBJECT">Objeto</option>
        </select></label>
        <label>Disponibilidade da ilustração<select value={owner} onChange={event => setOwner(event.target.value)}>
          <option value="">Global · todos os livros</option>
          {books.filter(book => book.status === 'DRAFT').map(book => <option key={book.id} value={book.id}>{book.title}</option>)}
        </select></label>
      </div>
      {error && <p role="alert" className="inline-error">{error}</p>}
      <div className="form-actions"><Button type="submit" disabled={busy || !file}>{busy ? 'Importando…' : 'Importar imagem'}</Button></div>
    </fieldset></form>
  </section>;
}
