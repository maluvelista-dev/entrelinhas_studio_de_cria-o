# Movimentos e interações — primeiro incremento

Escopo autorizado em 04/10/2026. Implementados neste incremento: movement.moveTo, object.grab, object.carry, object.release e input.tap. A lista completa tem 128 entradas e permanece no [roteiro incremental](MOVEMENTS_AND_INTERACTIONS_PLAN.md). Não declarar as demais ações, o editor de variantes ou a timeline multipista como concluídos.

## Uso e aceite manual

1. Prepare um personagem com imagem e um anchor na mão/pata em Biblioteca → Personagens → Perspectivas e partes. Salve a estrutura. Para este primeiro teste, deixe a animação corporal da página sem animação.
2. Importe uma ilustração na área Objetos da Biblioteca. Cenários também podem ser inseridos na página, mas não podem ser carregados por um personagem.
3. Abra um livro em rascunho → Páginas. Insira o personagem. Em Objetos, cenários e ações, escolha o objeto e clique Inserir objeto ou cenário. Ajuste posição, escala e rotação; confira o anchor center ou adicione um anchor próprio com coordenadas relativas à imagem.
4. Escolha Mover até, ator e anchor da mão. Configure destino como Anchor de outro elemento → objeto → center. Informe a duração e adicione a ação. A origem da instância pode ser usada quando não é necessário alinhar uma mão/pé.
5. Adicione Pegar objeto, escolhendo o mesmo ator, anchor da mão e objeto.
6. Adicione Carregar até, escolhendo o objeto e um ponto de destino. Adicione Soltar objeto. Opcionalmente acrescente Mover até para afastar o personagem e verificar que o objeto ficou no local.
7. Atualize a prévia. Reproduza, pause, faça seek para frente e para trás e resete. O objeto deve acompanhar a mão e manter posição, escala e rotação ao soltar. Teste também um personagem espelhado/rotacionado e uma animação corporal compatível.
8. Escolha início Ao tocar em um elemento e o alvo do toque. Atualize a prévia e toque/clique na arte do alvo. O botão Simular toque no alvo permite testar pelo teclado. Um novo toque reinicia a sequência desde o estado inicial.
9. Salve a página, recarregue e confira todos os dados. Altere apenas o texto e salve: objetos, anchors, ações e gatilho devem permanecer.
10. Reordene as ações usando Subir/Descer. A API deve recusar Carregar/Soltar antes de Pegar, outro ator soltando um objeto, anchors ausentes e destinos inválidos. Remova as referências antes de excluir uma instância usada pela sequência.

Aceite artístico e de usabilidade com os personagens reais permanece necessário. As imagens geométricas dos testes demonstram precisão de posição e execução, não a qualidade de uma futura caminhada articulada.

## Comportamento implementado

Mover até interpola linearmente a posição da instância até um ponto da página ou anchor de outra instância. O alvo é capturado no início da ação; não é follow. Se houver um anchor de origem no ator, a chegada considera sua posição ao final da animação corporal. Ações são sequenciais; o movimento da instância pode coexistir com a animação das partes.

Pegar estabelece um vínculo com o anchor atual preservando a matriz world do objeto. Não teletransporta a imagem para a mão: alinhe primeiro com Mover até. Carregar move o ator e exige que ele já tenha aquele objeto. Soltar desfaz o vínculo mantendo a transformação world. Vários objetos podem estar vinculados ao mesmo ator; cada objeto só pode ter um dono. Neste incremento vínculos são apenas objeto → anchor de personagem, impedindo ciclos de anexação por construção. Objetos podem ter anchors usados como destino, mas não carregar outros objetos.

O estado é reconstruído a partir do documento para cada tempo solicitado. Anchors usam as matrizes atuais das partes, incluindo animação, rotação e espelhamento. Animações corporais e ações compartilham um relógio GSAP. React envia comandos e não controla frames. A prévia começa parada; reset restaura a pose estática e remove todos os vínculos temporários. A barra continua indicando o tempo escolhido por seek; não acompanha continuamente o relógio em reprodução.

Tap admite mouse/toque, até 500 ms e deslocamento de até 10 pixels do renderer. O alvo usa a área geométrica da imagem; pixels transparentes não são uma máscara de hit test. Press/hold/doubleTap/drag ainda não estão implementados. Não há gravação de dados de crianças ou alteração do livro mestre durante reprodução.

