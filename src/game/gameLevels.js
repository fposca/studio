import { COIN_POSITIONS, ENEMY_SPAWNS, PLAYER_SPAWN } from "./gameRules.js";
import { INTERIOR_LEVEL } from "./gameInteriorLevel.js";
import { CATACOMBS_LEVEL } from "./gameCatacombsLevel.js";

export const TEMPLE_PLATFORMS = [
  { id: "step-1", x: 5, y: 0.9, z: 8, axis: "x", amplitude: 0.45, period: 5 },
  { id: "step-2", x: 7.8, y: 1.85, z: 5.6, axis: "z", amplitude: 0.5, period: 5.8 },
  { id: "step-3", x: 10.5, y: 2.8, z: 3.2, axis: "x", amplitude: 0.55, period: 6.2 },
  { id: "step-4", x: 12.5, y: 3.65, z: 0, axis: "z", amplitude: 0.55, period: 6.8 },
  { id: "step-5", x: 14, y: 2.9, z: -3.4, axis: "x", amplitude: 0.5, period: 5.6 },
  { id: "step-6", x: 14, y: 2, z: -6.8, axis: "z", amplitude: 0.45, period: 6 },
  { id: "step-7", x: 14, y: 1.05, z: -10.2, axis: "x", amplitude: 0.45, period: 5.2 }
].map((platform) => ({ ...platform, width: 2.7, depth: 2.7, height: 0.42 }));

// A second route branches from step 4 and climbs above the temple into the clouds.
// Keep the original seven platforms first so existing saves and route markers remain stable.
export const TEMPLE_ASCENT_PLATFORMS = [
  ["sky-1", 15, 4.5, 1.6], ["sky-2", 15, 5.35, 4.5],
  ["sky-3", 12.5, 6.2, 7], ["sky-4", 9.7, 7.05, 7],
  ["sky-5", 6.9, 7.9, 6.8], ["sky-6", 4.4, 8.75, 5.4],
  ["sky-7", 3.2, 9.6, 2.8], ["sky-8", 2.6, 10.45, 0],
  ["sky-9", 2.2, 11.3, -2.8], ["sky-10", 2, 12.15, -5.6],
  ["sky-11", 1.8, 13, -8.4], ["sky-12", 1.6, 13.85, -11.2],
  ["sky-13", 1.4, 14.7, -14], ["sky-14", 1.2, 15.55, -16.8],
  ["sky-15", 1, 16.4, -19.6], ["sky-16", 0.8, 17.25, -22.4],
  ["sky-17", 0.6, 18.1, -25.2], ["dragon-perch", 0.4, 18.95, -28, 5, 5]
].map(([id, x, y, z, width = 2.85, depth = 2.85]) =>
  ({ id, x, y, z, axis: "x", amplitude: 0, period: 1, width, depth, height: 0.48, sky: true }));

export const TEMPLE_HAZARDS = [
  { id: "sweeper-west", kind: "sweeper", x: -14, y: 0.5, z: -8, width: 4, height: 0.28, depth: 0.32, period: 5.5, damage: 14 },
  { id: "sweeper-east", kind: "sweeper", x: 14, y: 0.5, z: -21, width: 4, height: 0.28, depth: 0.32, period: -6, damage: 14 },
  { id: "spikes-west", kind: "spikes", x: -14, y: 0.2, z: -21.5, width: 3.8, height: 0.4, depth: 1.05, damage: 18 }
];

export function platformPositionAt(platform, time) {
  const position = { x: platform.x, y: platform.y, z: platform.z };
  position[platform.axis] += Math.sin(time * Math.PI * 2 / platform.period) * platform.amplitude;
  return position;
}

// Visual graves and collision boxes share the same layout.
export const GRAVES = [-8, -15, -22, -29].flatMap((z, row) =>
  [-11, -6, 6, 11].map((x, column) => ({ x, z, kind: (row + column) % 3 })));
export const CEMETERY_PLATFORMS = [
  ["crypt-step-1", 0, 0.85, -7.5], ["crypt-step-2", 0, 1.45, -10.5],
  ["crypt-step-3", 1.2, 2.05, -13.5], ["crypt-step-4", 2.4, 2.55, -16.5],
  ["crypt-step-5", 1, 0.85, -21.5], ["crypt-step-6", 1, 1.5, -24.4],
  ["crypt-step-7", 1, 2.15, -27.3]
].map(([id, x, y, z]) => ({ id, x, y, z, axis: "x", amplitude: 0, period: 1, width: 2.5, depth: 2.5, height: 0.38 }));

