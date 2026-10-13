# Estratégia de testes e aceite

## Gates

A partir do setup executável: `npm test`, `npm run lint`, `npm run build` e `npm run test:integration`. Scripts raiz devem falhar se um workspace obrigatório falhar. Build cobre Studio e valida imports/sintaxe dos pacotes/API JavaScript sem exigir compilação fictícia. Testes unitários não substituem integração com MariaDB real.

## Política de lint

Configuração enxuta, focada em erros prováveis de JavaScript e uso correto de React/Hooks. Evitar regras cosméticas e limites arbitrários de tamanho ou complexidade sem necessidade demonstrada. Lint não define funcionalidades nem substitui testes de comportamento.

O servidor de desenvolvimento não depende de lint aprovado a cada edição. Executar lint durante o trabalho e exigir ausência de erros no fechamento da fase. Avisos devem ser revisados, sem transformar todo aviso em bloqueio automaticamente. Ajustar regras com justificativa em caso de falso positivo ou necessidade técnica; exceções pontuais devem indicar regra e motivo, sem desativar a análise globalmente.

## Camadas

| Camada | Ferramenta proposta | Cobertura significativa |
| --- | --- | --- |
| Unidade | Vitest | Schemas, workflow, serialização; depois coordenadas, anchors e registries |
| Integração | Vitest + mysql2 + MariaDB real | Constraints, migrations, transações, concorrência, JSON e reordenação |
| HTTP | Supertest | Contratos, códigos de erro, validação e integração com casos de uso |
| Componente | Testing Library quando necessário | Formulários, estados de erro e interação acessível |
| E2E futuro | Playwright | Produzir/revisar/publicar/consumir quando fluxo existir |
| Visual manual | Navegador | Render, pivots, anchors, animações e ausência de erros de console |

TDD para lógica quando aplicável: teste demonstrando a regra, implementação mínima, refatoração. Não criar testes que apenas reproduzam detalhes internos da implementação. Fixtures pequenas, sem binários desnecessários versionados.

## Banco e isolamento

Banco exclusivo `book_studio_test`, usuário e configuração próprios; runner verifica nome permitido e recusa outros bancos antes de operações destrutivas. Nunca limpar bancos do XAMPP por varredura. Inicialmente serializar testes de integração; usar transações por teste quando possível e fixtures explícitas para cenários com múltiplas conexões. SQLite não substitui MariaDB. Testar migrations desde zero e a partir da versão anterior; DDL exige estratégia de recuperação própria.

Executar a mesma suíte de migrations no MariaDB local, fornecido pelo serviço “MySQL” do XAMPP, e em instância isolada da versão mantida de MariaDB escolhida para produção. Registrar `SELECT VERSION()`, configuração relevante (como sql_mode e collation), migrations executadas e resultados de cada ambiente. MySQL 8 não substitui nenhum desses alvos. Sem acesso ao alvo de teste de produção, o gate permanece pendente. Não executar testes destrutivos na base real de produção.

## Casos obrigatórios da Fase 1

- Criação atômica de book/versão/ponteiro; slug duplicado; ponteiro para outro livro recusado.
- Página com posição repetida, reordenação válida e concorrente, rollback após falha intermediária.
- SchemaVersion desconhecido, faixa etária inválida, JSON malformado e round-trip Unicode.
- Transições permitidas/proibidas e histórico atômico; conflito de revisão retorna 409.
- Entrada HTTP inválida, SQL parametrizado, banco indisponível e erros sem credenciais.
- Storage dentro da raiz, nomes maliciosos, arquivo ausente, falha de escrita e compensação.
- Draft/review/ready sem rota pública de distribuição; aprovação por perfil autorizado e PUBLISHED bloqueado até a Fase 10.

## Checklist manual da Fase 1

- [ ] Iniciar MariaDB pelo serviço “MySQL” do XAMPP e conectar aos bancos exclusivos.
- [ ] Conferir evidências de migrations no MariaDB local e no alvo isolado de produção em versão mantida.
- [ ] Iniciar API/Studio conforme README futuro; conferir healthcheck.
- [ ] Criar livro, recarregar e confirmar persistência e acentos.
- [ ] Editar metadados, adicionar páginas e reordenar sem perder texto.
- [ ] Abrir duas edições e conferir conflito sem perda silenciosa.
- [ ] Enviar para revisão, devolver a rascunho e conferir histórico.
- [ ] Confirmar que publicar permanece indisponível.
- [ ] Simular falha de API/banco e verificar erro compreensível.
- [ ] Conferir console e rede, navegação por teclado e regressão do CRUD.

