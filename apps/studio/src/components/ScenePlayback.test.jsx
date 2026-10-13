// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScenePlayback } from './ScenePlayback.jsx';
const mocks = vi.hoisted(() => ({ load:vi.fn(), renderer:vi.fn(), player:vi.fn(), destroy:vi.fn() }));
vi.mock('@studio/engine/image-loader', () => ({ loadImageTexture:mocks.load }));
vi.mock('@studio/engine/renderer', () => ({ createSceneRenderer:mocks.renderer }));
vi.mock('@studio/engine/scene-player', () => ({ createScenePlayer:mocks.player }));
const scene = { width:100, height:100, entities:[{kind:'sprite',assetId:'image'}] };
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  mocks.load.mockResolvedValue({ destroy:vi.fn() });
  mocks.renderer.mockImplementation(async host => { host.appendChild(document.createElement('canvas')); return {resize:vi.fn(),applyState:vi.fn(),destroy:mocks.destroy}; });
  mocks.player.mockReturnValue({reset:vi.fn(),destroy:vi.fn()});
});
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
it('identifica falha de imagem e permite repetir sem culpar WebGL', async () => {
  mocks.load.mockRejectedValueOnce(new Error('decode'));
  render(<ScenePlayback scene={scene}/>);
  expect((await screen.findByRole('alert')).textContent).toContain('carregar uma imagem');
  expect(mocks.renderer).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button',{name:'Tentar prévia novamente'}));
  await screen.findByText('Prévia pronta.');
  expect(mocks.load).toHaveBeenCalledTimes(2);
});
it('libera o renderer quando a preparação dos keyframes falha', async () => {
  mocks.player.mockImplementationOnce(() => { throw new Error('part missing'); });
  render(<ScenePlayback scene={scene}/>);
  expect((await screen.findByRole('alert')).textContent).toContain('preparar a animação');
  await waitFor(() => expect(mocks.destroy).toHaveBeenCalledTimes(1));
});
it('identifica indisponibilidade gráfica separadamente', async () => {
  mocks.renderer.mockRejectedValueOnce(new Error('no context'));
  render(<ScenePlayback scene={scene}/>);
  expect((await screen.findByRole('alert')).textContent).toContain('canvas WebGL');
  expect(mocks.player).not.toHaveBeenCalled();
});
