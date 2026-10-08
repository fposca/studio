import * as THREE from "three";

export const DRAGON_BREATHING_CLIP = "Respirando";
export const DRAGON_FLYING_CLIP = "Volando";

const DRAGON_MODEL_IDS = new Set(["dragon", "dragon-breathing", "dragon-flying"]);
const FLIGHT_ALTITUDE = 4.5;

export function isDragonModel(model) {
  return DRAGON_MODEL_IDS.has(model?.userData?.bundledModel);
}

function rotationTrack(model, boneName, axis, times, angleAt) {
  const bone = model.getObjectByName(boneName);
  if (!bone?.isBone) return null;
  model.userData.dragonRestPose ||= {};
  if (!model.userData.dragonRestPose[boneName]) {
    const modelRotation = model.getWorldQuaternion(new THREE.Quaternion());
    const parentRotation = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    const localAxis = axis.clone().applyQuaternion(modelRotation).applyQuaternion(parentRotation).normalize();
    model.userData.dragonRestPose[boneName] = {
      quaternion: bone.quaternion.toArray(),
      axis: localAxis.toArray()
    };
  }
  const restPose = model.userData.dragonRestPose[boneName];
  const localAxis = new THREE.Vector3().fromArray(restPose.axis);
  const rest = new THREE.Quaternion().fromArray(restPose.quaternion);
  const values = [];
  times.forEach((time, index) => {
    const phase = index / (times.length - 1) * Math.PI * 2;
    const pose = new THREE.Quaternion().setFromAxisAngle(localAxis, angleAt(phase)).multiply(rest);
    values.push(...pose.toArray());
  });
  return new THREE.QuaternionKeyframeTrack(boneName + ".quaternion", times, values);
}

function chestTrack(model, times) {
  const chest = model.getObjectByName("Bone_002");
  if (!chest?.isBone) return null;
  model.userData.dragonRestPose ||= {};
  model.userData.dragonRestPose.Bone_002 ||= { scale: chest.scale.toArray() };
  const rest = new THREE.Vector3().fromArray(model.userData.dragonRestPose.Bone_002.scale);
  const values = [];
  times.forEach((time, index) => {
    const breath = Math.sin(index / (times.length - 1) * Math.PI * 2);
    values.push(rest.x * (1 + breath * 0.01), rest.y * (1 + breath * 0.02), rest.z * (1 + breath * 0.02));
  });
  return new THREE.VectorKeyframeTrack("Bone_002.scale", times, values);
}

export function createDragonAnimationClips(model) {
  if (!isDragonModel(model)) return [];
  model.updateWorldMatrix(true, true);
  const times = Array.from({ length: 33 }, (_, index) => index / 32 * 4);
  const headShake = (phase) => Math.pow(Math.max(0, Math.sin(phase - 1.05)), 3) * Math.sin(phase * 6) * 0.105;
  const wingBreath = (phase) => 0.075 + Math.sin(phase - 0.35) * 0.075;
  const breath = [
    chestTrack(model, times),
    rotationTrack(model, "Bone_003", new THREE.Vector3(1, 0, 0), times, (phase) => Math.sin(phase) * 0.04),
    rotationTrack(model, "Bone_029", new THREE.Vector3(1, 0, 0), times, (phase) => Math.sin(phase - 0.3) * 0.035),
    rotationTrack(model, "Bone_027", new THREE.Vector3(0, 1, 0), times, headShake),
    rotationTrack(model, "Bone_042", new THREE.Vector3(0, 0, 1), times, (phase) => -wingBreath(phase)),
    rotationTrack(model, "Bone_045", new THREE.Vector3(0, 0, 1), times, wingBreath),
    rotationTrack(model, "Bone_041", new THREE.Vector3(0, 0, 1), times, (phase) => -(0.035 + Math.sin(phase - 0.65) * 0.035)),
    rotationTrack(model, "Bone_044", new THREE.Vector3(0, 0, 1), times, (phase) => 0.035 + Math.sin(phase - 0.65) * 0.035),
    rotationTrack(model, "Bone_023", new THREE.Vector3(0, 1, 0), times, (phase) => Math.sin(phase + 0.5) * 0.04),
    rotationTrack(model, "Bone_034", new THREE.Vector3(1, 0, 0), times, (phase) => Math.sin(phase) * 0.015),
    rotationTrack(model, "Bone_039", new THREE.Vector3(1, 0, 0), times, (phase) => Math.sin(phase + 0.4) * 0.015),
    rotationTrack(model, "Bone_010", new THREE.Vector3(1, 0, 0), times, (phase) => Math.sin(phase + 0.2) * 0.012),
    rotationTrack(model, "Bone_015", new THREE.Vector3(1, 0, 0), times, (phase) => Math.sin(phase + 0.6) * 0.012)
  ].filter(Boolean);

  const flightTimes = Array.from({ length: 33 }, (_, index) => index / 32 * 1.45);
  const wing = (sign, phase) => sign * (0.14 + Math.sin(phase) * 0.58);
  const flight = [
    rotationTrack(model, "Bone_042", new THREE.Vector3(0, 0, 1), flightTimes, (phase) => wing(-1, phase)),
    rotationTrack(model, "Bone_045", new THREE.Vector3(0, 0, 1), flightTimes, (phase) => wing(1, phase)),
    rotationTrack(model, "Bone_041", new THREE.Vector3(0, 0, 1), flightTimes, (phase) => -(0.04 + Math.sin(phase - 0.55) * 0.22)),
    rotationTrack(model, "Bone_044", new THREE.Vector3(0, 0, 1), flightTimes, (phase) => 0.04 + Math.sin(phase - 0.55) * 0.22),
    rotationTrack(model, "Bone_003", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => -0.07 + Math.sin(phase) * 0.045),
    rotationTrack(model, "Bone_029", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => Math.sin(phase - 0.3) * 0.035),
    rotationTrack(model, "Bone_023", new THREE.Vector3(0, 1, 0), flightTimes, (phase) => Math.sin(phase - 0.7) * 0.11),
    rotationTrack(model, "Bone_034", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => 0.24 + Math.sin(phase + 0.2) * 0.2),
    rotationTrack(model, "Bone_039", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => 0.24 + Math.sin(phase + 0.55) * 0.2),
    rotationTrack(model, "Bone_033", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => -0.12 + Math.sin(phase - 0.45) * 0.14),
    rotationTrack(model, "Bone_038", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => -0.12 + Math.sin(phase - 0.1) * 0.14),
    rotationTrack(model, "Bone_010", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => -0.28 + Math.sin(phase + 1.25) * 0.18),
    rotationTrack(model, "Bone_015", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => -0.28 + Math.sin(phase + 1.6) * 0.18),
    rotationTrack(model, "Bone_009", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => 0.12 + Math.sin(phase + 0.8) * 0.13),
    rotationTrack(model, "Bone_014", new THREE.Vector3(1, 0, 0), flightTimes, (phase) => 0.12 + Math.sin(phase + 1.15) * 0.13)
  ].filter(Boolean);
  return [
    new THREE.AnimationClip(DRAGON_BREATHING_CLIP, 4, breath),
    new THREE.AnimationClip(DRAGON_FLYING_CLIP, 1.45, flight)
  ];
}

