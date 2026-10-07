import { createCharacter } from './character.js';
import { applyPose } from './motion.js';
import { emptyProgram } from '@studio/schemas/actions';
export function composePagePreview(value) {
  const entities=[],actors=[],objects=[],animations=[];
  for (const actor of value.characters) {
    const instance=actor.instance, assets=new Map(actor.assets.map(asset => [asset.id,{ kind:'sprite',width:asset.width,height:asset.height }]));
    const character=createCharacter(actor.pose ? applyPose(actor.definition,actor.pose) : actor.definition,{ id:instance.id,perspective:instance.perspective,transform:{ x:instance.x,y:instance.y,rotation:instance.rotation,scaleX:instance.scaleX,scaleY:instance.scaleY } },assets);
    entities.push(...character.entities);
    actors.push({ id:instance.id,nodeId:instance.id+'__instance',anchors:character.perspective.anchors.map(anchor => {
      const node=character.nodes.find(n=>n.partId===anchor.partId);
      return { name:anchor.name,nodeId:node.entity.id,position:anchor.coordinateSpace==='normalized' ? { x:anchor.position.x*node.entity.width,y:anchor.position.y*node.entity.height } : anchor.position };
    }) });
    if (actor.animation) animations.push({ instanceId:instance.id,definition:actor.animation });
  }
  for (const [index,item] of (value.objects || []).entries()) {
    const i=item.instance,id=i.id+'__object';
    entities.push({ id,kind:'sprite',assetId:item.asset.id,width:item.asset.width,height:item.asset.height,color:'#ffffff',position:{ x:i.x,y:i.y },rotation:i.rotation,scaleX:i.scaleX,scaleY:i.scaleY,zIndex:item.kind==='BACKGROUND' ? -100+index : 100+index });
    const descriptor={ id:i.id,nodeId:id,movable:item.kind==='OBJECT',anchors:i.anchors.map(a=>({ name:a.name,nodeId:id,position:{ x:a.position.x*item.asset.width,y:a.position.y*item.asset.height } })) };
    objects.push(descriptor);
  }
  return { scene:{ schemaVersion:1,width:value.width,height:value.height,background:'#ffffff',entities },actors,objects,animations,program:value.program || emptyProgram() };
}
