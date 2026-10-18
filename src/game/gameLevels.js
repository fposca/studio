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

export const TEMPLE_REAR_PLATFORMS = [
  ["rear-1", -8, 0.9, -47], ["rear-2", -8.8, 1.75, -50],
  ["rear-3", -9.4, 2.6, -53], ["rear-4", -8.5, 3.45, -56],
  ["rear-5", -7.3, 4.3, -59], ["rear-6", -6.2, 5.15, -62],
  ["rear-7", -5.1, 5.15, -65], ["rear-8", -4, 4.3, -68],
  ["rear-9", -3, 3.45, -71], ["rear-10", -2, 2.6, -74],
  ["rear-11", -1, 1.75, -77], ["rear-12", 0, 0.9, -80]
].map(([id, x, y, z], index) => ({ id, x, y, z, width: 2.7, depth: 2.7, height: 0.42,
  axis: index % 2 ? "x" : "z", amplitude: index % 3 === 0 ? 0 : 0.22, period: 5.2 + index * 0.23 }));

export const TEMPLE_HAZARDS = [
  { id: "sweeper-west", kind: "sweeper", x: -14, y: 0.5, z: -8, width: 4, height: 0.28, depth: 0.32, period: 5.5, damage: 14 },
  { id: "sweeper-east", kind: "sweeper", x: 14, y: 0.5, z: -21, width: 4, height: 0.28, depth: 0.32, period: -6, damage: 14 },
  { id: "spikes-west", kind: "spikes", x: -14, y: 0.2, z: -21.5, width: 3.8, height: 0.4, depth: 1.05, damage: 18 },
  { id: "rear-sweeper", kind: "sweeper", x: 3.5, y: 0.5, z: -58, width: 4.1, height: 0.3, depth: 0.35, period: 5.3, damage: 18 },
  { id: "rear-spikes", kind: "spikes", x: 7, y: 0.2, z: -76, width: 3.6, height: 0.4, depth: 1.2, damage: 20 }
];

export function platformPositionAt(platform, time) {
  const position = { x: platform.x, y: platform.y, z: platform.z };
  position[platform.axis] += Math.sin(time * Math.PI * 2 / platform.period) * platform.amplitude;
  return position;
}

// Visual graves and collision boxes share the same layout.
export const GRAVES = [
  ...[-8, -15, -22, -29].flatMap((z, row) =>
    [-11, -6, 6, 11].map((x, column) => ({ x, z, kind: (row + column) % 3 }))),
  ...[-48, -56, -64, -72, -80].flatMap((z, row) =>
    [-18, -12, 12, 18].map((x, column) => ({ x, z, kind: (row + column + 1) % 3 })))
];
export const CEMETERY_PLATFORMS = [
  ["crypt-step-1", 0, 0.85, -7.5], ["crypt-step-2", 0, 1.45, -10.5],
  ["crypt-step-3", 1.2, 2.05, -13.5], ["crypt-step-4", 2.4, 2.55, -16.5],
  ["crypt-step-5", 1, 0.85, -21.5], ["crypt-step-6", 1, 1.5, -24.4],
  ["crypt-step-7", 1, 2.15, -27.3],
  ["ossuary-1", 6, 0.85, -45], ["ossuary-2", 7.1, 1.55, -48],
  ["ossuary-3", 8.2, 2.3, -51], ["ossuary-4", 8.8, 3.05, -54],
  ["ossuary-5", 8.1, 2.3, -57], ["ossuary-6", 7, 1.55, -60],
  ["ossuary-7", -6, 0.85, -71], ["ossuary-8", -7, 1.55, -74],
  ["ossuary-9", -8, 2.3, -77], ["ossuary-10", -8.8, 3.05, -80],
  ["ossuary-11", -8, 2.3, -83], ["ossuary-12", -7, 1.55, -86]
].map(([id, x, y, z], index) => ({ id, x, y, z, axis: index < 7 || index % 2 ? "x" : "z",
  amplitude: index < 7 || index === 7 || index === 13 ? 0 : 0.32,
  period: 5.2 + index * 0.25, width: 2.7, depth: 2.7, height: 0.38 }));

export const CEMETERY_HAZARDS = [
  { id: "grave-sweeper", kind: "sweeper", x: -3.8, y: 0.55, z: -12.5, width: 3.5, height: 0.28, depth: 0.32, period: 5, damage: 16 },
  { id: "crypt-spikes-west", kind: "spikes", x: -4, y: 0.23, z: -26.7, width: 3.1, height: 0.42, depth: 1.05, damage: 20 },
  { id: "crypt-spikes-east", kind: "spikes", x: 7.3, y: 0.23, z: -30.5, width: 3.1, height: 0.42, depth: 1.05, damage: 20 },
  { id: "ossuary-sweeper", kind: "sweeper", x: 0, y: 0.55, z: -53, width: 5, height: 0.3, depth: 0.34, period: -5.4, damage: 19 },
  { id: "ossuary-spikes", kind: "spikes", x: -4, y: 0.23, z: -73, width: 3.2, height: 0.42, depth: 1.1, damage: 22 }
];

