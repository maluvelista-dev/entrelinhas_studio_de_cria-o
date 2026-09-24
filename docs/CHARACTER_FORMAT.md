# Formato de personagem — proposta para Fase 3

Manifesto com `schemaVersion`, `id`, perspectivas disponíveis e coleção de partes. Cada parte tem ID único, assetId, parentId opcional, posição, rotação em radianos, scaleX/scaleY, opacity entre 0 e 1, pivot relativo à dimensão do asset, zIndex e visible. Root movimenta o conjunto; transformações se propagam apenas aos descendentes.

Anchors nomeados pertencem a uma parte e informam espaço de coordenadas. Referências `entityId.anchorName` são resolvidas por IDs, sem interpretar código. Convenção proposta: origem superior esquerda, X para direita e Y para baixo. Ângulos da UI podem ser exibidos em graus, convertidos na fronteira do Engine.

Um pack pode conter `character.json`, `front/`, `side/` e `back/`; não exigir perspectivas ausentes. Paths do pack são relativos e validados antes de importação. Packs, rigging e pivots visuais não são implementados agora.

Aceite futuro: rejeitar ciclos/parents inexistentes, IDs duplicados, números não finitos e assets ausentes; validar transforms hierárquicos, anchors e serialização. Publicações congelam a definição utilizada, mesmo se a Library mudar depois.
