# Studio de livros infantis

Studio interno para produzir livros como dados estruturados e assets. O aplicativo mobile será desenvolvido posteriormente.

## Situação atual

Fase 0: proposta técnica documentada, aguardando validação e autorização para a Fase 1. Não há aplicação, dependências instaladas ou migrations executadas. O banco da aplicação é **MariaDB**, fornecido localmente pelo serviço “MySQL” do XAMPP. Produção utilizará MariaDB em versão mantida. Migrations deverão ser validadas no ambiente local e no alvo de produção. MySQL 8 não é um alvo equivalente.

Ambiente inspecionado em 23/09/2026: Windows, Node 24.18.1, npm 11.16.0, Git 2.55.0; XAMPP em `C:\xampp`, binário MariaDB 10.4.32, configuração na porta 3306 e processo `mysqld` ativo. A conexão autenticada e a versão do servidor em execução ainda precisam ser verificadas. Nenhum banco existente foi alterado.

## Documentação

- [Arquitetura e infraestrutura local](docs/ARCHITECTURE.md)
- [Domínio e proposta de banco](docs/DOMAIN.md)
- [Formato de livros](docs/BOOK_FORMAT.md)
- [Formato de personagens](docs/CHARACTER_FORMAT.md)
- [Formato de animações](docs/ANIMATION_FORMAT.md)
- [Testes e aceite](docs/TESTING.md)
- [Roadmap e plano detalhado da Fase 1](docs/ROADMAP.md)
- [Decisões, riscos e dúvidas](docs/DECISIONS.md)

## Processo

Ler a documentação antes de cada etapa. Implementar somente a fase autorizada, com commits pequenos, testes, lint, build e aceite manual. Não avançar automaticamente. JavaScript obrigatório; não utilizar TypeScript. Não criar aplicativo mobile, pagamentos ou exportadores antecipadamente.

Não há `package.json` nesta entrega documental; comandos de aplicação serão disponibilizados com o setup da Fase 1. A ausência dos gates executáveis está registrada em TESTING.md, sem declarar testes aprovados.
