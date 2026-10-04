# Entrelinhas — Studio de livros infantis

Studio interno para criar livros como dados estruturados e assets. React + JavaScript + Vite, API Node/Express e **MariaDB**, fornecido localmente pelo serviço “MySQL” do XAMPP. MySQL 8 não é equivalente.

## Estado do projeto

Fases 1–3 implementadas com livros, páginas, Biblioteca, workflow, acessos, Engine e estrutura de personagens. O incremento atual inclui pacotes completos, poses/animações reutilizáveis e personagens nas páginas. Ver [guia e checklist de aceite](docs/CHARACTER_PACKS_AND_MOTION.md) e [roadmap](docs/ROADMAP.md).

MariaDB local validado: 10.4.32. Alvo de produção: série mantida 11.4 LTS, com migrations e integração validadas também em 11.4.13 isolado. Nenhuma VPS foi implantada.

## Executar nesta máquina

Os bancos, usuários, arquivos de configuração locais e migrations já foram preparados. Inicie o serviço **“MySQL” do XAMPP** (MariaDB) e, na raiz do projeto, execute:

```powershell
npm run dev
```

Studio: http://127.0.0.1:5173

API/healthcheck: http://127.0.0.1:3000/api/health

O Studio exige login. O administrador inicial já foi criado; leia a credencial em .local/admin-initial.txt (arquivo local ignorado pelo Git). Depois de entrar, gerencie contas e defina sua senha em **Acessos**. Consulte [SECURITY.md](docs/SECURITY.md).

Se o PowerShell bloquear npm.ps1, use `npm.cmd` nos mesmos comandos. A aplicação roda fora de htdocs; Apache/PHP não são necessários para ela. Nesta fase, use somente localhost, sem publicar a API na rede.

## Nova instalação

Node 24 e MariaDB são necessários. Após `npm ci`, configurar bancos exclusivos com `npm run db:setup` e aplicar `npm run db:migrate` e criar o primeiro administrador com `npm run auth:bootstrap`. O setup recusa bancos/usuários existentes, não faz reset. Credenciais de aplicação e migrations são distintas e ficam em arquivos .env ignorados pelo Git.

Consulte [DATABASE.md](docs/DATABASE.md) para setup administrativo, instância isolada 11.4.13, proteção do banco de testes e recuperação de migrations.

## Comandos

| Comando | Função |
| --- | --- |
| npm run dev | API e Studio locais |
| npm test | Unidade e componentes |
| npm run test:integration | Integração e migrations no MariaDB do XAMPP, banco exclusivo |
| npm run test:production-db | Mesma suíte no alvo MariaDB 11.4 isolado na porta 3307 |
| npm run test:e2e | Build estático + fluxo no Edge com API/banco de testes |
| npm run lint | Erros prováveis de JavaScript/React, sem regras cosméticas excessivas |
| npm run build | Validação de sintaxe/imports da API/schemas e build do Studio |
| npm run db:migrate | Migrations com usuário dedicado |
| npm run auth:bootstrap | Criar o primeiro administrador, sem sobrescrever contas existentes |
| npm run db:fixture | Criar explicitamente asset PNG mínimo para validar vínculos |

Pare os servidores de desenvolvimento antes do E2E; ele reserva 3000/5173 e recusa reutilizar servidores existentes. O padrão usa Edge instalado. Para outro navegador Chromium Playwright, instalar/configurar o canal correspondente e definir PLAYWRIGHT_CHANNEL.

Não executar integração contra dados reais: os testes recriam tabelas apenas no banco isolado book_studio_test, após validar banco, usuário, host e versão. Não versionar .env, storage, binários de banco ou saídas de testes.

## Documentação

- [Segurança, perfis e serializers](docs/SECURITY.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Domínio](docs/DOMAIN.md)
- [MariaDB e migrations](docs/DATABASE.md)
- [Formato de livros](docs/BOOK_FORMAT.md)
- [Formato de personagens](docs/CHARACTER_FORMAT.md)
- [Formato de animações](docs/ANIMATION_FORMAT.md)
- [Testes e gates](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisões](docs/DECISIONS.md)
- [Fase 1: entrega, limitações e aceite](docs/PHASE_1.md)

## Processo

Ler a documentação antes de cada etapa. Commits pequenos, testes, lint, build, regressão e aceite manual antes de avançar. JavaScript obrigatório. Engine/PixiJS/GSAP mantêm renderização e animação separados do React; mobile, pagamentos, publicação e exportação não fazem parte desta entrega.

## Engine e identidade visual

A fase 2 está disponível para aceite em [docs/PHASE_2.md](docs/PHASE_2.md). Após login, Visualização abre a cena de validação do Engine. O Tema A rege as telas existentes conforme [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). Para rodar E2E sem encerrar os servidores locais, veja as portas alternativas em [docs/TESTING.md](docs/TESTING.md).

## Personagens

Fase 3 disponível para aceite em [docs/PHASE_3.md](docs/PHASE_3.md). Após login, abra Visualização → Personagem para conferir hierarquia, pivôs, anchors e perspectivas. Contrato em [docs/CHARACTER_FORMAT.md](docs/CHARACTER_FORMAT.md). O Tema A continuará nas próximas fases.
