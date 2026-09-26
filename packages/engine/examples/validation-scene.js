// Scene content colors are independent of interface design tokens.
export const validationScene = {
  schemaVersion: 1, width: 800, height: 600, background: '#edf3ef',
  entities: [
    { id: 'ground', kind: 'rectangle', width: 800, height: 160, color: '#bed3be', position: { x: 0, y: 440 } },
    { id: 'sun', kind: 'ellipse', width: 100, height: 100, color: '#edba66', position: { x: 0.8, y: 0.2 }, coordinateSpace: 'normalized', pivot: { x: 0.5, y: 0.5 } },
    { id: 'parent', kind: 'rectangle', width: 160, height: 160, color: '#397767', position: { x: 0.5, y: 0.5 }, coordinateSpace: 'normalized', pivot: { x: 0.5, y: 0.5 }, rotation: 0.25 },
    { id: 'child', parentId: 'parent', kind: 'ellipse', width: 70, height: 70, color: '#c46b4d', position: { x: 1, y: 0 }, coordinateSpace: 'normalized', pivot: { x: 0.5, y: 0.5 } },
  ],
};