## Contrato e persistência

Página/cena v3 adiciona objects e program à cena; páginas v1/v2 continuam aceitas e são promovidas pelo editor ao salvar. Objetos guardam instância, referência à Biblioteca/revisão, transform e anchors relativos. Programa v1 guarda trigger (manual ou input.tap) e até 32 ações. Ações temporais duram 0,1–30 segundos; sequência total até 120 segundos. Até oito personagens e 24 objetos/cenários, limitados também às 500 entidades do Engine. O limite JSON de 256 KiB continua ativo.

Migration 008_scene_interactions.sql cria scene_item_snapshots e amplia o CHECK de versão de página. O primeiro save congela o asset do objeto por item/revisão, assim como rigs já são congelados por revisão. Mudança de imagem na Biblioteca não altera páginas salvas. Para adotar a versão nova, remova as ações/instância e insira novamente. Assets antigos permanecem preservados. Anchors do objeto pertencem à instância da página neste incremento.

API resolve referências e assets privados, aplica escopo de livro, regras editoriais, revisão e validação integral da sequência antes da transação terminar. Revisor consulta/visualiza; books:write em rascunho é obrigatório para salvar. Serializers aninhados aceitam somente o contrato. Não há JavaScript/URL livre ou nomes arbitrários de ações executáveis. Preview não captura snapshots; somente salvar grava os dados.

Objetos ficam à frente dos personagens e cenários atrás; ordem de inserção ordena elementos da mesma categoria. Arraste no canvas, edição visual de anchors de objetos, camadas gerais e agrupamento livre continuam pendentes do editor de cenas completo.

## Arquivos principais

- packages/schemas/src/actions.js e page.js: contratos e compatibilidade de versão.
- packages/engine/src/interaction.js: avaliação determinística de movimento, anchors e vínculos.
- packages/engine/src/scene-player.js e composition.js: relógio único e composição compartilhada entre API/Studio.
- packages/engine/src/renderer.js: aplicação de estado e entrada por toque.
- apps/api/src/modules/books/scene.js e scene-objects.js: validação e snapshots.
- apps/studio/src/components/SceneActionsEditor.jsx, PageScene.jsx e ScenePlayback.jsx: autoria e prévia.
- apps/api/migrations/008_scene_interactions.sql: persistência no MariaDB.

## Próximas entregas e riscos conhecidos

As demais ações do catálogo estão pendentes. O usuário escolheu mapear partes, poses/clips e imagens alternativas por personagem; o editor desse perfil e a evolução do pacote serão entregues na etapa de gestos/expressões. Não interpretar essa decisão como geração automática de rostos ou anatomia.

Movimentos são narrativos e definidos pelo autor: sem física, colisões, IK ou desvio de obstáculos. A avaliação determinística reconstrói até 32 ações a cada frame; limites atuais contêm o custo, mas cenas/artes pesadas precisam de medição antes de aumentar os limites. A troca de página destrói o player e recursos gráficos. Snapshots e arquivos imutáveis exigem backup conjunto de banco/storage e futura política de retenção.

## Evidências e fechamento

Em 04/10/2026: 14 integrações aprovadas em cada MariaDB (10.4.32 local e 11.4.13 isolado), migration 008 aplicada ao desenvolvimento. O novo cenário E2E de interação passou após corrigir a propagação do toque no grupo gráfico, incluindo pixels reais, mouse, toque de tela, teclado, reset e persistência. O cenário de rig também passou isoladamente; oito outros cenários haviam passado na rodada anterior. A suíte ampliada atingiu o limite de logins na primeira rodada: o novo teste passou a criar uma sessão real no banco exclusivo de testes, mantendo a proteção HTTP da aplicação.

Em 07/10/2026: 37 testes unitários/componentes, lint e build aprovados novamente. O resultado da última execução conjunta dos dez cenários E2E não ficou disponível na retomada; os MariaDBs não estavam escutando nas portas 3306/3307 para repeti-la. Portanto, o fechamento da suíte conjunta e o aceite visual humano continuam pendentes. Não considerar todo o catálogo ou todas as fases concluídas.
