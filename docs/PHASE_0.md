# Fase 0 — fechamento técnico em 11/10/2026

Estado: **validado tecnicamente e aceito pelo usuário em 11/10/2026**, na mensagem “aprovado”. O aceite não pressupõe execução individual de cada item do checklist abaixo. Nenhuma fase seguinte está autorizada por este relatório. Referência de escopo: [PHASE_REQUIREMENTS.md](PHASE_REQUIREMENTS.md).

## Entregas e evidências

| Requisito | Entrega verificável |
| --- | --- |
| Arquitetura separada | npm workspaces; Studio React/JavaScript, API Node, schemas puros, Engine e storage privado. Limites em ARCHITECTURE.md. |
| Banco local e alvo | MariaDB 10.4.32 fornecido pelo serviço “MySQL” do XAMPP; alvo isolado MariaDB 11.4.13. MySQL 8 não é equivalente. |
| Motor 2D e prova de conceito | PixiJS escolhido, canvas real verificado por leitura de pixels WebGL, resize e desmontagem; Engine independente de React. ADR-008 e PHASE_2.md registram a implementação histórica reutilizada como evidência. |
| Diretórios, padrões e contratos | ARCHITECTURE.md, DOMAIN.md, schemas estritos, serializers explícitos, SQL parametrizado e regras ESLint. JavaScript obrigatório. |
| Configuração e migrations | .env.example sem segredos; setup com usuários separados; runner com lock/checksum/estado; recuperação documentada em DATABASE.md. |
| Validações, erros e logs | Configuração validada, erros HTTP sanitizados, serializers por resposta, logs básicos de inicialização/migrations e reconciliação de storage. Não imprimir credenciais, cookies ou documentos completos para diagnosticar. |
| Git e ferramentas | Repositório existente, lockfile, ignores para segredos/dados, lint, testes unitários, integração e navegador. Alterações locais não foram commitadas. |
| Armazenamento e VPS | Planejamento abaixo; implantação não é requisito de execução desta fase. |
| Estrutura visual | Shell Tema A com menu, cabeçalho, login e navegação; renderização validada em navegador. |

## Correções deste fechamento

- Otimização inicial de GSAP/PixiJS e caches distintos para Studio, E2E dev e teste de segurança do Vite. O teste não deve invalidar os módulos da sessão de desenvolvimento.
- O iniciador conjunto repassa ao Vite a porta da API configurada no .env (variável do terminal tem prioridade).
- Redimensionamento de prévias é agendado para o próximo frame, agrupa notificações e cancela trabalho pendente ao desmontar o canvas.
- Documentação distingue o aceite histórico apenas documental do fechamento executável atual.

## Instalação nova reproduzível (Windows)

Pré-requisitos: Node 24, npm e XAMPP com MariaDB ativo. Execute na raiz do repositório, fora de htdocs; Apache/PHP não são necessários.

~~~powershell
node --version
npm.cmd ci
npm.cmd run db:setup
npm.cmd run db:migrate
npm.cmd run auth:bootstrap
npm.cmd run dev
~~~

O setup exige acesso administrativo local; se houver senha, configure SETUP_DB_USER e SETUP_DB_PASSWORD apenas no terminal. DATABASE.md detalha portas, privilégios, alvo isolado e recuperação. O setup recusa bancos/configurações existentes; não é comando para reiniciar esta máquina já preparada. auth:bootstrap recusa sobrescrever contas. A credencial inicial fica em .local/admin-initial.txt, relativa à raiz; não publicar esse arquivo.

Na instalação atual, basta iniciar o serviço “MySQL” do XAMPP e executar npm.cmd run dev. Studio: http://127.0.0.1:5173; API: http://127.0.0.1:3000/api/health. Ctrl+C encerra o iniciador conjunto. Para terminais separados: npm.cmd run dev:api e npm.cmd run dev:studio; se alterar API_PORT no .env, defina a mesma variável no terminal do front. A porta do Studio é estrita: se ocupada, encerrar o processo correto, sem matar todos os processos Node.

npm.cmd é o executável Windows do npm; o script dev do projeto é que inicia os dois servidores. Configuração é gerada pelo setup e validada pela API; credenciais nunca usam prefixo VITE_. Atualizar migrations com db:migrate antes de abrir uma versão que altere o schema; não editar SQL já aplicado.

Se o banco não responder, conferir serviço/porta/credenciais, sem reset. Se um módulo da prévia falhar, reiniciar npm.cmd run dev e recarregar o navegador; não atribuir automaticamente a WebGL. A integração usa apenas book_studio_test e usuário book_studio_test_runner; não rodar junto com E2E porque compartilham esse banco.

## Resultados executados

Ambiente: Windows, Node 24.18.1, npm 11.16.0.

