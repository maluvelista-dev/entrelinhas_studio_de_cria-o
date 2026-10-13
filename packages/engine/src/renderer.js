import { Application, Container, Graphics, Sprite, Matrix } from 'pixi.js';
import { createInputController } from './input-controller.js';
import { interpretScene } from './scene.js';

// No ticker: static scenes render on explicit load/resize commands only.
export async function createSceneRenderer(host, input, { textures = new Map() } = {}) {
  const prepared = interpretScene(input);
  const app = new Application();
  const viewportScale = Math.min(1, Math.max(1, host.clientWidth || 1024) / prepared.scene.width, 1400 / Math.max(prepared.scene.width, prepared.scene.height));
  await app.init({ width: Math.max(1, Math.round(prepared.scene.width * viewportScale)), height: Math.max(1, Math.round(prepared.scene.height * viewportScale)),
    background: prepared.scene.background, antialias: true, autoStart: false,
    preference: 'webgl', preserveDrawingBuffer: true });
  let destroyed = false;
  let current;
  let unbind=()=>{};const decorations=new Map();
  let activeNodes = new Map();
  const root = new Container();
  app.stage.addChild(root);
  app.canvas.setAttribute('aria-label', 'Cena de validação do Engine');
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);
  function load(inputScene) {
    if (destroyed) throw new Error('Renderer encerrado.');
    const next = interpretScene(inputScene);
    const container = new Container();
    container.sortableChildren = true;
    const nodes = new Map();
    try {
      for (const { entity: e, transform: t } of next.nodes) {
        const node = new Container();
        node.sortableChildren = true;
        node.position.set(t.x, t.y); node.scale.set(t.scaleX, t.scaleY);
        node.rotation = t.rotation; node.pivot.set(t.pivotX, t.pivotY);
        node.alpha = e.opacity; node.visible = e.visible; node.zIndex = e.zIndex;
        if (e.kind === 'sprite') {
          const texture = textures.get(e.assetId);
          if (!texture || texture.destroyed) throw new Error('Textura ausente para sprite.');
          const sprite = new Sprite(texture);
          sprite.width = e.width; sprite.height = e.height; sprite.tint = e.color;
          node.addChild(sprite);
        } else if (e.kind !== 'group') {
          const graphic = new Graphics();
          if (e.kind === 'rectangle') graphic.rect(0, 0, e.width, e.height);
          else graphic.ellipse(e.width/2, e.height/2, e.width/2, e.height/2);
          graphic.fill(e.color); node.addChild(graphic);
        }
        (e.parentId ? nodes.get(e.parentId) : container).addChild(node);
        nodes.set(e.id, node);
      }
    } catch (error) { container.destroy({ children: true }); throw error; }
    for (const child of root.removeChildren()) child.destroy({ children: true });
    root.addChild(container); current = next.scene; activeNodes = nodes;
    app.renderer.background.color = current.background;
    resize(app.screen.width, app.screen.height);
  }
  function resize(width, height) {
    if (destroyed) throw new Error('Renderer encerrado.');
    if (![width, height].every(value => Number.isFinite(value) && value > 0 && value <= 4096)) throw new Error('Viewport inválido.');
    app.renderer.resize(width, height);
    const scale = Math.min(width/current.width, height/current.height);
    root.scale.set(scale);
    root.position.set((width-current.width*scale)/2, (height-current.height*scale)/2);
    app.render();
  }
  try { load(prepared.scene); }
  catch (error) { app.destroy({ removeView: true }, { children: true }); throw error; }
  return { load, resize,
    applyState(frame) {
      if (destroyed) throw new Error('Renderer encerrado.');
      for (const t of frame.transforms) { const node=activeNodes.get(t.id); if (!node) throw new Error('Entidade ausente.'); node.position.set(t.x,t.y); node.rotation=t.rotation; node.scale.set(t.scaleX,t.scaleY); node.alpha=t.opacity;node.zIndex=t.zIndex ?? 0; }
      for (const { id,matrix } of frame.matrices) { const node=activeNodes.get(id); node.setFromMatrix(new Matrix(...matrix)); }
      for(const {id,assetId} of frame.images || []) {const sprite=activeNodes.get(id)?.children.find(c=>c instanceof Sprite);const texture=textures.get(assetId);if(!sprite || !texture) throw new Error('Imagem alternativa indisponível.');sprite.texture=texture;const entity=prepared.nodes.find(n=>n.entity.id===id).entity;sprite.width=entity.width;sprite.height=entity.height;}
      for(const [id,node] of activeNodes) {const entity=prepared.nodes.find(n=>n.entity.id===id).entity;if(entity.kind==='sprite' && !frame.images?.some(i=>i.id===id)) {const sprite=node.children.find(c=>c instanceof Sprite);sprite.texture=textures.get(entity.assetId);sprite.width=entity.width;sprite.height=entity.height;}}
      for(const graphic of decorations.values()) graphic.clear();
      for(const effect of frame.effects || []) {
        const node=activeNodes.get(effect.id);let graphic=decorations.get(effect.id);
        if(!graphic) {graphic=new Graphics();graphic.eventMode='none';node.addChild(graphic);decorations.set(effect.id,graphic);}
        const bounds=node.getLocalBounds(),radius=Math.max(10,Math.min(200,(bounds.width+bounds.height)/4));
        if(effect.type==='glow') graphic.circle(bounds.x+bounds.width/2,bounds.y+bounds.height/2,radius).fill({color:0xffdc70,alpha:effect.intensity*0.3});
        else for(let i=0;i<12;i++) {const angle=i*Math.PI/6+effect.phase*2,r=radius+effect.phase*effect.amplitude;graphic.circle(bounds.x+bounds.width/2+Math.cos(angle)*r,bounds.y+bounds.height/2+Math.sin(angle)*r,2+i%3).fill({color:0xffc83d,alpha:effect.intensity});}
      }
      app.render();
    },
    bindInput(rule,instances,callbacks) {
      unbind();const roots=new Map(instances.map(i=>[i.id,activeNodes.get(i.nodeId)])),initial=new Map([...roots].map(([id,n])=>[id,{x:n.x,y:n.y}]));
      const controller=createInputController(rule,{...callbacks,place:(source,target)=>{const node=roots.get(source),from=node.getBounds(),to=roots.get(target).getBounds(),a=root.toLocal({x:from.x+from.width/2,y:from.y+from.height/2}),b=root.toLocal({x:to.x+to.width/2,y:to.y+to.height/2});node.position.set(node.x+b.x-a.x,node.y+b.y-a.y);app.render();},move:(id,delta)=>{const node=roots.get(id),origin=initial.get(id);node.position.set(origin.x+delta.x,origin.y+delta.y);app.render();}});
      const point=event=>root.toLocal(event.global);
      let timer=null;const handlers=[];
      const guide=new Graphics();guide.eventMode='none';root.addChild(guide);
      if(rule.path) {guide.moveTo(rule.path[0].x,rule.path[0].y);for(const point of rule.path.slice(1)) guide.lineTo(point.x,point.y);guide.stroke({width:3,color:0x6655ff,alpha:0.65});for(const point of rule.path) guide.circle(point.x,point.y,5).fill(0x6655ff);app.render();}
      const marker=new Graphics();marker.eventMode='none';root.addChild(marker);
      let keyDown=false;
      const initialBounds=roots.get(rule.instanceId).getBounds(),center=root.toLocal({x:initialBounds.x+initialBounds.width/2,y:initialBounds.y+initialBounds.height/2});
      const cursor=rule.path?{...rule.path[0]}:{x:center.x,y:center.y};
      const paintCursor=()=>{marker.clear().circle(cursor.x,cursor.y,7).stroke({width:2,color:0x222266});app.render();};
      const keyboard=event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape'].includes(event.key)) return;event.preventDefault();
        if(event.key==='Escape') {keyDown=false;controller.cancel();clearTimeout(timer);return;}
        if(event.key===' ') {if(event.repeat || keyDown) return;keyDown=true;controller.down({id:rule.instanceId,point:{...cursor},time:performance.now(),pointerId:-1});clearTimeout(timer);if(rule.type==='input.hold') timer=setTimeout(()=>controller.tick(performance.now()),rule.holdMs);return;}
        if(event.key==='ArrowLeft') cursor.x-=10;if(event.key==='ArrowRight') cursor.x+=10;if(event.key==='ArrowUp') cursor.y-=10;if(event.key==='ArrowDown') cursor.y+=10;
        cursor.x=Math.max(0,Math.min(current.width,cursor.x));cursor.y=Math.max(0,Math.min(current.height,cursor.y));
        controller.move({point:{...cursor},pointerId:-1});paintCursor();
      };
      const keyup=event=>{if(event.key!==' ' || !keyDown) return;event.preventDefault();keyDown=false;clearTimeout(timer);const target=nearest(cursor);controller.up({point:{...cursor},time:performance.now(),pointerId:-1,...target});};
      const blur=()=>{keyDown=false;clearTimeout(timer);controller.cancel();marker.clear();app.render();};
      app.canvas.tabIndex=0;app.canvas.addEventListener('keydown',keyboard);app.canvas.addEventListener('keyup',keyup);app.canvas.addEventListener('blur',blur);
      for(const [id,node] of roots) {
        node.eventMode='static';node.interactiveChildren=true;node.cursor='pointer';
        const down=event=>{if(event.button!==0) return;event.stopPropagation();controller.down({id,point:point(event),time:performance.now(),pointerId:event.pointerId});clearTimeout(timer);if(rule.type==='input.hold') timer=setTimeout(()=>controller.tick(performance.now()),rule.holdMs);};
        node.on('pointerdown',down);handlers.push(()=>node.off('pointerdown',down));
      }
      const moving=event=>controller.move({point:point(event),pointerId:event.pointerId});
      function nearest(p) {
        let targetId=null,targetDistance=Infinity;
        for(const pair of rule.pairs || []) {const node=roots.get(pair.target),bounds=node.getBounds(),center=root.toLocal({x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2}),distance=Math.hypot(p.x-center.x,p.y-center.y);if(distance<targetDistance) {targetDistance=distance;targetId=pair.target;}}
        return {targetId,targetDistance};
      }
      const up=event=> {clearTimeout(timer);controller.up({point:point(event),time:performance.now(),pointerId:event.pointerId,...nearest(point(event))});};
      const cancel=()=>{clearTimeout(timer);controller.cancel();};
      app.stage.eventMode='static';app.stage.hitArea=app.screen;app.stage.on('globalpointermove',moving);app.stage.on('pointerup',up);app.stage.on('pointerupoutside',up);app.stage.on('pointercancel',cancel);
      unbind=()=>{cancel();app.canvas.removeEventListener('keydown',keyboard);app.canvas.removeEventListener('keyup',keyup);app.canvas.removeEventListener('blur',blur);guide.destroy();marker.destroy();handlers.forEach(f=>f());app.stage.off('globalpointermove',moving);app.stage.off('pointerup',up);app.stage.off('pointerupoutside',up);app.stage.off('pointercancel',cancel);};
      return controller;
    },
    bindTap(id,callback) {
      const node=activeNodes.get(id); if (!node) throw new Error('Alvo do toque ausente.');
      let pressed=null; node.eventMode='static'; node.interactiveChildren=true; node.cursor='pointer';
      node.on('pointerdown',event=> { if (event.button===0) pressed={ id:event.pointerId,x:event.global.x,y:event.global.y,time:performance.now() }; });
      node.on('pointerup',event=> { if (pressed && pressed.id===event.pointerId && performance.now()-pressed.time<=500 && Math.hypot(event.global.x-pressed.x,event.global.y-pressed.y)<=10) callback(); pressed=null; });
      node.on('pointerupoutside',()=> { pressed=null; }); node.on('pointercancel',()=> { pressed=null; });
    },
    applyTransforms(transforms) {
    if (destroyed) throw new Error('Renderer encerrado.');
    for (const transform of transforms) {
      const node = activeNodes.get(transform.id); if (!node) throw new Error('Parte de animação ausente.');
      node.position.set(transform.x, transform.y); node.rotation = transform.rotation; node.scale.set(transform.scaleX, transform.scaleY); node.alpha = transform.opacity;
    }
    app.render();
  }, destroy() {
    if (destroyed) return;
    unbind();decorations.clear();destroyed = true;
    app.destroy({ removeView: true }, { children: true });
  } };
}
