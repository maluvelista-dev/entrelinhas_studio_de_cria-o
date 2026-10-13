# Arte das páginas e keyframes — 09/10/2026

No livro, **Páginas** reúne o texto e **Arte das páginas** reúne a composição visual da página selecionada. Alternar entre essas duas abas preserva o rascunho. Trocar de página, sair para outra área ou recarregar ainda exige salvar ou confirmar descarte.

## Arte

1. Abra o livro e adicione uma página.
2. Em **Arte das páginas**, selecione a página na lista à esquerda.
3. Use **Imagem da arte da página → Importar e inserir arte** para PNG/WebP. A imagem vira um cenário restrito ao livro e é centralizada proporcionalmente na página. Ela não substitui automaticamente outras imagens.
4. Ou insira personagens, objetos e cenários já cadastrados. Ajuste posição, escala, pose, animação e interações.
5. Clique **Atualizar prévia da página**. A prévia mostra a composição visual; controles de reprodução aparecem quando há animação.
6. Clique **Salvar página**. Ao reabrir a aba, a composição salva carrega sua prévia. Cada página tem sua própria composição.

Upload mantém as validações existentes: sessão, origem, perfil, escopo do livro, estado editorial, PNG/WebP até 10 MiB/4096 pixels e armazenamento privado. A imagem é cadastrada no upload; a associação à página é persistida ao salvar a página. Nenhuma migration nova.

## Keyframes da Luma ou de outro personagem

1. Biblioteca → Personagens → personagem → Perspectivas e partes → **Poses e ações → Animações**.
2. Capture a posição inicial em **0s**. Confira a entrada na lista **Keyframes capturados**.
3. Mova ou rotacione a parte, escolha outro tempo e capture novamente. A captura no mesmo tempo substitui o quadro.
4. **Editar quadro** aplica sua pose à estrutura para ajuste e recaptura. **Remover quadro** elimina somente aquele quadro do rascunho.
5. Use **Testar keyframes** e **Reproduzir animação**. Depois clique **Salvar animação** para persistir os quadros.

Foi corrigida a desmontagem do editor ao salvar a estrutura: ela apagava os keyframes locais. Salvar a estrutura agora preserva os quadros em rascunho e o aviso de alterações pendentes. Os quadros continuam sendo persistidos por **Salvar animação**. Recarregar/descartar o rascunho é uma ação distinta.

## Prévia

A mensagem anterior atribuía qualquer erro às imagens/WebGL. Agora carregamento do módulo, imagem, canvas e preparação da animação têm mensagens separadas e **Tentar prévia novamente**. Falhas de preparação liberam o renderer e suas texturas. A alocação inicial do canvas acompanha o espaço de exibição, evitando criar primeiro um framebuffer do tamanho integral da arte.

Testes de navegador usam sessões isoladas, personagens fictícios e o MariaDB de teste. A reprodução no perfil pessoal do Opera com o cadastro real da Luma ainda requer conferência manual; os testes não alteram esse personagem.

Regressão final no Edge: cinco cenários aprovados (layout em três resoluções, edição do livro, permissões de revisão, ciclo de vida do Engine e articulação). Total desta correção: 177 testes unitários/componentes e nove cenários de navegador, entre Opera e Edge; lint e build aprovados.
