# Movimentos e interações — guia de autoria

O catálogo contém 114 ações e 14 gestos/atividades, totalizando as 128 entradas solicitadas. IDs com o mesmo nome em domínios diferentes continuam separados, por exemplo `object.drag` e `input.drag`.

## Preparar o personagem

1. Abra **Biblioteca → Personagens → Abrir → Perspectivas e partes**.
2. Em **Perspectivas**, abra Frente ou crie outra vista. Em **Imagens e partes**, envie o PNG inteiro ou adicione partes com imagens próprias. **Articulação** é opcional: reúne hierarquia, pivôs e anchors. Em **Poses e ações**, escolha **Poses** ou **Animações** para criar os recursos necessários.
3. Em **Poses e ações → Ações e expressões**, selecione a ação e associe uma pose ou animação compatível. Para ações dirigidas como olhar/apontar, selecione também a parte orientada para o destino. O eixo local +X dessa parte aponta para o alvo; prepare a ilustração/rig considerando esse eixo.
4. Para uma expressão por imagem, adicione uma parte auxiliar, envie nela a imagem alternativa e deixe a opacidade dessa parte em zero. No mapeamento, selecione a parte visível que será substituída e a parte auxiliar que fornece a imagem. A substituição usa as dimensões da parte visível.
5. Clique **Associar capacidade** e **Salvar estrutura**. Uma nova associação da mesma ação substitui o mapeamento anterior. Remover/limpar capacidades não apaga as imagens nem os modelos da Biblioteca.

O autor prepara a aparência de andar, sorrir, abraçar etc. Não há reconhecimento automático de anatomia ou geração automática de rostos. A prévia e o salvamento rejeitam uma ação corporal sem o mapeamento exigido. Abraços e outros contatos entre personagens exigem capacidades nos dois participantes.

Mudar hierarquia, partes ou pivôs pode invalidar modelos já associados. Remova os mapeamentos afetados, ajuste a estrutura e prepare modelos compatíveis. Duplicar perspectiva também copia os mapeamentos para o novo identificador.

As capacidades ficam na estrutura: exportação/importação do personagem completo e snapshots de página as preservam. Na página, **Atualizar versão do personagem** carrega explicitamente a estrutura atual para o rascunho. Poses/animações incompatíveis são desmarcadas; anchors utilizados pela sequência precisam continuar válidos. Salvar a página confirma essa atualização. Outras páginas mantêm seus snapshots.

## Montar a sequência na página

Abra o livro → **Arte das páginas** e selecione a página. A aba **Páginas** cuida do texto; a composição e sua prévia ficam em **Arte das páginas**.

- Insira personagens e, se necessário, objetos/cenários da Biblioteca.
- As quatro ações originais continuam no controle de sequência. As demais estão em **Catálogo completo de ações**.
- Selecione participante, parceiro/objeto quando aplicável, destino, anchors e duração. Os campos dependem da ação.
- Para contato/apoio, use um anchor do outro elemento e um anchor do personagem. Para abrir/fechar/girar objetos, escolha o anchor que funciona como dobradiça/pivô.
- Adicione as ações, ajuste a ordem e use **Atualizar prévia da página**. Salve para persistir.

`moveTo` desloca a instância. Andar/correr/rastejar combinam o deslocamento com o movimento corporal mapeado. Saltos usam arco; cambalhotas e rolagens incluem rotação; cair usa aceleração narrativa. `flyPath` percorre os pontos em ordem. `wander` usa a região delimitada pelos pontos, ciclos e semente persistida para produzir um passeio reproduzível. `follow` acompanha o anchor animado do alvo durante sua duração.

Pegar conserva a posição global do objeto. Posicione a mão antes de pegar para evitar um objeto aparentemente distante da mão. Carregar exige posse prévia; soltar preserva a posição; arremessar solta e percorre um arco. Dar/receber transfere a posse exclusiva entre participantes. Prepare a aproximação e o contato nas ações/poses anteriores: não há ajuste automático de alcance dos membros. Colocar dentro oculta o objeto; retirar o revela e o vincula ao personagem. Empurrar/puxar/arrastar deslocam objeto e participante mantendo a relação inicial.

Pendurar e balançar mantêm o anchor de contato no apoio durante a ação. Esconder atrás usa a ordem das camadas; entrar/esconder dentro usam transição de opacidade. O cenário precisa ter uma ilustração adequada para produzir a oclusão desejada. Não há simulação de profundidade, colisão física ou recorte automático de um interior a partir de uma imagem.

Efeitos podem atuar no elemento selecionado ou em todos os elementos da cena. Brilho e partículas são desenhados pelo Engine e descartados junto com a prévia.

## Atividades da criança

