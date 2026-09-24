# Decisões e pendências — 23/09/2026

## ADR-001 — Banco do XAMPP

Problema: documento original exige PostgreSQL, mas a instrução mais recente exige MySQL do XAMPP.

Opções: PostgreSQL separado; banco existente do XAMPP. Trade-off: o segundo simplifica o ambiente local, mas requer atenção às diferenças MariaDB/MySQL e à versão de produção. Decisão: seguir o usuário e usar MariaDB encontrado no XAMPP, com driver mysql2. PostgreSQL deixa de ser alvo; não preparar suporte a múltiplos bancos sem necessidade.

## ADR-002 — Monólito modular

Problema: separar responsabilidades sem custo operacional prematuro. Opções: serviços distribuídos ou módulos em uma API. Recomendação: monólito modular, npm workspaces e contratos puros compartilhados. Facilita testes e VPS única; módulos exigem disciplina de imports. Arquitetura proposta para aprovação nesta Fase 0.

## ADR-003 — Revisões e publicação

Problema: editar livro publicado não pode alterar conteúdo público. Opções: uma linha mutável com status; revisões e snapshot. Recomendação: identidade Book, BookVersion e ponteiros explícitos desde a Fase 1; snapshot na Fase 10. Há algumas relações extras, mas evita migração destrutiva do conceito editorial. Library/asset também precisam de imutabilidade nas referências publicadas.

## ADR-004 — Persistência

Problema: cenas evoluem, enquanto relações precisam de integridade. Opções: tudo JSON, tudo tabelas ou híbrido. Recomendação: relações/identidades/ordem em tabelas; cenas/timeline/definições em JSON validado. Sem ORM inicialmente; SQL parametrizado em repositórios. A validação semântica continua obrigatória fora do banco.

## ADR-005 — Escopo e gates da Fase 0

Problema: regras gerais pedem test/lint/build em toda fase, mas a seção 38 pede primeiro propostas e documentação. Decisão de escopo: entrega apenas documental, sem instalar stack antecipadamente. Registrar gates de aplicação como não executáveis, nunca aprovados. Aceite documental depende do usuário; setup executável entra na Fase 1 e terá todos os gates. Nenhuma funcionalidade de Fase 1 foi iniciada.

## Riscos e inconsistências

- O botão MySQL do XAMPP corresponde ao binário MariaDB 10.4.32 encontrado. Não presumir comportamento idêntico a MySQL 8 ou suporte equivalente na VPS; validar migrations nos dois ambientes efetivamente escolhidos.
- A versão local é antiga; selecionar versão mantida para produção e planejar teste de compatibilidade, sem substituir a instalação do usuário nesta fase.
- Ferramenta interna também precisa de autenticação e controle de acesso antes de ser exposta. Requisito não detalhado na especificação; desenvolvimento inicial restrito a localhost.
- READY_TO_PUBLISH requer validações que dependem de fases futuras: bloquear transição até implementação completa, sem publicar conteúdo parcialmente validado.
- Assets globais mutáveis e endpoints estáticos podem vazar drafts ou modificar versões públicas; usar referências imutáveis e distribuição filtrada.
- DDL MariaDB pode ter commits implícitos; não prometer rollback automático universal de migrations. Registrar versão e recuperação, testar banco limpo e atualização.
- Duplicação de edições e reordenação precisam de transações e concorrência explícita.
- JSON de cena não define sozinho dimensões, unidade de ângulo ou relógio de animação; convenções propostas nos contratos, validar com Engine mínimo.
- Renderização de vídeo/PDF tem custo e diferenças de fontes/áudio; adiar implementação, preservar relógio e dados independentes da UI.
- Banco e filesystem exigem backup consistente e recuperação testada.

## Dúvidas para validar antes das funcionalidades afetadas

1. Quem usará o Studio e como será o login/perfil editorial? Bloqueia acesso remoto, não a documentação atual.
2. Faixa etária terá limites livres ou categorias fixas? Proposta inicial: mínimo/máximo em anos.
3. Dimensões de página e política de encaixe serão fixas por livro? Proposta: proporção lógica por livro com coordenadas normalizadas.
4. Quais limites de upload, formatos de áudio e retenção de livros/assets? Definir antes desses fluxos.
5. Qual ambiente e versão de MariaDB na VPS? Confirmar antes da implantação.

Credenciais serão configuradas localmente durante setup; não registrar senhas na documentação ou no chat.
