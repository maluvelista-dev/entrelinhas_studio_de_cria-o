import { useEffect, useState } from 'react';
import { composePagePreview } from '@studio/engine/composition';
import { SceneActionsEditor } from './SceneActionsEditor.jsx';
import { compatible } from '@studio/engine/motion';
import { api } from '../api.js';
import { Button } from './ui/Button.jsx';
import { ScenePlayback } from './ScenePlayback.jsx';
export function PageScene({ book, document, editable, busy, onChange }) {
  const scene = document.scene;
  const [items, setItems] = useState([]), [templates, setTemplates] = useState([]), [chosen, setChosen] = useState(''), [selectedId, setSelected] = useState('');
  const [definitions, setDefinitions] = useState({}), [preview, setPreview] = useState(null), [sequence, setSequence] = useState(0), [error, setError] = useState(''), [working, setWorking] = useState(false);
  const selected = scene.characters.find(value => value.id === selectedId) || scene.characters[0];
  const definition = selected && definitions[selected.characterId + ':' + selected.rigRevision];
  async function resolve() {
    setWorking(true); setError('');
    try {
      const value = await api('/internal/books/' + book.id + '/scene-preview', { method: 'POST', body: { revision: book.revision, document } });
      const definitions={};
      for (const actor of value.characters) definitions[actor.instance.characterId+':'+actor.instance.rigRevision]=actor.definition;
      setDefinitions(previous=>({ ...previous,...definitions })); setPreview(composePagePreview(value)); setSequence(value=>value+1);
    } catch (error) { setError(error.message); } finally { setWorking(false); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([api('/internal/library'), api('/internal/templates')]).then(([items, templates]) => { if (active) { setItems(items); setTemplates(templates); } }).catch(error => { if (active) setError(error.message); });
    if (scene.characters.length || scene.objects?.length) void resolve();
    return () => { active = false; };
    // The page form remounts on page/revision changes. Unsaved edits only preview on command.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function change(next) { onChange(next); setPreview(null); }
  function update(patch) { change({ ...scene, characters: scene.characters.map(value => value.id === selected.id ? { ...value, ...patch } : value) }); }
  const available = templates.filter(template => (!template.ownerBookId || template.ownerBookId === book.id) && definition && template.definition.perspective === selected.perspective && compatible(definition, template.definition));
  return <section className="page-scene"><h3>Personagens na página</h3>{error && <p role="alert" className="inline-error">{error}</p>}
    <fieldset disabled={busy || working || !editable}><div className="rig-inline"><label>Personagem da Biblioteca<select value={chosen} onChange={event => setChosen(event.target.value)}><option value="">Selecione</option>{items.filter(item => item.kind === 'CHARACTER' && (!item.ownerBookId || item.ownerBookId === book.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <Button type="button" disabled={!chosen || scene.characters.length >= 8} onClick={async () => { setWorking(true); setError(''); try { const rig = await api('/internal/library/' + chosen + '/rig'); if (!rig.definition) throw new Error('Salve a estrutura deste personagem antes de inseri-lo.');
      const instance = { id: 'instance_' + crypto.randomUUID(), characterId: chosen, rigRevision: rig.revision, perspective: rig.definition.perspectives[0].id, x: 0, y: 0, rotation: 0, scaleX: 0.5, scaleY: 0.5, poseId: null, animationId: null };
      setDefinitions(values => ({ ...values, [chosen + ':' + rig.revision]: rig.definition })); change({ ...scene, characters: [...scene.characters, instance] }); setSelected(instance.id);
    } catch (error) { setError(error.message); } finally { setWorking(false); } }}>Inserir personagem</Button></div>
    </fieldset>
    {scene.characters.length > 0 && <label>Instância na página<select value={selected?.id || ''} onChange={event => setSelected(event.target.value)}>{scene.characters.map((value, index) => <option key={value.id} value={value.id}>{index+1}. {items.find(item => item.id === value.characterId)?.name || 'Personagem'} · {value.perspective}</option>)}</select></label>}
    {selected && <fieldset disabled={busy || working || !editable} className="form-stack"><div className="rig-fields">
      {['x','y','rotation','scaleX','scaleY'].map(field => <label key={field}>{({ x:'X na página',y:'Y na página',rotation:'Rotação na página (graus)',scaleX:'Escala X na página',scaleY:'Escala Y na página' })[field]}<input type="number" step="any" value={field === 'rotation' ? selected[field] * 180 / Math.PI : selected[field]} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value)) update({ [field]: field === 'rotation' ? value * Math.PI / 180 : value }); }} /></label>)}
      <label>Perspectiva na página<select value={selected.perspective} onChange={event => update({ perspective: event.target.value, poseId: null, animationId: null })}>{(definition?.perspectives || [{ id: selected.perspective }]).map(view => <option key={view.id} value={view.id}>{view.id}</option>)}</select></label>
      <label>Pose na página<select value={selected.poseId || ''} onChange={event => update({ poseId: event.target.value || null })}><option value="">Pose original</option>{available.filter(t => t.kind === 'POSE').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Animação na página<select value={selected.animationId || ''} onChange={event => update({ animationId: event.target.value || null })}><option value="">Sem animação</option>{available.filter(t => t.kind === 'ANIMATION').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    </div><div className="rig-inline"><Button type="button" className="button secondary" onClick={() => { const index = scene.characters.findIndex(value => value.id === selected.id); if (index > 0) { const values = [...scene.characters]; [values[index-1], values[index]] = [values[index], values[index-1]]; change({ ...scene, characters: values }); } }}>Enviar para trás</Button>
    <Button type="button" className="button secondary" onClick={() => { if (JSON.stringify(scene.program || {}).includes(selected.id)) { setError('Remova as ações e o gatilho que usam este personagem antes de removê-lo.'); return; } change({ ...scene, characters: scene.characters.filter(value => value.id !== selected.id) }); setSelected(''); }}>Remover instância da página</Button></div></fieldset>}
    <SceneActionsEditor scene={scene} items={items} definitions={definitions} book={book} disabled={busy || working || !editable} onChange={change} />
    <Button type="button" className="button secondary" disabled={busy || working} onClick={resolve}>Atualizar prévia da página</Button>
    <p className="footnote">Salve a página para persistir a composição. Cada instância preserva a versão do rig usada na inserção.</p>
    {preview && <ScenePlayback key={sequence} {...preview} />}
  </section>;
}
