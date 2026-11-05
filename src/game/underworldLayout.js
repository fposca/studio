export const UNDERWORLD_LAYOUT = {
  playerLimitX: 8.6, playerBackZ: -53.4, playerFrontZ: 13.5, spawnZ: 10.5,
  cameraLimitX: 9.2, cameraBackZ: -54, cameraFrontZ: 14,
};

export const UNDERWORLD_INTERACTIONS = [
  { id: "arrival", label: "inscripción de llegada", x: -2.6, z: 8.2, reach: 2.3 },
  { id: "bridge", label: "puente de las almas", x: 0, z: -14.2, reach: 3 },
  { id: "altar", label: "altar del umbral", x: 0, z: -49.3, reach: 3 },
];

// Navigation uses a simple walkable proxy. The imported citadel remains visual only.
export function canStandInUnderworld(x, z, visionActive) {
  if (Math.abs(x) > 7.5 || z > 13.2 || z < -53) return false;
  if (z > -14.8) return Math.abs(x) < (z > 5 ? 5.6 : 3.15);
  if (z > -31) return visionActive && Math.abs(x) < 1.65;
  if (z > -45.5) return Math.abs(x) < 6.7;
  return Math.abs(x) < 3.5;
}
