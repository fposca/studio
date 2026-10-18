// Shared by the render scene and Rapier so chambers and doors remain aligned.
export const INTERIOR_COLUMNS = [
  ...[8, 0, -8, -16, -24, -32].flatMap((z) => [-5.8, 5.8].map((x) => [x, z])),
  ...[-50, -58, -66, -74, -82, -90].flatMap((z) => [-15.2, -7.2, 7.2, 15.2].map((x) => [x, z]))
];
export const INTERIOR_TORCHES = [
  ...[11, -3, -17, -31].flatMap((z) => [-7.2, 7.2].map((x) => [x, z])),
  ...[-48, -60, -72, -84, -96].flatMap((z) => [-18.1, 18.1].map((x) => [x, z]))
];
export const SECRET_DOORS = [
  { id: "west-vault", x: -9, y: 0, z: -6, width: 0.5, height: 5.8, depth: 2.6 },
  { id: "east-vault", x: 9, y: 0, z: -23, width: 0.5, height: 5.8, depth: 2.6 }
];
const VAULT_OBSTACLES = SECRET_DOORS.flatMap(({ x, z }) => [
  [Math.sign(x) * 12.9, 4, z - 4, 7.8, 8, 0.5],
  [Math.sign(x) * 12.9, 4, z + 4, 7.8, 8, 0.5],
  [x, 4, z - 2.65, 0.5, 8, 2.7],
  [x, 4, z + 2.65, 0.5, 8, 2.7],
  [x, 6.9, z, 0.5, 2.2, 2.6]
]);

// The original sanctuary remains the entrance; a wide rear nave opens beyond its altar.
export const INTERIOR_DECOR_OBSTACLES = [
  ...VAULT_OBSTACLES,
  ...[-56, -72, -86].flatMap((z) => [-17.5, 17.5].map((x) => [x, 0.9, z, 1.4, 1.8, 1.4])),
  [0, 2.1, -55.3, 9, 4.2, 0.8], [0, 2.1, -78.5, 10, 4.2, 0.8]
];
export const INTERIOR_OBSTACLES = [
  ...INTERIOR_DECOR_OBSTACLES,
  ...[-17.1, 17.1].map((x) => [x, 4, -11.25, 0.6, 8, 65.5]),
  ...[-11.55, 11.55].map((x) => [x, 4, -43.8, 11.1, 8, 0.6]),
  ...[-21.1, 21.1].map((x) => [x, 4, -72.2, 0.6, 8, 57.6]),
  [0, 4, -100.8, 42.4, 8, 0.6]
];

export const INTERIOR_GALLERY = [
  [-13.1, 0.9, -51.5], [-12.3, 1.7, -54.4], [-11, 2.5, -57.2],
  [-9.5, 3.3, -60], [-7.5, 3.9, -62.9], [-4.6, 3.25, -65.8],
  [-2.5, 2.55, -68.7], [0.5, 1.75, -71.6], [3.3, 0.95, -74.5]
].map(([x, y, z], index) => ({ id: "sanctuary-gallery-" + (index + 1), x, y, z,
  axis: index % 2 ? "x" : "z", amplitude: index === 0 || index === 8 ? 0 : 0.34,
  period: 5.2 + index * 0.38, width: 3.1, depth: 3.1, height: 0.42 }));

