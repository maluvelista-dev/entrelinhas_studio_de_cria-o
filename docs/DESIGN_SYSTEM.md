# DESIGN SYSTEM — STUDIO DE LIVROS

A partir deste momento, toda interface visual do Studio deverá seguir este Design System.

Existe uma imagem de referência visual aprovada pelo projeto. Utilize-a como REFERÊNCIA DE DIREÇÃO VISUAL, não como especificação pixel-perfect.

A interface escolhida é a linha:

"Ilustrativo suave"

Características principais:

* clara;
* moderna;
* amigável;
* leve;
* colorida sem excesso;
* profissional;
* adequada a uma ferramenta criativa;
* consistente;
* com bastante espaço em branco;
* cards suaves;
* cantos arredondados;
* ilustrações utilizadas estrategicamente;
* navegação previsível.

IMPORTANTE:

O Studio é uma ferramenta utilizada pela equipe de produção.

NÃO criar uma interface infantil.

Os LIVROS são infantis.

O STUDIO é uma ferramenta profissional, porém amigável e criativa.

==================================================

1. PRINCÍPIOS VISUAIS
   ==================================================

Toda tela deve seguir estes princípios:

1. Clareza antes de decoração.
2. Hierarquia visual evidente.
3. Poucas cores competindo simultaneamente.
4. Conteúdo deve ser protagonista.
5. Espaçamento consistente.
6. Componentes reutilizáveis.
7. Estados visuais previsíveis.
8. Feedback imediato para ações.
9. Não depender somente de cores para comunicar estado.
10. Interface desktop-first.
11. Preparar responsividade sem prejudicar o ambiente de criação.
12. Evitar excesso de gradientes, sombras e elementos decorativos.

==================================================
2. PALETA PRINCIPAL
===================

Criar tokens CSS.

Não espalhar valores hexadecimais pelos componentes.

Exemplo:

:root {
--color-primary: #6366F1;
--color-primary-hover: #4F46E5;
--color-primary-soft: #EEF2FF;

--color-secondary: #06B6D4;
--color-secondary-soft: #ECFEFF;

--color-accent-orange: #F59E0B;
--color-accent-orange-soft: #FFFBEB;

--color-accent-green: #10B981;
--color-accent-green-soft: #ECFDF5;

--color-danger: #EF4444;
--color-danger-soft: #FEF2F2;

--color-background: #F8FAFC;
--color-surface: #FFFFFF;
--color-surface-secondary: #F1F5F9;

--color-border: #E2E8F0;
--color-border-strong: #CBD5E1;

--color-text-primary: #172033;
--color-text-secondary: #64748B;
--color-text-muted: #94A3B8;
}

Não utilizar preto puro #000 como texto principal.

==================================================
3. COR PRIMÁRIA
===============

A identidade funcional principal do Studio utilizará índigo/azul-violeta.

Utilizar para:

* botão principal;
* item ativo da sidebar;
* tabs ativas;
* links importantes;
* foco;
* seleção;
* controles ativos;
* elementos selecionados no futuro Scene Editor.

Não utilizar a cor primária em grandes áreas desnecessariamente.

==================================================
4. CORES DE APOIO
=================

Ciano:

* ações relacionadas a cenários;
* informação;
* recursos criativos secundários.

Verde:

* sucesso;
* publicado;
* operações concluídas.

Laranja:

* atenção;
* pronto para publicar;
* recursos destacados.

Vermelho:

* erro;
* ação destrutiva;
* validação crítica.

Não utilizar vermelho apenas como decoração.

==================================================
5. WORKFLOW EDITORIAL
=====================

Os quatro estados editoriais devem possuir identidade consistente.

DRAFT / RASCUNHO

cor neutra ou azul acinzentado.

REVIEW / EM REVISÃO

azul.

READY_TO_PUBLISH / PRONTO PARA PUBLICAR

âmbar/laranja.

PUBLISHED / PUBLICADO

verde.

Cada status deve utilizar:

ícone opcional
+
texto
+
cor

Nunca depender somente da cor.

Criar componente reutilizável:

<StatusBadge status="DRAFT" />

Não criar badges manualmente em cada tela.

==================================================
6. TIPOGRAFIA
=============

