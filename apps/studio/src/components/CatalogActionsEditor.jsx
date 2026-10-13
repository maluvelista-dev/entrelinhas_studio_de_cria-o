import { useState } from 'react';
import { actionCatalog, actionInfo, actionSchema, programSchema } from '@studio/schemas/actions';
const original=['movement.moveTo','object.grab','object.carry','object.release'];
export function CatalogActionsEditor({scene,anchors,title,onChange,disabled}) {
  const [scope,setScope]=useState('element'),[type,setType]=useState('movement.walkTo'),[actorId,setActorId]=useState(''),[partnerId,setPartnerId]=useState(''),[objectId,setObjectId]=useState(''),[anchor,setAnchor]=useState(''),[partnerAnchor,setPartnerAnchor]=useState(''),[sourceAnchor,setSourceAnchor]=useState('');
  const [targetKind,setTargetKind]=useState('point'),[targetId,setTargetId]=useState(''),[targetAnchor,setTargetAnchor]=useState(''),[x,setX]=useState(400),[y,setY]=useState(300),[duration,setDuration]=useState(2),[amplitude,setAmplitude]=useState(60),[cycles,setCycles]=useState(1),[seed,setSeed]=useState(1),[angle,setAngle]=useState(90),[objectAnchor,setObjectAnchor]=useState(''),[path,setPath]=useState([{x:100,y:100},{x:400,y:300}]),[error,setError]=useState('');
  const info=actionInfo(type),all=[...scene.characters,...scene.objects],actors=info.domain==='effect'?all:scene.characters;
  const select=(label,value,set,values)=><label>{label}<select value={value} onChange={e=>set(e.target.value)}><option value="">Selecione</option>{values.map(v=><option key={v.id} value={v.id}>{v.label || title(v)}</option>)}</select></label>;
  const anchorOptions=id=>anchors(id).map(a=>({id:a.name,label:a.name}));
  function append() {
    const value={type,actorId,duration};
    if(info.mode==='effect') value.scope=scope;
    if(info.object) value.objectId=objectId;
    if(info.partner) value.partnerId=partnerId;
    if(info.target) {value.sourceAnchor=sourceAnchor || null;value.target=targetKind==='point'?{kind:'point',point:{x,y}}:{kind:'anchor',instanceId:targetId,anchor:targetAnchor};}
    if(info.contact || ['attach','transfer'].includes(info.mode)) value.anchor=anchor;
    if(info.mode==='transfer') value.partnerAnchor=partnerAnchor;
    if(info.mode==='path') value.path=path;
    if(info.amplitude) value.amplitude=amplitude;if(info.cycles) value.cycles=cycles;if(info.name==='wander') value.seed=seed;
    if(info.mode==='objectTransform') {if(info.name!=='shake') value.angle=angle*Math.PI/180;value.objectAnchor=objectAnchor;}
    const parsed=actionSchema.safeParse(value);if(!parsed.success) {setError('Confira os participantes, anchors, destino e parâmetros. '+parsed.error.issues[0].message);return;}
    const result=programSchema.safeParse({...scene.program,actions:[...scene.program.actions,parsed.data]});if(!result.success) {setError(result.error.issues[0].message);return;}
    onChange({...scene,program:result.data});setError('');
  }
  return <section><h4>Catálogo completo de ações</h4><p className="footnote">Ações corporais exigem mapeamento na estrutura. Destinos são coordenadas da página ou anchors. Trajetórias são narrativas, sem colisão física automática.</p>{error && <p role="alert">{error}</p>}<fieldset disabled={disabled} className="rig-fields">
    <label>Ação do catálogo<select value={type} onChange={e=>{setType(e.target.value);setAmplitude(e.target.value==='movement.hop'?20:60);setCycles(e.target.value==='movement.hop'?3:1);}}>{actionCatalog.filter(a=>a.domain!=='input' && !original.includes(a.type)).map(a=><option key={a.type} value={a.type}>{a.category} · {a.label}</option>)}</select></label>
    {select('Participante principal',actorId,setActorId,actors)}
    {info.mode==='effect' && <label>Alcance do efeito<select value={scope} onChange={e=>setScope(e.target.value)}><option value="element">Elemento selecionado</option><option value="scene">Todos os elementos da cena</option></select></label>}
    {info.mapped && <p className="footnote">Requer a capacidade “{info.label}” mapeada no personagem{info.partner?' e no parceiro':''}.</p>}
    {info.partner && select('Outro personagem',partnerId,setPartnerId,scene.characters.filter(a=>a.id!==actorId))}
    {info.object && select('Objeto participante',objectId,setObjectId,scene.objects)}
    {(info.contact || ['attach','transfer'].includes(info.mode)) && select('Anchor de contato principal',anchor,setAnchor,anchorOptions(actorId))}
    {info.mode==='transfer' && select('Anchor de contato do parceiro',partnerAnchor,setPartnerAnchor,anchorOptions(partnerId))}
    {info.target && <>{select('Anchor de origem opcional',sourceAnchor,setSourceAnchor,anchorOptions(actorId))}<label>Destino da ação<select value={targetKind} onChange={e=>setTargetKind(e.target.value)}><option value="point">Ponto</option><option value="anchor">Anchor</option></select></label>
      {targetKind==='point'?<><label>X final<input type="number" value={x} onChange={e=>setX(Number(e.target.value))}/></label><label>Y final<input type="number" value={y} onChange={e=>setY(Number(e.target.value))}/></label></>:<>{select('Elemento de destino da ação',targetId,setTargetId,all.filter(a=>a.id!==actorId))}{select('Anchor final',targetAnchor,setTargetAnchor,anchorOptions(targetId))}</>}
    </>}
    <label>Duração no catálogo (s)<input type="number" min="0.1" max="30" step="0.1" value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label>
    {info.amplitude && <label>Amplitude (pixels)<input type="number" min="0" max="2000" value={amplitude} onChange={e=>setAmplitude(Number(e.target.value))}/></label>}
    {info.cycles && <label>Voltas ou ciclos<input type="number" min="1" max="20" value={cycles} onChange={e=>setCycles(Number(e.target.value))}/></label>}
    {info.name==='wander' && <label>Semente do passeio<input type="number" min="0" max="2147483647" value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label>}
    {info.mode==='objectTransform' && select('Anchor de rotação do objeto',objectAnchor,setObjectAnchor,anchorOptions(objectId))}
    {info.mode==='objectTransform' && info.name!=='shake' && <label>Ângulo de abertura/rotação (graus)<input type="number" min="-1440" max="1440" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label>}
    {info.mode==='path' && <PathFields points={path} onChange={setPath}/>}
    <button type="button" disabled={scene.program.actions.length>=32} onClick={append}>Adicionar ação do catálogo</button>
  </fieldset></section>;
}
export function PathFields({points,onChange}) {
  return <div><p>Pontos do caminho, em ordem</p>{points.map((point,index)=><div key={index} className="rig-inline">{['x','y'].map(axis=><label key={axis}>Ponto {index+1} {axis.toUpperCase()}<input type="number" value={point[axis]} onChange={e=>onChange(points.map((p,i)=>i===index?{...p,[axis]:Number(e.target.value)}:p))}/></label>)}<button type="button" disabled={points.length<=2} onClick={()=>onChange(points.filter((_,i)=>i!==index))}>Remover ponto</button></div>)}<button type="button" disabled={points.length>=64} onClick={()=>onChange([...points,{...points.at(-1)}])}>Adicionar ponto</button></div>;
}
