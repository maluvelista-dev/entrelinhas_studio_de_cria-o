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
- Draft/review sem rota pública de distribuição e READY_TO_PUBLISH/PUBLISHED bloqueados.

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

## Registro histórico da Fase 0

Entrega exclusivamente documental. Não existe package.json, suíte automatizada, lint configurado ou build da aplicação. Esses gates estão **não executados / não aplicáveis ao artefato atual**, e não aprovados. O desvio das regras gerais está explícito em ADR-005; a aceitação desta entrega documental cabe ao usuário.

Verificações desta entrega: leitura integral da especificação, inspeção de ambiente sem mutações de banco, existência dos documentos, links locais e consistência da escolha MariaDB. Não houve conexão autenticada ou validação de migrations.

Checklist de aceite documental:

- [ ] Usuário valida MariaDB local e alvo de produção, limites dos módulos e proposta de versões.
- [ ] Usuário revisa dúvidas e riscos de DECISIONS.md.
- [ ] Usuário aceita escopo e critérios da Fase 1.
- [ ] Usuário autoriza explicitamente a próxima fase.

Fase 0 aprovada pelo usuário em 24/09/2026; Fase 1 autorizada na mesma sessão. Os itens acima registram o processo documental original. Fase 2 continua sem autorização.

## Segurança adicionada à Fase 1

Consultar SECURITY.md. Gates incluem permissões por perfil, parâmetros estritos, serialização aninhada sem campos sensíveis, sessões expiradas/revogadas, Origin, cookies, hash de senha e limiter de login. O teste de servidor Vite usa sentinela sintética para verificar bloqueio de arquivos privados. A migration 003 é validada nos dois MariaDB. O E2E usa credenciais aleatórias de teste e cobre administrador/revisor.
