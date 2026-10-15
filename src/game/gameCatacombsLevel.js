// Shared between the catacomb mesh and Rapier colliders.
export const CATACOMB_TORCHES = [8, -4, -16, -28, -37].flatMap((z) => [-10.4, 10.4].map((x) => [x, z]));
export const CATACOMB_CHAMBERS = [
  { id: "west-reliquary", side: -1, x: -13.6, z: -15 },
  { id: "east-reliquary", side: 1, x: 13.6, z: -27 }
];
export const CATACOMB_OBSTACLES = [
  ...CATACOMB_CHAMBERS.flatMap(({ side, x, z }) => [
    [x, 1.65, z - 2.2, 5.3, 3.3, 0.35],
    [x, 1.65, z + 2.2, 5.3, 3.3, 0.35],
    [side * 16.15, 1.65, z, 0.35, 3.3, 4.6],
    [side * 11.05, 1.65, z - 1.7, 0.35, 3.3, 1.05],
    [side * 11.05, 1.65, z + 1.7, 0.35, 3.3, 1.05]
  ]),
  ...[-6, -19, -32].flatMap((z) => [-8.5, 8.5].map((x) => [x, 1.75, z, 0.9, 3.5, 0.9])),
  [0, 2.15, -40.3, 8, 4.3, 2.1]
];
export const CATACOMB_PLATFORMS = [
  ["vault-1", 2, 0.85, -7], ["vault-2", 4, 1.55, -9.8], ["vault-3", 6, 2.2, -12.5],
  ["vault-4", -2, 0.85, -21], ["vault-5", -4, 1.55, -23.8], ["vault-6", -6, 2.2, -26.6]
].map(([id, x, y, z]) => ({ id, x, y, z, axis: "x", amplitude: 0, period: 1,
  width: 2.55, depth: 2.55, height: 0.38 }));
export const CATACOMB_HAZARDS = [
  { id: "bone-scythe-1", kind: "sweeper", x: 0, y: 0.48, z: -11, width: 5.2, height: 0.3, depth: 0.34, period: 4.3, damage: 21 },
  { id: "bone-scythe-2", kind: "sweeper", x: 0, y: 0.48, z: -26, width: 5.2, height: 0.3, depth: 0.34, period: -4.8, damage: 21 },
  { id: "floor-spikes-1", kind: "spikes", x: -5.8, y: 0.22, z: -17.5, width: 3.7, height: 0.42, depth: 1.3, damage: 23 },
  { id: "floor-spikes-2", kind: "spikes", x: 5.8, y: 0.22, z: -32.5, width: 3.7, height: 0.42, depth: 1.3, damage: 23 }
];
export const CATACOMBS_LEVEL = {
  id: 4, name: "Las catacumbas", enemy: "mummy", enemyHealth: 105,
  spawn: { x: 0, y: 0, z: 13 }, platforms: CATACOMB_PLATFORMS, hazards: CATACOMB_HAZARDS,
  advisor: { x: -4, y: 0, z: 12,
    tips: [
      { title: "Las catacumbas", text: "Neonboy, lleva la ballesta. Tiene diez flechas; busca los carcajes de luz cuando se agoten. Las runas de los muros esconden pasajes.", action: "Entrar" },
      { title: "Los pasadizos", text: "Las losas altas ocultan monedas. Salta entre ellas y vigila las guadanas que barren el suelo. Dispara a las runas de las camaras laterales.", action: "Seguir" },
      { title: "La momia jefe", text: "La momia jefe blande una guadana. Cuando levante el brazo, sal de su alcance y apunta al centro del pecho. Vuelve por municion si hace falta.", action: "Enfrentarla" }
    ] },
  secretDoors: CATACOMB_CHAMBERS.map(({ id, side, z }) => ({ id, x: side * 11.05, y: 0, z,
    width: 0.45, height: 3.3, depth: 2.35, breakWith: "crossbow" })),
  coins: [
    [0, 0, 10], [0, 0, 6], [0, 0, 2], [-6, 0, 1], [6, 0, 1], [-6, 0, -5], [0, 0, -5],
    [6, 0, -5], [-6, 0, -12], [0, 0, -14], [6, 0, -14], [-6, 0, -19], [0, 0, -19],
    [6, 0, -19], [-6, 0, -28], [0, 0, -29], [6, 0, -28], [-6, 0, -35], [0, 0, -35],
    [6, 0, -35], [0, 0, -39],
    ...CATACOMB_PLATFORMS.flatMap((platform) => [-0.45, 0.45].map((offset) =>
      [platform.x + offset, platform.y, platform.z, platform.id]))
  ],
  enemies: [
    { x: -6, y: 0, z: -2, species: "mummy" }, { x: 6, y: 0, z: -5, species: "mummy" },
    { x: -5, y: 0, z: -13, species: "mummy" }, { x: 5, y: 0, z: -17, species: "mummy" },
    { x: -7, y: 0, z: -24, species: "mummy" }, { x: 7, y: 0, z: -28, species: "mummy" },
    { x: -5, y: 0, z: -34, species: "mummy" }, { x: 5, y: 0, z: -36, species: "mummy" },
    { x: 0, y: 0, z: -38, boss: true, species: "mummyChief", scale: 1.55, maxHealth: 510, name: "Momia jefe" }
  ],
  pickups: [{ weapon: "crossbow", x: 0, y: 0, z: 10.4 }],
  ammoPickups: [
    { id: "quiver-entry", x: 3.2, y: 0, z: 4, amount: 5 },
    { id: "quiver-west", x: -9.5, y: 0, z: -14, amount: 5 },
    { id: "quiver-middle", x: 8.5, y: 0, z: -23, amount: 5 },
    { id: "quiver-east", x: 9.5, y: 0, z: -33, amount: 5 }
  ],
  hearts: [
    { id: "catacomb-entry", x: -7.5, y: 0, z: 6 },
    { id: "catacomb-middle", x: 8, y: 0, z: -18 },
    { id: "catacomb-depth", x: -8, y: 0, z: -32 }
  ],
  artifacts: [
    { id: "catacomb-urn", model: "lekythos", title: "Urna de la catacumba", points: 150,
      x: -13.8, y: 0, z: -15, secret: "west-reliquary",
      text: "Una urna olvidada guarda la memoria de quienes atravesaron las catacumbas." },
    { id: "catacomb-stele", model: "stele", title: "Estela escondida", points: 175,
      x: 13.8, y: 0, z: -27, secret: "east-reliquary",
      text: "La estela estaba oculta tras un muro marcado por una runa antigua." }
  ]
};
