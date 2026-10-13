# Auditoria das fases 0–2 — 11/10/2026

Referência: checklist integral fornecido pelo usuário em 11/10. Os aceites históricos em ROADMAP.md referem-se a escopos menores; não comprovam conclusão desta lista. Inspeção do código e evidências anteriores, sem alegar uma nova execução integral de todos os testes nesta auditoria.

## Fase 0

- Implementados: React/JavaScript, API Node, MariaDB, workspaces, separação Engine/Studio/API/Storage, scripts de desenvolvimento, Git, lint, testes, configuração e validação de ambiente, migrations, schemas, serializers, tratamento de erros e logs básicos.
- PixiJS escolhido e usado em prova de conceito e cenas. Contratos, coordenadas e diretórios documentados.
- Planejados: filesystem privado, assets imutáveis, referências para áudio/fontes/exportações e arquitetura de VPS Linux com proxy/TLS, processo Node e banco privado. VPS não implantada, o que não é exigido pelo item de planejamento.
- Atualização do fechamento: instalação limpa/build, 178 testes unitários/componentes, 15 integrações em cada MariaDB e 4 E2Es no Opera/dev aprovados. Caches isolados e resize corrigidos. Aceite da Fase 0 recebido em 11/10/2026; veja PHASE_0.md.
- Banco correto: MariaDB, fornecido pelo serviço “MySQL” do XAMPP; MySQL 8 não é equivalente. Há validação histórica das migrations nos alvos local e isolado de produção, sem comprovar implantação na VPS.

## Fase 1

| Requisito | Resultado |
| --- | --- |
| Múltiplos livros independentes | Implementado, com propriedade de assets e snapshots. |
| Título, descrição, capa, faixa etária | Cadastro/edição implementados. |
| Categoria editorial | Ausente do formulário e do contrato de metadados. |
| Criar/editar/ordenar páginas | Implementado. |
| Excluir/duplicar páginas | Não implementado. |
| Relações e biblioteca reutilizável | Implementadas; cenários/personagens/objetos globais ou vinculados ao livro. |
| Persistência | Implementada em MariaDB. |
| Quatro estados operacionais | Parcial. Apenas DRAFT ↔ REVIEW funciona; READY_TO_PUBLISH/PUBLISHED existem no enum, mas as transições são recusadas. |
| CRUD completo | Incompleto: não há exclusão de livros/páginas; duplicação de página também falta. |

O critério de dois livros independentes tem suporte e evidências de teste, mas não cobre os demais itens ausentes. A fase está parcial segundo o checklist atual. O roteiro anterior adiou publicação para a Fase 10 e exclusão até definir retenção; isso explica a diferença, sem converter pendências em funcionalidades entregues.

## Fase 2

| Requisito | Resultado |
| --- | --- |
| Canvas, sprites PNG/WebP e transparência | Implementados no Engine. |
| Cenários/personagens/objetos | Composição e referências persistidas implementadas. |
| Coordenadas, dimensões, escala, rotação e opacidade | Suportados pelo Engine. Página oferece posição/escala/rotação; edição geral de dimensões/opacidade ainda não está completa na UI. |
| Camadas | Engine usa zIndex; página possui ordenação limitada, sem painel completo de camadas. |
| Resoluções/proporções | Engine preserva proporção ao redimensionar e schema aceita dimensões; falta controle de formato de página no Studio. Conversão inicial usa 1024×768. |
| Dados separados do renderizador | Implementado em schemas/Engine e composição de snapshots. |
| Carregar/descarregar assets | AssetManager e ciclo de vida de renderer implementados. |
| Reabrir composição salva | Persistência/snapshots e testes existem, mas o fechamento operacional continua pendente com o erro reportado pelo usuário. |

## Prévia: evidência específica

Em 09/10, uma leitura do servidor real encontrou `gsap.js?v=713735c8` retornando HTTP 504. PixiJS e React retornavam 200. Corrigido o Vite para preparar GSAP/PixiJS no início e usar cache próprio; as novas URLs retornaram 200. Foi acrescentada execução E2E em modo dev com cache separado. O cenário de animação no Opera/dev passou, mas o servidor também registrou aviso de ResizeObserver. Em 11/10, o resize foi corrigido e quatro cenários Opera/dev passaram sem repetir o aviso; GSAP/PixiJS responderam HTTP 200 no servidor real. O usuário aprovou a Fase 0 em 11/10; esse aceite não equivale à execução automatizada no seu perfil pessoal.

## Ordem para recuperar o roteiro

1. Fechar o incidente da prévia no ambiente real e manter teste em modo desenvolvimento.
2. Consolidar este checklist como referência; diferenciar implementação, teste e aceite manual.
3. Completar lacunas editoriais da Fase 1, alinhando o papel dos estados finais com a publicação prevista na Fase 10 e a política de exclusão.
4. Fechar os controles básicos da página e a repetibilidade da renderização antes de ampliar animações/interações.
