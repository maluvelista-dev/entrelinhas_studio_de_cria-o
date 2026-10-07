import { programSchema, emptyProgram } from '@studio/schemas/actions';
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
  if (program.trigger.type === 'input.tap') instance(program.trigger.instanceId);
  for (const action of program.actions) {
    instance(action.actorId, 'actor');
    if (action.objectId) instance(action.objectId, 'object');
    if (action.anchor) anchorData(action.actorId, action.anchor);
    if (action.sourceAnchor) anchorData(action.actorId, action.sourceAnchor);
    if (action.target?.kind === 'anchor') { anchorData(action.target.instanceId, action.target.anchor); if (action.target.instanceId === action.actorId) throw new Error('O destino não pode ser o próprio ator.'); }
  }
  function evaluate(requested, runProgram = true) {
    if (!Number.isFinite(requested)) throw new Error('Tempo inválido.');
    const time = Math.max(0, Math.min(duration, requested)), positions = new Map(), held = new Map(), released = new Map();
    const base = new Map(prepared.nodes.map(n => [n.entity.id, { id: n.entity.id, ...n.transform, opacity: n.entity.opacity }]));
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
      for (const [id,point] of positions) Object.assign(transforms.get(id),point);
      const world = new Map();
      for (const node of prepared.nodes) { const id=node.entity.id, local=composeTransform(transforms.get(id)); world.set(id,node.entity.parentId ? multiply(world.get(node.entity.parentId),local) : local); }
      for (const [id,matrix] of released) world.set(instance(id).nodeId,matrix);
      function anchorMatrix(id,name) { const a=anchorData(id,name); return multiply(world.get(a.nodeId),[1,0,0,1,a.position.x,a.position.y]); }
      for (const [id,link] of held) world.set(instance(id).nodeId,multiply(anchorMatrix(link.actorId,link.anchor),link.offset));
      for (const matrix of world.values()) if (!matrix.every(n => Number.isFinite(n) && Math.abs(n)<=1e9)) throw new Error('Transformação excede os limites.');
      return { transforms: [...transforms.values()], matrices: objects.map(o => ({ id: o.nodeId, matrix: world.get(o.nodeId) })), world, held: new Map(held), anchorMatrix };
    }
    if (!runProgram) return frame(0,false);
    let cursor=0;
    for (const action of program.actions) {
      if (cursor > time) break;
      const current=frame(cursor), actor=instance(action.actorId,'actor');
      if (action.type === 'object.grab') {
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
  evaluate(duration);
  return { duration, program, at: time => evaluate(time), initial: () => evaluate(0,false) };
}
