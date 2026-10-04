import { useEffect, useRef, useState } from 'react';
import { AssetManager } from '@studio/engine';
export function ScenePlayback({ scene, animations = [] }) {
  const host = useRef(null), commands = useRef(null), input = useRef({ scene, animations });
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [time, setTime] = useState(0);
  const duration = Math.max(0, ...animations.map(value => value.definition.duration));
  useEffect(() => {
    let active = true, renderer, manager, observer; const players = [];
    const task = (async () => {
      const [{ createSceneRenderer }, { loadImageTexture }, { createAnimationPlayer }] = await Promise.all([import('@studio/engine/renderer'), import('@studio/engine/image-loader'), import('@studio/engine/animation-player')]);
      if (!active) return;
      const { scene, animations } = input.current;
      const sources = new Map(scene.entities.filter(e => e.kind === 'sprite').map(e => [e.assetId, { kind: 'sprite', source: '/api/internal/assets/' + e.assetId + '/content' }]));
      manager = new AssetManager(sources, { load: loadImageTexture, destroy: texture => texture.destroy(true) });
      const textures = await manager.loadAll([...sources.keys()]); if (!active) return;
      renderer = await createSceneRenderer(host.current, scene, { textures }); if (!active) { renderer.destroy(); return; }
      host.current.querySelector('canvas').setAttribute('aria-label', 'Prévia da cena animada');
      const element = host.current;
      const resize = () => { if (!active || !element.isConnected) return; const width = Math.min(1400, Math.floor(element.clientWidth)); if (width > 0) renderer.resize(width, Math.max(1, Math.min(4096, Math.round(width * scene.height / scene.width)))); };
      resize(); observer = new ResizeObserver(resize); observer.observe(element);
      for (const animation of animations) {
        let armed = false;
        players.push(createAnimationPlayer(animation.definition, frame => { if (armed && active) renderer.applyTransforms(frame.map(part => ({ ...part, id: animation.instanceId + '__part__' + part.id }))); }));
        armed = true;
      }
      commands.current = { play: () => players.forEach(p => p.play()), pause: () => players.forEach(p => p.pause()), seek: time => players.forEach(p => p.seek(time)), reset: () => { players.forEach(p => p.reset()); renderer.load(scene); } };
      setReady(true);
    })().catch(() => { if (active) setError('Não foi possível iniciar a prévia. Confira as imagens e o suporte WebGL.'); });
    return () => { active = false; commands.current = null; observer?.disconnect(); players.forEach(p => p.destroy()); renderer?.destroy(); void task.finally(() => manager?.dispose()).catch(() => {}); };
  }, []);
  return <section className="scene-playback">
    {error ? <p role="alert">{error}</p> : <p role="status">{ready ? 'Prévia pronta.' : 'Carregando prévia…'}</p>}
    <div ref={host} className="engine-host" />
    {duration > 0 && <fieldset disabled={!ready} className="rig-inline"><button type="button" onClick={() => commands.current.play()}>Reproduzir animação</button><button type="button" onClick={() => commands.current.pause()}>Pausar animação</button><button type="button" onClick={() => { commands.current.reset(); setTime(0); }}>Resetar prévia</button>
      <label>Tempo da prévia<input type="range" min="0" max={duration} step="0.01" value={time} onChange={event => { const value = Number(event.target.value); setTime(value); commands.current.seek(value); }} /></label><span>{time.toFixed(2)} / {duration}s</span></fieldset>}
  </section>;
}
