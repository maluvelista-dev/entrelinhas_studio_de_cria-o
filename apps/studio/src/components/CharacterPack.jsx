import { useState } from 'react';
import { api } from '../api.js';
import { Button } from './ui/Button.jsx';
export function PackImport({ books, busy, onImport }) {
  const [file, setFile] = useState(null), [owner, setOwner] = useState(''), [error, setError] = useState(''), [key, setKey] = useState(0);
  return <section className="panel illustration-import"><h2>Importar personagem completo</h2><p className="muted">Traga um arquivo .character.json exportado pelo Studio, com imagens, perspectivas e animações. Limite: 25 MB por pacote. Para cadastrar um PNG, use “Começar com um PNG” ou envie a imagem na perspectiva do personagem.</p>
    <fieldset disabled={busy} className="rig-inline"><label>Pacote do personagem (.character.json)<input key={key} type="file" accept=".character.json,application/json" onChange={event => setFile(event.target.files?.[0] || null)} /></label>
    <label>Disponibilidade do personagem importado<select value={owner} onChange={event => setOwner(event.target.value)}><option value="">Global · todos os livros</option>{books.filter(book => book.status === 'DRAFT').map(book => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label>
    <Button type="button" disabled={!file} onClick={async () => { setError(''); if (!file.name.endsWith('.character.json') || file.size > 25 * 1024 * 1024) { setError('Selecione um pacote .character.json de até 25 MB.'); return; } const data = new FormData(); data.append('ownerBookId', owner); data.append('file', file); if (await onImport(data)) { setFile(null); setKey(value => value+1); } }}>Importar personagem completo</Button></fieldset>
    {error && <p role="alert">{error}</p>}
  </section>;
}
export function PackExport({ item, busy }) {
  const [working, setWorking] = useState(false), [error, setError] = useState('');
  return <><Button type="button" className="button secondary" disabled={busy || working} onClick={async () => {
    setWorking(true); setError('');
    try { const pack = await api('/internal/library/' + item.id + '/pack'); const url = URL.createObjectURL(new Blob([JSON.stringify(pack)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'character-' + item.id + '.character.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error.message); } finally { setWorking(false); }
  }}>{working ? 'Preparando pacote…' : 'Exportar personagem salvo'}</Button>{error && <p role="alert">{error}</p>}</>;
}
