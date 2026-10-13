import { test, expect } from 'vitest';
import { createInteractionRuntime } from './interaction.js';
import { createScenePlayer } from './scene-player.js';
const scene = { schemaVersion: 1, width: 500, height: 500, background: '#ffffff', entities: [
  { id: 'actor', kind: 'group', width: 100, height: 100, color: '#ffffff', position: { x: 10, y: 10 } },
  { id: 'hand', parentId: 'actor', kind: 'rectangle', width: 10, height: 10, color: '#ff0000', position: { x: 20, y: 0 } },
  { id: 'ball', kind: 'rectangle', width: 10, height: 10, color: '#0000ff', position: { x: 30, y: 10 } },
] };
const actors = [{ id: 'luna', nodeId: 'actor', anchors: [{ name: 'hand', nodeId: 'hand', position: { x: 0, y: 0 } }] }];
const objects = [{ id: 'ball', nodeId: 'ball', anchors: [] }];
const program = { schemaVersion: 1, trigger: { type: 'manual' }, actions: [
  { type: 'object.grab', actorId: 'luna', objectId: 'ball', anchor: 'hand' },
  { type: 'object.carry', actorId: 'luna', objectId: 'ball', sourceAnchor: null, target: { kind: 'point', point: { x: 110, y: 10 } }, duration: 2 },
  { type: 'object.release', actorId: 'luna', objectId: 'ball' },
  { type: 'movement.moveTo', actorId: 'luna', sourceAnchor: null, target: { kind: 'point', point: { x: 210, y: 10 } }, duration: 2 },
] };
test('carry follows live anchors, release preserves world position and seek reconstructs ownership', () => {
  const runtime = createInteractionRuntime({ scene, actors, objects, program });
  expect(runtime.at(1).world.get('ball')[4]).toBeCloseTo(80);
  expect(runtime.at(4).world.get('ball')[4]).toBeCloseTo(130);
  expect(runtime.at(4).world.get('actor')[4]).toBeCloseTo(210);
  expect(runtime.at(1).held.get('ball').actorId).toBe('luna');
  expect(runtime.initial().world.get('ball')[4]).toBeCloseTo(30);
  expect(runtime.initial().held.size).toBe(0);
});
test('rejects invalid targets, duplicate ownership and carrying an unheld object', () => {
  for (const actions of [[program.actions[1]], [program.actions[0],program.actions[0]], [{ ...program.actions[0], anchor: 'missing' }], [{ ...program.actions[3], target: { kind: 'anchor', instanceId: 'luna', anchor: 'hand' } }]]) {
    expect(() => createInteractionRuntime({ scene, actors, objects, program: { ...program, actions } })).toThrow();
  }
});

test('animated anchors carry through rotated and mirrored parents; reset restores the original scene', () => {
  const input=structuredClone(scene); input.entities[0].id='luna__instance'; input.entities[0].rotation=Math.PI/2; input.entities[0].scaleX=-2; input.entities[0].scaleY=1.5;
  input.entities[1].id='luna__part__hand'; input.entities[1].parentId='luna__instance';
  const transform={ id:'hand',x:20,y:0,rotation:0,scaleX:1,scaleY:1,opacity:1 };
  const animation={ schemaVersion:1,perspective:'front',skeleton:[{ id:'hand',parentId:null,pivot:{x:0,y:0} }],duration:2,ease:'none',keyframes:[{time:0,transforms:[transform]},{time:2,transforms:[{...transform,x:30}]}] };
  const runtime=createInteractionRuntime({ scene:input,actors:[{ id:'luna',nodeId:'luna__instance',anchors:[{ name:'hand',nodeId:'luna__part__hand',position:{x:0,y:0} }] }],objects,animations:[{instanceId:'luna',definition:animation}],program:{ ...program,actions:[program.actions[0]] } });
  expect(runtime.at(1).world.get('ball')[4]).toBeCloseTo(30);
  expect(runtime.at(1).world.get('ball')[5]).toBeCloseTo(0);
  expect(runtime.at(2).world.get('ball')[5]).toBeCloseTo(-10);
  expect(runtime.initial().world.get('ball')[5]).toBeCloseTo(10);
  expect(scene.entities[0].position).toEqual({x:10,y:10});
});

test('single scene clock supports pause, backward seek, reset and disposal without autoplay', () => {
  const frames=[]; const player=createScenePlayer({scene,actors,objects,program},frame=>frames.push(frame));
  expect(frames).toHaveLength(0); player.seek(4);expect(frames.at(-1).world.get('ball')[4]).toBeCloseTo(130);
  player.seek(1);expect(frames.at(-1).world.get('ball')[4]).toBeCloseTo(80);
  player.pause();player.reset();expect(frames.at(-1).held.size).toBe(0);expect(frames.at(-1).world.get('ball')[4]).toBeCloseTo(30);
  player.destroy();expect(()=>player.play()).toThrow();expect(()=>player.seek(1)).toThrow();
  const count=frames.length; const instant=createScenePlayer({scene,actors,objects,program:{...program,actions:[program.actions[0]]}},frame=>frames.push(frame));
  expect(frames).toHaveLength(count);instant.play();expect(frames.at(-1).held.get('ball').actorId).toBe('luna');instant.destroy();
});

test('scene player reports rendering failure and can be disposed without leaking its clock',()=>{
  const errors=[];const player=createScenePlayer({scene,actors,objects,program},()=>{throw new Error('render failed');},error=>errors.push(error.message));
  player.seek(1);expect(errors).toEqual(['render failed']);player.pause();player.destroy();expect(()=>player.play()).toThrow();
});
