# Arquitetura proposta — Fase 0

## Princípios e limites

O Studio cria; o Engine executa; Publishing valida e congela versões; a API distribui. O mestre é conteúdo estruturado mais assets. PNG, PDF e vídeo são derivados. Uma única versão mestre oferece animações automáticas e interações premium, sem duplicar livros por plano.

Monólito modular com npm workspaces e JavaScript ESM. Sem microserviços, fila, ORM ou contêiner obrigatório inicialmente. Os diretórios abaixo são o destino arquitetural; serão criados quando necessários, sem módulos vazios fingindo funcionalidades.

```text
apps/
  studio/src/                 React, interface e estado do editor
  api/src/
    http/                    Express, rotas, validação de entrada
    modules/
      library/               domínio, serviços e repositórios
      books/                 livros, páginas e workflow
      publishing/            validação e snapshots (Fase 10)
    infrastructure/
      database/              pool mysql2, repositórios SQL
      storage/               contrato e adaptador filesystem
  api/migrations/            migrations SQL ordenadas
packages/
  engine/src/                PixiJS, GSAP e interpretação de cenas
  schemas/src/               contratos versionados, sem I/O
  shared/src/                somente funções puras compartilhadas
storage/
  characters/ objects/ backgrounds/ audio/ books/ exports/
docs/
tests/integration/
```

| Limite | Responsabilidade | Dependências permitidas |
| --- | --- | --- |
| Studio | Formulários, seleção, histórico do editor, comandos | Schemas, shared, API HTTP e fachada do Engine |
| Engine | Render, cache de assets, anchors, timeline e animações | Schemas/shared, PixiJS, GSAP; nunca React, SQL ou Express |
| API | Casos de uso, autorização, persistência e HTTP | Domínio, schemas, repositórios e contrato de storage |
| Storage | Escrita, leitura, existência e remoção por chave lógica | Filesystem inicialmente; sem regras editoriais |
| Publishing | Validação, snapshot imutável e ponteiro público | Domínio, repositórios e verificação de assets |

React nunca anima frame a frame. GSAP somente dentro do Engine. Dados não executam código: ações explicitamente registradas; proibidos `eval` e `new Function`. Schemas não importam aplicações. API não importa o renderizador para validar formatos.

## Desenvolvimento com XAMPP

O banco da aplicação é **MariaDB**, fornecido localmente pelo serviço **“MySQL”** do XAMPP. O binário encontrado é MariaDB 10.4.32. MySQL 8 e MariaDB não são equivalentes; MySQL 8 não é alvo da aplicação. A API Node conecta via `mysql2/promise` (nome do driver, não do banco adotado); PHP não participa do backend. Apache é opcional para administrar o banco com phpMyAdmin. Vite e Express executam como processos Node, fora de `htdocs`.

Portas propostas: Studio `127.0.0.1:5173`, API `127.0.0.1:3000`, banco `127.0.0.1:3306`. Vite encaminha `/api` para Express. Validar ocupação das portas antes do setup.

Na Fase 1: confirmar conexão e `SELECT VERSION()`, criar banco exclusivo `book_studio`, banco separado `book_studio_test` e usuário de aplicação com privilégios limitados. Não reutilizar tabelas de outros projetos nem assumir usuário root sem senha. Configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `STORAGE_ROOT` em `.env` ignorado pelo Git. Credenciais nunca usam prefixo `VITE_`. `.env.example` conterá apenas placeholders.

## VPS

Linux com reverse proxy e TLS, build estático do Studio, processo Node supervisionado, MariaDB em rede privada e filesystem persistente. Produção deverá utilizar MariaDB em versão mantida. Validar migrations e testes de integração tanto no MariaDB local quanto em instância isolada com a versão e configuração relevantes do MariaDB alvo de produção. Registrar versões e resultados: aprovação apenas local não satisfaz esse gate. Não instalar o pacote XAMPP na VPS como estratégia de produção. Autenticação e autorização internas precisam existir antes de acesso remoto da equipe; a Fase 1 permanece local até essa decisão.

## Storage e publicação

Chaves relativas independentes do sistema operacional, sem caminhos Windows nos documentos. Contrato proposto: `put`, `openRead`, `exists`, `delete`, com metadados retornados. Adaptador limita operações à raiz configurada, recusa traversal e define política para symlinks. Uploads futuros terão limites de tamanho e validação de conteúdo.

Assets são imutáveis por chave: substituição cria nova identidade. Rascunhos ficam em armazenamento privado; não servir toda a pasta por `express.static`. Somente assets referenciados por publicação podem ser distribuídos publicamente. Remoção respeita referências de páginas e snapshots. Banco armazena metadados, nunca binários grandes.

Banco e filesystem não compartilham transação: usar staging e compensação para uploads, registrando falhas recuperáveis. Na publicação, validar referências e materializar snapshot antes de trocar o ponteiro público em transação. Backups devem abranger banco e assets coerentes; testar restauração antes de produção.

## Dependências mínimas por etapa

Fase 0: nenhuma instalação. Fase 1: React, react-dom, Vite e plugin React; Express, mysql2 e Zod para validação em JavaScript; Vitest, Supertest, ESLint e plugins React. Testing Library/jsdom somente quando houver componentes com comportamento a testar. Selecionar versões estáveis compatíveis com Node 24 e registrar lockfile no setup. Migrations SQL com ferramenta pequena a selecionar no início da Fase 1, considerando que DDL no MariaDB pode causar commit implícito.

Fase 2: PixiJS; GSAP na primeira animação executável. Playwright ao surgir fluxo E2E crítico. Não instalar bibliotecas de PDF, vídeo, pagamentos ou mobile agora.

## Referências verificadas

- [XAMPP para Windows](https://www.apachefriends.org/faq_windows.html): MariaDB fornecido pelo serviço “MySQL” do XAMPP.
- [MariaDB JSON](https://mariadb.com/docs/server/reference/data-types/string-data-types/json): diferenças em relação ao JSON nativo MySQL; não assumir JSONB.
- [mysql2](https://sidorares.github.io/node-mysql2/docs/documentation): driver e prepared statements.
- [Node](https://nodejs.org/en/about/previous-releases), [Vite](https://vite.dev/guide/) e [Vitest](https://vitest.dev/guide/migration/): conferir compatibilidade ao fixar versões.
