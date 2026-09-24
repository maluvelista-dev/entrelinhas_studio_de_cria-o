# Domínio e banco inicial proposto

Proposta para revisão, sem DDL executado. Banco da aplicação: MariaDB, fornecido localmente pelo serviço “MySQL” do XAMPP. Produção utilizará MariaDB em versão mantida; migrations precisam ser validadas nos dois ambientes. MySQL 8 não é equivalente ou substituto de teste. InnoDB, `utf8mb4`, IDs UUID gerados no Node armazenados em `CHAR(36)`, datas `DATETIME(3)` em UTC. Slugs normalizados em minúsculas com unicidade. Collation explicitada nas migrations; não depender dos defaults do servidor.

## Agregados

Library reúne Asset e LibraryItem (personagem, objeto, background, áudio e posteriormente animação/movimento/interação). Book é a identidade editorial; BookVersion contém os dados editáveis de uma revisão; Page pertence à revisão. Scene e Timeline são documentos versionados da página. Character e Animation ganham contratos específicos nas fases próprias.

| Tabela proposta | Campos e restrições principais |
| --- | --- |
| books | id PK, slug UNIQUE, working_version_id nullable, published_version_id nullable, created_at, updated_at |
| book_versions | id PK, book_id FK, version inteiro positivo, status, title, description, age_min/age_max nullable, cover_asset_id FK nullable, schema_version, revision inteiro para concorrência, created_at, updated_at; UNIQUE(book_id, version) |
| pages | id PK, book_version_id FK, position inteiro positivo, schema_version, content_json, scene_json, timeline_json, automatic_animations_json, premium_interactions_json, created_at, updated_at; UNIQUE(book_version_id, position) |
| assets | id PK, owner_book_id FK nullable (null = global), storage_key UNIQUE, original_name, media_type, byte_size, checksum, created_at |
| library_items | id PK, kind, name, owner_book_id FK nullable, asset_id FK nullable, schema_version, definition_json, created_at, updated_at |
| book_status_history | id PK, book_version_id FK, from_status, to_status, actor_id nullable, comment nullable, created_at |

Títulos incompletos podem existir em rascunho conforme regras mínimas de criação, mas não passar pelo gate editorial. Faixa etária exige ambos limites ou nenhum, inteiros não negativos e mínimo <= máximo. Status usa VARCHAR e CHECK, com transições validadas pelo domínio. Validar suporte efetivo das constraints na instância instalada.

JSON guarda estrutura variável; campos pesquisados frequentemente permanecem colunas relacionais. No MariaDB, JSON é alias de LONGTEXT: validar sintaxe no banco e semântica/schemaVersion na aplicação. Não depender de operadores JSON específicos do MySQL. Repositório normaliza desserialização do driver e detecta documento inválido.

Ponteiros de books devem referenciar versões do próprio livro, com FK composta `(id, working_version_id)`/`(id, published_version_id)` para `(book_id, id)`, apoiada por UNIQUE adequado em book_versions. Inserir book com ponteiros nulos, inserir versão e atualizar ponteiro na mesma transação. As migrations resolvem a dependência circular em etapas. Status publicado é invariável de serviço, não garantido somente pela FK.

Índices iniciais: FKs, slug, `(book_id, version)`, `(book_version_id, position)`, status e proprietário/tipo da Library conforme consultas reais. Sem índice genérico para cada campo JSON. Referências dentro de JSON precisam ser verificadas pelo domínio; FKs não as protegem.

## Workflow

```text
DRAFT -> REVIEW -> READY_TO_PUBLISH -> PUBLISHED
           |              |
           +--> DRAFT <----+
```

Fase 1 implementa DRAFT -> REVIEW e devolução a DRAFT com histórico. READY_TO_PUBLISH/PUBLISHED são estados reservados e transições bloqueadas até o PublicationValidator completo da Fase 10. Não disponibilizar PATCH genérico de status. Edição de conteúdo em REVIEW exige retorno a DRAFT; em READY_TO_PUBLISH invalida aprovação e retorna a DRAFT. PUBLISHED é imutável: futura edição cria revisão, mantendo a versão pública anterior.

Mudança de estado e registro de histórico ocorrem em uma transação na mesma conexão. Atualizações usam `revision` esperada: conflito retorna HTTP 409, evitando sobrescrita silenciosa. Reordenação bloqueia páginas da revisão e usa posições temporárias não conflitantes antes da sequência final; rollback preserva ordem anterior.

## Evolução de publicação

Na Fase 10, criar published_snapshots com versão, schemaVersion, documento congelado, manifesto imutável de assets, checksum e published_at. Validar o mesmo conteúdo que será publicado, com controle de concorrência, antes de trocar published_version_id. Referências à Library precisam congelar definições e assets: editar personagem global não pode alterar publicação antiga.

PublicationValidator retorna `{ valid, errors, warnings }`, com código, caminho e mensagem por ocorrência. Cobrir título, capa, idade, páginas contíguas, schemas, referências, assets, timeline e compatibilidade de ações. Warnings não escondem erros obrigatórios. Endpoint público consulta somente snapshot apontado, nunca agrega dados editáveis ao vivo.

BookStatusHistory recebe identidade autenticada futuramente. Enquanto desenvolvimento for exclusivamente local e sem login, actor_id pode ser nulo e deve ser identificado como ação local sem atribuição; nunca simular auditoria de usuário.

## Exclusões

Sem exclusão em cascata de assets ou versões publicadas. Remoção de conteúdo referenciado retorna conflito. Política definitiva de arquivamento e retenção será validada antes de implementar exclusão de livros. Não incluir editor gráfico, assinaturas ou exportações nesta fase.
