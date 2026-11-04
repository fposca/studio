import * as THREE from "three";
import { CURSED_HOPLITE, MEDUSA, MEDUSA_ARENA, findMedusaRoute, medusaPathClear, medusaCanSee, medusaPhase, segmentBlockedByCover } from "./parthenonExpansionLogic.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createFrequencyFragmentVisual } from "./parthenonRelicVisuals.js";
import { createOrbGlowTexture } from "./neonOrbVisuals.js";
import { createMedusaMirror, createMedusaBolt, createMedusaGaze, createMedusaImpact } from "./medusaCombatVisuals.js";

const HOPLITE_URL = new URL("../assets/neonboy-animaciones/espartano-caminando.glb", import.meta.url).href;
const HOPLITE_ATTACK_URL = new URL("../assets/neonboy-animaciones/espartano-atacando.anim.glb", import.meta.url).href;
const HOME = { x: 0, z: -20.5 };

function groundedClip(source, name, baseHeight) {
  const clip = source.clone(); clip.name = name;
  for (const track of clip.tracks) if (/Hips\.position$/.test(track.name)) {
    const height = baseHeight ?? track.values[1];
    for (let index = 0; index < track.values.length; index += 3) {
      track.values[index] = 0;
      track.values[index + 1] = height;
      track.values[index + 2] = 0;
    }
  }
  return clip;
}

