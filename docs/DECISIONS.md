# Decisões e pendências — atualizado em 24/09/2026

## ADR-001 — MariaDB local e em produção

Problema: a especificação original mencionava outro banco; a instrução vigente determina MariaDB, fornecido localmente pelo serviço “MySQL” do XAMPP.

Decisão: MariaDB é o único banco alvo da aplicação, com driver `mysql2`. MySQL 8 e MariaDB não são equivalentes. Reaproveitar MariaDB do XAMPP simplifica o setup local, mas exige testes de compatibilidade com a versão mantida de MariaDB escolhida para produção. Validar migrations nos dois ambientes, usando instância isolada correspondente ao alvo de produção, sem dados reais. Registrar versões, configurações relevantes e resultados. Não declarar compatibilidade com base apenas no teste local.

## ADR-002 — Monólito modular

Problema: separar responsabilidades sem custo operacional prematuro. Opções: serviços distribuídos ou módulos em uma API. Recomendação: monólito modular, npm workspaces e contratos puros compartilhados. Facilita testes e VPS única; módulos exigem disciplina de imports. Arquitetura proposta para aprovação nesta Fase 0.

## ADR-003 — Revisões e publicação

Problema: editar livro publicado não pode alterar conteúdo público. Opções: uma linha mutável com status; revisões e snapshot. Recomendação: identidade Book, BookVersion e ponteiros explícitos desde a Fase 1; snapshot na Fase 10. Há algumas relações extras, mas evita migração destrutiva do conceito editorial. Library/asset também precisam de imutabilidade nas referências publicadas.

## ADR-004 — Persistência

Problema: cenas evoluem, enquanto relações precisam de integridade. Opções: tudo JSON, tudo tabelas ou híbrido. Recomendação: relações/identidades/ordem em tabelas; cenas/timeline/definições em JSON validado. Sem ORM inicialmente; SQL parametrizado em repositórios. A validação semântica continua obrigatória fora do banco.

## ADR-005 — Escopo e gates da Fase 0 (histórico, substituído no fechamento de 11/10)

O checklist integral vigente inclui setup e validações executáveis. Consulte PHASE_0.md; a decisão documental abaixo é preservada apenas como histórico.

Problema: regras gerais pedem test/lint/build em toda fase, mas a seção 38 pede primeiro propostas e documentação. Decisão de escopo: entrega apenas documental, sem instalar stack antecipadamente. Registrar gates de aplicação como não executáveis, nunca aprovados. Aceite documental depende do usuário; setup executável entra na Fase 1 e terá todos os gates. Nenhuma funcionalidade de Fase 1 foi iniciada.

## Riscos e inconsistências

- O serviço “MySQL” do XAMPP fornece MariaDB; o binário encontrado é MariaDB 10.4.32. MySQL 8 não é equivalente. Validar migrations tanto no MariaDB local quanto no alvo MariaDB de produção.
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

1. Login/perfis implementados a pedido do usuário em 26/09/2026: administrador, editor e revisor. Livros compartilhados pela equipe; segregação por livro e MFA/SSO permanecem possíveis evoluções.
2. Faixa etária terá limites livres ou categorias fixas? Proposta inicial: mínimo/máximo em anos.
3. Dimensões de página e política de encaixe serão fixas por livro? Proposta: proporção lógica por livro com coordenadas normalizadas.
4. Quais limites de upload, formatos de áudio e retenção de livros/assets? Definir antes desses fluxos.
5. Banco alvo definido na Fase 1: MariaDB 11.4 LTS, patch testado 11.4.13. A versão foi validada em instância isolada; a VPS Linux e sua configuração operacional continuam pendentes de implantação.

Credenciais serão configuradas localmente durante setup; não registrar senhas na documentação ou no chat.

## ADR-006 — Implementação da Fase 1

Autorizada em 24/09/2026. MariaDB 11.4 LTS escolhido como série mantida para produção; testes locais em 10.4.32 e alvo isolado 11.4.13. Evidências e fontes em DATABASE.md.

Runner próprio de migrations limitado a DDL simples: checksum, lock e registro running/complete. Falha parcial interrompe o avanço e exige reparo explícito. Aplicação usa usuário DML separado do migrator.

ESLint 10 com análise JSX nativa e plugin Hooks compatível; sem regra cosmética bloqueante. Playwright foi adicionado porque o fluxo crítico de produção editorial já existe na Fase 1. E2E usa build estático, evitando interferência de HMR durante alterações de arquivos.

Nome Entrelinhas é provisório de interface. Faixa etária inicial limitada a 0–18 anos; catálogo inicial permite cadastro/listagem de metadados, sem definições gráficas executáveis. Limites explícitos constam em PHASE_1.md.

## ADR-007 — Acesso e serialização explícitos

