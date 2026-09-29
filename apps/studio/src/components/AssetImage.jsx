import { useState } from 'react';
export function AssetImage({ id, alt, className = '' }) {
  const [failed, setFailed] = useState(null);
  if (!id || failed === id) return <span className={'image-unavailable ' + className}>Imagem indisponível</span>;
  return <img src={'/api/internal/assets/' + encodeURIComponent(id) + '/content'} alt={alt} className={className}
    loading="lazy" onError={() => setFailed(id)} />;
}
