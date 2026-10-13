# Referência integral das fases — 11/10/2026

Detalhamento fornecido pelo usuário em 11/10/2026. Referência para escopo, entregáveis, testes e critérios de conclusão das fases 0–13. Não representa status de implementação.

Terminologia de banco ajustada à decisão vigente: MariaDB, fornecido localmente pelo serviço “MySQL” do XAMPP. MySQL 8 não é equivalente. Produção exige MariaDB em versão mantida e migrations validadas nos dois alvos.

O avanço segue os gates de ROADMAP.md: todas as etapas obrigatórias da fase anterior concluídas e validadas, com aceite antes de iniciar a próxima. Código de fases posteriores já existente não comprova encerramento de fases anteriores.

Decisão do usuário em 11/10/2026: concluir a Fase 1 primeiro, com workflow até Pronto para publicar; Publicado e publicação efetiva permanecem na Fase 10. Acrescentar exclusão de personagens, cenários e objetos somente na Biblioteca, bloqueando itens em uso. A lista original abaixo permanece como referência histórica, subordinada a esse alinhamento explícito.

---

Detalhamento das fases
Fase 0 — Discovery técnico, arquitetura e setup
Objetivo: estabelecer a base técnica e as regras de desenvolvimento antes de implementar funcionalidades.
O que deveria ser feito:
- Definir a arquitetura do Studio, separando frontend, backend, banco de dados, armazenamento e engine.
- Configurar React com JavaScript, Node.js e MariaDB, utilizando XAMPP no desenvolvimento local.
- Escolher o motor gráfico 2D, como PixiJS ou Konva, após uma prova de conceito.
- Definir estrutura de diretórios, padrões de código, nomenclatura e contratos de API.
- Configurar migrações, variáveis de ambiente, validações, tratamento de erros e logs.
- Configurar Git, lint, testes automatizados e ambiente de desenvolvimento.
- Planejar o armazenamento de imagens, áudios, fontes e arquivos exportados.
- Definir como a hospedagem na VPS da Hostinger funcionará futuramente.
Entregáveis: repositório estruturado, aplicação React inicial, servidor Node funcional, conexão MariaDB, documentação arquitetural e ambiente de testes.
Testes obrigatórios: frontend inicia, backend responde, banco conecta, migrações funcionam e os testes básicos executam.
Tela visual: uma estrutura inicial do Studio com menu lateral, cabeçalho e rotas de navegação.
Critério de conclusão
Ambiente reproduzível e arquitetura documentada, sem depender de configurações manuais desconhecidas.

Fase 1 — Domínio Library / Book / Page / Workflow
Objetivo: criar a estrutura editorial que organiza todos os livros e seus conteúdos.
O que deveria ser feito:
- Biblioteca com múltiplos livros independentes.
- Cadastro e edição de livros: título, descrição, capa, faixa etária e categoria editorial.
- Criação, exclusão, duplicação e ordenação de páginas.
- Relacionamento entre livros, páginas, personagens, cenários e objetos.
- Biblioteca de assets reutilizáveis, com identificação de propriedade e referências.
- Persistência dos dados no MariaDB.
- Workflow editorial com os quatro estados aprovados.
Rascunho
Revisão
Pronto para publicar
Publicado


Entregáveis: telas de Biblioteca, Novo Livro, Detalhes do Livro e Gerenciamento de Páginas.
Testes obrigatórios: CRUD completo, persistência após reiniciar, integridade dos relacionamentos e transições de status válidas.
Critério de conclusão: conseguir criar dois livros, com páginas e assets diferentes, sem misturar seus conteúdos.

Fase 2 — Engine mínimo
Objetivo: fazer o software renderizar uma página de livro, mesmo que ainda não tenha ferramentas avançadas de edição.
O que deveria ser feito:
- Criar uma área de renderização 2D, o canvas.
- Renderizar imagens PNG/WebP com transparência.
- Renderizar cenários, personagens e objetos.
- Definir coordenadas x e y, largura, altura, escala, rotação e opacidade.
- Implementar camadas e ordenação visual.
- Suportar diferentes resoluções e proporções de página.
- Separar os dados da cena do motor responsável por desenhá-la.
- Implementar carregamento e descarregamento de assets.
Entregável: uma página de livro renderizada a partir de dados estruturados, sem precisar escrever posições diretamente no código.
Testes obrigatórios: renderização consistente, proporções corretas, transparência, ordenação de camadas e redimensionamento.
Critério de conclusão: abrir uma página salva e obter a mesma composição visual em diferentes execuções.

