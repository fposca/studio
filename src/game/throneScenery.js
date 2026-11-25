import * as THREE from "three";
import { createThroneArt } from "./throneArt.js";
import { THRONE_INTERACTIONS, THRONE_OBSTACLES, canStandInThrone } from "./throneLayout.js";
import { THRONE_CONDUCTORS } from "./throneQuest.js";
import { SOVEREIGN_PHASES, sovereignBlinkDestination, sovereignCanOccupy, sovereignChaseTarget, sovereignColumnBetween, sovereignProjectileHits, steerSovereignVelocity } from "./throneCombat.js";

const MODEL_URL = new URL("../assets/neonboy-animaciones/capitulo13/soberano.mobile.glb", import.meta.url).href;
const CLIPS = Object.fromEntries(["camina", "ataque", "invoca", "muerte"].map((name) => [name,
  new URL(`../assets/neonboy-animaciones/capitulo13/soberano-${name}.anim.glb`, import.meta.url).href]));
export function buildThrone(scene, { onEvent, onDamage, initialProgress } = {}) {
  const root = new THREE.Group(); root.name = "Capítulo 13 / El Trono del Abismo"; scene.add(root);
  const art = createThroneArt(scene, root);
  const { material, geometry, add, hallGate, coreGate, statues, oathGlyphs, conductors,
    reflector, energyBeams, temporalCore, futureProjection, shieldNodes,
    attackMark, hazard, projectiles } = art;
  const reflectorTarget = new THREE.Vector3(0, 1.7, -28);
  const conductorTargets = conductors.map(({ id, x, z }) => ({
    kind: "throne-conductor", id, position: new THREE.Vector3(x, 2.15, z), radius: 1.2,
  }));
  const boss = new THREE.Group(); boss.position.set(0, 0, -77); root.add(boss);
  const fallback = new THREE.Group(); boss.add(fallback);
  add(geometry.cylinder, material.obsidian, 0, 1.8, 0, .85, 2.9, .85, fallback);
  add(geometry.sphere, material.gold, 0, 3.28, 0, .42, .42, .43, fallback);
  for (const x of [-.55, .55]) add(geometry.box, material.obsidian, x, 3.85, 0, .22, .9, .26, fallback);
  fallback.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  const shield = art.makeShield(boss);
  const interactions = THRONE_INTERACTIONS.map((spot) => ({ ...spot }));
  const bossSpot = interactions.find((spot) => spot.id === "throne-soberano");
  const bossCollider = { x: 0, z: -77, radius: 1.05 };
  const transmissionSpot = interactions.find((spot) => spot.id === "throne-transmission");
  let model = null, mixer = null, currentAction = null, disposed = false, currentAnimation = "fallback";
  const actions = {};
  function play(name, once = false) {
    const next = actions[name] || actions.idle;
    if (!next || next === currentAction) return;
    currentAction?.fadeOut(.18); next.reset().fadeIn(.18);
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once; next.play(); currentAction = next; currentAnimation = name;
  }
  async function loadAssets(loader, isAlive = () => true) {
    try {
      const [gltf] = await Promise.all([loader.loadAsync(MODEL_URL), art.loadAssets()]);
      if (disposed || !isAlive()) return false;
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const scale = 4.05 / Math.max(.1, bounds.max.y - bounds.min.y);
      model.scale.setScalar(scale);
      model.position.set(-bounds.getCenter(new THREE.Vector3()).x * scale, -bounds.min.y * scale, -bounds.getCenter(new THREE.Vector3()).z * scale);
      model.traverse((part) => { if (part.isMesh) { part.castShadow = true; part.receiveShadow = true; } });
      boss.add(model); fallback.visible = false;
      mixer = new THREE.AnimationMixer(model);
      actions.idle = mixer.clipAction(gltf.animations[0]);
      const clips = await Promise.allSettled(Object.entries(CLIPS).map(async ([name, url]) => [name, await loader.loadAsync(url)]));
      if (disposed || !isAlive()) return false;
      for (const clip of clips) if (clip.status === "fulfilled" && clip.value[1].animations[0])
        actions[clip.value[0]] = mixer.clipAction(clip.value[1].animations[0]);
      play("idle");
      return true;
    } catch { return false; }
  }
  const shots = projectiles.map((mesh) => ({ mesh, velocity: new THREE.Vector3(), life: 0, turnRate: 0 }));
  const clearShots = () => shots.forEach((shot) => { shot.mesh.visible = false; shot.life = 0; });
  function updateShots(step, player) {
    for (const shot of shots) {
      if (!shot.mesh.visible) continue;
      const start = { x: shot.mesh.position.x, z: shot.mesh.position.z };
      if (shot.life < .8 && shot.velocity.x * (player.x - start.x) + shot.velocity.z * (player.z - start.z) > 0) {
        const guided = steerSovereignVelocity(shot.velocity, start, player, shot.turnRate * step);
        shot.velocity.set(guided.x, 0, guided.z);
      }
      shot.life += step;
      shot.mesh.position.addScaledVector(shot.velocity, step);
      if (sovereignColumnBetween(start, shot.mesh.position, .62)) {
        shot.mesh.visible = false;
        continue;
      }
      if (sovereignProjectileHits(start, shot.mesh.position, player)) {
        shot.mesh.visible = false;
        onDamage?.(1);
      }
      if (shot.life > 3 || Math.hypot(shot.mesh.position.x, shot.mesh.position.z + 76) > 18)
        shot.mesh.visible = false;
    }
  }
  let attackClock = 1.35, attack = null, attackIndex = 0;
  let blinkClock = 5.4, blink = null, blinkIndex = 0, stuckAge = 0;
  let currentPlayer = null, arenaEngaged = false;
  let encounterPending = false, lastPhase = 1, encounterAge = 0;
  let defeatAge = initialProgress?.bossDefeated ? 4 : 0;
  const getPhase = (p) => p.shieldActive ? 2 : p.bossHealth <= 4 ? 3 : 1;
  function registerImpact(target, progress) {
    if (target.kind === "throne-conductor") {
      if (!progress?.coreInspected?.includes(target.id)) onEvent?.("inspect-core", target.id);
      else if (progress.coreInspected.length === 3 && progress.visionActive
        && progress.reflectorIndex >= 0
        && THRONE_CONDUCTORS[progress.reflectorIndex] === target.id)
        onEvent?.("reflector-hit", target.id);
      else onEvent?.("conductor-miss", target.id);
      return;
    }
    if (target.kind === "throne-reflector") { onEvent?.("reflector-hit"); return; }
    if (target.kind === "throne-boss") {
      if (arenaEngaged && currentPlayer && !sovereignColumnBetween(currentPlayer, boss.position, .8)) onEvent?.("boss-hit");
      return;
    }
    if (target.kind === "throne-shield-node") { onEvent?.("shield-node", target.id); }
  }
  function getTargets(progress) {
    if (progress?.hallOpen && !progress?.throneOpen)
      return [...conductorTargets, ...(progress.coreInspected?.length === 3
        ? [{ kind: "throne-reflector", id: "reflector", position: reflectorTarget, radius: .74, reflect: true, normal: new THREE.Vector3(0, 0, 1) }]
        : [])];
    if (!progress?.bossIntro || progress?.bossDefeated || !arenaEngaged) return [];
    if (progress.shieldActive) return shieldNodes.filter((node) => !progress.shieldNodes.includes(node.id) && node.revealUntil > encounterAge)
      .map((node) => ({ kind: "throne-shield-node", id: node.id, position: new THREE.Vector3(node.x, 1.85, node.z), radius: .55 }));
    if (blink || sovereignColumnBetween(currentPlayer, boss.position, .8)) return [];
    return [{ kind: "throne-boss", id: "soberano", position: new THREE.Vector3(boss.position.x, 2.1, boss.position.z), radius: 1.1, capsuleHalfHeight: 1.25 }];
  }
  function update(dt, elapsed, progress, player, paused, reducedMotion = false, fallen = false) {
    const p = progress || {};
    currentPlayer = player;
    arenaEngaged = Boolean(p.bossIntro && !p.bossDefeated && !fallen && player.z <= -50.6);
    const step = paused ? 0 : Math.min(dt, .05);
    encounterAge += step;
    art.update(dt, p, player, paused, reducedMotion);
    hallGate.visible = !p.hallOpen; coreGate.visible = !p.throneOpen;
    for (let i = 0; i < statues.length; i++) {
      statues[i].rune.material = p.vows?.includes(statues[i].id) ? material.cyan : p.visionActive ? material.violet : material.red;
      oathGlyphs[i].visible = Boolean(p.visionActive || p.hallOpen);
      statues[i].decoded.visible = Boolean(p.visionActive);
    }
    reflector.rotation.y = Math.max(0, p.reflectorIndex ?? 0) * Math.PI * 2 / 3;
    for (let i = 0; i < conductors.length; i++) {
      const complete = p.conductors?.includes(conductors[i].id);
      const inspected = p.coreInspected?.includes(conductors[i].id);
      conductors[i].crystal.material = complete ? material.cyan : inspected ? material.gold : p.visionActive ? material.violet : material.red;
      conductors[i].halo.visible = p.visionActive || inspected || complete;
      const preview = Boolean(p.visionActive && p.hallOpen && !p.throneOpen);
      const selected = preview && p.reflectorIndex === i;
      energyBeams[i].visible = complete || preview;
      energyBeams[i].material.opacity = complete ? .78 : selected ? .75 : .18;
      energyBeams[i].material.color.setHex(complete ? 0x83ffd1 : selected ? 0xf1d49b : 0x7dccb8);
      energyBeams[i].scale.x = energyBeams[i].scale.z = selected ? .042 : complete ? .028 : .014;
    }
    transmissionSpot.reach = p.bossDefeated ? 3.5 : 0;
    temporalCore.visible = p.bossDefeated || p.completed;
    futureProjection.visible = p.bossDefeated || p.completed;
    temporalCore.rotation.y += step * .4;
    bossSpot.x = boss.position.x; bossSpot.z = boss.position.z;
    bossCollider.x = p.bossDefeated ? 999 : boss.position.x;
    bossCollider.z = boss.position.z;
    bossSpot.reach = p.throneOpen && !p.bossIntro && !p.bossDefeated ? 4.2 : 0;
    boss.visible = !p.bossDefeated || defeatAge < 3;
    shield.visible = Boolean(p.shieldActive);
    if (p.shieldActive && p.visionActive) for (const node of shieldNodes) node.revealUntil = encounterAge + 5.5;
    for (const node of shieldNodes) {
      const visible = Boolean(p.shieldActive && !p.shieldNodes?.includes(node.id) && node.revealUntil > encounterAge);
      node.core.visible = visible; node.halo.visible = visible;
      if (visible) node.halo.rotation.z += step * .55;
    }
    if (!p.bossIntro && p.throneOpen && !p.bossDefeated && player.z < -62 && !encounterPending && !paused) {
      encounterPending = true; onEvent?.("encounter");
    }
    if (p.bossIntro) encounterPending = false;
    if (p.bossDefeated) {
      attack = null; blink = null; attackMark.visible = false; hazard.visible = false; clearShots();
      boss.scale.setScalar(1);
      if (defeatAge < 3 && currentAnimation !== "muerte") play("muerte", true);
      defeatAge += step; boss.visible = defeatAge < 3;
      mixer?.update(step); return;
    }
    if (fallen) {
      attack = null; blink = null; attackMark.visible = false; hazard.visible = false; clearShots();
      boss.scale.setScalar(1); boss.visible = true;
      mixer?.update(0); return;
    }
    if (!p.bossIntro || paused || player.z > -48.6) { mixer?.update(step); return; }
    const phase = getPhase(p);
    if (phase !== lastPhase) {
      lastPhase = phase; attack = null; blink = null; attackMark.visible = false; hazard.visible = false;
      boss.scale.setScalar(1); attackClock = 1.4; blinkClock = 3.2;
      if (phase === 2) onEvent?.("shield-start");
      else if (phase === 3) onEvent?.("fracture-start");
      play("invoca", true);
    }
    const combat = SOVEREIGN_PHASES[phase];
    blinkClock -= step;
    if (!blink && !attack && blinkClock <= 0) {
      const target = sovereignBlinkDestination(player, boss.position, blinkIndex++);
      blinkClock = target ? combat.blinkInterval : 1;
      if (target) {
        blink = { age: 0, ...target }; stuckAge = 0;
        attackMark.visible = true;
        attackMark.position.set(target.x, .12, target.z);
        attackMark.scale.setScalar(2.1);
        play("invoca", true);
      }
    }
    if (blink) {
      blink.age += step;
      if (blink.age < .22) boss.scale.setScalar(Math.max(.04, 1 - blink.age / .22));
      else if (blink.age < .58) {
        boss.visible = false; bossCollider.x = 999;
        if (blink.age >= .35) boss.position.set(blink.x, 0, blink.z);
      } else {
        boss.visible = true;
        boss.position.set(blink.x, 0, blink.z);
        bossCollider.x = boss.position.x; bossCollider.z = boss.position.z;
        boss.scale.setScalar(Math.min(1, (blink.age - .58) / .25));
      }
      if (blink.age >= .88) {
        blink = null; boss.scale.setScalar(1); attackMark.visible = false;
        attackClock = Math.min(attackClock, .55);
      }
      updateShots(step, player);
      mixer?.update(step);
      return;
    }
    const dx = player.x - boss.position.x, dz = player.z - boss.position.z;
    const distance = Math.hypot(dx, dz);
    const goal = sovereignChaseTarget(boss.position, player, blinkIndex);
    const goalDistance = goal ? Math.hypot(goal.x - boss.position.x, goal.z - boss.position.z) : 0;
    const detouring = goal && Math.hypot(goal.x - player.x, goal.z - player.z) > .2;
    if ((!attack || attack.type === "bolt") && (distance > 2.65 || detouring)) {
      if (goal && goalDistance > .05) {
        const travel = Math.min(goalDistance, combat.speed * step);
        const nx = boss.position.x + (goal.x - boss.position.x) / goalDistance * travel;
        const nz = boss.position.z + (goal.z - boss.position.z) / goalDistance * travel;
        if (sovereignCanOccupy(nx, nz)) {
          boss.position.x = nx; boss.position.z = nz; stuckAge = 0; play("camina");
        } else stuckAge += step;
      } else stuckAge += step;
      if (stuckAge > .65) { blinkClock = Math.min(blinkClock, 0); stuckAge = 0; play("idle"); }
    } else {
      stuckAge = 0;
      if (!attack && currentAnimation !== "idle") play("idle");
    }
    boss.rotation.y = Math.atan2(dx, dz);
    attackClock -= step;
    if (!attack && attackClock <= 0) {
      const type = combat.attacks[attackIndex++ % combat.attacks.length];
      attack = { type, age: 0, x: player.x, z: player.z, hit: false };
      attackMark.visible = type !== "hazard";
      attackMark.position.set(type === "bolt" ? player.x : boss.position.x, .12, type === "bolt" ? player.z : boss.position.z);
      attackMark.scale.setScalar(type === "wave" ? 4.2 : type === "bolt" ? 1.5 : 1.8);
      hazard.visible = type === "hazard";
      hazard.position.set(player.x, .13, player.z);
      attackClock = combat.attackInterval;
    }
    if (attack) {
      attack.age += step;
      const warning = attack.type === "hazard" ? 1.1 : .9;
      if (attack.age >= warning && !attack.hit) {
        attack.hit = true; play(attack.type === "hazard" ? "invoca" : "ataque", true);
        const gap = Math.hypot(player.x - attack.x, player.z - attack.z);
        if (attack.type === "melee" && distance < 3.1 && gap < 3.2) onDamage?.(1);
        if (attack.type === "wave" && distance < 5.2 && distance > 1.1) onDamage?.(1);
        if (attack.type === "hazard" && gap < 2.7) onDamage?.(1);
        if (attack.type === "bolt") {
          const aim = Math.atan2(player.x - boss.position.x, player.z - boss.position.z);
          const count = combat.orbCount;
          for (let i = 0; i < count; i++) {
            const shot = shots[i];
            const angle = aim + (i - (count - 1) / 2) * .17;
            shot.mesh.position.set(boss.position.x, 1.7, boss.position.z);
            shot.velocity.set(Math.sin(angle) * combat.orbSpeed, 0, Math.cos(angle) * combat.orbSpeed);
            shot.life = 0; shot.turnRate = i === (count - 1) / 2 ? 6 : 2.1; shot.mesh.visible = true;
          }
        }
      }
      if (attack.age >= warning) { attackMark.visible = false; hazard.visible = false; }
      if (attack.age > warning + .42) { attack = null; if (currentAnimation !== "idle") play("idle"); }
    }
    bossCollider.x = boss.position.x; bossCollider.z = boss.position.z;
    updateShots(step, player);
    mixer?.update(step);
  }
  return {
    interactions, obstacles: [...THRONE_OBSTACLES, bossCollider], colliders: [], canStand: canStandInThrone,
    getTargets, registerImpact, loadAssets, update,
    get modelLoaded() { return Boolean(model && Object.keys(actions).length === 5); },
    get animationState() { return currentAnimation; },
    get bossPosition() { return boss.position; },
    dispose() {
      disposed = true; mixer?.stopAllAction();
      art.dispose();
    },
  };
}
