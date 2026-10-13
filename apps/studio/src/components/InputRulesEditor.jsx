import { useState } from 'react';
import { actionCatalog, triggerSchema } from '@studio/schemas/actions';
import { PathFields } from './CatalogActionsEditor.jsx';
export function InputRulesEditor({trigger,instances,title,onChange,disabled}) {
  const [draft,setDraft]=useState(trigger),[error,setError]=useState('');
  const kind=draft.type.slice(6);
  const update=patch=>setDraft({...draft,...patch});
  function changeType(type) {
    const next={type};if(type!=='manual') next.instanceId=instances[0]?.id || '';
    const name=type.slice(6);
    if(name==='hold') next.holdMs=800;
    if(['drag','drop','swipe'].includes(name)) next.distance=50;
    if(name==='swipe') next.direction='right';
    if(['match','assemble','drop'].includes(name)) next.pairs=[{source:instances[0]?.id || '',target:instances[1]?.id || ''}];
    if(['choose','find','collect','sort'].includes(name)) next.expected=[instances[0]?.id || ''];
    if(['trace','drop','assemble'].includes(name)) next.tolerance=30;
    if(name==='trace') next.path=[{x:100,y:100},{x:300,y:100}];
    setDraft(next);
  }
  const elementSelect=(label,value,change)=><label>{label}<select value={value} onChange={e=>change(e.target.value)}><option value="">Selecione</option>{instances.map(i=><option key={i.id} value={i.id}>{title(i)}</option>)}</select></label>;
  return <section><h4>Gestos e atividades da criança</h4><p className="footnote">A resposta correta inicia a sequência da página. A tentativa fica apenas na prévia. Aplique a regra e atualize a prévia para testar.</p>{error && <p role="alert">{error}</p>}<fieldset disabled={disabled} className="form-stack">
    <label>Tipo de atividade<select value={draft.type} onChange={e=>changeType(e.target.value)}><option value="manual">Sem atividade</option>{actionCatalog.filter(a=>a.domain==='input').map(a=><option key={a.type} value={a.type}>{a.label}</option>)}</select></label>
    {draft.type!=='manual' && elementSelect('Elemento inicial da atividade',draft.instanceId,instanceId=>update({instanceId}))}
    {['holdMs','distance','tolerance'].filter(key=>key in draft).map(key=><label key={key}>{({holdMs:'Pressão mínima (ms)',distance:'Distância mínima (pixels)',tolerance:'Tolerância (pixels)'})[key]}<input type="number" value={draft[key]} onChange={e=>update({[key]:Number(e.target.value)})}/></label>)}
    {kind==='swipe' && <label>Direção do gesto<select value={draft.direction} onChange={e=>update({direction:e.target.value})}>{Object.entries({left:'Esquerda',right:'Direita',up:'Cima',down:'Baixo'}).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}
    {draft.expected && <div><p>{kind==='sort'?'Ordem correta':'Elementos corretos'}</p>{draft.expected.map((id,index)=><div key={index} className="rig-inline">{elementSelect('Resposta '+(index+1),id,value=>update({expected:draft.expected.map((v,i)=>i===index?value:v)}))}<button type="button" disabled={draft.expected.length===1} onClick={()=>update({expected:draft.expected.filter((_,i)=>i!==index)})}>Remover resposta</button></div>)}<button type="button" disabled={draft.expected.length>=24} onClick={()=>update({expected:[...draft.expected,'']})}>Adicionar resposta</button></div>}
    {draft.pairs && <div>{draft.pairs.map((pair,index)=><div key={index} className="rig-inline">{elementSelect('Origem do par '+(index+1),pair.source,source=>update({pairs:draft.pairs.map((v,i)=>i===index?{...v,source}:v)}))}{elementSelect('Destino do par '+(index+1),pair.target,target=>update({pairs:draft.pairs.map((v,i)=>i===index?{...v,target}:v)}))}<button type="button" disabled={draft.pairs.length===1} onClick={()=>update({pairs:draft.pairs.filter((_,i)=>i!==index)})}>Remover par</button></div>)}<button type="button" disabled={draft.pairs.length>=24} onClick={()=>update({pairs:[...draft.pairs,{source:'',target:''}]})}>Adicionar par</button></div>}
    {draft.path && <PathFields points={draft.path} onChange={path=>update({path})}/>}
    <button type="button" onClick={()=>{const result=triggerSchema.safeParse(draft);if(!result.success) {setError('Confira os elementos e parâmetros da atividade. '+result.error.issues[0].message);return;}onChange(result.data);setError('');}}>Aplicar regra de interação</button>
  </fieldset></section>;
}
