# Formato de poses e animações — versão 1

Implementado no escopo autorizado em 03/10/2026. Contratos executáveis em packages/schemas/src/motion.js; instruções e limites em [CHARACTER_PACKS_AND_MOTION.md](CHARACTER_PACKS_AND_MOTION.md).

Um modelo contém id, name, kind (POSE ou ANIMATION), ownerBookId e definition. Definition inclui schemaVersion=1, perspective e skeleton: IDs, parents e pivôs. Poses incluem transforms completos por parte (id, x, y, rotation, scaleX, scaleY, opacity). Animações incluem duration, ease e keyframes com time e transforms. Rotação é em radianos; tempos em segundos. Essa primeira versão captura poses completas em cada keyframe, em vez de tracks arbitrárias por propriedade.

Compatibilidade exige IDs, hierarquia e pivôs iguais na mesma perspectiva. Modelos persistidos são imutáveis. Duração entre 0,1 e 60 segundos, 2–24 frames, primeiro tempo zero, último igual à duração, tempos crescentes. Easing permitido: none, sine.inOut, power1.inOut. Escalas não cruzam zero. Campos extras e JavaScript não são aceitos.

AnimationPlayer traduz os dados para uma [timeline GSAP](https://gsap.com/docs/v3/GSAP/Timeline/) pausada e fornece play, pause, seek, reset e destroy. Atualiza o renderer diretamente; React não controla frames. Presets registrados: idle, blink, wave e jump. A montagem da página admite uma animação por instância, iniciadas juntas na prévia. Timeline multipista, conflitos entre tracks, movimentos por targets e interações continuam futuros.

Testes cobrem captura sem mutação da origem, rejeição de estrutura incompatível, interpolação/seek retroativo/reset/descarte, persistência, reutilização, pacote e execução real no navegador. Aceite visual humano com a arte final continua obrigatório.
