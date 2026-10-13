export const perspectiveTitle=view=>view.name || ({front:'Frente',side:'Lateral',left:'Lateral esquerda',right:'Lateral direita',back:'Costas'})[view.id] || view.id;
export const partTitle=part=>part.name || ({root:'Imagem inteira / base',body:'Corpo',head:'Cabeça',hand:'Mão'})[part.id] || part.id;
export function identifierFor(label,existing=[]) {
  const base=label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60);
  const safe=/^[a-z]/.test(base)?base:'parte_'+(base || 'nova');let id=safe,index=2;
  while(existing.includes(id)) id=safe+'_'+index++;
  return id;
}
export function fileSize(bytes) {
  if(bytes<1024) return bytes+' bytes';
  if(bytes<1024*1024) return (bytes/1024).toLocaleString('pt-BR',{maximumFractionDigits:1})+' KB';
  return (bytes/(1024*1024)).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB';
}
