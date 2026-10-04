import { MotionWorkbench } from './MotionWorkbench.jsx';
import { useEffect, useState } from 'react';
import { characterSchema } from '@studio/schemas/character';
import { localToWorld } from '@studio/engine';
import { api } from '../api.js';
import { Button } from './ui/Button.jsx';
import { RigCanvas } from './RigCanvas.jsx';
import { newDefinition, newPart, descendants, previewRig, pivotAt } from './rig-model.js';
const validId = /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/;
function NumberField({ label, value, onChange, min = -100000, max = 100000, step = 'any' }) {
  return <label>{label}<input type="number" min={min} max={max} step={step} value={Number(value.toFixed(5))} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value)) onChange(value); }} /></label>;
}
export function RigEditor({ item, assets, editable, busy, dirty, onDirty, onSave, onUpload, onBack }) {
  const [saved, setSaved] = useState(null), [definition, setDefinition] = useState(null);
  const [viewId, setViewId] = useState('front'), [partId, setPartId] = useState('root');
  const [anchorName, setAnchorName] = useState(''), [mode, setMode] = useState('select');
  const [newView, setNewView] = useState('side'), [newPartId, setNewPartId] = useState('body'), [newAnchor, setNewAnchor] = useState('hand');
  const [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [file, setFile] = useState(null), [fileKey, setFileKey] = useState(0);
  function selectPart(id) { setFile(null); setPartId(id); }
  function accept(result) {
    const value = result.definition || newDefinition(item);
    setSaved(result); setDefinition(value); setViewId(value.perspectives[0].id); selectPart(value.perspectives[0].rootId); setAnchorName(''); setMode('select');
  }
  useEffect(() => {
    let active = true;
    api('/internal/library/' + item.id + '/rig').then(result => { if (active) accept(result); })
      .catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Mounted separately for each opened item; a local draft must survive parent list refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  async function reload() {
    if (dirty && !window.confirm('Descartar alterações ainda não salvas?')) return;
    setLoading(true); setError('');
    try { accept(await api('/internal/library/' + item.id + '/rig')); onDirty(false); }
    catch (failure) { setError(failure.message); } finally { setLoading(false); }
  }
  const eligible = [...assets, ...(saved?.assets || [])].filter(asset => (!asset.ownerBookId || asset.ownerBookId === item.ownerBookId) && ['image/png', 'image/webp'].includes(asset.mediaType) && asset.width && asset.height);
  function commit(next) {
    if (!editable || busy) return;
    const result = characterSchema.safeParse(next);
    if (!result.success) { setError('Estrutura inválida: ' + result.error.issues[0].message); return; }
    if (result.data.perspectives.some(view => view.parts.some(part => Math.abs(part.scaleX) < 0.001 || Math.abs(part.scaleY) < 0.001))) { setError('Escalas precisam ter módulo de pelo menos 0,001.'); return; }
    setDefinition(result.data); onDirty(true); setError(''); setNotice('');
  }
  const view = definition?.perspectives.find(view => view.id === viewId);
  const part = view?.parts.find(part => part.id === partId);
  const anchor = view?.anchors.find(anchor => anchor.name === anchorName);
  function changeView(nextView) { commit({ ...definition, perspectives: definition.perspectives.map(view => view.id === viewId ? nextView : view) }); }
  function changePart(nextPart) { changeView({ ...view, parts: view.parts.map(part => part.id === partId ? nextPart : part) }); }
  function changeAnchor(nextAnchor) { changeView({ ...view, anchors: view.anchors.map(anchor => anchor.name === anchorName ? nextAnchor : anchor) }); }
  function addPerspective(copy) {
    if (!validId.test(newView) || definition.perspectives.some(view => view.id === newView)) { setError('Use um identificador único: letras, números, hífen ou sublinhado, começando por letra.'); return; }
    const next = copy ? { ...structuredClone(view), id: newView } : { id: newView, rootId: 'root', parts: [newPart('root')], anchors: [] };
    commit({ ...definition, perspectives: [...definition.perspectives, next] }); setViewId(newView); selectPart(next.rootId); setAnchorName('');
  }
  let character, previewError = '';
  if (definition && view) { try { character = previewRig(definition, viewId, eligible); } catch { previewError = 'Não foi possível montar a prévia. Confira imagens, dimensões e transformações das partes.'; } }
  const node = character?.nodes.find(node => node.partId === partId);
  function numericPivot(axis, value) {
    if (!node) return;
    const pivot = { ...part.pivot, [axis]: value };
    changePart(pivotAt(part, node, localToWorld({ x: pivot.x * node.entity.width, y: pivot.y * node.entity.height }, node.world)));
  }
  if (loading) return <p role="status">Carregando estrutura do personagem…</p>;
  return <section className="panel rig-editor">
    <div className="section-heading"><div><h2>Estrutura de {item.name}</h2><p className="muted">Envie as imagens diretamente na parte de cada perspectiva. Pivôs controlam a rotação; anchors marcam pontos de conexão.</p></div><Button type="button" className="button secondary" disabled={busy} onClick={onBack}>Voltar à ficha</Button></div>
    {error && <p role="alert" className="inline-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!definition ? <Button type="button" onClick={reload}>Tentar novamente</Button> : <>
      <div className="rig-toolbar"><label>Perspectiva do personagem<select value={viewId} disabled={busy} onChange={event => { const view = definition.perspectives.find(view => view.id === event.target.value); setViewId(view.id); selectPart(view.rootId); setAnchorName(''); }}>
        {definition.perspectives.map(view => <option key={view.id} value={view.id}>{({ front: 'Frente', side: 'Lateral', back: 'Costas' })[view.id] || view.id}</option>)}
      </select></label>
      <fieldset disabled={!editable || busy} className="rig-inline"><label>Nova perspectiva<input maxLength={80} value={newView} onChange={event => setNewView(event.target.value)} placeholder="side" /></label>
        <Button type="button" className="button secondary" disabled={definition.perspectives.length >= 8} onClick={() => addPerspective(false)}>Criar perspectiva</Button>
        <Button type="button" className="button secondary" disabled={definition.perspectives.length >= 8} onClick={() => addPerspective(true)}>Duplicar perspectiva</Button>
        <Button type="button" className="button secondary" disabled={definition.perspectives.length === 1} onClick={() => { if (!window.confirm('Remover esta perspectiva e suas partes deste rascunho?')) return; const views = definition.perspectives.filter(value => value.id !== viewId); commit({ ...definition, perspectives: views }); setViewId(views[0].id); selectPart(views[0].rootId); setAnchorName(''); }}>Remover perspectiva</Button>
      </fieldset></div>
      <fieldset disabled={!editable || busy} className="rig-dimensions">
        <NumberField label="Largura do personagem" value={definition.width} min={1} max={4096} onChange={width => commit({ ...definition, width })} />
        <NumberField label="Altura do personagem" value={definition.height} min={1} max={4096} onChange={height => commit({ ...definition, height })} />
      </fieldset>
      <div className="rig-layout">
        <aside className="rig-parts"><h3>Partes e hierarquia</h3><ul>{view.parts.map(value => <li key={value.id}><button type="button" aria-pressed={partId === value.id} disabled={busy} onClick={() => { selectPart(value.id); setAnchorName(''); }}>{value.id}<small>{value.parentId ? 'Filha de ' + value.parentId : 'Raiz'}</small></button></li>)}</ul>
          <fieldset disabled={!editable || busy} className="form-stack"><label>Identificador da nova parte<input value={newPartId} maxLength={80} onChange={event => setNewPartId(event.target.value)} /></label><Button type="button" disabled={view.parts.length >= 128} onClick={() => {
            if (!validId.test(newPartId) || view.parts.some(part => part.id === newPartId)) { setError('Identificador de parte inválido ou duplicado.'); return; }
            changeView({ ...view, parts: [...view.parts, { ...newPart(newPartId, partId), position: { x: partId === view.rootId ? 256 : 0, y: partId === view.rootId ? 256 : 0 } }] }); selectPart(newPartId); setAnchorName('');
          }}>Adicionar parte</Button></fieldset>
        </aside>
        <div className="rig-workspace"><label>Ferramenta visual<select value={mode} onChange={event => setMode(event.target.value)} disabled={busy}><option value="select">Selecionar parte</option>{editable && <><option value="move">Mover parte — arraste</option><option value="pivot">Posicionar pivô — clique ou arraste</option><option value="anchor">Posicionar anchor — clique ou arraste</option></>}</select></label>
          {mode === 'anchor' && !anchor && <p className="notice">Crie ou selecione um anchor da parte antes de clicar na área visual.</p>}
          {previewError ? <p role="alert" className="inline-error">{previewError}</p> : <RigCanvas key={viewId} character={character} partId={partId} anchorName={anchorName} mode={mode} disabled={!editable || busy} onSelect={id => { selectPart(id); setAnchorName(''); }} onPart={changePart} onAnchor={changeAnchor} />}
        </div>
        <div className="rig-inspector"><h3>Parte: {part.id}</h3><fieldset disabled={!editable || busy} className="form-stack">
          <label>Parte-pai<select disabled={part.id === view.rootId} value={part.parentId || ''} onChange={event => changePart({ ...part, parentId: event.target.value })}>
            {part.id === view.rootId && <option value="">Raiz do personagem</option>}{view.parts.filter(value => !descendants(view, partId).has(value.id)).map(value => <option key={value.id} value={value.id}>{value.id}</option>)}</select></label>
          <div className="rig-upload" key={viewId + ':' + partId}>
            <strong>Imagem para {viewId} / {partId}</strong>
            <label>Enviar imagem desta parte<input key={fileKey} type="file" accept="image/png,image/webp,.png,.webp" onChange={event => setFile(event.target.files?.[0] ? { file: event.target.files[0], viewId, partId } : null)} /></label>
            <small>PNG/WebP até 10 MB e 4096 × 4096 pixels. O envio salva a estrutura atual e vincula a imagem a esta parte. Para a imagem inteira da perspectiva, selecione a raiz.</small>
            <Button type="button" disabled={!file || file.viewId !== viewId || file.partId !== partId} onClick={async () => {
              if (!file || file.viewId !== viewId || file.partId !== partId) return;
              if (!['image/png', 'image/webp'].includes(file.file.type) || file.file.size > 10 * 1024 * 1024) { setError('Selecione PNG ou WebP de até 10 MB.'); return; }
              const data = new FormData(); data.append('revision', String(saved.revision)); data.append('definition', JSON.stringify(definition)); data.append('file', file.file);
              const result = await onUpload(viewId, partId, data);
              if (result) { setSaved(result); setDefinition(result.definition); onDirty(false); setFile(null); setFileKey(value => value + 1); setError(''); setNotice('Imagem enviada e vinculada à parte. Estrutura salva.'); }
            }}>{busy ? 'Enviando…' : 'Enviar e vincular imagem'}</Button>
          </div>
          <label>Imagem da parte<select value={part.assetId || ''} onChange={event => changePart({ ...part, assetId: event.target.value || null })}><option value="">Grupo sem imagem</option>{eligible.filter(asset => asset.ownerCharacterId === item.id || definition.perspectives.some(view => view.parts.some(part => part.assetId === asset.id))).map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>
          <div className="rig-fields"><NumberField label="Posição X" value={part.position.x} onChange={x => changePart({ ...part, position: { ...part.position, x } })} /><NumberField label="Posição Y" value={part.position.y} onChange={y => changePart({ ...part, position: { ...part.position, y } })} />
          <NumberField label="Rotação (graus)" value={part.rotation * 180 / Math.PI} onChange={value => changePart({ ...part, rotation: value * Math.PI / 180 })} />
          <NumberField label="Escala X" value={part.scaleX} onChange={scaleX => changePart({ ...part, scaleX })} /><NumberField label="Escala Y" value={part.scaleY} onChange={scaleY => changePart({ ...part, scaleY })} />
          <NumberField label="Pivô X" value={part.pivot.x} min={0} max={1} onChange={value => numericPivot('x', value)} /><NumberField label="Pivô Y" value={part.pivot.y} min={0} max={1} onChange={value => numericPivot('y', value)} />
          <NumberField label="Camada" value={part.zIndex} min={-1000} max={1000} step={1} onChange={zIndex => changePart({ ...part, zIndex })} /><NumberField label="Opacidade" value={part.opacity} min={0} max={1} onChange={opacity => changePart({ ...part, opacity })} /></div>
          <label className="checkbox-label"><input type="checkbox" checked={part.visible} onChange={event => changePart({ ...part, visible: event.target.checked })} />Parte visível</label>
          <Button type="button" className="button secondary" disabled={part.id === view.rootId} onClick={() => { if (!window.confirm('Remover a parte, seus filhos e anchors deste rascunho?')) return; const ids = descendants(view, partId); changeView({ ...view, parts: view.parts.filter(part => !ids.has(part.id)), anchors: view.anchors.filter(anchor => !ids.has(anchor.partId)) }); selectPart(view.rootId); setAnchorName(''); }}>Remover parte e filhos</Button>
        </fieldset>
        <h3>Anchors da parte</h3><label>Anchor selecionado<select value={anchorName} disabled={busy} onChange={event => setAnchorName(event.target.value)}><option value="">Selecione um anchor</option>{view.anchors.filter(anchor => anchor.partId === partId).map(anchor => <option key={anchor.name} value={anchor.name}>{anchor.name}</option>)}</select></label>
        <fieldset disabled={!editable || busy} className="form-stack"><label>Nome do novo anchor<input maxLength={80} value={newAnchor} onChange={event => setNewAnchor(event.target.value)} /></label><Button type="button" disabled={view.anchors.length >= 128} onClick={() => {
          if (!validId.test(newAnchor) || view.anchors.some(anchor => anchor.name === newAnchor)) { setError('Nome de anchor inválido ou duplicado nesta perspectiva.'); return; }
          changeView({ ...view, anchors: [...view.anchors, { name: newAnchor, partId, coordinateSpace: 'normalized', position: { x: 0.5, y: 0.5 } }] }); setAnchorName(newAnchor); setMode('anchor');
        }}>Adicionar anchor</Button>
        {anchor && <><p className="footnote">{anchor.coordinateSpace === 'normalized' ? 'Coordenadas proporcionais à imagem (0–1). Podem ficar fora dela.' : 'Coordenadas locais em pixels.'}</p><div className="rig-fields"><NumberField label="Anchor X" value={anchor.position.x} onChange={x => changeAnchor({ ...anchor, position: { ...anchor.position, x } })} /><NumberField label="Anchor Y" value={anchor.position.y} onChange={y => changeAnchor({ ...anchor, position: { ...anchor.position, y } })} /></div><Button type="button" className="button secondary" onClick={() => { changeView({ ...view, anchors: view.anchors.filter(anchor => anchor.name !== anchorName) }); setAnchorName(''); }}>Remover anchor</Button></>}
        </fieldset></div>
      </div>
      <MotionWorkbench item={item} definition={definition} viewId={viewId} partId={partId} assets={eligible} editable={editable} busy={busy} onApply={commit} onDirty={onDirty} />
      <div className="form-actions">{dirty && <span role="status">Estrutura com alterações não salvas</span>}<Button type="button" className="button secondary" disabled={busy} onClick={reload}>Recarregar estrutura</Button>
        {editable && <Button type="button" disabled={busy || Boolean(previewError)} onClick={async () => { if (await onSave({ revision: saved.revision, definition })) { onDirty(false); setLoading(true); try { accept(await api('/internal/library/' + item.id + '/rig')); setNotice('Estrutura salva.'); } catch (failure) { setError(failure.message); } finally { setLoading(false); } } }}>Salvar estrutura</Button>}</div>
    </>}
  </section>;
}
