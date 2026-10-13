import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { capturePose } from '../../packages/engine/src/motion.js';
import { assertTestDatabase, readConfig } from '../../apps/api/src/config.js';
import { createPool } from '../../apps/api/src/infrastructure/database/pool.js';
import { createAuthService } from '../../apps/api/src/modules/auth/service.js';
test('maps an alternate image, authors catalog actions and completes a child activity',async({page,context,baseURL})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assertTestDatabase();const pool=createPool(readConfig().database);
  try {const session=await createAuthService(pool).login({username:process.env.E2E_USERNAME,password:process.env.E2E_PASSWORD});await context.addCookies([{name:'studio_session',value:session.token,url:baseURL,httpOnly:true,sameSite:'Strict'}]);} finally {await pool.end();}
  await page.goto('/');await expect(page.getByRole('heading',{name:'Sua estante'})).toBeVisible();
  const headers={Origin:new URL(page.url()).origin},stamp=Date.now(),name='Capacidades '+stamp;
  const character=await (await page.request.post('/api/internal/library',{headers,data:{kind:'CHARACTER',name}})).json();
  const definition={schemaVersion:1,id:'actor',name,width:100,height:100,perspectives:[{id:'front',rootId:'body',parts:[{id:'body',parentId:null,assetId:null,position:{x:0,y:0}},{id:'happy',parentId:'body',assetId:null,position:{x:0,y:0},opacity:0}],anchors:[]}]};
  let rig={revision:1,definition};
  for(const [part,color] of [['body','#9933cc'],['happy','#ffdd00']]) {
    const buffer=await sharp({create:{width:80,height:80,channels:4,background:color}}).png().toBuffer();
    const response=await page.request.post('/api/internal/library/'+character.id+'/rig/front/'+part+'/image',{headers,multipart:{revision:String(rig.revision),definition:JSON.stringify(rig.definition),file:{name:part+'.png',mimeType:'image/png',buffer}}});expect(response.status()).toBe(201);rig=await response.json();
  }
  const pose=await (await page.request.post('/api/internal/templates',{headers,data:{kind:'POSE',name:'Sorriso '+stamp,definition:capturePose(rig.definition,'front')}})).json();
  await page.reload();await page.getByRole('button',{name:/Biblioteca/}).click();await page.getByRole('button',{name:'Abrir '+name,exact:true}).click();await page.getByRole('button',{name:'Perspectivas e partes'}).click();
  await page.getByRole('button',{name:/4 Poses e ações/}).click();await page.getByRole('button',{name:'Ações e expressões',exact:true}).click();
  await page.getByRole('combobox',{name:'Ação do personagem',exact:true}).selectOption('expression.smile');await page.getByLabel('Pose ou animação da capacidade').selectOption(pose.id);await page.getByLabel('Parte que troca de imagem').selectOption('body');await page.getByLabel('Parte com a imagem alternativa').selectOption('happy');await page.getByRole('button',{name:'Associar capacidade'}).click();
  await page.getByRole('button',{name:'Salvar estrutura',exact:true}).click();await expect(page.getByText('Estrutura salva.',{exact:true})).toBeVisible();
  const updated=await (await page.request.get('/api/internal/library/'+character.id+'/rig')).json();expect(updated.definition.perspectives[0].behaviors[0].images).toEqual([{partId:'body',sourcePartId:'happy'}]);
  await page.goto('/');await page.getByRole('button',{name:/Novo livro/}).click();await page.getByLabel('Título do livro').fill('Catálogo '+stamp);await page.getByLabel('Identificador (slug)').fill('catalog-'+stamp);await page.getByRole('button',{name:'Criar livro',exact:true}).click();
  await page.getByRole('tab',{name:'Páginas',exact:true}).click();await page.getByRole('button',{name:'Adicionar página'}).click();await page.getByRole('tab',{name:'Arte das páginas',exact:true}).click();await page.getByLabel('Personagem da Biblioteca').selectOption(character.id);await page.getByRole('button',{name:'Inserir personagem',exact:true}).click();await page.getByLabel('X na página',{exact:true}).fill('100');await page.getByLabel('Y na página',{exact:true}).fill('100');
  const actorId=await page.getByLabel('Instância na página').inputValue();
  await page.getByLabel('Ação do catálogo').selectOption('expression.smile');await page.getByLabel('Participante principal').selectOption(actorId);await page.getByLabel('Duração no catálogo (s)').fill('0.4');await page.getByRole('button',{name:'Adicionar ação do catálogo'}).click();
  await page.getByLabel('Ação do catálogo').selectOption('movement.jumpTo');await page.getByLabel('X final',{exact:true}).fill('400');await page.getByLabel('Y final',{exact:true}).fill('100');await page.getByRole('button',{name:'Adicionar ação do catálogo'}).click();
  await page.getByLabel('Tipo de atividade').selectOption('input.collect');await page.getByRole('button',{name:'Aplicar regra de interação'}).click();await page.getByRole('button',{name:'Atualizar prévia da página',exact:true}).click();await expect(page.getByText('Prévia pronta.',{exact:true})).toBeVisible();
  const canvas=page.getByRole('img',{name:'Prévia da cena animada'});
  const yellow=()=>canvas.evaluate(node=>{const gl=node.getContext('webgl2')||node.getContext('webgl'),pixel=new Uint8Array(4);gl.readPixels(Math.floor(node.width*410/1024),node.height-1-Math.floor(node.height*110/768),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return pixel[0]>240&&pixel[1]>180&&pixel[1]<240&&pixel[2]<20;});
  await page.getByRole('button',{name:/^Elemento 1/}).focus();await page.keyboard.press('Enter');await expect.poll(yellow).toBe(true);
  await page.getByRole('button',{name:'Reiniciar atividade',exact:true}).click();await expect.poll(yellow).toBe(false);
  await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await page.mouse.click(box.x+110/1024*box.width,box.y+110/768*box.height);await expect.poll(yellow).toBe(true);
  await page.getByRole('button',{name:'Salvar página',exact:true}).click();await expect(page.getByText('Alterações não salvas')).toHaveCount(0);await page.reload();await page.getByRole('button',{name:new RegExp('Catálogo '+stamp)}).click();await page.getByRole('tab',{name:'Arte das páginas',exact:true}).click();await expect(page.locator('.action-sequence li')).toHaveCount(2);await expect(page.getByLabel('Tipo de atividade')).toHaveValue('input.collect');
  // Exercise real canvas gesture dispatch, beyond the pure recognition tests.
  await page.getByLabel('Tipo de atividade').selectOption('input.hold');await page.getByRole('button',{name:'Aplicar regra de interação'}).click();await page.getByRole('button',{name:'Atualizar prévia da página',exact:true}).click();await expect(page.getByText('Prévia pronta.',{exact:true})).toBeVisible();
  await canvas.focus();await page.keyboard.down('Space');await page.waitForTimeout(900);await page.keyboard.up('Space');await expect.poll(yellow).toBe(true);
  await page.getByLabel('Tipo de atividade').selectOption('input.trace');await page.getByRole('button',{name:'Aplicar regra de interação'}).click();await page.getByRole('button',{name:'Atualizar prévia da página',exact:true}).click();await expect(page.getByText('Prévia pronta.',{exact:true})).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();let bounds=await canvas.boundingBox();const toClient=(x,y)=>({x:bounds.x+x/1024*bounds.width,y:bounds.y+y/768*bounds.height});let start=toClient(110,110),end=toClient(300,100);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:20});await page.mouse.up();await expect.poll(yellow).toBe(true);
  await page.getByRole('button',{name:'Remover ação 1',exact:true}).click();await page.getByRole('button',{name:'Remover ação 1',exact:true}).click();
  await page.getByLabel('Personagem da Biblioteca').selectOption(character.id);await page.getByRole('button',{name:'Inserir personagem',exact:true}).click();await page.getByLabel('X na página',{exact:true}).fill('300');await page.getByLabel('Y na página',{exact:true}).fill('100');
  await page.getByLabel('Tipo de atividade').selectOption('input.assemble');await page.getByRole('button',{name:'Aplicar regra de interação'}).click();await page.getByRole('button',{name:'Atualizar prévia da página',exact:true}).click();await expect(page.getByText('Prévia pronta.',{exact:true})).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();bounds=await canvas.boundingBox();start=toClient(110,110);end=toClient(320,120);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:15});await page.mouse.up();await expect(page.getByText('Atividade concluída.',{exact:true})).toBeVisible();
  const purpleAtStart=()=>canvas.evaluate(node=>{const gl=node.getContext('webgl2')||node.getContext('webgl'),pixel=new Uint8Array(4);gl.readPixels(Math.floor(node.width*110/1024),node.height-1-Math.floor(node.height*110/768),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return pixel[2]>150&&pixel[1]<100;});
  await expect.poll(purpleAtStart).toBe(false);await page.getByRole('button',{name:'Reiniciar atividade',exact:true}).click();await expect.poll(purpleAtStart).toBe(true);
  await page.getByRole('button',{name:/^Elemento 1/}).click();await page.getByRole('button',{name:/^Elemento 2/}).click();await expect.poll(purpleAtStart).toBe(false);
  await page.screenshot({path:'.local/qa-catalog.png',fullPage:true});expect(errors).toEqual([]);
});