export const INTERIOR_LEVEL = {
  id: 2, name: "El santuario de Atenea", enemy: "hoplite", enemyHealth: 105,
  bounds: { left: -20.7, right: 20.7, back: -100.3, front: 21 },
  platforms: INTERIOR_GALLERY,
  spawn: { x: 0, y: 0, z: 13 },
  quest: { npc: "Platon", x: -2, y: 0, z: 11, artifact: "athena-seal", reward: 500 },
  secretDoors: SECRET_DOORS,
  coins: [10, 5, 0, -5, -10, -15, -20, -25, -30].flatMap((z, i) =>
    [[i % 2 ? 2 : -2, 0, z], [i % 2 ? -2 : 2, 0, z - 1.5]])
    .concat([[-12, 0, -5], [-14, 0, -7], [12, 0, -22], [14, 0, -24],
      [-7.5, 0, 3], [7.5, 0, -12], [-7.5, 0, -21], [7.5, 0, -32], [-3, 0, -37], [3, 0, -37],
      ...[-47, -52, -57, -62, -67, -72, -77, -82, -87, -92].flatMap((z, index) =>
        [[index % 2 ? 4.5 : -4.5, 0, z], [index % 2 ? -5.5 : 5.5, 0, z - 1.8]]),
      ...[-54, -69, -84].flatMap((z) => [[-18, 0, z], [18, 0, z]]),
      ...INTERIOR_GALLERY.map((platform) => [platform.x, platform.y, platform.z, platform.id])]),
  enemies: [
    { x: 2.5, y: 0, z: -2 }, { x: -3, y: 0, z: -13 }, { x: 3.5, y: 0, z: -21 },
    { x: -7.5, y: 0, z: -30 },
    { x: -3.6, y: 0, z: -8, species: "statue", stationary: true, maxHealth: 150 },
    { x: 3.6, y: 0, z: -18, species: "statue", stationary: true, maxHealth: 150 },
    { x: 3, y: 0, z: -51 }, { x: -8, y: 0, z: -63 },
    { x: 8, y: 0, z: -75 }, { x: -4, y: 0, z: -87 },
    { x: 13.8, y: 0, z: -55, species: "statue", stationary: true, maxHealth: 150 },
    { x: -13.8, y: 0, z: -80, species: "statue", stationary: true, maxHealth: 150 },
    { x: 0, y: 0, z: -92, boss: true, species: "medusa", scale: 1.45, maxHealth: 420, name: "Medusa" }
  ],
  pickups: [{ weapon: "hammer", x: 3, y: 0, z: 4 }],
  hearts: [
    { id: "sanctuary-entry", x: -7.5, y: 0, z: 5 },
    { id: "sanctuary-middle", x: 7.5, y: 0, z: -8 },
    { id: "sanctuary-rear", x: -7.5, y: 0, z: -24 },
    { id: "sanctuary-altar", x: 7.5, y: 0, z: -36 },
    { id: "sanctuary-gallery", x: 17, y: 0, z: -66 },
    { id: "sanctuary-apse", x: -17, y: 0, z: -88 }
  ],
  artifacts: [
    { id: "owl-offering", model: "lekythos", secret: "west-vault", title: "La ofrenda oculta", points: 250,
      x: -14, y: 0, z: -6, text: "Tras la pared agrietada aparece una ofrenda intacta. Una lechuza grabada en su base coincide con la marca del sello que busca Platon. Has descubierto la primera camara secreta." },
    { id: "keeper-tablet", model: "stele", secret: "east-vault", title: "La tablilla del guardian", points: 350,
      x: 14, y: 0, z: -23, text: "Una tablilla estaba escondida en esta camara. Su mensaje advierte: la guardiana conserva el sello en el fondo del santuario. Un tesoro que recompensa a quienes exploran mas alla del camino principal." },
    { id: "athena-seal", model: "seal", questItem: true, title: "El Sello de Atenea", points: 200,
      x: 0, y: 0, z: -97, text: "Medusa ya no protege el altar. Recuperaste el sello que Platon necesita para abrir el paso al cementerio. Regresa a la entrada y entregaselo." }
  ]
};

export function questDialogue(stage) {
  return stage === "returning"
    ? { speaker: "Platon", title: "El sello ha regresado", action: "Entregar sello",
      text: "Lo has encontrado, Neonboy. Con este sello podemos abrir el paso al cementerio. Hay algo mas alla que no debe despertar. Llevate tus armas; todavia las vas a necesitar." }
    : { speaker: "Platon", title: "Una peticion en la oscuridad", action: "Aceptar mision",
      text: "Neonboy, necesito el Sello de Atenea que reposa al fondo de este santuario. Medusa lo custodia al fondo de la segunda nave, los hoplitas vigilan sus pasillos y la galeria elevada. Algunas estatuas atacan a quien se acerca. Busca el martillo junto a las primeras columnas: las paredes agrietadas esconden tesoros. Recupera el sello y vuelve conmigo." };
}