## Resultados da Fase 1

Implementação, resultados e checklist de aceite em [PHASE_1.md](PHASE_1.md); evidências dos dois MariaDB em [DATABASE.md](DATABASE.md). A suíte E2E usa build estático para evitar recarregamentos de desenvolvimento. Nenhum teste usa o banco de desenvolvimento.

## Fechamento vigente da Fase 0

Resultados e instruções reproduzíveis em [PHASE_0.md](PHASE_0.md). O registro abaixo descreve somente a entrega documental original; não representa o estado executável atual.

## Registro histórico da Fase 0

Entrega exclusivamente documental. Não existe package.json, suíte automatizada, lint configurado ou build da aplicação. Esses gates estão **não executados / não aplicáveis ao artefato atual**, e não aprovados. O desvio das regras gerais está explícito em ADR-005; a aceitação desta entrega documental cabe ao usuário.

Verificações desta entrega: leitura integral da especificação, inspeção de ambiente sem mutações de banco, existência dos documentos, links locais e consistência da escolha MariaDB. Não houve conexão autenticada ou validação de migrations.

Checklist de aceite documental:

- [ ] Usuário valida MariaDB local e alvo de produção, limites dos módulos e proposta de versões.
- [ ] Usuário revisa dúvidas e riscos de DECISIONS.md.
- [ ] Usuário aceita escopo e critérios da Fase 1.
- [ ] Usuário autoriza explicitamente a próxima fase.

Fase 0 aprovada pelo usuário em 24/09/2026; Fase 1 autorizada na mesma sessão. Os itens acima registram o processo documental original. Fase 2 foi posteriormente autorizada em 26/09/2026; consulte PHASE_2.md.

## Segurança adicionada à Fase 1

Consultar SECURITY.md. Gates incluem permissões por perfil, parâmetros estritos, serialização aninhada sem campos sensíveis, sessões expiradas/revogadas, Origin, cookies, hash de senha e limiter de login. O teste de servidor Vite usa sentinela sintética para verificar bloqueio de arquivos privados. A migration 003 é validada nos dois MariaDB. O E2E usa credenciais aleatórias de teste e cobre administrador/revisor.

## Fase 2 e Tema A

Resultados em [PHASE_2.md](PHASE_2.md). Testes puros cobrem coordenadas, hierarquia e parsing. E2E verifica pixels WebGL reais, resize, liberação de canvas e telas nas três resoluções desktop. O teste visual usa dados exclusivos de teste.

Para manter o Studio de desenvolvimento aberto durante E2E, use em PowerShell:

```powershell
$env:E2E_API_PORT = "3100"
$env:E2E_STUDIO_PORT = "5273"
npm.cmd run test:e2e
```

Esses servidores continuam exclusivos, com reuseExistingServer=false e credenciais de .env.test. As variáveis mudam somente as portas do E2E; não mudam o banco permitido. Integração local e E2E não devem executar simultaneamente porque compartilham o banco de testes.

## Fase 3

Resultados em [PHASE_3.md](PHASE_3.md). Testes puros cobrem hierarquia, pivôs, rotação, espelhamento, anchors local/normalized, erro de referência/asset e round-trip. Cache verifica concorrência, retry e descarte durante carregamento. O novo E2E lê pixels reais de sprite e verifica posições conhecidas de anchors, troca de perspectivas e desmontagem. Capturas nas três resoluções desktop; regressão em 390px. Não alterar banco de desenvolvimento para gerar esses dados.

## Pacotes, modelos e páginas — 03/10/2026

33 testes unitários/componentes e 13 integrações aprovados em cada MariaDB (10.4.32 e alvo isolado 11.4.13); lint e build aprovados. Integração cobre pacote com imagens, novos IDs, modelos globais reutilizados entre livros, snapshot imutável, texto preservando cena, referências inválidas, rollback e permissões. O teste do Engine começou vermelho por módulo ausente, passou com captura/aplicação e GSAP; os casos adicionais recusam targets ausentes, tempos inválidos, easing não permitido e escala cruzando zero.

