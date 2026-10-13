# MariaDB: setup, migrations e recuperação

## Ambientes

Banco da aplicação: **MariaDB**. Localmente, o serviço “MySQL” do XAMPP fornece MariaDB 10.4.32. MySQL 8 não é equivalente e não é suportado.

Alvo de produção definido para esta fase: **MariaDB 11.4 LTS**, patch validado **11.4.13**. A série tem manutenção comunitária até maio de 2029, conforme [política oficial](https://mariadb.org/about/). Atualizações de patch exigem repetir os testes antes da implantação.

As migrations e a integração foram executadas em 10.4.32 e 11.4.13. A segunda instância é isolada no Windows, na porta 3307; valida o motor/versão alvo, não uma VPS Linux já implantada. Configuração operacional, TLS, backups e restauração na VPS continuam sendo critérios de implantação futuros.

| Instância validada | Porta | Collation global | sql_mode global observado |
| --- | --- | --- | --- |
| XAMPP MariaDB 10.4.32 | 3306 | utf8mb4_general_ci | NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION |
| MariaDB 11.4.13 isolado | 3307 | utf8mb4_unicode_ci | STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION |

Bancos/tabelas do projeto fixam utf8mb4_unicode_ci; IDs/slugs usam ascii_bin. Cada transação de conteúdo fixa UTC e STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION. Nenhuma configuração global do XAMPP foi alterada.

## Instalação inicial local

1. Iniciar o serviço “MySQL” do XAMPP (MariaDB).
2. Instalar Node 24 e executar `npm ci`.
3. Executar `npm run db:setup` **somente em uma instalação nova**.
4. Executar `npm run db:migrate`.
5. Executar `npm run auth:bootstrap` para criar o primeiro administrador.
6. Executar `npm run dev` e entrar com a credencial local conforme SECURITY.md.

O setup usa administração local em 127.0.0.1:3306. Se necessário, fornecer `SETUP_DB_USER`, `SETUP_DB_PASSWORD` e `SETUP_DB_PORT` como variáveis do terminal, nunca no Git. Nesta máquina a conexão administrativa foi verificada antes da criação.

O script recusa bancos, usuários ou arquivos de credenciais já existentes, sem removê-los. Se uma criação parcial falhar, inspecionar os objetos específicos criados antes de recuperar; não repetir reset nem remover bancos em lote.

Cria:
- `book_studio`: dados de desenvolvimento.
- `book_studio_test`: apenas testes.
- `book_studio_app`: SELECT/INSERT/UPDATE/DELETE apenas no banco de desenvolvimento.
- `book_studio_migrator`: DDL e dados somente no banco de desenvolvimento.
- `book_studio_test_runner`: acesso completo somente ao banco de testes.

Senhas aleatórias ficam em `.env` e `.env.test`, ignorados pelo Git. Não são impressas. A aplicação não usa root. O usuário de teste nunca recebe privilégios sobre o banco de desenvolvimento.

## Instância isolada do alvo de produção

O pacote ZIP oficial 11.4.13 foi extraído em `.local/mariadb/mariadb-11.4.13-winx64`; dados em `.local/mariadb-data`. Sem serviço Windows instalado ou alteração do XAMPP.

Download: [arquivo oficial](https://archive.mariadb.org/mariadb-11.4.13/winx64-packages/mariadb-11.4.13-winx64.zip). SHA-256 conferido contra o manifesto oficial:
`d62986d433eeebfde218560b276103831604a61e929e87f1a17f5aebd80257e2`.

Para reiniciar a instância já preparada, em PowerShell na raiz, mantendo o terminal aberto:

```powershell
$dbData = Join-Path (Get-Location).Path '.local/mariadb-data'
& '.local/mariadb/mariadb-11.4.13-winx64/bin/mariadbd.exe' --no-defaults "--datadir=$dbData" --port=3307 --bind-address=127.0.0.1 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --console
```

Em uma instalação nova, inicializar primeiro o datadir exclusivo com `mariadb-install-db.exe --datadir=.local/mariadb-data --port=3307`, iniciar o servidor e executar `node scripts/setup-local-db.js --production-test`. Esse setup cria apenas `book_studio_test`, usuário dedicado e `.env.production-test`. Administração sem senha é restrita a esta instância descartável em loopback; não é configuração para produção.

Com a instância ativa: `npm run test:production-db`. Para encerrá-la após conferir que a porta corresponde à instância isolada, usar `mariadb-admin.exe --no-defaults --host=127.0.0.1 --port=3307 --user=root --skip-ssl shutdown` do mesmo pacote. Não apagar datadirs para reiniciar testes.

## Execução e segurança dos testes

`npm run test:integration` carrega somente `.env.test`.
`npm run test:production-db` carrega somente `.env.production-test`.

A integração recusa banco diferente de book_studio_test, usuário diferente de book_studio_test_runner, host fora de loopback, alvo ausente ou versão inesperada. Só depois desse guard remove uma lista fixa de tabelas do banco de teste. Não usar credenciais de produção real.

E2E carrega `.env.test`, inicia API/Studio próprios e recusa servidores existentes nas portas 3000/5173 para não testar acidentalmente o banco de desenvolvimento. Parar `npm run dev` antes de `npm run test:e2e`.

## Migrations e DDL

Runner pequeno próprio, exclusivo para SQL DDL simples, sem ORM. Arquivos ordenados, separador explícito `-- statement-break`, checksum SHA-256, lock nomeado por banco e tabela schema_migrations. Não aceita outro motor que MariaDB.

001 cria Book/BookVersion/Page/Asset/LibraryItem e FKs compostas; 002 adiciona histórico editorial; 003 adiciona usuários, sessões e FK do ator. O teste executa 001 em banco vazio, insere dado anterior, aplica 002/003 e confirma preservação. Reexecução não aplica novamente migrations concluídas.

**DDL não tem rollback universal no MariaDB.** Antes de cada migration o runner registra state=running; só marca complete após todos os statements. Falha parcial ou checksum alterado bloqueiam novas execuções.

Recuperação:
1. Parar novas migrations e preservar backup/diagnóstico do banco afetado.
2. Conferir migration, checksum, state e quais tabelas/constraints realmente existem.
3. Em ambiente com dados, restaurar backup coerente ou preparar reparo explícito revisado; nunca apagar automaticamente tabelas existentes.
4. Somente após reconciliar todos os statements, reconciliar o registro de controle com revisão técnica. Não marcar complete para apenas silenciar erro.
5. Testar o reparo nos dois alvos isolados antes de aplicá-lo fora dos testes.

Migrations já concluídas não devem ser editadas. Evolução usa novo arquivo numerado. A suíte detecta checksum divergente; revisão editorial e alterações de conteúdo usam transações normais com rollback.

## Fixtures e storage

`npm run db:fixture` cria explicitamente um PNG mínimo e seu registro de asset para testar vinculação pelo catálogo. Não roda automaticamente e não cadastra conteúdo fictício nos livros. Se o INSERT falha, remove o arquivo recém-criado como compensação.

Há upload HTTP de ilustrações e imagens de personagens, conforme ILLUSTRATIONS.md e CHARACTER_EDITOR.md; não há endpoint geral para excluir assets. Storage é infraestrutura privada; referências podem selecionar apenas assets existentes e compatíveis com escopo/tipo. O adaptador recusa traversal, nomes reservados e symlinks. O filesystem deve ser controlado pelo processo local; não oferecer acesso de escrita a terceiros, pois verificação de caminhos não constitui isolamento contra alterações externas concorrentes.

## Dimensões de imagens

004_image_dimensions.sql adiciona width/height opcionais aos assets, preservando registros anteriores. Novas importações gravam dimensões validadas. Ver [importação de ilustrações](ILLUSTRATIONS.md).

## Fichas da Biblioteca

005_library_details.sql adiciona descrição e revisão com valores padrão para cadastros existentes. Testada nos dois MariaDBs e aplicada ao desenvolvimento; [contrato](LIBRARY_DETAILS.md).

## Imagens internas do personagem

006_character_images.sql adiciona owner_character_id (FK para library_items), perspective_id e part_id aos assets. Registros existentes mantêm os três campos nulos. Validação nos dois MariaDBs e aplicação local concluídas.

## Migration 007 — modelos e snapshots de personagens

007_motion_and_scenes.sql adiciona motion_templates e character_snapshots e permite schema_version 1 ou 2 em páginas. Validada com as 13 integrações em MariaDB 10.4.32 (serviço “MySQL” do XAMPP) e MariaDB 11.4.13 isolado. Aplicada ao desenvolvimento em 03/10/2026 com npm.cmd run db:migrate. A alteração da constraint inline usa MODIFY COLUMN, compatível com ambos os motores validados. Preserva documentos v1 existentes; a promoção para v2 ocorre no editor ao salvar. MySQL 8 não é alvo equivalente.

## Migration 008 — objetos e interações na página

008_scene_interactions.sql adiciona scene_item_snapshots (item/revisão → asset) e permite página v3. Validada com 14 integrações em MariaDB 10.4.32 do serviço “MySQL” do XAMPP e em MariaDB 11.4.13 isolado. Aplicada ao desenvolvimento em 04/10/2026. Documentos v1/v2 permanecem aceitos; não houve conversão em lote dos livros existentes.

## Validação do catálogo em 08/10/2026

Não foi necessária nova migration: capacidades são extensão opcional do documento do rig e o programa tipado continua no documento da página v3. Todas as migrations 001–008 foram reaplicadas em bancos vazios de teste, com preservação de dados durante atualização, nos dois alvos.

Os datadirs existentes recusaram abrir ibdata1 como gravável nesta sessão. Para não modificar os dados existentes, foram inicializados datadirs descartáveis .local/catalog-db-local (binário MariaDB 10.4.32 do XAMPP, porta 3316) e .local/catalog-db-production (MariaDB 11.4.13, porta 3317). Credenciais e arquivos .env existentes não foram sobrescritos. Testes usam DB_PORT temporário no processo e somente book_studio_test; não houve execução contra produção real.

## Categoria editorial — 11/10/2026

009_editorial_category.sql acrescenta book_versions.editorial_category (VARCHAR 100, padrão vazio), preservando registros existentes. Validada nos dois MariaDB e aplicada ao desenvolvimento com db:migrate; não altera SQL já aplicado. Exclusões de páginas/livros/Biblioteca são transacionais e protegidas por revisão/referências; imagens privadas são removidas apenas depois do commit. Detalhes em PHASE_1_CLOSURE.md.
