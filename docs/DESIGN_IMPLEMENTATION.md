# Aplicação do Design System

A fonte normativa é [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), entregue pelo usuário em 26/09/2026. Tema A é a direção visual, não uma reprodução pixel-perfect. A referência ilustrada não autoriza funções fora do roteiro.

## Decisões registradas

- Manter a marca provisória Entrelinhas. Não copiar nomes, personagens, capas ou números da referência.
- Tokens em apps/studio/src/styles/tokens.css. Layout em styles.css; componentes usam classes e variantes. As cores de conteúdo da cena ficam no exemplo do Engine, não são cores da interface.
- Inter local em pesos 400/600/700, sem depender de serviço externo de fontes. Lucide é a única biblioteca de ícones.
- Índigo funcional, ciano para informação, neutro para rascunho, azul para revisão, âmbar para pronto e verde para publicado. Os dois últimos têm apresentação preparada no StatusBadge, mas continuam sem ações de workflow nesta fase.
- Usar tons textuais mais escuros e índigo #4F46E5 no botão principal para legibilidade com texto branco pequeno; #6366F1 continua sendo a identidade de seleção/foco. Vermelho não aparece como decoração da interface.
- Componentes introduzidos conforme uso: Button, StatusBadge, BookCard, EmptyState, Skeleton e Toast. Tabs e controles de navegação mantêm semântica própria; inputs compartilham tokens e CSS.
- BookCard não inventa faixa etária ausente no DTO de listagem. Exibe contagem de páginas, data e uma capa tipográfica explicitamente provisória. Menu de ações não existe enquanto não houver ações correspondentes.
- Manter formulário único de livro com os campos aceitos atualmente. Wizard, idioma, categoria e upload da referência dependem de evolução funcional. Não criar etapas vazias.
- Erro de faixa etária aparece ao lado do grupo de campos e é associado via aria-describedby; falhas gerais da API continuam em alerta com opção de recarregar. Toast serve para confirmação, pode ser fechado e não captura foco.
- Sem dark mode. Uma área de trabalho escura apenas para canvas/timeline poderá ser experimentada nas Fases 4–7, mediante avaliação nessa etapa.
- A Visualização da Fase 2 usa renderer real; não se apresenta como Scene Editor ou Animation Playground.

## QA visual

Capturas automatizadas em três resoluções desktop e inspeção visual realizadas nesta entrega; checklist abaixo fica para aceite humano.

- [ ] Estante: alinhamento, altura uniforme, títulos longos, status com texto, hover e foco.
- [ ] Formulário: labels, acentos, erro nas idades, submit, cancelamento e dados preservados após erro.
- [ ] Páginas: lista, seleção, ordenação, área de texto e feedback de salvamento.
- [ ] Revisão: rascunho/revisão distinguíveis por texto; bloqueio de edição compreensível.
- [ ] Biblioteca: cadastro, lista, estado vazio e mensagem de consulta para revisor.
- [ ] Acessos: formulário legível, perfil explícito, controle de acesso ativo e reset de senha.
- [ ] Login: foco inicial, labels, erro e estado Entrando.
- [ ] Estados gerais: skeleton, erro de API, toast fechável e navegação por teclado.
- [ ] 1366×768, 1440×900 e 1920×1080; 390px apenas como regressão de navegação e formulários.

Capturas de página inteira podem mostrar a sidebar sticky na posição do scroll no momento da captura; isso não representa uma lacuna no viewport em uso.