O cenário E2E de pacotes/movimentos verifica captura de poses/keyframes, mudança real no canvas, download/importação, montagem da página, reload, edição de texto sem perda e responsividade. Durante a validação foi corrigido um callback de resize após desmontagem; navegação e carregamento assíncrono dos selects são aguardados explicitamente no teste. Os oito cenários anteriores de regressão passaram. O novo cenário foi repetido após as correções, junto aos cenários afetados de editor/layout. Capturas locais: .local/qa-motion.png e .local/qa-page-scene.png.

No Windows, após os workers terminarem, o teardown do Playwright pode reter os processos dos servidores criados por ele. Nesta execução foi necessário encerrar somente os PIDs desses servidores de teste para obter o resumo final; processos de desenvolvimento foram preservados. Os avisos NO_COLOR/FORCE_COLOR são do runner, sem erro de console da aplicação no cenário aprovado.

## Primeiro incremento de movimentos/interações

Evidências, correções de toque e pendência da execução E2E conjunta registradas em [MOVEMENTS_AND_INTERACTIONS.md](MOVEMENTS_AND_INTERACTIONS.md#evidências-e-fechamento). Em 07/10/2026, 37 testes unitários/componentes, lint e build aprovados. Sessão E2E do novo cenário usa o serviço real de autenticação com assertTestDatabase, sem consumir a cota de login HTTP dos demais cenários; o limiter da aplicação não foi alterado.

## Catálogo de movimentos e atividades — 08/10/2026

172 testes unitários/componentes incluem o inventário executável, replay/reset, curvas, contatos, posse/transferência, efeitos, orientação, seed, conflitos, limites intermediários e reconhecimento das 14 atividades. Integração: 15 cenários em cada MariaDB, incluindo capacidades e variantes nos pacotes/snapshots e validação dos gatilhos. Navegador: 11 cenários, com autoria do catálogo, imagem alternativa, teclado, traçado e montagem.

Nesta sessão, por falha de acesso ao ibdata1 dos datadirs existentes, a integração usou instâncias descartáveis equivalentes nas portas 3316 (local) e 3317 (alvo de produção). Sobrescrita de DB_PORT apenas no processo; arquivos .env preservados. E2E usou API 3107 e Studio 5280. Nunca executar integração local e E2E simultaneamente no mesmo banco de teste.

## Cadastro guiado de personagens — 09/10/2026

Validação de PNG inteiro pequeno: upload inferior a 3 KiB, ajuste da área às dimensões da imagem, persistência com uma única parte e nenhum anchor, reabertura com prévia. As verificações de navegador foram adaptadas às etapas e aos painéis recolhidos, mantendo as verificações de geometria, permissões, transferência de pacotes e animação. Capturas: `.local/qa-character-perspectives.png` e `.local/qa-character-whole.png`.

Resultado final: 172 testes unitários/componentes, 15 integrações em cada MariaDB, lint e build aprovados. Os 12 cenários E2E passaram ao longo da execução geral e das repetições direcionadas: inicialmente 10/12, depois correção de seletor renomeado e abertura condicional do painel de transformações; editor/permissões/PNG e, por último, o cenário de articulação passaram. Não houve relaxamento das asserções de geometria ou acesso.

## Arte das páginas e correção de keyframes — 09/10/2026

177 testes unitários/componentes aprovados. Casos novos verificam preservação de texto/arte ao alternar abas, mensagens distintas de imagem/WebGL/animação, liberação de recursos após falha, nova tentativa e edição de quadro originado de preset. Lint e build aprovados.

No Opera instalado, em perfil isolado, passaram os cenários de catálogo, interações, captura/salvamento de keyframes e importação da arte por página. O teste de animação verifica que Salvar estrutura não remove os quadros e lê pixels da prévia. Houve uma espera de imagem superior ao timeout padrão de 5s em execução conjunta; a espera de prontidão passou a admitir 15s e o cenário foi repetido com sucesso, mantendo a verificação de pixels. O cenário de arte verifica persistência, texto, reload e independência entre páginas. O cadastro real da Luma não foi usado nesses testes.

Para executar com outro Chromium instalado, defina `PLAYWRIGHT_EXECUTABLE_PATH` com o caminho do executável. O padrão continua Edge. As sessões são temporárias; não apontar para um perfil pessoal.

Regressão final no Edge: cinco cenários aprovados (layout em três resoluções, edição do livro, permissões de revisão, ciclo de vida do Engine e articulação). Total desta correção: 177 testes unitários/componentes e nove cenários de navegador, entre Opera e Edge; lint e build aprovados.
