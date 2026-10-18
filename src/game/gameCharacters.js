import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { NEONBOY_NEW_WALK_GAIT_UNITS_PER_SECOND, syncedGaitRate } from "../editors/walkGait.js";
import { ATTACKS, attackEnvelope, GRAVITY, JUMP_SPEED, RUN_SPEED } from "./gameRules.js";
import { createWeaponModel } from "./gameWeapons.js";
import { createHandGrip } from "./gameGrip.js";
import { landingCompression } from "./gameLocomotion.js";

const idleUrl = new URL("../assets/neonboy-animaciones/neon-inactivo-hd.glb", import.meta.url).href;
const walkUrl = new URL("../assets/neonboy-animaciones/neonboy-new-walk.anim.glb", import.meta.url).href;
const runUrl = new URL("../assets/neonboy-animaciones/run.glb", import.meta.url).href;
const jumpUrl = new URL("../assets/neonboy-animaciones/neonboy-new-jump.anim.glb", import.meta.url).href;
const kickUrl = new URL("../assets/neonboy-animaciones/patada.glb", import.meta.url).href;
const fistUrl = new URL("../assets/neonboy-animaciones/neon-fist.glb", import.meta.url).href;
const enemyUrl = new URL("../assets/neonboy-animaciones/reptiliano-walk.glb", import.meta.url).href;
const demonUrl = new URL("../assets/neonboy-animaciones/demonio-alado-2.glb", import.meta.url).href;
const templeBossUrl = new URL("../assets/neonboy-animaciones/enemigo-nivel-1-caminando.glb", import.meta.url).href;
const heartUrl = new URL("../assets/neonboy-animaciones/vida.optimized.glb", import.meta.url).href;
const coinUrl = new URL("../assets/neonboy-animaciones/moneda.optimized.glb", import.meta.url).href;
const swordUrl = new URL("../assets/neonboy-animaciones/espada.glb", import.meta.url).href;
const hammerUrl = new URL("../assets/neonboy-animaciones/hacha.glb", import.meta.url).href;
const axeUrl = new URL("../assets/neonboy-animaciones/hax.glb", import.meta.url).href;
const dragonUrl = new URL("../assets/neonboy-animaciones/dragon.game.glb", import.meta.url).href;

export function disposeObjects(roots) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  for (const root of roots) root?.traverse((object) => {
    if (object.userData.sharedGameAsset) return;
    if (object.geometry) geometries.add(object.geometry);
    if (object.skeleton) skeletons.add(object.skeleton);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  skeletons.forEach((value) => value.dispose());
  geometries.forEach((value) => value.dispose());
  materials.forEach((value) => value.dispose());
  textures.forEach((value) => value.dispose());
}

function inPlaceClip(source, name) {
  const clip = source.clone();
  clip.name = name;
  const start = Math.min(...clip.tracks.map((track) => track.times[0]));
  for (const track of clip.tracks) {
    track.shift(-start);
    if (/Hips\.position$/.test(track.name)) {
      const restingHeight = track.values[1];
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = 0;
        if (name === "jump") track.values[i + 1] = restingHeight;
        track.values[i + 2] = 0;
      }
    }
  }
  clip.resetDuration();
  return clip;
}

