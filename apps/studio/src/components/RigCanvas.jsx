import { RigArtwork } from './RigArtwork.jsx';
import { useRef, useState } from 'react';
import { localToWorld, worldToLocal, resolveAnchor } from '@studio/engine';
import { pivotAt } from './rig-model.js';
export function RigCanvas({ character, partId, anchorName, mode, showJoints=true, disabled, onSelect, onPart, onAnchor }) {
  const svg = useRef(null), drag = useRef(null);
  const [zoom, setZoom] = useState(1);
  const { definition, perspective, nodes } = character;
  const node = nodes.find(node => node.partId === partId);
  const part = perspective.parts.find(part => part.id === partId);
  const anchor = perspective.anchors.find(anchor => anchor.name === anchorName);
  const center = { x: definition.width / 2, y: definition.height / 2 };
  const width = (definition.width + 128) / zoom, height = (definition.height + 128) / zoom;
  function point(event) {
    const matrix = svg.current.getScreenCTM();
    if (!matrix) return null;
    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: position.x, y: position.y };
  }
  function change(event) {
    if (!drag.current || disabled || !node) return;
    const world = point(event); if (!world) return;
    if (mode === 'pivot') onPart(pivotAt(part, node, world));
    else if (mode === 'anchor' && anchor && anchor.partId === partId) {
      const local = worldToLocal(world, node.world);
      onAnchor({ ...anchor, position: anchor.coordinateSpace === 'normalized' ? { x: local.x / node.entity.width, y: local.y / node.entity.height } : local });
    } else if (mode === 'move') {
      const parent = nodes.find(value => value.partId === part.parentId);
      const local = parent ? worldToLocal(world, parent.world) : world;
      onPart({ ...part, position: { x: local.x - drag.current.offset.x, y: local.y - drag.current.offset.y } });
    }
  }
  function start(event) {
    if (event.button !== 0) return;
    if (mode === 'select') { const id = event.target.closest('[data-part]')?.getAttribute('data-part'); if (id) onSelect(id); return; }
    if (disabled || !node) return;
    event.preventDefault(); const world = point(event); if (!world) return;
    const parent = nodes.find(value => value.partId === part.parentId);
    const local = parent ? worldToLocal(world, parent.world) : world;
    drag.current = { offset: { x: local.x - part.position.x, y: local.y - part.position.y } };
    event.currentTarget.setPointerCapture(event.pointerId); change(event);
  }
  function draw(parentId) {
    return perspective.parts.filter(part => part.parentId === parentId).sort((a,b) => a.zIndex - b.zIndex).map(part => {
      if (!part.visible) return null;
      const resolved = nodes.find(node => node.partId === part.id);
      return <g key={part.id}>
        {part.assetId && <rect data-part={part.id} width={resolved.entity.width} height={resolved.entity.height}
          transform={'matrix(' + resolved.world.join(' ') + ')'} fill="transparent" />}
        {draw(part.id)}
      </g>;
    });
  }
  const pivot = node && localToWorld({ x: node.transform.pivotX, y: node.transform.pivotY }, node.world);
  const factor = 1024 / Math.max(width, height), left = center.x - width / 2, top = center.y - height / 2;
  const scene = { schemaVersion: 1, width: width * factor, height: height * factor, background: '#f1f5f9', entities: [
    { id: 'page', kind: 'rectangle', width: definition.width, height: definition.height, color: '#ffffff', position: { x: -left * factor, y: -top * factor }, scaleX: factor, scaleY: factor },
    ...character.entities.map(entity => entity.id === 'editor__instance' ? { ...entity, position: { x: -left * factor, y: -top * factor }, scaleX: factor, scaleY: factor } : entity),
  ] };
  const imageKey = [...new Set(perspective.parts.map(part => part.assetId).filter(Boolean))].sort().join(':');
  return <div className="rig-stage">
    <div className="rig-zoom"><button type="button" onClick={() => setZoom(value => Math.max(0.125, value / 1.5))} aria-label="Diminuir zoom">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(8, value * 1.5))} aria-label="Aumentar zoom">+</button><button type="button" onClick={() => setZoom(1)}>Restaurar zoom</button></div>
    <div className="rig-visual"><RigArtwork key={imageKey} scene={scene} />
    <svg ref={svg} role="img" aria-label="Editor visual do personagem" viewBox={[center.x - width / 2, center.y - height / 2, width, height].join(' ')}
      onPointerDown={start} onPointerMove={change} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <rect x="0" y="0" width={definition.width} height={definition.height} fill="transparent" stroke="#cbd5e1" />
      {draw(null)}
      {node && <rect data-testid="selected-part-outline" x="0" y="0" width={node.entity.width} height={node.entity.height} transform={'matrix(' + node.world.join(' ') + ')'} fill="none" stroke="#6366f1" vectorEffect="non-scaling-stroke" strokeDasharray="5 3" pointerEvents="none" />}
      {showJoints && pivot && <rect data-testid="rig-pivot" x={pivot.x - 6 / zoom} y={pivot.y - 6 / zoom} width={12 / zoom} height={12 / zoom} fill="#1d4ed8" pointerEvents="none" />}
      {showJoints && perspective.anchors.map(anchor => { const point = resolveAnchor(character, 'editor.' + anchor.name); return <g key={anchor.name} pointerEvents="none"><circle data-anchor={anchor.name} cx={point.x} cy={point.y} r={(anchor.name === anchorName ? 8 : 5) / zoom} fill="#b45309" /><text x={point.x + 12 / zoom} y={point.y} fontSize={14 / zoom} fill="#92400e">{anchor.name}</text></g>; })}
    </svg></div>
    <p className="footnote" hidden={!showJoints}>Quadrado azul: pivô da parte selecionada. Círculos âmbar: anchors. Use os campos numéricos para ajustes precisos.</p>
  </div>;
}
