import { useEffect, useRef, useState } from 'react';
import { AssetManager } from '@studio/engine';
// The Engine renders artwork. SVG in RigCanvas is only the editable selection/marker overlay.
export function RigArtwork({ scene }) {
  const host = useRef(null), renderer = useRef(null), initial = useRef(scene);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    let active = true, instance, manager, observer;
    const element = host.current;
    const task = (async () => {
      const [{ createSceneRenderer }, { loadImageTexture }] = await Promise.all([import('@studio/engine/renderer'), import('@studio/engine/image-loader')]);
      if (!active) return;
      const descriptors = new Map(initial.current.entities.filter(entity => entity.kind === 'sprite').map(entity => [entity.assetId, { kind: 'sprite', source: '/api/internal/assets/' + entity.assetId + '/content' }]));
      manager = new AssetManager(descriptors, { load: loadImageTexture, destroy: texture => texture.destroy(true) });
      const textures = await manager.loadAll([...descriptors.keys()]);
      if (!active) return;
      instance = await createSceneRenderer(element, initial.current, { textures });
      if (!active) { instance.destroy(); return; }
      renderer.current = instance;
      element.querySelector('canvas').setAttribute('aria-label', 'Montagem do personagem no Engine');
      const resize = () => { const bounds = element.getBoundingClientRect(); if (bounds.width > 0 && bounds.height > 0) instance.resize(Math.min(4096, Math.max(1, Math.round(bounds.width))), Math.min(4096, Math.max(1, Math.round(bounds.height)))); };
      resize(); observer = new ResizeObserver(resize); observer.observe(element); setReady(true);
    })().catch(() => { if (active) setError('Não foi possível carregar as imagens ou iniciar o Engine. Recarregue a estrutura e confira o suporte WebGL.'); });
    return () => { active = false; observer?.disconnect(); instance?.destroy(); renderer.current = null; void task.finally(() => manager?.dispose()).catch(() => {}); };
  }, []);
  useEffect(() => { if (ready && renderer.current) { try { renderer.current.load(scene); } catch { setError('Não foi possível atualizar a montagem no Engine.'); } } }, [scene, ready]);
  return <div className="rig-artwork" ref={host}>{error ? <p role="alert">{error}</p> : !ready && <p role="status">Carregando montagem…</p>}</div>;
}
