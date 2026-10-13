// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { emptyPage } from '@studio/schemas';
import { BookEditor } from './BookEditor.jsx';
vi.mock('./PageScene.jsx',()=>({PageScene:({document,onChange})=><button type="button" onClick={()=>onChange({...document.scene,width:800})}>Alterar arte</button>}));
afterEach(cleanup);
it('preserva texto e arte não salvos ao alternar as abas',async()=>{
  const save=vi.fn(),confirm=vi.spyOn(window,'confirm');
  function Harness(){const [dirty,setDirty]=useState(false);return <BookEditor book={{id:'book',title:'Livro',slug:'livro',revision:1,version:1,status:'DRAFT',history:[],pages:[{...emptyPage(),id:'page',position:1}]}} assets={[]} permissions={['books:write']} dirty={dirty} onDirty={setDirty} onPage={save}/>;}
  render(<Harness/>);const user=userEvent.setup();
  await user.click(screen.getByRole('tab',{name:'Páginas',exact:true}));
  await user.type(screen.getByLabelText('Texto da página'),'Texto ainda não salvo');
  await user.click(screen.getByRole('tab',{name:'Arte das páginas'}));
  await user.click(screen.getByRole('button',{name:'Alterar arte'}));
  await user.click(screen.getByRole('tab',{name:'Páginas',exact:true}));
  expect(screen.getByLabelText('Texto da página').value).toBe('Texto ainda não salvo');
  await user.click(screen.getByRole('button',{name:'Salvar página'}));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({content:{text:'Texto ainda não salvo',narration:null},scene:expect.objectContaining({width:800})}),'page');
  expect(confirm).not.toHaveBeenCalled();confirm.mockRestore();
});
