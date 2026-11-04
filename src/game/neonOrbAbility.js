import * as THREE from "three";
import { segmentSphereHit, segmentVerticalCapsuleHit } from "./neonOrbLogic.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createOrbGlowTexture, createPlasmaOrb, createOrbTrail, createOrbBurst } from "./neonOrbVisuals.js";

const SPEED = 12.5;
const RETURN_SPEED = 15;
const MAX_RANGE = 17;
const COOLDOWN = .72;

// One reusable projectile, one trail and one impact pulse for the active scene.
export function createNeonOrbAbility(scene, { getTargets, getColliders, getMaxRange, onHit, onStatus }) {
  const effectsRoot = new THREE.Group();
  effectsRoot.name = "NeonBoy / efectos del orbe";
  scene.add(effectsRoot);
  const texture = createOrbGlowTexture();
  const plasma = createPlasmaOrb({ radius: .16, texture });
  const group = plasma.root;
  group.name = "NeonBoy / Orbe Neon";
  group.visible = false;
  const light = new THREE.PointLight(0xf167d9, 3.5, 4.2, 2);
  group.add(light);
  const trail = createOrbTrail();
  const launch = createOrbBurst(texture);
  const hitBurst = createOrbBurst(texture, true);
  effectsRoot.add(group, trail.mesh, launch.root, hitBurst.root);
  let phase = "ready", cooldown = 0, traveled = 0, castAge = 0, phaseClock = 0, ricochets = 0;
  let audioContext = null, lastReport = "";
  const returnHits = new Set(), returnBlocked = new Set();
  const targetKey = target => target.id ?? target.kind;
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(), previous = new THREE.Vector3(), next = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  function report() {
    const key = phase + ":" + Math.ceil(cooldown * 10);
    if (key !== lastReport) { lastReport = key; onStatus?.({ phase, cooldown: Math.max(0, cooldown) }); }
  }
  function sound(frequency, duration, volume) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext ||= new AudioContext();
      if (audioContext.state === "suspended") void audioContext.resume();
      const now = audioContext.currentTime;
      const tone = audioContext.createOscillator(), gain = audioContext.createGain();
      tone.type = "sine";
      tone.frequency.setValueAtTime(frequency, now);
      tone.frequency.exponentialRampToValueAtTime(frequency * .42, now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      tone.connect(gain).connect(audioContext.destination);
      tone.start(now); tone.stop(now + duration);
    } catch { /* The ability remains playable without Web Audio. */ }
  }
  function fire(player, headingYaw, pitch = 0, eye = null) {
    if (phase !== "ready") return false;
    const horizontal = Math.cos(pitch);
    direction.set(Math.sin(headingYaw) * horizontal, -Math.sin(pitch), Math.cos(headingYaw) * horizontal).normalize();
    if (eye) origin.copy(eye).addScaledVector(direction, .57);
    else origin.set(player.x + direction.x * .57, player.y + 1.27, player.z + direction.z * .57);
    group.position.copy(origin);
    trail.reset(origin);
    launch.trigger(origin, direction);
    castAge = 0;
    plasma.setActive(false);
    plasma.update(0, 1.2);
    traveled = 0; ricochets = 0; phaseClock = .08;
    returnHits.clear(); returnBlocked.clear();
    phase = "launching";
    group.visible = true;
    sound(920, .21, .035);
    report();
    return true;
  }
  function recall() {
    if (phase !== "traveling" && phase !== "launching") return false;
    phase = "returning";
    report();
    return true;
  }
  function impact(at) {
    hitBurst.trigger(at, direction);
    sound(380, .16, .023);
    phase = "impact"; phaseClock = .09;
    report();
  }
  function update(dt, player, elapsed = 0) {
    launch.update(dt);
    hitBurst.update(dt);
    castAge += dt;
    if (phase === "cooldown") {
      cooldown = Math.max(0, cooldown - dt);
      if (cooldown === 0) phase = "ready";
      report();
      return;
    }
    if (phase === "ready") return;
    if (phase === "launching" || phase === "impact") {
      phaseClock -= dt;
      plasma.update(elapsed, phase === "impact" ? 1.5 : 1.3);
      if (phaseClock > 0) return;
      phase = phase === "launching" ? "traveling" : "returning";
      report();
    }
    previous.copy(group.position);
    if (phase === "traveling") {
      next.copy(previous).addScaledVector(direction, SPEED * dt);
      const length = previous.distanceTo(next);
      let nearest = null, nearestDistance = length + .01;
      for (const target of getTargets?.() || []) {
        const t = target.capsuleHalfHeight
          ? segmentVerticalCapsuleHit(previous, next, target.position, target.radius + .16, target.capsuleHalfHeight)
          : segmentSphereHit(previous, next, target.position, target.radius + .16);
        if (t !== null && t * length < nearestDistance) { nearest = target; nearestDistance = t * length; }
      }
      if (length > 0) {
        raycaster.set(previous, direction);
        raycaster.far = length;
        const wall = raycaster.intersectObjects((getColliders?.() || []).filter(mesh => mesh.visible), false)[0];
        if (wall && wall.distance < nearestDistance) { nearest = null; nearestDistance = wall.distance; }
      }
      if (nearestDistance <= length) {
        group.position.copy(previous).addScaledVector(direction, nearestDistance);
        if (nearest?.returnHit) returnBlocked.add(targetKey(nearest));
        const result = nearest ? onHit?.({...nearest,ricochets,incoming:direction.clone()}) : null;
        if (nearest?.reflect && result?.reflect && ricochets < 2) {
          direction.reflect(nearest.normal).normalize();
          group.position.copy(nearest.position).addScaledVector(direction, nearest.radius + .2);
          traveled += nearestDistance;
          ricochets += 1;
          sound(650, .14, .023);
        } else impact(group.position);
      } else {
        group.position.copy(next);
        traveled += length;
        if (traveled >= (getMaxRange?.() ?? MAX_RANGE)) recall();
      }
    } else {
      next.set(player.x, player.y + 1.18, player.z);
      const gap = previous.distanceTo(next);
      const reachedPlayer = gap < .48 || gap <= RETURN_SPEED * dt;
      next.sub(previous).multiplyScalar(Math.min(1, RETURN_SPEED * dt / Math.max(gap, 1e-9))).add(previous);
      const returnLength = previous.distanceTo(next);
      let nearest = null, nearestTime = Infinity;
      if (returnLength > 0) for (const target of getTargets?.() || []) {
        if (!target.returnHit) continue;
        const key = targetKey(target);
        if (returnHits.has(key)) continue;
        if (returnBlocked.has(key)) {
          // A hit on the outward trip must leave the target before it can count again.
          if (previous.distanceTo(target.position) <= target.radius + (target.capsuleHalfHeight || 0) + .35) continue;
          returnBlocked.delete(key);
        }
        const t = target.capsuleHalfHeight
          ? segmentVerticalCapsuleHit(previous, next, target.position, target.radius + .16, target.capsuleHalfHeight)
          : segmentSphereHit(previous, next, target.position, target.radius + .16);
        if (t !== null && t < nearestTime) { nearest = target; nearestTime = t; }
      }
      if (nearest) {
        const hitPoint = previous.clone().lerp(next, nearestTime);
        returnHits.add(targetKey(nearest));
        onHit?.({...nearest, ricochets, returning: true});
        hitBurst.trigger(hitPoint, next.clone().sub(previous).normalize());
        sound(520, .12, .018);
      }
      group.position.copy(next);
      if (reachedPlayer) {
        group.visible = false;
        trail.mesh.visible = false;
        phase = "cooldown";
        cooldown = COOLDOWN;
        report();
      }
    }
    if (!group.visible) return;
    const returning = phase === "returning";
    trail.update(previous, group.position, returning);
    plasma.setActive(returning);
    plasma.update(elapsed, returning ? .8 : 1.15);
    light.color.set(returning ? 0x65cfff : 0xf167d9);
    light.intensity = returning ? 1.6 : 3.5 + Math.max(0, 1 - castAge / .2) * 2;
  }

  function dispose() {
    if (audioContext) void audioContext.close().catch(() => {});
    scene.remove(effectsRoot);
    disposeObjects([effectsRoot]);
  }

  report();
  return { fire, recall, update, dispose, getStatus: () => ({ phase, cooldown }) };
}
