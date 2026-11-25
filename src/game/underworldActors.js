import * as THREE from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { canStandInUnderworld } from "./underworldLayout.js";
import { UNDERWORLD_MAX_HEALTH } from "./underworldQuest.js";
import { chooseEnemyReappearance, createEnemyHealthBar, createUnderworldCombat } from "./underworldCombat.js";

const ASSETS = {
  centinela: [
    new URL("../assets/neonboy-animaciones/chapter11/centinela.mobile.glb", import.meta.url).href,
    new URL("../assets/neonboy-animaciones/chapter11/centinela-ataque.anim.glb", import.meta.url).href,
  ],
  alma: [
    new URL("../assets/neonboy-animaciones/chapter11/alma.mobile.glb", import.meta.url).href,
    new URL("../assets/neonboy-animaciones/chapter11/alma-errante-camina.anim.glb", import.meta.url).href,
  ],
  barquero: [
    new URL("../assets/neonboy-animaciones/chapter11/barquero.mobile.glb", import.meta.url).href,
    new URL("../assets/neonboy-animaciones/chapter11/barquero-caminar.anim.glb", import.meta.url).href,
  ],
  gargola: [
    new URL("../assets/neonboy-animaciones/chapter11/gargola.mobile.glb", import.meta.url).href,
    new URL("../assets/neonboy-animaciones/chapter11/gargola-ataque.anim.glb", import.meta.url).href,
  ],
  testigo: [
    new URL("../assets/neonboy-animaciones/chapter11/testigo.mobile.glb", import.meta.url).href,
    new URL("../assets/neonboy-animaciones/chapter11/testigo-patada.anim.glb", import.meta.url).href,
    new URL("../assets/neonboy-animaciones/chapter11/testigo-patada-2.anim.glb", import.meta.url).href,
  ],
};

const BARQUERO_POSITION = Object.freeze({ x: 2.2, z: -10.8, facing: .42 });
const ALMA_WAYPOINTS = Object.freeze([{ x: -1.3, z: -3.5 }, { x: -1.5, z: -5.3 }]);

const SETTINGS = [
  { id: "underworld-0", type: "centinela", name: "Centinela del Abismo I", x: -2.5, z: -35.5, height: 2.75, speed: 1.35, range: 1.9, detect: 7.5, hp: (p) => p?.enemies?.[0] ?? UNDERWORLD_MAX_HEALTH.sentinel },
  { id: "underworld-1", type: "centinela", name: "Centinela del Abismo II", x: 3.4, z: -42, height: 2.75, speed: 1.3, range: 1.9, detect: 7.5, hp: (p) => p?.enemies?.[1] ?? UNDERWORLD_MAX_HEALTH.sentinel },
  { id: "underworld-ambush-0", type: "gargola", name: "G?rgola de la emboscada I", x: -3.1, z: -36.8, height: 2.45, speed: 1.55, range: 1.7, detect: 7.5, hp: (p) => p?.ambushHealth?.[0] ?? 3 },
  { id: "underworld-ambush-1", type: "gargola", name: "G?rgola de la emboscada II", x: 3.1, z: -39.2, height: 2.45, speed: 1.55, range: 1.7, detect: 7.5, hp: (p) => p?.ambushHealth?.[1] ?? 3 },
  { id: "underworld-gargola", type: "gargola", name: "Gárgola infernal", x: 5.0, z: -40.5, height: 2.55, speed: 1.8, range: 1.7, detect: 8, hp: (p) => p?.gargolaHealth ?? UNDERWORLD_MAX_HEALTH.gargola },
  { id: "underworld-testigo", type: "testigo", name: "Testigo de las Cenizas", x: 0, z: -47.1, height: 2.9, speed: 2.65, range: 2, detect: 23, hp: (p) => p?.testigoHealth ?? UNDERWORLD_MAX_HEALTH.testigo },
  { id: "alma", type: "alma", name: "Alma Errante", ...ALMA_WAYPOINTS[0], facing: -.6, height: 2.55 },
  { id: "barquero", type: "barquero", name: "Barquero", ...BARQUERO_POSITION, height: 2.7 },
];

