// Shared first-person movement for the Universe scenes. Look and travel use
// the same smoothed yaw so the camera, WASD and the orb stay aligned.
const LOOK_SENSITIVITY = .0024;
const LOOK_RESPONSE = 32;
const ACCELERATION_RESPONSE = 18;
const BRAKING_RESPONSE = 30;
const PITCH_LIMIT = 1.15;

export function createFirstPersonMotion(yaw = 0, pitch = 0) {
  const state = { yaw, pitch, dx: 0, dz: 0 };
  let targetYaw = yaw, targetPitch = pitch, forwardVelocity = 0, rightVelocity = 0;
  function reset(nextYaw = state.yaw, nextPitch = state.pitch) {
    state.yaw = targetYaw = nextYaw;
    state.pitch = targetPitch = nextPitch;
    forwardVelocity = rightVelocity = state.dx = state.dz = 0;
  }
  function look(deltaX, deltaY) {
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
    targetYaw -= deltaX * LOOK_SENSITIVITY;
    targetPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, targetPitch + deltaY * LOOK_SENSITIVITY));
  }
  function turn(angle) { targetYaw += angle; }
  function update(dt, forward = 0, right = 0, speed = 2.8) {
    const step = Math.max(0, Math.min(dt, .05));
    const lookWeight = -Math.expm1(-LOOK_RESPONSE * step);
    state.yaw += (targetYaw - state.yaw) * lookWeight;
    state.pitch += (targetPitch - state.pitch) * lookWeight;
    const length = Math.max(1, Math.hypot(forward, right));
    const targetForward = forward / length * speed, targetRight = right / length * speed;
    const response = forward || right ? ACCELERATION_RESPONSE : BRAKING_RESPONSE;
    const weight = -Math.expm1(-response * step);
    // Integrate the easing over the frame: braking distance stays consistent
    // at 30, 60 and 120 fps, with a short stop instead of a long slide.
    const forwardTravel = targetForward * step + (forwardVelocity - targetForward) * weight / response;
    const rightTravel = targetRight * step + (rightVelocity - targetRight) * weight / response;
    forwardVelocity += (targetForward - forwardVelocity) * weight;
    rightVelocity += (targetRight - rightVelocity) * weight;
    if (!forward && !right && Math.hypot(forwardVelocity, rightVelocity) < .005)
      forwardVelocity = rightVelocity = 0;
    const sin = Math.sin(state.yaw), cos = Math.cos(state.yaw);
    state.dx = rightTravel * cos - forwardTravel * sin;
    state.dz = -rightTravel * sin - forwardTravel * cos;
    return state;
  }
  return { look, turn, update, reset };
}
