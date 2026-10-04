# Segurança e gerenciamento de acessos

Adicionado à Fase 1 por solicitação explícita do usuário em 26/09/2026. Não é uma garantia de risco zero nem autorização para expor o Studio à internet. O objetivo é defesa em camadas e contratos verificáveis.

## Perfis e ações

| Ação | Administrador | Editor | Revisor |
| --- | --- | --- | --- |
| Consultar livros, páginas e catálogo | Sim | Sim | Sim |
| Criar/editar livros, páginas e catálogo | Sim | Sim | Não |
| Enviar DRAFT para REVIEW | Sim | Sim | Não |
| Devolver REVIEW para DRAFT | Sim | Não | Sim |
| Criar contas, alterar perfis, desativar e redefinir senhas | Sim | Não | Não |
| Publicar | Não nesta fase | Não nesta fase | Não nesta fase |

Os livros são compartilhados entre a equipe deste Studio. Não existe segregação por organização, usuário ou livro individual. O vínculo ownerBookId limita reutilização de assets entre livros; ele não equivale à propriedade de um usuário. Caso surjam equipes com livros privados, será necessário acrescentar associação usuário/livro às políticas antes de permitir esse uso.

## Fluxo de uma requisição

1. Mutação exige JSON e Origin exatamente permitido; requisições cross-site são recusadas.
2. Query string não prevista é recusada. IDs de rota precisam ser UUIDs válidos.
3. Toda rota /api/internal exige sessão válida e usuário ativo.
4. Registro central de rotas exige permissão e serializer; ausência de permissão nega acesso.
5. Casos de uso validam schemas estritos, revision, estado editorial e relação página/livro/asset.
6. A resposta passa por serializer com lista explícita de campos, inclusive objetos aninhados.

Ocultar/desabilitar controles da UI não substitui nenhuma verificação do backend. Parâmetros recebidos não definem o usuário autenticado ou suas permissões. Campos desconhecidos de input são rejeitados; não há mass assignment de objetos HTTP em linhas SQL.

## Sessões e senhas

- Senhas de 12–128 caracteres, hash scrypt com salt aleatório, N=131072, r=8 e p=1. Nunca persistir senha em texto claro na tabela.
- Sessão opaca de 256 bits; banco armazena somente SHA-256 do identificador aleatório.
- Cookie HttpOnly, SameSite=Strict e Path=/; nunca retornar token de sessão em JSON ou armazená-lo em localStorage.
- NODE_ENV=production exige APP_ORIGIN HTTPS, cookie Secure e prefixo __Host-. Em localhost HTTP, cookie permanece HttpOnly/SameSite, sem Secure.
- Validade absoluta de oito horas e inatividade de trinta minutos. Login gera novo identificador; logout revoga a sessão no banco. Máximo de cinco sessões por conta.
- Mudança de perfil, desativação e redefinição de senha revogam todas as sessões do usuário.
- Perfil/estado da conta são consultados no banco em cada requisição; não confiar em claims de um token antigo.
- Login limitado a dez tentativas por IP a cada quinze minutos, com no máximo duas verificações simultâneas. Limiter em memória é adequado ao processo único desta fase; múltiplas instâncias exigirão estado compartilhado.
- Credenciais inválidas usam mensagem genérica. Não imprimir cookies, senhas, SQL ou configuração de conexão em erros HTTP.
- Administrador não pode retirar seu próprio perfil administrativo nem desativar a própria conta. Operações administrativas revalidam o ator sob lock transacional.

## Serializers

Arquivo principal: apps/api/src/http/serializers.js.

Há serializers para usuários, resumos de livros, detalhes de livros, páginas, histórico, itens da Library e assets. Nenhuma rota retorna automaticamente um registro completo do banco. O cadastro de um novo campo interno não o acrescenta à API.

Não são campos públicos: password_hash, password, token_hash, identificador de sessão, storage_key, configuração do banco ou objetos internos. O identificador de sessão é transportado somente pelo mecanismo de cookie; o navegador precisa recebê-lo para autenticar, mas JavaScript não o lê.

Campos de conteúdo livre, como texto de página ou comentário editorial, são intencionalmente exibidos a usuários autorizados. Serializers não detectam segredos que alguém digite voluntariamente nesses campos. Não colocar credenciais em conteúdo editorial.

Respostas usam Cache-Control: no-store, nosniff e erros controlados sem stack trace. Query/body de erro não são refletidos integralmente. Schemas de saída precisam evoluir junto com Engine/publicação; nesta fase cenas e timelines são vazias.

