# Movimentos e interações — especificação de implementação

Solicitação de 04/10/2026. Estado deste documento: proposta técnica revisável; a lista abaixo ainda não está implementada. Escopo integral solicitado: 128 entradas em 12 categorias, contando nomes iguais em contextos distintos. lookUp/lookDown, fadeIn/fadeOut e grow/shrink são ações separadas.

## Diagnóstico do código existente

- Página v2 persiste apenas instâncias de personagens e uma animação por instância. Não há objetos/cenários inseríveis nem regras de eventos persistidas.
- Os quatro presets de motion.js geram transformações de uma parte: idle, blink, wave e jump. Isso não entrega os comportamentos completos da lista, como salto com destino ou aceno adaptado automaticamente a qualquer anatomia.
- resolveAnchor usa as matrizes produzidas na instanciação; animações atualizam o renderer diretamente. Interações precisam de um estado geométrico compartilhado e atualizado, para que uma mão em movimento realmente carregue um objeto.
- Não há relógio de cena único, resolução de conflitos, attach/detach, posse de objeto, variantes visuais por estado ou avaliador de atividades infantis.
- Páginas v1/v2 e pacotes de personagens v1 devem continuar funcionando. A conversão editablePage atualmente zera arrays reservados; precisará preservar os dados novos, com testes de ida e volta.

## Contrato proposto

Ações e gatilhos têm identificadores separados por domínio (por exemplo object.drag e input.drag). As interfaces exibem rótulos em português. A presença de um nome nesta especificação não autoriza mostrá-lo como funcional na UI. O registro executável só aceitará ações entregues e testadas.

Uma ação versionada referencia ator/objeto por ID de instância, target tipado (ponto lógico, entidade, anchor ou caminho), parâmetros específicos, instante/duração, modelo corporal opcional e política de conclusão. Cada tipo terá schema próprio e rejeitará propriedades irrelevantes, código, URLs e valores não finitos. Referências entre entidades usarão IDs estáveis; nenhuma resolução por nome de exibição.

Pontos fixos são resolvidos no início; follow/followCharacter acompanham o estado atual do alvo. Caminhos de flyPath/wander são limitados e wander usa seed persistida, permitindo replay. Todas as rotinas contínuas exigem duração ou condição de término limitada. Seguir a si mesmo, ciclos de dependência e ciclos de attachment são inválidos.

Eventos da criança disparam ações ou atividades definidas no Studio. Cada binding informa entidade/zona sensível, evento, condições permitidas e resposta. Atividades têm schema específico: pares corretos (match), ordem/grupos (sort), peças/destinos (assemble), conjunto esperado (collect/find), opções (choose), trajetória/tolerância (trace). Estado da tentativa fica na prévia, sem alterar o livro mestre nem criar contas/dados de crianças.

## Decisões de produto antes da implementação dependente

### Corpo e rosto

Problema: uma imagem ou partes com IDs livres não revelam quais são olhos, asas, mãos ou expressões disponíveis.

Opção A, recomendada: perfil de capacidades por personagem/perspectiva, com mapeamento de partes, anchors, poses/clips e imagens alternativas. O autor associa, por exemplo, mão direita a handRight e smile a uma imagem/pose preparada. Permite diferentes anatomias, inclusive animais. Custo: editor de mapeamento e evolução versionada dos pacotes/snapshots.

Opção B: somente poses/clips manuais, sem imagens alternativas. Menor mudança no contrato, mas sorrir/chorar/abrir boca ficam limitados ao que se obtém transformando as imagens atuais.

Não haverá geração automática de ilustrações ou reconhecimento de anatomia implícito. Uma ação sem os recursos necessários exibirá o requisito que falta; não será substituída silenciosamente por balançar o personagem inteiro. A escolha foi enviada ao usuário; permanece a confirmar.

### Física e contato

Manter a regra original de não introduzir physics engine. Throw, bounce, fall, push e pull usam trajetórias e contatos definidos pelo autor. Não haverá detecção automática de obstáculos, navegação por terreno, gravidade física ou colisão realista nesta etapa. Alcance impossível entre membros deve ser informado; sem prometer IK automático.

### Tempo e conflito

Relógio único do Engine controla transforms, animações corporais, vínculos e eventos. Movimento da instância pode combinar com animação de suas partes. Duas ações no mesmo canal/propriedade não se sobrescrevem por ordem acidental: rejeitar sobreposição incompatível no autor ou exigir sequência explícita. Interações compostas reservam canais de todos os participantes. Play/pause/seek/reset/cancel devem reproduzir o mesmo resultado para os mesmos dados.

