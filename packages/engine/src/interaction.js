import { programSchema, emptyProgram, actionInfo } from '@studio/schemas/actions';
import { animationSchema } from '@studio/schemas/motion';
import { interpretScene } from './scene.js';
import { composeTransform, multiply, localToWorld, worldToLocal } from './coordinates.js';
const mix = (a,b,t) => a + (b-a)*t;
function inverse(m) {
  const o = worldToLocal({ x: 0, y: 0 }, m), x = worldToLocal({ x: 1, y: 0 }, m), y = worldToLocal({ x: 0, y: 1 }, m);
  return [x.x-o.x,x.y-o.y,y.x-o.x,y.y-o.y,o.x,o.y];
}
function eased(t, ease) { return ease === 'none' ? t : ease === 'sine.inOut' ? (1-Math.cos(Math.PI*t))/2 : t < 0.5 ? 2*t*t : 1-2*(1-t)*(1-t); }
export function createInteractionRuntime({ scene, actors = [], objects = [], animations = [], program: raw = emptyProgram() }) {
  const prepared = interpretScene(scene), program = programSchema.parse(raw);
  const entries = [...actors.map(a => ({ ...a, kind: 'actor' })), ...objects.map(a => ({ ...a, kind: a.movable === false ? 'background' : 'object' }))];
  const instances = new Map(entries.map(a => [a.id,a]));
  if (instances.size !== entries.length) throw new Error('Instância duplicada.');
  const nodes = new Map(prepared.nodes.map(n => [n.entity.id,n]));
  for (const item of entries) {
    if (!nodes.has(item.nodeId) || nodes.get(item.nodeId).entity.parentId !== null) throw new Error('Raiz de instância inválida.');
    if (new Set(item.anchors.map(a => a.name)).size !== item.anchors.length) throw new Error('Anchor duplicado.');
    for (const anchor of item.anchors) if (!nodes.has(anchor.nodeId)) throw new Error('Parte do anchor inexistente.');
  }
  const clips = animations.map(a => ({ ...a, definition: animationSchema.parse(a.definition) }));
  const animated = new Set();
  for (const clip of clips) for (const part of clip.definition.keyframes[0].transforms) {
    const id = clip.instanceId + '__part__' + part.id;
    if (!nodes.has(id) || animated.has(id)) throw new Error('Animações conflitantes ou parte inexistente.');
    animated.add(id);
  }
  const actionDuration = program.actions.reduce((sum,a) => sum+(a.duration || 0),0);
  const duration = Math.max(actionDuration, ...clips.map(c => c.definition.duration), 0);
  function instance(id, kind) { const item = instances.get(id); if (!item || (kind && item.kind !== kind)) throw new Error('Instância inválida: ' + id); return item; }
  function anchorData(id, name) { const item = instance(id); const anchor = item.anchors.find(a => a.name === name); if (!anchor) throw new Error('Anchor inexistente: ' + name); return anchor; }
  if (program.trigger.type !== 'manual') {
    instance(program.trigger.instanceId);
    for(const id of program.trigger.expected || []) instance(id);
    for(const pair of program.trigger.pairs || []) {instance(pair.source);instance(pair.target);}
  }
  for (const action of program.actions) {
    const info=actionInfo(action.type), actor=instance(action.actorId,info.domain==='effect' ? undefined : 'actor');
    for(const id of [action.actorId,action.partnerId].filter(Boolean)) if(instances.get(id)?.behaviors?.find(b=>b.action===action.type)?.motion && clips.some(c=>c.instanceId===id)) throw new Error('Remova a animação contínua da página antes de usar uma capacidade corporal no mesmo personagem.');
    if(info.mapped && !actor.behaviors?.some(b=>b.action===action.type)) throw new Error('Mapeie '+info.label+' na estrutura do personagem.');
    if(action.partnerId) { const partner=instance(action.partnerId,'actor');if(partner.id===actor.id) throw new Error('Selecione outro personagem.');if(info.mapped && !partner.behaviors?.some(b=>b.action===action.type)) throw new Error('Mapeie '+info.label+' também no outro personagem.'); }
    if(info.contact && action.target?.kind!=='anchor') throw new Error('Esta ação exige um anchor de apoio/contato.');
    if(info.mode==='mapped' && info.target && !actor.behaviors?.find(b=>b.action===action.type)?.aimPartId) throw new Error('Mapeie a parte orientada para o destino.');
    if(action.partnerId && info.contact && action.target?.instanceId!==action.partnerId) throw new Error('O contato deve apontar para o parceiro selecionado.');
    if(action.objectId && action.target?.kind==='anchor' && action.target.instanceId===action.objectId) throw new Error('O objeto não pode ser seu próprio destino.');
    if(action.objectAnchor) anchorData(action.objectId,action.objectAnchor);
    if(info.mode==='follow' && action.target?.kind!=='anchor') throw new Error('Seguir exige um anchor de outro elemento.');
    if(info.mode==='follow' && action.partnerId && action.target.instanceId!==action.partnerId) throw new Error('O destino deve ser o personagem seguido.');
    if(info.name==='hideBehind' && (action.target?.kind!=='anchor' || (action.partnerId && action.target.instanceId!==action.partnerId))) throw new Error('Esconder atrás exige um anchor do elemento selecionado.');
    if(action.partnerAnchor) anchorData(action.partnerId,action.partnerAnchor);
    if (action.objectId) instance(action.objectId, 'object');
    if (action.anchor) anchorData(action.actorId, action.anchor);
    if (action.sourceAnchor) anchorData(action.actorId, action.sourceAnchor);
    if (action.target?.kind === 'anchor') { anchorData(action.target.instanceId, action.target.anchor); if (action.target.instanceId === action.actorId) throw new Error('O destino não pode ser o próprio ator.'); }
  }
  function evaluate(requested, runProgram = true) {
    if (!Number.isFinite(requested)) throw new Error('Tempo inválido.');
    const time = Math.max(0, Math.min(duration, requested)), positions = new Map(), held = new Map(), released = new Map();
    const overrides=new Map(), imageChanges=new Map(), effects=new Map();
    const base = new Map(prepared.nodes.map(n => [n.entity.id, { id: n.entity.id, ...n.transform, opacity: n.entity.opacity,zIndex:n.entity.zIndex }]));
    function frame(at, animate = true) {
      const transforms = new Map([...base].map(([id,t]) => [id, { ...t }]));
      if (animate) for (const clip of clips) {
        const value = clip.definition, t = Math.min(at,value.duration);
        const nextIndex = value.keyframes.findIndex(f => f.time >= t);
        const end = value.keyframes[Math.max(0,nextIndex)], start = value.keyframes[Math.max(0,nextIndex-1)];
        const p = eased(end.time === start.time ? 0 : (t-start.time)/(end.time-start.time),value.ease);
        for (const from of start.transforms) {
          const to = end.transforms.find(a => a.id === from.id), target = transforms.get(clip.instanceId+'__part__'+from.id);
          for (const key of ['x','y','rotation','scaleX','scaleY','opacity']) target[key] = mix(from[key],to[key],p);
        }
      }
      for (const [id,patch] of overrides) Object.assign(transforms.get(id),patch);
      for (const [id,point] of positions) Object.assign(transforms.get(id),point);
      const world = new Map();
      for (const node of prepared.nodes) { const id=node.entity.id, local=composeTransform(transforms.get(id)); world.set(id,node.entity.parentId ? multiply(world.get(node.entity.parentId),local) : local); }
      for (const [id,matrix] of released) world.set(instance(id).nodeId,matrix);
      function anchorMatrix(id,name) { const a=anchorData(id,name); return multiply(world.get(a.nodeId),[1,0,0,1,a.position.x,a.position.y]); }
      for (const [id,link] of held) world.set(instance(id).nodeId,multiply(anchorMatrix(link.actorId,link.anchor),link.offset));
      for (const matrix of world.values()) if (!matrix.every(n => Number.isFinite(n) && Math.abs(n)<=1e9)) throw new Error('Transformação excede os limites.');
      return { images:[...imageChanges.values()], effects:[...effects.values()], transforms: [...transforms.values()], matrices: objects.map(o => ({ id: o.nodeId, matrix: world.get(o.nodeId) })), world, held: new Map(held), anchorMatrix };
    }
    if (!runProgram) return frame(0,false);
    let cursor=0;
    for (const action of program.actions) {
      if (cursor > time) break;
      const current=frame(cursor), actor=instance(action.actorId), info=actionInfo(action.type);
      if (!['movement.moveTo','object.grab','object.carry','object.release'].includes(action.type)) {
        const linear=Math.min(1,Math.max(0,(time-cursor)/action.duration)),p=info.name==='fall'?linear*linear:linear;
        const patch=(id,value)=>overrides.set(id,{...overrides.get(id),...value});
        const root=current.transforms.find(t=>t.id===actor.nodeId);
        const motion=(item)=> {
          const binding=item.behaviors?.find(b=>b.action===action.type);if(!binding) return;
          const m=binding.motion;
          if(m) {
            let from,to,phase=p;
            if(m.keyframes) { const t=p*m.duration,index=m.keyframes.findIndex(f=>f.time>=t);to=m.keyframes[Math.max(0,index)];from=m.keyframes[Math.max(0,index-1)];phase=eased(to.time===from.time?0:(t-from.time)/(to.time-from.time),m.ease); }
            else {to={transforms:m.transforms};from={transforms:m.transforms.map(t=>({...current.transforms.find(v=>v.id===item.id+'__part__'+t.id),id:t.id}))};}
            for(const a of from.transforms) {const b=to.transforms.find(t=>t.id===a.id),value={};for(const k of ['x','y','rotation','scaleX','scaleY','opacity']) value[k]=k.startsWith('scale') && Math.sign(a[k])!==Math.sign(b[k]) ? mix(Math.abs(a[k]),Math.abs(b[k]),phase)*(phase<1?Math.sign(a[k]):Math.sign(b[k])) : mix(a[k],b[k],phase);patch(item.id+'__part__'+a.id,value);}
          }
          for(const image of binding.images) imageChanges.set(item.id+'__part__'+image.partId,{id:item.id+'__part__'+image.partId,assetId:item.images.find(i=>i.partId===image.sourcePartId).assetId});
        };
        motion(actor);if(action.partnerId) motion(instance(action.partnerId));
        const target=()=>action.target.kind==='point' ? action.target.point : localToWorld({x:0,y:0},(info.mode==='follow'?frame(time):current).anchorMatrix(action.target.instanceId,action.target.anchor));
        const align=(item,dest,source=null)=> {
          const t=current.transforms.find(v=>v.id===item.nodeId),origin=localToWorld({x:0,y:0},source?frame(cursor+action.duration).anchorMatrix(item.id,source):current.world.get(item.nodeId));
          positions.set(item.nodeId,{x:t.x+(dest.x-origin.x)*p,y:t.y+(dest.y-origin.y)*p});
        };
        const amplitude=action.amplitude || 0,cycles=action.cycles || 1,wave=Math.sin(p*Math.PI*2*cycles),arc=Math.sin(Math.PI*p)*amplitude;
        const object=action.objectId?instance(action.objectId):null;
        const attach=(owner,anchor)=> {
          if(held.has(object.id)) throw new Error('Objeto já está sendo carregado.');
          const now=frame(cursor);held.set(object.id,{actorId:owner.id,anchor,offset:multiply(inverse(now.anchorMatrix(owner.id,anchor)),now.world.get(object.nodeId))});released.delete(object.id);
        };
        if(info.mode==='attach') { if(info.name==='takeFrom') patch(object.nodeId,{opacity:p});if(p===1) attach(actor,action.anchor); }
        else if(info.mode==='transfer') {
          const giver=info.name==='give'?actor:instance(action.partnerId),receiver=info.name==='give'?instance(action.partnerId):actor;
          if(held.get(object.id)?.actorId!==giver.id) throw new Error('O remetente não está segurando o objeto.');
          if(p===1) {const world=frame(cursor+action.duration).world.get(object.nodeId);held.delete(object.id);released.set(object.id,world);attach(receiver,info.name==='give'?action.partnerAnchor:action.anchor);}
        } else if(info.mode==='effect') {
          for(const affected of action.scope==='scene'?entries:[actor]) {
          const actor=affected,root=current.transforms.find(t=>t.id===actor.nodeId);
          if(['glow','sparkle'].includes(info.name)) effects.set(actor.nodeId,{id:actor.nodeId,type:info.name,phase:p,intensity:Math.sin(Math.PI*p),amplitude});
          else if(['fadeIn','fadeOut','appear','disappear'].includes(info.name)) patch(actor.nodeId,{opacity:info.name==='fadeIn'?p:info.name==='fadeOut'?root.opacity*(1-p):info.name==='appear'?1:0});
          else if(['grow','shrink','pulse'].includes(info.name)) {const factor=info.name==='grow'?1+p:info.name==='shrink'?1-p*0.9:1+0.15*wave;patch(actor.nodeId,{scaleX:root.scaleX*factor,scaleY:root.scaleY*factor});}
          else if(info.name==='sway') patch(actor.nodeId,{rotation:root.rotation+wave*0.15});
          else positions.set(actor.nodeId,{x:root.x+(info.name==='shake'?wave*amplitude:0),y:root.y+(info.name==='float'?-arc:0)});
          if(actor.kind!=='actor' && released.has(actor.id)) {
            const matrix=[...current.world.get(actor.nodeId)];let changed=matrix;
            if(['pulse','grow','shrink'].includes(info.name)) {const factor=info.name==='grow'?1+p:info.name==='shrink'?1-p*0.9:1+0.15*wave;changed=multiply(matrix,[factor,0,0,factor,0,0]);}
            if(info.name==='sway') {const angle=wave*0.15;changed=multiply(matrix,[Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0]);}
            if(info.name==='shake') changed[4]+=wave*amplitude;if(info.name==='float') changed[5]-=arc;
            released.set(actor.id,changed);
          }
          }
        } else if(info.mode==='objectTransform') {
          if(held.has(object.id)) throw new Error('Solte o objeto antes de transformar.');
          const matrix=[...current.world.get(object.nodeId)];
          if(info.name==='shake') matrix[4]+=wave*amplitude;
          else {const angle=(info.name==='close'?-1:1)*action.angle*p;const cos=Math.cos(angle),sin=Math.sin(angle);const pivot=anchorData(object.id,action.objectAnchor).position;const rotated=multiply(matrix,multiply([1,0,0,1,pivot.x,pivot.y],multiply([cos,sin,-sin,cos,0,0],[1,0,0,1,-pivot.x,-pivot.y])));matrix.splice(0,6,...rotated);}
          released.set(object.id,matrix);
        } else if(info.mode==='path') {
          let route=action.path;
          if(info.name==='wander') {let seed=action.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const xs=route.map(p=>p.x),ys=route.map(p=>p.y),minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);route=Array.from({length:cycles*4},()=>({x:mix(minX,maxX,random()),y:mix(minY,maxY,random())}));}
          const points=[{x:root.x,y:root.y},...route],segment=p*(points.length-1),i=Math.min(points.length-2,Math.floor(segment)),q=segment-i;
          positions.set(actor.nodeId,{x:mix(points[i].x,points[i+1].x,q),y:mix(points[i].y,points[i+1].y,q)});
        } else if(info.mode==='stationary') {
          if(info.name==='spin') patch(actor.nodeId,{rotation:root.rotation+Math.PI*2*cycles*p});
          else if(info.name!=='flapWings') positions.set(actor.nodeId,{x:root.x,y:root.y-amplitude*(info.name==='hover'?Math.sin(Math.PI*2*p)*0.2:Math.abs(Math.sin(Math.PI*p*cycles)))});
        } else if(info.target) {
          if(action.target.kind==='anchor' && held.get(action.target.instanceId)?.actorId===actor.id) throw new Error('O destino acompanha o próprio ator.');
          const dest=target();
          if(info.domain==='object' && info.name!=='carry') {
            if(['throw','placeOn','placeInside'].includes(info.name) && held.get(object.id)?.actorId!==actor.id) throw new Error('Pegue o objeto antes de posicionar ou lançar.');
            if(!['throw','placeOn','placeInside'].includes(info.name) && held.has(object.id)) throw new Error('Objeto ocupado.');
            const matrix=[...current.world.get(object.nodeId)];matrix[4]=mix(matrix[4],dest.x,p);matrix[5]=mix(matrix[5],dest.y,p)-(info.name==='throw'?arc:0);held.delete(object.id);released.set(object.id,matrix);
            if(['push','pull','drag'].includes(info.name)) {const origin=current.world.get(object.nodeId);positions.set(actor.nodeId,{x:root.x+matrix[4]-origin[4],y:root.y+matrix[5]-origin[5]});}
            if(info.name==='placeInside') patch(object.nodeId,{opacity:1-p});
          } else if(info.mode==='mapped') {
            const binding=actor.behaviors.find(b=>b.action===action.type),id=actor.id+'__part__'+binding.aimPartId,node=nodes.get(id),state=frame(cursor),matrix=state.world.get(id),parent=node.entity.parentId?state.world.get(node.entity.parentId):[1,0,0,1,0,0];
            const local=worldToLocal(dest,parent),origin=worldToLocal({x:matrix[4],y:matrix[5]},parent);patch(id,{rotation:Math.atan2(local.y-origin.y,local.x-origin.x)});
          } else if(['pushCharacter','pullCharacter'].includes(info.name)) {const partner=instance(action.partnerId),before=current.transforms.find(t=>t.id===partner.nodeId);align(partner,dest);const after=positions.get(partner.nodeId);positions.set(actor.nodeId,{x:root.x+after.x-before.x,y:root.y+after.y-before.y});}
          else if(info.mode!=='mapped') {
            align(actor,dest,action.sourceAnchor || (info.contact?action.anchor:null));
            const point=positions.get(actor.nodeId);
            if(['jumpTo','jumpOff','somersault','trip'].includes(info.name)) point.y-=arc;
            if(['somersault','roll'].includes(info.name)) patch(actor.nodeId,{rotation:root.rotation+p*Math.PI*2*cycles});
            if(['hang','swing','balanceOn'].includes(info.name)) {if(info.name==='swing') patch(actor.nodeId,{rotation:root.rotation+wave*0.4});const live=frame(time),support=localToWorld({x:0,y:0},live.anchorMatrix(action.target.instanceId,action.target.anchor)),contact=localToWorld({x:0,y:0},live.anchorMatrix(actor.id,action.anchor));point.x+=support.x-contact.x;point.y+=support.y-contact.y;}
            if(['hideInside','enter'].includes(info.name)) patch(actor.nodeId,{opacity:root.opacity*(1-p)});
            if(['exit','peekFrom'].includes(info.name)) patch(actor.nodeId,{opacity:p});
            if(info.name==='hideBehind' && action.target.kind==='anchor') patch(actor.nodeId,{zIndex:(nodes.get(instance(action.target.instanceId).nodeId).entity.zIndex || 0)-1});
          }
        }
        cursor+=action.duration;if(time<cursor) break;
      } else if (action.type === 'object.grab') {
        if (held.has(action.objectId)) throw new Error('Objeto já está sendo carregado.');
        const object=instance(action.objectId,'object');
        held.set(object.id,{ actorId: actor.id, anchor: action.anchor, offset: multiply(inverse(current.anchorMatrix(actor.id,action.anchor)),current.world.get(object.nodeId)) });
        released.delete(object.id);
      } else if (action.type === 'object.release') {
        if (held.get(action.objectId)?.actorId !== actor.id) throw new Error('Este ator não está segurando o objeto.');
        released.set(action.objectId,current.world.get(instance(action.objectId).nodeId)); held.delete(action.objectId);
      } else {
        if (action.type === 'object.carry' && held.get(action.objectId)?.actorId !== actor.id) throw new Error('Pegue o objeto antes de carregar.');
        if (action.target.kind === 'anchor' && held.get(action.target.instanceId)?.actorId === actor.id) throw new Error('O destino acompanha o próprio ator.');
        const destination=action.target.kind === 'point' ? action.target.point : localToWorld({ x:0,y:0 },current.anchorMatrix(action.target.instanceId,action.target.anchor));
        const origin=localToWorld({ x:0,y:0 },action.sourceAnchor ? frame(cursor+action.duration).anchorMatrix(actor.id,action.sourceAnchor) : current.world.get(actor.nodeId));
        const from=current.transforms.find(t => t.id===actor.nodeId);
        const p=Math.min(1,Math.max(0,(time-cursor)/action.duration));
        positions.set(actor.nodeId,{ x:from.x+(destination.x-origin.x)*p,y:from.y+(destination.y-origin.y)*p });
        cursor+=action.duration;
        if (time<cursor) break;
      }
    }
    return frame(time);
  }
  // Validate the complete sequence, including transitions after the first movement.
  const checks=new Set([0,duration]);let cursor=0;
  for(const action of program.actions) {const span=action.duration || 0;checks.add(cursor+span/2);checks.add(cursor+span);for(const id of [action.actorId,action.partnerId].filter(Boolean)) {const motion=instances.get(id)?.behaviors?.find(b=>b.action===action.type)?.motion;if(motion?.keyframes) for(const frame of motion.keyframes) checks.add(cursor+span*frame.time/motion.duration);}cursor+=span;}
  for(const clip of clips) for(const frame of clip.definition.keyframes) checks.add(frame.time);
  for(const at of checks) evaluate(at);
  return { duration, program, at: time => evaluate(time), initial: () => evaluate(0,false) };
}
