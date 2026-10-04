import { useEffect, useState } from 'react';
import { createCharacter } from '@studio/engine';
import { capturePose, applyPose, compatible, presetAnimation } from '@studio/engine/motion';
import { animationSchema } from '@studio/schemas/motion';
import { api } from '../api.js';
import { Button } from './ui/Button.jsx';
import { ScenePlayback } from './ScenePlayback.jsx';
export function MotionWorkbench({ item, definition, viewId, partId, assets, editable, busy, onApply, onDirty }) {
  const [templates, setTemplates] = useState([]), [name, setName] = useState('Nova pose'), [motionName, setMotionName] = useState('Nova animação');
  const [poseId, setPoseId] = useState(''), [animationId, setAnimationId] = useState('');
  const [frames, setFrames] = useState([]), [base, setBase] = useState(null), [time, setTime] = useState(0), [ease, setEase] = useState('sine.inOut');
  const [error, setError] = useState(''), [saving, setSaving] = useState(false), [preview, setPreview] = useState(null), [previewId, setPreviewId] = useState(0), [notice, setNotice] = useState('');
  useEffect(() => { let active = true; api('/internal/templates').then(value => { if (active) setTemplates(value); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, []);
  const eligible = templates.filter(t => (!t.ownerBookId || t.ownerBookId === item.ownerBookId) && t.definition.perspective === viewId && compatible(definition, t.definition));
  function attempt(action) { try { setError(''); action(); } catch (error) { setError(error.message || 'Movimento incompatível.'); } }
  async function save(kind, name, value) {
    setSaving(true); setError('');
    try { const template = await api('/internal/templates', { method: 'POST', body: { kind, name, ownerBookId: item.ownerBookId, definition: value } }); setTemplates(values => [...values, template]); setNotice(kind === 'POSE' ? 'Pose salva na Biblioteca.' : 'Animação salva na Biblioteca.'); }
    catch (error) { setError(error.message); } finally { setSaving(false); }
  }
  function animation() { if (!base || base.perspective !== viewId || !compatible(definition, base)) throw new Error('Volte à perspectiva dos keyframes ou limpe-os para iniciar outra animação.'); return animationSchema.parse({ schemaVersion: 1, perspective: base.perspective, skeleton: base.skeleton, duration: frames.at(-1)?.time, ease, keyframes: frames }); }
  function show(value) {
    const map = new Map(assets.map(asset => [asset.id, { kind: 'sprite', width: asset.width, height: asset.height }]));
    const character = createCharacter(definition, { id: 'preview', perspective: viewId }, map);
    setPreview({ scene: { schemaVersion: 1, width: definition.width, height: definition.height, background: '#ffffff', entities: character.entities }, animations: [{ instanceId: 'preview', definition: value }] }); setPreviewId(value => value + 1);
  }
  return <section className="motion-workbench"><h3>Poses e animações reutilizáveis</h3><p className="muted">Ajuste as partes acima e capture a pose. Modelos compatíveis podem ser usados em outros personagens e livros.</p>
    {error && <p role="alert" className="inline-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    <fieldset className="rig-inline" disabled={busy || saving || !editable}><label>Nome da pose<input maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label><Button type="button" onClick={() => attempt(() => { void save('POSE', name, capturePose(definition, viewId)); })}>Salvar pose atual</Button>
      <label>Pose reutilizável<select value={poseId} onChange={event => setPoseId(event.target.value)}><option value="">Selecione</option>{eligible.filter(t => t.kind === 'POSE').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <Button type="button" disabled={!poseId} onClick={() => attempt(() => onApply(applyPose(definition, eligible.find(t => t.id === poseId).definition)))}>Aplicar pose</Button>
    </fieldset>
    <fieldset disabled={busy || saving || !editable}><div className="rig-inline"><label>Nome da animação<input maxLength={200} value={motionName} onChange={event => setMotionName(event.target.value)} /></label><label>Tempo do keyframe<input type="number" min="0" max="60" step="0.1" value={time} onChange={event => setTime(Number(event.target.value))} /></label><Button type="button" disabled={frames.length >= 24} onClick={() => attempt(() => {
      const pose = capturePose(definition, viewId); if (base && (base.perspective !== viewId || !compatible(definition, base))) throw new Error('Keyframes de outra estrutura. Limpe-os antes de continuar.');
      setBase(pose); setFrames(values => [...values.filter(frame => frame.time !== time), { time, transforms: pose.transforms }].sort((a,b) => a.time-b.time)); setTime(Math.min(60, time+1)); onDirty(true);
    })}>Capturar keyframe</Button><Button type="button" className="button secondary" onClick={() => { setFrames([]); setBase(null); setTime(0); }}>Limpar keyframes</Button></div>
    <p>{frames.length} keyframes: {frames.map(frame => frame.time + 's').join(' → ') || 'capture primeiro em 0s'}</p>
    <div className="rig-inline"><label>Interpolação<select value={ease} onChange={event => setEase(event.target.value)}><option value="none">Linear</option><option value="sine.inOut">Suave</option><option value="power1.inOut">Acelerar e desacelerar</option></select></label>
    {['idle','blink','wave','jump'].map(preset => <Button key={preset} type="button" className="button secondary" onClick={() => attempt(() => { const value = presetAnimation(definition, viewId, partId, preset); setBase(value); setFrames(value.keyframes); setEase(value.ease); setMotionName(preset); show(value); onDirty(true); })}>{({ idle: 'Respirar', blink: 'Piscar', wave: 'Acenar', jump: 'Pular' })[preset]}</Button>)}
    <Button type="button" disabled={frames.length < 2} onClick={() => attempt(() => show(animation()))}>Testar keyframes</Button><Button type="button" disabled={frames.length < 2} onClick={() => attempt(() => { void save('ANIMATION', motionName, animation()); })}>Salvar animação</Button></div></fieldset>
    <div className="rig-inline"><label>Animação reutilizável<select value={animationId} onChange={event => setAnimationId(event.target.value)}><option value="">Selecione</option>{eligible.filter(t => t.kind === 'ANIMATION').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><Button type="button" disabled={!animationId} onClick={() => attempt(() => show(eligible.find(t => t.id === animationId).definition))}>Visualizar animação salva</Button></div>
    {preview && <ScenePlayback key={previewId} {...preview} />}
  </section>;
}