- Instalação limpa: cópia isolada em .local/phase0-clean-20261011, sem .env, storage ou node_modules; npm.cmd ci --offline --no-audit --no-fund instalou 337 pacotes pelo lockfile; build aprovado. O modo offline utiliza o cache npm desta máquina; em máquina nova, npm ci baixa os mesmos pacotes do registry.
- npm.cmd test: 178 testes aprovados em 24 arquivos após a correção do resize.
- npm.cmd run lint: aprovado.
- npm.cmd run build: aprovado novamente após a correção do resize.
- npm.cmd run test:integration: 15 testes aprovados no MariaDB 10.4.32/3306.
- npm.cmd run test:production-db: 15 testes aprovados no MariaDB 11.4.13/3307.
- As integrações verificam banco vazio/upgrade, preservação, reaplicação e checksum das migrations, além das regras existentes. Nenhum dado de desenvolvimento foi resetado.
- Servidor real: Studio e health pelo proxy responderam HTTP 200; módulos renderer/scene-player via /@fs/ retornaram JavaScript, e suas dependências otimizadas GSAP/PixiJS também responderam HTTP 200 após os testes unitários.
- E2E em Opera, modo desenvolvimento e portas exclusivas: **4 cenários aprovados**, cobrindo canvas, resize, sprites, perspectivas, desmontagem, prévia/keyframes e imagem inteira; o aviso ResizeObserver não se repetiu após a correção. A seleção character.spec.js também inclui whole-character.spec.js pelo filtro de nomes do Playwright. Esse teste usa perfil descartável; não comprova o perfil pessoal do usuário nem cada personagem real.

Comandos de repetição do navegador, depois de encerrar a integração:

~~~powershell
$env:E2E_API_PORT = '3118'
$env:E2E_STUDIO_PORT = '5288'
$env:E2E_STUDIO_MODE = 'dev'
$env:PLAYWRIGHT_EXECUTABLE_PATH = "$env:LOCALAPPDATA\Programs\Opera\opera.exe"
node --env-file=.env.test node_modules/@playwright/test/cli.js test engine.spec.js motion.spec.js character.spec.js
~~~

Não reutilizar servidor real para os E2Es. O Playwright no Windows pode deixar servidores de teste após os cenários; encerrar somente processos identificados como pertencentes à execução. Nenhuma VPS foi testada ou implantada.

## Plano de armazenamento

Imagens ficam no filesystem privado configurado por STORAGE_ROOT, com metadados no MariaDB, chaves relativas imutáveis e leitura autenticada. Trocar imagem cria nova identidade; remoção exige verificar referências. Banco e arquivos não compartilham transação: staging/compensação e reconciliação devem preservar consistência.

Áudio/narração seguirão a mesma separação, com validação de formato/duração/tamanho na fase própria. Fontes atuais são empacotadas no build; futuras fontes importadas precisarão de licença e validação antes de uso/exportação. Exportações serão artefatos derivados com versão/origem e retenção definidas na fase de exportação, sem substituir o documento mestre. Backup deve incluir banco e storage coerentes; restauração em ambiente separado será requisito antes da implantação.

## Plano de VPS Hostinger (não implantado)

Linux com Nginx/TLS na frente de um único domínio: build estático do Studio e proxy de /api para Node em 127.0.0.1. Processo Node supervisionado por systemd, usuário sem privilégios, env fora da raiz pública e storage persistente privado; servir apenas dist, nunca o workspace ou Vite dev. MariaDB em loopback/rede privada, usuários separados de aplicação e migrations, sem porta pública do banco.

Alvo: série MariaDB 11.4 LTS mantida, com patch exato revalidado antes de implantar. O teste Windows 11.4.13 comprova compatibilidade do motor, não configurações Linux/TLS/backup. Antes do deploy: repetir migrations em instância isolada equivalente à VPS, testar restore coerente de banco/storage, configurar HTTPS, NODE_ENV=production, APP_ORIGIN exato, cookies Secure, retenção de logs e monitoramento de processo/espaço. Publicação editorial/API pública continuam em fases próprias.

Manutenção da série 11.4 até maio de 2029: [MariaDB](https://mariadb.org/about/). A opção VPS permite instalação manual do Node: [Hostinger](https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/). Não foi contratado plano nem escolhido dimensionamento sem medir carga.

## Aceite manual obrigatório

- [ ] Reiniciar o comando npm.cmd run dev e abrir o Studio no Opera habitual.
- [ ] Fazer login; conferir menu/cabeçalho e navegação.
- [ ] Abrir Visualização → Coordenadas, redimensionar a janela, sair e voltar: a cena deve reaparecer sem erro.
- [ ] Repetir o caminho que antes exibia “Não foi possível carregar o módulo da prévia”; informar se persistir no perfil pessoal.
- [x] Aceite da Fase 0 recebido em 11/10/2026.

Esse aceite é exigido pela regra de fechamento por fase reafirmada pelo usuário e registrada em ROADMAP.md. Não declara as funcionalidades das fases posteriores completas.
