import * as THREE from "three";

export const JUDGE_ENTRANCE_SECONDS = 3.4;
export const JUDGE_RETURN_SECONDS = 2.4;
export const JUDGE_INTRO_HOLD_SECONDS = 1.3;

const smooth = (value) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function judgeEntranceCameraPose(start, startTarget, boss, elapsed, position, target) {
  const t = THREE.MathUtils.clamp(elapsed / JUDGE_ENTRANCE_SECONDS, 0, 1);
  const wide = new THREE.Vector3(boss.x, 3.8, boss.z + 7.7);
  const close = new THREE.Vector3(boss.x + .85, 2.5, boss.z + 2.7);
  const bossTarget = new THREE.Vector3(boss.x, 1.5, boss.z);
  if (t < .6) {
    const segment = smooth(t / .6);
    position.lerpVectors(start, wide, segment);
    position.y = Math.min(4.45, position.y + Math.sin(Math.PI * segment) * .9);
  } else {
    position.lerpVectors(wide, close, smooth((t - .6) / .4));
  }
  target.lerpVectors(startTarget, bossTarget, smooth(t / .7));
  return t >= 1;
}

export function judgeReturnCameraPose(boss, fromPosition, fromTarget, playerPosition, playerTarget, elapsed, position, target) {
  const t = THREE.MathUtils.clamp(elapsed / JUDGE_RETURN_SECONDS, 0, 1);
  const wide = new THREE.Vector3(boss.x, 3.8, boss.z + 7.7);
  if (t < .45) position.lerpVectors(fromPosition, wide, smooth(t / .45));
  else position.lerpVectors(wide, playerPosition, smooth((t - .45) / .55));
  target.lerpVectors(fromTarget, playerTarget, smooth(t));
  return t >= 1;
}
