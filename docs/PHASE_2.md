# Fase 2 — Engine mínimo e aplicação do Tema A

Autorizada em 26/09/2026 após o usuário testar a Fase 1, informar “tudo ok” e pedir para seguir o roteiro. Durante a execução, o usuário aprovou o Design System “Ilustrativo suave” e solicitou sua aplicação às telas existentes. Implementação disponível para aceite; a Fase 3 não foi iniciada.

## Entrega

- Workspace @studio/engine independente de React, Express e MariaDB, com PixiJS 8.21.0 carregado sob demanda.
- Conversões normalizedToPixels, pixelsToNormalized, localToWorld e worldToLocal; composição de matrizes com hierarquia, rotação, escala e pivot.
- Parser estrito de cenas de validação com retângulos e elipses; rejeita versões desconhecidas, campos extras, números não finitos, IDs duplicados, parents ausentes, ciclos e transforms acumulados excessivos.
- Renderer estático com load, resize e destroy; preserva proporção, centraliza viewport, respeita zIndex, opacity e visible, e libera recursos ao sair da tela.
- Área autenticada Visualização para inspecionar uma cena real do Engine. Não é Scene Editor nem preview dos livros.
- Tema A aplicado a login, navegação, estante, formulários, páginas, revisão, Biblioteca, Acessos e visualização.
- Tokens centralizados; Inter hospedada localmente; ícones Lucide; Button, StatusBadge, BookCard, EmptyState, Skeleton e Toast reutilizáveis.
- Validação de idades associada aos campos; foco visível, estados com texto, menus responsivos e respeito a reduced-motion.
- E2E aceita portas alternativas sem interromper os servidores de desenvolvimento.

## Arquivos principais

- packages/engine/src/: coordenadas, interpretação e renderização.
- packages/engine/examples/validation-scene.js: conteúdo independente do tema da interface.
- packages/schemas/src/scene.js: contrato isolado de cena para o Engine.
- apps/studio/src/styles/tokens.css e styles.css: identidade visual.
- apps/studio/src/components/ui/, BookCard.jsx e EnginePreview.jsx: componentes e visualização.
- tests/e2e/design.spec.js e engine.spec.js: QA de telas e render real.
- DESIGN_SYSTEM.md: especificação integral fornecida pelo usuário.
- DESIGN_IMPLEMENTATION.md: decisões de aplicação e checklist visual.

## Evidências

- 21 testes de unidade/componentes/segurança aprovados em 12 arquivos, incluindo seis testes novos do Engine.
- O teste inicial de coordenadas falhou antes da implementação; depois passou com o módulo real.
- Oito cenários de integração aprovados no MariaDB 10.4.32 do XAMPP e oito no MariaDB 11.4.13 isolado. Nenhuma migration nova nesta fase.
- Quatro E2E aprovados no Edge: fluxo editorial, gestão de acessos, pixels WebGL/resize/liberação de canvas e QA desktop do Tema A.
- Lint e build aprovados. O Engine usa import dinâmico; seu código não integra o carregamento inicial dos formulários.
- Capturas revisadas de login, estante, formulário, Biblioteca, Acessos, páginas e Engine. QA desktop em 1366×768, 1440×900 e 1920×1080; regressão de largura em 390px.
- Uma regressão inicial de overflow do menu após adicionar Visualização foi detectada e corrigida; repetição dos E2E aprovada.
- Nenhum erro de página JavaScript nos cenários E2E. Aviso NO_COLOR/FORCE_COLOR pertence ao terminal do runner.

As capturas são do banco exclusivo de testes e ficam em .local, fora do Git. Inspeção de capturas não substitui o aceite humano.

## Checklist de aceite

- [ ] Conferir o Tema A em Meus livros, Novo livro, páginas, revisão, Biblioteca e Acessos.
- [ ] Conferir foco por Tab, legibilidade, campos inválidos, feedback e botões desabilitados.
- [ ] Conferir telas em 1366×768, 1440×900 e 1920×1080.
- [ ] Abrir Visualização: quadrado verde rotacionado, círculo filho, sol e chão devem aparecer.
- [ ] Redimensionar a janela: proporções e relação entre quadrado/círculo permanecem.
- [ ] Sair e voltar à Visualização: somente um canvas, sem erros de console.
- [ ] Confirmar que livros existentes continuam editáveis e persistentes conforme o perfil e status.
- [ ] Aprovar a entrega antes de iniciar Character system (Fase 3).

## Limitações e riscos

- Cena independente em memória; o contrato persistido de página continua com entities vazio. A montagem/persistência de cenas pertence à Fase 6.
- Renderer suporta formas básicas. Sprites, AssetManager com cache, character packs, anchors e animações serão introduzidos quando houver consumidores nas próximas fases; GSAP ainda não foi instalado.
- Requer WebGL no navegador; falha de inicialização apresenta mensagem, sem fingir renderização. Não há fallback Canvas2D nesta entrega.
- Limite de 500 entidades, dimensões lógicas até 4096 e componentes de matriz mundial até 1e9. Matrizes singulares não admitem worldToLocal; escala zero pode ocultar visualmente um elemento.
- O exemplo não define proporção final obrigatória dos livros. Layout lógico e política de encaixe por livro ainda devem ser validados antes do Scene Editor.
- Capas continuam representações tipográficas identificadas como “Capa não exibida”; não foram criados uploads, imagens falsas ou endpoints públicos de assets.
- Idioma/categoria, wizard de capa, narração, publicação, exclusão e edição de catálogo não foram antecipados pelo trabalho visual.
- Área escura apenas em canvas/timeline poderá ser avaliada nas Fases 4–7, mantendo o restante do Studio claro. Nenhuma segunda paleta foi implementada.
- Permissões, serializers, sessões e bancos da Fase 1 permanecem válidos; uso remoto depende da revisão de implantação já documentada.
