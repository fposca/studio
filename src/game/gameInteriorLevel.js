// Shared by the render scene and Rapier so chambers and doors remain aligned.
export const INTERIOR_COLUMNS = [8, 0, -8, -16, -24, -32].flatMap((z) => [-5.8, 5.8].map((x) => [x, z]));
export const INTERIOR_TORCHES = [11, -3, -17, -31].flatMap((z) => [-7.2, 7.2].map((x) => [x, z]));
export const SECRET_DOORS = [
  { id: "west-vault", x: -9, y: 0, z: -6, width: 0.5, height: 5.8, depth: 2.6 },
  { id: "east-vault", x: 9, y: 0, z: -23, width: 0.5, height: 5.8, depth: 2.6 }
];
export const INTERIOR_OBSTACLES = SECRET_DOORS.flatMap(({ x, z }) => [
  [Math.sign(x) * 12.9, 4, z - 4, 7.8, 8, 0.5],
  [Math.sign(x) * 12.9, 4, z + 4, 7.8, 8, 0.5],
  [x, 4, z - 2.65, 0.5, 8, 2.7],
  [x, 4, z + 2.65, 0.5, 8, 2.7],
  [x, 6.9, z, 0.5, 2.2, 2.6]
]);

export const INTERIOR_LEVEL = {
  id: 2, name: "El santuario de Atenea", enemy: "hoplite", enemyHealth: 105,
  spawn: { x: 0, y: 0, z: 13 },
  quest: { npc: "Platon", x: -2, y: 0, z: 11, artifact: "athena-seal", reward: 500 },
  secretDoors: SECRET_DOORS,
  coins: [10, 5, 0, -5, -10, -15, -20, -25, -30].flatMap((z, i) =>
    [[i % 2 ? 2 : -2, 0, z], [i % 2 ? -2 : 2, 0, z - 1.5]])
    .concat([[-12, 0, -5], [-14, 0, -7], [12, 0, -22], [14, 0, -24],
      [-7.5, 0, 3], [7.5, 0, -12], [-7.5, 0, -21], [7.5, 0, -32], [-3, 0, -37], [3, 0, -37]]),
  enemies: [
    { x: 2.5, y: 0, z: -2 }, { x: -3, y: 0, z: -13 }, { x: 3.5, y: 0, z: -21 },
    { x: -7.5, y: 0, z: -30 },
    { x: -3.6, y: 0, z: -8, species: "statue", stationary: true, maxHealth: 150 },
    { x: 3.6, y: 0, z: -18, species: "statue", stationary: true, maxHealth: 150 },
    { x: 0, y: 0, z: -33, boss: true, species: "medusa", scale: 1.45, maxHealth: 420, name: "Medusa" }
  ],
  pickups: [{ weapon: "hammer", x: 3, y: 0, z: 4 }],
  hearts: [
    { id: "sanctuary-entry", x: -7.5, y: 0, z: 5 },
    { id: "sanctuary-middle", x: 7.5, y: 0, z: -8 },
    { id: "sanctuary-rear", x: -7.5, y: 0, z: -24 },
    { id: "sanctuary-altar", x: 7.5, y: 0, z: -36 }
  ],
  artifacts: [
    { id: "owl-offering", model: "lekythos", secret: "west-vault", title: "La ofrenda oculta", points: 250,
      x: -14, y: 0, z: -6, text: "Tras la pared agrietada aparece una ofrenda intacta. Una lechuza grabada en su base coincide con la marca del sello que busca Platon. Has descubierto la primera camara secreta." },
    { id: "keeper-tablet", model: "stele", secret: "east-vault", title: "La tablilla del guardian", points: 350,
      x: 14, y: 0, z: -23, text: "Una tablilla estaba escondida en esta camara. Su mensaje advierte: la guardiana conserva el sello en el fondo del santuario. Un tesoro que recompensa a quienes exploran mas alla del camino principal." },
    { id: "athena-seal", model: "seal", questItem: true, title: "El Sello de Atenea", points: 200,
      x: 0, y: 0, z: -39, text: "Medusa ya no protege el altar. Recuperaste el sello que Platon necesita para abrir el paso al cementerio. Regresa a la entrada y entregaselo." }
  ]
};

export function questDialogue(stage) {
  return stage === "returning"
    ? { speaker: "Platon", title: "El sello ha regresado", action: "Entregar sello",
      text: "Lo has encontrado, Neonboy. Con este sello podemos abrir el paso al cementerio. Hay algo mas alla que no debe despertar. Llevate tus armas; todavia las vas a necesitar." }
    : { speaker: "Platon", title: "Una peticion en la oscuridad", action: "Aceptar mision",
      text: "Neonboy, necesito el Sello de Atenea que reposa al fondo de este santuario. Medusa lo custodia, los hoplitas vigilan sus pasillos y algunas estatuas atacan a quien se acerca. Busca el martillo junto a las primeras columnas: las paredes agrietadas esconden tesoros. Recupera el sello y vuelve conmigo." };
}