## Proteção do ambiente de desenvolvimento

O servidor Vite permite servir somente Studio, schemas e dependências necessárias. /@fs/ não pode acessar a raiz inteira do monorepo. Arquivos .env, .local, .git, código da API e chaves são explicitamente bloqueados; publicDir está desabilitado nesta fase. Um teste real do servidor usa arquivo sentinela sem credenciais e verifica HTTP 403.

API e Vite escutam em loopback. Na VPS, servir apenas o build estático; nunca expor o servidor de desenvolvimento ou a pasta inteira do projeto.

## Primeiro acesso e operação

Nesta máquina, o administrador inicial já foi criado. A credencial está apenas em **.local/admin-initial.txt**, ignorado pelo Git; não foi exibida no chat ou em logs.

Após entrar, abra Acessos, selecione sua conta e defina uma senha pessoal. A redefinição encerra a sessão, exigindo novo login. Remova o arquivo de credencial inicial após guardar/substituir a senha.

Em instalação nova: aplicar migrations e executar npm run auth:bootstrap uma única vez. O comando recusa execução se já houver usuários e nunca substitui contas existentes. O arquivo local de bootstrap é uma exceção temporária controlada; não enviá-lo a serviços externos ou versioná-lo.

Não há endpoint público de cadastro ou redefinição sem autenticação. Recuperação administrativa sem outro administrador ativo exige procedimento local de operação controlado, ainda sem automação. A tela de usuários não revela senhas existentes.

## Validação

- Unitários: hashes/salts, permissões negadas por padrão, serializers com campos sensíveis sintéticos em vários níveis e configuração.
- Integração nos dois MariaDB: 401/403, atribuição de ator, parâmetros não permitidos, bloqueio de escalada, perfil de revisor, revogação, expiração, logout, Secure/HttpOnly/SameSite, senha redefinida e rate limit.
- E2E: login, edição/revisão autenticada, administrador cria revisor, revisor não recebe controles de escrita/administração, logout e ausência de token em localStorage/document.cookie.
- Teste Vite: acesso a arquivo privado negado por /@fs/.

Logs e traces de teste podem conter dados de sessão de teste e devem permanecer ignorados pelo Git. Os E2E criam credenciais aleatórias apenas no banco isolado; nunca usam o administrador real.

## Limites antes de produção

Acesso remoto ainda depende de revisão de implantação: HTTPS/reverse proxy, origens, backup/restauração, atualização de dependências e proteção operacional de banco/arquivos. MFA, SSO, permissões por livro e auditoria completa de eventos de acesso não estão implementados. O histórico editorial registra ator autenticado; registros antigos sem ator permanecem identificados como legados. Nome exibido é o nome atual da conta, não snapshot histórico.

## Referências

- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): negar por padrão e verificar toda requisição.
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): cookies e ciclo de vida de sessão.
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): parâmetros de scrypt.
- [Vite server.fs](https://vite.dev/config/server-options): limites de leitura do servidor de desenvolvimento.

## Ilustrações

Upload autenticado com validação e recodificação, leitura privada e DTOs limitados: [contrato e limites operacionais](ILLUSTRATIONS.md).

## Edição da Biblioteca

Consulta e edição usam permissões library:read/write, DTOs explícitos, validação de escopo e revisão concorrente. Categoria e disponibilidade não são alteráveis por PUT; [detalhes](LIBRARY_DETAILS.md).

## Estrutura de personagens

GET/PUT de rig exigem permissões da Biblioteca, revisão compartilhada, validação estrita recursiva e assets cadastrados do escopo permitido. URLs externas e campos desconhecidos são recusados. [Detalhes](CHARACTER_EDITOR.md).

## Upload interno de partes

A rota multipart da estrutura valida imagem, dono do personagem e revisão, e grava vínculo + rig atomicamente no banco. Assets internos não são reutilizáveis por outro personagem nem por capas/catálogo geral; conteúdo permanece autenticado e DTOs não expõem paths. Uploads compartilham o limite de concorrência por processo.

## Pacotes, modelos e cenas

Pacotes exigem library:write, sessão e origem permitida; só uma importação simultânea por processo, com tamanho limitado e normalização de imagens. Exportação/consulta exige library:read. Modelos aceitam transforms e easing por allowlist, sem código nem URLs. Prévia exige books:read; gravar cena exige books:write, livro em rascunho e revisão esperada. O servidor verifica escopo de personagens, imagens e modelos e aplica serializers recursivos. Snapshots e base64 exportados contêm conteúdo autorizado, nunca caminhos de storage ou sessões.
