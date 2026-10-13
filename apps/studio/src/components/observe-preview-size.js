// Canvas writes can change the observed box. Defer them until the next frame
// instead of triggering another layout inside ResizeObserver delivery.
export function observePreviewSize(element, resize) {
  let frame = null;
  let active = true;
  const observer = new ResizeObserver(() => {
    if (!active || frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (active && element.isConnected) resize();
    });
  });
  resize();
  observer.observe(element);
  return { disconnect() {
    active = false;
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  } };
}
