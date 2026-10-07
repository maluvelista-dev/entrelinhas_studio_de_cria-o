import { AppError } from '../../errors.js';
export async function resolveSceneObjects(connection,storage,instances,bookId,capture) {
  const result=[];
  for (const instance of instances) {
    const [[item]]=await connection.execute('SELECT id, kind, owner_book_id, revision, asset_id FROM library_items WHERE id = ? FOR UPDATE',[instance.libraryId]);
    if (!item || !['OBJECT','BACKGROUND'].includes(item.kind) || (item.owner_book_id && item.owner_book_id!==bookId)) throw new AppError(422,'INVALID_SCENE_OBJECT','Objeto/cenário indisponível para este livro.');
    const [[snapshot]]=await connection.execute('SELECT asset_id FROM scene_item_snapshots WHERE library_item_id = ? AND revision = ?',[item.id,instance.revision]);
    if (!snapshot && item.revision!==instance.revision) throw new AppError(409,'OBJECT_CHANGED','Objeto alterado. Insira novamente a versão atual.');
    const assetId=snapshot?.asset_id || item.asset_id;
    const [[asset]]=await connection.execute('SELECT id, owner_character_id, owner_book_id, width, height, media_type, storage_key FROM assets WHERE id = ?',[assetId]);
    if (!asset || asset.owner_character_id || (asset.owner_book_id && asset.owner_book_id!==bookId) || !['image/png','image/webp'].includes(asset.media_type) || !asset.width || !asset.height || !await storage.exists(asset.storage_key)) throw new AppError(422,'INVALID_ASSET','O objeto precisa de uma imagem PNG/WebP disponível.');
    if (!snapshot && capture) await connection.execute('INSERT INTO scene_item_snapshots (library_item_id, revision, asset_id) VALUES (?, ?, ?)',[item.id,instance.revision,asset.id]);
    result.push({ instance,kind:item.kind,asset:{ id:asset.id,width:asset.width,height:asset.height } });
  }
  return result;
}