Fase 3 — Character System
Objetivo: transformar ilustrações estáticas em personagens preparados para animação.
Esta é uma das fases mais importantes do projeto.
O que deveria ser feito:
- Cadastro de personagens e importação de suas artes.
- Suporte a personagens simples, com imagens completas, e avançados, com partes separadas.
- Cadastro de vistas: frente, perfil, ¾ e costas, conforme necessidade.
- Mapeamento de cabeça, corpo, braços, patas, pernas, cauda, asas e outros componentes.
- Definição manual de pivôs e pontos de articulação.
- Criação de anchors como head, mouth, pawLeft e footRight.
- Importação de variações faciais: sorriso, choro, surpresa, medo etc.
- Definição de capacidades: andar, voar, subir, segurar, rugir.
- Validação de assets ausentes ou incompatíveis.
Entregáveis: Character Editor, importador de partes, editor de pivôs e biblioteca de personagens.
Testes obrigatórios: importar, configurar, salvar, reabrir e renderizar um personagem sem perder a posição relativa das partes.
Critério de conclusão: um personagem preparado, com articulações e expressões configuradas, pronto para ser animado.
Importante: o software não deve presumir que qualquer imagem inteira pode realizar uma animação complexa. A preparação das partes e vistas continua sendo necessária.

Fase 4 — Animation Playground
Objetivo: criar um ambiente isolado para experimentar movimentos antes de utilizá-los em livros.
O que deveria ser feito:
- Tela de testes com canvas e personagem selecionável.
- Controles de reprodução, pausa, reinício e velocidade.
- Controles manuais de posição, rotação, escala e opacidade.
- Testes de movimentos básicos: idle, walk, jump, turn, blink.
- Visualização de pivôs, anchors e limites dos elementos.
- Aplicação de expressões faciais.
- Identificação de erros visuais, como articulações desconectadas.
- Reset do personagem para sua pose inicial.
Entregável: Animation Playground funcional.
Testes obrigatórios: movimentos reproduzíveis, reset consistente, controle de velocidade e ausência de alterações permanentes involuntárias.
Critério de conclusão: conseguir importar um personagem preparado e testar movimentos básicos visualmente.
Aqui já deveríamos ter uma interface visual relativamente completa para testes manuais.

Fase 5 — Poses, Keyframes e Presets
Objetivo: transformar movimentos criados manualmente em animações reutilizáveis.
O que deveria ser feito:
- Salvar poses como idle, sitting, scared, happy.
- Criar keyframes para propriedades animáveis.
- Interpolar posições, rotações, escalas e opacidade.
- Configurar duração, easing e repetição.
- Salvar animações como presets.
- Criar presets específicos de personagens e presets genéricos.
- Duplicar, editar, versionar e excluir presets.
- Definir transições entre animações.
- Permitir pré-visualização antes de salvar.
Entregável: editor de poses/keyframes e biblioteca de animações.
Testes obrigatórios: salvar uma animação, fechar o editor, reabrir e reproduzir o mesmo movimento.
Critério de conclusão: criar uma animação de caminhada e reutilizá-la em mais de uma cena, respeitando as capacidades e a estrutura do personagem.

Fase 6 — Scene Editor
Objetivo: construir visualmente as páginas dos livros, sem precisar editar código ou coordenadas manualmente.
O que deveria ser feito:
- Criar editor visual com canvas central.
- Implementar painel de elementos: personagens, cenários, objetos e textos.
- Permitir arrastar, posicionar, redimensionar, girar e duplicar elementos.
- Criar painel de propriedades com edição numérica precisa.
- Implementar seleção múltipla, agrupamento, bloqueio e camadas.
- Adicionar ferramentas de alinhamento, guias e snapping.
- Permitir desfazer/refazer ações.
- Salvar e recuperar composições de cada página.
- Integrar personagens e animações desenvolvidos nas fases anteriores.
Entregável: editor visual de páginas com persistência completa.
Testes obrigatórios: posicionamento preciso, operações de desfazer/refazer, carregamento de páginas e independência entre livros.
Critério de conclusão: montar uma página completa com cenário, dois personagens, objetos e texto, salvá-la e reabri-la sem alterações inesperadas.

Fase 7 — Timeline
Objetivo: controlar quando e por quanto tempo cada elemento executa suas animações.
O que deveria ser feito:
- Criar timeline visual com escala de tempo.
- Implementar trilhas independentes por elemento.
- Inserir, mover, redimensionar e excluir clipes de animação.
- Configurar início, duração, repetição e transições.
- Permitir animações simultâneas.
- Adicionar controles de play, pause, seek e reprodução em loop.
- Sincronizar a timeline com o canvas.
- Implementar salvamento e recuperação dos eventos temporais.
Entregável: editor de timeline integrado ao Scene Editor.
Testes obrigatórios: reprodução determinística, sincronização entre elementos e posicionamento correto ao avançar ou retroceder no tempo.
Critério de conclusão: conseguir fazer Luma andar, parar, olhar para Otto e rugir enquanto outro objeto começa a brilhar.