export const CEMETERY_HAZARDS = [
  { id: "grave-sweeper", kind: "sweeper", x: -3.8, y: 0.55, z: -12.5, width: 3.5, height: 0.28, depth: 0.32, period: 5, damage: 16 },
  { id: "crypt-spikes-west", kind: "spikes", x: -4, y: 0.23, z: -26.7, width: 3.1, height: 0.42, depth: 1.05, damage: 20 },
  { id: "crypt-spikes-east", kind: "spikes", x: 7.3, y: 0.23, z: -30.5, width: 3.1, height: 0.42, depth: 1.05, damage: 20 }
];

export const CEMETERY_CRYPT_WALLS = [-1, 1].flatMap((side) => {
  const z = side < 0 ? -16 : -23;
  return [[side * 15.05, 1.25, z - 1.72, 2.7, 2.5, 0.35],
    [side * 15.05, 1.25, z + 1.72, 2.7, 2.5, 0.35],
    [side * 16.25, 1.25, z, 0.35, 2.5, 3.7]];
});

export const CEMETERY_TORCHES = [6, -12, -28, -34].flatMap((z) => [-15.6, 15.6].map((x) => [x, z]));

export const CEMETERY_OBSTACLES = [
  ...CEMETERY_CRYPT_WALLS,
  ...GRAVES.map(({ x, z }) => [x, 0.78, z, 1.15, 1.56, 0.42]),
  ...GRAVES.map(({ x, z }) => [x, 0.06, z + 1.1, 1.08, 0.12, 2.6]),
  ...GRAVES.filter(({ kind }) => kind === 1).map(({ x, z }) => [x, 1.8, z, 0.55, 0.65, 0.2]),
  [0, 2.8, -38.2, 8, 5.6, 6]
];

