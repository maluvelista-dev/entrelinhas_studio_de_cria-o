import { observePreviewSize } from './observe-preview-size.js';
import { useEffect, useRef, useState } from 'react';
import { AssetManager } from '@studio/engine';
import { characterAssets, characterPreview } from '@studio/engine/character-example';

function CharacterCanvas({ preview }) {
  const host = useRef(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let active = true, renderer, observer, manager;
    const element = host.current;
    async function start() {
      const [{ createSceneRenderer }, { loadImageTexture }] = await Promise.all([
        import('@studio/engine/renderer'), import('@studio/engine/image-loader'),
      ]);
      if (!active) return;
      manager = new AssetManager(characterAssets, { load: loadImageTexture, destroy: texture => texture.destroy(true) });
      const textures = await manager.loadAll(preview.scene.entities.filter(e => e.kind === 'sprite').map(e => e.assetId));
      if (!active) return;
      const instance = await createSceneRenderer(element, preview.scene, { textures });
      if (!active) { instance.destroy(); return; }
      renderer = instance;
      element.querySelector('canvas').setAttribute('aria-label', 'Personagem com hierarquia, pivôs e anchors');
      const resize = () => {
        const width = Math.min(1000, Math.floor(element.clientWidth));
        if (width > 0) renderer.resize(width, Math.round(width * 520 / 800));
      };
      observer = observePreviewSize(element, resize);
      setState('ready');
    }
    const task = start().catch(() => { if (active) setState('error'); });
    return () => {
      active = false; observer?.disconnect(); renderer?.destroy();
      // Finish in-flight initialization before disposing textures referenced by its sprites.
      void task.finally(() => manager?.dispose()).catch(() => {});
    };
  }, [preview]);
  return <>
    {state === 'error' ? <p role="alert" className="inline-error">Não foi possível carregar o personagem. Verifique o suporte WebGL e recarregue a visualização.</p>
      : <p role="status">{state === 'ready' ? 'Personagem renderizado.' : 'Carregando partes do personagem…'}</p>}
    <div ref={host} className="engine-host" />
  </>;
}
export function CharacterPreview() {
  const [perspective, setPerspective] = useState('front');
  const [debug, setDebug] = useState(true);
  const preview = characterPreview(perspective, debug);
  return <section className="panel engine-panel">
    <h2>Personagem de validação</h2>
    <p className="muted">Compare a hierarquia original com a cópia espelhada e o braço direito rotacionado. Esta verificação não altera a Biblioteca ou os livros.</p>
    <div className="character-controls">
      <label>Perspectiva<select value={perspective} onChange={event => setPerspective(event.target.value)}>
        <option value="front">Frente</option><option value="side">Lateral</option>
      </select></label>
      <label className="checkbox-label"><input type="checkbox" checked={debug} onChange={event => setDebug(event.target.checked)} />Mostrar pivôs e anchors</label>
    </div>
    <div className="character-layout">
      <aside className="character-parts"><h3>Hierarquia de partes</h3><ul>
        {preview.character.perspective.parts.map(part => <li key={part.id}><strong>{part.id}</strong><small>{part.parentId ? 'Ligado a ' + part.parentId : 'Raiz do personagem'}</small></li>)}
      </ul></aside>
      <div className="character-canvas">
        <CharacterCanvas key={perspective + ':' + debug} preview={preview} />
        <p className="footnote">Esquerda: original. Direita: espelhado, braço direito a −90°. Quadrados azuis: pivôs; círculos âmbar: anchors.</p>
      </div>
    </div>
    <details className="character-anchors"><summary>Coordenadas dos anchors</summary><div className="table-scroll"><table>
      <thead><tr><th>Referência</th><th>X na cena</th><th>Y na cena</th></tr></thead>
      <tbody>{preview.anchors.map(anchor => <tr key={anchor.reference}><td>{anchor.reference}</td><td>{anchor.x.toFixed(1)}</td><td>{anchor.y.toFixed(1)}</td></tr>)}</tbody>
    </table></div></details>
  </section>;
}
