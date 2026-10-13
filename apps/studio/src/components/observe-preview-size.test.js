import { afterEach, expect, it, vi } from 'vitest';
import { observePreviewSize } from './observe-preview-size.js';

afterEach(() => vi.unstubAllGlobals());
it('coalesces layout notifications and cancels queued work before canvas disposal', () => {
  let notify, pending;
  const disconnect = vi.fn(), cancel = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { notify = callback; }
    observe() {}
    disconnect() { disconnect(); }
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn(callback => { pending = callback; return 7; }));
  vi.stubGlobal('cancelAnimationFrame', cancel);
  const resize = vi.fn();
  const observer = observePreviewSize({ isConnected: true }, resize);
  expect(resize).toHaveBeenCalledTimes(1);
  notify(); notify();
  expect(resize).toHaveBeenCalledTimes(1);
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  pending();
  expect(resize).toHaveBeenCalledTimes(2);
  notify();
  observer.disconnect();
  pending();
  expect(cancel).toHaveBeenCalledWith(7);
  expect(disconnect).toHaveBeenCalledOnce();
  expect(resize).toHaveBeenCalledTimes(2);
});
