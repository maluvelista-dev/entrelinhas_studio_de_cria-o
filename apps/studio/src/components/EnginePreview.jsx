import { CharacterPreview } from './CharacterPreview.jsx';
import { useEffect, useRef, useState } from 'react';
import { validationScene as scene } from '@studio/engine/example';
function GeometryPreview() {
  const host = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true, renderer, observer;
    const element = host.current;
    import('@studio/engine/renderer').then(({ createSceneRenderer }) => {
      if (!active) return null;
      return createSceneRenderer(element, scene);
    }).then(instance => {
      if (!instance) return;
      if (!active) { instance.destroy(); return; }
      renderer = instance;
      const resize = () => {
        const width = Math.min(1000, Math.floor(element.clientWidth));
        if (width > 0) instance.resize(width, Math.round(width*0.75));
      };
      resize(); observer = new ResizeObserver(resize); observer.observe(element);
      setReady(true);
    }).catch(() => { if (active) setError('Não foi possível iniciar a visualização gráfica. Verifique o suporte WebGL do navegador.'); });
    return () => { active = false; observer?.disconnect(); renderer?.destroy(); };
  }, []);
  return <section className="panel engine-panel">
    <h2>Visualização do Engine</h2>
    <p>Cena de validação: o círculo acompanha a rotação do quadrado. Redimensione a janela para conferir as proporções.</p>
    <p>Esta cena é de teste e não altera os livros. A montagem de cenas virá na fase 6.</p>
    {error ? <p role="alert">{error}</p> : <p role="status">{ready ? 'Cena renderizada.' : 'Preparando visualização…'}</p>}
    <div ref={host} className="engine-host" />
  </section>;
}

export function EnginePreview() {
  const [tab, setTab] = useState('geometry');
  return <>
    <div className="tabs preview-tabs" role="tablist" aria-label="Validação do Engine">
      <button id="geometry-tab" role="tab" aria-selected={tab === 'geometry'} aria-controls="geometry-panel" onClick={() => setTab('geometry')}>Coordenadas</button>
      <button id="character-tab" role="tab" aria-selected={tab === 'character'} aria-controls="character-panel" onClick={() => setTab('character')}>Personagem</button>
    </div>
    {tab === 'geometry' ? <div id="geometry-panel" role="tabpanel" aria-labelledby="geometry-tab"><GeometryPreview /></div>
      : <div id="character-panel" role="tabpanel" aria-labelledby="character-tab"><CharacterPreview /></div>}
  </>;
}