Fase 8 — Interactions / Anchors avançados
Objetivo: permitir que personagens e objetos interajam entre si e com a criança.
O que deveria ser feito:
- Criar anchors de interação, como hugTarget, climbStart, branchLanding.
- Implementar vinculação e desvinculação entre elementos.
- Desenvolver comportamentos como hug, climb, grab, give, follow.
- Definir gatilhos: toque, arrastar, soltar, pressionar e conclusão de animação.
- Criar condições e ações sem precisar programar cada interação.
- Implementar limites de movimentação e zonas interativas.
- Adicionar validação de compatibilidade entre personagens e ações.
- Criar modo de pré-visualização das interações.
Entregável: editor de interações com gatilhos, condições e ações.
Testes obrigatórios: personagens alcançam anchors corretos, objetos permanecem vinculados quando necessário e interações não entram em ciclos inesperados.
Critério de conclusão: a criança toca na Luma, ela ruge e seu colar brilha; ou um personagem se aproxima de outro e executa um abraço.

Fase 9 — Narration / Audio
Objetivo: adicionar narração, efeitos sonoros e trilhas aos livros.
O que deveria ser feito:
- Importar arquivos de narração e efeitos.
- Associar narração a páginas e trechos.
- Criar trilhas de áudio na timeline.
- Controlar volume, início, fim, fades e reprodução.
- Sincronizar animações com eventos de áudio.
- Permitir reprodução automática ou acionada pela criança.
- Implementar controle de mute e replay.
- Tratar falhas de carregamento e restrições de reprodução dos navegadores.
Entregável: editor de áudio integrado à timeline.
Testes obrigatórios: sincronização, reprodução, pausa, troca de páginas e funcionamento em dispositivos móveis.
Critério de conclusão: uma página completa reproduz narração, movimentos e efeitos sonoros sincronizados.

Fase 10 — Review + Publication Pipeline
Objetivo: estabelecer controle editorial e impedir a publicação de conteúdo incompleto.
O que deveria ser feito:
- Implementar efetivamente os quatro estados editoriais definidos na Fase 1.
- Criar tela de revisão com checklist de qualidade.
- Verificar assets ausentes, animações inválidas e falhas de áudio.
- Permitir comentários e solicitações de correção.
- Separar versão em edição da versão publicada.
- Registrar histórico de revisões e responsáveis.
- Implementar aprovação e publicação.
- Permitir novas revisões sem alterar a versão já disponibilizada aos leitores.
Entregável: painel de revisão e publicação com versionamento.
Testes obrigatórios: bloqueio de publicações inválidas, integridade das versões e recuperação de uma versão publicada.
Critério de conclusão: publicar um livro revisado e continuar editando uma nova versão sem modificar o conteúdo disponível no aplicativo.

Fase 11 — API de distribuição
Objetivo: disponibilizar os livros publicados para o futuro aplicativo de leitura.
O que deveria ser feito:
- Criar endpoints para catálogo, livros, páginas e assets.
- Distribuir apenas versões publicadas.
- Fornecer metadados de faixa etária e categorias.
- Diferenciar conteúdos do plano Básico e Premium.
- Implementar autenticação e autorização adequadas.
- Definir contratos JSON estáveis para o player.
- Implementar paginação, cache e controle de versões.
- Criar testes de contrato e integração.
Entregável: API documentada, consumível por um aplicativo externo.
Testes obrigatórios: controle de acesso, consistência de versões, respostas inválidas e desempenho básico.
Critério de conclusão: um aplicativo de teste consegue consultar o catálogo e renderizar um livro publicado usando exclusivamente a API.

Fase 12 — Export de imagens / PDF
Objetivo: permitir que os livros sejam utilizados fora do Studio.
O que deveria ser feito:
- Exportar páginas como PNG ou JPEG.
- Gerar PDF com todas as páginas do livro.
- Configurar resolução, tamanho, margens e orientação.
- Criar exportação para leitura digital e impressão.
- Garantir que textos e imagens mantenham proporções.
- Criar fila de exportações e histórico de arquivos gerados.
- Validar fontes, transparências e qualidade final.
Entregável: módulo de exportações de imagens e PDF.
Testes obrigatórios: qualidade visual, dimensões, integridade do PDF e consistência com a versão selecionada.
Critério de conclusão: exportar um livro inteiro em PDF e imagens individuais, mantendo a composição das páginas.
Animações e interações não funcionam dentro de um PDF comum. A exportação deve representar um estado visual escolhido da página.

Fase 13 — Video Renderer
Objetivo: transformar cenas animadas em vídeos utilizáveis no YouTube, TikTok e outras plataformas.
O que deveria ser feito:
- Criar renderização quadro a quadro.
- Capturar as animações da timeline.
- Sincronizar áudio e vídeo.
- Gerar arquivos MP4.
- Oferecer proporções 16:9, 9:16 e 1:1.
- Permitir selecionar páginas, cenas ou sequências completas.
- Configurar FPS, resolução e qualidade.
- Implementar fila de processamento e acompanhamento do progresso.
- Permitir baixar e reutilizar vídeos exportados.
Entregável: renderizador de vídeo com painel de exportação.
Testes obrigatórios: sincronização audiovisual, duração correta, integridade do MP4 e ausência de quadros perdidos.
Critério de conclusão: exportar uma cena animada com narração e efeitos sonoros em MP4, pronta para edição ou publicação externa.