export function initializeDragonFlight(model, airborne = false) {
  if (!isDragonModel(model)) return;
  const origin = model.position.toArray();
  if (airborne) model.position.y += FLIGHT_ALTITUDE;
  model.userData.dragonFlight = {
    origin,
    elapsed: 0,
    active: airborne,
    lastPosition: model.position.toArray()
  };
}

export function updateDragonFlight(model, delta) {
  if (!isDragonModel(model)) return;
  const animation = model.userData.modelAnimation;
  let flight = model.userData.dragonFlight;
  if (!flight) {
    initializeDragonFlight(model);
    flight = model.userData.dragonFlight;
  }
  if (flight.lastPosition) {
    flight.origin[0] += model.position.x - flight.lastPosition[0];
    flight.origin[1] += model.position.y - flight.lastPosition[1];
    flight.origin[2] += model.position.z - flight.lastPosition[2];
  }
  if (animation?.clip !== DRAGON_FLYING_CLIP) {
    flight.active = false;
    if (delta > 0 && model.position.y > flight.origin[1] + 0.001) {
      model.position.y = THREE.MathUtils.damp(model.position.y, flight.origin[1], 2, delta);
    }
    flight.lastPosition = model.position.toArray();
    return;
  }
  if (!animation.playing || animation.speed <= 0 || delta <= 0) {
    flight.lastPosition = model.position.toArray();
    return;
  }
  if (!flight.active) {
    flight.origin = model.position.toArray();
    flight.elapsed = 0;
    flight.active = true;
  }
  flight.elapsed += delta * animation.speed;
  const angle = flight.elapsed * Math.PI * 2 / 16;
  const wingPhase = flight.elapsed * Math.PI * 2 / 1.45;
  model.position.x = flight.origin[0] + Math.sin(angle) * 6;
  model.position.z = flight.origin[2] + Math.sin(angle * 2) * 4.5;
  model.position.y = THREE.MathUtils.damp(
    model.position.y,
    flight.origin[1] + FLIGHT_ALTITUDE + Math.sin(angle * 2) * 0.42 + Math.sin(wingPhase) * 0.16,
    3.2,
    delta
  );
  const targetYaw = Math.atan2(6 * Math.cos(angle), 9 * Math.cos(angle * 2));
  const difference = Math.atan2(Math.sin(targetYaw - model.rotation.y), Math.cos(targetYaw - model.rotation.y));
  model.rotation.y += difference * Math.min(1, delta * 2.5);
  flight.lastPosition = model.position.toArray();
}