Utilizar uma tipografia moderna e altamente legível.

Preferência:

Interface:
Inter

Títulos/branding, quando apropriado:
Poppins

Não carregar diversas famílias sem necessidade.

Hierarquia aproximada:

Display:
32px / 40px
font-weight: 700

H1:
28px / 36px
700

H2:
22px / 30px
600

H3:
18px / 26px
600

Body:
14px ou 16px
400

Small:
12px ou 13px

Labels:
13px ou 14px
500/600

Evitar fontes extremamente grandes em telas operacionais.

==================================================
7. GRID DE ESPAÇAMENTO
======================

Adotar sistema baseado em múltiplos de 4.

Tokens:

--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

Preferir:

8px
12px
16px
24px
32px

Evitar valores arbitrários como:

13px
19px
27px

sem justificativa.

==================================================
8. BORDER RADIUS
================

Definir:

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 18px;

Inputs:
8–10px.

Botões:
8–10px.

Cards:
12–16px.

Modais:
16–20px.

Evitar transformar todos os componentes em "pílulas".

Pill radius deve ser reservado principalmente para:

* badges;
* filtros;
* chips;
* tags.

==================================================
9. SOMBRAS
==========

Sombras devem ser discretas.

Cards normais:

box-shadow:
0 1px 3px rgba(15, 23, 42, 0.06);

Cards elevados/modais:

0 8px 24px rgba(15, 23, 42, 0.10);

Não utilizar sombras pesadas.

Utilizar borda suave + sombra discreta quando necessário.

==================================================
10. APP SHELL
=============

Todas as áreas principais devem compartilhar uma estrutura consistente:

┌─────────────────────────────────────────────────┐
│ Sidebar │              Topbar                   │
│         ├───────────────────────────────────────┤
│         │                                       │
│         │             Conteúdo                  │
│         │                                       │
└─────────────────────────────────────────────────┘

Sidebar desktop:

aproximadamente 220–250px.

Topbar:

aproximadamente 64–72px.

Conteúdo:

background #F8FAFC.

Cards:

background branco.

==================================================
11. SIDEBAR
===========

Estrutura futura:

Logo / nome

Início

CONTEÚDO

* Livros
* Personagens
* Objetos
* Cenários

CRIAÇÃO

* Animações
* Áudio
* Biblioteca

PUBLICAÇÃO

* Revisões
* Exportações

SISTEMA

* Configurações

Nem todos precisam existir funcionalmente agora.

Não criar páginas falsas apenas para preencher menu.

Itens indisponíveis podem simplesmente não aparecer até sua fase.

Item ativo:

background primário suave;
ícone primário;
texto primário;
font-weight 600.

Item normal:

fundo transparente;
texto secundário.

Hover:

background neutro ou primário extremamente suave.

==================================================
12. TOPBAR
==========

Topbar poderá conter:

* breadcrumb;
* busca contextual;
* notificações futuramente;
* usuário/equipe;
* ações globais quando apropriado.

Evitar duplicar ações da página na Topbar.

==================================================
13. DASHBOARD
=============

Dashboard futuro deverá priorizar:

1. contexto;
2. atalhos;
3. conteúdo recente.

Estrutura:

Boas-vindas

[ Novo livro ]
[ Personagem ]
[ Cenário ]
[ Animação ]

Meus livros

Filtros:

Todos
Rascunho
Em revisão
Pronto
Publicado

Não adicionar métricas empresariais sem necessidade.

==================================================
14. ILUSTRAÇÕES DECORATIVAS
===========================

Podem existir ilustrações em:

* dashboard;
* empty states;
* onboarding;
* cabeçalhos especiais.

Não utilizar grandes ilustrações em:

* formulários complexos;
* Character Editor;
* Animation Playground;
* Scene Editor;
* Timeline.

Nessas áreas, maximizar espaço útil.

==================================================
15. BOOK CARD
=============

Criar componente:

<BookCard />

Estrutura:

[ capa ]

Título

StatusBadge

Faixa etária • quantidade de páginas

Última edição

menu (...)

Cards devem possuir proporção consistente.

Hover:

leve elevação/borda primária suave.

Não criar efeitos exagerados.

==================================================
16. EMPTY STATES
================

