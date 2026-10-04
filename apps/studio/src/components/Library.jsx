import { PackImport } from './CharacterPack.jsx';
import { RigEditor } from './RigEditor.jsx';
import { IllustrationImport } from './IllustrationImport.jsx';
import { LibraryDetail } from './LibraryDetail.jsx';
import { AssetImage } from './AssetImage.jsx';
import { Button } from './ui/Button.jsx';
import { BookOpen, UserRound, Shapes, Trees, AudioLines } from 'lucide-react';
import { useState } from "react";
const icons = { CHARACTER: UserRound, OBJECT: Shapes, BACKGROUND: Trees, AUDIO: AudioLines };
const labels = {
  CHARACTER: "Personagem",
  OBJECT: "Objeto",
  BACKGROUND: "Cenário",
  AUDIO: "Áudio",
};
export function Library({
  items,
  books,
  assets,
  busy,
  onCreate,
  canWrite = false,
  onImport, onPackImport, onRead, onUpdate, onRigUpdate, onRigUpload, dirty, onDirty,
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("CHARACTER");
  const [ownerBookId, setOwner] = useState("");
  const [assetId, setAsset] = useState("");
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(null);
  const [rigOpen, setRigOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [detailLoad, setDetailLoad] = useState(0);
  const [error, setError] = useState('');
  const categories = { CHARACTER: 'Personagens', BACKGROUND: 'Cenários', OBJECT: 'Objetos', AUDIO: 'Áudios' };
  function leave() { return !dirty || window.confirm('Descartar alterações ainda não salvas?'); }
  function chooseKind(next) {
    if (busy || reading || !leave()) return false;
    onDirty(false); setSelected(null); setRigOpen(false); setKind(next); setAsset(''); setName(''); setDescription(''); setError('');
    return true;
  }
  async function open(id, check = true) {
    if (busy || reading || (check && !leave())) return;
    setReading(true); setError('');
    try { setSelected(await onRead(id)); setDetailLoad(value => value + 1); onDirty(false); }
    catch (failure) { setError(failure.message); }
    finally { setReading(false); }
  }
  const visibleItems = items.filter(item => item.kind === kind);
  async function submit(event) {
    event.preventDefault();
    const ok = await onCreate({
      name,
      description,
      kind,
      ownerBookId: ownerBookId || null,
      assetId: assetId || null,
    });
    if (ok) {
      setName("");
      setDescription("");
      setAsset("");
    }
  }
  const eligibleAssets = assets.filter(
    (asset) =>
      (!asset.ownerBookId || asset.ownerBookId === ownerBookId) &&
      asset.mediaType.startsWith(kind === "AUDIO" ? "audio/" : "image/"),
  );
  return (
    <>
      <div className="tabs library-tabs" role="tablist" aria-label="Categorias da Biblioteca">
        {Object.entries(categories).map(([value, label]) => <button key={value} id={'category-' + value} role="tab" aria-selected={kind === value} aria-controls="library-category" tabIndex={kind === value ? 0 : -1} disabled={busy || reading}
          onKeyDown={event => {
            const keys = Object.keys(categories); const index = keys.indexOf(value);
            const next = event.key === 'ArrowRight' ? keys[(index + 1) % keys.length] : event.key === 'ArrowLeft' ? keys[(index + keys.length - 1) % keys.length] : event.key === 'Home' ? keys[0] : event.key === 'End' ? keys.at(-1) : null;
            if (next) { event.preventDefault(); if (chooseKind(next)) document.getElementById('category-' + next)?.focus(); }
          }}
          onClick={() => chooseKind(value)}>{label} <span>({items.filter(item => item.kind === value).length})</span></button>)}
      </div>
      <div id="library-category" role="tabpanel" aria-labelledby={'category-' + kind}>
      {error && <p role="alert" className="inline-error">{error}</p>}
      {reading && <p role="status">Carregando cadastro…</p>}
      {selected ? rigOpen ? <RigEditor key={selected.id} item={selected} assets={assets} busy={busy || reading} dirty={dirty} onDirty={onDirty}
        editable={canWrite && (!selected.ownerBookId || books.find(book => book.id === selected.ownerBookId)?.status === 'DRAFT')}
        onUpload={(view, part, input) => onRigUpload(selected.id, view, part, input)}
        onSave={input => onRigUpdate(selected.id, input)} onBack={async () => { if (!leave()) return; onDirty(false); setRigOpen(false); await open(selected.id, false); }} /> : <LibraryDetail key={detailLoad} item={selected} assets={assets} busy={busy || reading}
        onRigOpen={() => { if (leave()) { onDirty(false); setRigOpen(true); } }}
        editable={canWrite && (!selected.ownerBookId || books.find(book => book.id === selected.ownerBookId)?.status === 'DRAFT')}
        onDirty={onDirty} onClose={() => { if (leave()) { setSelected(null); onDirty(false); } }} onReload={() => open(selected.id)}
        onSave={async input => { if (await onUpdate(selected.id, input)) { onDirty(false); await open(selected.id, false); } }} /> : <>
      {canWrite && kind === 'CHARACTER' && <PackImport books={books} busy={busy} onImport={onPackImport} />}
      {canWrite && kind !== 'AUDIO' && <IllustrationImport key={kind} fixedKind={kind} books={books} busy={busy} onImport={onImport} />}
    <div className="library-layout">
      <section className="panel library-form">
        <h2>Adicionar ao catálogo</h2>
        <p className="muted">Organize os elementos das suas histórias.</p>
        <fieldset disabled={busy || !canWrite}>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Nome do elemento
              <input
                required
                maxLength={200}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Raposa Luna"
              />
            </label>
            <label>
              Tipo
              <select
                value={kind}
                onChange={(event) => {
                  chooseKind(event.target.value);
                }}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>Descrição do elemento<textarea rows={3} maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} /></label>
            <label>
              Disponibilidade
              <select
                value={ownerBookId}
                onChange={(event) => {
                  setOwner(event.target.value);
                  setAsset("");
                }}
              >
                <option value="">Global · todos os livros</option>
                {books
                  .filter((book) => book.status === "DRAFT")
                  .map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Asset cadastrado
              <select
                value={assetId}
                onChange={(event) => setAsset(event.target.value)}
              >
                <option value="">Somente metadados</option>
                {eligibleAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <Button className="button" disabled={busy}>
              {busy ? "Cadastrando…" : "Cadastrar elemento"}
            </Button>
          </form>
        </fieldset>
        {!canWrite && (
          <p className="notice">
            Seu perfil tem acesso de consulta ao catálogo.
          </p>
        )}
        <p className="footnote">
          Admin e Editor podem importar ilustrações na Biblioteca. A montagem de cenas virá na fase 6.
        </p>
      </section>
      <section className="panel catalog">
        <div className="section-heading">
          <h2>{categories[kind]}</h2>
          <span>{visibleItems.length} itens</span>
        </div>
        {!visibleItems.length ? (
          <div className="empty small">
            <span className="empty-mark"><BookOpen aria-hidden="true" size={40} /></span>
            <h3>Um universo para criar</h3>
            <p>Cadastre seu primeiro personagem, objeto, cenário ou áudio.</p>
          </div>
        ) : (
          <ul className="catalog-list">
            {visibleItems.map((item) => (
              <li key={item.id}>
                {item.assetId && assets.find(asset => asset.id === item.assetId)?.mediaType.startsWith("image/") ? <AssetImage id={item.assetId} alt={item.name} className="library-thumbnail" /> : <span className="asset-symbol">
                  {(() => { const Icon = icons[item.kind]; return <Icon aria-hidden="true" size={20} />; })()}
                </span>}
                <div>
                  <button type="button" className="catalog-open" disabled={busy || reading} onClick={() => open(item.id)} aria-label={"Abrir " + item.name}>{item.name}</button>
                  <small>
                    {labels[item.kind]} ·{" "}
                    {item.ownerBookId
                      ? books.find((book) => book.id === item.ownerBookId)
                          ?.title || "Livro exclusivo"
                      : "Biblioteca global"}
                  </small>
                </div>
                <span className="badge neutral">
                  {item.assetId ? "Asset vinculado" : "Metadados"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </>}
    </div>
    </>
  );
}
