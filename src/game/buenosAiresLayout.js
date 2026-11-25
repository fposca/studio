// Coordinates are in metres. The north-south axis follows Avenida 9 de Julio.
export const BUENOS_AIRES_LAYOUT = Object.freeze({
  playerLimitX: 78, playerBackZ: -79, playerFrontZ: 79,
  cameraLimitX: 78, cameraBackZ: -79, cameraFrontZ: 79,
  spawnZ: 42,
});

export const OBELISK = Object.freeze({ x: 0, z: -5, height: 67.5, widthScale: 3 });
export const OBELISK_FIELD = Object.freeze({ halfExtent: 12.3, cornerRadius: 1.2, height: 3.2, baseY: .12 });
export const OBELISK_APPROACH = Object.freeze({ x: 0, z: OBELISK.z + OBELISK_FIELD.halfExtent + 1.6 });

// Flight corridors stay over the avenue (buildings begin at |x| = 41).
// The cars pass through the player's street-level view, above pedestrian height
// and well inside separate west/east corridors clear of the Obelisk and lamps.
// Points are [x, y, z] in metres.
export const BUENOS_AIRES_FLIGHT_ROUTES = Object.freeze([
  {
    id: "renault-fuego", speed: 8, startDelay: 0,
    points: [[0, 5.2, 20], [-5, 5.4, 15], [-17, 5.6, 11], [-22, 5.8, -5],
      [-25, 6.6, -32], [-26, 8.7, -60], [-27, 8.8, -65], [-26, 7.8, -33],
      [-23, 6.6, -10], [-17, 5.8, 15], [-2, 5.3, 23]],
  },
  {
    id: "yellow-tesla", speed: 12, startDelay: 4,
    points: [[16, 5.7, 15], [20, 6.8, 7], [24, 8.2, -1], [25, 8.8, -16],
      [26, 9.8, -37], [27, 11.3, -62], [25, 10.4, -66], [26, 9.4, -39],
      [25, 8.7, -18], [24, 8.2, 1], [20, 6.8, 12]],
  },
  {
    id: "new-flyer", speed: 10, startDelay: 7,
    points: [[11, 14.5, 25], [14, 15, 12], [15, 15.5, -5], [15, 16, -30],
      [14, 17, -62], [16, 17, -66], [15, 16.5, -35], [15, 15.5, -3], [14, 15, 19]],
  },
]);

// A clear central promenade remains between the two planted letters.
export const BA_GARDEN_LETTERS = Object.freeze([
  { id: "B", x: -3.25, z: 30, hx: 2.05, hz: .93 },
  { id: "A", x: 3.5, z: 30, hx: 2.3, hz: .93 },
]);

// Marked sidewalk loops and a central promenade keep citizens visible and clear of solid scenery.
export const BUENOS_AIRES_PEDESTRIAN_ROUTES = Object.freeze([
  { id: "west-sidewalk", spawn: [-34, 38], points: [[-34, 38], [-34, 14], [-34, -17], [-34, -25.5], [-39, -25.5], [-39, -42], [-34, -43], [-34, -63], [-38, -63], [-38, -43], [-40, -42], [-40, -25.5], [-38, -17], [-38, 14], [-38, 38]] },
  { id: "east-sidewalk", spawn: [34, 38], points: [[34, 38], [34, 14], [34, -17], [34, -25.5], [39, -25.5], [39, -42], [34, -43], [34, -63], [38, -63], [38, -43], [40, -42], [40, -25.5], [38, -17], [38, 14], [38, 38]] },
  { id: "corrientes-west", spawn: [-53, -25.5], points: [[-40, -25.5], [-52, -25.5], [-64, -25.5], [-52, -25.5], [-40, -25.5], [-40, -42], [-52, -42], [-64, -42], [-52, -42], [-40, -42]] },
  { id: "corrientes-east", spawn: [53, -25.5], points: [[40, -25.5], [52, -25.5], [64, -25.5], [52, -25.5], [40, -25.5], [40, -42], [52, -42], [64, -42], [52, -42], [40, -42]] },
  { id: "north-crossing", spawn: [-34, -24], points: [[-34, -24], [-24, -24], [-10, -24], [10, -24], [24, -24], [34, -24], [34, -26], [24, -26], [10, -26], [-10, -26], [-24, -26], [-34, -26]] },
  { id: "obelisk-promenade", spawn: [-4, 40], points: [[-4, 40], [-8, 36.95], [-12.7, 33.4], [-13.7, 29], [-14.6, 23], [-15, 16], [-15, 14], [-15, -20], [15, -20], [15, 14], [15, 16], [14.6, 23], [13.7, 29], [12.7, 33.4], [8, 36.95], [0, 43]] },
]);

