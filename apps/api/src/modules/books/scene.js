import { resolveSceneObjects } from './scene-objects.js';
import { composePagePreview } from '@studio/engine/composition';
import { createInteractionRuntime } from '@studio/engine/interaction';
import { characterSchema } from '@studio/schemas/character';
import { pageSceneSchema } from '@studio/schemas/page';
import { createCharacter, interpretScene } from '@studio/engine';
import { compatible, applyPose } from '@studio/engine/motion';
import { templateDto } from '../library/templates.js';
import { AppError } from '../../errors.js';
export async function resolvePageScene(connection, storage, raw, bookId, capture = false) {
  const scene = pageSceneSchema.parse(raw), result = [], allEntities = [];
  for (const instance of scene.characters) {
    const [[item]] = await connection.execute('SELECT id, owner_book_id, kind, revision, definition_json FROM library_items WHERE id = ? FOR UPDATE', [instance.characterId]);
    if (!item || item.kind !== 'CHARACTER' || (item.owner_book_id && item.owner_book_id !== bookId)) throw new AppError(422, 'INVALID_CHARACTER', 'Personagem indisponível para este livro.');
    const [[snapshot]] = await connection.execute('SELECT definition_json FROM character_snapshots WHERE character_id = ? AND revision = ?', [item.id, instance.rigRevision]);
    if (!snapshot && item.revision !== instance.rigRevision) throw new AppError(409, 'RIG_CHANGED', 'O personagem mudou. Selecione a versão atual novamente.');
    const stored = snapshot?.definition_json ?? item.definition_json;
    const definition = characterSchema.parse(typeof stored === 'string' ? JSON.parse(stored) : stored);
    const assets = new Map(), metadata = [];
    const perspective = definition.perspectives.find(view => view.id === instance.perspective);
    if (!perspective) throw new AppError(422, 'INVALID_PERSPECTIVE', 'Perspectiva indisponível.');
    for (const part of perspective.parts) if (part.assetId && !assets.has(part.assetId)) {
      const [[asset]] = await connection.execute('SELECT id, owner_book_id, owner_character_id, storage_key, media_type, width, height FROM assets WHERE id = ?', [part.assetId]);
      if (!asset || (asset.owner_book_id && asset.owner_book_id !== bookId) || (asset.owner_character_id && asset.owner_character_id !== item.id) || !['image/png','image/webp'].includes(asset.media_type) || !asset.width || !asset.height || !await storage.exists(asset.storage_key)) throw new AppError(422, 'INVALID_ASSET', 'Imagem do personagem indisponível.');
      assets.set(asset.id, { kind: 'sprite', width: asset.width, height: asset.height });
      metadata.push({ id: asset.id, width: asset.width, height: asset.height });
    }
    let pose = null, animation = null;
    for (const [id, kind] of [[instance.poseId, 'POSE'], [instance.animationId, 'ANIMATION']]) if (id) {
      const [[row]] = await connection.execute('SELECT id, name, kind, owner_book_id, definition_json FROM motion_templates WHERE id = ?', [id]);
      if (!row || row.kind !== kind || (row.owner_book_id && row.owner_book_id !== bookId)) throw new AppError(422, 'INVALID_MOTION', 'Pose ou animação indisponível para este livro.');
      const value = templateDto(row).definition;
      if (value.perspective !== instance.perspective || !compatible(definition, value)) throw new AppError(422, 'INCOMPATIBLE_MOTION', 'Pose ou animação incompatível com o personagem.');
      if (kind === 'POSE') pose = value; else animation = value;
    }
    let character;
    try { character = createCharacter(pose ? applyPose(definition, pose) : definition, { id: instance.id, perspective: instance.perspective, transform: { x: instance.x, y: instance.y, rotation: instance.rotation, scaleX: instance.scaleX, scaleY: instance.scaleY } }, assets); }
    catch { throw new AppError(422, 'INVALID_SCENE', 'Transformação inválida para a cena.'); }
    if (animation) {
      try { for (const frame of animation.keyframes) createCharacter(applyPose(definition, { schemaVersion: 1, perspective: animation.perspective, skeleton: animation.skeleton, transforms: frame.transforms }), { id: instance.id, perspective: instance.perspective, transform: { x: instance.x, y: instance.y, rotation: instance.rotation, scaleX: instance.scaleX, scaleY: instance.scaleY } }, assets); }
      catch { throw new AppError(422, 'INVALID_ANIMATION', 'Transformações da animação excedem os limites da cena.'); }
    }
    allEntities.push(...character.entities);
    if (!snapshot && capture) await connection.execute('INSERT INTO character_snapshots (character_id, revision, definition_json) VALUES (?, ?, ?)', [item.id, instance.rigRevision, JSON.stringify(definition)]);
    result.push({ instance, definition, assets: metadata, pose, animation });
  }
  try { interpretScene({ schemaVersion: 1, width: scene.width, height: scene.height, background: '#ffffff', entities: allEntities }); }
  catch { throw new AppError(422, 'INVALID_SCENE', 'Cena excede o limite de 500 entidades ou contém transformações inválidas.'); }
  const value={ width:scene.width,height:scene.height,characters:result };
  if (scene.schemaVersion===3) {
    value.objects=await resolveSceneObjects(connection,storage,scene.objects,bookId,capture); value.program=scene.program;
    try { createInteractionRuntime(composePagePreview(value)); }
    catch (error) { throw new AppError(422,'INVALID_INTERACTION',error.message); }
  }
  return value;
}
