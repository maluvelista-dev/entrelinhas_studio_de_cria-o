# Fase 1 — entrega e aceite

Autorizada pelo usuário em 24/09/2026, após aprovação da Fase 0. Entrega aceita pelo usuário após testes manuais em 26/09/2026; Fase 2 autorizada na sequência. O checklist abaixo preserva o roteiro apresentado, sem inferir execução individual de cada item.

## Implementado

- Monorepo npm, JavaScript ESM, React/Vite e Express; lint enxuto e builds verificáveis.
- MariaDB 10.4.32 do XAMPP com bancos/usuários exclusivos; alvo MariaDB 11.4 LTS validado em instância isolada 11.4.13.
- Livros com slug fixo, título, descrição, faixa etária opcional e referência de capa.
- Book separado da revisão de trabalho; ponteiros preparados para publicação futura.
- Páginas com texto Unicode, schemaVersion, ordenação transacional e documento vazio reservado para Engine.
- Edição concorrente protegida por revision e HTTP 409; alterações recusadas durante revisão.
- Transições DRAFT ↔ REVIEW e histórico transacional com comentário e ator autenticado.
- Catálogo de personagens/objetos/cenários/áudio, global ou exclusivo de um livro, com metadados e vínculo opcional a asset existente.
- Storage por chave lógica, guard de caminhos e fixture explícita com compensação.
- Studio “Entrelinhas” (nome de interface provisório): estante, busca, editor de metadados/texto, ordem de páginas, revisão e catálogo; estados de erro, carregamento e confirmação de salvamento.

## Arquivos principais

- apps/api/migrations/: estrutura relacional e histórico.
- apps/api/src/modules/books/: regras, serviços e persistência.
- apps/api/src/modules/library/: escopo e validação de assets.
- apps/api/src/infrastructure/: MariaDB, migrations e filesystem.
- packages/schemas/src/: contratos estritos versionados.
- apps/studio/src/: interface e componentes.
- scripts/: inicialização, migrations, fixture e verificação de build.
- tests/integration/ e tests/e2e/: persistência real e fluxo no navegador.

## Validação

- Unidade/componentes/segurança: 15 testes aprovados em 10 arquivos.
- Integração: 8 cenários aprovados no MariaDB 10.4.32 e os mesmos 8 no MariaDB 11.4.13.
- Migrations: banco limpo, evolução 001 → 002 → 003 preservando dados, reexecução, checksum divergente e constraints reais.
- Dois E2E em Edge aprovados: fluxo editorial autenticado e gestão de acessos com verificação do perfil de revisor.
- Inspeção visual de capturas em desktop e 390px; sem overflow horizontal no cenário móvel testado e sem erro JavaScript de página no E2E.
- Lint e build aprovados. Teste de servidor Vite verifica que arquivos privados não são servidos por /@fs/.

As verificações visuais foram realizadas em capturas e o fluxo executado por automação no navegador. Isso não representa aceite humano da equipe. Capturas temporárias ficam em .local, fora do Git.

## Checklist de aceite pelo usuário

- [ ] Entrar com o administrador inicial, definir senha pessoal e remover o arquivo local da senha inicial.
- [ ] Criar editor/revisor em Acessos e conferir as ações permitidas; desativar conta e verificar novo login negado.
- [ ] Abrir o Studio e aprovar legibilidade, organização e navegação por teclado.
- [ ] Criar livro com título, slug, descrição e idades; salvar, recarregar e conferir.
- [ ] Adicionar duas páginas com acentos; salvar e reordenar.
- [ ] Editar o mesmo livro em duas abas e conferir aviso de conflito.
- [ ] Enviar para revisão, conferir bloqueio de edição, devolver e conferir histórico.
- [ ] Cadastrar elemento global e elemento exclusivo na Biblioteca.
- [ ] Confirmar que não há ação de publicação disponível.
- [ ] Conferir as evidências de migrations nos dois alvos em DATABASE.md.
- [ ] Aprovar a entrega antes de autorizar qualquer trabalho de Fase 2.

## Limitações e riscos conhecidos

- Login, perfis, sessões revogáveis e serializers implementados. Uso ainda restrito a localhost até revisão de implantação; sem MFA/SSO ou permissões por livro. Veja SECURITY.md.
- Histórico novo registra o ator autenticado; registros legados mantêm ator nulo.
- Importação visual, renderização, animação, narração, publicação e exportações não fazem parte da Fase 1.
- Referência de capa é persistida; cartões da estante usam composição tipográfica provisória, sem preview do arquivo de capa.
- Não há exclusão definitiva de livros ou assets; política de retenção segue pendente.
- Limites iniciais: faixa etária 0–18 anos, 500 páginas/livro, 30.000 caracteres/página, body HTTP 256 KB. Catálogo/listagem ainda sem paginação, adequado ao uso interno inicial.
- Library implementa cadastro/listagem; rigging e definições executáveis ficam nas fases próprias.
- VPS não foi implantada. Validação do banco alvo ocorreu em instância Windows; ambiente Linux, TLS, backup/restauração e operação devem ser verificados antes da implantação.
- DDL parcialmente aplicado exige recuperação explícita; nunca considerar seu rollback equivalente ao de transações de conteúdo.
- E2E depende de Edge instalado ou navegador Playwright configurado; o ambiente restrito de execução precisou de permissão para encerrar processos temporários no Windows.