// Advance toward NeonBoy and slide along arena edges instead of stopping at them.
export function advanceUnderworldChase(position, player, speed, step, visionActive, progress) {
  // Line up with the narrow bridge before crossing the pair of entrance pylons.
  const enteringBridge = player.z > -31 && position.z < -31 && Math.abs(position.x) > 1.1;
  const targetX = enteringBridge ? 0 : player.x;
  const targetZ = enteringBridge ? position.z : player.z;
  const dx = targetX - position.x;
  const dz = targetZ - position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < .001) return false;
  const movement = Math.min(distance, speed * step);
  const nextX = position.x + dx / distance * movement;
  const nextZ = position.z + dz / distance * movement;
  const canStand = (x, z) => canStandInUnderworld(x, z, visionActive, 1.35, progress);
  if (canStand(nextX, nextZ)) {
    position.x = nextX;
    position.z = nextZ;
    return true;
  }
  let moved = false;
  if (canStand(nextX, position.z)) { position.x = nextX; moved = true; }
  if (canStand(position.x, nextZ)) { position.z = nextZ; moved = true; }
  return moved;
}

function pickClip(clips, term, fallback = 0) {
  return clips.find((clip) => clip.name.toLowerCase().includes(term.toLowerCase())) || clips[fallback];
}

export function createUnderworldActors(root, { onEvent, onDamage } = {}) {
  const combat = createUnderworldCombat(root, onDamage);
  const actors = SETTINGS.map((config) => {
    const group = new THREE.Group();
    group.name = config.name;
    group.position.set(config.x, 0, config.z);
    group.rotation.y = config.facing ?? 0;
    root.add(group);
    const maxHp = config.id.startsWith("underworld-ambush") ? 3 : config.type === "centinela" ? UNDERWORLD_MAX_HEALTH.sentinel
      : config.type === "gargola" ? UNDERWORLD_MAX_HEALTH.gargola
      : config.type === "testigo" ? UNDERWORLD_MAX_HEALTH.testigo : 0;
    let warning = null, charge = null, chargeVisual = null;
    if (maxHp) {
      const color = config.type === "gargola" ? 0xffa64d : config.type === "testigo" ? 0xce83ff : 0xff76b2;
      warning = new THREE.Mesh(new THREE.RingGeometry(.65, .83, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .7, side: THREE.DoubleSide,
          depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      warning.name = "Aviso de reaparición";
      warning.rotation.x = -Math.PI / 2;
      warning.position.y = .035;
      warning.visible = false;
      group.add(warning);
      chargeVisual = combat.createCharge(config.type);
      charge = chargeVisual.root;
      group.add(charge);
    }
    return { ...config, group, homeX: config.x, homeZ: config.z, maxHp,
      warning, charge, chargeVisual, model: null, healthBar: null, renderedHp: -1,
      mixer: null, actions: {}, action: null, cooldown: 0, attackAge: 0, hitAge: 0,
      hitCooldown: 0, rangedCooldown: .6 + Math.abs(config.x) * .1,
      teleportCooldown: config.type === "testigo" ? 6 : config.type === "gargola" ? 7 : 8.5,
      vanishAge: 0, castAge: 0, castFired: false, attackCount: 0,
      attackDealt: false, noticed: false, introTriggered: false, patrolIndex: 0, patrolPause: 2.4 };
  });
  const byId = new Map(actors.map((actor) => [actor.id, actor]));
  let lastPlayer = null;
  let lastProgress = null;
  let ferrymanRide = null;
  const interactions = [
    { id: "alma", label: "Hablar con el Alma Errante", ...ALMA_WAYPOINTS[0], reach: 2.8 },
    { id: "barquero", label: "Hablar con el Barquero", x: BARQUERO_POSITION.x, z: BARQUERO_POSITION.z, reach: 2.8 },
  ];

  function play(actor, key) {
    const next = actor.actions[key];
    if (!next || actor.action === next) return;
    actor.action?.fadeOut(.16);
    next.reset().fadeIn(.16).play();
    actor.action = next;
  }

  async function loadAssets(loader, isAlive = () => true) {
    const loaded = await Promise.all(Object.entries(ASSETS).map(async ([type, urls]) =>
      [type, await Promise.all(urls.map((url) => loader.loadAsync(url)))],
    ));
    if (!isAlive()) return false;
    const assets = Object.fromEntries(loaded);
    for (const actor of actors) {
      const [visual, ...clipFiles] = assets[actor.type];
      const model = cloneSkeleton(visual.scene);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = actor.height / Math.max(.01, size.y);
      const center = bounds.getCenter(new THREE.Vector3());
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      model.traverse((part) => {
        if (part.isMesh) { part.castShadow = false; part.receiveShadow = false; part.frustumCulled = false; }
      });
      actor.group.add(model);
      actor.model = model;
      if (actor.maxHp) actor.healthBar = createEnemyHealthBar(actor);
      actor.mixer = new THREE.AnimationMixer(model);
      const clips = [...visual.animations, ...clipFiles.flatMap((file) => file.animations)];
      const walk = pickClip(clips, "walking");
      const idle = actor.type === "alma" || actor.type === "barquero" ? visual.animations[0] : walk;
      const attackClips = actor.type === "centinela" ? [pickClip(clips, "punch_combo", 1)]
        : actor.type === "gargola" ? [pickClip(clips, "spartan_kick", 1)]
        : actor.type === "testigo" ? [pickClip(clips, "sweeping_kick", 1), pickClip(clips, "spartan_kick", 2)] : [];
      actor.actions.idle = idle && actor.mixer.clipAction(idle);
      actor.actions.walk = walk && actor.mixer.clipAction(walk);
      actor.actions.attacks = attackClips.filter(Boolean).map((clip) => {
        const action = actor.mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        return action;
      });
      play(actor, "idle");
      if (actor.type === "barquero") actor.actions.idle?.setEffectiveTimeScale(.8);
    }
    return true;
  }

  function active(actor, progress, player) {
    if (actor.id.startsWith("underworld-ambush")) return Boolean(progress?.mechanismSolved);
    if (actor.type === "centinela") return Boolean(progress?.mechanismSolved && progress?.ambushHealth?.every((health) => health === 0));
    if (actor.type === "gargola") return Boolean(progress?.mechanismSolved && progress?.ambushHealth?.every((health) => health === 0) &&
      (progress.enemies?.some((health) => health === 0) || player?.z < -39));
    if (actor.type === "testigo") return Boolean(progress?.mechanismSolved &&
      progress?.ambushHealth?.every((health) => health === 0) &&
      progress.enemies?.every((health) => health === 0) && progress.gargolaHealth === 0);
    return true;
  }

  function getTargets(progress, player = lastPlayer) {
    return actors.filter((actor) => actor.hp && actor.hp(progress) > 0 && actor.vanishAge <= 0 && active(actor, progress, player) && (actor.type !== "testigo" || progress?.testigoIntroSeen)).map((actor) => ({
      id: actor.id,
      position: new THREE.Vector3(actor.group.position.x, actor.height * .54, actor.group.position.z),
      radius: actor.type === "testigo" ? .9 : .72,
      capsuleHalfHeight: actor.height * .33,
    }));
  }

  function registerImpact(target) {
    const actor = byId.get(target?.id);
    if (!actor?.hp || actor.vanishAge > 0 || actor.hitCooldown > 0) return;
    actor.hitAge = .3;
    actor.hitCooldown = .38;
    if (actor.type === "centinela") onEvent?.("enemy-hit", Number(actor.id.at(-1)));
    if (actor.id.startsWith("underworld-ambush")) onEvent?.("ambush-hit", Number(actor.id.at(-1)));
    else if (actor.type === "gargola") onEvent?.("gargola-hit");
    if (actor.type === "testigo" && !lastProgress?.shieldActive) onEvent?.("testigo-hit");
  }

  function update(dt, elapsed, progress, player, paused, reducedMotion = false) {
    if (!progress || !player) return;
    lastPlayer = player;
    lastProgress = progress;
    const step = paused ? 0 : Math.min(dt, .05);
    for (const actor of actors) {
      const alive = !actor.hp || actor.hp(progress) > 0 || (actor.type === "testigo" && !progress.testigoDefeatLineSeen);
      const awakened = active(actor, progress, player);
      actor.group.visible = alive && awakened;
      if (actor.healthBar) {
        const remaining = actor.hp(progress);
        if (remaining !== actor.renderedHp) {
          actor.healthBar.update(remaining);
          actor.renderedHp = remaining;
        }
        actor.healthBar.sprite.visible = remaining > 0 && actor.vanishAge <= 0;
      }
      if (!actor.group.visible || paused || !actor.mixer) continue;
      actor.mixer.update(step);
      if (actor.type === "alma") {
        if (progress.ferryCompleted) {
          actor.group.position.set(-4.8, .025 + Math.sin(elapsed * 1.6) * .018, -33.15);
          actor.group.rotation.y = Math.atan2(player.x - actor.group.position.x, player.z - actor.group.position.z);
          play(actor, "idle");
          continue;
        }
        actor.group.position.y = .025 + Math.sin(elapsed * 1.6) * .018;
        if (actor.patrolPause > 0) {
          actor.patrolPause = Math.max(0, actor.patrolPause - step);
          const dx = player.x - actor.group.position.x;
          const dz = player.z - actor.group.position.z;
          const target = Math.hypot(dx, dz) < 6 ? Math.atan2(dx, dz) : -.6;
          const turn = Math.atan2(Math.sin(target - actor.group.rotation.y), Math.cos(target - actor.group.rotation.y));
          actor.group.rotation.y += THREE.MathUtils.clamp(turn, -step * 1.5, step * 1.5);
          play(actor, "idle");
        } else {
          const nextIndex = 1 - actor.patrolIndex;
          const destination = ALMA_WAYPOINTS[nextIndex];
          const dx = destination.x - actor.group.position.x;
          const dz = destination.z - actor.group.position.z;
          const distance = Math.hypot(dx, dz);
          const target = Math.atan2(dx, dz);
          const turn = Math.atan2(Math.sin(target - actor.group.rotation.y), Math.cos(target - actor.group.rotation.y));
          actor.group.rotation.y += THREE.MathUtils.clamp(turn, -step * 2, step * 2);
          if (Math.abs(turn) > .22) {
            play(actor, "idle");
          } else if (distance > .07) {
            const move = Math.min(distance, step * .62);
            actor.group.position.x += dx / distance * move;
            actor.group.position.z += dz / distance * move;
            play(actor, "walk");
          } else {
            actor.group.position.set(destination.x, actor.group.position.y, destination.z);
            actor.patrolIndex = nextIndex;
            actor.patrolPause = 3.3;
            play(actor, "idle");
          }
        }
        continue;
      }
      if (actor.type === "barquero") {
        if (ferrymanRide) actor.group.position.set(ferrymanRide.x, .22, ferrymanRide.z - 1.15);
        else if (progress.ferryCompleted) actor.group.position.set(4.55, 0, -34.5);
        else actor.group.position.set(BARQUERO_POSITION.x, 0, BARQUERO_POSITION.z);
        interactions[1].x = actor.group.position.x;
        interactions[1].z = actor.group.position.z;
        const dx = player.x - actor.group.position.x;
        const dz = player.z - actor.group.position.z;
        const target = Math.hypot(dx, dz) < 7
          ? Math.atan2(dx, dz) : actor.facing;
        const turn = Math.atan2(Math.sin(target - actor.group.rotation.y), Math.cos(target - actor.group.rotation.y));
        actor.group.rotation.y += THREE.MathUtils.clamp(turn, -step * 1.8, step * 1.8);
        continue;
      }
      actor.cooldown = Math.max(0, actor.cooldown - step);
      actor.rangedCooldown = Math.max(0, actor.rangedCooldown - step);
      actor.teleportCooldown = Math.max(0, actor.teleportCooldown - step);
      actor.hitAge = Math.max(0, actor.hitAge - step);
      actor.hitCooldown = Math.max(0, actor.hitCooldown - step);
      const distance = Math.hypot(player.x - actor.group.position.x, player.z - actor.group.position.z);
      if (actor.type === "testigo" && !progress.testigoIntroSeen) {
        actor.group.rotation.y = Math.atan2(player.x - actor.group.position.x, player.z - actor.group.position.z);
        if (distance < 7 && !actor.introTriggered)
          actor.introTriggered = onEvent?.("testigo-encounter") === true;
        continue;
      }
      if (actor.type === "testigo" && actor.hp(progress) === 0) continue;
      if (actor.vanishAge > 0) {
        actor.vanishAge = Math.max(0, actor.vanishAge - step);
        actor.warning.visible = actor.vanishAge > 0;
        actor.warning.scale.setScalar(1 + ((actor.type === "testigo" ? .8 : 1.15) - actor.vanishAge) * .65);
        actor.warning.material.opacity = .4 + .22 * Math.sin(elapsed * 15);
        if (actor.vanishAge === 0) {
          actor.model.visible = true;
          actor.warning.visible = false;
          actor.healthBar.sprite.visible = true;
          actor.rangedCooldown = Math.min(actor.rangedCooldown, .55);
          play(actor, "walk");
        }
        continue;
      }
      if (actor.type === "centinela" && distance < actor.detect && !actor.noticed) {
        actor.noticed = onEvent?.("sentinel-detected", Number(actor.id.at(-1))) === true;
        if (actor.noticed) continue;
      }
      if (actor.castAge > 0) {
        actor.castAge = Math.max(0, actor.castAge - step);
        actor.charge.visible = actor.castAge > 0;
        actor.chargeVisual.update(1 - actor.castAge / .85, elapsed, reducedMotion);
        actor.group.rotation.y = Math.atan2(player.x - actor.group.position.x, player.z - actor.group.position.z);
        if (!actor.castFired && actor.castAge <= .25) {
          actor.castFired = true;
          combat.fire(actor, player);
        }
        if (actor.castAge === 0) { actor.charge.visible = false; play(actor, "walk"); }
        continue;
      }
      if (actor.attackAge === 0 && actor.teleportCooldown === 0 && distance > (actor.type === "testigo" ? 6 : 2.4) && distance < actor.detect) {
        const destination = chooseEnemyReappearance(actor, player, progress.visionActive, (x, z, vision, clearance) => canStandInUnderworld(x, z, vision, clearance, progress));
        actor.teleportCooldown = actor.type === "testigo" ? 5.7 : actor.type === "gargola" ? 6.6 : 8;
        if (destination) {
          actor.group.position.set(destination.x, 0, destination.z);
          actor.model.visible = false;
          actor.healthBar.sprite.visible = false;
          actor.warning.visible = true;
          actor.charge.visible = false;
          actor.castAge = 0;
          actor.vanishAge = actor.type === "testigo" ? .8 : 1.15;
          continue;
        }
      }
      if (actor.attackAge > 0) {
        actor.attackAge -= step;
        if (!actor.attackDealt && actor.attackAge < .55) {
          actor.attackDealt = true;
          if (distance <= actor.range + .3) onDamage?.(1);
        }
        if (actor.attackAge <= 0) { actor.attackAge = 0; play(actor, "walk"); }
      } else if (distance <= actor.range && actor.cooldown === 0) {
        actor.cooldown = actor.type === "testigo" ? 1.45 : actor.type === "gargola" ? 1.7 : 1.8;
        actor.attackAge = .95;
        actor.attackDealt = false;
        const attacks = actor.actions.attacks;
        const attack = attacks[actor.attackCount++ % attacks.length];
        actor.action?.fadeOut(.12);
        attack?.reset().fadeIn(.12).play();
        actor.action = attack;
      } else if (actor.rangedCooldown === 0 && distance > actor.range + .45 && distance < actor.detect + .8) {
        actor.castAge = .85;
        actor.castFired = false;
        actor.rangedCooldown = actor.type === "testigo" ? 2.25 : actor.type === "gargola" ? 2.75 : 3;
        actor.charge.visible = true;
        actor.chargeVisual.update(0, elapsed, reducedMotion);
        actor.group.rotation.y = Math.atan2(player.x - actor.group.position.x, player.z - actor.group.position.z);
        const attacks = actor.actions.attacks;
        const cast = attacks[actor.attackCount++ % attacks.length];
        actor.action?.fadeOut(.12);
        cast?.reset().fadeIn(.12).play();
        actor.action = cast;
      } else if (distance < actor.detect && distance > actor.range * .8) {
        const moved = advanceUnderworldChase(actor.group.position, player, actor.speed, step, progress.visionActive, progress);
        play(actor, moved ? "walk" : "idle");
      } else {
        const phase = elapsed * .42 + actor.homeX * .8;
        const goalX = actor.homeX + Math.sin(phase) * 1.05;
        const goalZ = actor.homeZ + Math.cos(phase) * .75;
        const dx = goalX - actor.group.position.x;
        const dz = goalZ - actor.group.position.z;
        const length = Math.hypot(dx, dz);
        if (length > .06) {
          const nextX = actor.group.position.x + dx / length * actor.speed * .48 * step;
          const nextZ = actor.group.position.z + dz / length * actor.speed * .48 * step;
          if (canStandInUnderworld(nextX, nextZ, progress.visionActive, 1.35, progress)) {
            actor.group.position.x = nextX;
            actor.group.position.z = nextZ;
          }
          actor.group.rotation.y = Math.atan2(dx, dz);
        }
        play(actor, "walk");
      }
      if (distance < actor.detect) actor.group.rotation.y = Math.atan2(player.x - actor.group.position.x, player.z - actor.group.position.z);
      actor.group.position.y = actor.hitAge * .3;
    }
    combat.update(step, player, progress, reducedMotion);
    interactions[0].x = byId.get("alma").group.position.x;
    interactions[0].z = byId.get("alma").group.position.z;
  }

  function dispose() { for (const actor of actors) actor.mixer?.stopAllAction(); combat.dispose(); }
  return { interactions, loadAssets, getTargets, registerImpact, update, dispose,
    setFerrymanRide: (position) => { ferrymanRide = position; },
    getActorPosition: (id) => byId.get(id)?.group.position,
  };
}
