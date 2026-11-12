export const CATHEDRAL_LAYOUT = Object.freeze({
  playerLimitX: 8.8, playerBackZ: -60, playerFrontZ: 13.2, spawnZ: 10,
  cameraLimitX: 9.2, cameraBackZ: -60.5, cameraFrontZ: 13.5,
});

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
  { id: "cathedral-altar", label: "Altar de la Primera Voz", x: 0, z: -53.3, reach: 3 },
  { id: "cathedral-abyss", label: "Trono del Abismo ? pr?ximamente", x: 0, z: -57.7, reach: 0 },
]);

export function canStandInCathedral(x, z, progress) {
  if (Math.abs(x) > 7.5 || z > 12.8 || z < -59.4) return false;
  if (z < -16.9 && !progress?.archiveOpen) return false;
  if (z < -20 && z > -37.5 && Math.abs(x) > 5.65) return false;
  if (z < -41.7 && !progress?.altarOpen) return false;
  if ((z < -15.4 && z > -18.2) || (z < -40.2 && z > -43.1)) return Math.abs(x) < 2.2;
  return true;
}