function prepareGameTextures(scene) {
  const textures = new Set();
  scene.traverse((object) => {
    if (!object.isMesh) return;
    for (const material of [object.material].flat()) {
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const texture of textures) {
    const image = texture.image;
    if (!image || Math.max(image.width, image.height) <= 1024) continue;
    const ratio = 1024 / Math.max(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);
    try {
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      texture.image = canvas;
      texture.needsUpdate = true;
    } catch { /* Use the original texture if the image cannot be resampled. */ }
  }
}

export async function loadGameCharacters(onProgress) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let loaded = 0;
  const urls = [idleUrl, walkUrl, runUrl, jumpUrl, kickUrl, fistUrl, enemyUrl, demonUrl, templeBossUrl, swordUrl, hammerUrl, axeUrl, heartUrl, coinUrl, dragonUrl];
  const results = await Promise.allSettled(urls.map(async (url) => {
    const asset = await loader.loadAsync(url);
    onProgress?.(++loaded / urls.length);
    return asset;
  }));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    disposeObjects(results.filter((result) => result.status === "fulfilled").map((result) => result.value.scene));
    throw failed.reason;
  }
  const [idle, walk, run, jump, kick, fist, enemy, demon, templeBoss, sword, hammer, axe, heart, coin, dragon] = results.map((result) => result.value);
  const idleClip = inPlaceClip(idle.animations.find((clip) => clip.duration > 0.25), "idle");
  const walkClip = inPlaceClip(walk.animations.find((clip) => clip.duration > 0.25), "walk");
  const runClip = inPlaceClip(run.animations.find((clip) => clip.duration > 0.25), "run");
  const jumpClip = inPlaceClip(jump.animations.find((clip) => clip.duration > 0.25), "jump");
  const kickClip = inPlaceClip(kick.animations.find((clip) => clip.duration > 0.25), "kick");
  const punchClip = inPlaceClip(fist.animations.find((clip) => clip.duration > 0.25), "punch");
  const enemyClip = inPlaceClip(enemy.animations.find((clip) => clip.duration > 0.25), "walk");
  const demonClip = inPlaceClip(demon.animations.find((clip) => clip.duration > 0.25), "demon-idle");
  const templeBossClip = inPlaceClip(templeBoss.animations.find((clip) => clip.duration > 0.25), "temple-boss-walk");
  prepareGameTextures(heart.scene);
  prepareGameTextures(dragon.scene);
  coin.scene.traverse((object) => {
    if (!object.isMesh) return;
    for (const material of [object.material].flat()) {
      material.color.set(0xffce79);
      material.metalness = 0.55;
      material.roughness = 0.5;
      material.emissiveMap = null;
      material.emissive.set(0x9a6522);
      material.emissiveIntensity = 0.26;
      material.needsUpdate = true;
    }
  });
  // Locomotion clips share the idle rig; their duplicate meshes are not needed.
  disposeObjects([walk.scene, run.scene, jump.scene, kick.scene, fist.scene]);
  const weapons = { sword: sword.scene, hammer: hammer.scene, axe: axe.scene };
  return { player: { scene: idle.scene, idleClip, walkClip, runClip, jumpClip, kickClip, punchClip, weapons }, weapons, heart: heart.scene, coin: coin.scene, dragon,
    enemy: { scene: enemy.scene, idleClip: null, walkClip: enemyClip },
    demon: { scene: demon.scene, idleClip: demonClip, walkClip: demonClip, demon: true },
    templeBoss: { scene: templeBoss.scene, idleClip: null, walkClip: templeBossClip, templeBoss: true },
    dispose: () => disposeObjects([idle.scene, enemy.scene, demon.scene, templeBoss.scene, sword.scene, hammer.scene, axe.scene, heart.scene, coin.scene, dragon.scene]) };
}

export async function loadInteriorCharacters(onProgress) {
  const urls = {
    hoplite: new URL("../assets/neonboy-animaciones/espartano-caminando.glb", import.meta.url).href,
    hopliteAttack: new URL("../assets/neonboy-animaciones/espartano-atacando.glb", import.meta.url).href,
    statue: new URL("../assets/neonboy-animaciones/estatua-reposo.glb", import.meta.url).href,
    statueAttack: new URL("../assets/neonboy-animaciones/estatua-ataque.glb", import.meta.url).href,
    medusa: new URL("../assets/neonboy-animaciones/medusa-estatica.glb", import.meta.url).href,
    medusaWalk: new URL("../assets/neonboy-animaciones/medusa-camina.glb", import.meta.url).href,
    medusaAttack: new URL("../assets/neonboy-animaciones/medusa-ataque.glb", import.meta.url).href,
    plato: new URL("../assets/neonboy-animaciones/platon.glb", import.meta.url).href
  };
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const retained = [], assets = {};
  let loaded = 0;
  try {
    // Load only upon entering the sanctuary, discarding duplicate animated meshes immediately.
    for (const [key, url] of Object.entries(urls)) {
      const asset = await loader.loadAsync(url);
      const clip = asset.animations.find((entry) => entry.duration > 0.25);
      if (!clip) { disposeObjects([asset.scene]); throw new Error(`El modelo ${key} no tiene animacion.`); }
      const animation = inPlaceClip(clip, key);
      if (/Attack|Walk/.test(key)) {
        const base = key.replace(/Attack|Walk/, "");
        assets[base][key.endsWith("Attack") ? "attackClip" : "walkClip"] = animation;
        disposeObjects([asset.scene]);
      } else {
        prepareGameTextures(asset.scene);
        retained.push(asset.scene);
        assets[key] = { scene: asset.scene, walkClip: animation,
          idleClip: key === "hoplite" ? null : animation.clone(), interior: true };
      }
      onProgress?.(++loaded / Object.keys(urls).length);
    }
    Object.assign(assets.hoplite, { name: "Hoplita", height: 1.95 });
    Object.assign(assets.statue, { name: "Estatua guardiana", height: 2.1 });
    Object.assign(assets.medusa, { name: "Medusa", height: 2.7 });
    return { ...assets, dispose: () => disposeObjects(retained) };
  } catch (error) { disposeObjects(retained); throw error; }
}

