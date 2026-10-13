import { expect, test } from 'vitest';
import { actionCatalog, actionSchema } from '@studio/schemas/actions';
import { createInteractionRuntime } from './interaction.js';
const transform={id:'body',x:0,y:0,rotation:0,scaleX:1,scaleY:1,opacity:1};
const pose={schemaVersion:1,perspective:'front',skeleton:[{id:'body',parentId:null,pivot:{x:0,y:0}}],transforms:[transform]};
function fixture() {
  const actors=['a','b'].map((id,index)=>({id,nodeId:id,anchors:[{name:'contact',nodeId:id+'__part__body',position:{x:10,y:0}}],behaviors:actionCatalog.filter(a=>a.domain!=='input').map(a=>({action:a.type,aimPartId:'body',motion:pose,images:[]})),images:[],x:index*200}));
  const entities=actors.flatMap(a=>[{id:a.id,kind:'group',width:100,height:100,position:{x:a.x,y:100}}, {id:a.id+'__part__body',parentId:a.id,kind:'rectangle',width:20,height:20,position:{x:0,y:0}}]);
  entities.push({id:'ball',kind:'rectangle',width:20,height:20,position:{x:20,y:100}});
  return {scene:{schemaVersion:1,width:800,height:600,background:"#ffffff",entities:entities.map(e=>({...e,color:"#ffffff"}))},actors,objects:[{id:'ball',nodeId:'ball',anchors:[{name:'center',nodeId:'ball',position:{x:10,y:10}}]}]};
}
const grab=(actorId='a')=>({type:'object.grab',actorId,objectId:'ball',anchor:'contact'});
const point={kind:'point',point:{x:300,y:200}};
function make(info) {
  if(info.type==='object.grab') return grab();
  if(info.type==='object.release') return {type:info.type,actorId:'a',objectId:'ball'};
  const a={type:info.type,actorId:'a',duration:2};
  if(info.object) a.objectId='ball';
  if(info.partner) a.partnerId='b';
  if(info.target || ['movement.moveTo','object.carry'].includes(info.type)) {a.target=info.contact || info.mode==='follow' || info.name==='hideBehind'?{kind:'anchor',instanceId:'b',anchor:'contact'}:point;a.sourceAnchor=null;}
  if(info.contact || ['attach','transfer'].includes(info.mode)) a.anchor='contact';
  if(info.mode==='transfer') a.partnerAnchor='contact';
  if(info.mode==='objectTransform') a.objectAnchor='center';
  if(info.mode==='path') a.path=[{x:100,y:50},{x:300,y:200}];
  return actionSchema.parse(a);
}
const needsGrab=new Set(['object.release','object.carry','object.throw','object.placeOn','object.placeInside','interaction.give','interaction.receive']);
test.each(actionCatalog.filter(a=>a.domain!=='input'))('$type executes with finite replayable transforms and supports reset',info=>{
  const a=make(info),actions=needsGrab.has(a.type)?[grab(a.type==='interaction.receive'?'b':'a'),a]:[a];
  const runtime=createInteractionRuntime({...fixture(),program:{schemaVersion:1,trigger:{type:'manual'},actions}});
  const middle=runtime.at(runtime.duration/2),end=runtime.at(runtime.duration);
  for(const matrix of end.world.values()) expect(matrix.every(Number.isFinite)).toBe(true);
  const replay=runtime.at(runtime.duration/2);expect(replay.world).toEqual(middle.world);expect(replay.transforms).toEqual(middle.transforms);expect(replay.held).toEqual(middle.held);expect(replay.images).toEqual(middle.images);
  expect(runtime.initial().held.size).toBe(0);
  expect(runtime.initial().world.get('a')[4]).toBe(0);
});
function run(actions,input=fixture()) {return createInteractionRuntime({...input,program:{schemaVersion:1,trigger:{type:'manual'},actions}});}
test('jump arcs, spin rotates, path visits waypoints and fades change opacity',()=>{
  const jump=run([{...make(actionCatalog.find(a=>a.type==='movement.jumpTo')),amplitude:80}]);
  expect(jump.at(1).world.get('a')[4]).toBeCloseTo(150);
  expect(jump.at(1).world.get('a')[5]).toBeCloseTo(70);
  expect(jump.at(2).world.get('a')[5]).toBeCloseTo(200);
  const spin=run([make(actionCatalog.find(a=>a.type==='acrobatics.spin'))]);
  expect(spin.at(0.5).world.get('a')[0]).toBeCloseTo(0);
  expect(spin.at(0.5).world.get('a')[1]).toBeCloseTo(1);
  const path=run([make(actionCatalog.find(a=>a.type==='flying.flyPath'))]);
  expect(path.at(1).world.get('a').slice(4)).toEqual([100,50]);
  const fade=run([make(actionCatalog.find(a=>a.type==='effect.fadeOut'))]);
  expect(fade.at(1).transforms.find(t=>t.id==='a').opacity).toBe(0.5);
});
test('give transfers exclusive possession; release after transfer requires new owner',()=>{
  const give=make(actionCatalog.find(a=>a.type==='interaction.give'));
  const runtime=run([grab(),give]);
  expect(runtime.at(1).held.get('ball').actorId).toBe('a');
  expect(runtime.at(2).held.get('ball').actorId).toBe('b');
  expect(runtime.at(2).world.get('ball')).toEqual(runtime.at(0).world.get('ball'));
  expect(()=>run([grab(),give,{type:'object.release',actorId:'a',objectId:'ball'}])).toThrow();
});
test('throw detaches and lands at target; rotating objects preserves pivot',()=>{
  const runtime=run([grab(),{...make(actionCatalog.find(a=>a.type==='object.throw')),amplitude:80}]);
  expect(runtime.at(1).held.size).toBe(0);
  expect(runtime.at(1).world.get('ball').slice(4)).toEqual([160,70]);
  expect(runtime.at(2).world.get('ball').slice(4)).toEqual([300,200]);
  const rotate=run([make(actionCatalog.find(a=>a.type==='object.rotate'))]).at(2).world.get('ball');
  expect(rotate[0]*10+rotate[2]*10+rotate[4]).toBeCloseTo(30);
  expect(rotate[1]*10+rotate[3]*10+rotate[5]).toBeCloseTo(110);
});
test('missing mappings, wrong partner and unknown fields are rejected',()=>{
  const input=fixture();input.actors[0].behaviors=[];
  expect(()=>run([make(actionCatalog.find(a=>a.type==='expression.smile'))],input)).toThrow(/Mapeie/);
  expect(()=>run([{...make(actionCatalog.find(a=>a.type==='interaction.hug')),target:{kind:'anchor',instanceId:'ball',anchor:'center'}}])).toThrow(/parceiro/);
  expect(actionSchema.safeParse({...grab(),url:'https://example.com'}).success).toBe(false);
});
test('directed gestures orient mapped part toward destination and reuse authored images',()=>{
  const look=make(actionCatalog.find(a=>a.type==='gesture.lookAt'));look.target={kind:'point',point:{x:0,y:200}};
  const input=fixture();input.actors[0].images=[{partId:'alternative',assetId:'image_alt'}];input.actors[0].behaviors.find(b=>b.action==='gesture.lookAt').images=[{partId:'body',sourcePartId:'alternative'}];
  const state=run([look],input).at(2);
  expect(state.transforms.find(t=>t.id==='a__part__body').rotation).toBeCloseTo(Math.PI/2);
  expect(state.images).toEqual([{id:'a__part__body',assetId:'image_alt'}]);
});

