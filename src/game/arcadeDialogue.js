import { normalizeArcadeProgress } from "./arcadeProgress.js";

export const ARCADE_NPCS = [
  { id: "pixel", name: "Pixel", role: "Encargado del Arcade", avatar: "PX",
    model: new URL("../assets/neonboy-animaciones/arcade/pixel.glb", import.meta.url).href,
    clip: "Long_Breathe_and_Look_Around", fitHeight: 1.85 },
  { id: "nico", name: "Nico", role: "Campeón de los fichines", avatar: "NC",
    model: new URL("../assets/neonboy-animaciones/arcade/nico.glb", import.meta.url).href,
    clip: "Angry_Ground_Stomp_1", fitHeight: 1.82 },
  { id: "vicky", name: "Vicky", role: "Jugadora misteriosa", avatar: "VK",
    model: new URL("../assets/neonboy-animaciones/arcade/vicky.glb", import.meta.url).href,
    clip: "Confused_Scratch", fitHeight: 1.79 },
];

const LINES = {
  pixel: {
    first: [
      ["PIXEL", "¡Bienvenido al Arcade 1999! Acá todavía se juega con fichas, no con esas maquinitas modernas."],
      ["NEONBOY", "¿Y qué máquinas tenés?"],
      ["PIXEL", "De todo. Carreras, peleas, naves espaciales... Si tenés reflejos, acá los podés poner a prueba."],
      ["NEONBOY", "¿Y si soy malo jugando?"], ["PIXEL", "¡Entonces vas a gastar muchas fichas!"],
    ],
    arcade: [["NEONBOY", "¿Hace mucho que tenés este lugar?"], ["PIXEL", "Lo suficiente para haber visto gente gastar la paga de toda la semana intentando superar un récord."], ["NEONBOY", "¡Eso es dedicación!"], ["PIXEL", "Eso decía yo. Los padres decían otra cosa."]],
    orbit: [["NEONBOY", "¿Qué onda la máquina ORBIT DUEL?"], ["PIXEL", "Un clásico del salón. Tenés que esquivar enemigos, disparar y sobrevivir."], ["NEONBOY", "¿Es difícil?"], ["PIXEL", "Al principio no. Después empiezan a aparecer enemigos por todos lados."]],
    recommendations: [["NEONBOY", "Che, Pixel, \u00bfqu\u00e9 otros juegos me recomend\u00e1s?"], ["PIXEL", "Prob\u00e1 Pixel Sprint si te gustan las plataformas. Si quer\u00e9s repartir golpes, ten\u00e9s Barrio Brawl."], ["NEONBOY", "\u00bfY Jungle Pulse?"], ["PIXEL", "\u00c9se es para los que tienen ritmo. A ver si sos tan bueno con los botones como con la guitarra."]],
    sprintWin: [["PIXEL", "Terminaste PIXEL SPRINT. Nada mal para un guitarrista."], ["NEONBOY", "Todav\u00eda me quedan reflejos para otro nivel."]],
    afterVision: [["NEONBOY", "¿Viste lo que pasó?"], ["PIXEL", "La máquina emitió una luz rarísima... y después te quedaste congelado unos segundos."]],
    frequency: [["NEONBOY", "Che, Pixel... ¿de dónde salió esa máquina del fondo?"], ["PIXEL", "¿Cuál?"], ["NEONBOY", "FREQUENCY 09."], ["PIXEL", "Ah... esa."], ["NEONBOY", "¿Qué pasa?"], ["PIXEL", "No recuerdo haberla instalado. Y últimamente se prende sola."], ["NEONBOY", "¡Eso no es normal!"], ["PIXEL", "Decímelo a mí. Encima no encuentro dónde está enchufada."]],
  },
  nico: {
    first: [["NICO", "¡Ehhh! ¿Venís a jugar o a mirar?"], ["NEONBOY", "Estoy viendo las máquinas."], ["NICO", "Bueno, fijate ORBIT DUEL. El récord es mío."], ["NEONBOY", "¿Y si te lo gano?"], ["NICO", "¡JA! Primero aprendé a mover la nave."]],
    challenge: [["NEONBOY", "¿Qué pasa si supero tu récord?"], ["NICO", "Te voy a reconocer como el nuevo campeón del Arcade."], ["NEONBOY", "¿Y gano algo?"], ["NICO", "¡La gloria! ¿Te parece poco?"]],
    win: [["NICO", "¡No puede ser! ¿Cuánto practicaste?"], ["NEONBOY", "¡Talento natural!"], ["NICO", "Una partida más. Esto no queda así."]],
    brawl: [["NEONBOY", "\u00bfTambi\u00e9n sos bueno en Barrio Brawl?"], ["NICO", "Soy bueno en todos los juegos de este sal\u00f3n."], ["NEONBOY", "\u00a1Qu\u00e9 modesto!"], ["NICO", "Cuando me ganes, hablamos."]],
    brawlWin: [["NICO", "Me ganaste en Barrio Brawl. Quiero la revancha."], ["NEONBOY", "Cuando quieras."]],
    afterVision: [["NICO", "Por un momento pensé que se había cortado la luz otra vez."], ["NEONBOY", "Ojalá hubiera sido solamente eso."]],
    loss: [["NICO", "Te dije que no era fácil."], ["NEONBOY", "¡La máquina está arreglada!"], ["NICO", "Jajaja, sí, claro. Siempre dicen lo mismo."]],
  },
  vicky: {
    first: [["VICKY", "¿Viste la máquina que está al fondo?"], ["NEONBOY", "¿Cuál?"], ["VICKY", "La que tiene el número nueve."], ["NEONBOY", "Sí. ¿Qué tiene?"], ["VICKY", "Ayer estaba contra otra pared."], ["NEONBOY", "¿La movieron?"], ["VICKY", "Eso pensé... hasta que Pixel me dijo que nadie la había tocado."]],
    games: [["NEONBOY", "¿Cuál es tu máquina favorita?"], ["VICKY", "Las de lucha. Aunque también me gustan las de naves."], ["NEONBOY", "¡Yo prefiero tocar la guitarra!"], ["VICKY", "Bueno, acá las guitarras no te van a salvar de perder una partida."]],
    rhythm: [["NEONBOY", "\u00bfCu\u00e1l es tu favorito?"], ["VICKY", "Jungle Pulse. Hay que tener precisi\u00f3n."], ["NEONBOY", "\u00a1Yo soy m\u00fasico!"], ["VICKY", "Entonces no ten\u00e9s excusa para equivocarte."]],
    rhythmWin: [["VICKY", "Ese puntaje en Jungle Pulse s\u00ed que tiene ritmo."], ["NEONBOY", "Los dedos ya ven\u00edan entrenados."]],
    afterVision: [["NEONBOY", "¿Qué viste en la pantalla?"], ["VICKY", "Te juro que mostró algo... como si fuera otro lugar."], ["NEONBOY", "Yo también lo vi."]],
    strange: [["NEONBOY", "¿Notaste algo raro últimamente?"], ["VICKY", "Algunas pantallas muestran imágenes que no pertenecen a los juegos."], ["NEONBOY", "¿Qué clase de imágenes?"], ["VICKY", "No sé. Duran muy poco. Como si alguien estuviera cambiando la señal."]],
  },
};