export async function loadCemeteryCharacters(onProgress) {
  const urls = [
    ["zombie", "zombie-walkk.glb"],
    ["zombieBoss", "zombie-jefe-walk.glb"],
    ["zombieAttack", "zombie-kik.clip.glb"],
    ["bossSweep", "zombie-jefe-atque-1.clip.glb"],
    ["bossCrush", "zombie-jefe-ataque2.clip.glb"]
  ];
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const retained = [], clips = {};
  let loaded = 0;
  try {
    for (const [key, filename] of urls) {
      const asset = await loader.loadAsync(new URL(`../assets/neonboy-animaciones/${filename}`, import.meta.url).href);
      const clip = asset.animations.find((entry) => entry.duration > 0.25);
      if (!clip) { disposeObjects([asset.scene]); throw new Error(`El modelo ${key} no tiene animacion.`); }
      clips[key] = inPlaceClip(clip, key);
      if (key === "zombie" || key === "zombieBoss") { prepareGameTextures(asset.scene); retained.push(asset.scene); clips[`${key}Scene`] = asset.scene; }
      else disposeObjects([asset.scene]);
      onProgress?.(++loaded / urls.length);
    }
    return {
      zombie: { scene: clips.zombieScene, walkClip: clips.zombie, idleClip: null,
        attackClip: clips.zombieAttack, name: "Zombi", height: 1.98 },
      zombieBoss: { scene: clips.zombieBossScene, walkClip: clips.zombieBoss, idleClip: null,
        attackClips: { zombieSweep: clips.bossSweep, zombieCrush: clips.bossCrush }, name: "Zombi jefe", height: 3.15 },
      dispose: () => disposeObjects(retained)
    };
  } catch (error) { disposeObjects(retained); throw error; }
}

export async function loadCatacombCharacters(onProgress) {
  const files = [
    ["mummy", "mummy-walk.game.glb"], ["mummyChief", "mummy-chief-walk.game.glb"],
    ["mummyAttack", "mummy-attack.clip.glb"], ["chiefAttack", "mummy-chief-attack.clip.glb"],
    ["plato", "platon.game.glb"], ["scythe", "guadana.game.glb"], ["crossbow", "ballesta.game.glb"]
  ];
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const retained = [], loaded = {};
  try {
    for (const [index, [key, filename]] of files.entries()) {
      const asset = await loader.loadAsync(new URL(`../assets/neonboy-animaciones/${filename}`, import.meta.url).href);
      if (!["mummyAttack", "chiefAttack"].includes(key)) { prepareGameTextures(asset.scene); retained.push(asset.scene); }
      else disposeObjects([asset.scene]);
      loaded[key] = asset;
      onProgress?.((index + 1) / files.length);
    }
    const clip = (asset, name) => inPlaceClip(asset.animations.find((entry) => entry.duration > 0.25), name);
    return {
      mummy: { scene: loaded.mummy.scene, walkClip: clip(loaded.mummy, "mummy-walk"),
        attackClip: clip(loaded.mummyAttack, "mummy"), name: "Momia", height: 1.98 },
      mummyChief: { scene: loaded.mummyChief.scene, walkClip: clip(loaded.mummyChief, "mummy-chief-walk"),
        attackClip: clip(loaded.chiefAttack, "mummyChief"), weaponScene: loaded.scythe.scene,
        name: "Momia jefe", height: 3.08 },
      plato: { scene: loaded.plato.scene, idleClip: clip(loaded.plato, "plato") },
      crossbowScene: loaded.crossbow.scene,
      dispose: () => disposeObjects(retained)
    };
  } catch (error) { disposeObjects(retained); throw error; }
}

export function createPlato(asset, quest) {
  const root = new THREE.Group(), model = clone(asset.scene);
  root.name = "Platon";
  root.position.set(quest.x, quest.y, quest.z);
  model.updateMatrixWorld(true);
  model.scale.multiplyScalar(1.8 / new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y);
  model.position.y -= new THREE.Box3().setFromObject(model).min.y;
  model.traverse((object) => {
    if (object.isMesh) { object.castShadow = object.receiveShadow = true; object.frustumCulled = false; object.userData.sharedGameAsset = true; }
  });
  root.add(model);
  const mixer = new THREE.AnimationMixer(model);
  mixer.clipAction(asset.idleClip).play();
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x8ee5cf, toneMapped: false }));
  marker.position.y = 2.15; root.add(marker);
  return { root,
    update(player, stage, dt, time) {
      mixer.update(dt);
      if (Math.hypot(player.x - quest.x, player.z - quest.z) < 6) root.rotation.y = Math.atan2(player.x - quest.x, player.z - quest.z);
      marker.visible = stage === "unstarted" || stage === "returning";
      marker.position.y = 2.15 + Math.sin(time * 2) * 0.07; marker.rotation.y = time;
    },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(model); model.traverse((object) => object.skeleton?.dispose()); disposeObjects([marker]); }
  };
}

