import { useState } from 'react';
import { actionCatalog } from '@studio/schemas/actions';
import { characterSchema } from '@studio/schemas/character';
export function BehaviorBindings({definition,viewId,templates,onApply,disabled}) {
  const [action,setAction]=useState('expression.smile'),[templateId,setTemplateId]=useState(''),[partId,setPartId]=useState(''),[sourcePartId,setSourcePartId]=useState(''),[error,setError]=useState(''),[aimPartId,setAimPartId]=useState('');
  const view=definition.perspectives.find(v=>v.id===viewId),bindings=view.behaviors || [];
  function update(behaviors) {const next={...definition,perspectives:definition.perspectives.map(v=>v.id===viewId?{...v,behaviors}:v)};const parsed=characterSchema.safeParse(next);if(!parsed.success) {setError(parsed.error.issues[0].message);return;}setError('');onApply(parsed.data);}
  return <section><h3>Capacidades e imagens alternativas</h3><p className="muted">Associe cada ação à pose/animação preparada para esta perspectiva. Para trocar uma imagem, envie a alternativa em uma parte auxiliar com opacidade zero e selecione-a abaixo. O mapeamento acompanha o personagem exportado. Salve a estrutura após alterar.</p>
    {error && <p role="alert">{error}</p>}<fieldset disabled={disabled} className="rig-fields">
      <label>Ação do personagem<select value={action} onChange={e=>setAction(e.target.value)}>{actionCatalog.filter(a=>a.domain!=='input' && a.domain!=='effect').map(a=><option key={a.type} value={a.type}>{a.category} · {a.label}</option>)}</select></label>
      <label>Pose ou animação da capacidade<select value={templateId} onChange={e=>setTemplateId(e.target.value)}><option value="">Somente imagem alternativa</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name} ({t.kind})</option>)}</select></label>
<label>Parte orientada para o destino (olhar/apontar)<select value={aimPartId} onChange={e=>setAimPartId(e.target.value)}><option value="">Nenhuma</option>{view.parts.map(p=><option key={p.id}>{p.id}</option>)}</select></label>
      <label>Parte que troca de imagem<select value={partId} onChange={e=>setPartId(e.target.value)}><option value="">Sem troca de imagem</option>{view.parts.filter(p=>p.assetId).map(p=><option key={p.id}>{p.id}</option>)}</select></label>
      <label>Parte com a imagem alternativa<select value={sourcePartId} onChange={e=>setSourcePartId(e.target.value)}><option value="">Selecione</option>{view.parts.filter(p=>p.assetId).map(p=><option key={p.id}>{p.id}</option>)}</select></label>
      <button type="button" onClick={()=>update([...bindings.filter(b=>b.action!==action),{action,...(aimPartId?{aimPartId}:{}),motion:templates.find(t=>t.id===templateId)?.definition || null,images:partId?[{partId,sourcePartId}]:[]}])}>Associar capacidade</button>
      <button type="button" disabled={!bindings.length} onClick={()=>onApply({...definition,perspectives:definition.perspectives.map(v=>v.id===viewId?{...v,behaviors:[]}:v)})}>Limpar capacidades desta perspectiva</button>
    </fieldset><ul>{bindings.map(b=><li key={b.action}>{actionCatalog.find(a=>a.type===b.action)?.label} · {b.motion?.keyframes?'Animação':b.motion?'Pose':'Imagem'}<button type="button" disabled={disabled} onClick={()=>update(bindings.filter(v=>v.action!==b.action))}>Remover mapeamento</button></li>)}</ul>
  </section>;
}
