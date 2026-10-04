import { gsap } from 'gsap';
import { animationSchema } from '@studio/schemas/motion';
export function createAnimationPlayer(raw, onFrame) {
  const animation = animationSchema.parse(raw);
  const states = animation.keyframes[0].transforms.map(value => ({ ...value }));
  let closed = false;
  const emit = () => onFrame(states.map(({ id, x, y, rotation, scaleX, scaleY, opacity }) => ({ id, x, y, rotation, scaleX, scaleY, opacity })));
  const timeline = gsap.timeline({ paused: true, onUpdate: emit });
  for (let i = 1; i < animation.keyframes.length; i++) {
    const from = animation.keyframes[i-1], to = animation.keyframes[i];
    for (const state of states) {
      const start = from.transforms.find(p => p.id === state.id), end = to.transforms.find(p => p.id === state.id);
      const values = value => ({ x: value.x, y: value.y, rotation: value.rotation, scaleX: value.scaleX, scaleY: value.scaleY, opacity: value.opacity });
      timeline.fromTo(state, values(start), { ...values(end), duration: to.time - from.time, ease: animation.ease, immediateRender: false }, from.time);
    }
  }
  function assertOpen() { if (closed) throw new Error('Player encerrado.'); }
  emit();
  return {
    duration: animation.duration,
    play() { assertOpen(); if (timeline.time() >= animation.duration) timeline.restart(); else timeline.play(); },
    pause() { assertOpen(); timeline.pause(); },
    seek(time) { assertOpen(); if (!Number.isFinite(time)) throw new Error('Tempo inválido.'); timeline.pause().seek(Math.max(0, Math.min(animation.duration, time)), true); emit(); },
    reset() { assertOpen(); timeline.pause(0, true); states.forEach((state, index) => Object.assign(state, animation.keyframes[0].transforms[index])); emit(); },
    destroy() { if (!closed) { closed = true; timeline.kill(); } },
  };
}
