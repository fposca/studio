// Shared between the catacomb mesh and Rapier colliders.
export const CATACOMB_TORCHES = [
  ...[8, -4, -16, -28, -37].flatMap((z) => [-10.4, 10.4].map((x) => [x, z])),
  ...[-49, -61, -73, -85, -92].flatMap((z) => [-18.2, 18.2].map((x) => [x, z]))
];
export const CATACOMB_CHAMBERS = [
  { id: "west-reliquary", side: -1, x: -13.6, z: -15 },
  { id: "east-reliquary", side: 1, x: 13.6, z: -27 },
  { id: "west-bone-vault", side: -1, x: -17.5, z: -60, entranceX: -14.95 },
  { id: "east-bone-vault", side: 1, x: 17.5, z: -77, entranceX: 14.95 }
];
export const CATACOMB_SARCOPHAGI = [[-9, 1], [9, -10], [-9, -22], [8.8, -35]];
export const CATACOMB_SARCOPHAGUS_COLLIDERS = [
  ...CATACOMB_SARCOPHAGI.map(([x, z]) => [x, 0.475, z, 1.62, 0.95, 2.82]),
  ...[-52, -68, -84].flatMap((z) => [-16.5, 16.5].map((x) => [x, 1, z, 1.82, 0.13, 2.92]))
];
export const CATACOMB_OBSTACLES = [
  ...CATACOMB_CHAMBERS.flatMap(({ side, x, z, entranceX = side * 11.05 }) => [
    [x, 1.65, z - 2.2, 5.3, 3.3, 0.35],
    [x, 1.65, z + 2.2, 5.3, 3.3, 0.35],
    [side * (Math.abs(x) + 2.55), 1.65, z, 0.35, 3.3, 4.6],
    [entranceX, 1.65, z - 1.7, 0.35, 3.3, 1.05],
    [entranceX, 1.65, z + 1.7, 0.35, 3.3, 1.05]
  ]),
  ...[-6, -19, -32].flatMap((z) => [-8.5, 8.5].map((x) => [x, 1.75, z, 0.9, 3.5, 0.9])),
  [0, 2.15, -40.3, 8, 4.3, 2.1],
  ...[-51, -63, -75, -87].flatMap((z) => [-11, 11].map((x) => [x, 1.9, z, 1, 3.8, 1])),
  ...[-55, -79].map((z) => [0, 1.9, z, 8.5, 3.8, 0.9]),
  ...[-52, -68, -84].flatMap((z) => [-16.5, 16.5].map((x) => [x, 0.48, z, 1.7, 0.96, 2.8])),
  ...[-16.1, 16.1].map((x) => [x, 2.4, -11, 0.65, 4.8, 65]),
  ...[-12.7, 12.7].map((x) => [x, 2.4, -43.5, 6.8, 4.8, 0.65]),
  ...[-20.8, 20.8].map((x) => [x, 2.4, -69.2, 0.65, 4.8, 51.2]),
  ...[-5, 5].map((x) => [x, 2.2, -92.5, 1.1, 4.4, 1.1]),
  [0, 2.4, -94.5, 42.2, 4.8, 0.65]
];
export const CATACOMB_PLATFORMS = [
  ["vault-1", 2, 0.85, -7], ["vault-2", 4, 1.55, -9.8], ["vault-3", 6, 2.2, -12.5],
  ["vault-4", -2, 0.85, -21], ["vault-5", -4, 1.55, -23.8], ["vault-6", -6, 2.2, -26.6],
  ["bone-walk-1", -6, 0.85, -47], ["bone-walk-2", -7.1, 1.55, -50],
  ["bone-walk-3", -8.2, 2.3, -53], ["bone-walk-4", -8.7, 3.05, -56],
  ["bone-walk-5", -8, 2.3, -59], ["bone-walk-6", -7, 1.55, -62],
  ["bone-walk-7", 6, 0.85, -69], ["bone-walk-8", 7.1, 1.55, -72],
  ["bone-walk-9", 8.2, 2.3, -75], ["bone-walk-10", 8.7, 3.05, -78],
  ["bone-walk-11", 8, 2.3, -81], ["bone-walk-12", 7, 1.55, -84]
].map(([id, x, y, z], index) => ({ id, x, y, z, axis: index % 2 ? "x" : "z",
  amplitude: index < 6 || index === 6 || index === 12 ? 0 : 0.32,
  period: 5.1 + index * 0.26, width: 2.7, depth: 2.7, height: 0.38 }));