Ampliação autorizada em 26/09/2026: sessões opacas revogáveis no MariaDB, cookie HttpOnly/SameSite, hashes scrypt e autorização por ação no backend. Rotas internas são privadas por padrão, com schemas estritos e serializers por lista de campos permitidos. Administração de contas apenas para ADMIN; EDITOR produz e envia para revisão; REVIEWER consulta e devolve a rascunho. Sem token em JSON/localStorage.

Acesso inicial via bootstrap local que recusa contas existentes. Mudanças de perfil, desativação e senha revogam sessões. Compartilhamento interno de livros é explícito; não prometer isolamento por livro ainda inexistente. Defesa adicional no Vite limita arquivos servidos e bloqueia .env/.local/API. Detalhes, limites e referências em SECURITY.md.

## ADR-008 — Engine mínimo isolado e contrato de validação

Fase 2 autorizada: PixiJS 8.21.0, sem GSAP até haver animação executável. Cenas estritas de retângulos/elipses, coordenadas lógicas independentes do viewport, hierarquia e pivot relativo. Rotação em radianos e matrizes afins puras, com inversão explicitamente recusada para transform singular. Os livros persistidos mantêm entities vazio até evolução do contrato com editor de cenas; não aceitar dados que a interface ainda não produz. Renderer estático carrega sob demanda e libera recursos ao desmontar. Referências: [Application](https://pixijs.com/8.x/guides/components/application) e [Graphics](https://pixijs.com/8.x/guides/components/scene-objects/graphics).

## ADR-009 — Tema A como norma visual

Design System entregue durante a Fase 2 passa a reger interfaces existentes e futuras. Tokens, Inter local, Lucide e componentes reutilizáveis substituem o visual editorial verde anterior. A especificação funcional prevalece sobre exemplos ilustrativos de telas futuras: sem wizard vazio, upload fictício, publicação ou editores antecipados. Detalhes e escolhas de contraste em DESIGN_IMPLEMENTATION.md. Canvas/timeline escuros podem ser avaliados nas Fases 4–7, sem dark mode global agora.

## ADR-010 — Personagens definidos por dados, assets por referência

Fase 3: manifesto estrito com perspectivas opcionais, partes hierárquicas e anchors nomeados. Cada instância qualifica seus IDs e aplica um transform externo, preservando a definição reutilizável. Grupos não exigem textura; sprites recebem texturas resolvidas pela aplicação, nunca URLs vindas de manifesto. Cache com escopo de preview é suficiente nesta fase e evita descarte global de recursos usados por outras instâncias.

A validação visual usa fixture geométrica com PNG mínimo, em duas instâncias (original/espelhada) e duas perspectivas. Não antecipar importador, inspector ou animações do Playground. Todos os novos controles reutilizam o Tema A; publicação e persistência de cena permanecem nas fases respectivas. Referências: [Sprite](https://pixijs.com/8.x/guides/components/scene-objects/sprite) e [Textures](https://pixijs.com/8.x/guides/components/textures).

## ADR-011 — Pacote portátil, modelos imutáveis e snapshots de rig

Ampliação autorizada em 03/10/2026. Embalagem inicial .character.json com imagens base64 evita extração ZIP e dependências adicionais. Trade-off: maior uso de memória e limites explícitos de 25 MiB/pacote e 16 MiB de imagens. Importar cria cópia independente, incluindo novos IDs de assets/modelos. O formato pode receber outra embalagem versionada sem alterar a estrutura lógica.

Poses completas por keyframe simplificam captura e validação inicial; compatibilidade conservadora por partes/parent/pivot evita aplicar um movimento a um esqueleto estruturalmente distinto. GSAP fica no Engine, isolado em export próprio para não carregar renderer no backend. Modelos imutáveis e snapshots por revisão impedem que alterações na Biblioteca mudem páginas já salvas. Retenção e deduplicação ficam explícitas como evoluções. Não há tracks concorrentes nesta entrega.

## ADR-012 — Ações sequenciais e geometria atualizada

Primeiro incremento de 04/10/2026: separar ações de movimentos, objetos e eventos por nomes de domínio. Avaliador puro reconstrói transforms/vínculos por tempo; GSAP controla um relógio, evitando que o renderer se torne a única fonte das posições dos anchors. Pegar/soltar preserva matriz world, inclusive com rotação/espelhamento. Vínculo restrito objeto → personagem elimina ciclos nesta primeira versão. Não adicionar physics engine.

Usuário escolheu perfis por personagem com mapeamento de partes, poses/animações e imagens alternativas. Esse editor será implementado na etapa de gestos/expressões. Não inferir anatomia nem substituir expressões ausentes por movimentos genéricos. Catálogo completo e critérios em MOVEMENTS_AND_INTERACTIONS_PLAN.md.