export const LEVELS = Object.freeze([
  { id: 1, name: "El Partenon", enemy: "guardian", enemyHealth: 80, spawn: PLAYER_SPAWN,
    platforms: [...TEMPLE_PLATFORMS, ...TEMPLE_ASCENT_PLATFORMS], hazards: TEMPLE_HAZARDS,
    dragon: { x: 0.4, y: 18.95, z: -29.4, landingTime: 24 },
    coins: [...COIN_POSITIONS, ...TEMPLE_PLATFORMS.flatMap((platform) =>
      [-0.55, 0.55].map((offset) => [platform.x + offset, platform.y, platform.z, platform.id])),
      ...TEMPLE_ASCENT_PLATFORMS.map((platform) => [platform.x, platform.y, platform.z, platform.id])],
    enemies: [...ENEMY_SPAWNS.map((spawn, index) => index === 1 ? { ...spawn, x: 10, z: -12 } : spawn),
      { x: 0, y: 0, z: 0, boss: true, species: "templeBoss", scale: 2, maxHealth: 360, name: "Guardian del Partenon" }],
    pickups: [{ weapon: "sword", x: -0.9, y: 0, z: 6.3 }],
    hearts: [
      { id: "temple-entry", x: -4, y: 0, z: 5 },
      { id: "temple-west", x: -14, y: 0, z: -15 },
      { id: "temple-east", x: 14, y: 0, z: -24 },
      { id: "temple-rear", x: -14, y: 0, z: -38 }
    ],
    artifacts: [
      { id: "frieze", model: "frieze", title: "Fragmento del friso", points: 100, x: 3.2, y: 0, z: 9,
        text: "El friso del Partenon muestra una procesion que suele identificarse con las Panateneas, la gran fiesta ateniense en honor a Atenea. Sus figuras recorrian los muros exteriores del templo.",
        source: "Museo de la Acropolis", url: "https://www.theacropolismuseum.gr/en/sculptural-decoration/frieze" },
      { id: "ostrakon", model: "ostrakon", title: "Ostrakon ateniense", points: 150, x: -12, y: 0, z: -16,
        text: "En Atenas se escribian nombres sobre fragmentos de ceramica llamados ostraka. Se usaban en las votaciones de ostracismo: un rastro de la politica de la ciudad, no una pieza del templo.",
        source: "Excavaciones del Agora", url: "https://www.agathe.gr/id/agora/publication/agora%2025" }
    ] },
  INTERIOR_LEVEL,
  { id: 3, name: "El cementerio", enemy: "demon", enemyHealth: 120, spawn: PLAYER_SPAWN,
    platforms: CEMETERY_PLATFORMS, hazards: CEMETERY_HAZARDS,
    secretDoors: [{ id: "west-crypt", x: -13.7, y: 0, z: -16, width: 0.55, height: 2.5, depth: 3.1, breakWith: "axe" },
      { id: "east-crypt", x: 13.7, y: 0, z: -23, width: 0.55, height: 2.5, depth: 3.1, breakWith: "axe" }],
    coins: [[0, 0, 10], [0, 0, 7], [0, 0, 3], [0, 0, -2], [-3, 0, -5], [-3, 0, -11],
      [-9, 0, -11], [-14, 0, -11], [-14, 0, -19], [-9, 0, -19], [-3, 0, -19],
      [-3, 0, -26], [-9, 0, -26], [-14, 0, -33], [-7, 0, -33], [0, 0, -33],
      [7, 0, -33], [14, 0, -33], [14, 0, -26], [9, 0, -26], [3, 0, -26],
      [3, 0, -19], [9, 0, -19], [14, 0, -19], [14, 0, -11], [9, 0, -11], [3, 0, -11], [3, 0, -5],
      ...CEMETERY_PLATFORMS.flatMap((platform) => [-0.52, 0.52].map((offset) =>
        [platform.x + offset, platform.y, platform.z, platform.id]))],
    enemies: [{ x: 4, y: 0, z: -3, species: "demon" }, { x: -13.8, y: 0, z: -15, species: "zombie", maxHealth: 120 },
      { x: -2, y: 0, z: -24, species: "demon" }, { x: 13.8, y: 0, z: -22, species: "zombie", maxHealth: 120 },
      { x: 0, y: 0, z: -32, species: "demon" },
      { x: -5, y: 0, z: -4, species: "zombie", maxHealth: 95 }, { x: 8, y: 0, z: -10, species: "zombie", maxHealth: 95 },
      { x: -8, y: 0, z: -18, species: "zombie", maxHealth: 95 }, { x: 5, y: 0, z: -20, species: "zombie", maxHealth: 95 },
      { x: -8, y: 0, z: -30, species: "zombie", maxHealth: 95 }, { x: 8, y: 0, z: -32, species: "zombie", maxHealth: 95 },
      { x: 0, y: 0, z: -31, boss: true, species: "zombieBoss", scale: 1.6, maxHealth: 480, name: "Zombi jefe" }],
    pickups: [{ weapon: "axe", x: 0, y: 0, z: 1.5 }],
    hearts: [
      { id: "cemetery-entry", x: 0, y: 0, z: 5 },
      { id: "cemetery-middle", x: 0, y: 0, z: -17 },
      { id: "cemetery-rear", x: 14, y: 0, z: -31 }
    ],
    artifacts: [
      { id: "lekythos", model: "lekythos", title: "Lecito funerario", points: 100, x: 3.2, y: 0, z: 5,
        text: "Los lecitos eran pequenos vasos para aceite. En la Grecia antigua, el aceite se usaba para preparar al difunto y tambien se dejaba como ofrenda junto a la tumba.",
        source: "The Metropolitan Museum of Art", url: "https://www.metmuseum.org/art/collection/search/254332" },
      { id: "stele", model: "stele", title: "Estela de piedra", points: 150, x: 0, y: 0, z: -23,
        text: "Muchas tumbas griegas estaban marcadas por estelas de piedra. Algunas llevaban relieves que recordaban a quienes habian muerto: la memoria de una vida convertida en imagen.",
        source: "The Metropolitan Museum of Art", url: "https://www.metmuseum.org/essays/death-burial-and-the-afterlife-in-ancient-greece" },
      { id: "crypt-urn", model: "lekythos", title: "Ofrenda de la cripta", points: 175, x: -15.2, y: 0, z: -16, secret: "west-crypt",
        text: "Una ofrenda funeraria quedo oculta tras el muro de la cripta. En los cementerios griegos, los recipientes y objetos personales acompanaban el recuerdo del difunto.",
        source: "The Metropolitan Museum of Art", url: "https://www.metmuseum.org/essays/death-burial-and-the-afterlife-in-ancient-greece" },
      { id: "crypt-stele", model: "stele", title: "Estela escondida", points: 200, x: 15.2, y: 0, z: -23, secret: "east-crypt",
        text: "Una estela escondida preserva la memoria de alguien enterrado aqui. Sus relieves hablan de la importancia de recordar a quienes partieron.",
        source: "The Metropolitan Museum of Art", url: "https://www.metmuseum.org/essays/death-burial-and-the-afterlife-in-ancient-greece" }
    ] },
  CATACOMBS_LEVEL
]);

export function getLevel(id = 1) {
  const level = LEVELS.find((entry) => entry.id === id);
  if (!level) throw new Error(`Nivel desconocido: ${id}`);
  return level;
}
