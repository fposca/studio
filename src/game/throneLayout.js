export const THRONE_LAYOUT = Object.freeze({
  playerLimitX: 13.8, playerBackZ: -95, playerFrontZ: 14,
  spawnZ: 10.5, cameraLimitX: 14.2, cameraBackZ: -95.5, cameraFrontZ: 14.5,
});

export const THRONE_INTERACTIONS = Object.freeze([
  { id: "throne-return", label: "volver a la Catedral", x: 0, z: 11.9, reach: 2 },
  { id: "throne-inscription", label: "inscripción de los tres juramentos", x: 0, z: 6.5, reach: 2.6 },
  { id: "throne-vow-libertad", label: "estatua de LIBERTAD", x: -5.8, z: -4.7, reach: 2.1 },
  { id: "throne-vow-memoria", label: "estatua de MEMORIA", x: 0, z: -6.5, reach: 2.1 },
  { id: "throne-vow-voluntad", label: "estatua de VOLUNTAD", x: 5.8, z: -4.7, reach: 2.1 },
  { id: "throne-hall-gate", label: "puerta de la Cámara del Núcleo", x: 0, z: -17.2, reach: 2.2 },
  { id: "throne-core-origen", label: "conductor ORIGEN", x: -5.5, z: -31.5, reach: 2.2 },
  { id: "throne-core-eco", label: "conductor ECO", x: 0, z: -36.5, reach: 2.2 },
  { id: "throne-core-enlace", label: "conductor ENLACE", x: 5.5, z: -31.5, reach: 2.2 },
  { id: "throne-reflector", label: "orientar el reflector", x: 0, z: -28, reach: 2.4 },
  { id: "throne-core-inscription", label: "inscripción del Núcleo Fracturado", x: -6.2, z: -23.2, reach: 2.2 },
  { id: "throne-arena-gate", label: "barrera del Trono Negro", x: 0, z: -49.3, reach: 2.4 },
  { id: "throne-soberano", label: "enfrentar al Soberano", x: 0, z: -76.5, reach: 4.2 },
  { id: "throne-transmission", label: "proyección temporal", x: 0, z: -89, reach: 3.5 },
]);

export const THRONE_ARENA_COLUMNS = Object.freeze(Array.from({ length: 12 }, (_, i) => {
  const angle = i * Math.PI / 6;
  return Object.freeze({ x: Math.sin(angle) * 17, z: -76 + Math.cos(angle) * 17, radius: .54 });
}));

const circles = [
  [-5.8, -4.7, 1.05], [0, -6.5, 1.05], [5.8, -4.7, 1.05],
  [-5.5, -31.5, 1.05], [0, -36.5, 1.05], [5.5, -31.5, 1.05],
  [0, -28, 1.0],
  [-8, 7, .75], [8, 7, .75], [-8, -12, .75], [8, -12, .75],
  [-7.5, -24, .75], [7.5, -24, .75], [-7.5, -43, .75], [7.5, -43, .75],
];
export const THRONE_OBSTACLES = Object.freeze([
  ...circles.map(([x, z, radius]) => Object.freeze({ x, z, radius })),
  ...THRONE_ARENA_COLUMNS,
]);

export function canStandInThrone(x, z, progress) {
  if (Math.abs(x) > 12.5 || z > 13.2 || z < -94.2) return false;
  if (z < -18.4 && !progress?.hallOpen) return false;
  if (z < -50.6 && !progress?.throneOpen) return false;
  if (z > -49.3 && z < -17.2 && Math.abs(x) > 8.2) return false;
  if (z >= -17.2 && Math.abs(x) > 8.8) return false;
  if (z < -50.6 && Math.hypot(x, z + 76) > 18.5 && !(z > -60 && Math.abs(x) < 3.8)) return false;
  if (z < -83.5 && Math.abs(x) > 5.5) return false;
  // The black throne is solid even after its guardian falls.
  if (z < -89.9 && z > -94.2 && Math.abs(x) < 4.1) return false;
  return true;
}

export function safeThroneSpawn(position, progress) {
  if (!position || !canStandInThrone(position.x, position.z, progress) ||
      THRONE_OBSTACLES.some(({ x, z, radius }) => Math.hypot(position.x - x, position.z - z) < radius + .5))
    return { x: 0, z: progress?.throneOpen ? -54 : progress?.hallOpen ? -20 : THRONE_LAYOUT.spawnZ, yaw: Math.PI, viewYaw: 0 };
  return position;
}