export const CEMETERY_REAR_CRYPTS = [
  { id: "west-ossuary", side: -1, x: -20, z: -61, entranceX: -17.55 },
  { id: "east-ossuary", side: 1, x: 20, z: -76, entranceX: 17.55 }
];
export const CEMETERY_CRYPT_WALLS = [
  ...[-1, 1].flatMap((side) => {
    const z = side < 0 ? -16 : -23;
    return [[side * 15.05, 1.25, z - 1.72, 2.7, 2.5, 0.35],
      [side * 15.05, 1.25, z + 1.72, 2.7, 2.5, 0.35],
      [side * 16.25, 1.25, z, 0.35, 2.5, 3.7]];
  }),
  ...CEMETERY_REAR_CRYPTS.flatMap(({ side, x, z, entranceX }) => [
    [x, 1.55, z - 2.2, 5.2, 3.1, 0.35], [x, 1.55, z + 2.2, 5.2, 3.1, 0.35],
    [side * 22.45, 1.55, z, 0.35, 3.1, 4.6],
    [entranceX, 1.55, z - 1.75, 0.35, 3.1, 1.1],
    [entranceX, 1.55, z + 1.75, 0.35, 3.1, 1.1]
  ])
];
export const CEMETERY_MAUSOLEUMS = [[0, 2.8, -38.2, 8, 5.6, 6], [0, 2.9, -67, 9, 5.8, 6]];

export const CEMETERY_TORCHES = [
  ...[6, -12, -28, -34].flatMap((z) => [-15.6, 15.6].map((x) => [x, z])),
  ...[-48, -62, -77, -88].flatMap((z) => [-21.8, 21.8].map((x) => [x, z]))
];

export const CEMETERY_OBSTACLES = [
  ...CEMETERY_CRYPT_WALLS,
  ...GRAVES.map(({ x, z }) => [x, 0.78, z, 1.15, 1.56, 0.42]),
  ...GRAVES.map(({ x, z }) => [x, 0.06, z + 1.1, 1.08, 0.12, 2.6]),
  ...GRAVES.filter(({ kind }) => kind === 1).map(({ x, z }) => [x, 1.8, z, 0.55, 0.65, 0.2]),
  ...CEMETERY_MAUSOLEUMS,
  ...CEMETERY_MAUSOLEUMS.map(([x, , z, width, height, depth]) => [x, height + 0.02, z, width + 0.6, 0.32, depth + 0.5]),
  ...[-4, 4].map((x) => [x, 2.2, -91.7, 1.15, 4.4, 1.1]),
  [0, 2, -92.35, 6.8, 4, 0.18]
];