Em **Gestos e atividades da criança**, selecione o tipo, configure a regra e clique **Aplicar regra de interação**. Atualize a prévia depois de aplicar.

| Tipo | Regra |
| --- | --- |
| tap / doubleTap | Toque curto sem arraste; toque duplo exige dois toques próximos no tempo e espaço. |
| press / hold | Pressão inicial ou pressão mantida pelo tempo configurado; mover/cancelar invalida o hold. |
| drag | Arraste até a distância mínima. |
| drop | Arraste a origem até o destino correto, respeitando distância e tolerância. |
| swipe | Distância e direção configuradas, concluídas em até um segundo. |
| trace | Siga o caminho visível, na ordem e dentro da tolerância. Atalhos e desvios são rejeitados. |
| choose | Escolha qualquer uma das respostas corretas configuradas. |
| find / collect | Encontre todos os elementos esperados; repetições não somam pontos. |
| match | Selecione origem e destino de cada par correto. |
| sort | Selecione os elementos na ordem configurada; erro reinicia a tentativa. |
| assemble | Arraste e encaixe todas as peças nos destinos ou selecione pares por teclado. |

O sucesso executa a sequência. Sem ações de resposta, o resultado do arraste/encaixe permanece visível até reiniciar. Com ações, a resposta parte da composição salva da prévia. Tentativas não alteram o livro, não persistem progresso e não coletam identidade/dados de crianças.

No canvas, Tab dá foco, setas movem o cursor e Espaço pressiona/solta; Escape cancela. Os botões de elementos permitem escolher, combinar, ordenar e montar por teclado. **Reiniciar atividade** limpa a tentativa e restaura a composição. Pausa/busca temporal controlam a resposta animada, não o tempo de pressão do gesto.

## Limites e critérios de aceite

- Uma sequência e uma regra de início por página; até 32 ações e 120 segundos por sequência, com duração de 0,1–30 segundos por ação temporizada.
- Até 8 personagens e 24 objetos/cenários por página; até 64 pontos por caminho e 24 respostas/pares por atividade.
- Ações são sequenciais. O corpo mapeado não pode disputar transforms com uma animação contínua selecionada na mesma instância; a API rejeita esse conflito. Deslocamento de raiz com uma animação contínua de partes continua permitido quando não há capacidade corporal concorrente.
- Não há physics engine, navegação por obstáculos, IK automático, áudio ou timeline multipista nesta entrega.
- Aceite manual do usuário e avanço de fase continuam separados da validação automatizada.

### Checklist manual

1. Mapear sorriso com imagem alternativa e aceno com animação; salvar, reabrir, exportar e importar o personagem.
2. Inserir o personagem na página; testar sorriso, salto, rotação, percurso e um efeito. Buscar para frente/trás e resetar.
3. Aproximar mão/objeto, pegar, carregar, transferir para outro personagem e soltar. Conferir anchors com rotação/escala espelhada.
4. Experimentar um apoio e um contato entre personagens; verificar mensagens para capacidades ou anchors ausentes.
5. Configurar um gesto e uma atividade; testar resposta errada, correta, repetida e reset, com mouse/toque e teclado.
6. Salvar/reabrir o livro e editar somente o texto: composição e regras devem permanecer.
7. Alterar o personagem na Biblioteca: a página anterior deve manter seu snapshot até a atualização explícita.
8. Em revisão e com usuário Revisor, confirmar que os controles de edição ficam bloqueados e a consulta continua disponível.

## Cadastro com uma imagem inteira

Em **Biblioteca → Personagens**, use **Novo personagem** para preencher a ficha e seguir para as perspectivas, ou **Começar com um PNG** para cadastrar a ilustração inteira. Na estrutura, abra **Frente → Enviar imagem inteira desta perspectiva → Salvar imagem**. O upload salva a imagem e a estrutura; não exige partes, pivôs ou anchors. Para imagens cadastradas pelo catálogo, a imagem inicial é sugerida na Frente: clique **Salvar estrutura** para persistir essa montagem.

Um PNG de 3 KB cabe no limite atual. Imagens aceitam PNG/WebP de até 10 MiB e 4096 × 4096 pixels. O limite de 25 MiB pertence ao pacote `.character.json` importado/exportado entre Studios, com até 16 MiB de imagens e 128 arquivos. Os limites não foram aumentados: são fluxos diferentes, agora identificados na interface. O Studio não separa automaticamente uma imagem em membros.

Para verificar o fluxo simplificado: crie um personagem, abra Frente, envie um PNG inteiro, salve e reabra. A imagem deve permanecer na mesma perspectiva, sem exigir articulação. Adicione Lateral somente se precisar de outra vista.
