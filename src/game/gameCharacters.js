import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { syncedGaitRate } from "../editors/walkGait.js";
import { ATTACKS, attackEnvelope } from "./gameRules.js";
import { createWeaponModel } from "./gameWeapons.js";

const idleUrl = new URL("../assets/neonboy-animaciones/neon-inactivo-hd.glb", import.meta.url).href;
const walkUrl = new URL("../assets/neonboy-animaciones/neonBoy-walking-alta.glb", import.meta.url).href;
const enemyUrl = new URL("../assets/neonboy-animaciones/reptiliano-walk.glb", import.meta.url).href;
const demonUrl = new URL("../assets/neonboy-animaciones/demonio-alado-2.glb", import.meta.url).href;

export function disposeObjects(roots) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  for (const root of roots) root?.traverse((object) => {
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
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = 0;
        track.values[i + 2] = 0;
      }
    }
  }
  clip.resetDuration();
  return clip;
}

export async function loadGameCharacters(onProgress) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let loaded = 0;
  const results = await Promise.allSettled([idleUrl, walkUrl, enemyUrl, demonUrl].map(async (url) => {
    const asset = await loader.loadAsync(url);
    onProgress?.(++loaded / 4);
    return asset;
  }));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    disposeObjects(results.filter((result) => result.status === "fulfilled").map((result) => result.value.scene));
    throw failed.reason;
  }
  const [idle, walk, enemy, demon] = results.map((result) => result.value);
  const idleClip = inPlaceClip(idle.animations.find((clip) => clip.duration > 0.25), "idle");
  const walkClip = inPlaceClip(walk.animations.find((clip) => clip.duration > 0.25), "walk");
  const enemyClip = inPlaceClip(enemy.animations.find((clip) => clip.duration > 0.25), "walk");
  const demonClip = inPlaceClip(demon.animations.find((clip) => clip.duration > 0.25), "demon-idle");
  // Walking uses the same rig as the HD idle model; only its clip is needed in memory.
  disposeObjects([walk.scene]);
  return { player: { scene: idle.scene, idleClip, walkClip }, enemy: { scene: enemy.scene, idleClip: null, walkClip: enemyClip },
    demon: { scene: demon.scene, idleClip: demonClip, walkClip: demonClip, demon: true },
    dispose: () => disposeObjects([idle.scene, enemy.scene, demon.scene]) };
}

