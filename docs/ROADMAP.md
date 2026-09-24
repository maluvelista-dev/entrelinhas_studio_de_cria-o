# Roadmap incremental

Nenhuma próxima fase começa sem aprovação explícita. Cada fase termina com relatório de mudanças, arquivos, gates, checklist manual, limitações e riscos. Uma fase com critérios pendentes não é declarada concluída.

| Fase | Entrega | Critério principal |
| --- | --- | --- |
| 0 — atual | Discovery, arquitetura e propostas documentadas | Revisão de consistência e aceite do usuário |
| 1 | Setup, Library, Book, Page, workflow inicial | Persistência real, regras testadas, UI mínima e gates verdes |
| 2 | Engine mínimo e coordenadas | Cena interpretada, transforms testados e render validado |
| 3 | Character system | Hierarquia, pivots e anchors consistentes |
| 4 | Animation Playground | DummyCharacter, inspector, debug, presets, reset e export JSON |
| 5 | Poses, keyframes e presets | Interpolação e compatibilidade verificadas |
| 6 | Scene Editor | Montar, persistir e recarregar cena sem perdas |
| 7 | Timeline | Playback, seek e cancelamento determinísticos |
| 8 | Interactions e anchors avançados | Attach/detach e targets corretos sob transforms |
| 9 | Narração e áudio | Assets e sincronização validados |
| 10 | Review e publicação | Validator completo, snapshot e troca pública atômica |
| 11 | API de distribuição | Somente publicação acessível nos endpoints públicos |
| 12 | Export de imagem/PDF | Saída coerente com mestre e fontes |
| 13 | Vídeo | Render determinístico, áudio e proporções sociais |
| Posterior | Mobile consumidor | Planejamento próprio após API estável |

## Fase 1 — plano detalhado, ainda não autorizado

### 1. Fundação e conexão

Criar repositório Git e branch `feature/project-foundation`, npm workspaces, React/Vite JavaScript, Express separado entre app e listener, ESLint, Vitest e scripts de qualidade. Fixar dependências e lockfile. Confirmar MariaDB ativo por conexão autenticada, criar bancos exclusivos de desenvolvimento/teste e usuário limitado. Adicionar `.env.example`, pool, configuração validada e healthcheck sem segredos. Escolher e documentar execução de migrations numeradas e proteção do banco de teste.

DoD: instalação reproduzível, conexão validada, configuração inválida falha claramente, teste nunca aceita banco de desenvolvimento, lint/build/test executam. Commit sugerido: `chore: configure studio and api workspaces`.

### 2. Modelo relacional e repositórios

Criar migrations para tabelas de DOMAIN.md, testar constraints reais e rollback de transações de conteúdo. Criar contratos de repositórios com driver mysql2, SQL parametrizado e tratamento de conflito. Não implementar endpoints públicos nem publicação. Commit sugerido: `feat(api): persist books and working versions`.

DoD: migration em banco limpo e reexecução controlada; nenhum órfão após falha; versão sempre pertence ao livro apontado; erro de unicidade previsível; documentação de recuperação de DDL.

### 3. Book e Page

Implementar casos de uso e endpoints internos `/api/internal/books` para criar/listar/detalhar/editar metadados, criar/editar páginas e reordenar. Aceitar revisão esperada nas mutações. Não implementar exclusão definitiva antes da política de retenção. Testar domínio antes da implementação quando aplicável. Commit sugerido: `feat(books): manage draft pages and ordering`.

DoD: persistência após reinício, slugs únicos, ordem consistente, entradas inválidas recusadas e concorrência retorna 409. Round-trip do documento preserva campos válidos.

### 4. Library e Storage mínimos

Cadastrar/listar metadados de LibraryItem e referências a assets de fixture controlados. Criar contrato Storage e adaptador filesystem testado em diretório temporário. Adiar upload visual, rigging e animações. Commit sugerido: `feat(library): add catalog and filesystem storage adapter`.

DoD: assets globais e exclusivos identificados, referências inválidas recusadas, traversal bloqueado, referência publicada não removível quando esse estado existir.

### 5. Workflow inicial

Implementar DRAFT -> REVIEW -> DRAFT com histórico transacional e ator local identificado como não autenticado. Reservar estados restantes; endpoint rejeita tentativa de publicar. Commit sugerido: `feat(workflow): track draft review transitions`.

DoD: transições inválidas não alteram conteúdo/histórico; edição em revisão exige retorno a rascunho; rollback em falha de histórico; nenhum endpoint público expõe drafts.

### 6. Studio e fechamento

UI desktop para listar/criar livros, editar metadados/texto de páginas, ordenar e solicitar/devolver revisão; catálogo mínimo da Library. Incluir estados vazio, carregamento, sucesso e erro, sem botões de funcionalidades inexistentes. Testes de componentes para formulários e tratamento de falhas relevantes. Commit sugerido: `feat(studio): add book and page management`.

DoD: checklist manual executado, testes unitários/integração/componentes pertinentes verdes, lint/build verdes, documentação atualizada e regressões registradas. Apresentar evidências e aguardar aprovação para Fase 2.

## Exclusões da Fase 1

Sem PixiJS/GSAP até o Engine, editor gráfico, importador de character packs, playback, publicação real, endpoints públicos, PDF/vídeo, mobile ou cobrança. Autenticação será planejada antes de qualquer uso remoto; o setup inicial atende desenvolvimento local.
