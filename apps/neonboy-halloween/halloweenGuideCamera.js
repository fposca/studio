import * as THREE from "three";
import { REALITY_CHEST } from "./halloweenGlassesChest.js";

export const CHEST_REVEAL_SECONDS = 5;
const ease = (v) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export function createGuideRevealCamera() {
  const start = new THREE.Vector3(), startLook = new THREE.Vector3();
  const focus = new THREE.Vector3(), close = new THREE.Vector3();
  const from = new THREE.Vector3(), fromLook = new THREE.Vector3();
  let stops = null, stopIndex = 0, stopAge = 0, nextRequested = false, returning = false;
  const enterStop = (index, position, look) => {
    stopIndex = index; stopAge = 0; from.copy(position); fromLook.copy(look);
  };
  const restore = (position, look) => {
    position.copy(start); look.copy(startLook); active = false; return false;
  };
  let age = 0, duration = CHEST_REVEAL_SECONDS, active = false, reduced = false;
  return {
    start(position, look, reducedMotion = false, shot = {}) {
      start.copy(position); startLook.copy(look);
      focus.copy(shot.focus || { x: REALITY_CHEST.x, y: .48, z: REALITY_CHEST.z });
      close.copy(shot.position || { x: REALITY_CHEST.x + 2.3, y: 2.15, z: REALITY_CHEST.z + 3.3 });
      duration = Math.max(3, shot.duration || CHEST_REVEAL_SECONDS);
      age = 0; active = true; reduced = reducedMotion;
      stops = shot.stops?.map(stop => ({ ...stop,
        position: new THREE.Vector3().copy(stop.return ? start : stop.position),
        focus: new THREE.Vector3().copy(stop.return ? startLook : stop.focus),
      })) || null;
      nextRequested = false; returning = false;
      enterStop(0, position, look);
    },
    update(dt, position, look, skip = false) {
      if (!active) return false;
      if (stops) {
        if (skip && !returning) { returning = true; enterStop(stops.length - 1, position, look); }
        if (returning) {
          stopAge += Math.max(0, dt);
          const weight = reduced ? 1 : ease(stopAge / .85);
          position.lerpVectors(from, start, weight); look.lerpVectors(fromLook, startLook, weight);
          return weight >= 1 ? restore(position, look) : true;
        }
        if (nextRequested) {
          const step = stops[stopIndex].step;
          let next = stopIndex + 1;
          while (next < stops.length && stops[next].step === step) next++;
          nextRequested = false;
          if (next === stops.length) { returning = true; enterStop(stops.length - 1, position, look); return true; }
          enterStop(next, position, look);
        }
        stopAge += Math.max(0, dt);
        while (stopAge >= stops[stopIndex].duration) {
          const overflow = stopAge - stops[stopIndex].duration;
          position.copy(stops[stopIndex].position); look.copy(stops[stopIndex].focus);
          if (stopIndex === stops.length - 1) return restore(position, look);
          enterStop(stopIndex + 1, position, look); stopAge = overflow;
        }
        const stop = stops[stopIndex];
        const weight = reduced ? 1 : ease(stopAge / stop.travel);
        position.lerpVectors(from, stop.position, weight);
        // Glide above the record bins while travelling; all stops remain inside the shop.
        position.y += Math.sin(Math.PI * weight) * Math.max(0, 3.55 - position.y);
        look.lerpVectors(fromLook, stop.focus, weight);
        return true;
      }
      age = skip ? duration : Math.min(duration, age + Math.max(0, dt));
      if (age >= duration) { position.copy(start); look.copy(startLook); active = false; return false; }
      // Hold a static close-up for reduced motion; never alter the player's view settings.
      const weight = reduced ? 1 : age < 1.3 ? ease(age / 1.3) : age > duration - 1.3 ? 1 - ease((age - duration + 1.3) / 1.3) : 1;
      position.lerpVectors(start, close, weight);
      look.lerpVectors(startLook, focus, weight);
      return true;
    },
    next() { if (stops && active && !returning) nextRequested = true; },
    get step() { return stops?.[stopIndex]?.step ?? 0; },
    get progress() {
      if (!stops) return 0;
      const step = stops[stopIndex].step;
      const total = stops.filter(stop => stop.step === step).reduce((sum,stop) => sum + stop.duration,0);
      const before = stops.slice(0,stopIndex).filter(stop => stop.step === step).reduce((sum,stop) => sum + stop.duration,0);
      return Math.min(1,(before + stopAge) / total);
    },
    get active() { return active; },
  };
}
export const createChestRevealCamera = createGuideRevealCamera;

// Sample a small set of views once per reveal. Prefer the actor's front and a clear
// aisle; geometry and world movement are never changed to compose the shot.
export function actorGuideShot(target, yaw, obstacles, layout) {
  const focus = new THREE.Vector3(target.x, 1.4, target.z);
  let best = null, bestScore = -Infinity;
  for (const angle of [0, .65, -.65, 1.3, -1.3, Math.PI]) {
    const direction = yaw + angle;
    const position = new THREE.Vector3(target.x + Math.sin(direction) * 3.7, 2.8, target.z + Math.cos(direction) * 3.7);
    if (Math.abs(position.x) > layout.sideWallX - .65 || position.z < layout.backWallZ + .65 || position.z > layout.frontWallZ - .65) continue;
    let intersections = 0;
    for (let i = 2; i <= 8; i++) {
      const t = i / 8, x = target.x + (position.x - target.x) * t, z = target.z + (position.z - target.z) * t;
      if (obstacles.some(o => Math.abs(x-o.x) < o.hx+.2 && Math.abs(z-o.z) < o.hz+.2)) intersections++;
    }
    const score = -intersections * 10 - Math.abs(angle);
    if (score > bestScore) { bestScore = score; best = position; }
  }
  if (!best) best = new THREE.Vector3(0, 3.2, target.z);
  return { focus, position: best, duration: 8 };
}
