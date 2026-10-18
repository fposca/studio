export const HD_WALK_GAIT_UNITS_PER_SECOND = 1.43;
// The newer NeonBoy walk has a short cycle. A longer stride keeps its playback grounded.
export const NEONBOY_NEW_WALK_GAIT_UNITS_PER_SECOND = 2.0;

export function syncedGaitRate(worldSpeed, modelScale, gaitUnitsPerSecond = HD_WALK_GAIT_UNITS_PER_SECOND) {
  const nativeSpeed = Math.abs(modelScale) * gaitUnitsPerSecond;
  if (!Number.isFinite(worldSpeed) || !Number.isFinite(nativeSpeed) || nativeSpeed <= 0.001) return 0;
  return Math.max(0, worldSpeed) / nativeSpeed;
}

export function speedForAnimationChange(worldSpeed, previousRate, nextRate) {
  if (!Number.isFinite(worldSpeed) || !Number.isFinite(previousRate) || !Number.isFinite(nextRate)) return worldSpeed;
  if (previousRate <= 0 || nextRate <= 0) return worldSpeed;
  return Math.min(20, Math.max(0, worldSpeed * nextRate / previousRate));
}
