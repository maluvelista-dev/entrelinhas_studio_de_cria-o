import { test, expect } from 'vitest';
import { animationSchema } from '@studio/schemas/motion';
import { capturePose, applyPose, compatible, presetAnimation } from './motion.js';
import { createAnimationPlayer } from './animation-player.js';
import { validationCharacter } from '../examples/validation-character.js';
test('pose application is isolated and rejects a different skeleton', () => {
  const pose = capturePose(validationCharacter, 'front');
  pose.transforms.find(p => p.id === 'rightArm').rotation = 1;
  const applied = applyPose(validationCharacter, pose);
  expect(applied.perspectives[0].parts.find(p => p.id === 'rightArm').rotation).toBe(1);
  expect(validationCharacter.perspectives[0].parts.find(p => p.id === 'rightArm').rotation || 0).toBe(0);
  expect(compatible(validationCharacter, { ...pose, perspective: 'missing' })).toBe(false);
  const changed = structuredClone(validationCharacter); changed.perspectives[0].parts.find(p => p.id === 'rightArm').parentId = 'head';
  expect(() => applyPose(changed, pose)).toThrow();
});
test('GSAP player interpolates, seeks backward and resets without mutating source data', () => {
  const pose = capturePose(validationCharacter, 'front');
  const end = structuredClone(pose.transforms); end.find(p => p.id === 'rightArm').rotation = 2;
  const animation = { schemaVersion: 1, perspective: pose.perspective, skeleton: pose.skeleton, duration: 2, ease: 'none', keyframes: [{ time: 0, transforms: pose.transforms }, { time: 2, transforms: end }] };
  let frame; const player = createAnimationPlayer(animation, value => { frame = value; });
  player.seek(1); expect(frame.find(p => p.id === 'rightArm').rotation).toBeCloseTo(1);
  player.seek(0.5); expect(frame.find(p => p.id === 'rightArm').rotation).toBeCloseTo(0.5);
  player.reset(); expect(frame.find(p => p.id === 'rightArm').rotation).toBe(0);
  expect(animation.keyframes[1].transforms.find(p => p.id === 'rightArm').rotation).toBe(2);
  player.destroy(); expect(() => player.play()).toThrow();
});

test('motion data rejects missing targets, unsafe interpolation and unsupported commands', () => {
  const animation = presetAnimation(validationCharacter, 'front', 'rightArm', 'wave');
  expect(animationSchema.safeParse(animation).success).toBe(true);
  const invalid = [
    value => { value.keyframes[0].time = 0.1; },
    value => { value.keyframes[1].time = value.keyframes[0].time; },
    value => { value.keyframes[1].transforms.pop(); },
    value => { value.keyframes[1].transforms[0].scaleX *= -1; },
    value => { value.keyframes[1].transforms[0].x = Infinity; },
    value => { value.ease = 'arbitrary-function'; },
    value => { value.script = 'run'; },
  ];
  for (const mutate of invalid) { const value = structuredClone(animation); mutate(value); expect(animationSchema.safeParse(value).success).toBe(false); }
  expect(() => presetAnimation(validationCharacter, 'front', 'rightArm', 'unregistered')).toThrow();
  const changed = structuredClone(validationCharacter); changed.perspectives[0].parts.find(p => p.id === 'rightArm').pivot = { x: 0.7, y: 0.7 };
  expect(compatible(changed, animation)).toBe(false);
});
