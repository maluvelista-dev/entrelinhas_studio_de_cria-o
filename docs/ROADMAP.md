# Roadmap incremental

Nenhuma próxima fase começa sem aprovação explícita. Cada fase termina com relatório de mudanças, arquivos, gates, checklist manual, limitações e riscos. Uma fase com critérios pendentes não é declarada concluída.

| Fase | Entrega | Critério principal |
| --- | --- | --- |
| 0 — aprovada | Discovery, arquitetura e propostas documentadas | Revisão de consistência e aceite do usuário |
| 1 — aprovada | Setup, Library, Book, Page, workflow inicial | Persistência real, regras testadas, UI mínima e gates verdes |
| 2 — em aceite | Engine mínimo e coordenadas | Cena interpretada, transforms testados e render validado |
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

## Fase 1 — autorizada em 24/09/2026

Entrega aceita pelo usuário após testes manuais em 26/09/2026. O plano abaixo registra os critérios aprovados; resultados e checklist estão em [PHASE_1.md](PHASE_1.md).

### 1. Fundação e conexão

Utilizar o repositório Git e a branch `feature/project-foundation` criados na Fase 0; configurar npm workspaces, React/Vite JavaScript, Express separado entre app e listener, ESLint, Vitest e scripts de qualidade. Fixar dependências e lockfile. Confirmar MariaDB local (serviço “MySQL” do XAMPP) ativo por conexão autenticada, criar bancos exclusivos de desenvolvimento/teste e usuário limitado. Adicionar `.env.example`, pool, configuração validada e healthcheck sem segredos. Escolher e documentar execução de migrations numeradas e proteção do banco de teste. Definir versão mantida de MariaDB para produção e instância isolada equivalente para validar migrations; MySQL 8 não é equivalente. Adotar a política enxuta de lint de TESTING.md.

DoD: instalação reproduzível, conexão validada, configuração inválida falha claramente, teste nunca aceita banco de desenvolvimento, lint/build/test executam. Commit sugerido: `chore: configure studio and api workspaces`.

### 2. Modelo relacional e repositórios

Criar migrations para tabelas de DOMAIN.md, testar constraints reais e rollback de transações de conteúdo. Criar contratos de repositórios com driver mysql2, SQL parametrizado e tratamento de conflito. Não implementar endpoints públicos nem publicação. Commit sugerido: `feat(api): persist books and working versions`.

DoD: migrations em banco limpo, atualização da versão anterior e reexecução controlada validadas tanto no MariaDB local quanto no alvo isolado de produção em versão mantida, com versões e resultados registrados; nenhum órfão após falha; versão sempre pertence ao livro apontado; erro de unicidade previsível; documentação de recuperação de DDL.

### 3. Book e Page

Implementar casos de uso e endpoints internos `/api/internal/books` para criar/listar/detalhar/editar metadados, criar/editar páginas e reordenar. Aceitar revisão esperada nas mutações. Não implementar exclusão definitiva antes da política de retenção. Testar domínio antes da implementação quando aplicável. Commit sugerido: `feat(books): manage draft pages and ordering`.

DoD: persistência após reinício, slugs únicos, ordem consistente, entradas inválidas recusadas e concorrência retorna 409. Round-trip do documento preserva campos válidos.

### 4. Library e Storage mínimos

Cadastrar/listar metadados de LibraryItem e referências a assets de fixture controlados. Criar contrato Storage e adaptador filesystem testado em diretório temporário. Adiar upload visual, rigging e animações. Commit sugerido: `feat(library): add catalog and filesystem storage adapter`.

DoD: assets globais e exclusivos identificados, referências inválidas recusadas, traversal bloqueado, referência publicada não removível quando esse estado existir.

### 5. Workflow inicial

Implementar DRAFT -> REVIEW -> DRAFT com histórico transacional e ator autenticado, conforme ampliação de segurança solicitada em 26/09/2026. Reservar estados restantes; endpoint rejeita tentativa de publicar. Commit sugerido: `feat(workflow): track draft review transitions`.

DoD: transições inválidas não alteram conteúdo/histórico; edição em revisão exige retorno a rascunho; rollback em falha de histórico; nenhum endpoint público expõe drafts.

### 6. Studio e fechamento

UI desktop para listar/criar livros, editar metadados/texto de páginas, ordenar e solicitar/devolver revisão; catálogo mínimo da Library. Incluir estados vazio, carregamento, sucesso e erro, sem botões de funcionalidades inexistentes. Testes de componentes para formulários e tratamento de falhas relevantes. Commit sugerido: `feat(studio): add book and page management`.

DoD: checklist manual executado, testes unitários/integração/componentes pertinentes verdes, lint/build verdes, documentação atualizada e regressões registradas. Apresentar evidências e aguardar aprovação para Fase 2.

## Exclusões da Fase 1

Sem PixiJS/GSAP até o Engine, editor gráfico, importador de character packs, playback, publicação real, endpoints públicos, PDF/vídeo, mobile ou cobrança. Autenticação, perfis e serializers foram incluídos por solicitação explícita do usuário nesta fase. Uso remoto continua dependendo de revisão de implantação.

## Fase 2 — autorizada em 26/09/2026

Engine mínimo, coordenadas e visualização implementados, com Tema A aplicado por solicitação adicional do usuário. Evidências, limites e checklist em [PHASE_2.md](PHASE_2.md). Design System obrigatório em [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), aplicação em [DESIGN_IMPLEMENTATION.md](DESIGN_IMPLEMENTATION.md). Fase 3 depende do aceite desta entrega e autorização.