O núcleo temporal necessário entra como dependência deste pedido. Um editor completo de timeline multipista permanece uma entrega própria; não será alegado como concluído apenas por existir um relógio.

## Inventário integral solicitado

| Categoria | Identificadores solicitados | Dependências / parâmetros |
| --- | --- | --- |
| Locomoção | `walkTo`, `runTo`, `moveTo`, `jump`, `jumpTo`, `hop`, `crawl`, `sneak`, `backAway`, `follow`, `wander` | Ponto, instância ou anchor; duração/velocidade; ciclo corporal compatível para locomoção articulada. |
| Acrobáticos | `somersault`, `roll`, `spin`, `slide`, `bounce`, `fall`, `trip`, `land` | Deslocamento, rotação, amplitude e pose de chegada; trajetória narrativa controlada. |
| Escalada | `climb`, `climbTo`, `descend`, `hang`, `swing`, `jumpOff`, `balanceOn` | Anchors de apoio e contato, corpo compatível e vínculos de sustentação. |
| Animais voadores | `takeOff`, `flyTo`, `flyPath`, `hover`, `landOn`, `flapWings` | Caminho/ponto/anchor de pouso e mapeamento de asas quando a ação as movimenta. |
| Expressões corporais | `lookAt`, `lookAround`, `lookUp`, `lookDown`, `turnTo`, `nod`, `shakeHead`, `tiltHead`, `shrug`, `tremble`, `celebrate`, `dance`, `laugh`, `cry`, `yawn`, `sleep`, `wakeUp` | Mapeamento de partes e poses/clips próprios do personagem; estado inicial/restauração explícitos. |
| Expressões faciais | `blink`, `wink`, `smile`, `sad`, `angry`, `scared`, `surprised`, `curious`, `thinking`, `excited` | Partes faciais, poses e/ou imagens alternativas definidas pelo autor; sem inferir anatomia de PNG. |
| Gestos | `wave`, `pointAt`, `reachFor`, `clap`, `raiseHand`, `coverEyes`, `coverMouth`, `handsOnHips` | Braços/mãos ou patas mapeados; targets e offsets nos gestos dirigidos. |
| Entre personagens | `hug`, `holdHands`, `highFive`, `followCharacter`, `give`, `receive`, `helpUp`, `pushCharacter`, `pullCharacter`, `leanOn`, `hideBehind` | Dois participantes, anchors de contato, clipes compatíveis e regras de autoridade sobre cada transform. |
| Objetos | `grab`, `release`, `carry`, `throw`, `catch`, `push`, `pull`, `drag`, `open`, `close`, `placeOn`, `placeInside`, `takeFrom`, `shake`, `rotate` | Objetos inseríveis, anchors, estados/poses e posse exclusiva; transferência atômica. |
| Ambiente | `sitOn`, `lieOn`, `enter`, `exit`, `hideInside`, `hideBehind`, `peekFrom`, `leanAgainst`, `standOn` | Superfícies, áreas de entrada/interior e camadas/máscaras configuradas; sem colisões físicas automáticas. |
| Interação da criança | `tap`, `doubleTap`, `press`, `hold`, `drag`, `drop`, `swipe`, `trace`, `choose`, `match`, `sort`, `find`, `collect`, `assemble` | Gatilhos de ponteiro/toque e atividades com respostas, tolerâncias, encaixes e regras de conclusão configuradas. |
| Cena/efeitos | `shake`, `pulse`, `glow`, `fadeIn`, `fadeOut`, `grow`, `shrink`, `float`, `sway`, `sparkle`, `appear`, `disappear` | Alvo de cena/objeto, parâmetros limitados, duração e descarte de filtros/partículas. |

## Sequência de entregas e aceite

### 1. Fundação executável e primeiros fluxos

Schemas versionados; targets; relógio único; estado atualizado de transforms/anchors; registros explícitos; composição de objetos/cenários necessária às interações; anchors de objetos; anexar/desanexar preservando a posição world. Primeiro percurso de ponta a ponta: personagem moveTo até um anchor, grab de um objeto, carry ao mover-se e release mantendo a posição final. Primeiro binding: tap em uma entidade inicia esse percurso na prévia interativa.

Studio: inserir objeto, configurar anchor/target/ação/gatilho, pré-visualizar, salvar e reabrir. API valida todas as referências, compatibilidade, escopo e revisão; serializers continuam obrigatórios. Aceite: mão animada carrega objeto sem saltos; soltar conserva transform; espelhar/rotacionar ancestral funciona; reset restaura cena; permissões e estados editoriais impedem mutações indevidas. Nada será persistido como registro executável vazio para antecipar os outros nomes.

