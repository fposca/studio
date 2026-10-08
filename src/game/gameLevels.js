import { COIN_POSITIONS, ENEMY_SPAWNS, PLAYER_SPAWN } from "./gameRules.js";

// Visual graves and collision boxes share the same layout.
export const GRAVES = [-8, -15, -22, -29].flatMap((z, row) =>
  [-11, -6, 6, 11].map((x, column) => ({ x, z, kind: (row + column) % 3 })));
export const CEMETERY_OBSTACLES = [
  ...GRAVES.map(({ x, z }) => [x, 0.78, z, 1.15, 1.56, 0.42]),
  ...GRAVES.map(({ x, z }) => [x, 0.06, z + 1.1, 1.08, 0.12, 2.6]),
  ...GRAVES.filter(({ kind }) => kind === 1).map(({ x, z }) => [x, 1.8, z, 0.55, 0.65, 0.2]),
  [0, 2.8, -38.2, 8, 5.6, 6]
];

export const LEVELS = Object.freeze([
  { id: 1, name: "El Partenon", enemy: "guardian", enemyHealth: 80, spawn: PLAYER_SPAWN,
    coins: COIN_POSITIONS, enemies: ENEMY_SPAWNS,
    pickups: [{ weapon: "sword", x: -0.9, y: 0, z: 6.3 }] },
  { id: 2, name: "El cementerio", enemy: "demon", enemyHealth: 120, spawn: PLAYER_SPAWN,
    coins: [[0, 0, 10], [0, 0, 7], [0, 0, 3], [0, 0, -2], [-3, 0, -5], [-3, 0, -11],
      [-9, 0, -11], [-14, 0, -11], [-14, 0, -19], [-9, 0, -19], [-3, 0, -19],
      [-3, 0, -26], [-9, 0, -26], [-14, 0, -33], [-7, 0, -33], [0, 0, -33],
      [7, 0, -33], [14, 0, -33], [14, 0, -26], [9, 0, -26], [3, 0, -26],
      [3, 0, -19], [9, 0, -19], [14, 0, -19], [14, 0, -11], [9, 0, -11], [3, 0, -11], [3, 0, -5]],
    enemies: [{ x: 4, y: 0, z: -3 }, { x: -13.8, y: 0, z: -15 },
      { x: -2, y: 0, z: -24 }, { x: 13.8, y: 0, z: -22 }, { x: 0, y: 0, z: -32 }],
    pickups: [{ weapon: "hammer", x: 0, y: 0, z: 1.5 }] }
]);

export function getLevel(id = 1) {
  const level = LEVELS.find((entry) => entry.id === id);
  if (!level) throw new Error(`Nivel desconocido: ${id}`);
  return level;
}
