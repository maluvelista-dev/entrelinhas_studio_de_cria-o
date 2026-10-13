import { useRef, useState } from 'react';
import { api } from '../api.js';
import { Button } from './ui/Button.jsx';

export function PageArtUpload({ book, disabled, onImported, onWorking }) {
  const picker = useRef(null);
  const [file, setFile] = useState(null), [working, setWorking] = useState(false), [error, setError] = useState('');
  async function upload() {
    if (!file) return;
    if (!['image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Selecione PNG ou WebP de até 10 MB.'); return; }
    setWorking(true); onWorking(true); setError('');
    try {
      const body = new FormData(); body.append('file', file); body.append('name', file.name.replace(/\.[^.]+$/, '').slice(0, 200) || 'Arte da página'); body.append('kind', 'BACKGROUND'); body.append('ownerBookId', book.id);
      const asset = await api('/internal/assets', { method:'POST', body });
      const items = await api('/internal/library');
      const item = items.find(value => value.assetId === asset.id);
      if (!item) throw new Error('A imagem foi importada. Selecione-a na Biblioteca para inseri-la.');
      onImported(item, asset, items); setFile(null); picker.current.value = '';
    } catch (failure) { setError(failure.message); } finally { setWorking(false); onWorking(false); }
  }
  return <fieldset disabled={disabled || working} className="form-stack">
    <label>Imagem da arte da página<input ref={picker} type="file" accept="image/png,image/webp,.png,.webp" onChange={event=>setFile(event.target.files?.[0] || null)}/><small>PNG/WebP até 10 MB e 4096 × 4096 pixels. A imagem será cadastrada nos cenários deste livro.</small></label>
    {error && <p role="alert">{error}</p>}
    <Button type="button" disabled={!file} onClick={upload}>{working?'Importando arte…':'Importar e inserir arte'}</Button>
  </fieldset>;
}