export const BUENOS_AIRES_BUILDINGS = Object.freeze([
  // Frontages on both sides of 9 de Julio; the theatre blocks frame Corrientes.
  { x: -49, z: 50, hx: 8, hz: 11, height: 25, style: "classic", name: "HOTEL PLAZA" },
  { x: -49, z: 23, hx: 8, hz: 10, height: 37, style: "modern", name: "RED SUR" },
  { x: -49, z: -5, hx: 8, hz: 10, height: 30, style: "classic", name: "CONFITERIA 99" },
  { x: -49, z: -53, hx: 8, hz: 10, height: 23, style: "theatre", name: "TEATRO CORRIENTES" },
  { x: 49, z: 51, hx: 8, hz: 10, height: 31, style: "modern", name: "UNA SOLA RED" },
  { x: 49, z: 24, hx: 8, hz: 10, height: 26, style: "classic", name: "BAR EL OBELISCO" },
  { x: 49, z: -6, hx: 8, hz: 10, height: 43, style: "future", name: "SEGUI CONECTADO" },
  { x: 49, z: -53, hx: 8, hz: 10, height: 27, style: "theatre", name: "CINE LUNA" },
  { x: -67, z: 48, hx: 7, hz: 12, height: 22, style: "classic", name: "LIBRERIA" },
  { x: 67, z: 49, hx: 7, hz: 12, height: 35, style: "modern", name: "SIEMPRE EN LINEA" },
  { x: -67, z: -54, hx: 7, hz: 10, height: 29, style: "future", name: "TU MUNDO EN UNA PANTALLA" },
  { x: 67, z: -54, hx: 7, hz: 10, height: 20, style: "classic", name: "DISCOS 1999" },
]);

export const BUENOS_AIRES_OBSTACLES = Object.freeze([
  ...BA_GARDEN_LETTERS.map(({ x, z, hx, hz }) => ({ x, z, hx: hx + .16, hz })),
  ...BUENOS_AIRES_BUILDINGS.map(({ x, z, hx, hz }) => ({ x, z, hx, hz })),
  ...[-68, -53, 62].map(z => ({ x: 0, z, hx: .2, hz: .2 })),
  { x: OBELISK.x, z: OBELISK.z, hx: OBELISK_FIELD.halfExtent, hz: OBELISK_FIELD.halfExtent },
]);

export function canStandInBuenosAires(x, z, fieldOpen = false) {
  if (Math.abs(x) > 76 || Math.abs(z) > 77) return false;
  const obstacles = fieldOpen ? BUENOS_AIRES_OBSTACLES.slice(0, -1) : BUENOS_AIRES_OBSTACLES;
  if (fieldOpen && Math.abs(x - OBELISK.x) < 11.2 && Math.abs(z - OBELISK.z) < 11.2) return false;
  return !obstacles.some(({ x: bx, z: bz, hx, hz }) =>
    Math.abs(x - bx) < hx + .46 && Math.abs(z - bz) < hz + .46);
}

export function safeBuenosAiresSpawn(position, fieldOpen = false) {
  if (position && canStandInBuenosAires(position.x, position.z, fieldOpen)) return position;
  return { x: 0, z: BUENOS_AIRES_LAYOUT.spawnZ, yaw: Math.PI, viewYaw: 0 };
}
