import { useState } from 'react';
import { AssetImage } from './AssetImage.jsx';
import { Button } from './ui/Button.jsx';
export function LibraryDetail({ item, assets, editable, busy, onDirty, onSave, onClose, onReload, onRigOpen }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [assetId, setAsset] = useState(item.assetId || '');
  const eligible = assets.filter(asset => (!asset.ownerBookId || asset.ownerBookId === item.ownerBookId) && asset.mediaType.startsWith(item.kind === 'AUDIO' ? 'audio/' : 'image/'));
  return <section className="panel library-detail" aria-label="Detalhes do elemento">
    <div className="section-heading"><div><h2>{item.name}</h2><p className="muted">{editable ? 'Atualize o nome, a descrição e a imagem do cadastro.' : 'Consulta do cadastro. Edição indisponível para seu perfil ou para livro em revisão.'}</p></div>
      <Button type="button" className="button secondary" disabled={busy} onClick={onClose}>Voltar ao catálogo</Button></div>
    {item.kind === 'CHARACTER' && <Button type="button" className="button secondary" disabled={busy} onClick={onRigOpen}>Perspectivas e partes</Button>}
    <form className="form-stack" onChange={() => onDirty(true)} onSubmit={async event => { event.preventDefault(); await onSave({ name, description, assetId: assetId || null, revision: item.revision }); }}>
      <fieldset disabled={busy || !editable} className="form-stack">
        <label>Nome do elemento<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Descrição do elemento<textarea rows={5} maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} /></label>
        <label>{item.kind === 'AUDIO' ? 'Áudio do elemento' : 'Imagem do elemento'}<select value={assetId} onChange={event => setAsset(event.target.value)}>
          <option value="">Sem arquivo vinculado</option>{eligible.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
        </select><small>Selecione um arquivo da Biblioteca. Para importar outra imagem, volte ao catálogo.</small></label>
      </fieldset>
      {assetId && item.kind !== 'AUDIO' && <AssetImage id={assetId} alt={'Imagem de ' + name} className="cover-preview" />}
      <div className="form-actions"><Button type="button" className="button secondary" disabled={busy} onClick={onReload}>Recarregar cadastro</Button>
        {editable && <Button disabled={busy}>{busy ? 'Salvando…' : 'Salvar cadastro'}</Button>}</div>
    </form>
  </section>;
}