### 2. Locomoção e acrobacias

Todas as ações das duas categorias; paths, salto com arco, destinos, seguimento e aleatoriedade reproduzível. Walk/run/crawl/sneak combinam deslocamento com ciclo corporal preparado; não equivalem a deslizar uma imagem parada. Aceite: chegada correta, cancelamento, follow com alvo móvel, seed e seek repetíveis; falha clara quando falta um ciclo necessário.

### 3. Escalada e voo

Todas as ações dessas categorias, com anchors atualizados, transições de apoio, trajetórias e asas mapeadas. Aceite: hang/swing/landOn seguem suporte móvel e hierarquias transformadas; jumpOff remove vínculo e preserva pose/posição inicial; flapWings realmente atua nas partes configuradas.

### 4. Gestos, expressões corporais e faciais

Todas as ações dessas categorias, usando perfil do personagem. Variantes de imagens dependem da escolha de produto acima. Aceite por personagem/perspectiva: partes corretas, pose de chegada, restauração opcional e assets disponíveis; imagens internas permanecem isoladas e são exportadas/importadas no pacote versionado.

### 5. Personagens, objetos e ambiente

Todas as ações dessas categorias. Posse e transferência de objetos, composição coordenada entre atores, estados open/close, pontos de apoio, interiores e oclusão. Give/receive são lados coordenados de uma única transferência: objeto não pode ter dois donos. Catch exige objeto em trajetória e janela de recepção configurada. HideInside precisa de uma região/máscara; reduzir opacidade do ator não substitui o comportamento de entrar em um recipiente.

Aceite: contatos e transições visuais corretos; nenhuma referência quebrada, ciclos ou saltos de posição em attach/detach; reset/seek restaura posse, hierarquia e visibilidade.

### 6. Entrada da criança e atividades

Todos os eventos e atividades da lista. Separar tap de doubleTap; press de hold; capturar ponteiro durante drag e tratar cancelamento; drop avalia destino e tolerância; swipe verifica distância/direção. O Studio configura objetivos e feedback das atividades, com alternativas de teclado adequadas.

Aceite: testes com mouse, toque e teclado; tentativas corretas/incorretas; conclusão única; reset; nenhuma mudança no documento mestre durante jogo; limites de eventos impedem cascatas infinitas. Prévia interativa interna apenas: API pública/mobile/publicação continuam fora deste pedido.

### 7. Efeitos e fechamento do catálogo

Todos os efeitos solicitados, com suporte a alvo de cena e entidade. Glow/sparkle exigem recursos visuais reais e descarte correto, não aliases de escala/opacidade. Aceite: limites de partículas e filtros, frame/seek determinísticos, ausência de recursos retidos após navegar, efeitos concorrentes por canais validados e preservação do Tema A.

Cada entrega termina com testes, lint, build, checklist visual e relatório, conforme o processo original. A próxima só avança após o aceite exigido no roteiro. A solicitação autoriza trabalhar nesta ampliação; a escolha de perfil visual é uma decisão de conteúdo, não nova autorização genérica para programar.

## Critérios transversais

- Unitários: matemática com rotação/espelhamento e anchors móveis; ações determinísticas; conflitos, ciclos, targets inválidos; máquina de estado das atividades; cancelamento e reset.
- Integração: round-trip dos contratos antigos/novos; snapshots; importação de pacotes; permissões; escopo; rollback; serializers; conflito de revisão. Migrations no MariaDB local (serviço “MySQL” do XAMPP) e alvo mantido MariaDB de produção isolado. MySQL 8 não é equivalente.
- E2E: configurar → executar → salvar → recarregar; gestos de ponteiro/toque; navegação sem erros; limites de viewport; ausência de efeitos sobre livros reais durante testes.
- Aceite visual com arte real por família de ação. Nenhuma ação é concluída apenas porque foi registrada ou recebeu um botão.
- React controla formulários/comandos; GSAP/PixiJS e estado geométrico ficam no Engine. Sem eval/new Function, código em JSON ou URLs externas fornecidas por ações.

## Limites desta especificação

Este documento não altera schemas persistidos, banco ou interfaces. Não implementa ações novas. Não substitui os gates executáveis por uma lista de nomes. A escolha visual deve ser resolvida antes de implementar perfis/variantes de personagem; o plano de dependências e critérios acima já está pronto para revisão.
