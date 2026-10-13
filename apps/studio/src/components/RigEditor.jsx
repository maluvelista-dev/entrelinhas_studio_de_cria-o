import { CharacterPerspectives } from './CharacterPerspectives.jsx';
import { perspectiveTitle, partTitle, identifierFor, fileSize } from './character-labels.js';
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
  const [framesDirty,setFramesDirty]=useState(false);
  const [step,setStep]=useState('views'),[newPartName,setNewPartName]=useState('Corpo');
  const [saved, setSaved] = useState(null), [definition, setDefinition] = useState(null);
  const [viewId, setViewId] = useState('front'), [partId, setPartId] = useState('root');
  const [anchorName, setAnchorName] = useState(''), [mode, setMode] = useState('select');
  const [newView, setNewView] = useState('side'), [newPartId, setNewPartId] = useState('body'), [newAnchor, setNewAnchor] = useState('hand');
  const [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [file, setFile] = useState(null), [fileKey, setFileKey] = useState(0);
  function selectPart(id) { setFile(null); setPartId(id); }
  function accept(result,preserveSelection=false) {
    const value = result.definition || newDefinition(item);
    setSaved(result); setDefinition(value); const current=preserveSelection?value.perspectives.find(v=>v.id===viewId):null;const next=current || value.perspectives[0];setViewId(next.id); selectPart(preserveSelection && next.parts.some(p=>p.id===partId)?partId:next.rootId); setAnchorName(''); setMode('select');
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
    try { accept(await api('/internal/library/' + item.id + '/rig')); onDirty(false); setFramesDirty(false); }
    catch (failure) { setError(failure.message); } finally { setLoading(false); }
  }
  const eligible = [...assets, ...(saved?.assets || [])].filter(asset => (!asset.ownerBookId || asset.ownerBookId === item.ownerBookId) && ['image/png', 'image/webp'].includes(asset.mediaType) && asset.width && asset.height);
  function commit(next) {
    if (!editable || busy) return;
    const result = characterSchema.safeParse(next);
    if (!result.success) { setError('Estrutura inválida: ' + result.error.issues[0].message); return; }
    if (result.data.perspectives.some(view => view.parts.some(part => Math.abs(part.scaleX) < 0.001 || Math.abs(part.scaleY) < 0.001))) { setError('Escalas precisam ter módulo de pelo menos 0,001.'); return; }
    setDefinition(result.data); onDirty(true); setError(''); setNotice(''); return true;
  }
  const view = definition?.perspectives.find(view => view.id === viewId);
  const part = view?.parts.find(part => part.id === partId);
  const anchor = view?.anchors.find(anchor => anchor.name === anchorName);
  function changeView(nextView) { return commit({ ...definition, perspectives: definition.perspectives.map(view => view.id === viewId ? nextView : view) }); }
  function changePart(nextPart) { changeView({ ...view, parts: view.parts.map(part => part.id === partId ? nextPart : part) }); }
  function changeAnchor(nextAnchor) { changeView({ ...view, anchors: view.anchors.map(anchor => anchor.name === anchorName ? nextAnchor : anchor) }); }
  function addPerspective(copy) {
    if (!validId.test(newView) || definition.perspectives.some(view => view.id === newView)) { setError('Use um identificador único: letras, números, hífen ou sublinhado, começando por letra.'); return; }
    const next = copy ? { ...structuredClone(view), id: newView, name:perspectiveTitle({id:newView}) } : { id: newView, name:perspectiveTitle({id:newView}), rootId: 'root', parts: [newPart('root')], anchors: [] };
    for(const binding of next.behaviors || []) if(binding.motion) binding.motion.perspective=newView;
    if (!commit({ ...definition, perspectives: [...definition.perspectives, next] })) return; setViewId(newView); selectPart(next.rootId); setAnchorName('');setStep('images');
  }
  let character, previewError = '';
  if (definition && view) { try { character = previewRig(definition, viewId, eligible); } catch { previewError = 'Não foi possível montar a prévia. Confira imagens, dimensões e transformações das partes.'; } }
  const node = character?.nodes.find(node => node.partId === partId);
  function numericPivot(axis, value) {
    if (!node) return;
    const pivot = { ...part.pivot, [axis]: value };
    changePart(pivotAt(part, node, localToWorld({ x: pivot.x * node.entity.width, y: pivot.y * node.entity.height }, node.world)));
  }

  function selectView(id) {const selected=definition.perspectives.find(v=>v.id===id);setViewId(id);selectPart(selected.rootId);setAnchorName('');setMode('select');}
  async function upload() {
    if(!file || file.viewId!==viewId || file.partId!==partId) return;
    if(!['image/png','image/webp'].includes(file.file.type) || file.file.size>10*1024*1024) {setError('Selecione PNG ou WebP de até 10 MB.');return;}
    try {
      let value=definition;
      if(definition.perspectives.length===1 && view.parts.length===1 && !part.assetId) {
        const image=await createImageBitmap(file.file);
        try {if(image.width<=4096 && image.height<=4096) value={...definition,width:image.width,height:image.height};} finally {image.close();}
      }
      const data=new FormData();data.append('revision',String(saved.revision));data.append('definition',JSON.stringify(value));data.append('file',file.file);
      const result=await onUpload(viewId,partId,data);
      if(result) {setSaved(result);setDefinition(result.definition);onDirty(framesDirty);setFile(null);setFileKey(v=>v+1);setError('');setNotice('Imagem salva. Você pode continuar com a imagem inteira ou adicionar partes para animar.');}
    } catch {setError('Não foi possível ler esta imagem. Verifique o arquivo PNG ou WebP.');}
  }
  const steps=[['views','Perspectivas'],['images','Imagens e partes'],['joints','Articulação'],['motion','Poses e ações']];
  if (loading) return <p role="status">Carregando personagem…</p>;
  return <section className="panel rig-editor">
    <div className="section-heading"><div><p className="eyebrow">PERSONAGENS / APARÊNCIA E MOVIMENTO</p><h2>Estrutura de {item.name}</h2><p className="muted">Uma imagem inteira já é suficiente para começar. Partes e articulações são opcionais.</p></div><Button type="button" variant="secondary" disabled={busy} onClick={onBack}>Voltar à ficha</Button></div>
    {error && <p role="alert" className="inline-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!definition ? <Button type="button" onClick={reload}>Tentar novamente</Button> : <>
      <nav className="character-steps" aria-label="Etapas do personagem">{steps.map(([id,label],index)=><button type="button" key={id} aria-current={step===id?'step':undefined} disabled={busy} onClick={()=>{setStep(id);setMode(id==='joints'?'pivot':'select');}}><span>{index+1}</span>{label}{id==='joints' && <small>Opcional</small>}</button>)}</nav>
      <div hidden={step!=='views'}><CharacterPerspectives definition={definition} viewId={viewId} assets={eligible} busy={busy} editable={editable} newView={newView} setNewView={setNewView} onAdd={addPerspective} onSize={patch=>commit({...definition,...patch})}
        onSelect={id=>{selectView(id);setStep('images');}} onRemove={()=>{if(!window.confirm('Remover esta perspectiva, suas imagens vinculadas e partes deste rascunho? Os arquivos não serão apagados.')) return;const views=definition.perspectives.filter(v=>v.id!==viewId);if(!commit({...definition,perspectives:views})) return;setViewId(views[0].id);selectPart(views[0].rootId);setAnchorName('');}}/></div>
      <div hidden={step==='views'}>
        <div className="character-context"><label>Perspectiva do personagem<select value={viewId} disabled={busy} onChange={e=>selectView(e.target.value)}>{definition.perspectives.map(v=><option key={v.id} value={v.id}>{perspectiveTitle(v)}</option>)}</select></label><p>{step==='images'?'Envie o PNG inteiro nesta perspectiva. Separe em partes apenas se precisar mover braços, cabeça ou outras regiões.':step==='joints'?'Selecione uma parte e marque onde ela gira ou se conecta a outra.':'Ajuste a parte selecionada no canvas e capture poses ou keyframes abaixo.'}</p></div>
        <div className="rig-layout">
          <aside className="rig-parts"><h3>Imagens de {perspectiveTitle(view)}</h3><ul>{view.parts.map(value=><li key={value.id}><button type="button" aria-pressed={partId===value.id} disabled={busy} onClick={()=>{selectPart(value.id);setAnchorName('');}}>{partTitle(value)}<small>{value.assetId?'Imagem adicionada':value.id===view.rootId?'Envie o personagem inteiro aqui':'Sem imagem'}</small></button></li>)}</ul>
            <details className="character-advanced"><summary>Adicionar parte para animar</summary><fieldset disabled={!editable || busy} className="form-stack"><p className="footnote">Cada parte deve ter sua própria imagem. O Studio não recorta o PNG automaticamente.</p><label>Nome da nova parte<input value={newPartName} maxLength={120} onChange={e=>{setNewPartName(e.target.value);setNewPartId(identifierFor(e.target.value,view.parts.map(p=>p.id)));}} placeholder="Ex.: Cabeça, braço esquerdo"/></label><Button type="button" disabled={!newPartName.trim() || view.parts.length>=128} onClick={()=>{if(view.parts.some(p=>p.id===newPartId)) {setError('Esta parte já existe. Escolha outro nome.');return;}const next={...newPart(newPartId,partId),name:newPartName.trim(),position:{x:partId===view.rootId?256:0,y:partId===view.rootId?256:0}};if(!changeView({...view,parts:[...view.parts,next]})) return;selectPart(newPartId);setAnchorName('');}}>Adicionar parte</Button></fieldset></details>
          </aside>
          <div className="rig-workspace"><label>Ferramenta visual<select value={mode} onChange={e=>setMode(e.target.value)} disabled={busy}><option value="select">Selecionar imagem</option>{editable && <><option value="move">Mover imagem — arraste</option>{step==='joints' && <><option value="pivot">Ponto de rotação — clique na imagem</option><option value="anchor">Ponto de contato — clique na imagem</option></>}</>}</select></label>
            {mode==='anchor' && !anchor && <p className="notice">Adicione ou selecione um ponto de contato ao lado antes de clicar na imagem.</p>}
            {previewError?<p role="alert">{previewError}</p>:<RigCanvas key={viewId} character={character} partId={partId} anchorName={anchorName} mode={mode} showJoints={step==='joints'} disabled={!editable || busy} onSelect={id=>{selectPart(id);setAnchorName('');}} onPart={changePart} onAnchor={changeAnchor}/>}
          </div>
          <div className="rig-inspector"><h3>{partTitle(part)}</h3>
            <div hidden={step!=='images'}><fieldset disabled={!editable || busy} className="form-stack">
              <div className="rig-upload" key={viewId+':'+partId}><strong>{part.id===view.rootId?'Imagem inteira desta perspectiva':'Imagem desta parte'}</strong>
                <label>{part.id===view.rootId?'Enviar imagem inteira desta perspectiva':'Enviar imagem desta parte'}<input key={fileKey} type="file" accept="image/png,image/webp,.png,.webp" onChange={e=>setFile(e.target.files?.[0]?{file:e.target.files[0],viewId,partId}:null)}/></label>
                <small>PNG ou WebP · até 10 MB por arquivo · até 4096 × 4096 pixels. O limite é por imagem, não pelo personagem. Salvar imagem também salva os ajustes pendentes da estrutura.</small>
                {file && <p className="footnote">{file.file.name} · {fileSize(file.file.size)}</p>}
                <Button type="button" disabled={!file || file.viewId!==viewId || file.partId!==partId} onClick={upload}>{busy?'Enviando…':'Salvar imagem'}</Button>
              </div>
              <details className="character-advanced"><summary>Trocar imagem ou nome da parte</summary><label>Nome da parte<input maxLength={120} value={part.name || partTitle(part)} onChange={e=>{if(e.target.value.trim()) changePart({...part,name:e.target.value});}}/></label><label>Imagem da parte<select value={part.assetId || ''} onChange={e=>changePart({...part,assetId:e.target.value || null})}><option value="">Sem imagem</option>{eligible.filter(a=>a.ownerCharacterId===item.id || definition.perspectives.some(v=>v.parts.some(p=>p.assetId===a.id))).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></details>
            </fieldset></div>
            <div hidden={step!=='joints'}><fieldset disabled={!editable || busy} className="form-stack"><h4>Ponto de rotação (pivô)</h4><p className="footnote">É a dobradiça da parte. Escolha a ferramenta e clique onde ela deve girar.</p><div className="rig-fields"><NumberField label="Pivô X" value={part.pivot.x} min={0} max={1} onChange={v=>numericPivot('x',v)}/><NumberField label="Pivô Y" value={part.pivot.y} min={0} max={1} onChange={v=>numericPivot('y',v)}/></div>
              <h4>Pontos de contato (anchors)</h4><p className="footnote">Marcam uma mão que segura objetos, um pé apoiado ou outra conexão.</p><label>Anchor selecionado<select value={anchorName} onChange={e=>{setAnchorName(e.target.value);setMode('anchor');}}><option value="">Selecione um ponto</option>{view.anchors.filter(a=>a.partId===partId).map(a=><option key={a.name} value={a.name}>{a.name}</option>)}</select></label>
              <label>Nome do novo anchor<input maxLength={80} value={newAnchor} onChange={e=>setNewAnchor(e.target.value)}/></label><Button type="button" disabled={view.anchors.length>=128} onClick={()=>{if(!validId.test(newAnchor) || view.anchors.some(a=>a.name===newAnchor)) {setError('Escolha um nome único, sem espaços, para o ponto de contato.');return;}changeView({...view,anchors:[...view.anchors,{name:newAnchor,partId,coordinateSpace:'normalized',position:{x:0.5,y:0.5}}]});setAnchorName(newAnchor);setMode('anchor');}}>Adicionar anchor</Button>
              {anchor && <><div className="rig-fields"><NumberField label="Anchor X" value={anchor.position.x} onChange={x=>changeAnchor({...anchor,position:{...anchor.position,x}})}/><NumberField label="Anchor Y" value={anchor.position.y} onChange={y=>changeAnchor({...anchor,position:{...anchor.position,y}})}/></div><Button type="button" variant="secondary" onClick={()=>{changeView({...view,anchors:view.anchors.filter(a=>a.name!==anchorName)});setAnchorName('');}}>Remover anchor</Button></>}
              <label>Parte-pai<select disabled={part.id===view.rootId} value={part.parentId || ''} onChange={e=>changePart({...part,parentId:e.target.value})}>{part.id===view.rootId && <option value="">Base da perspectiva</option>}{view.parts.filter(p=>!descendants(view,partId).has(p.id)).map(p=><option key={p.id} value={p.id}>{partTitle(p)}</option>)}</select><small>Ao mover a parte-pai, suas partes ligadas acompanham o movimento.</small></label>
            </fieldset></div>
            <details className="character-advanced" open={step==='motion'}><summary>Posição, rotação e aparência</summary><fieldset disabled={!editable || busy} className="rig-fields"><NumberField label="Posição X" value={part.position.x} onChange={x=>changePart({...part,position:{...part.position,x}})}/><NumberField label="Posição Y" value={part.position.y} onChange={y=>changePart({...part,position:{...part.position,y}})}/><NumberField label="Rotação (graus)" value={part.rotation*180/Math.PI} onChange={v=>changePart({...part,rotation:v*Math.PI/180})}/><NumberField label="Escala X" value={part.scaleX} onChange={scaleX=>changePart({...part,scaleX})}/><NumberField label="Escala Y" value={part.scaleY} onChange={scaleY=>changePart({...part,scaleY})}/><NumberField label="Camada" value={part.zIndex} min={-1000} max={1000} step={1} onChange={zIndex=>changePart({...part,zIndex})}/><NumberField label="Opacidade" value={part.opacity} min={0} max={1} onChange={opacity=>changePart({...part,opacity})}/><label className="checkbox-label"><input type="checkbox" checked={part.visible} onChange={e=>changePart({...part,visible:e.target.checked})}/>Imagem visível</label></fieldset></details>
            {part.id!==view.rootId && <Button type="button" variant="secondary" disabled={!editable || busy} onClick={()=>{if(!window.confirm('Remover esta parte e as partes ligadas a ela?')) return;const ids=descendants(view,partId);if(!changeView({...view,parts:view.parts.filter(p=>!ids.has(p.id)),anchors:view.anchors.filter(a=>!ids.has(a.partId))})) return;selectPart(view.rootId);setAnchorName('');}}>Remover parte e filhos</Button>}
          </div>
        </div>
      </div>
      <div hidden={step!=='motion'}><MotionWorkbench item={item} definition={definition} viewId={viewId} partId={partId} assets={eligible} editable={editable} busy={busy} onApply={commit} onDirty={onDirty} onDraftChange={value=>{setFramesDirty(value);if(value) onDirty(true);}}/></div>
      <div className="form-actions character-save"><span role="status">{dirty?'Alterações ainda não salvas':saved?.definition?'Estrutura salva':'Salve para confirmar a estrutura'} · {definition.perspectives.length} perspectivas</span><Button type="button" variant="secondary" disabled={busy} onClick={reload}>Recarregar estrutura</Button>{editable && <Button type="button" disabled={busy || Boolean(previewError)} onClick={async()=>{if(await onSave({revision:saved.revision,definition})) {onDirty(framesDirty);try {accept(await api('/internal/library/'+item.id+'/rig'),true);setNotice('Estrutura salva.');}catch(failure){setError(failure.message);}}}}>Salvar estrutura</Button>}</div>
    </>}
  </section>;
}
