import { expect, test } from 'vitest';
import { createInputController } from './input-controller.js';
const event=(x=0,y=0,time=0,id='a')=>({id,point:{x,y},time,pointerId:1});
function create(type,options={}) {const completions=[],messages=[];const input=createInputController({type:'input.'+type,instanceId:'a',...options},{complete:()=>completions.push(true),feedback:v=>messages.push(v)});return {input,completions,messages};}
test('tap, double tap and press distinguish timing and reject drags',()=>{
  const tap=create('tap');tap.input.down(event());tap.input.up(event(100,0,50));expect(tap.completions).toHaveLength(0);tap.input.down(event());tap.input.up(event(0,0,100));expect(tap.completions).toHaveLength(1);
  const double=create('doubleTap');double.input.down(event());double.input.up(event(0,0,100));expect(double.completions).toHaveLength(0);double.input.down(event(0,0,200));double.input.up(event(0,0,250));expect(double.completions).toHaveLength(1);
  const press=create('press');press.input.down(event());expect(press.completions).toHaveLength(1);
});
test('hold requires uninterrupted time and cancels when moved or pointer cancelled',()=>{
  const {input,completions}=create('hold',{holdMs:800});input.down(event());input.tick(799);expect(completions).toHaveLength(0);input.move(event(30));input.tick(900);expect(completions).toHaveLength(0);input.cancel();input.down(event());input.tick(800);expect(completions).toHaveLength(1);input.tick(900);expect(completions).toHaveLength(1);
});
test('drag threshold, drop target and swipe direction must match',()=>{
  const drag=create('drag',{distance:50});drag.input.down(event());drag.input.up(event(20,0,100));expect(drag.completions).toHaveLength(0);drag.input.down(event());drag.input.up(event(60,0,100));expect(drag.completions).toHaveLength(1);
  const drop=create('drop',{distance:10,tolerance:20,pairs:[{source:'a',target:'b'}]});drop.input.down(event());drop.input.up({...event(60,0,100),targetId:'c',targetDistance:0});expect(drop.completions).toHaveLength(0);drop.input.down(event());drop.input.up({...event(60,0,100),targetId:'b',targetDistance:10});expect(drop.completions).toHaveLength(1);
  const swipe=create('swipe',{distance:50,direction:'left'});swipe.input.down(event());swipe.input.up(event(60,0,100));expect(swipe.completions).toHaveLength(0);swipe.input.down(event());swipe.input.up(event(-60,0,100));expect(swipe.completions).toHaveLength(1);
});
test('trace rejects shortcuts and deviations, accepts ordered path',()=>{
  const {input,completions}=create('trace',{tolerance:10,path:[{x:0,y:0},{x:50,y:0},{x:50,y:50}]});
  input.down(event());input.move(event(50,50));input.up(event(50,50,100));expect(completions).toHaveLength(0);input.reset();input.down(event());input.move(event(25));input.move(event(50));input.move(event(50,25));input.move(event(50,50));input.up(event(50,50,200));expect(completions).toHaveLength(1);
});
test.each(['choose','find','collect'])('%s checks expected items without duplicate scoring',kind=>{
  const {input,completions}=create(kind,{expected:['a','b']});input.select('c');expect(completions).toHaveLength(0);input.select('a');input.select('a');expect(completions).toHaveLength(kind==='choose'?1:0);input.select('b');expect(completions).toHaveLength(1);input.reset();input.select('a');input.select('b');expect(completions).toHaveLength(2);
});
test('sort restarts after a wrong choice and completes only in order',()=>{
  const {input,completions}=create('sort',{expected:['b','a']});input.select('a');input.select('b');expect(completions).toHaveLength(0);input.select('a');expect(completions).toHaveLength(1);
});
test.each(['match','assemble'])('%s checks source/destination pairs and all pieces',kind=>{
  const {input,completions}=create(kind,{pairs:[{source:'a',target:'b'},{source:'c',target:'d'}],...(kind==='assemble'?{tolerance:20}:{})});input.select('a');input.select('d');expect(completions).toHaveLength(0);input.select('a');input.select('b');input.select('c');input.select('d');expect(completions).toHaveLength(1);
});

test('assembly snaps completed pieces and cannot score a piece that was moved away',()=>{
  const placements=[],complete=[];const input=createInputController({type:'input.assemble',instanceId:'a',pairs:[{source:'a',target:'b'},{source:'c',target:'d'}],tolerance:20},{complete:()=>complete.push(true),place:(source,target)=>placements.push([source,target])});
  input.down(event());input.move(event(50));input.up({...event(50,0,100),targetId:'b',targetDistance:0});
  input.down(event());input.up({...event(80,0,200),targetId:'d',targetDistance:0});
  expect(placements).toEqual([['a','b']]);expect(complete).toHaveLength(0);
  input.select('c');input.select('d');expect(complete).toHaveLength(1);expect(placements).toEqual([['a','b'],['c','d']]);
});