export function createParthenonExpansion(root, obstacles, colliders, medusaSlot, medusaObstacle,
  { onEvent, onDamage, onStatus } = {}) {
  const hopliteHome = { ...HOME };
  const hoplite = new THREE.Group(); hoplite.name = "Hoplita maldito";
  hoplite.position.set(HOME.x, 0, HOME.z); root.add(hoplite);
  const placeholder = new THREE.Mesh(new THREE.CapsuleGeometry(.37, 1.25, 4, 10),
    new THREE.MeshStandardMaterial({ color: 0x544953, roughness: .86 }));
  placeholder.position.y = 1.08; placeholder.castShadow = true; hoplite.add(placeholder);
  const hopliteCollider = { id: "hoplita maldito", x: 999, z: HOME.z, radius: .45 };
  obstacles.push(hopliteCollider);
  const hopliteLight = new THREE.PointLight(0xb74fa2, 1.6, 3.5, 2);
  hopliteLight.position.y = 1.7; hoplite.add(hopliteLight);

  const covers = [[2.6, -31.1], [-3.1, -31.8]].map(([x, z], index) => {
    const group = new THREE.Group(); group.name = "columna de cobertura " + (index + 1);
    group.position.set(x, 0, z); root.add(group);
    const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c4bb, roughness: .88, emissive: 0x150716 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.66, .73, 3.65, 16), shaftMaterial);
    shaft.position.y = 1.9; shaft.castShadow = shaft.receiveShadow = true; group.add(shaft);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, .27, 1.7), shaftMaterial);
    cap.position.y = 3.8; cap.castShadow = true; group.add(cap);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, .32, 1.7), shaftMaterial);
    base.position.y = .16; base.castShadow = true; group.add(base);
    colliders.push(shaft, cap, base);
    const obstacle = { id: "boss cover", x: 999, z, radius: .73, unsafe: false };
    obstacles.push(obstacle);
    return { group, shaftMaterial, obstacle, x, z, radius: .73, unsafe: false };
  });

  const effectTexture = createOrbGlowTexture();
  const sightCovers = [...covers, ...obstacles.filter(obstacle => obstacle.id === "columna" && obstacle.radius)];
  const shields = [[-5.5, -34.2], [1.35, -33.1]].map(([x, z], index) => {
    const visual = createMedusaMirror(effectTexture, index);
    visual.group.position.set(x, 1.35, z); visual.group.visible = false; root.add(visual.group);
    const impact = createMedusaImpact(effectTexture, 0x9cece2); root.add(impact.root);
    return { ...visual, impact, x, z, index };
  });
  const gazeVisual = createMedusaGaze(MEDUSA.gazeRange, MEDUSA.gazeHalfAngle);
  const gaze = gazeVisual.mesh; root.add(gaze);
  const eyes = new THREE.Sprite(new THREE.SpriteMaterial({ map: effectTexture, color: 0xf777d7, transparent: true,
    opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  eyes.scale.set(.65, .38, 1); eyes.position.set(0, 1.94, .39); medusaSlot.add(eyes);
  const bossLight = new THREE.PointLight(0xd5329a, 0, 10, 2);
  bossLight.position.set(0, 1.9, .5); medusaSlot.add(bossLight);

  const bolts = Array.from({ length: 3 }, (_, index) => {
    const visual = createMedusaBolt(effectTexture, index); root.add(visual.mesh);
    const impact = createMedusaImpact(effectTexture, 0xed75bd); root.add(impact.root);
    return { ...visual, impact, dx: 0, dz: 0, distance: 0, active: false };
  });
  const medusaImpact = createMedusaImpact(effectTexture, 0xefa9e0); root.add(medusaImpact.root);
  const impacts = [...shields.map(shield => shield.impact), ...bolts.map(bolt => bolt.impact), medusaImpact];
  const impactPosition = new THREE.Vector3(), groundImpactDirection = new THREE.Vector3(0, -1, 0);
  const impactDirection = new THREE.Vector3(), mirrorIncoming = new THREE.Vector3(), mirrorOutgoing = new THREE.Vector3();
  let effectTime = 0;
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x92949b, transparent: true, opacity: .7,
    roughness: 1, depthWrite: false });
  const stoneEffect = new THREE.Group(); root.add(stoneEffect);
  for (let i = 0; i < 7; i++) {
    const shard = new THREE.Mesh(new THREE.DodecahedronGeometry(.13 + i % 3 * .045), stoneMaterial);
    shard.position.set(Math.cos(i * 2.4) * .42, .35 + i * .18, Math.sin(i * 2.4) * .3);
    stoneEffect.add(shard);
  }
  stoneEffect.visible = false;

  const fragmentVisual = createFrequencyFragmentVisual(effectTexture);
  const fragment = fragmentVisual.root;
  fragment.position.set(0, 2.2, -36); root.add(fragment);
  const fragmentInteraction = { id: "frequencyFragment02", label: "Fragmento de Frecuencia 02", x: 0, z: -36, reach: 0 };

  let loaderRef = null, fitRef = null, aliveRef = () => false, hopliteLoading = false;
  let hopliteMixer = null, walking = null, attacking = null;
  let hopliteState = "idle", hopliteHurt = 0, hopliteWindup = 0, hopliteRecovery = 0;
  let hoplitePatrol = 0, hopliteWakeSent = false;
  let playerPosition = { x: 0, z: 0 }, progress = null;
  const boss = { phase: "idle", health: MEDUSA.health, cycle: "charge", timer: MEDUSA.charge,
    phaseNumber: 1, introAge: 0, victoryAge: 0, petrification: 0, stun: 0,
    gazeYaw: 0, cycleCount: 0, boltTimer: 4, statusTimer: 0, moving: false, avoidSide: 1 };
  let audioContext = null;
  let medusaRoute = [], medusaRouteAge = 0, medusaRouteTarget = { x: 0, z: 0 };

  function tone(frequency = 110, seconds = .35, volume = .025) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContext ||= new Ctx();
      if (audioContext.state === "suspended") void audioContext.resume();
      const now = audioContext.currentTime, oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * .48), now + seconds);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, now + seconds);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now); oscillator.stop(now + seconds);
    } catch { /* Combat stays playable without Web Audio. */ }
  }
  function report(force = false) {
    if (!force && boss.statusTimer > 0) return;
    boss.statusTimer = .12;
    onStatus?.({ phase: boss.phase, health: boss.health, maxHealth: MEDUSA.health,
      phaseNumber: boss.phaseNumber, cycle: boss.cycle, petrification: boss.petrification,
      stun: boss.stun, introAge: boss.introAge, coverWarning: boss.phaseNumber === 3 && boss.cycle === "charge" && boss.cycleCount % 2 === 0 });
  }
  function clearBolts() { for (const bolt of bolts) { bolt.active = false; bolt.mesh.visible = false; } }
  function resetBoss(phase = "idle") {
    Object.assign(boss, { phase, health: MEDUSA.health, cycle: "charge", timer: MEDUSA.charge,
      phaseNumber: 1, introAge: 0, victoryAge: 0, petrification: 0, stun: 0,
      gazeYaw: 0, cycleCount: 0, boltTimer: 4, statusTimer: 0, moving: false, avoidSide: 1 });
    clearBolts(); gaze.visible = false; eyes.material.opacity = 0; bossLight.intensity = 0;
    shields.forEach(shield => shield.reset());
    impacts.forEach(impact => { impact.root.visible = false; });
    medusaRoute = []; medusaRouteAge = 0;
    covers.forEach(cover => { cover.unsafe = false; cover.obstacle.unsafe = false; });
    medusaSlot.position.set(8, 0, -37.4); medusaSlot.rotation.y = 0; medusaSlot.scale.y = 1;
    report(true);
  }
  function startBoss(p, skipIntro = false) {
    if (!p?.altarRead || p.cursedHopliteHealth > 0 || p.medusaBossDefeated || boss.phase === "active" || boss.phase === "intro") return false;
    resetBoss(skipIntro ? "active" : "intro");
    onEvent?.("medusa-start"); tone(155, .65, .04);
    return true;
  }
  function canEnemyMove(x, z) {
    if (Math.abs(x - hopliteHome.x) > 5.5 || Math.abs(z - hopliteHome.z) > 4.5) return false;
    return !obstacles.some(o => {
      if (o === hopliteCollider || o.x === 999) return false;
      if (o.radius) return Math.hypot(x - o.x, z - o.z) < o.radius + .46;
      return Math.abs(x - o.x) < o.hx + .46 && Math.abs(z - o.z) < o.hz + .46;
    });
  }
  function canMedusaStand(x, z) {
    const radius = .68;
    if (x < MEDUSA_ARENA.minX || x > MEDUSA_ARENA.maxX ||
      z < MEDUSA_ARENA.minZ || z > MEDUSA_ARENA.maxZ) return false;
    return !obstacles.some(obstacle => {
      if (obstacle === medusaObstacle || obstacle.x === 999) return false;
      if (Number.isFinite(obstacle.radius))
        return Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + radius;
      if (Number.isFinite(obstacle.hx) && Number.isFinite(obstacle.hz))
        return Math.abs(x - obstacle.x) < obstacle.hx + radius &&
          Math.abs(z - obstacle.z) < obstacle.hz + radius;
      return false;
    });
  }
  function chaseMedusa(player, step) {
    const targetX = THREE.MathUtils.clamp(player.x, MEDUSA_ARENA.minX, MEDUSA_ARENA.maxX);
    const targetZ = THREE.MathUtils.clamp(player.z, MEDUSA_ARENA.minZ, MEDUSA_ARENA.maxZ);
    const dx = targetX - medusaSlot.position.x, dz = targetZ - medusaSlot.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= MEDUSA.stopRange) return false;
    const speed = MEDUSA.chaseSpeed * (boss.cycle === "vulnerable" ? .55 : 1) *
      (boss.phaseNumber === 3 ? 1.25 : boss.phaseNumber === 2 ? 1.1 : 1);
    const stride = Math.min(speed * step, distance - MEDUSA.stopRange);
    const start = medusaSlot.position, target = { x: targetX, z: targetZ };
    if (medusaPathClear(start, target, canMedusaStand)) { medusaRoute = []; medusaRouteAge = 0; }
    else {
      medusaRouteAge -= step;
      if (medusaRouteAge <= 0 || Math.hypot(targetX - medusaRouteTarget.x, targetZ - medusaRouteTarget.z) > 1) {
        medusaRoute = findMedusaRoute(start, target, canMedusaStand);
        medusaRouteTarget = target; medusaRouteAge = .65;
      }
      while (medusaRoute.length && Math.hypot(medusaRoute[0].x - start.x, medusaRoute[0].z - start.z) < .55)
        medusaRoute.shift();
    }
    const waypoint = medusaRoute[0] || target;
    const waypointDistance = Math.hypot(waypoint.x - start.x, waypoint.z - start.z);
    if (waypointDistance < .01) return false;
    const heading = Math.atan2(waypoint.x - start.x, waypoint.z - start.z), side = boss.avoidSide;
    for (const offset of [0, side * .48, side * .95, side * 1.48, side * 1.75,
      -side * .48, -side * .95, -side * 1.48, -side * 1.75]) {
      const x = medusaSlot.position.x + Math.sin(heading + offset) * stride;
      const z = medusaSlot.position.z + Math.cos(heading + offset) * stride;
      if (!canMedusaStand(x, z)) continue;
      medusaSlot.position.set(x, medusaSlot.position.y, z);
      if (offset) boss.avoidSide = Math.sign(offset);
      return true;
    }
    return false;
  }
  async function ensureHoplite(loader, fitModel, isAlive) {
    loaderRef = loader; fitRef = fitModel; aliveRef = isAlive;
    if (hopliteLoading || hopliteMixer) return;
    hopliteLoading = true;
    try {
      const asset = await fitModel(loader, HOPLITE_URL, hoplite, 2.15);
      if (!asset) return;
      placeholder.visible = false;
      const walkClip = groundedClip(asset.gltf.animations[0], "hoplite walk");
      const baseHeight = walkClip.tracks.find(track => /Hips\.position$/.test(track.name))?.values[1];
      hopliteMixer = new THREE.AnimationMixer(asset.model);
      walking = hopliteMixer.clipAction(walkClip).play(); walking.paused = true;
      const attackAsset = await loader.loadAsync(HOPLITE_ATTACK_URL);
      if (isAlive() && attackAsset.animations.length) {
        const attackClip = groundedClip(attackAsset.animations[0], "hoplite kick", baseHeight);
        attacking = hopliteMixer.clipAction(attackClip);
        attacking.setLoop(THREE.LoopOnce, 1);
        attacking.clampWhenFinished = false;
      }
      disposeObjects([attackAsset.scene]);
    } catch { hopliteLoading = false; }
  }
  function applyTransform(id, transform) {
    if (id !== "cursedHoplite" || !transform) return;
    hopliteHome.x = transform.position[0]; hopliteHome.z = transform.position[2];
    if (hopliteState === "idle" || hopliteState === "patrol") hoplite.position.set(hopliteHome.x, transform.position[1], hopliteHome.z);
    hoplite.scale.setScalar(transform.scale);
    hoplite.userData.baseYaw = transform.rotation[1] * Math.PI / 180;
  }
  function mirrorNormal(shield, target) {
    mirrorIncoming.set(shield.x - playerPosition.x, 0, shield.z - playerPosition.z).normalize();
    mirrorOutgoing.set(medusaSlot.position.x - shield.x, 0, medusaSlot.position.z - shield.z).normalize();
    return target.copy(mirrorIncoming).sub(mirrorOutgoing).normalize();
  }
  function getTargets(p) {
    const targets = [];
    if (p?.altarRead && p.cursedHopliteHealth > 0 && hopliteHurt <= 0)
      targets.push({ kind: "parthenon-cursed-hoplite", position: new THREE.Vector3(hoplite.position.x, 1.2, hoplite.position.z), radius: .64 });
    if (boss.phase !== "active") return targets;
    const medusaPosition = new THREE.Vector3(medusaSlot.position.x, 1.45, medusaSlot.position.z);
    targets.push({ kind: "parthenon-medusa", position: medusaPosition, radius: .75 });
    if (boss.phaseNumber >= 2) for (const shield of shields) {
      const normal = mirrorNormal(shield, new THREE.Vector3());
      targets.push({ kind: "parthenon-boss-mirror", mirrorIndex: shield.index, position: new THREE.Vector3(shield.x, 1.35, shield.z),
        radius: .63, reflect: true, normal });
    }
    return targets;
  }
  function registerImpact(target) {
    if (target.kind === "parthenon-cursed-hoplite" && progress?.cursedHopliteHealth > 0) {
      hopliteHurt = CURSED_HOPLITE.hurtTime;
      const gap = Math.hypot(hoplite.position.x - playerPosition.x, hoplite.position.z - playerPosition.z) || 1;
      const recoilX = hoplite.position.x + (hoplite.position.x - playerPosition.x) / gap * .22;
      const recoilZ = hoplite.position.z + (hoplite.position.z - playerPosition.z) / gap * .22;
      if (canEnemyMove(recoilX, recoilZ)) hoplite.position.set(recoilX, hoplite.position.y, recoilZ);
      hopliteWindup = 0; hopliteLight.color.setHex(0x86e9f4);
    }
    if (target.kind === "parthenon-boss-mirror" && boss.phase === "active") {
      const shield = shields[target.mirrorIndex];
      if (shield) { shield.hit(); shield.impact.trigger(shield.group.position, shield.normal); }
      tone(700, .16, .025); return;
    }
    if (target.kind !== "parthenon-medusa" || boss.phase !== "active") return;
    if (boss.cycle !== "vulnerable") {
      tone(240, .18, .016); onEvent?.("medusa-rejected"); return;
    }
    impactPosition.set(medusaSlot.position.x, 1.45, medusaSlot.position.z);
    impactDirection.set(medusaSlot.position.x - playerPosition.x, 0, medusaSlot.position.z - playerPosition.z).normalize();
    medusaImpact.trigger(impactPosition, impactDirection);
    boss.health = Math.max(0, boss.health - 1);
    tone(boss.health ? 350 : 75, boss.health ? .35 : 1.2, .04);
    onEvent?.("medusa-hit");
    if (boss.health === 4 || boss.health === 2) {
      boss.phaseNumber = medusaPhase(boss.health);
      onEvent?.("medusa-phase-" + boss.phaseNumber);
    }
    if (boss.health === 0) {
      boss.phase = "victory"; boss.victoryAge = 0; clearBolts();
      onEvent?.("medusa-defeat");
    }
    report(true);
  }
  function spawnBolt(player) {
    const bolt = bolts.find(entry => !entry.active);
    if (!bolt) return;
    const dx = player.x - medusaSlot.position.x, dz = player.z - medusaSlot.position.z;
    const length = Math.hypot(dx, dz) || 1;
    bolt.dx = dx / length; bolt.dz = dz / length; bolt.distance = 0; bolt.active = true;
    bolt.reset(); bolt.mesh.visible = true;
    bolt.mesh.rotation.y = Math.atan2(bolt.dx, bolt.dz);
    bolt.mesh.position.set(medusaSlot.position.x + bolt.dx * .9, .11, medusaSlot.position.z + bolt.dz * .9);
    tone(330, .2, .018);
  }
  function nextCycle() {
    if (boss.cycle === "charge") {
      boss.cycle = "gaze"; boss.timer = MEDUSA.gaze; boss.cycleCount++;
      boss.gazeYaw = medusaSlot.rotation.y; tone(550, .42, .035);
    } else if (boss.cycle === "gaze") {
      boss.cycle = "vulnerable"; boss.timer = MEDUSA.vulnerable;
      covers.forEach(cover => { cover.unsafe = false; cover.obstacle.unsafe = false; });
      tone(180, .37, .025);
    } else if (boss.cycle === "vulnerable") {
      boss.cycle = "recover"; boss.timer = MEDUSA.recovery;
    } else {
      boss.cycle = "charge"; boss.timer = boss.phaseNumber === 1 ? MEDUSA.charge : MEDUSA.charge * .82;
    }
    report(true);
  }
  function update(dt, elapsed, p, player, paused, camera, reducedMotion = false) {
    progress = p; playerPosition = player;
    const step = paused ? 0 : Math.min(dt, .05);
    effectTime += step;
    impacts.forEach(impact => impact.update(step));
    hoplite.visible = Boolean(p?.altarRead && p.cursedHopliteHealth > 0);
    hopliteCollider.x = hoplite.visible ? hoplite.position.x : 999;
    hopliteCollider.z = hoplite.position.z;
    if (hoplite.visible && player.z < -12 && loaderRef) void ensureHoplite(loaderRef, fitRef, aliveRef);
    covers.forEach(cover => { cover.group.visible = Boolean(p?.altarRead); cover.obstacle.x = cover.group.visible ? cover.x : 999; });
    fragment.visible = Boolean(p?.medusaBossDefeated && boss.phase !== "victory" && !p.frequencyFragment02Collected);
    fragmentInteraction.reach = fragment.visible ? 2.8 : 0;
    if (fragment.visible) fragmentVisual.update(step, reducedMotion);
    if (hoplite.visible && step > 0) {
      const gap = Math.hypot(player.x - hoplite.position.x, player.z - hoplite.position.z);
      if (!p.cursedHopliteAwake && gap < 7 && !hopliteWakeSent) {
        hopliteWakeSent = true; onEvent?.("cursed-hoplite-wake");
      }
      hopliteHurt = Math.max(0, hopliteHurt - step);
      hopliteRecovery = Math.max(0, hopliteRecovery - step);
      if (hopliteHurt > 0) hopliteState = "hurt";
      else if (hopliteWindup > 0) {
        hopliteWindup -= step; hopliteState = "attack";
        if (hopliteWindup <= 0) {
          if (gap < CURSED_HOPLITE.attackRange + .3) onDamage?.(1);
          hopliteRecovery = CURSED_HOPLITE.recovery;
        }
      } else if (p.cursedHopliteAwake && gap < CURSED_HOPLITE.attackRange && hopliteRecovery <= 0) {
        hopliteWindup = CURSED_HOPLITE.windup; hopliteState = "attack";
        attacking?.reset().play();
      } else {
        let tx, tz, speed;
        if (p.cursedHopliteAwake && gap < CURSED_HOPLITE.detectRange) {
          tx = player.x; tz = player.z; speed = CURSED_HOPLITE.speed; hopliteState = "chase";
        } else {
          hoplitePatrol += step * .75;
          tx = hopliteHome.x + Math.sin(hoplitePatrol) * 1.55;
          tz = hopliteHome.z + Math.cos(hoplitePatrol) * .65;
          speed = CURSED_HOPLITE.patrolSpeed; hopliteState = "patrol";
        }
        const distance = Math.hypot(tx - hoplite.position.x, tz - hoplite.position.z);
        if (distance > .15) {
          const nx = hoplite.position.x + (tx - hoplite.position.x) / distance * speed * step;
          const nz = hoplite.position.z + (tz - hoplite.position.z) / distance * speed * step;
          if (canEnemyMove(nx, hoplite.position.z)) hoplite.position.x = nx;
          if (canEnemyMove(hoplite.position.x, nz)) hoplite.position.z = nz;
          hoplite.rotation.y = Math.atan2(tx - hoplite.position.x, tz - hoplite.position.z);
        }
      }
      hopliteLight.intensity = hopliteState === "attack" ? 4.4 : hopliteState === "hurt" ? 5 : 1.6;
      hopliteLight.color.setHex(hopliteState === "hurt" ? 0x86e9f4 : 0xb74fa2);
      if (walking) { walking.paused = !["patrol", "chase"].includes(hopliteState); walking.setEffectiveWeight(hopliteState === "attack" ? 0 : 1); }
      attacking?.setEffectiveWeight(hopliteState === "attack" ? 1 : 0);
      hopliteMixer?.update(step);
      hopliteCollider.x = hoplite.position.x; hopliteCollider.z = hoplite.position.z;
    }

    if (boss.statusTimer > 0) boss.statusTimer -= step;
    if (boss.phase === "intro" && step > 0) {
      boss.introAge += step;
      const first = boss.introAge < 2.7;
      if (camera) {
        camera.position.set(first ? -5.5 : 5.1, first ? 2.3 : 2.8, first ? -31 : -30.5);
        camera.lookAt(first ? 0 : medusaSlot.position.x, first ? 1.2 : 1.7, first ? -35 : medusaSlot.position.z);
      }
      medusaSlot.rotation.y = 0;
      eyes.material.opacity = Math.min(.8, boss.introAge / 5 * .8);
      bossLight.intensity = Math.min(4, boss.introAge * .8);
      if (boss.introAge >= 6.2) { boss.phase = "active"; boss.timer = MEDUSA.charge; onEvent?.("medusa-battle"); }
      report();
    }
    if (boss.phase === "active" && step > 0) {
      boss.phaseNumber = medusaPhase(boss.health);
      boss.timer -= step;
      if (boss.timer <= 0) nextCycle();
      if (boss.cycle === "gaze") medusaRouteAge = 0;
      boss.moving = boss.cycle !== "gaze" && chaseMedusa(player, step);
      const targetYaw = Math.atan2(player.x - medusaSlot.position.x, player.z - medusaSlot.position.z);
      if (boss.cycle !== "gaze") {
        const delta = Math.atan2(Math.sin(targetYaw - medusaSlot.rotation.y), Math.cos(targetYaw - medusaSlot.rotation.y));
        medusaSlot.rotation.y += THREE.MathUtils.clamp(delta, -step * 1.5, step * 1.5);
      }
      if (boss.phaseNumber >= 2) {
        boss.boltTimer -= step;
        if (boss.boltTimer <= 0) { spawnBolt(player); boss.boltTimer = boss.phaseNumber === 3 ? 3 : 4.4; }
      }
      medusaObstacle.x = medusaSlot.position.x; medusaObstacle.z = medusaSlot.position.z;
      const unsafe = boss.phaseNumber === 3 && boss.cycle === "gaze" && boss.cycleCount % 2 === 1;
      covers[0].unsafe = unsafe; covers[0].obstacle.unsafe = unsafe;
      covers[0].shaftMaterial.emissive.setHex(boss.phaseNumber === 3 && ["charge", "gaze"].includes(boss.cycle) && boss.cycleCount % 2 === 0 ? 0x552817 : 0x150716);
      eyes.material.opacity = boss.cycle === "gaze" ? .95 : boss.cycle === "charge" ? .57 : .23;
      bossLight.intensity = boss.cycle === "gaze" ? 6.5 : boss.cycle === "charge" ? 3.8 : 1.6;
      gaze.position.set(medusaSlot.position.x, 0, medusaSlot.position.z);
      gaze.rotation.y = boss.cycle === "gaze" ? boss.gazeYaw : medusaSlot.rotation.y;
      const gazeHits = boss.cycle === "gaze" && medusaCanSee(player, medusaSlot.position, boss.gazeYaw, sightCovers);
      boss.petrification = THREE.MathUtils.clamp(boss.petrification + (gazeHits ? MEDUSA.petrifyRate : -MEDUSA.petrifyRecovery) * step, 0, 1);
      if (boss.petrification >= 1) {
        boss.petrification = 0; boss.stun = MEDUSA.stunTime;
        onDamage?.(1); onEvent?.("medusa-petrify"); tone(75, .7, .045);
      }
      boss.stun = Math.max(0, boss.stun - step);
      stoneEffect.visible = boss.stun > 0;
      stoneEffect.position.set(player.x, player.y, player.z);
      for (const bolt of bolts) if (bolt.active) {
        const previous = { x: bolt.mesh.position.x, z: bolt.mesh.position.z };
        bolt.mesh.position.x += bolt.dx * MEDUSA.groundSpeed * step;
        bolt.mesh.position.z += bolt.dz * MEDUSA.groundSpeed * step;
        bolt.update(step, effectTime);
        bolt.distance += MEDUSA.groundSpeed * step;
        const blocked = segmentBlockedByCover(previous, bolt.mesh.position, sightCovers);
        const hitPlayer = !blocked && bolt.distance <= 15 && Math.hypot(player.x - bolt.mesh.position.x, player.z - bolt.mesh.position.z) < .68;
        if (blocked || hitPlayer || bolt.distance > 15) {
          if (blocked || hitPlayer) {
            impactPosition.copy(bolt.mesh.position); impactPosition.y = .12;
            bolt.impact.trigger(impactPosition, groundImpactDirection);
          }
          bolt.active = false; bolt.mesh.visible = false;
          if (hitPlayer) onDamage?.(1);
        }
      }
      report();
    } else if (boss.phase !== "intro") {
      stoneEffect.visible = false;
    }
    if (boss.phase === "victory" && step > 0) {
      boss.victoryAge += step;
      eyes.material.opacity = Math.max(0, .85 - boss.victoryAge * .32);
      bossLight.intensity = Math.max(0, 5 - boss.victoryAge * 1.5);
      medusaSlot.scale.y = Math.max(.05, 1 - boss.victoryAge / 3.2);
      if (boss.victoryAge >= 3.4) { boss.phase = "idle"; medusaSlot.scale.y = 1; report(true); }
    }
    shields.forEach(shield => {
      shield.group.visible = boss.phase === "active" && boss.phaseNumber >= 2;
      if (!shield.group.visible) return;
      mirrorNormal(shield, impactDirection);
      // The normal's sign does not affect the rebound; present the ornate face to the player.
      if (impactDirection.dot(mirrorIncoming) > 0) impactDirection.negate();
      shield.update(step, effectTime, impactDirection);
    });
    gaze.visible = boss.phase === "active" && ["charge", "gaze"].includes(boss.cycle);
    gazeVisual.update(effectTime, boss.cycle === "gaze");
    if (p?.medusaBossDefeated && boss.phase !== "victory") medusaSlot.visible = false;
    if (boss.phase !== "idle") report();
  }
  function stopAnimations() { hopliteMixer?.stopAllAction(); }
  function dispose() {
    stopAnimations(); clearBolts();
    shields.forEach(shield => shield.reset());
    impacts.forEach(impact => { impact.root.visible = false; });
    if (audioContext) void audioContext.close().catch(() => {});
  }
  const setLoader = (loader, fitModel, isAlive) => { loaderRef = loader; fitRef = fitModel; aliveRef = isAlive; };
  return { fragmentInteraction, setLoader, ensureHoplite, applyTransform, getTargets, registerImpact, update,
    startBoss, resetBoss, getStatus: () => ({ ...boss }), locksPlayer: () => boss.phase === "intro" || boss.stun > 0,
    getVisualState: () => boss.phase === "active" ? boss.cycle : boss.phase, stopAnimations, dispose };
}
