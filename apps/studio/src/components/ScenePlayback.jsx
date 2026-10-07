import { useEffect, useRef, useState } from 'react';
import { AssetManager } from '@studio/engine';
export function ScenePlayback({ scene, animations = [], actors = [], objects = [], program }) {
  const host = useRef(null), commands = useRef(null), input = useRef({ scene, animations, actors, objects, program });
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [time, setTime] = useState(0);
  const duration = Math.max(0, ...animations.map(value => value.definition.duration), (program?.actions || []).reduce((sum,a) => sum+(a.duration || 0),0));
  useEffect(() => {
    let active = true, renderer, manager, observer; const players = [];
    const task = (async () => {
      const [{ createSceneRenderer }, { loadImageTexture }, { createScenePlayer }] = await Promise.all([import('@studio/engine/renderer'), import('@studio/engine/image-loader'), import('@studio/engine/scene-player')]);
      if (!active) return;
      const { scene, program, actors, objects } = input.current;
      const sources = new Map(scene.entities.filter(e => e.kind === 'sprite').map(e => [e.assetId, { kind: 'sprite', source: '/api/internal/assets/' + e.assetId + '/content' }]));
      manager = new AssetManager(sources, { load: loadImageTexture, destroy: texture => texture.destroy(true) });
      const textures = await manager.loadAll([...sources.keys()]); if (!active) return;
      renderer = await createSceneRenderer(host.current, scene, { textures }); if (!active) { renderer.destroy(); return; }
      host.current.querySelector('canvas').setAttribute('aria-label', 'Prévia da cena animada');
      const element = host.current;
      const resize = () => { if (!active || !element.isConnected) return; const width = Math.min(1400, Math.floor(element.clientWidth)); if (width > 0) renderer.resize(width, Math.max(1, Math.min(4096, Math.round(width * scene.height / scene.width)))); };
      resize(); observer = new ResizeObserver(resize); observer.observe(element);
      const player=createScenePlayer(input.current,frame=> { if (active) renderer.applyState(frame); }); players.push(player);
      const restart=()=> { player.reset(); player.play(); };
      commands.current={ play:()=>player.play(),pause:()=>player.pause(),seek:time=>player.seek(time),reset:()=>player.reset(),restart };
      if (program?.trigger.type==='input.tap') {
        const target=[...actors,...objects].find(a=>a.id===program.trigger.instanceId);
        renderer.bindTap(target.nodeId,restart);
      }
      setReady(true);
    })().catch(() => { if (active) setError('Não foi possível iniciar a prévia. Confira as imagens e o suporte WebGL.'); });
    return () => { active = false; commands.current = null; observer?.disconnect(); players.forEach(p => p.destroy()); renderer?.destroy(); void task.finally(() => manager?.dispose()).catch(() => {}); };
  }, []);
  return <section className="scene-playback">
    {error ? <p role="alert">{error}</p> : <p role="status">{ready ? 'Prévia pronta.' : 'Carregando prévia…'}</p>}
    {program?.trigger.type==='input.tap' && <button type="button" disabled={!ready} onClick={()=>commands.current.restart()}>Simular toque no alvo</button>}
    {program?.trigger.type==='input.tap' && <p className="footnote">Toque no alvo na cena, ou use o botão por teclado, para reiniciar a sequência. A prévia não altera o livro.</p>}
    <div ref={host} className="engine-host" />
    {(duration > 0 || program?.actions.length > 0) && <fieldset disabled={!ready} className="rig-inline"><button type="button" onClick={() => commands.current.play()}>Reproduzir animação</button><button type="button" onClick={() => commands.current.pause()}>Pausar animação</button><button type="button" onClick={() => { commands.current.reset(); setTime(0); }}>Resetar prévia</button>
      <label>Tempo da prévia<input type="range" min="0" max={duration} step="0.01" value={time} onChange={event => { const value = Number(event.target.value); setTime(value); commands.current.seek(value); }} /></label><span>{time.toFixed(2)} / {duration}s</span></fieldset>}
  </section>;
}