export function createGameCharacter(asset, hostile = false, { boss = false } = {}) {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  const model = clone(asset.scene);
  root.name = asset.name || (boss ? "Guardian del Partenon" : hostile ? asset.demon ? "Demonio" : "Guardian" : "Neonboy");
  root.add(visual);
  visual.add(model);
  const bones = new Map(), materials = [];
  model.traverse((object) => {
    if (object.isBone) bones.set(object.name.replace(/[^a-z0-9]/gi, "").replace(/^mixamorig/i, ""), object);
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;
    const originals = [object.material].flat();
    const copies = originals.map((source) => {
      const material = source.clone();
      material.envMapIntensity = 0.65;
      materials.push({ material, emissive: material.emissive?.clone(), intensity: material.emissiveIntensity });
      return material;
    });
    object.material = Array.isArray(object.material) ? copies : copies[0];
  });
  model.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const scale = (asset.height || (boss ? 3.7 : asset.demon ? 2.35 : hostile ? 1.9 : 1.85)) / size.y;
  model.scale.multiplyScalar(scale);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y -= bounds.min.y;
  const mixer = new THREE.AnimationMixer(model);
  const walkAction = mixer.clipAction(asset.walkClip).play();
  const idleAction = asset.idleClip && !asset.demon ? mixer.clipAction(asset.idleClip).play() : null;
  const runAction = asset.runClip ? mixer.clipAction(asset.runClip).play() : null;
  const jumpAction = asset.jumpClip ? mixer.clipAction(asset.jumpClip).play() : null;
  if (jumpAction) { jumpAction.setLoop(THREE.LoopOnce, 1); jumpAction.clampWhenFinished = true; }
  const kickAction = asset.kickClip ? mixer.clipAction(asset.kickClip).play() : null;
  if (kickAction) { kickAction.setLoop(THREE.LoopOnce, 1); kickAction.clampWhenFinished = true; }
  const punchAction = asset.punchClip ? mixer.clipAction(asset.punchClip).play() : null;
  const enemyAttackActions = new Map(Object.entries(asset.attackClips || (asset.attackClip ? { default: asset.attackClip } : {}))
    .map(([kind, clip]) => [kind, mixer.clipAction(clip).play()]));
  for (const action of enemyAttackActions.values()) {
    action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.setEffectiveWeight(0);
  }
  if (punchAction) { punchAction.setLoop(THREE.LoopOnce, 1); punchAction.clampWhenFinished = true; }
  walkAction.setEffectiveWeight(0);
  if (idleAction) idleAction.setEffectiveWeight(1);
  runAction?.setEffectiveWeight(0);
  jumpAction?.setEffectiveWeight(0);
  kickAction?.setEffectiveWeight(0);
  punchAction?.setEffectiveWeight(0);
  mixer.update(0);
  let walkWeight = 0, jumpWeight = 0, guardWeight = 0, heavyWalkWeight = 0, runWeight = 0, kickWeight = 0, punchWeight = 0;
  let wasAirborne = false, lastKickAttack = null, lastPunchAttack = null, lastEnemyAttack = null, enemyAttackWeight = 0;
  const animatedPose = [...bones.values()].map((bone) => ({ bone, quaternion: bone.quaternion.clone(), position: bone.position.clone() }));
  const currentDirection = new THREE.Vector3(), targetDirection = new THREE.Vector3();
  const bonePosition = new THREE.Vector3(), childPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  const desiredQuaternion = new THREE.Quaternion(), deltaQuaternion = new THREE.Quaternion();
  const grip = !hostile || asset.weaponScene ? createHandGrip(model, bones.get("RightHand")) : null;
  const weaponKinds = hostile ? (asset.weaponScene ? [asset.weaponKind || "scythe"] : []) : ["sword", "axe", "hammer", "crossbow"].filter((kind) => asset.weapons[kind]);
  const weapons = weaponKinds.map((kind) => {
    const mesh = createWeaponModel(kind, hostile ? asset.weaponScene : asset.weapons[kind]);
    mesh.visible = false;
    grip?.socket.add(mesh);
    return { kind, mesh };
  });

  // Aim in character space, then convert back to each bone's actual parent space.
  // The imported Mixamo arms and legs have different local axes.
  function aim(name, childName, direction, weight) {
    const bone = bones.get(name), child = bones.get(childName);
    if (!bone || !child || weight <= 0) return;
    root.updateMatrixWorld(true);
    bone.getWorldPosition(bonePosition);
    child.getWorldPosition(childPosition);
    currentDirection.subVectors(childPosition, bonePosition).normalize();
    root.getWorldQuaternion(worldQuaternion);
    targetDirection.set(...direction).normalize().applyQuaternion(worldQuaternion);
    deltaQuaternion.setFromUnitVectors(currentDirection, targetDirection);
    bone.getWorldQuaternion(worldQuaternion);
    bone.parent.getWorldQuaternion(parentQuaternion).invert();
    desiredQuaternion.copy(parentQuaternion).multiply(deltaQuaternion).multiply(worldQuaternion);
    bone.quaternion.slerp(desiredQuaternion, weight);
  }

  const ringMaterial = new THREE.MeshBasicMaterial({ color: hostile ? 0xf36555 : 0x62edcb, transparent: true,
    opacity: hostile ? 0.5 : 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(boss ? 1.05 : hostile ? 0.46 : 0.37, boss ? 1.12 : hostile ? 0.5 : 0.4, 48), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  root.add(ring);
  const healthGroup = new THREE.Group();
  const healthBack = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.075), new THREE.MeshBasicMaterial({ color: 0x181e20, depthWrite: false }));
  const healthFill = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.043), new THREE.MeshBasicMaterial({ color: 0xf36555, depthWrite: false }));
  healthBack.renderOrder = 20;
  healthFill.renderOrder = 21;
  healthFill.position.z = 0.005;
  healthGroup.add(healthBack, healthFill);
  healthGroup.position.y = asset.height ? asset.height + 0.25 : asset.demon ? 2.65 : 2.2;
  healthGroup.visible = hostile;
  root.add(healthGroup);

  return {
    root,
    update(actor, dt, camera, time) {
      if (actor.active === false && !asset.interior) { root.visible = false; return; }
      root.position.set(actor.x, actor.y, actor.z);
      root.rotation.y = actor.yaw;
      const moving = actor.health > 0 && actor.grounded && actor.speed > 0.1 && !actor.attack && actor.stun <= 0;
      const airborne = actor.health > 0 && !hostile && !actor.grounded;
      const kickAttack = actor.attack?.kind === "kick" && kickAction ? actor.attack : null;
      const punchAttack = !hostile && actor.attack?.kind === "punch" && punchAction ? actor.attack : null;
      const enemyAttackAction = enemyAttackActions.get(actor.attack?.kind) || enemyAttackActions.get("default") || null;
      const enemyAttack = hostile && actor.attack && enemyAttackAction ? actor.attack : null;
      if (enemyAttack && enemyAttack !== lastEnemyAttack) enemyAttackAction.reset();
      lastEnemyAttack = enemyAttack;
      if (airborne && !wasAirborne) jumpAction?.reset();
      if (kickAttack && kickAttack !== lastKickAttack) kickAction.reset();
      if (punchAttack && punchAttack !== lastPunchAttack) punchAction.reset();
      wasAirborne = airborne;
      lastKickAttack = kickAttack;
      lastPunchAttack = punchAttack;
      walkWeight = THREE.MathUtils.damp(walkWeight, moving && (!runAction || !actor.running) ? 1 : 0, 14, dt);
      heavyWalkWeight = THREE.MathUtils.damp(heavyWalkWeight, !hostile && moving && !actor.running && actor.equipped === "unarmed" && actor.combat <= 0 ? 1 : 0, 9, dt);
      runWeight = THREE.MathUtils.damp(runWeight, moving && actor.running && runAction ? 1 : 0, 14, dt);
      jumpWeight = THREE.MathUtils.damp(jumpWeight, airborne && !kickAttack ? 1 : 0, 18, dt);
      kickWeight = THREE.MathUtils.damp(kickWeight, kickAttack ? 1 : 0, 24, dt);
      punchWeight = THREE.MathUtils.damp(punchWeight, punchAttack ? 1 : 0, 24, dt);
      enemyAttackWeight = THREE.MathUtils.damp(enemyAttackWeight, enemyAttack ? 1 : 0, 24, dt);
      const totalWeight = walkWeight + runWeight + jumpWeight + kickWeight + punchWeight + enemyAttackWeight;
      const blendScale = totalWeight > 1 ? 1 / totalWeight : 1;
      walkAction.setEffectiveWeight(idleAction ? walkWeight * blendScale : 1 - enemyAttackWeight);
      walkAction.setEffectiveTimeScale(asset.interior ? (moving ? actor.speed / 1.85 : 0) : asset.demon ? 0.6 : asset.templeBoss ? moving ? 1 : 0.1 : moving ? syncedGaitRate(actor.speed, scale, hostile ? 0.65 : NEONBOY_NEW_WALK_GAIT_UNITS_PER_SECOND) : hostile ? 0.06 : 0);
      for (const action of enemyAttackActions.values()) action.setEffectiveWeight(action === enemyAttackAction ? enemyAttackWeight * blendScale : 0);
      if (enemyAttack) enemyAttackAction.setEffectiveTimeScale(enemyAttackAction.getClip().duration / ATTACKS[enemyAttack.kind].duration);
      runAction?.setEffectiveWeight(runWeight * blendScale);
      runAction?.setEffectiveTimeScale(actor.speed / RUN_SPEED);
      jumpAction?.setEffectiveWeight(jumpWeight * blendScale);
      jumpAction?.setEffectiveTimeScale(asset.jumpClip ? asset.jumpClip.duration * GRAVITY / (2 * JUMP_SPEED) : 1);
      kickAction?.setEffectiveWeight(kickWeight * blendScale);
      kickAction?.setEffectiveTimeScale(asset.kickClip ? asset.kickClip.duration / ATTACKS.kick.duration : 1);
      punchAction?.setEffectiveWeight(punchWeight * blendScale);
      // Punch_Combo's first strike lands near 0.8s; match the game's 0.2s impact.
      punchAction?.setEffectiveTimeScale(0.8 / ATTACKS.punch.impact);
      idleAction?.setEffectiveWeight(Math.max(0, 1 - totalWeight));
      for (const pose of animatedPose) { pose.bone.quaternion.copy(pose.quaternion); pose.bone.position.copy(pose.position); }
      mixer.update(dt);
      // Mixer skips unchanged tracks; restore the last animated pose, not the bind pose.
      for (const pose of animatedPose) { pose.quaternion.copy(pose.bone.quaternion); pose.position.copy(pose.bone.position); }
      visual.rotation.z = actor.health <= 0 ? -Math.PI * 0.48 * Math.min(1, (actor.deadTime || 0.65) * 2.5) : 0;
      visual.position.y = actor.health <= 0 ? -0.03 : 0;
      root.visible = actor.health > 0 || (actor.deadTime || 0) < 2.5;
      visual.rotation.x = airborne ? 0 : heavyWalkWeight * 0.055;
      const alive = actor.health > 0;
      guardWeight = THREE.MathUtils.damp(guardWeight, alive && !hostile && !airborne && actor.equipped === "unarmed" && actor.combat > 0 ? 1 : 0, 15, dt);
      if (!airborne && heavyWalkWeight > 0.01) {
        bones.get("LeftUpLeg") && (bones.get("LeftUpLeg").position.x += 0.025 * heavyWalkWeight);
        bones.get("RightUpLeg") && (bones.get("RightUpLeg").position.x -= 0.025 * heavyWalkWeight);
        for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
          aim(side + "Arm", side + "ForeArm", [sign * 0.52, -0.82, 0.18], heavyWalkWeight * 0.32);
        }
      }
      if (!punchAttack) {
        for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.35, -0.65, 0.38], guardWeight);
          aim(`${side}ForeArm`, `${side}Hand`, [-sign * 0.16, 0.85, 0.32], guardWeight);
        }
      }
      if (!hostile && alive && airborne && actor.raiseArmsOnJump) {
        const lift = jumpWeight * THREE.MathUtils.clamp(actor.y / 0.3, 0, 1);
        for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.5, 0.8, 0.3], lift);
          aim(`${side}ForeArm`, `${side}Hand`, [sign * 0.22, 0.86, 0.35], lift * 0.9);
        }
      }
      if (asset.demon && alive && moving) {
        const cycle = time * Math.max(2.6, actor.speed * 3.5);
        for (const [side, offset] of [["Left", 0], ["Right", Math.PI]]) {
          const swing = Math.sin(cycle + offset);
          aim(`${side}UpLeg`, `${side}Leg`, [0, -1, swing * 0.5], 0.9);
          aim(`${side}Leg`, `${side}Foot`, [0, -1, -Math.max(0, swing) * 0.6], 0.85);
        }
      }
      if (actor.attack) {
        const { kind, elapsed, side, variant } = actor.attack;
        const envelope = attackEnvelope(kind, elapsed);
        const sign = side === "Right" ? -1 : 1;
        const other = side === "Right" ? "Left" : "Right";
        const definition = ATTACKS[kind];
        const anticipation = Math.sin(Math.min(1, elapsed / definition.impact) * Math.PI);
        const strike = THREE.MathUtils.smoothstep(elapsed, definition.impact - 0.09, definition.impact + 0.025) *
          (1 - THREE.MathUtils.smoothstep(elapsed, definition.end, definition.duration));
        const spine = bones.get("Spine2");
        const importedStrike = enemyAttackAction || (kind === "kick" && kickAction) || (kind === "punch" && punchAction && !hostile);
        if (spine && !importedStrike) spine.rotateY(sign * (strike * 0.36 - anticipation * 0.16));
        if (!importedStrike) visual.rotation.x = strike * 0.1;
        if (kind === "kick") {
          if (!kickAction) {
            aim(`${side}UpLeg`, `${side}Leg`, [sign * 0.08, -0.18, 1], envelope);
            aim(`${side}Leg`, `${side}Foot`, [0, -0.18, 1], envelope);
            aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.7, -0.5, -0.3], envelope * 0.8);
          }
        } else if (kind === "crossbow") {
          aim("RightArm", "RightForeArm", [-0.28, -0.12, 1], 0.95);
          aim("RightForeArm", "RightHand", [0, -0.18, 1], 0.95);
          aim("LeftArm", "LeftForeArm", [0.25, -0.13, 1], 0.95);
          aim("LeftForeArm", "LeftHand", [-0.12, -0.18, 1], 0.95);
        } else if (["sword", "axe", "hammer"].includes(kind)) {
          const heavy = kind !== "sword";
          aim("RightArm", "RightForeArm", [-0.45, 0.85, -0.15], anticipation);
          aim("RightForeArm", "RightHand", [0.2, 0.8, 0.4], anticipation);
          aim("RightArm", "RightForeArm", [heavy ? -0.18 : 0.25, heavy ? -0.35 : 0.05, 1], strike);
          aim("RightForeArm", "RightHand", [heavy ? 0 : 0.4, -0.18, 1], strike);
          aim("LeftArm", "LeftForeArm", [0.4, -0.5, 0.55], envelope);
          aim("LeftForeArm", "LeftHand", [-0.25, 0.65, 0.6], envelope);
          visual.rotation.x = (heavy ? 0.22 : 0.11) * strike;
        } else if (hostile && !enemyAttackAction) {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.8, 0.65, -0.4], anticipation);
          aim(`${side}ForeArm`, `${side}Hand`, [sign * 0.2, 0.8, -0.25], anticipation);
          aim(`${side}Arm`, `${side}ForeArm`, [-sign * 0.4, -0.2, 1], strike);
          aim(`${side}ForeArm`, `${side}Hand`, [-sign * 0.25, -0.4, 1], strike);
          aim(`${other}Arm`, `${other}ForeArm`, [-sign * 0.65, 0.15, 0.6], envelope * 0.85);
          aim("Head", "HeadTopEnd", [0, 1, 0.4], strike * 0.5);
          visual.rotation.x = strike * 0.23 - anticipation * 0.1;
        } else if (!hostile && !(kind === "punch" && punchAction)) {
          // Jab, cross, then a compact hook. The opposite hand stays in guard.
          const hook = variant === 2;
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.4, -0.55, -0.15], anticipation * 0.5);
          aim(`${side}Arm`, `${side}ForeArm`, [sign * (hook ? 0.68 : 0.08), 0.05, 1], strike);
          aim(`${side}ForeArm`, `${side}Hand`, [-sign * (hook ? 0.9 : 0.08), 0.08, hook ? 0.28 : 1], strike);
          aim(`${other}Arm`, `${other}ForeArm`, [-sign * 0.3, -0.5, 0.5], envelope);
          aim(`${other}ForeArm`, `${other}Hand`, [sign * 0.1, 0.9, 0.32], envelope);
          visual.position.y -= Math.sin(envelope * Math.PI) * 0.035;
        }
      }
      const landing = alive && !hostile ? landingCompression(actor.landing) : 0;
      if (landing > 0) {
        visual.position.y -= landing * 0.1;
        visual.rotation.x += landing * 0.08;
        for (const side of ["Left", "Right"]) {
          aim(`${side}UpLeg`, `${side}Leg`, [0, -1, 0.6], landing * 0.8);
          aim(`${side}Leg`, `${side}Foot`, [0, -1, -0.6], landing * 0.8);
        }
      }
      if (!hostile && alive && actor.equipped !== "unarmed" && !actor.attack && jumpWeight < 0.1) {
        if (actor.equipped === "crossbow") {
          aim("RightArm", "RightForeArm", [-0.28, -0.12, 1], 0.88);
          aim("RightForeArm", "RightHand", [0, -0.18, 1], 0.88);
          aim("LeftArm", "LeftForeArm", [0.25, -0.13, 1], 0.88);
          aim("LeftForeArm", "LeftHand", [-0.12, -0.18, 1], 0.88);
        } else {
          aim("RightArm", "RightForeArm", [-0.3, -0.8, 0.25], 0.85);
          aim("RightForeArm", "RightHand", [-0.15, -0.1, 1], 0.9);
        }
      }
      const performance = actor.cinematic;
      if (alive && performance) {
        const block = performance.block || 0, raise = performance.raise || 0;
        aim("RightArm", "RightForeArm", [-0.42, 0.7, 0.35], block);
        aim("RightForeArm", "RightHand", [0.25, 0.85, 0.25], block);
        aim("LeftArm", "LeftForeArm", [0.4, -0.2, 0.65], block);
        aim("LeftForeArm", "LeftHand", [-0.3, 0.8, 0.4], block);
        aim("RightArm", "RightForeArm", [-0.22, 0.98, 0.08], raise);
        aim("RightForeArm", "RightHand", [0.05, 1, 0], raise);
        aim("LeftArm", "LeftForeArm", [0.42, -0.8, 0.15], raise);
        aim("LeftForeArm", "LeftHand", [0.1, -1, 0.1], raise);
        visual.rotation.z += (performance.dodge || 0) * 0.3;
        visual.position.y -= (performance.dodge || 0) * 0.18;
      }
      const holdingWeapon = alive && (Boolean(asset.weaponScene) || actor.equipped !== "unarmed");
      grip?.update(holdingWeapon ? 1 : 0);
      // Turn the forearm into the grip, keeping the animated wrist untwisted.
      if (holdingWeapon && grip) bones.get("RightForeArm")?.rotateY(Math.PI / 2);
      // Keep the rigid crossbow level and pointing forward while its origin follows the palm.
      const heldCrossbow = weapons.find((entry) => entry.kind === "crossbow");
      if (heldCrossbow && actor.equipped === "crossbow") {
        root.updateMatrixWorld(true);
        root.getWorldQuaternion(worldQuaternion);
        heldCrossbow.mesh.parent.getWorldQuaternion(parentQuaternion).invert();
        heldCrossbow.mesh.quaternion.copy(parentQuaternion).multiply(worldQuaternion);
      }
      for (const { kind, mesh } of weapons) {
        mesh.visible = holdingWeapon && (Boolean(asset.weaponScene) || actor.equipped === kind);
        if (kind === "hammer" && performance?.raise > 0) {
          root.updateMatrixWorld(true);
          root.getWorldQuaternion(worldQuaternion);
          mesh.parent.getWorldQuaternion(parentQuaternion).invert();
          mesh.quaternion.identity().slerp(parentQuaternion.multiply(worldQuaternion), performance.raise);
        }
      }
      for (const { material, emissive, intensity } of materials) {
        if (!emissive) continue;
        material.emissive.copy(emissive);
        material.emissiveIntensity = intensity;
        if (actor.invulnerable > 0 && Math.sin(time * 45) > 0) {
          material.emissive.set(hostile ? 0xff5533 : 0xff739f);
          material.emissiveIntensity = 0.65;
        }
      }
      ring.visible = actor.health > 0 && actor.grounded && !actor.presentation;
      ring.scale.setScalar(hostile && actor.attack ? 1 + attackEnvelope(actor.attack.kind, actor.attack.elapsed) * 1.4 : 1);
      ringMaterial.opacity = hostile && actor.attack ? 0.9 : hostile ? 0.5 : 0.35;
      if (boss) ringMaterial.color.set(actor.attack ? 0xff754d : 0xbb4d35);
      healthGroup.visible = hostile && !boss && actor.health > 0;
      if (healthGroup.visible) {
        camera.getWorldQuaternion(worldQuaternion);
        root.getWorldQuaternion(parentQuaternion).invert();
        healthGroup.quaternion.copy(parentQuaternion).multiply(worldQuaternion);
        healthFill.scale.x = actor.health / actor.maxHealth;
        healthFill.position.x = -(1 - actor.health / actor.maxHealth) * 0.39;
      }
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      materials.forEach(({ material }) => material.dispose());
      model.traverse((object) => object.skeleton?.dispose());
      grip?.dispose();
      weapons.find(({ kind }) => kind === "crossbow")?.mesh.traverse((object) => object.skeleton?.dispose());
      disposeObjects([ring, healthGroup, ...weapons.map(({ mesh }) => mesh)]);
    }
  };
}
