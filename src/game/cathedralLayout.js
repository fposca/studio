export const CATHEDRAL_LAYOUT = Object.freeze({
  playerLimitX: 8.8, playerBackZ: -60, playerFrontZ: 13.2, spawnZ: 10,
  cameraLimitX: 9.2, cameraBackZ: -60.5, cameraFrontZ: 13.5,
});

export const CATHEDRAL_ALTAR_PLATFORM = Object.freeze({ x: 0, z: -53.6, hx: 3.25, hz: 2.7 });

export const CATHEDRAL_INTERACTIONS = Object.freeze([
  { id: "cathedral-return", label: "volver al Puente de las Almas", x: 0, z: 12.5, reach: 1.8 },
  { id: "cathedral-inscription", label: "inscripción de los tres sellos", x: 0, z: 6.1, reach: 2.4 },
  { id: "cathedral-seal-memoria", label: "sello de MEMORIA", x: -3.5, z: -5.3, reach: 2.2 },
  { id: "cathedral-seal-tiempo", label: "sello de TIEMPO", x: 0, z: -7.3, reach: 2.2 },
  { id: "cathedral-seal-verdad", label: "sello de VERDAD", x: 3.5, z: -5.3, reach: 2.2 },
  { id: "cathedral-archive-door", label: "puerta del Archivo de los Condenados", x: 0, z: -15.2, reach: 2.4 },
  { id: "cathedral-memory-nave", label: "registro de La Nave Perdida", x: -3.4, z: -26.5, reach: 2.25 },
  { id: "cathedral-memory-partenon", label: "registro del Partenón Maldito", x: 0, z: -30.4, reach: 2.25 },
  { id: "cathedral-memory-fracturada", label: "registro de La Realidad Fracturada", x: 3.4, z: -26.5, reach: 2.25 },
  { id: "cathedral-custodian", label: "hablar con el Custodio de los Recuerdos", x: 4.9, z: -34.5, reach: 2.7 },
  { id: "cathedral-altar-door", label: "puerta del Altar de la Primera Voz", x: 0, z: -40.2, reach: 2.5 },
  { id: "cathedral-altar", label: "Altar de la Primera Voz", x: 0, z: -53.3, reach: 3.8 },
  { id: "cathedral-tone-pulso", label: "resonador PULSO", x: 0, z: -49.45, reach: 1.55 },
  { id: "cathedral-tone-eco", label: "resonador ECO", x: 2.35, z: -49.45, reach: 1.55 },
  { id: "cathedral-tone-origen", label: "resonador ORIGEN", x: -2.35, z: -49.45, reach: 1.55 },

  { id: "cathedral-abyss", label: "DESTINO: TRONO DEL ABISMO · FRECUENCIA: DESCONOCIDA", x: 0, z: -57.7, reach: 0 },
]);

export const CATHEDRAL_RESONATOR_COLLIDERS = Object.freeze(
  CATHEDRAL_INTERACTIONS.filter((spot) => spot.id.startsWith("cathedral-tone-"))
    .map(({ x, z }) => Object.freeze({ x, z, radius: .6 })),
);

export function canStandInCathedral(x, z, progress) {
  if (Math.abs(x) > 7.5 || z > 12.8 || z < -59.4) return false;
  if (z < -16.35 && !progress?.archiveOpen) return false;
  if (z < -20 && z > -37.5 && Math.abs(x) > 5.65) return false;
  if (z < -41.35 && !progress?.altarOpen) return false;
  if ((z < -15.4 && z > -18.2) || (z < -40.2 && z > -43.1)) return Math.abs(x) < 2.2;
  return true;
}

// Old saves may place NeonBoy inside the altar before its collision was added.
export function clearCathedralAltarSpawn(position, progress) {
  const stone = CATHEDRAL_ALTAR_PLATFORM;
  const clearance = .46;
  const limitX = stone.hx + clearance;
  const limitZ = stone.hz + clearance;
  if (Math.abs(position.x - stone.x) >= limitX || Math.abs(position.z - stone.z) >= limitZ) return position;
  const gap = .06;
  const candidates = [
    { x: position.x, z: stone.z + limitZ + gap },
    { x: position.x, z: stone.z - limitZ - gap },
    { x: stone.x + limitX + gap, z: position.z },
    { x: stone.x - limitX - gap, z: position.z },
  ];
  return candidates.filter((candidate) => canStandInCathedral(candidate.x, candidate.z, progress))
    .sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z))[0] ?? position;
}

// Saved games made before the resonators became solid can start inside one.
export function clearCathedralBlockedSpawn(position, progress) {
  let next = clearCathedralAltarSpawn(position, progress);
  if (!progress?.altarOpen) return next;
  const bodyRadius = .46;
  const platform = CATHEDRAL_ALTAR_PLATFORM;
  const clear = (candidate) =>
    canStandInCathedral(candidate.x, candidate.z, progress) &&
    (Math.abs(candidate.x - platform.x) >= platform.hx + bodyRadius ||
      Math.abs(candidate.z - platform.z) >= platform.hz + bodyRadius) &&
    CATHEDRAL_RESONATOR_COLLIDERS.every((node) =>
      Math.hypot(candidate.x - node.x, candidate.z - node.z) >= node.radius + bodyRadius);
  for (const node of CATHEDRAL_RESONATOR_COLLIDERS) {
    if (Math.hypot(next.x - node.x, next.z - node.z) >= node.radius + bodyRadius) continue;
    const offset = node.radius + bodyRadius + .06;
    const candidates = [
      { x: node.x + offset, z: next.z },
      { x: node.x - offset, z: next.z },
      { x: next.x, z: node.z + offset },
      { x: next.x, z: node.z - offset },
    ];
    const exit = candidates.filter(clear)
      .sort((a, b) => Math.hypot(a.x - next.x, a.z - next.z) -
        Math.hypot(b.x - next.x, b.z - next.z))[0];
    if (exit) next = { ...next, ...exit };
  }
  return next;
}
