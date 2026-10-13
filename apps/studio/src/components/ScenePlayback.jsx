import { observePreviewSize } from './observe-preview-size.js';
import { actionInfo } from '@studio/schemas/actions';
import { useEffect, useRef, useState } from 'react';
import { AssetManager } from '@studio/engine';
export function ScenePlayback({ scene, animations = [], actors = [], objects = [], program }) {
  const host = useRef(null), commands = useRef(null), input = useRef({ scene, animations, actors, objects, program });
  const activity=useRef(null);
  const [feedback,setFeedback]=useState('');
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [time, setTime] = useState(0);
  const duration = Math.max(0, ...animations.map(value => value.definition.duration), (program?.actions || []).reduce((sum,a) => sum+(a.duration || 0),0));
  useEffect(() => {
    let active = true, renderer, manager, observer, stage = 'modules'; const players = [];
    setReady(false); setError(''); setTime(0); setFeedback('');
    function release() { commands.current = null; activity.current = null; observer?.disconnect(); players.splice(0).forEach(p => p.destroy()); renderer?.destroy(); renderer = null; }
    const task = (async () => {
      const [{ createSceneRenderer }, { loadImageTexture }, { createScenePlayer }] = await Promise.all([import('@studio/engine/renderer'), import('@studio/engine/image-loader'), import('@studio/engine/scene-player')]);
      if (!active) return;
      const { scene, program, actors, objects } = input.current;
      const sources = new Map(scene.entities.filter(e => e.kind === 'sprite').map(e => [e.assetId, { kind: 'sprite', source: '/api/internal/assets/' + e.assetId + '/content' }]));
      stage = 'images';
      manager = new AssetManager(sources, { load: loadImageTexture, destroy: texture => texture.destroy(true) });
      const textures = await manager.loadAll([...sources.keys()]); if (!active) return;
      stage = 'graphics';
      renderer = await createSceneRenderer(host.current, scene, { textures }); if (!active) { renderer.destroy(); renderer = null; return; }
      host.current.querySelector('canvas').setAttribute('aria-label', 'Prévia da cena animada');
      const element = host.current;
      const resize = () => { if (!active || !element.isConnected) return; const width = Math.min(1400, Math.floor(element.clientWidth)); if (width > 0) renderer.resize(width, Math.max(1, Math.min(4096, Math.round(width * scene.height / scene.width)))); };
      observer = observePreviewSize(element, resize);
      stage = 'animation';
      const player=createScenePlayer(input.current,frame=> { if (active) renderer.applyState(frame); },()=>{if(active) { setReady(false); setError('A prévia foi interrompida por uma transformação inválida. Revise os keyframes e a sequência.'); }}); players.push(player);
      player.reset();
      const restart=()=> { player.reset(); player.play(); };
      commands.current={ play:()=>player.play(),pause:()=>player.pause(),seek:time=>player.seek(time),reset:()=>player.reset(),restart };
      if (program && program.trigger.type!=='manual') {
        activity.current=renderer.bindInput(program.trigger,[...actors,...objects],{complete:()=>{if(program.actions.length) restart();},feedback:value=>{if(active) setFeedback(value.message);}});
      }
      setReady(true);
    })().catch(() => {
      if (active) release();
      else renderer?.destroy();
      void manager?.dispose().catch(() => {});
      if (active) setError({ modules: 'Não foi possível carregar o módulo da prévia. Atualize a página e tente novamente.', images: 'Não foi possível carregar uma imagem da prévia. Confira a imagem vinculada e sua sessão.', graphics: 'Não foi possível abrir o canvas WebGL. No Opera, confira a aceleração gráfica e reinicie o navegador após alterar essa opção.', animation: 'Não foi possível preparar a animação. Confira a perspectiva, as partes e os keyframes; recapture os quadros se a estrutura mudou.' }[stage]);
    });
    return () => { active = false; release(); void task.finally(() => manager?.dispose()).catch(() => {}); };
  }, [attempt]);
  return <section className="scene-playback">
    {error ? <p role="alert">{error}</p> : <p role="status">{ready ? 'Prévia pronta.' : 'Carregando prévia…'}</p>}
    {error && <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar prévia novamente</button>}
    {program?.trigger.type==='input.tap' && <button type="button" disabled={!ready} onClick={()=>commands.current.restart()}>Simular toque no alvo</button>}
    {program?.trigger.type==='input.tap' && <p className="footnote">Toque no alvo na cena, ou use o botão por teclado, para reiniciar a sequência. A prévia não altera o livro.</p>}
    {feedback && <p role="status">{feedback}</p>}
    {program && program.trigger.type!=='manual' && program.trigger.type!=='input.tap' && <div className="rig-inline"><p>Atividade: {actionInfo(program.trigger.type)?.label}. Use os elementos na cena. No canvas, as setas movem o cursor e Espaço pressiona/solta; Escape cancela. Para escolher, combinar ou ordenar por teclado, use os botões:</p>{[...actors,...objects].map((item,index)=><button key={item.id} type="button" disabled={!ready} onClick={()=>activity.current?.select(item.id)}>Elemento {index+1}{item.label?' · '+item.label:''}</button>)}<button type="button" disabled={!ready} onClick={()=>{commands.current.reset();activity.current?.reset();}}>Reiniciar atividade</button></div>}
    <div ref={host} className="engine-host" />
    {(duration > 0 || program?.actions.length > 0) && <fieldset disabled={!ready} className="rig-inline"><button type="button" onClick={() => commands.current.play()}>Reproduzir animação</button><button type="button" onClick={() => commands.current.pause()}>Pausar animação</button><button type="button" onClick={() => { commands.current.reset(); activity.current?.reset(); setTime(0); }}>Resetar prévia</button>
      <label>Tempo da prévia<input type="range" min="0" max={duration} step="0.01" value={time} onChange={event => { const value = Number(event.target.value); setTime(value); commands.current.seek(value); }} /></label><span>{time.toFixed(2)} / {duration}s</span></fieldset>}
  </section>;
}
