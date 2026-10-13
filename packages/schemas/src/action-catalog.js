// Semantic IDs are stable across books, character packs and the authoring UI.
const groups = [
  ['movement','Locomoção','walkTo runTo moveTo jump jumpTo hop crawl sneak backAway follow wander'],
  ['acrobatics','Acrobáticos','somersault roll spin slide bounce fall trip land'],
  ['climbing','Escalada','climb climbTo descend hang swing jumpOff balanceOn'],
  ['flying','Voo','takeOff flyTo flyPath hover landOn flapWings'],
  ['gesture','Expressões corporais','lookAt lookAround lookUp lookDown turnTo nod shakeHead tiltHead shrug tremble celebrate dance laugh cry yawn sleep wakeUp'],
  ['expression','Expressões faciais','blink wink smile sad angry scared surprised curious thinking excited'],
  ['gesture','Gestos','wave pointAt reachFor clap raiseHand coverEyes coverMouth handsOnHips'],
  ['interaction','Entre personagens','hug holdHands highFive followCharacter give receive helpUp pushCharacter pullCharacter leanOn hideBehind'],
  ['object','Objetos','grab release carry throw catch push pull drag open close placeOn placeInside takeFrom shake rotate'],
  ['environment','Ambiente','sitOn lieOn enter exit hideInside hideBehind peekFrom leanAgainst standOn'],
  ['input','Interação da criança','tap doubleTap press hold drag drop swipe trace choose match sort find collect assemble'],
  ['effect','Efeitos','shake pulse glow fadeIn fadeOut grow shrink float sway sparkle appear disappear'],
];
const labels = {
  walkTo:'Andar até',runTo:'Correr até',moveTo:'Mover até',jump:'Pular',jumpTo:'Pular até',hop:'Pequenos pulos',crawl:'Rastejar',sneak:'Andar escondido',backAway:'Recuar',follow:'Seguir',wander:'Passear pelo caminho',
  somersault:'Cambalhota',roll:'Rolar',spin:'Girar',slide:'Deslizar',bounce:'Quicar',fall:'Cair',trip:'Tropeçar',land:'Aterrissar',climb:'Escalar',climbTo:'Escalar até anchor',descend:'Descer',hang:'Ficar pendurado',swing:'Balançar pendurado',jumpOff:'Saltar do apoio',balanceOn:'Equilibrar sobre',takeOff:'Levantar voo',flyTo:'Voar até',flyPath:'Voar pelo caminho',hover:'Pairar',landOn:'Pousar sobre',flapWings:'Bater asas',
  lookAt:'Olhar para',lookAround:'Olhar ao redor',lookUp:'Olhar para cima',lookDown:'Olhar para baixo',turnTo:'Virar para',nod:'Concordar',shakeHead:'Negar',tiltHead:'Inclinar cabeça',shrug:'Dar de ombros',tremble:'Tremer',celebrate:'Comemorar',dance:'Dançar',laugh:'Rir',cry:'Chorar',yawn:'Bocejar',sleep:'Dormir',wakeUp:'Acordar',blink:'Piscar',wink:'Piscar um olho',smile:'Sorrir',sad:'Triste',angry:'Bravo',scared:'Assustado',surprised:'Surpreso',curious:'Curioso',thinking:'Pensando',excited:'Animado',wave:'Acenar',pointAt:'Apontar para',reachFor:'Estender braço',clap:'Bater palmas',raiseHand:'Levantar mão',coverEyes:'Cobrir olhos',coverMouth:'Cobrir boca',handsOnHips:'Mãos na cintura',hug:'Abraçar',holdHands:'Dar as mãos',highFive:'Tocar mãos',followCharacter:'Seguir personagem',give:'Entregar objeto',receive:'Receber objeto',helpUp:'Ajudar a levantar',pushCharacter:'Empurrar personagem',pullCharacter:'Puxar personagem',leanOn:'Apoiar no personagem',hideBehind:'Esconder atrás',grab:'Pegar objeto',release:'Soltar objeto',carry:'Carregar até',throw:'Arremessar',catch:'Pegar objeto lançado',push:'Empurrar objeto',pull:'Puxar objeto',drag:'Arrastar',open:'Abrir',close:'Fechar',placeOn:'Colocar sobre',placeInside:'Colocar dentro',takeFrom:'Retirar',shake:'Sacudir',rotate:'Girar objeto',sitOn:'Sentar sobre',lieOn:'Deitar sobre',enter:'Entrar',exit:'Sair',hideInside:'Esconder dentro',peekFrom:'Espiar',leanAgainst:'Encostar',standOn:'Ficar sobre',tap:'Toque',doubleTap:'Toque duplo',press:'Pressionar',hold:'Manter pressionado',drop:'Soltar no destino',swipe:'Deslizar dedo',trace:'Traçar caminho',choose:'Escolher opção',match:'Combinar pares',sort:'Ordenar',find:'Encontrar',collect:'Coletar',assemble:'Montar',pulse:'Pulsar',glow:'Brilhar',fadeIn:'Aparecer suavemente',fadeOut:'Desaparecer suavemente',grow:'Crescer',shrink:'Diminuir',float:'Flutuar',sway:'Balançar suavemente',sparkle:'Partículas de brilho',appear:'Aparecer',disappear:'Desaparecer',
};
const has = (words,name) => words.split(' ').includes(name);
export const actionCatalog = groups.flatMap(([domain,category,words]) => words.split(' ').map(name => {
  const type=domain+'.'+name;
  let mode='mapped';
  if (domain==='input') mode='input';
  else if (domain==='effect') mode='effect';
  else if (has('grab catch takeFrom',name) && domain==='object') mode='attach';
  else if (type==='object.release') mode='release';
  else if (has('give receive',name)) mode='transfer';
  else if (has('wander flyPath',name)) mode='path';
  else if (has('follow followCharacter',name)) mode='follow';
  else if (domain==='object' && has('shake rotate open close',name)) mode='objectTransform';
  else if (has('jump hop bounce hover flapWings spin',name)) mode='stationary';
  else if (!['gesture','expression'].includes(domain)) mode='travel';
  const target=['travel','follow'].includes(mode) || has('lookAt turnTo pointAt reachFor',name);
  const mapped=['gesture','expression','climbing','environment'].includes(domain) || (domain==='interaction' && !has('followCharacter give receive hideBehind',name)) || has('walkTo runTo crawl sneak backAway trip land flapWings takeOff landOn',name);
  const amplitude=has('jump jumpTo hop somersault bounce trip jumpOff hover throw shake float sparkle',name);
  const cycles=has('jump hop bounce spin roll somersault shake pulse sway wander',name);
  return { amplitude,cycles,type,name,label:labels[name],category,domain,mode,target,mapped,
    object:domain==='object' || mode==='transfer', partner:domain==='interaction',
    contact:['climbing','environment'].includes(domain) || has('hug holdHands highFive leanOn helpUp',name),
  };
}));
export const actionTypes=actionCatalog.filter(a=>a.domain!=='input').map(a=>a.type);
export const inputTypes=actionCatalog.filter(a=>a.domain==='input').map(a=>a.type);
export const actionInfo=type=>actionCatalog.find(a=>a.type===type);