export function getArcadeDialogueNode(npcId, nodeId, progress, anomalySeen) {
  if (!LINES[npcId]) return null;
  const current = normalizeArcadeProgress(progress);
  const topic = nodeId === "greeting" ? (current.met.includes(npcId) ? "menu" : "first") : nodeId;
  const options = npcId === "pixel" ? [
    { id: "arcade", label: "¿Hace mucho que tenés este lugar?" },
    { id: "orbit", label: "¿Qué onda ORBIT DUEL?" },
    { id: "recommendations", label: "\u00bfQu\u00e9 otros juegos me recomend\u00e1s?" },
    ...(current.frequency09EventSeen ? [{ id: "afterVision", label: "¿Viste lo que pasó con FREQUENCY 09?" }] : []),
    ...(current.records.pixel.wins ? [{ id: "sprintWin", label: "Termin\u00e9 PIXEL SPRINT" }] : []),
    ...(anomalySeen ? [{ id: "frequency", label: "¿De dónde salió FREQUENCY 09?" }] : []),
  ] : npcId === "nico" ? [
    ...(current.frequency09EventSeen ? [{ id: "afterVision", label: "La máquina se encendió sola..." }] : []),
    { id: "brawl", label: "¿También sos bueno en Barrio Brawl?" },
    ...(current.records.brawl.wins ? [{ id: "brawlWin", label: "Te gané en Barrio Brawl" }] : []),
    { id: "challenge", label: "¿Qué pasa si supero tu récord?" },
    ...(current.gamesPlayed && !current.beatNico ? [{ id: "loss", label: "No me fue bien en ORBIT DUEL..." }] : []),
    ...(current.beatNico ? [{ id: "win", label: "¡Superé tu récord!" }] : []),
  ] : [
    ...(current.frequency09EventSeen ? [{ id: "afterVision", label: "¿Qué viste en FREQUENCY 09?" }] : []),
    { id: "rhythm", label: "¿Cuál es tu favorito en el Arcade?" },
    ...(current.records.jungle.bestAccuracy >= 85 ? [{ id: "rhythmWin", label: "Hice un gran puntaje en Jungle Pulse" }] : []),
    { id: "games", label: "¿Cuál es tu máquina favorita?" },
    { id: "strange", label: "¿Notaste algo raro últimamente?" },
  ];
  if (topic === "menu") return { id: "menu", kicker: "ARCADE 1999 · ELEGÍ UN TEMA", lines: [], options: [...options, { id: "close", label: "Hasta luego." }] };
  const lines = LINES[npcId][topic] || LINES[npcId].first;
  return { id: topic, kicker: "ARCADE 1999 · 1999", lines: lines.map(([speaker, text]) => ({ speaker, text })),
    options: topic === "first" ? [{ id: "menu", label: "Seguir charlando" }, { id: "close", label: "Nos vemos." }]
      : [{ id: "menu", label: "Preguntar otra cosa" }, { id: "close", label: "Nos vemos." }] };
}

export function chooseArcadeDialogue(npcId, _nodeId, optionId) {
  if (optionId === "close") return { nodeId: "close" };
  return { nodeId: optionId in (LINES[npcId] || {}) || optionId === "menu" ? optionId : "menu" };
}
