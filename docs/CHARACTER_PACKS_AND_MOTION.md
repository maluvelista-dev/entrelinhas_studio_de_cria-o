# Personagens completos, poses, animações e páginas

Ampliação solicitada em 03/10/2026: salvar/importar personagens rigados completos, criar poses/animações reutilizáveis e inserir personagens nas páginas. Entrega o escopo autorizado que atravessa partes das Fases 4–6. Não declara concluídas a timeline multipista nem todas as ferramentas previstas dessas fases. Mantém Tema A.

## Checklist de aceite manual

1. Em Biblioteca → Personagens, abra uma ficha → Perspectivas e partes. Carregue imagens, ajuste hierarquia, pivôs e anchors e salve a estrutura.
2. Em Poses e animações reutilizáveis, ajuste as partes e use Nome da pose → Salvar pose atual. Altere a montagem, selecione a pose salva e clique Aplicar pose. Confira que ela restaura os transforms.
3. Para uma animação, capture a montagem no tempo 0. Altere as partes, informe o próximo tempo em segundos e capture outro keyframe. Teste com Testar keyframes; confira reproduzir, pausar, seek e reset. Salve com um nome. Capturar novamente no mesmo tempo substitui aquele keyframe.
4. Experimente Respirar, Piscar, Acenar e Pular na parte selecionada: esses presets geram keyframes editáveis. Piscar deve ser aplicado a olhos e Acenar a um braço; não há reconhecimento automático de anatomia.
5. Salve a estrutura e volte à ficha. Exportar personagem salvo baixa um arquivo .character.json. Na área Personagens, use Importar personagem completo. Confirme imagens, perspectivas, hierarquia, pivôs e anchors na nova cópia.
6. Em um livro em rascunho → Páginas, adicione/abra uma página. Escolha Personagem da Biblioteca → Inserir personagem. Ajuste perspectiva, posição, rotação, escala, pose e animação. Atualize a prévia e salve a página.
7. Recarregue o navegador e confira texto e montagem. Altere apenas o texto e salve: os personagens devem permanecer. Reutilize o personagem e os modelos globais em outro livro.
8. Edite posteriormente a estrutura original: a página salva deve continuar usando sua versão anterior. Para adotar uma versão nova, remova a instância da página e insira o personagem novamente.
9. Entre como revisor: consulta e prévia disponíveis, mutações bloqueadas. Confira também o bloqueio editorial de livros em revisão.

Aceite visual com as ilustrações reais continua sendo responsabilidade da equipe; testes com sprites geométricos não aprovam automaticamente a qualidade artística dos movimentos.

## Pacote portátil

Formato v1 identificado por format=book-studio-character e version=1. Arquivo único JSON com nome, descrição, manifesto estrito, imagens PNG/WebP em base64 e modelos compatíveis de poses/animações. A embalagem inicial é JSON, sem ZIP ou caminhos locais. O manifesto mantém perspectivas e partes; as imagens são identificadas por ID. Limites: 25 MiB por arquivo, 16 MiB de imagens somadas, 128 imagens e 100 modelos. Cada imagem também passa pelos limites e normalização do importador de ilustrações.

O pacote exporta a estrutura salva, todas as imagens referenciadas por suas perspectivas e todos os modelos globais/do livro compatíveis com ela. Não inclui rascunhos de keyframes ainda não salvos, credenciais, caminhos de storage ou a miniatura independente da ficha. Exportação acima dos limites falha explicitamente. A importação cria um personagem novo, novos assets privados e novos IDs de modelos; não sobrescreve nem mescla cadastros existentes. Arquivos anteriores continuam preservados.

Na importação, referências completas, MIME real, decodificação de imagem, hierarquia, campos permitidos e compatibilidade são verificados antes do commit. Falhas de banco compensam arquivos após reconciliação. JSON não executa código, não baixa URLs e não extrai arquivos em caminhos fornecidos pelo pacote.

## Poses e animações

Contratos em packages/schemas/src/motion.js. Modelos são imutáveis e globais ou exclusivos de um livro. Reutilização exige a mesma perspectiva, IDs de partes, parentes e pivôs. Não há retargeting entre esqueletos diferentes; dimensões e proporções artísticas ainda exigem revisão visual. Salvar uma nova variação cria outro modelo.

Pose guarda posição local, rotação em radianos, escala e opacidade de todas as partes. Animação guarda entre 2 e 24 keyframes completos, de zero até a duração (0,1–60 segundos), com interpolação linear ou easing permitido. Escala não pode cruzar zero. Pivot, hierarquia, imagem, visibilidade e zIndex não são animados nesta versão.

GSAP 3.15.0 fica exclusivamente no AnimationPlayer do Engine. React envia comandos; não atualiza frames da animação. PixiJS recebe transforms qualificados por instância. Reset recupera a pose estática da prévia; play/seek aplica os keyframes. Ao sair da tela, players, renderer e texturas são liberados. A barra indica o tempo escolhido pelo seek, não acompanha continuamente o relógio durante reprodução.

## Composição de páginas

Página v2 guarda cena lógica, até oito instâncias e referências de personagem/revisão/perspectiva/pose/animação. O limite agregado do Engine continua 500 entidades. Cada instância tem transform independente e a ordem determina sobreposição. Página v1 continua legível; o editor converte para v2 ao salvar, preservando texto.

A primeira gravação captura a estrutura em character_snapshots por personagem/revisão. Alterar a Biblioteca não muda páginas já salvas. Assets e modelos são imutáveis; não há coleta automática dessas versões. O backend resolve todas as referências, verifica escopo e compatibilidade e valida transforms antes de salvar. Conflito de revisão exige recarregar; preview não salva snapshots.

A composição atual insere personagens e usa controles numéricos. Fundos/objetos, arraste de instâncias no canvas, áudio, interações, timeline multipista, publicação e exportação de páginas não fazem parte desta entrega. Animações das instâncias começam juntas, sem sequenciamento entre elas.

## API e arquivos principais

- GET /api/internal/library/:itemId/pack; POST /api/internal/character-packs (multipart).
- GET/POST /api/internal/templates; permissão library:read/write.
- POST /api/internal/books/:bookId/scene-preview; permissão books:read, sem persistência. A gravação usa os endpoints de página existentes com books:write e revisão.
- apps/api/src/modules/library/pack.js e templates.js: pacote e modelos.
- apps/api/src/modules/books/scene.js: resolução, escopo e snapshots.
- packages/engine/src/motion.js e animation-player.js: poses, presets e execução.
- apps/studio/src/components/MotionWorkbench.jsx, CharacterPack.jsx, PageScene.jsx e ScenePlayback.jsx: interface.

Sessão e proteção de origem permanecem obrigatórias; serializers estritos permitem apenas campos de conteúdo. Limite de uma importação de pacote simultânea por processo; exportação e base64 usam memória. Antes de operar com catálogos grandes, será necessário paginação de modelos e revisão dos limites. Backup deve incluir MariaDB e storage de forma consistente.