export const LEVELS = Object.freeze([
  { id: 1, name: "El Partenon", enemy: "guardian", enemyHealth: 80, spawn: PLAYER_SPAWN,
    bounds: { left: -20.5, right: 20.5, back: -92, front: 21 },
    platforms: [...TEMPLE_PLATFORMS, ...TEMPLE_ASCENT_PLATFORMS, ...TEMPLE_REAR_PLATFORMS], hazards: TEMPLE_HAZARDS,
    dragon: { x: 0.4, y: 18.95, z: -29.4, landingTime: 24 },
    coins: [...COIN_POSITIONS, ...TEMPLE_PLATFORMS.flatMap((platform) =>
      [-0.55, 0.55].map((offset) => [platform.x + offset, platform.y, platform.z, platform.id])),
      ...TEMPLE_ASCENT_PLATFORMS.map((platform) => [platform.x, platform.y, platform.z, platform.id]),
      ...[-47, -51, -55, -59, -63, -67, -71, -75, -79, -83, -87].flatMap((z, index) =>
        [[index % 2 ? 4 : -4, 0, z], [index % 2 ? 9 : -9, 0, z - 1.2]]),
      ...TEMPLE_REAR_PLATFORMS.map((platform) => [platform.x, platform.y, platform.z, platform.id])],
    enemies: [...ENEMY_SPAWNS.map((spawn, index) => index === 1 ? { ...spawn, x: 10, z: -12 } : spawn),
      ...[[-5, -48], [7, -52], [5, -59], [-3, -63], [6, -69], [-7, -74], [4, -79], [-4, -83]]
        .map(([x, z]) => ({ x, y: 0, z })),
      { x: 0, y: 0, z: -85, boss: true, species: "templeBoss", scale: 2, maxHealth: 360, name: "Guardian del Partenon" }],
    pickups: [{ weapon: "sword", x: -0.9, y: 0, z: 6.3 }],
    hearts: [
      { id: "temple-entry", x: -4, y: 0, z: 5 },
      { id: "temple-west", x: -14, y: 0, z: -15 },
      { id: "temple-east", x: 14, y: 0, z: -24 },
      { id: "temple-rear", x: -14, y: 0, z: -38 },
      { id: "temple-patio", x: 10, y: 0, z: -62 },
      { id: "temple-gate", x: -9, y: 0, z: -82 }
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
    bounds: { left: -23.5, right: 23.5, back: -93, front: 21 },
    platforms: CEMETERY_PLATFORMS, hazards: CEMETERY_HAZARDS,
    secretDoors: [{ id: "west-crypt", x: -13.7, y: 0, z: -16, width: 0.55, height: 2.5, depth: 3.1, breakWith: "axe" },
      { id: "east-crypt", x: 13.7, y: 0, z: -23, width: 0.55, height: 2.5, depth: 3.1, breakWith: "axe" },
      ...CEMETERY_REAR_CRYPTS.map(({ id, entranceX, z }) => ({ id, x: entranceX, y: 0, z,
        width: 0.55, height: 3.1, depth: 2.4, breakWith: "axe" }))],
    coins: [[0, 0, 10], [0, 0, 7], [0, 0, 3], [0, 0, -2], [-3, 0, -5], [-3, 0, -11],
      [-9, 0, -11], [-14, 0, -11], [-14, 0, -19], [-9, 0, -19], [-3, 0, -19],
      [-3, 0, -26], [-9, 0, -26], [-14, 0, -33], [-7, 0, -33], [0, 0, -33],
      [7, 0, -33], [14, 0, -33], [14, 0, -26], [9, 0, -26], [3, 0, -26],
      [3, 0, -19], [9, 0, -19], [14, 0, -19], [14, 0, -11], [9, 0, -11], [3, 0, -11], [3, 0, -5],
      ...CEMETERY_PLATFORMS.slice(0, 7).flatMap((platform) => [-0.52, 0.52].map((offset) =>
        [platform.x + offset, platform.y, platform.z, platform.id])),
      ...[-44, -50, -57, -63, -72, -78, -84, -89].flatMap((z, index) =>
        [[index % 2 ? 5.5 : -5.5, 0, z], [index % 2 ? -5.5 : 5.5, 0, z - 1.2]]),
      ...[-52, -69, -83].flatMap((z) => [[-21, 0, z], [21, 0, z]]),
      ...CEMETERY_PLATFORMS.slice(7).flatMap((platform) => [-0.52, 0.52].map((offset) =>
        [platform.x + offset, platform.y, platform.z, platform.id]))],
    enemies: [{ x: 4, y: 0, z: -3, species: "demon" }, { x: -13.8, y: 0, z: -15, species: "zombie", maxHealth: 120 },
      { x: -2, y: 0, z: -24, species: "demon" }, { x: 13.8, y: 0, z: -22, species: "zombie", maxHealth: 120 },
      { x: 0, y: 0, z: -32, species: "demon" },
      { x: -5, y: 0, z: -4, species: "zombie", maxHealth: 95 }, { x: 8, y: 0, z: -10, species: "zombie", maxHealth: 95 },
      { x: -8, y: 0, z: -18, species: "zombie", maxHealth: 95 }, { x: 5, y: 0, z: -20, species: "zombie", maxHealth: 95 },
      { x: -8, y: 0, z: -30, species: "zombie", maxHealth: 95 }, { x: 8, y: 0, z: -32, species: "zombie", maxHealth: 95 },
      { x: -5, y: 0, z: -45, species: "zombie", maxHealth: 105 },
      { x: 8, y: 0, z: -49, species: "zombie", maxHealth: 105 },
      { x: 0, y: 0, z: -54, species: "demon" },
      { x: -8, y: 0, z: -59, species: "zombie", maxHealth: 115 },
      { x: 7, y: 0, z: -65, species: "zombie", maxHealth: 115 },
      { x: -5, y: 0, z: -70, species: "demon" },
      { x: 8, y: 0, z: -75, species: "zombie", maxHealth: 115 },
      { x: -8, y: 0, z: -82, species: "zombie", maxHealth: 115 },
      { x: 5, y: 0, z: -87, species: "zombie", maxHealth: 125 },
      { x: 0, y: 0, z: -89, boss: true, species: "zombieBoss", scale: 1.6, maxHealth: 480, name: "Zombi jefe" }],
    pickups: [{ weapon: "axe", x: 0, y: 0, z: 1.5 }],
    hearts: [
      { id: "cemetery-entry", x: 0, y: 0, z: 5 },
      { id: "cemetery-middle", x: 0, y: 0, z: -17 },
      { id: "cemetery-rear", x: 14, y: 0, z: -31 },
      { id: "cemetery-ossuary", x: 20, y: 0, z: -54 },
      { id: "cemetery-last-rites", x: -20, y: 0, z: -79 }
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
        source: "The Metropolitan Museum of Art", url: "https://www.metmuseum.org/essays/death-burial-and-the-afterlife-in-ancient-greece" },
      { id: "ossuary-urn", model: "lekythos", title: "Urna del osario", points: 220, x: -20, y: 0, z: -61, secret: "west-ossuary",
        text: "Una urna permanecio sellada en el osario mas antiguo del cementerio." },
      { id: "ossuary-stele", model: "stele", title: "Estela del osario", points: 240, x: 20, y: 0, z: -76, secret: "east-ossuary",
        text: "Tras la puerta de piedra hay una estela con los nombres de los guardianes olvidados." }
    ] },
  CATACOMBS_LEVEL
]);

export function getLevel(id = 1) {
  const level = LEVELS.find((entry) => entry.id === id);
  if (!level) throw new Error(`Nivel desconocido: ${id}`);
  return level;
}
