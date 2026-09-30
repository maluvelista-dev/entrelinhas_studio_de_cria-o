# Fase 3 — Character system

Autorizada em 26/09/2026 pelo pedido “siga a fase 3 e todas outras seguindo esse modelo de layout”. Tema A permanece obrigatório. Implementação disponível para aceite; Fase 4 não iniciada.

## Implementado

- Manifesto estrito com perspectivas, partes, hierarquia, pivôs e anchors.
- Instâncias independentes, transforms acumulados e referências instanceId.anchorName.
- Grupos e sprites no renderer, preservando as formas da Fase 2.
- AssetManager com cache por visualização, deduplicação, retry e descarte durante carregamento.
- Adaptador de PNG/WebP cadastrados; o manifesto não especifica URLs.
- Visualização → Personagem: frente/lateral, original/espelhado, braço rotacionado, marcadores e tabela de posições.
- Tema A com tokens existentes, abas, canvas neutro e lista de partes.

## Arquivos principais

- packages/schemas/src/character.js e scene.js.
- packages/engine/src/character.js, asset-manager.js, image-loader.js e renderer.js.
- packages/engine/examples/validation-character.js.
- apps/studio/src/components/CharacterPreview.jsx e EnginePreview.jsx; estilos em styles.css.
- tests/e2e/character.spec.js e testes unitários dos módulos.
- [CHARACTER_FORMAT.md](CHARACTER_FORMAT.md): contrato e limites.

## Validação

- 27 testes unitários/componentes/segurança aprovados em 14 arquivos, incluindo quatro casos de personagem e dois de cache/ciclo de vida.
- O teste de domínio foi criado antes do módulo e falhou inicialmente por ausência de implementação.
- Oito cenários de integração aprovados no MariaDB 10.4.32 do XAMPP e oito no MariaDB 11.4.13 isolado; nenhuma migration nova.
- Quatro E2E de regressão passaram. O novo E2E de personagem passou após corrigir a fixture PNG e o seletor de perspectiva: pixels reais do sprite, posições de anchors, troca de perspectiva, debug, resize e desmontagem.
- Lint e build aprovados. Sem nova dependência instalada.
- Capturas desktop em 1366×768, 1440×900 e 1920×1080; regressão de largura em 390px. Capturas de QA ficam em .local, fora do Git.
- PNG inicial das mãos era preto e impedia aplicar a tonalidade esperada; substituído por PNG branco mínimo. Não houve alteração de arte do usuário.
- Nenhum erro JavaScript de página no cenário final de personagem.

Inspeção automatizada e visual de capturas não substitui aceite humano.

## Checklist manual

- [ ] Abrir Visualização → Personagem e conferir as duas figuras completas.
- [ ] Confirmar espelhamento e braço/mão rotacionados da figura direita, preservando cabeça/pernas.
- [ ] Alternar Frente/Lateral; deve existir somente um canvas.
- [ ] Alternar Mostrar pivôs e anchors; quadrados/círculos acompanham as partes.
- [ ] Expandir Coordenadas dos anchors e conferir referências e números finitos.
- [ ] Redimensionar a janela; proporções e alinhamento permanecem.
- [ ] Alternar Coordenadas/Personagem e sair/voltar à Visualização, sem duplicação ou erro de console.
- [ ] Conferir o Tema A nas três resoluções desktop e navegação por teclado.
- [ ] Confirmar livros, Biblioteca e permissões anteriores.
- [ ] Aprovar antes da Fase 4 — Animation Playground.

## Limitações e riscos

- A ampliação autorizada em 30/09/2026 adicionou o editor e a persistência de rigs na Biblioteca: [CHARACTER_EDITOR.md](CHARACTER_EDITOR.md). Packs e persistência de cenas de página continuam fora do escopo.
- Inspector de partes/pivôs/anchors disponível na ampliação. Animação, interpolação, export JSON pela UI, timeline e interações permanecem nas suas fases.
- Fixture geométrica com PNG mínimo, sem arte final.
- WebGL obrigatório; falhas de imagem/render apresentam erro, sem fallback silencioso.
- Cache com escopo de visualização; uma futura cena com muitos personagens deverá compartilhar um manager por cena. Sem cache offline.
- Até 128 partes/128 anchors por perspectiva, oito perspectivas e limites globais da Fase 2.
- Preferências de perspectiva/debug reiniciam ao sair da tela.
- Não há dark mode. Canvas/timeline escuros poderão ser avaliados nas Fases 4–7.
