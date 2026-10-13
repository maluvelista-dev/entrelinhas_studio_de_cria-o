import { gsap } from 'gsap';
import { createInteractionRuntime } from './interaction.js';
export function createScenePlayer(input,onFrame,onError=null) {
  const runtime=createInteractionRuntime(input), clock={ time:0 }; let closed=false;
  const emit=() => {try {onFrame(runtime.at(clock.time));}catch(error) {tween.pause();if(onError) onError(error);else throw error;}};
  const tween=gsap.to(clock,{ time:runtime.duration, duration:runtime.duration, ease:'none', paused:true, immediateRender:false, onUpdate:emit });
  const check=() => { if (closed) throw new Error('Player encerrado.'); };
  return { duration:runtime.duration,
    play() { check(); if (!runtime.duration) emit(); else if (tween.progress()===1) tween.restart(); else { emit(); tween.play(); } },
    pause() { check(); tween.pause(); },
    seek(time) { check(); if (!Number.isFinite(time)) throw new Error('Tempo inválido.'); tween.pause().time(Math.max(0,Math.min(runtime.duration,time)),true); emit(); },
    reset() { check(); tween.pause(0,true); clock.time=0; onFrame(runtime.initial()); },
    destroy() { if (!closed) { closed=true; tween.kill(); } },
  };
}