export function createGameCharacter(asset, hostile = false) {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  const model = clone(asset.scene);
  root.name = hostile ? asset.demon ? "Demonio" : "Guardian" : "Neonboy";
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
  const scale = (asset.demon ? 2.35 : hostile ? 1.9 : 1.85) / size.y;
  model.scale.multiplyScalar(scale);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y -= bounds.min.y;
  const mixer = new THREE.AnimationMixer(model);
  const walkAction = mixer.clipAction(asset.walkClip).play();
  const idleAction = asset.idleClip && !asset.demon ? mixer.clipAction(asset.idleClip).play() : null;
  walkAction.setEffectiveWeight(0);
  if (idleAction) idleAction.setEffectiveWeight(1);
  mixer.update(0);
  let walkWeight = 0, jumpWeight = 0, guardWeight = 0;
  const bindPose = [...bones.values()].map((bone) => ({ bone, quaternion: bone.quaternion.clone(), position: bone.position.clone() }));
  const currentDirection = new THREE.Vector3(), targetDirection = new THREE.Vector3();
  const bonePosition = new THREE.Vector3(), childPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  const desiredQuaternion = new THREE.Quaternion(), deltaQuaternion = new THREE.Quaternion();
  const weapons = hostile ? [] : ["sword", "hammer"].map((kind) => {
    const mesh = createWeaponModel(kind);
    mesh.visible = false;
    root.add(mesh);
    return { kind, mesh };
  });
  const handPosition = new THREE.Vector3(), weaponDirection = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

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
  const ring = new THREE.Mesh(new THREE.RingGeometry(hostile ? 0.46 : 0.37, hostile ? 0.5 : 0.4, 48), ringMaterial);
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
  healthGroup.position.y = asset.demon ? 2.65 : 2.2;
  healthGroup.visible = hostile;
  root.add(healthGroup);

  return {
    root,
    update(actor, dt, camera, time) {
      root.position.set(actor.x, actor.y, actor.z);
      root.rotation.y = actor.yaw;
      const moving = actor.health > 0 && actor.grounded && actor.speed > 0.1 && !actor.attack && actor.stun <= 0;
      walkWeight = THREE.MathUtils.damp(walkWeight, moving ? 1 : 0, 14, dt);
      walkAction.setEffectiveWeight(idleAction ? walkWeight : 1);
      walkAction.setEffectiveTimeScale(asset.demon ? 0.6 : moving ? syncedGaitRate(actor.speed, scale, hostile ? 0.65 : 1.43) : hostile ? 0.06 : 0);
      idleAction?.setEffectiveWeight(1 - walkWeight);
      for (const pose of bindPose) { pose.bone.quaternion.copy(pose.quaternion); pose.bone.position.copy(pose.position); }
      mixer.update(dt);
      visual.rotation.z = actor.health <= 0 ? -Math.PI * 0.48 * Math.min(1, (actor.deadTime || 0.65) * 2.5) : 0;
      visual.position.y = actor.health <= 0 ? -0.03 : 0;
      root.visible = actor.health > 0 || (actor.deadTime || 0) < 2.5;
      visual.rotation.x = 0;
      const alive = actor.health > 0;
      guardWeight = THREE.MathUtils.damp(guardWeight, alive && !hostile && actor.equipped === "unarmed" && actor.combat > 0 ? 1 : 0, 15, dt);
      jumpWeight = THREE.MathUtils.damp(jumpWeight, alive && !actor.grounded ? 1 : 0, 18, dt);
      for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
        aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.35, -0.65, 0.38], guardWeight);
        aim(`${side}ForeArm`, `${side}Hand`, [-sign * 0.16, 0.85, 0.32], guardWeight);
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
        if (spine) spine.rotateY(sign * (strike * 0.36 - anticipation * 0.16));
        visual.rotation.x = strike * 0.1;
        if (kind === "kick") {
          aim(`${side}UpLeg`, `${side}Leg`, [sign * 0.08, -0.18, 1], envelope);
          aim(`${side}Leg`, `${side}Foot`, [0, -0.18, 1], envelope);
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.7, -0.5, -0.3], envelope * 0.8);
        } else if (kind === "sword" || kind === "hammer") {
          const heavy = kind === "hammer";
          aim("RightArm", "RightForeArm", [-0.45, 0.85, -0.15], anticipation);
          aim("RightForeArm", "RightHand", [0.2, 0.8, 0.4], anticipation);
          aim("RightArm", "RightForeArm", [heavy ? -0.18 : 0.25, heavy ? -0.35 : 0.05, 1], strike);
          aim("RightForeArm", "RightHand", [heavy ? 0 : 0.4, -0.18, 1], strike);
          aim("LeftArm", "LeftForeArm", [0.4, -0.5, 0.55], envelope);
          aim("LeftForeArm", "LeftHand", [-0.25, 0.65, 0.6], envelope);
          visual.rotation.x = (heavy ? 0.22 : 0.11) * strike;
        } else if (hostile) {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.8, 0.65, -0.4], anticipation);
          aim(`${side}ForeArm`, `${side}Hand`, [sign * 0.2, 0.8, -0.25], anticipation);
          aim(`${side}Arm`, `${side}ForeArm`, [-sign * 0.4, -0.2, 1], strike);
          aim(`${side}ForeArm`, `${side}Hand`, [-sign * 0.25, -0.4, 1], strike);
          aim(`${other}Arm`, `${other}ForeArm`, [-sign * 0.65, 0.15, 0.6], envelope * 0.85);
          aim("Head", "HeadTopEnd", [0, 1, 0.4], strike * 0.5);
          visual.rotation.x = strike * 0.23 - anticipation * 0.1;
        } else {
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
      if (jumpWeight > 0.01 && !hostile) {
        aim("LeftUpLeg", "LeftLeg", [0.08, -0.65, 0.65], jumpWeight * 0.8);
        aim("RightUpLeg", "RightLeg", [-0.08, -0.85, 0.3], jumpWeight * 0.65);
        aim("LeftLeg", "LeftFoot", [0, -0.7, -0.65], jumpWeight * 0.7);
        for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.48, 0.9, 0.15], jumpWeight * (actor.attack ? 0.4 : 1));
          aim(`${side}ForeArm`, `${side}Hand`, [-sign * 0.15, 1, 0.2], jumpWeight * (actor.attack ? 0.4 : 1));
        }
      }
      if (!hostile && alive && actor.equipped !== "unarmed" && !actor.attack && jumpWeight < 0.1) {
        aim("RightArm", "RightForeArm", [-0.5, -0.8, 0.2], 0.75);
        aim("RightForeArm", "RightHand", [-0.1, -0.3, 0.8], 0.75);
      }
      for (const { kind, mesh } of weapons) {
        mesh.visible = alive && actor.equipped === kind;
        const hand = bones.get("RightHand");
        if (!mesh.visible || !hand) continue;
        root.updateMatrixWorld(true);
        hand.getWorldPosition(handPosition); root.worldToLocal(handPosition);
        mesh.position.copy(handPosition);
        const attack = actor.attack;
        if (attack && attack.kind === kind) {
          const def = ATTACKS[kind];
          const sweep = THREE.MathUtils.smoothstep(attack.elapsed, def.impact - 0.15, def.end);
          weaponDirection.set(kind === "sword" ? -0.9 + sweep * 1.8 : -0.1, 1.2 - sweep * 1.4, -0.4 + sweep * 1.8);
        } else weaponDirection.set(-0.2, 0.9, 0.45);
        mesh.quaternion.setFromUnitVectors(up, weaponDirection.normalize());
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
      ring.visible = actor.health > 0 && actor.grounded;
      ring.scale.setScalar(hostile && actor.attack ? 1 + attackEnvelope(actor.attack.kind, actor.attack.elapsed) * 1.4 : 1);
      ringMaterial.opacity = hostile && actor.attack ? 0.9 : hostile ? 0.5 : 0.35;
      healthGroup.visible = hostile && actor.health > 0;
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
      disposeObjects([ring, healthGroup, ...weapons.map(({ mesh }) => mesh)]);
    }
  };
}
