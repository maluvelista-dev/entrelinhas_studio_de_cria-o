import { triggerSchema } from '@studio/schemas/actions';
// A preview attempt contains no child identity and never writes to the book.
export function createInputController(raw, { complete=()=>{}, feedback=()=>{}, move=()=>{}, place=()=>{} }={}) {
  const rule=triggerSchema.parse(raw), kind=rule.type.slice(6);
  let pressed=null,lastTap=null,selected=null,done=new Set(),index=0,finished=false;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function report(ok, message) {
    feedback({ok,message:ok?'Atividade concluída.':message,completed:done.size,index});
    if(ok && !finished) {finished=true;complete();}
  }
  function select(id) {
    if(finished) return;
    if(['choose','find','collect'].includes(kind)) {
      if(!rule.expected.includes(id)) return report(false,'Tente outro elemento.');
      done.add(id);report(kind==='choose' || done.size===rule.expected.length,'Elemento encontrado.');
    } else if(kind==='sort') {
      if(rule.expected[index]!==id) {index=0;done.clear();return report(false,'Ordem incorreta. Comece novamente.');}
      done.add(id);index++;report(index===rule.expected.length,'Ordem correta até aqui.');
    } else if(['match','assemble','drop'].includes(kind)) {
      if(!selected) {if(done.has(id)) return;selected=id;return report(false,'Selecione o destino.');}
      const source=selected;selected=null;
      if(rule.pairs.some(p=>p.source===source && p.target===id)) {done.add(source);if(kind==='assemble' || kind==='drop') place(source,id);report(done.size===rule.pairs.length,'Par correto.');}
      else report(false,'Este par não corresponde.');
    } else if(id===rule.instanceId && kind==='tap') report(true,'Toque reconhecido.');
  }
  return {
    select,
    reset() {pressed=null;lastTap=null;selected=null;done=new Set();index=0;finished=false;feedback({ok:false,message:'Atividade reiniciada.',completed:0,index:0});},
    down({id,point,time,pointerId=0}) {
      if((['drop','assemble'].includes(kind) && done.has(id)) || finished || pressed || (id!==rule.instanceId && !rule.pairs?.some(p=>p.source===id) && !rule.expected?.includes(id) && !['match','choose','sort','find','collect'].includes(kind))) return;
      pressed={id,point,last:point,time,pointerId,pathIndex:0,invalid:false};
      if(kind==='trace' && distance(point,rule.path[0])>rule.tolerance) pressed.invalid=true;
      if(kind==='press' && id===rule.instanceId) report(true,'Pressão reconhecida.');
    },
    tick(time) {if(!finished && pressed && kind==='hold' && !pressed.invalid && time-pressed.time>=rule.holdMs) report(true,'Tempo de pressão atingido.');},
    move({point,pointerId=0}) {
      if(!pressed || pressed.pointerId!==pointerId || finished) return;
      pressed.last=point;
      if(kind==='hold' && distance(point,pressed.point)>10) pressed.invalid=true;
      if(['drag','drop','assemble'].includes(kind)) move(pressed.id,{x:point.x-pressed.point.x,y:point.y-pressed.point.y});
      if(kind==='trace') {
        const target=rule.path[Math.min(pressed.pathIndex+1,rule.path.length-1)];
        const start=rule.path[pressed.pathIndex],dx=target.x-start.x,dy=target.y-start.y;
        const p=Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy)/(dx*dx+dy*dy || 1)));
        if(distance(point,{x:start.x+dx*p,y:start.y+dy*p})>rule.tolerance) pressed.invalid=true;
        if(distance(point,target)<=rule.tolerance) pressed.pathIndex=Math.min(pressed.pathIndex+1,rule.path.length-1);
      }
    },
    up({point,time,pointerId=0,targetId=null,targetDistance=Infinity}) {
      if(!pressed || pressed.pointerId!==pointerId) return;
      const start=pressed;pressed=null;if(finished) return;
      const travel=distance(start.point,point),elapsed=time-start.time;
      if(['choose','find','collect','sort','match'].includes(kind)) {if(travel<=10) select(start.id);return;}
      if(kind==='tap' && travel<=10 && elapsed<=500) report(true,'Toque reconhecido.');
      else if(kind==='doubleTap' && travel<=10 && elapsed<=500) {
        if(lastTap && time-lastTap.time<=400 && distance(lastTap.point,point)<=20) report(true,'Toque duplo reconhecido.');
        else lastTap={time,point};
      } else if(kind==='hold') report(!start.invalid && elapsed>=rule.holdMs,'Pressione sem mover pelo tempo configurado.');
      else if(kind==='drag') report(travel>=rule.distance,'Arraste até a distância configurada.');
      else if(['drop','assemble'].includes(kind)) {
        const valid=(kind!=='drop' || travel>=rule.distance) && rule.pairs.some(p=>p.source===start.id && p.target===targetId) && targetDistance<=rule.tolerance;
        if(valid) {done.add(start.id);place(start.id,targetId);}else move(start.id,{x:0,y:0});
        report(valid && done.size===rule.pairs.length,valid?'Peça no destino.':'Solte no destino correto.');
      } else if(kind==='swipe') {
        const dx=point.x-start.point.x,dy=point.y-start.point.y;
        const direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
        report(travel>=rule.distance && direction===rule.direction && elapsed<=1000,'Deslize na direção configurada.');
      } else if(kind==='trace') report(!start.invalid && start.pathIndex===rule.path.length-1,'Siga todo o caminho na ordem.');
    },
    cancel() {if(pressed) move(pressed.id,{x:0,y:0});pressed=null;},
  };
}