Nunca mostrar apenas uma área vazia.

Exemplo:

Nenhum livro criado ainda.

[ilustração pequena]

"Comece criando sua primeira história."

[ + Criar livro ]

Utilizar o mesmo padrão para:

* personagens;
* objetos;
* cenários;
* animações.

==================================================
17. BOTÕES
==========

Criar componente Button.

Variants:

primary
secondary
ghost
success
danger

Primary:

background primary;
texto branco.

Secondary:

background branco;
border;
texto principal.

Ghost:

sem background;
hover suave.

Danger:

vermelho somente para ações destrutivas.

Altura padrão:

40px.

Botões compactos:

32–36px.

Não criar novos estilos de botão por página.

==================================================
18. INPUTS
==========

Inputs devem possuir:

label acima;
input;
helper text opcional;
error abaixo.

Altura aproximada:

40–44px.

Focus:

border primary;
focus ring discreto.

Erro:

border danger;
mensagem explícita.

Não utilizar placeholder como substituto de label.

==================================================
19. FORMULÁRIOS
===============

Formulários longos devem ser divididos logicamente.

Exemplo Novo Livro:

PASSO 1
Informações

PASSO 2
Capa

PASSO 3
Confirmação

Não criar wizard para operações que possuem apenas dois ou três campos simples.

==================================================
20. CRIAÇÃO DE LIVRO
====================

Tela inicial:

Criar novo livro

Passo 1 de 3

Informações

Título

Descrição

Faixa etária:
de [3] até [5]

Idioma

Categoria opcional

[Cancelar] [Próximo]

Passo 2:

Capa

Upload / preview.

Passo 3:

Resumo e criação.

Após criação:

redirecionar para Book Editor.

==================================================
21. BOOK EDITOR
===============

Header:

A Floresta Encantada
[StatusBadge]

Última edição

ações:

Visualizar
Salvar
Enviar para revisão

Tabs:

Informações
Páginas
Revisão
Histórico

Mostrar somente tabs funcionais na fase atual.

==================================================
22. PAGE EDITOR — FASE INICIAL
==============================

Layout:

┌────────────────────────────────────────────────┐
│ Lista páginas │ Conteúdo       │ Preview       │
│               │                │               │
│ Página 1      │ Texto          │ Ilustração    │
│ Página 2      │ Narração       │               │
│ Página 3      │                │               │
└────────────────────────────────────────────────┘

A lista de páginas deve permitir futuramente:

* drag and drop;
* thumbnail;
* título;
* número;
* menu contextual.

Não implementar drag-and-drop até sua fase se não estiver no escopo.

==================================================
23. PREVIEW DE LIVRO
====================

Preview deve simular experiência de leitura sem confundir com o editor.

Utilizar:

ilustração grande;
texto abaixo ou sobre área reservada;
navegação anterior/próxima;
contador de página;
fullscreen futuramente.

O Preview deve ser reutilizável posteriormente para validar livros antes da publicação.

==================================================
24. CHARACTER IMPORT
====================

Fluxo visual futuro:

Adicionar personagem

1 Importar
2 Configurar
3 Confirmar

Área drag-and-drop.

Preview grande.

Lista de assets/poses.

Campos:

Nome
Descrição
Categoria

Futuramente:

rig
parts
anchors
pivots.

==================================================
25. EDITORES AVANÇADOS
======================

Quando chegarmos ao:

Character Editor
Animation Playground
Scene Editor
Timeline

manter a mesma identidade visual, mas mudar a densidade.

Essas ferramentas precisam privilegiar espaço de trabalho.

Layout conceitual:

┌─────────────────────────────────────────────────────┐
│ toolbar                                             │
├────────────┬─────────────────────────────┬──────────┤
│ Assets     │                             │ Inspector│
│            │          CANVAS             │          │
│            │                             │          │
├────────────┴─────────────────────────────┴──────────┤
│ TIMELINE                                            │
└─────────────────────────────────────────────────────┘

NÃO colocar grandes banners/ilustrações decorativas aqui.

==================================================
26. SCENE EDITOR
================

Planejar visualmente:

ESQUERDA:
assets/elementos.

CENTRO:
canvas.

