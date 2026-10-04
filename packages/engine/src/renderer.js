import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { interpretScene } from './scene.js';

// No ticker: static scenes render on explicit load/resize commands only.
export async function createSceneRenderer(host, input, { textures = new Map() } = {}) {
  const prepared = interpretScene(input);
  const app = new Application();
  await app.init({ width: prepared.scene.width, height: prepared.scene.height,
    background: prepared.scene.background, antialias: true, autoStart: false,
    preference: 'webgl', preserveDrawingBuffer: true });
  let destroyed = false;
  let current;
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
  return { load, resize, applyTransforms(transforms) {
    if (destroyed) throw new Error('Renderer encerrado.');
    for (const transform of transforms) {
      const node = activeNodes.get(transform.id); if (!node) throw new Error('Parte de animação ausente.');
      node.position.set(transform.x, transform.y); node.rotation = transform.rotation; node.scale.set(transform.scaleX, transform.scaleY); node.alpha = transform.opacity;
    }
    app.render();
  }, destroy() {
    if (destroyed) return;
    destroyed = true;
    app.destroy({ removeView: true }, { children: true });
  } };
}
