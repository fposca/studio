import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { NEONBOY_NEW_WALK_GAIT_UNITS_PER_SECOND } from "../editors/walkGait.js";

const clamp = (value) => Math.max(0, Math.min(1, value));

// The record shop needs only NeonBoy's idle, walk and jump poses.
// Keeping this separate avoids bundling every enemy and weapon from the main game.
export function createRecordStoreCharacter({ scene, idleClip, walkClip, jumpClip }) {
  const root = new THREE.Group();
  root.name = "Neonboy";
  const visual = new THREE.Group();
  const model = cloneSkinned(scene);
  root.add(visual);
  visual.add(model);
  const bones = new Map();
  model.traverse((object) => {
    if (object.isBone) bones.set(object.name.replace(/[^a-z0-9]/gi, "").replace(/^mixamorig/i, ""), object);
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;
  });
  model.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const scale = 1.85 / Math.max(size.y, 0.001);
  model.scale.multiplyScalar(scale);
  model.position.y -= new THREE.Box3().setFromObject(model).min.y;

  const mixer = new THREE.AnimationMixer(model);
  const idleAction = mixer.clipAction(idleClip).play();
  const walkAction = mixer.clipAction(walkClip).play();
  const jumpAction = mixer.clipAction(jumpClip).play();
  jumpAction.setLoop(THREE.LoopOnce, 1);
  jumpAction.clampWhenFinished = true;
  walkAction.setEffectiveWeight(0);
  jumpAction.setEffectiveWeight(0);
  mixer.update(0);

  const animatedPose = [...bones.values()].map((bone) => ({ bone, quaternion: bone.quaternion.clone(), position: bone.position.clone() }));
  const bonePosition = new THREE.Vector3(), childPosition = new THREE.Vector3();
  const currentDirection = new THREE.Vector3(), targetDirection = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  const desiredQuaternion = new THREE.Quaternion(), deltaQuaternion = new THREE.Quaternion();
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

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.37, 0.4, 48),
    new THREE.MeshBasicMaterial({ color: 0x62edcb, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.035;
  root.add(ring);

  let walkWeight = 0, jumpWeight = 0, heavyWalkWeight = 0, wasAirborne = false;
  return {
    root,
    update(actor, dt) {
      root.position.set(actor.x, actor.y, actor.z);
      root.rotation.y = actor.yaw;
      const moving = actor.grounded && actor.speed > 0.1;
      const airborne = !actor.grounded;
      if (airborne && !wasAirborne) jumpAction.reset();
      wasAirborne = airborne;
      walkWeight = THREE.MathUtils.damp(walkWeight, moving ? 1 : 0, 14, dt);
      heavyWalkWeight = THREE.MathUtils.damp(heavyWalkWeight, moving && !actor.running ? 1 : 0, 9, dt);
      jumpWeight = THREE.MathUtils.damp(jumpWeight, airborne ? 1 : 0, 18, dt);
      const total = Math.max(1, walkWeight + jumpWeight);
      walkAction.setEffectiveWeight(walkWeight / total);
      walkAction.setEffectiveTimeScale(moving ? actor.speed / Math.max(scale * NEONBOY_NEW_WALK_GAIT_UNITS_PER_SECOND, 0.001) : 0);
      jumpAction.setEffectiveWeight(jumpWeight / total);
      jumpAction.setEffectiveTimeScale(jumpClip.duration * 18 / (2 * 6.4));
      idleAction.setEffectiveWeight(Math.max(0, 1 - walkWeight - jumpWeight));
      for (const pose of animatedPose) { pose.bone.quaternion.copy(pose.quaternion); pose.bone.position.copy(pose.position); }
      mixer.update(dt);
      for (const pose of animatedPose) { pose.quaternion.copy(pose.bone.quaternion); pose.position.copy(pose.bone.position); }
      visual.rotation.x = airborne ? 0 : heavyWalkWeight * 0.055;
      if (!airborne && heavyWalkWeight > 0.01) {
        bones.get("LeftUpLeg") && (bones.get("LeftUpLeg").position.x += 0.025 * heavyWalkWeight);
        bones.get("RightUpLeg") && (bones.get("RightUpLeg").position.x -= 0.025 * heavyWalkWeight);
        for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
          aim(side + "Arm", side + "ForeArm", [sign * 0.52, -0.82, 0.18], heavyWalkWeight * 0.32);
        }
      }
      if (airborne && actor.raiseArmsOnJump) {
        const lift = jumpWeight * clamp(actor.y / 0.3);
        for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
          aim(`${side}Arm`, `${side}ForeArm`, [sign * 0.5, 0.8, 0.3], lift);
          aim(`${side}ForeArm`, `${side}Hand`, [sign * 0.22, 0.86, 0.35], lift * 0.9);
        }
      }
      if (actor.landing > 0) visual.position.y = -Math.sin((1 - actor.landing / 0.24) * Math.PI) * 0.1;
      else visual.position.y = 0;
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
  };
}