DIREITA:
Inspector.

INFERIOR:
timeline.

Toolbar superior:

Select
Move
Scale
Rotate
Anchor
Preview

Não implementar ferramentas antes das respectivas fases.

==================================================
27. INSPECTOR
=============

Inspector futuro deverá agrupar propriedades.

Exemplo:

TRANSFORM

X
Y

Scale X
Scale Y

Rotation

Opacity

LAYER

z-index

Visible

ANCHORS

...

Não exibir 30 propriedades simultaneamente.

Utilizar seções recolhíveis quando necessário.

==================================================
28. TIMELINE
============

Timeline deve utilizar fundo neutro.

Elementos:

régua temporal;
playhead;
tracks;
clips;
keyframes.

Cores podem diferenciar tipos:

personagem;
áudio;
movimento;
interação.

Mas manter contraste e legibilidade.

==================================================
29. ÍCONES
==========

Utilizar uma única biblioteca de ícones.

Preferência:

Lucide Icons.

Não misturar:

Lucide
Font Awesome
Material
SVGs aleatórios

sem necessidade.

Ícones:

16px em controles pequenos.
18–20px em navegação.
24px em ações grandes.

==================================================
30. FEEDBACK
============

Toda operação assíncrona importante deve possuir estado:

idle
loading
success
error

Exemplo:

Salvar

→ Salvando...

→ Salvo

ou:

→ Erro ao salvar

Não deixar usuário sem feedback.

==================================================
31. TOASTS
==========

Toast para:

* salvo;
* criado;
* publicado;
* upload concluído;
* erro não bloqueante.

Não utilizar toast para erros de formulário que devem aparecer junto ao campo.

==================================================
32. MODAIS
==========

Usar modal apenas quando interromper o fluxo fizer sentido.

Exemplos:

Excluir livro?
Descartar alterações?
Publicar versão?

Não transformar todos os formulários em modal.

==================================================
33. AÇÕES DESTRUTIVAS
=====================

Nunca deixar "Excluir" visualmente próximo de "Salvar" sem diferenciação.

Ações destrutivas:

vermelho;
confirmação;
texto explícito.

Exemplo:

"Excluir o livro 'A Floresta Encantada'?"

Não:

"Tem certeza?"

==================================================
34. LOADING
===========

Preferir skeleton para:

* cards;
* listas;
* previews.

Spinner para:

* operações pontuais;
* botões;
* processos pequenos.

Não bloquear a tela inteira desnecessariamente.

==================================================
35. ACESSIBILIDADE
==================

Obrigatório:

* contraste adequado;
* foco visível;
* labels;
* navegação por teclado onde aplicável;
* aria-label em controles icon-only;
* não depender exclusivamente de cor;
* áreas clicáveis adequadas.

==================================================
36. DESIGN TOKENS
=================

Centralizar tokens.

Criar algo equivalente a:

styles/
tokens.css
globals.css

ou solução arquitetural equivalente.

Tokens mínimos:

colors
spacing
radius
shadows
typography
z-index
transitions

==================================================
37. COMPONENTES BASE
====================

Criar progressivamente componentes reutilizáveis.

Não implementar todos antecipadamente.

Quando necessários:

Button
IconButton
Input
Textarea
Select
Card
Badge
StatusBadge
Tabs
Modal
Toast
Tooltip
EmptyState
Skeleton
PageHeader
Breadcrumb
Sidebar
Topbar

Não instalar uma biblioteca visual gigantesca apenas para evitar criar componentes simples.

==================================================
38. CONSISTÊNCIA
================

Antes de criar um componente visual novo:

1. verificar se já existe componente equivalente;
2. verificar tokens;
3. reutilizar variante existente;
4. somente criar novo padrão quando realmente necessário.

Evitar:

um botão diferente em cada tela;
um card diferente em cada tela;
espaçamentos arbitrários;
cores hardcoded.

==================================================
39. REGRA PARA CONTEÚDO INFANTIL
================================

A arte dos livros pode ser extremamente colorida.

A interface ao redor NÃO deve competir com ela.

Exemplo:

Scene Editor:

interface neutra
+
canvas extremamente colorido.

Isso permite que o usuário avalie corretamente a arte.

