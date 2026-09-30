# Formato de personagem — Fase 3, schemaVersion 1

Contrato implementado em packages/schemas/src/character.js, independente da Library e do documento persistido de página. O editor autorizado em 30/09/2026 salva o manifesto na Biblioteca; a tela de validação continua usando uma fixture técnica. Consulte [CHARACTER_EDITOR.md](CHARACTER_EDITOR.md).

## Definição e partes

Campos: schemaVersion, id, name, width, height e perspectives. Dimensões lógicas até 4096; uma a oito perspectivas com id, rootId, parts e anchors. Não exigir front/side/back simultaneamente. O exemplo oferece front e side.

Cada perspectiva contém uma a 128 partes. Toda parte declara id, parentId (null somente no root), assetId (null para grupo) e position {x,y}. Defaults: rotation=0 em radianos, scaleX/scaleY=1, pivot={x:0,y:0}, opacity=1, visible=true e zIndex=0. Pivot é relativo à dimensão intrínseca do asset antes de escala/rotação. Grupos usam as dimensões lógicas da definição.

Campos desconhecidos são rejeitados. IDs de partes/perspectivas não contêm pontos ou barras; são nomes lógicos, nunca paths. AssetId aceita também UUID cadastrado; o editor persistido exige UUID para imagens. Rejeitar versões desconhecidas, duplicados, partes desconectadas, parent ausente, ciclos, pivôs fora de 0–1 e números não finitos. A instanciação também rejeita assets ausentes e transforms acumulados fora dos limites.

## Instância e hierarquia

createCharacter(definition, {id, perspective, transform}, assets) produz definição validada, partes resolvidas e entidades para o renderer. transform aceita x, y, rotation, scaleX e scaleY. Não modifica os objetos recebidos.

Root movimenta o conjunto; rotacionar um braço afeta seus descendentes sem alterar cabeça/corpo/pernas. Escala negativa espelha. visible e opacity propagam visualmente; não removem anchors. zIndex ordena irmãos, sem achatar a hierarquia.

IDs internos incluem o ID da instância. Na composição de vários personagens, IDs de instância precisam ser únicos; sceneSchema rejeita colisões. O limite global permanece 500 entidades, incluindo grupos e marcadores.

## Anchors

Até 128 por perspectiva: name único, partId, position e coordinateSpace ('local' ou 'normalized'). Normalizadas são multiplicadas pelas dimensões da parte antes da transformação world. Anchors podem ficar fora da imagem; pivot permanece limitado a 0–1.

resolveAnchor(character, 'instanceId.anchorName') retorna {x,y} na cena lógica, antes do ajuste ao viewport. Exemplo: original.handRight. Referência inválida resulta em erro explícito, nunca execução de código. Attach/detach e targets interativos permanecem na Fase 8.

## Assets e recursos

Manifestos contêm apenas assetId. Catálogo controlado pela aplicação fornece kind, width, height, color e, para sprite, source. Formas geométricas são fixtures técnicas; Sprite permite partes PNG/WebP.

AssetManager recebe loader/destroy por injeção, deduplica carregamentos simultâneos, permite retry após falha e libera recursos inclusive quando o carregamento termina após desmontagem. O adaptador browser aceita PNG/WebP cadastrados da mesma origem e imagens base64 PNG/WebP embarcadas pela aplicação. Não recebe URLs do manifesto.

Cada manager é dono de suas texturas, sem invalidar outros previews pelo cache global do Pixi. Destruir sprites antes do manager. Imagens decodificadas são limitadas a 4096×4096; o importador aplica os limites descritos em ILLUSTRATIONS.md.

Um pack futuro poderá conter character.json e front/side/back. ZIP, extração e paths externos não foram implementados. Upload individual de imagens e rigging visual estão disponíveis conforme ILLUSTRATIONS.md e CHARACTER_EDITOR.md. Publicações futuras devem congelar definição e assets utilizados.

## Visualização de validação

Visualização → Personagem mostra original e cópia espelhada, com braço direito a −90°. Quadrados azuis identificam pivôs; círculos âmbar, anchors. A tabela apresenta referências e coordenadas world. O personagem geométrico valida correção técnica; não é arte final.
