# Estado do projeto — 09/10/2026

Este relatório descreve o código entregue e as etapas ainda pendentes. A validação automatizada não substitui o aceite manual do usuário previsto no roteiro.

| Área | Estado atual |
| --- | --- |
| Autenticação e autorização | Sessões HttpOnly; ADMIN, EDITOR e REVIEWER; validação de origem, permissões, parâmetros e serializers explícitos. |
| Livros independentes | Cadastro, busca, listagem e edição; controle de revisão concorrente. |
| Páginas | Criação, edição de texto e ordenação; aba Arte das páginas com importação direta e prévia; composição visual versionada e snapshots de personagens/objetos. |
| Biblioteca | Personagens, cenários e objetos separados; consulta e edição de nome, descrição e imagem. |
| Ilustrações | Upload PNG/WebP normalizado, armazenamento privado; limites de 10 MiB e 4096 × 4096. |
| Estrutura de personagens | Cadastro guiado: perspectivas → imagens e partes → articulação opcional → poses e ações. PNG inteiro funciona sem recortes; upload direto por perspectiva/parte, nomes amigáveis e prévias. Hierarquia, pivôs e anchors disponíveis na etapa própria. |
| Personagem completo | Importação/exportação em `.character.json`, com imagens, estrutura e poses/animações compatíveis; não é ZIP. |
| Poses e animações | Biblioteca reutilizável, editor de keyframes, aplicação aos personagens e prévia. Compatibilidade por perspectiva, partes, hierarquia e pivôs. |
| Inserção nas páginas | Personagens, cenários e objetos; posição/escala/rotação numéricas, pose e animação por personagem. |
| Movimento/interação anterior | moveTo, grab, carry, release e tap, incluindo posse de objeto e anchors animados. |
| Catálogo integral solicitado | Implementados os 114 identificadores de ações e 14 gestos/atividades. Inclui capacidades por personagem/perspectiva, poses/animações/imagens alternativas, execução no Engine, autoria na página, validação e persistência. Ações corporais exigem os recursos preparados pelo autor. Aceite manual pendente. |
| Prévia | Canvas PixiJS/WebGL, reprodução, pausa, busca temporal e reset. Não é ainda um leitor publicado. |
| Montagem de cenas | Parcial: composição numérica e sequência de ações. Arraste visual completo, ferramentas de seleção/camadas e timeline multipista ainda pendentes. |
| Texto | Texto simples por página. |
| Narração e áudio | Metadados na Biblioteca; upload, reprodução e sincronização ainda pendentes. |
| Revisão editorial | Rascunho ↔ Em revisão e histórico; regras de edição aplicadas no servidor. |
| Publicação | Estados finais, validador de publicação e publicação ainda pendentes. |
| API | API interna autenticada. API pública de livros publicados ainda pendente. |
| Exportações | Pacote do personagem disponível. Página como imagem, PDF e vídeo ainda pendentes. |
| Layout | Studio claro baseado no Tema A. Área escura para edição de animação pode ser avaliada nas fases previstas. |
| Banco | MariaDB local fornecido pelo serviço chamado “MySQL” do XAMPP. Alvo de produção: MariaDB 11.4 LTS; instância isolada 11.4.13 para validação. MySQL 8 não é equivalente nem alvo suportado. |

## Validação

Validação desta entrega: 172 testes unitários/componentes; 15 cenários de integração em cada MariaDB (10.4.32 e 11.4.13); 12 cenários de navegador (execução geral e repetição dos cenários ajustados); lint e build. O navegador cobre PNG inteiro pequeno salvo/reaberto sem articulação, regressão do produto, autoria de capacidade/imagem alternativa, salto, atividade, hold por teclado, trace por mouse e assemble com encaixe/reset. As ações possuem testes parametrizados de execução/replay e verificações específicas por família; expressões/gestos dependem da qualidade dos recursos criados pelo autor.

Não houve publicação em produção nem alteração de livros para inserir dados fictícios. Os testes de banco usam exclusivamente `book_studio_test` com verificações de isolamento. Migrations já aplicadas não são editadas.

## Arquivos principais

- `packages/schemas/src/action-catalog.js`, `actions.js`, `character.js`: inventário, parâmetros tipados e capacidades.
- `packages/engine/src/interaction.js`, `input-controller.js`, `renderer.js`, `scene-player.js`: movimentos, vínculos, atividades e apresentação.
- `apps/studio/src/components/BehaviorBindings.jsx`, `CatalogActionsEditor.jsx`, `InputRulesEditor.jsx`: autoria visual.
- Testes em `packages/engine/src`, `tests/integration/api.test.js` e `tests/e2e/catalog.spec.js`.
- [Guia e checklist de aceite manual](ACTION_CATALOG_GUIDE.md).

## Limitações materiais

Uma sequência e uma regra de entrada por página. Movimentos corporais são preparados por personagem; não há inferência de anatomia. Contato e trajetórias são narrativos, sem colisão/IK. Páginas preservam a versão do personagem até atualização explícita. Não há armazenamento de progresso infantil. O datadir existente recusou escrita nesta sessão; a validação utilizou datadirs descartáveis com os mesmos binários MariaDB, sem alterar os dados dos livros ou arquivos .env.

As alterações desta entrega permanecem no workspace, sem commit: a autorização para gravar o índice Git foi recusada. A alteração preexistente em `packages/schemas/src/index.js` foi preservada.

## Correção de arte e keyframes

Entrega e roteiro de verificação em [Arte das páginas e keyframes](PAGE_ART_AND_KEYFRAMES.md). Salvar estrutura preserva os keyframes ainda em rascunho. Prévia passa a distinguir falhas de imagem, WebGL e animação, com nova tentativa.
