import { useState } from 'react';
import { actionSchema, emptyProgram } from '@studio/schemas/actions';
import { Button } from './ui/Button.jsx';
const names={ 'movement.moveTo':'Mover até', 'object.grab':'Pegar objeto', 'object.carry':'Carregar até', 'object.release':'Soltar objeto' };
export function SceneActionsEditor({ scene,items,definitions,book,disabled,onChange }) {
  const [libraryId,setLibraryId]=useState(''),[objectId,setObjectId]=useState(''),[anchorName,setAnchorName]=useState('center');
  const [type,setType]=useState('movement.moveTo'),[actorId,setActorId]=useState(''),[heldId,setHeldId]=useState(''),[source,setSource]=useState('');
  const [targetKind,setTargetKind]=useState('point'),[targetId,setTargetId]=useState(''),[targetAnchor,setTargetAnchor]=useState('');
  const [x,setX]=useState(400),[y,setY]=useState(300),[duration,setDuration]=useState(2),[error,setError]=useState('');
  const objects=scene.objects || [],program=scene.program || emptyProgram(),selected=objects.find(o=>o.id===objectId) || objects[0];
  const all=[...scene.characters,...objects],actor=scene.characters.find(a=>a.id===actorId) || scene.characters[0];
  const title=i=>items.find(item=>item.id===(i.characterId || i.libraryId))?.name || i.id;
  function anchors(id) {
    const object=objects.find(o=>o.id===id); if(object) return object.anchors;
    const actor=scene.characters.find(a=>a.id===id); return actor ? definitions[actor.characterId+':'+actor.rigRevision]?.perspectives.find(v=>v.id===actor.perspective)?.anchors || [] : [];
  }
  const editProgram=patch=>onChange({ ...scene,program:{ ...program,...patch } });
  function updateObject(patch) { onChange({ ...scene,objects:objects.map(o=>o.id===selected.id ? { ...o,...patch } : o) }); }
  function appendAction() {
    try {
      const value={ type,actorId:actor?.id };
      if(type==='object.grab') { value.objectId=heldId; value.anchor=source; }
      else if(type==='object.release') value.objectId=heldId;
      else { value.sourceAnchor=source || null; value.duration=duration; value.target=targetKind==='point' ? { kind:'point',point:{ x,y } } : { kind:'anchor',instanceId:targetId,anchor:targetAnchor }; if(type==='object.carry') value.objectId=heldId; }
      const parsed=actionSchema.safeParse(value); if(!parsed.success) throw new Error('Preencha ator, objeto/anchor e destino válidos. A duração deve ser de 0,1 a 30 segundos.');
      if(program.actions.reduce((sum,a)=>sum+(a.duration || 0),0)+(parsed.data.duration || 0)>120) throw new Error('A sequência admite até 120 segundos.');
      editProgram({ actions:[...program.actions,parsed.data] }); setError('');
    } catch(error) { setError(error.message); }
  }
  return <section className="scene-actions-editor"><h3>Objetos, cenários e ações</h3>
    <p className="muted">Configure uma sequência. Pegar e soltar preservam a posição do objeto; alinhe a mão ao destino com Mover até antes de pegar.</p>
    {error && <p role="alert" className="inline-error">{error}</p>}
    <fieldset disabled={disabled} className="form-stack">
      <div className="rig-inline"><label>Objeto ou cenário da Biblioteca<select value={libraryId} onChange={e=>setLibraryId(e.target.value)}><option value="">Selecione</option>{items.filter(i=>['OBJECT','BACKGROUND'].includes(i.kind) && i.assetId && (!i.ownerBookId || i.ownerBookId===book.id)).map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
      <Button type="button" disabled={!libraryId || objects.length>=24} onClick={()=> { const item=items.find(i=>i.id===libraryId);const instance={ id:'object_'+crypto.randomUUID(),libraryId:item.id,revision:item.revision,x:0,y:0,rotation:0,scaleX:1,scaleY:1,anchors:[{ name:'center',position:{ x:0.5,y:0.5 } }] };onChange({ ...scene,objects:[...objects,instance] });setObjectId(instance.id); }}>Inserir objeto ou cenário</Button></div>
      {selected && <><label>Objeto na página<select value={selected.id} onChange={e=>setObjectId(e.target.value)}>{objects.map((o,i)=><option key={o.id} value={o.id}>{i+1}. {title(o)}</option>)}</select></label>
      <div className="rig-fields">{['x','y','rotation','scaleX','scaleY'].map(field=><label key={field}>{({x:'X do objeto',y:'Y do objeto',rotation:'Rotação do objeto (graus)',scaleX:'Escala X do objeto',scaleY:'Escala Y do objeto'})[field]}<input type="number" step="any" value={field==='rotation' ? selected[field]*180/Math.PI : selected[field]} onChange={e=>updateObject({ [field]:Number(e.target.value)*(field==='rotation' ? Math.PI/180 : 1) })}/></label>)}</div>
      <h4>Anchors do objeto</h4><p className="footnote">Coordenadas relativas à imagem: 0 é o início, 1 é o fim.</p>
      {selected.anchors.map((a,index)=><div className="rig-inline" key={a.name}><strong>{a.name}</strong>{['x','y'].map(axis=><label key={axis}>Anchor {a.name} {axis.toUpperCase()}<input type="number" step="0.01" value={a.position[axis]} onChange={e=>updateObject({ anchors:selected.anchors.map((v,i)=>i===index ? {...v,position:{ ...v.position,[axis]:Number(e.target.value)}} : v) })}/></label>)}</div>)}
      <div className="rig-inline"><label>Nome do anchor do objeto<input value={anchorName} onChange={e=>setAnchorName(e.target.value)} maxLength={80}/></label><Button type="button" disabled={selected.anchors.length>=32} onClick={()=> { if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(anchorName) || selected.anchors.some(a=>a.name===anchorName)) {setError('Use um identificador de anchor válido e único.');return;}updateObject({ anchors:[...selected.anchors,{ name:anchorName,position:{ x:0.5,y:0.5 }}] });setError(''); }}>Adicionar anchor ao objeto</Button></div>
      <Button type="button" variant="secondary" onClick={()=> { if(JSON.stringify(program).includes(selected.id)) {setError('Remova as ações e o gatilho que usam este objeto antes de removê-lo.');return;}onChange({ ...scene,objects:objects.filter(o=>o.id!==selected.id) });setObjectId(''); }}>Remover objeto da página</Button></>}
      <h4>Sequência de movimentos e interações</h4>
      <div className="rig-fields"><label>Início da sequência<select value={program.trigger.type} onChange={e=>editProgram({ trigger:e.target.value==='manual' ? {type:'manual'} : {type:'input.tap',instanceId:all[0]?.id || ''} })}><option value="manual">Pelo botão Reproduzir</option><option value="input.tap" disabled={!all.length}>Ao tocar em um elemento</option></select></label>
      {program.trigger.type==='input.tap' && <label>Alvo do toque<select value={program.trigger.instanceId} onChange={e=>editProgram({ trigger:{type:'input.tap',instanceId:e.target.value} })}>{all.map(i=><option key={i.id} value={i.id}>{title(i)}</option>)}</select></label>}
      <label>Ação<select value={type} onChange={e=>{setType(e.target.value);setSource('');}}>{Object.entries(names).map(([id,name])=><option value={id} key={id}>{name}</option>)}</select></label>
      <label>Ator da ação<select value={actor?.id || ''} onChange={e=>{setActorId(e.target.value);setSource('');}}><option value="">Selecione</option>{scene.characters.map(i=><option key={i.id} value={i.id}>{title(i)}</option>)}</select></label>
      {type!=='object.release' && <label>Anchor do ator<select value={source} onChange={e=>setSource(e.target.value)}><option value="">{type==='object.grab' ? 'Selecione a mão/ponto de contato' : 'Origem da instância'}</option>{anchors(actor?.id).map(a=><option key={a.name} value={a.name}>{a.name}</option>)}</select></label>}
      {type.startsWith('object.') && <label>Objeto da ação<select value={heldId} onChange={e=>setHeldId(e.target.value)}><option value="">Selecione</option>{objects.filter(i=>items.find(item=>item.id===i.libraryId)?.kind==='OBJECT').map(i=><option key={i.id} value={i.id}>{title(i)}</option>)}</select></label>}
      {['movement.moveTo','object.carry'].includes(type) && <><label>Tipo de destino<select value={targetKind} onChange={e=>setTargetKind(e.target.value)}><option value="point">Ponto na página</option><option value="anchor">Anchor de outro elemento</option></select></label>
      {targetKind==='point' ? <>{['X','Y'].map(axis=><label key={axis}>Destino {axis}<input type="number" value={axis==='X' ? x : y} onChange={e=>(axis==='X' ? setX : setY)(Number(e.target.value))}/></label>)}</> : <><label>Elemento de destino<select value={targetId} onChange={e=>{setTargetId(e.target.value);setTargetAnchor('');}}><option value="">Selecione</option>{all.filter(i=>i.id!==actor?.id).map(i=><option key={i.id} value={i.id}>{title(i)}</option>)}</select></label><label>Anchor de destino<select value={targetAnchor} onChange={e=>setTargetAnchor(e.target.value)}><option value="">Selecione</option>{anchors(targetId).map(a=><option key={a.name} value={a.name}>{a.name}</option>)}</select></label></>}
      <label>Duração da ação (segundos)<input type="number" min="0.1" max="30" step="0.1" value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label></>}
      </div><Button type="button" disabled={!actor || program.actions.length>=32} onClick={appendAction}>Adicionar ação à sequência</Button>
      <ol className="action-sequence">{program.actions.map((action,index)=><li key={index}><span>{names[action.type]} · {title(all.find(i=>i.id===action.actorId) || {id:action.actorId})}{action.objectId ? ' · objeto: '+title(all.find(i=>i.id===action.objectId) || {id:action.objectId}) : ''}{action.anchor ? ' · anchor: '+action.anchor : ''}{action.target ? ' → '+(action.target.kind==='point' ? action.target.point.x+', '+action.target.point.y : title(all.find(i=>i.id===action.target.instanceId) || {id:action.target.instanceId})+'.'+action.target.anchor) : ''}{action.duration ? ' · '+action.duration+'s' : ''}</span>{[-1,1].map(direction=><Button key={direction} type="button" variant="secondary" aria-label={(direction<0 ? 'Subir' : 'Descer')+' ação '+(index+1)} disabled={index+direction<0 || index+direction>=program.actions.length} onClick={()=>{const actions=[...program.actions];[actions[index],actions[index+direction]]=[actions[index+direction],actions[index]];editProgram({actions});}}>{direction<0 ? '↑' : '↓'}</Button>)}<Button type="button" variant="secondary" aria-label={'Remover ação '+(index+1)} onClick={()=>editProgram({ actions:program.actions.filter((_,i)=>i!==index) })}>Remover</Button></li>)}</ol>
      <p className="footnote">A sequência é validada ao atualizar a prévia e salvar a página. Carregar exige um objeto previamente pego pelo mesmo ator. Os outros grupos de ações serão entregues nos próximos incrementos.</p>
    </fieldset>
  </section>;
}