export const CATACOMB_HAZARDS = [
  { id: "bone-scythe-1", kind: "sweeper", x: 0, y: 0.48, z: -11, width: 5.2, height: 0.3, depth: 0.34, period: 4.3, damage: 21 },
  { id: "bone-scythe-2", kind: "sweeper", x: 0, y: 0.48, z: -26, width: 5.2, height: 0.3, depth: 0.34, period: -4.8, damage: 21 },
  { id: "floor-spikes-1", kind: "spikes", x: -5.8, y: 0.22, z: -17.5, width: 3.7, height: 0.42, depth: 1.3, damage: 23 },
  { id: "floor-spikes-2", kind: "spikes", x: 5.8, y: 0.22, z: -32.5, width: 3.7, height: 0.42, depth: 1.3, damage: 23 },
  { id: "bone-scythe-3", kind: "sweeper", x: 0, y: 0.48, z: -58, width: 5.5, height: 0.3, depth: 0.34, period: 5.1, damage: 24 },
  { id: "bone-scythe-4", kind: "sweeper", x: 0, y: 0.48, z: -82, width: 5.5, height: 0.3, depth: 0.34, period: -5.6, damage: 24 },
  { id: "floor-spikes-3", kind: "spikes", x: 5.3, y: 0.22, z: -65, width: 3.4, height: 0.42, depth: 1.3, damage: 25 },
  { id: "floor-spikes-4", kind: "spikes", x: -5.3, y: 0.22, z: -74, width: 3.4, height: 0.42, depth: 1.3, damage: 25 }
];
export const CATACOMBS_LEVEL = {
  id: 4, name: "Las catacumbas", enemy: "mummy", enemyHealth: 105,
  bounds: { left: -20.45, right: 20.45, back: -94.1, front: 21 },
  spawn: { x: 0, y: 0, z: 13 }, platforms: CATACOMB_PLATFORMS, hazards: CATACOMB_HAZARDS,
  advisor: { x: -4, y: 0, z: 12,
    tips: [
      { title: "Las catacumbas", text: "Neonboy, lleva la ballesta. Tiene diez flechas; busca los carcajes de luz cuando se agoten. Las runas de los muros esconden pasajes.", action: "Entrar" },
      { title: "Los pasadizos", text: "Las losas altas ocultan monedas. Salta entre ellas y vigila las guadanas que barren el suelo. Dispara a las runas de las camaras laterales.", action: "Seguir" },
      { title: "La momia jefe", text: "La momia jefe blande una guadana. Cuando levante el brazo, sal de su alcance y apunta al centro del pecho. Vuelve por municion si hace falta.", action: "Enfrentarla" }
    ] },
  secretDoors: CATACOMB_CHAMBERS.map(({ id, side, z, entranceX }) => ({ id, x: entranceX ?? side * 11.05, y: 0, z,
    width: 0.45, height: 3.3, depth: 2.35, breakWith: "crossbow" })),
  coins: [
    [0, 0, 10], [0, 0, 6], [0, 0, 2], [-6, 0, 1], [6, 0, 1], [-6, 0, -5], [0, 0, -5],
    [6, 0, -5], [-6, 0, -12], [0, 0, -14], [6, 0, -14], [-6, 0, -19], [0, 0, -19],
    [6, 0, -19], [-6, 0, -28], [0, 0, -29], [6, 0, -28], [-6, 0, -35], [0, 0, -35],
    [6, 0, -35], [0, 0, -39],
    ...CATACOMB_PLATFORMS.slice(0, 6).flatMap((platform) => [-0.45, 0.45].map((offset) =>
      [platform.x + offset, platform.y, platform.z, platform.id])),
    ...[-46, -51, -56, -61, -66, -71, -76, -81, -86, -91].flatMap((z, index) =>
      [[index % 2 ? 4.5 : -4.5, 0, z], [index % 2 ? -4.5 : 4.5, 0, z - 1.3]]),
    ...[-60, -76, -88].flatMap((z) => [[-18, 0, z], [18, 0, z]]),
    ...CATACOMB_PLATFORMS.slice(6).flatMap((platform) => [-0.45, 0.45].map((offset) =>
      [platform.x + offset, platform.y, platform.z, platform.id]))
  ],
  enemies: [
    { x: -6, y: 0, z: -2, species: "mummy" }, { x: 6, y: 0, z: -5, species: "mummy" },
    { x: -5, y: 0, z: -13, species: "mummy" }, { x: 5, y: 0, z: -17, species: "mummy" },
    { x: -7, y: 0, z: -24, species: "mummy" }, { x: 7, y: 0, z: -28, species: "mummy" },
    { x: -5, y: 0, z: -34, species: "mummy" }, { x: 5, y: 0, z: -36, species: "mummy" },
    { x: -5, y: 0, z: -47, species: "mummy" }, { x: 7, y: 0, z: -51, species: "mummy" },
    { x: -8, y: 0, z: -56, species: "mummy" }, { x: 5, y: 0, z: -60, species: "mummy" },
    { x: 0, y: 0, z: -65, species: "mummy" }, { x: -7, y: 0, z: -70, species: "mummy" },
    { x: 8, y: 0, z: -75, species: "mummy" }, { x: -5, y: 0, z: -80, species: "mummy" },
    { x: 6, y: 0, z: -85, species: "mummy" }, { x: -4, y: 0, z: -89, species: "mummy" },
    { x: 0, y: 0, z: -91, boss: true, species: "mummyChief", scale: 1.55, maxHealth: 510, name: "Momia jefe" }
  ],
  pickups: [{ weapon: "crossbow", x: 0, y: 0, z: 10.4 }],
  ammoPickups: [
    { id: "quiver-entry", x: 3.2, y: 0, z: 4, amount: 5 },
    { id: "quiver-west", x: -9.5, y: 0, z: -14, amount: 5 },
    { id: "quiver-middle", x: 8.5, y: 0, z: -23, amount: 5 },
    { id: "quiver-east", x: 9.5, y: 0, z: -33, amount: 5 },
    { id: "quiver-vault", x: -13, y: 0, z: -57, amount: 5 },
    { id: "quiver-gallery", x: 13, y: 0, z: -74, amount: 5 },
    { id: "quiver-altar", x: -12, y: 0, z: -86, amount: 5 }
  ],
  hearts: [
    { id: "catacomb-entry", x: -7.5, y: 0, z: 6 },
    { id: "catacomb-middle", x: 8, y: 0, z: -18 },
    { id: "catacomb-depth", x: -8, y: 0, z: -32 },
    { id: "catacomb-gallery", x: 13, y: 0, z: -65 },
    { id: "catacomb-altar", x: -13, y: 0, z: -87 }
  ],
  artifacts: [
    { id: "catacomb-urn", model: "lekythos", title: "Urna de la catacumba", points: 150,
      x: -13.8, y: 0, z: -15, secret: "west-reliquary",
      text: "Una urna olvidada guarda la memoria de quienes atravesaron las catacumbas." },
    { id: "catacomb-stele", model: "stele", title: "Estela escondida", points: 175,
      x: 13.8, y: 0, z: -27, secret: "east-reliquary",
      text: "La estela estaba oculta tras un muro marcado por una runa antigua." },
    { id: "bone-vault-urn", model: "lekythos", title: "Urna de la galeria de huesos", points: 200,
      x: -17.5, y: 0, z: -60, secret: "west-bone-vault",
      text: "Entre los restos del pasadizo, una urna conserva una ofrenda olvidada." },
    { id: "bone-vault-stele", model: "stele", title: "Estela del ultimo guardian", points: 225,
      x: 17.5, y: 0, z: -77, secret: "east-bone-vault",
      text: "La inscripcion anuncia la camara final de las catacumbas." }
  ]
};
