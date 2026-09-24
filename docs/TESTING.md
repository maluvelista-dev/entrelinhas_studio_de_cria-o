# Estratégia de testes e aceite

## Gates

A partir do setup executável: `npm test`, `npm run lint`, `npm run build` e `npm run test:integration`. Scripts raiz devem falhar se um workspace obrigatório falhar. Build cobre Studio e valida imports/sintaxe dos pacotes/API JavaScript sem exigir compilação fictícia. Testes unitários não substituem integração com MariaDB real.

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

## Casos obrigatórios da Fase 1

- Criação atômica de book/versão/ponteiro; slug duplicado; ponteiro para outro livro recusado.
- Página com posição repetida, reordenação válida e concorrente, rollback após falha intermediária.
- SchemaVersion desconhecido, faixa etária inválida, JSON malformado e round-trip Unicode.
- Transições permitidas/proibidas e histórico atômico; conflito de revisão retorna 409.
- Entrada HTTP inválida, SQL parametrizado, banco indisponível e erros sem credenciais.
- Storage dentro da raiz, nomes maliciosos, arquivo ausente, falha de escrita e compensação.
- Draft/review sem rota pública de distribuição e READY_TO_PUBLISH/PUBLISHED bloqueados.

## Checklist manual da Fase 1

- [ ] Iniciar MySQL no XAMPP e conectar aos bancos exclusivos.
- [ ] Iniciar API/Studio conforme README futuro; conferir healthcheck.
- [ ] Criar livro, recarregar e confirmar persistência e acentos.
- [ ] Editar metadados, adicionar páginas e reordenar sem perder texto.
- [ ] Abrir duas edições e conferir conflito sem perda silenciosa.
- [ ] Enviar para revisão, devolver a rascunho e conferir histórico.
- [ ] Confirmar que publicar permanece indisponível.
- [ ] Simular falha de API/banco e verificar erro compreensível.
- [ ] Conferir console e rede, navegação por teclado e regressão do CRUD.

## Registro da Fase 0

Entrega exclusivamente documental. Não existe package.json, suíte automatizada, lint configurado ou build da aplicação. Esses gates estão **não executados / não aplicáveis ao artefato atual**, e não aprovados. O desvio das regras gerais está explícito em ADR-005; a aceitação desta entrega documental cabe ao usuário.

Verificações desta entrega: leitura integral da especificação, inspeção de ambiente sem mutações de banco, existência dos documentos, links locais e consistência da escolha MariaDB. Não houve conexão autenticada ou validação de migrations.

Checklist de aceite documental:

- [ ] Usuário valida banco do XAMPP, limites dos módulos e proposta de versões.
- [ ] Usuário revisa dúvidas e riscos de DECISIONS.md.
- [ ] Usuário aceita escopo e critérios da Fase 1.
- [ ] Usuário autoriza explicitamente a próxima fase.

Fase 0 aguarda aceite; nenhuma fase posterior está autorizada.
