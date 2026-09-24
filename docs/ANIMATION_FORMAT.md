# Formato de animação — proposta

Animações são dados versionados com ID, duração e tracks. Cada track informa target, propriedade permitida e keyframes com tempo em segundos, valor e easing autorizado. Rotação interna em radianos. AnimationPlayer converte tracks validadas em GSAP; a UI envia comandos de play/pause/reset e não manipula frames.

AnimationRegistry, MovementRegistry e InteractionRegistry registram ações explicitamente. Não executar JavaScript recebido em JSON. Compatibilidade exige targets/partes existentes e propriedades suportadas. Política para tracks simultâneas e prioridade será validada antes da timeline, evitando dois controladores alterando a mesma propriedade sem regra.

Primeiros presets futuros: idle, blink, wave e jump. Poses representam transforms das partes; interpolação aparece na fase própria. Playback e exportação precisam compartilhar relógio controlável e seek determinístico, sem acoplamento ao tempo real do navegador.

Aceite futuro: rejeitar tempos negativos, NaN, targets desconhecidos, easing não registrado e propriedades inválidas; testar reset, cancelamento, descarte e serialização. Aceite visual obrigatório para cada animação.
