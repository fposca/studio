import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { syncedGaitRate } from "../editors/walkGait.js";
import { attackEnvelope } from "./gameRules.js";

const idleUrl = new URL("../assets/neonboy-animaciones/neon-inactivo-hd.glb", import.meta.url).href;
const walkUrl = new URL("../assets/neonboy-animaciones/neonBoy-walking-alta.glb", import.meta.url).href;
const enemyUrl = new URL("../assets/neonboy-animaciones/reptiliano-walk.glb", import.meta.url).href;

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
  const results = await Promise.allSettled([idleUrl, walkUrl, enemyUrl].map(async (url) => {
    const asset = await loader.loadAsync(url);
    onProgress?.(++loaded / 3);
    return asset;
  }));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    disposeObjects(results.filter((result) => result.status === "fulfilled").map((result) => result.value.scene));
    throw failed.reason;
  }
  const [idle, walk, enemy] = results.map((result) => result.value);
  const idleClip = inPlaceClip(idle.animations.find((clip) => clip.duration > 0.25), "idle");
  const walkClip = inPlaceClip(walk.animations.find((clip) => clip.duration > 0.25), "walk");
  const enemyClip = inPlaceClip(enemy.animations.find((clip) => clip.duration > 0.25), "walk");
  // Walking uses the same rig as the HD idle model; only its clip is needed in memory.
  disposeObjects([walk.scene]);
  return { player: { scene: idle.scene, idleClip, walkClip }, enemy: { scene: enemy.scene, idleClip: null, walkClip: enemyClip },
    dispose: () => disposeObjects([idle.scene, enemy.scene]) };
}

export function createGameCharacter(asset, hostile = false) {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  const model = clone(asset.scene);
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
  const scale = (hostile ? 1.9 : 1.85) / size.y;
  model.scale.multiplyScalar(scale);
  const bounds = new THREE.Box3().setFromObject(model);
  model.position.y -= bounds.min.y;
  const mixer = new THREE.AnimationMixer(model);
  const walkAction = mixer.clipAction(asset.walkClip).play();
  const idleAction = asset.idleClip ? mixer.clipAction(asset.idleClip).play() : null;
  walkAction.setEffectiveWeight(0);
  if (idleAction) idleAction.setEffectiveWeight(1);
  mixer.update(0);
  let walkWeight = 0;
  const currentDirection = new THREE.Vector3(), targetDirection = new THREE.Vector3();
  const bonePosition = new THREE.Vector3(), childPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  const desiredQuaternion = new THREE.Quaternion(), deltaQuaternion = new THREE.Quaternion();

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
  healthGroup.position.y = 2.2;
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
      walkAction.setEffectiveTimeScale(moving ? syncedGaitRate(actor.speed, scale, hostile ? 0.65 : 1.43) : hostile ? 0.06 : 0);
      idleAction?.setEffectiveWeight(1 - walkWeight);
      mixer.update(dt);
      visual.rotation.z = actor.health <= 0 ? -Math.PI * 0.48 * Math.min(1, (actor.deadTime || 0.65) * 2.5) : 0;
      visual.position.y = actor.health <= 0 ? -0.03 : 0;
      root.visible = actor.health > 0 || (actor.deadTime || 0) < 2.5;
      if (actor.attack) {
        const { kind, elapsed, side } = actor.attack;
        const envelope = attackEnvelope(kind, elapsed);
        const sign = side === "Right" ? -1 : 1;
        const spine = bones.get("Spine2");
        if (spine) spine.rotateY(sign * envelope * (kind === "kick" ? -0.14 : 0.24));
        if (kind === "kick") {
          aim(`${side}UpLeg`, `${side}Leg`, [sign * 0.08, -0.18, 1], envelope);
          aim(`${side}Leg`, `${side}Foot`, [0, -0.18, 1], envelope);
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.7, -0.5, -0.3], envelope * 0.8);
        } else {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.18, 0.02, 1], envelope);
          aim(`${side}ForeArm`, `${side}Hand`, [sign * -0.12, 0.04, 1], envelope);
          const other = side === "Right" ? "Left" : "Right";
          aim(`${other}ForeArm`, `${other}Hand`, [sign * 0.3, 0.8, 0.3], envelope * 0.7);
        }
      } else if (!actor.grounded && actor.health > 0) {
        aim("LeftUpLeg", "LeftLeg", [0.08, -0.6, 0.6], 0.7);
        aim("RightUpLeg", "RightLeg", [-0.08, -0.9, 0.25], 0.5);
        aim("LeftLeg", "LeftFoot", [0, -0.7, -0.5], 0.5);
        aim("LeftArm", "LeftForeArm", [0.6, -0.55, 0.2], 0.4);
        aim("RightArm", "RightForeArm", [-0.6, -0.55, 0.2], 0.4);
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
      ring.scale.setScalar(hostile && actor.attack ? 1 + attackEnvelope("enemy", actor.attack.elapsed) * 1.4 : 1);
      ringMaterial.opacity = hostile && actor.attack ? 0.9 : hostile ? 0.5 : 0.35;
      healthGroup.visible = hostile && actor.health > 0;
      if (healthGroup.visible) {
        camera.getWorldQuaternion(worldQuaternion);
        root.getWorldQuaternion(parentQuaternion).invert();
        healthGroup.quaternion.copy(parentQuaternion).multiply(worldQuaternion);
        healthFill.scale.x = actor.health / 80;
        healthFill.position.x = -(1 - actor.health / 80) * 0.39;
      }
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      materials.forEach(({ material }) => material.dispose());
      model.traverse((object) => object.skeleton?.dispose());
      disposeObjects([ring, healthGroup]);
    }
  };
}