==================================================
40. DARK MODE
=============

NÃO implementar dark mode nesta fase.

A identidade aprovada é light.

No futuro, ferramentas avançadas como Scene Editor poderão avaliar um modo escuro opcional.

Não preparar uma segunda paleta inteira agora sem necessidade.

==================================================
41. ANIMAÇÕES DA INTERFACE
==========================

Microinterações permitidas:

hover 120–180ms;
menus;
tabs;
modal;
toast;
seleção.

Evitar:

bounce exagerado;
elementos flutuando;
animações decorativas constantes.

O Studio precisa parecer rápido.

==================================================
42. RESPONSIVIDADE
==================

Studio:

desktop-first.

Breakpoints aproximados:

> = 1440:
> workspace amplo.

1024–1439:
desktop/notebook.

768–1023:
funcionalidade limitada quando necessário.

< 768:
não priorizar editores complexos.

Não comprometer o Scene Editor tentando torná-lo um editor completo de celular.

==================================================
43. PRIMEIRA IMPLEMENTAÇÃO VISUAL
=================================

Na FASE 1, aplicar este Design System somente às telas realmente existentes.

Prioridade:

AppShell
Sidebar
Topbar
Books
BookCard
CreateBook
BookEditor
Pages
Workflow
Library mínima
EmptyStates
Loading/Error states

NÃO criar:

Scene Editor fake;
Timeline fake;
Character Editor fake;
Animation Playground fake.

Essas telas devem ser criadas apenas quando suas fases chegarem.

==================================================
44. TESTES VISUAIS MANUAIS
==========================

Toda tela nova deverá possuir checklist visual.

Exemplo:

BOOK LIST

[ ] alinhamento consistente
[ ] cards com mesma altura
[ ] títulos longos não quebram layout
[ ] status correto
[ ] empty state
[ ] loading
[ ] erro
[ ] hover
[ ] focus
[ ] resolução 1366x768
[ ] resolução 1920x1080

FORMULÁRIO

[ ] labels visíveis
[ ] erro por campo
[ ] keyboard navigation
[ ] loading
[ ] disabled
[ ] submit
[ ] cancelamento
[ ] texto longo
[ ] caracteres portugueses

==================================================
45. TESTES DE RESOLUÇÃO

Validar manualmente inicialmente:

1366 × 768

1440 × 900

1920 × 1080

Não considerar uma tela aprovada testando somente no monitor do desenvolvedor.

==================================================
46. REFERÊNCIA APROVADA

A referência visual fornecida contém dois conceitos.

UTILIZAR:

TEMA A — ILUSTRATIVO SUAVE.

NÃO utilizar o Tema B como padrão principal.

Extrair do Tema A:

* fundo claro;
* sidebar branca;
* índigo como cor principal;
* cards brancos;
* cores secundárias suaves;
* capas coloridas;
* ilustrações apenas em áreas adequadas;
* badges coloridos;
* bastante espaço;
* cantos arredondados;
* aparência criativa e profissional.

Não copiar cegamente:

* textos;
* personagens;
* imagens;
* quantidades;
* funcionalidades inexistentes.

A referência define DIREÇÃO VISUAL.

A especificação funcional define COMPORTAMENTO.

==================================================
47. REGRA PARA O CODEX

Ao implementar qualquer nova tela:

1. consulte este Design System;
2. consulte os componentes existentes;
3. consulte os tokens;
4. implemente;
5. execute testes automatizados aplicáveis;
6. execute lint;
7. execute build;
8. forneça checklist de QA visual;
9. NÃO avance automaticamente.

Se uma nova necessidade visual não estiver prevista aqui:

não invente silenciosamente um novo padrão.

Utilize o padrão existente mais próximo ou registre a decisão antes de introduzir uma nova convenção.

==================================================
48. RESULTADO ESPERADO

O Studio deve transmitir:

"Estou usando uma ferramenta moderna para criar histórias infantis."

E NÃO:

"Estou dentro de um aplicativo infantil."

A personalidade deve vir principalmente de:

capas;
personagens;
cenários;
pequenos detalhes de cor;
empty states;
branding.

A ferramenta em si deve continuar:

limpa;
organizada;
profissional;
rápida;
previsível.
