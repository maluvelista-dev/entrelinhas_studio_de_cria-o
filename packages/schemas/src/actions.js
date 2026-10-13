import { z } from 'zod';
import { actionCatalog } from './action-catalog.js';
export { actionCatalog, actionInfo, actionTypes, inputTypes } from './action-catalog.js';
export const logicalId = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);
const number = z.number().finite().min(-100000).max(100000);
export const pointSchema = z.strictObject({ x: number, y: number });
export const targetSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('point'), point: pointSchema }),
  z.strictObject({ kind: z.literal('anchor'), instanceId: logicalId, anchor: logicalId }),
]);
const moving = { actorId: logicalId, sourceAnchor: logicalId.nullable(), target: targetSchema, duration: z.number().min(0.1).max(30) };
const durationSchema=z.number().min(0.1).max(30);
const advanced=actionCatalog.filter(a=>a.domain!=='input' && !['movement.moveTo','object.carry','object.grab','object.release'].includes(a.type)).map(a=> {
  const shape={ type:z.literal(a.type),actorId:logicalId,duration:durationSchema };
  if(a.mode==='effect') shape.scope=z.enum(['element','scene']).default('element');
  if(a.object) shape.objectId=logicalId;
  if(a.partner) shape.partnerId=logicalId;
  if(a.target) { shape.target=targetSchema; shape.sourceAnchor=logicalId.nullable(); }
  if(a.contact || ['attach','transfer'].includes(a.mode)) shape.anchor=logicalId;
  if(a.mode==='transfer') shape.partnerAnchor=logicalId;
  if(a.mode==='path') shape.path=z.array(pointSchema).min(2).max(64);
  if(a.amplitude) shape.amplitude=z.number().min(0).max(2000).default(a.name==='hop'?20:60);
  if(a.cycles) shape.cycles=z.number().int().min(1).max(20).default(a.name==='hop'?3:1);
  if(a.name==='wander') shape.seed=z.number().int().min(0).max(2147483647).default(1);
  if(a.mode==='objectTransform') shape.objectAnchor=logicalId;
  if(a.mode==='objectTransform' && a.name!=='shake') shape.angle=z.number().min(-Math.PI*8).max(Math.PI*8).default(Math.PI/2);
  return z.strictObject(shape);
});
export const actionSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('movement.moveTo'), ...moving }),
  z.strictObject({ type: z.literal('object.carry'), ...moving, objectId: logicalId }),
  z.strictObject({ type: z.literal('object.grab'), actorId: logicalId, objectId: logicalId, anchor: logicalId }),
  z.strictObject({ type: z.literal('object.release'), actorId: logicalId, objectId: logicalId }),...advanced,
]);
const pair=z.strictObject({ source:logicalId,target:logicalId });
export const triggerSchema=z.discriminatedUnion('type',[
  z.strictObject({type:z.literal('manual')}),
  ...['tap','doubleTap','press','hold','drag','drop','swipe','trace','choose','match','sort','find','collect','assemble'].map(name=>{
    const shape={type:z.literal('input.'+name),instanceId:logicalId};
    if(name==='hold') shape.holdMs=z.number().int().min(300).max(10000);
    if(['drag','drop','swipe'].includes(name)) shape.distance=z.number().min(5).max(2000);
    if(name==='swipe') shape.direction=z.enum(['left','right','up','down']);
    if(['drop','assemble','match'].includes(name)) shape.pairs=z.array(pair).min(1).max(24);
    if(['choose','find','collect','sort'].includes(name)) shape.expected=z.array(logicalId).min(1).max(24);
    if(['drop','assemble','trace'].includes(name)) shape.tolerance=z.number().min(5).max(200);
    if(name==='trace') shape.path=z.array(pointSchema).min(2).max(64);
    return z.strictObject(shape);
  }),
]).superRefine((v,ctx)=>{
  if(v.expected && new Set(v.expected).size!==v.expected.length) ctx.addIssue({code:'custom',message:'Elementos repetidos na atividade.'});
  if(v.pairs && new Set(v.pairs.map(p=>p.source)).size!==v.pairs.length) ctx.addIssue({code:'custom',message:'Origem repetida nos pares.'});
  if(v.pairs?.some(p=>p.source===p.target)) ctx.addIssue({code:'custom',message:'Origem e destino precisam ser diferentes.'});
});
export const programSchema = z.strictObject({ schemaVersion: z.literal(1),trigger:triggerSchema,
  actions: z.array(actionSchema).max(32),
}).superRefine((program, ctx) => { if (program.actions.reduce((sum, a) => sum + (a.duration || 0), 0) > 120) ctx.addIssue({ code: 'custom', message: 'A sequência admite até 120 segundos.' }); });
export const emptyProgram = () => ({ schemaVersion: 1, trigger: { type: 'manual' }, actions: [] });
export const sceneObjectSchema = z.strictObject({ id: logicalId, libraryId: z.uuid(), revision: z.number().int().positive(),
  x: number, y: number, rotation: number, scaleX: number.refine(n => Math.abs(n) >= 0.001), scaleY: number.refine(n => Math.abs(n) >= 0.001),
  anchors: z.array(z.strictObject({ name: logicalId, position: pointSchema })).max(32),
}).superRefine((object, ctx) => { if (new Set(object.anchors.map(a => a.name)).size !== object.anchors.length) ctx.addIssue({ code: 'custom', message: 'Anchor duplicado.' }); });
