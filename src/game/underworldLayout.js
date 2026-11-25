export const UNDERWORLD_LAYOUT = {
  playerLimitX: 8.6, playerBackZ: -53.4, playerFrontZ: 13.5, spawnZ: 10.5,
  cameraLimitX: 9.2, cameraBackZ: -54, cameraFrontZ: 14,
};

// Keep the player's collision radius in front of the altar and its red door.
export const UNDERWORLD_PORTAL_STOP_Z = -48.4;

export const UNDERWORLD_PYLONS = Object.freeze(Array.from({ length: 16 }, (_, index) => {
  const side = index % 2 ? 1 : -1;
  const lane = Math.floor(index / 2);
  return Object.freeze({ x: side * (lane < 3 ? 3.9 : lane < 6 ? 2.6 : 7.7), z: 8 - lane * 7.7 });
}));

export const UNDERWORLD_INTERACTIONS = [
  { id: "arrival", label: "inscripción de llegada", x: -2.6, z: 8.2, reach: 2.3 },
  { id: "bridge", label: "puente de las almas", x: 0, z: -14.2, reach: 3 },
  { id: "altar", label: "altar del umbral", x: 0, z: -49.3, reach: 3 },
  { id: "cathedral-door", label: "cruzar la puerta roja", x: 0, z: -48, reach: 1.8 },
];

// Navigation uses a simple walkable proxy. The imported citadel remains visual only.
export function canStandInUnderworld(x, z, visionActive, pylonClearance = 1.08, progress = null) {
  if (Math.abs(x) > 7.5 || z > 13.2 || z < UNDERWORLD_PORTAL_STOP_Z) return false;
  if (UNDERWORLD_PYLONS.some((pillar) => Math.hypot(x - pillar.x, z - pillar.z) < pylonClearance)) return false;
  if (progress && !progress.ferryCompleted && z < -31.4 && !progress.completed) return false;
  if (z > -14.8) return Math.abs(x) < (z > 5 ? 5.6 : 3.15) || (z > -12.7 && z < -9.8 && x > 0 && x < 3.65);
  if (z > -31) return Boolean(visionActive || progress?.mechanismSolved || progress?.completed) && Math.abs(x) < 1.65;
  if (z > -45.5) return Math.abs(x) < 6.7;
  return Math.abs(x) < 3.5;
}