test('wander is deterministic, seed-sensitive and constrained to the authored region',()=>{
  const action=make(actionCatalog.find(a=>a.type==='movement.wander'));
  const runtime=run([action]),other=run([{...action,seed:123}]);
  expect(runtime.at(2).world.get('a')).not.toEqual(other.at(2).world.get('a'));
  for(const time of [0.5,1,1.5,2]) {const matrix=runtime.at(time).world.get('a');expect(matrix[4]).toBeGreaterThanOrEqual(100);expect(matrix[4]).toBeLessThanOrEqual(300);expect(matrix[5]).toBeGreaterThanOrEqual(50);expect(matrix[5]).toBeLessThanOrEqual(200);}
});
test('scene effects reach all instances and hanging keeps the contact point fixed',()=>{
  const effect=make(actionCatalog.find(a=>a.type==='effect.fadeOut'));
  const state=run([{...effect,scope:'scene'}]).at(1);
  for(const id of ['a','b','ball']) expect(state.transforms.find(t=>t.id===id).opacity).toBe(0.5);
  const swing=run([make(actionCatalog.find(a=>a.type==='climbing.swing'))]);
  const middle=swing.at(0.5),contact=middle.anchorMatrix('a','contact'),support=middle.anchorMatrix('b','contact');
  expect(contact[4]).toBeCloseTo(support[4]);expect(contact[5]).toBeCloseTo(support[5]);
});
test('mapped body motion rejects overlapping continuous animation and self-follow through held objects',()=>{
  const input=fixture();input.animations=[{instanceId:'a',definition:{...pose,duration:2,ease:'none',keyframes:[{time:0,transforms:[transform]},{time:2,transforms:[{...transform,x:10}]}]}}];delete input.animations[0].definition.transforms;
  expect(()=>run([make(actionCatalog.find(a=>a.type==='movement.walkTo'))],input)).toThrow(/contínua/);
  expect(()=>run([grab(),{...make(actionCatalog.find(a=>a.type==='movement.follow')),target:{kind:'anchor',instanceId:'ball',anchor:'center'}}])).toThrow(/próprio ator/);
});

test('validates intermediate mapped keyframes, not only the final pose',()=>{
  const input=fixture();input.scene.entities.find(e=>e.id==='a').scaleX=100000;
  const binding=input.actors[0].behaviors.find(b=>b.action==='movement.walkTo');binding.motion={schemaVersion:1,perspective:'front',skeleton:pose.skeleton,duration:2,ease:'none',keyframes:[{time:0,transforms:[transform]},{time:1,transforms:[{...transform,scaleX:100000}]},{time:2,transforms:[transform]}]};
  expect(()=>run([make(actionCatalog.find(a=>a.type==='movement.walkTo'))],input)).toThrow(/limites/);
});
