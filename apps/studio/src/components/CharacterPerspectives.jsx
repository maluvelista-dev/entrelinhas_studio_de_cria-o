import { AssetImage } from './AssetImage.jsx';
import { Button } from './ui/Button.jsx';
import { useState } from 'react';
import { perspectiveTitle, fileSize } from './character-labels.js';
export function CharacterPerspectives({definition,viewId,assets,busy,editable,onSelect,newView,setNewView,onAdd,onRemove,onSize}) {
  const [custom, setCustom] = useState(false);
  const options=[['side','Lateral'],['left','Lateral esquerda'],['right','Lateral direita'],['back','Costas'],['front','Frente']];
  const ids=new Set(definition.perspectives.flatMap(v=>v.parts.map(p=>p.assetId)).filter(Boolean));
  const unique=new Map(assets.map(a=>[a.id,a]));const bytes=[...ids].reduce((sum,id)=>sum+(Number(unique.get(id)?.byteSize)||0),0);
  return <section className="character-perspectives"><div className="section-heading"><div><h3>Como o personagem aparece?</h3><p className="muted">Comece pela frente. Adicione lateral ou costas quando precisar. Cada perspectiva guarda suas próprias imagens e partes.</p></div></div>
    <div className="perspective-cards">{definition.perspectives.map(view=>{
      const cover=view.parts.find(p=>p.id===view.rootId && p.assetId) || view.parts.find(p=>p.assetId && p.visible!==false && p.opacity!==0);
      return <button key={view.id} type="button" className="perspective-card" disabled={busy} aria-pressed={view.id===viewId} onClick={()=>onSelect(view.id)}>
        <span className="perspective-art">{cover?<AssetImage id={cover.assetId} alt={'Prévia de '+perspectiveTitle(view)}/>:<span>Adicionar imagem</span>}</span>
        <strong>{perspectiveTitle(view)}</strong><small>{view.parts.filter(p=>p.assetId).length} imagens · {view.parts.length===1?'Pode usar uma imagem inteira':view.parts.length+' partes'}</small><span className="perspective-link">Abrir imagens e partes →</span>
      </button>;
    })}</div>
    <p className="footnote">{ids.size} imagens vinculadas{bytes?' · '+fileSize(bytes):''}. O limite de pacote se refere à importação/exportação, não à soma do cadastro por partes.</p>
    <fieldset disabled={busy || !editable} className="character-view-create"><label>Nova perspectiva<select value={custom?'custom':newView} onChange={e=>{setCustom(e.target.value==='custom');setNewView(e.target.value==='custom'?'diagonal':e.target.value);}}>{options.map(([id,label])=><option key={id} value={id}>{label}{definition.perspectives.some(v=>v.id===id)?' — já existe':''}</option>)}<option value="custom">Outra perspectiva</option></select></label>
      {custom && <label>Identificador da perspectiva<input value={newView} maxLength={80} onChange={e=>setNewView(e.target.value)} placeholder="Ex.: diagonal"/><small>Sem espaços; use letras, números ou hífen.</small></label>}
      <Button type="button" disabled={definition.perspectives.length>=8} onClick={()=>onAdd(false)}>Criar perspectiva</Button><Button type="button" variant="secondary" disabled={definition.perspectives.length>=8} onClick={()=>onAdd(true)}>Duplicar perspectiva</Button>
      <small>Duplicar copia a perspectiva selecionada. As alterações posteriores são independentes.</small>
    </fieldset>
    <details className="character-advanced"><summary>Tamanho da área e gerenciamento das perspectivas</summary><fieldset disabled={busy || !editable} className="rig-inline">
      <label>Largura do personagem<input type="number" min="1" max="4096" value={definition.width} onChange={e=>onSize({width:Number(e.target.value)})}/></label>
      <label>Altura do personagem<input type="number" min="1" max="4096" value={definition.height} onChange={e=>onSize({height:Number(e.target.value)})}/></label>
      <Button type="button" variant="secondary" disabled={definition.perspectives.length===1} onClick={onRemove}>Remover perspectiva selecionada</Button>
    </fieldset></details>
  </section>;
}
