// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionWorkbench } from './MotionWorkbench.jsx';
import { newDefinition } from './rig-model.js';
vi.mock('../api.js',()=>({api:vi.fn(async()=>[])}));
vi.mock('./ScenePlayback.jsx',()=>({ScenePlayback:()=>null}));
afterEach(cleanup);
it('permite editar um quadro criado por preset como pose válida',async()=>{
  const apply=vi.fn(),item={id:'luma',name:'Luma',ownerBookId:null};
  render(<MotionWorkbench item={item} definition={newDefinition(item)} viewId="front" partId="root" assets={[]} editable onApply={apply} onDirty={()=>{}}/>);
  const user=userEvent.setup();await user.click(screen.getByRole('button',{name:'Animações',exact:true}));
  await user.click(screen.getByRole('button',{name:'Pular',exact:true}));
  await user.click(screen.getByRole('button',{name:'Editar quadro de 0.5s'}));
  await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
  expect(apply.mock.calls[0][0].perspectives[0].parts[0].position.y).toBe(-80);
  expect(screen.queryByRole('alert')).toBeNull();
});
