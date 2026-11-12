const ACCELERATION_RESPONSE = 12;
const BRAKING_RESPONSE = 22;
const TURN_RESPONSE = 12;

export function createHalloweenThirdPersonMotion() {
  let velocityX = 0;
  let velocityZ = 0;
  const step = { dx: 0, dz: 0 };

  return {
    update(dt, forward = 0, right = 0, speed = 2.8, cameraYaw = 0) {
      const seconds = Math.max(0, Math.min(dt, .05));
      const length = Math.max(1, Math.hypot(forward, right));
      const targetX = (right * Math.cos(cameraYaw) - forward * Math.sin(cameraYaw)) / length * speed;
      const targetZ = (-right * Math.sin(cameraYaw) - forward * Math.cos(cameraYaw)) / length * speed;
      const response = Math.hypot(forward, right) > .001 ? ACCELERATION_RESPONSE : BRAKING_RESPONSE;
      const weight = -Math.expm1(-response * seconds);
      step.dx = targetX * seconds + (velocityX - targetX) * weight / response;
      step.dz = targetZ * seconds + (velocityZ - targetZ) * weight / response;
      velocityX += (targetX - velocityX) * weight;
      velocityZ += (targetZ - velocityZ) * weight;
      if (!forward && !right && Math.hypot(velocityX, velocityZ) < .005) velocityX = velocityZ = 0;
      return step;
    },
    block({ x = false, z = false } = {}) {
      if (x) velocityX = 0;
      if (z) velocityZ = 0;
    },
    reset() {
      velocityX = velocityZ = step.dx = step.dz = 0;
    },
  };
}

export function smoothHalloweenHeading(current, target, dt) {
  if (!Number.isFinite(target) || dt <= 0) return current;
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * -Math.expm1(-TURN_RESPONSE * Math.min(dt, .05));
}
