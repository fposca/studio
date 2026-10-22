import { getMasterTapeDialogueNode, masterTapeOptions } from "./masterTapeQuest.js";
export const STORE_DIALOGUE_SAVE_KEY = "neonboy.record-store.dialogue.v1";

export const STORE_NPCS = [
  { id: "tito", name: 'Tito "El Surco"', role: "Vendedor", x: -4.6, z: 10.6, yaw: Math.PI / 2, reach: 2.7, model: new URL("../assets/neonboy-animaciones/vendedor.store.glb", import.meta.url).href },
  { id: "rulo", name: 'Rulo "Distorsión"', role: "Metalero", x: 6.65, z: 0.55, yaw: -Math.PI / 2, reach: 2.7, model: new URL("../assets/neonboy-animaciones/metalero.store.glb", import.meta.url).href },
  { id: "roxy", name: "Roxy", role: "Guitarrista", x: 1.25, z: 3.2, yaw: Math.PI, reach: 2.7, model: new URL("../assets/neonboy-animaciones/mujer-quieta.store.glb", import.meta.url).href },
  { id: "freddy", name: "Freddy", role: "Visitante de Halloween", x: -8.3, z: -5.8, yaw: Math.PI / 3, reach: 2.7, model: new URL("../assets/neonboy-animaciones/freddy-quieto.store.glb", import.meta.url).href },
  { id: "jason", name: "Jason", role: "Visitante silencioso", x: 8.3, z: 4.2, yaw: -Math.PI / 2, reach: 2.7, model: new URL("../assets/neonboy-animaciones/jason-respirado.store.glb", import.meta.url).href },
  { id: "skeleton-holy", name: "Esqueleto de Holy Fire", role: "Guardián de los discos", x: -8.1, z: -10.4, yaw: Math.PI / 5, reach: 2.7, model: new URL("../assets/neonboy-animaciones/esuqeleto-bailando.store.glb", import.meta.url).href, album: "holy-fire" },
  { id: "skeleton-unholy", name: "Esqueleto de Unholy Fire", role: "Guardián de los discos", x: 8.1, z: -10.4, yaw: -Math.PI / 5, reach: 2.7, model: new URL("../assets/neonboy-animaciones/esuqeleto-bailando.store.glb", import.meta.url).href, album: "unholy-fire" }
];

export const INITIAL_STORE_PROGRESS = Object.freeze({
  vendorMet: false, metalheadMet: false, roxyMet: false, rumorKnown: false, duelUnlocked: false,
  duelStep: 0, duelCompleted: false, passwordKnown: false, archiveUnlocked: false
});

const FLAGS = Object.keys(INITIAL_STORE_PROGRESS).filter((key) => key !== "duelStep");

export function loadStoreProgress(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORE_DIALOGUE_SAVE_KEY) || "null");
    if (saved?.version !== 1 || !saved.progress) return { ...INITIAL_STORE_PROGRESS };
    const progress = { ...INITIAL_STORE_PROGRESS };
    for (const key of FLAGS) progress[key] = saved.progress[key] === true;
    progress.duelStep = Number.isInteger(saved.progress.duelStep) ? Math.max(0, Math.min(2, saved.progress.duelStep)) : 0;
    // A corrupted or hand-edited save must not skip the story gates.
    if (!progress.rumorKnown) { progress.duelUnlocked = false; progress.duelCompleted = false; progress.passwordKnown = false; progress.archiveUnlocked = false; progress.duelStep = 0; }
    if (!progress.duelUnlocked) { progress.duelCompleted = false; progress.passwordKnown = false; progress.archiveUnlocked = false; progress.duelStep = 0; }
    if (!progress.duelCompleted) { progress.passwordKnown = false; progress.archiveUnlocked = false; }
    if (!progress.passwordKnown) progress.archiveUnlocked = false;
    return progress;
  } catch { return { ...INITIAL_STORE_PROGRESS }; }
}

export function saveStoreProgress(progress, storage = globalThis.localStorage) {
  try { storage.setItem(STORE_DIALOGUE_SAVE_KEY, JSON.stringify({ version: 1, progress })); return true; }
  catch { return false; }
}

export function meetStoreNpc(progress, npcId) {
  if (npcId === "tito") return { ...progress, vendorMet: true };
  if (npcId === "rulo") return { ...progress, metalheadMet: true };
  if (npcId === "roxy") return { ...progress, roxyMet: true };
  return progress;
}

const titoTopics = {
  discs: ["¿Tenés discos de NeonBoy?", "Tengo toda la colección. Aunque todavía no entiendo cómo alguien con una máscara tan ridícula puede tocar así la guitarra."],
  owner: ["¿Y vos quién sos, el dueño?", "Soy el dueño, el empleado, el encargado de limpieza y el único que sabe dónde están los discos de verdad."],
  time: ["¿Por qué vendés mis discos si estamos en 1999?", "Pibe, este local vende música del pasado, del presente y del futuro. No preguntes demasiado, que después tengo que explicarte la paradoja temporal."],
  heavy: ["¿Cuál es el disco más pesado que tenés?", "Holy Fire. La última vez que lo puse, se cortó la luz y apareció una sombra en el depósito. Excelente disco."],
  discount: ["¿Me hacés un descuento?", "Claro. Te cobro el doble y te descuento la mitad. Oferta especial para músicos."],
  door: ["¿Qué hay detrás de esa puerta?", "El depósito de discos prohibidos. Y antes de que preguntes, no, no te voy a dar la llave. Hay un disco que nunca debió grabarse; lo guardamos desde 1999. Vos todavía no lo grabaste. Exactamente: ese es el problema."],
  metalhead: ["¿Conocés al metalero que está allá?", "Hace ocho horas que está escuchando el mismo solo de guitarra. Me parece que se le trabó el cerebro."],
  coin: ["¿Sabés dónde está la última moneda?", "Yo no toco las monedas del suelo. La última vez que levanté una, me persiguió un demonio hasta el baño."]
};

const ruloTopics = {
  music: ["¿Qué clase de música escuchás?", "Heavy metal, thrash, power, progresivo... Todo lo que tenga guitarras, doble bombo y haga llorar a los vecinos."],
  neonboy: ["¿Conocés a NeonBoy?", "Escuché algunos solos. No toca mal. Pero hasta que no lo vea tocar delante mío, no le creo nada."],
  holy: ["¿Qué opinás del disco Holy Fire?", "¿Holy Fire? ¡Ese disco casi me incendia los parlantes! Burn Lies tiene unos solos que parecen grabados por un extraterrestre."],
  mask: ["¿Qué te parece mi máscara?", "Parece que Darth Vader tuvo un hijo con un amplificador Marshall. Pero admito que tiene onda."],
  year: ["¿Cuál fue el mejor año del metal?", "1986. Y no pienso discutirlo con alguien que tiene luces de Navidad en la cara."],
  identity: ["¿Y si te digo que soy NeonBoy?", "Y yo soy el guitarrista de Iron Maiden. Dale, mostrame algo que me haga cambiar de opinión."],
  coin: ["¿Sabés dónde está la última moneda?", "Vi una moneda debajo de la rockola. Pero no pienso agacharme, que tengo los pantalones demasiado ajustados."],
  modern: ["¿Qué opinás de la música moderna?", "En mis tiempos necesitabas una guitarra, un amplificador y talento. Ahora cualquiera aprieta un botón y dice que produjo un disco."]
};

const modernAnswers = [
  ["Bueno, pero vos llevás veinte años intentando aprender el mismo solo.", "¡Es un solo muy complicado, pibe!"],
  ["La tecnología también puede ser un instrumento.", "Puede ser... pero a mí no me saques mi amplificador."],
  ["¿Y los pedales de efectos los inventó un cavernícola?", "¡No confundas tecnología con magia negra!"]
];

export const METAL_DUEL = [
  { insult: "¡Con esa máscara seguro no ves ni las cuerdas de tu guitarra!", answers: ["No necesito verlas. Ellas me tienen miedo.", "Por eso siempre toco sentado.", "¿Me prestás tus anteojos?"], correct: 0, success: "¡JA! Esa estuvo buena. Te ganaste mi respeto.", failure: "Flojo, pibe. Volvé cuando tengas un buen riff y una mejor respuesta." },
  { insult: "¡Tu guitarra suena como una licuadora poseída!", answers: ["Es que le falta aceite.", "Y aun así tiene más potencia que toda tu discografía.", "¿Tenés una licuadora para prestarme?"], correct: 1, success: "¡Bien contestado! Me estás empezando a caer bien.", failure: "Una respuesta tan débil como un amplificador de juguete." },
  { insult: "¡Yo tocaba metal antes de que vos nacieras!", answers: ["Eso explica por qué tu equipo tiene telarañas.", "¿Y todavía no aprendiste a afinar?", "¿Y cómo era el sonido en blanco y negro?"], correct: 2, success: "¡JAJA! Está bien, ganaste. Sos un verdadero metalero. La contraseña del vendedor es: El fuego nunca muere.", failure: "¿Eso es todo? Hasta mi abuela insulta mejor." }
];

const roxyQuestions = [
  { id: "visits", question: "Hola, ¿venís seguido por acá?", answer: "Sí. Hasta que llegaste vos." },
  { id: "records", question: "¿Sabías que soy NeonBoy? Tengo varios discos.", answer: "Felicitaciones. ¿Querés una medalla o que te deje de hablar?" },
  { id: "solo", question: "¿Te gustaría escuchar uno de mis solos de guitarra?", answer: "Prefiero escuchar cómo te alejás. ¡Largo!" }
];

const option = (id, label, next, effect, clubEvent) => ({ id, label, next, effect, clubEvent });
const topicOption = (npc, key, topics, effect) => option(`topic:${npc}:${key}`, topics[key][0], `reply:${npc}:${key}`, effect);

function greeting(npc, progress, context) {
  const song = context.currentSong?.toLowerCase();
  if (npc === "tito") {
    if (progress.archiveUnlocked) return "Desde que te llevaste ese disco pasan cosas raras acá. Ayer una guitarra empezó a tocar sola.";
    if (song === "holy fire" || context.currentAlbum?.toLowerCase() === "holy fire") return "Cada vez que pongo Holy Fire, las luces empiezan a parpadear. Debe ser la instalación eléctrica... espero.";
    if (context.credits >= 10) return "Así que juntaste todas las monedas. Ahora capaz podés comprar algo. Aunque los precios subieron.";
    if (progress.vendorMet) return "¿Otra vez vos? ¿No tenés un apocalipsis que detener?";
    return "Bienvenido a la última tienda de discos decente del planeta. Si venís a buscar música electrónica, la salida está detrás tuyo.";
  }
  if (progress.archiveUnlocked) return "¿Qué hiciste con el disco? Ahora escucho solos de guitarra hasta cuando duermo.";
  if (song === "burn lies") return "¡Ese solo! ¡Ese maldito solo! Llevo tres semanas intentando tocarlo.";
  if (song === "new born") return "Che... esto está bueno. No todo tiene que ser distorsión y doble bombo.";
  if (progress.duelCompleted) return "Ahí viene el de la máscara. Cuidado con este, que tiene más respuestas que solos de guitarra.";
  if (progress.metalheadMet) return "Volvió el de la máscara. Justo estaba por decir algo inteligente.";
  return "¡Eh, vos! ¿Qué hacés vestido así? ¿Te escapaste de un recital de Kiss o te explotó una computadora en la cara?";
}

function rootOptions(npc, progress, context) {
  if (npc === "tito") return [
    ...masterTapeOptions("tito", context.masterTape),
    ...(context.clubQuest?.hugoSuggestedShow ? [context.clubQuest.credentialGranted
      ? option("club:reminder", "¿Dónde encuentro a Charly?", "club:reminder")
      : option("club:credential", "Hugo dice que tengo que salir a tocar.", "club:credential", undefined, "titoGrantsCredential")] : []),
    topicOption("tito", "discs", titoTopics), topicOption("tito", "door", titoTopics, "rumor"),
    option("more", "Tengo más preguntas sobre esta tienda.", "more"), option("bye", "Terminar conversación", "close")
  ];
  return [
    topicOption("rulo", "music", ruloTopics),
    ...(progress.rumorKnown ? [option("mystery", "Tito me habló de un disco prohibido.", "mystery", "duelUnlock")] : [topicOption("rulo", "holy", ruloTopics)]),
    option("more", "Hablemos de algo más pesado.", "more"), option("bye", "Terminar conversación", "close")
  ];
}

export function getStoreDialogueNode(npc, nodeId, progress, context = {}) {
  if (!STORE_NPCS.some((entry) => entry.id === npc)) return null;
  if (npc === "tito" && nodeId.startsWith("master:")) return getMasterTapeDialogueNode(npc, nodeId, context.masterTape);
  const back = option("back", "Seguir hablando", "root");
  const bye = option("bye", "Terminar conversación", "close");
  const options = (items) => [...items, bye];
  if (npc === "jason") return null;
  if (npc === "freddy" && (nodeId === "greeting" || nodeId === "root")) return { id: nodeId, speaker: npc, text: "Freddy te mira y suelta una carcajada escalofriante.", options: [bye] };
  if (npc.startsWith("skeleton-") && (nodeId === "greeting" || nodeId === "root")) return { id: nodeId, speaker: npc, text: "Neonboy, ¿sos vos?", options: [bye] };
  if (npc === "roxy") {
    if (nodeId === "greeting" || nodeId === "root") return {
      id: nodeId, speaker: npc,
      text: progress.roxyMet ? "¿Otra vez vos? ¿No te había dicho que te fueras?" : "",
      options: [...roxyQuestions.map(({ id, question }) => option("ask:roxy:" + id, question, "reply:roxy:" + id)), bye]
    };
    if (nodeId.startsWith("reply:roxy:")) {
      const answer = roxyQuestions.find(({ id }) => nodeId === "reply:roxy:" + id);
      return answer ? { id: nodeId, speaker: npc, text: answer.answer, options: [back, bye] } : null;
    }
    return null;
  }
  if (nodeId === "greeting" || nodeId === "root") return {
    id: nodeId, speaker: npc, text: nodeId === "greeting" ? greeting(npc, progress, context) : "Bien, pibe. ¿Qué más querés saber?",
    options: rootOptions(npc, progress, context)
  };
  if (npc === "tito" && nodeId === "club:credential" && context.clubQuest?.hugoSuggestedShow) return {
    id: nodeId, kicker: "CREDENCIAL DEL CLUB DE ROCK",
    lines: [
      { speaker: "NEONBOY", text: "Hugo dice que tengo que salir a tocar." },
      { speaker: "TITO", text: "¡Y tiene razón! Ya era hora de que salieras del estudio." },
      { speaker: "NEONBOY", text: "¿Y dónde puedo tocar?" },
      { speaker: "TITO", text: "Conozco a Charly, el encargado de un boliche de rock. Decile que vas de mi parte." },
      { speaker: "NEONBOY", text: "¿Y me va a dejar entrar?" },
      { speaker: "TITO", text: "Con esta credencial, sí. Ahora, que te deje tocar... eso ya es otro problema." },
    ], options: [back, bye],
  };
  if (npc === "tito" && nodeId === "club:reminder" && context.clubQuest?.credentialGranted) return {
    id: nodeId, text: "Mostrale la credencial a Charly en el Club de Rock. Decile que vas de mi parte.",
    options: [back, bye],
  };
  if (nodeId === "more") {
    const items = npc === "tito"
      ? [topicOption(npc, "owner", titoTopics), topicOption(npc, "time", titoTopics), topicOption(npc, "heavy", titoTopics), topicOption(npc, "discount", titoTopics), topicOption(npc, "metalhead", titoTopics), topicOption(npc, "coin", titoTopics)]
      : [topicOption(npc, "neonboy", ruloTopics), topicOption(npc, "mask", ruloTopics), topicOption(npc, "year", ruloTopics), topicOption(npc, "identity", ruloTopics), topicOption(npc, "coin", ruloTopics), topicOption(npc, "modern", ruloTopics)];
    if (npc === "tito" && progress.passwordKnown && !progress.archiveUnlocked) items.unshift(option("password", "Conozco la contraseña del disco prohibido.", "password", "archive"));
    if (npc === "tito" && progress.archiveUnlocked) items.unshift(option("archive", "Quiero ver el Archivo Prohibido.", "archive"));
    if (npc === "rulo" && progress.duelUnlocked) items.unshift(option("duel", progress.duelCompleted ? "Recordemos aquel duelo de riffs." : "Te desafío a un duelo de insultos.", progress.duelCompleted ? "duelWon" : `duel:${progress.duelStep}`));
    return { id: nodeId, speaker: npc, text: npc === "tito" ? "Apurate, que estos vinilos no se ordenan solos." : "Elegí bien. No todas las preguntas merecen un solo de guitarra.", options: options([...items, back]) };
  }
  if (nodeId.startsWith(`reply:${npc}:`)) {
    const key = nodeId.slice(`reply:${npc}:`.length);
    const topic = (npc === "tito" ? titoTopics : ruloTopics)[key];
    if (!topic) return null;
    const responseOptions = key === "modern" && npc === "rulo"
      ? modernAnswers.map((answer, index) => option(`modern:${index}`, answer[0], `modernReply:${index}`))
      : [back, option("more", "Más preguntas", "more"), bye];
    return { id: nodeId, speaker: npc, text: topic[1], options: responseOptions };
  }
  if (npc === "rulo" && nodeId.startsWith("modernReply:")) {
    const answer = modernAnswers[Number(nodeId.slice(12))];
    return answer ? { id: nodeId, speaker: npc, text: answer[1], options: [back, bye] } : null;
  }
  if (npc === "rulo" && nodeId === "mystery" && progress.rumorKnown) return {
    id: nodeId, speaker: npc, text: "¡Ese disco es una leyenda! Dicen que tiene un solo tan rápido que abre portales dimensionales. Primero demostrame que sos un verdadero metalero.",
    options: [option("duel", "Acepto el duelo de insultos.", `duel:${progress.duelStep}`), back, bye]
  };
  if (npc === "rulo" && nodeId.startsWith("duel:") && progress.duelUnlocked && !progress.duelCompleted) {
    const step = Number(nodeId.slice(5));
    if (step !== progress.duelStep || !METAL_DUEL[step]) return null;
    const duel = METAL_DUEL[step];
    return { id: nodeId, speaker: npc, text: duel.insult, kicker: `DUELO DE INSULTOS · ${step + 1}/3`, options: duel.answers.map((answer, index) => option(`duelAnswer:${step}:${index}`, answer, index === duel.correct ? `duelSuccess:${step}` : `duelFailure:${step}`, index === duel.correct ? "duelCorrect" : "duelWrong")) };
  }
  if (npc === "rulo" && nodeId.startsWith("duelSuccess:")) {
    const step = Number(nodeId.slice(12));
    if (!METAL_DUEL[step]) return null;
    return { id: nodeId, speaker: npc, text: METAL_DUEL[step].success, kicker: step === 2 ? "DUELO GANADO" : "BUENA RESPUESTA", options: step === 2 ? [back, bye] : [option("next", "Seguir el duelo", `duel:${step + 1}`), bye] };
  }
  if (npc === "rulo" && nodeId.startsWith("duelFailure:")) {
    const step = Number(nodeId.slice(12));
    if (!METAL_DUEL[step]) return null;
    return { id: nodeId, speaker: npc, text: METAL_DUEL[step].failure, kicker: "OTRA OPORTUNIDAD", options: [option("retry", "Reintentar el duelo", "duel:0"), back, bye] };
  }
  if (npc === "rulo" && nodeId === "duelWon" && progress.duelCompleted) return { id: nodeId, speaker: npc, text: "Ya ganaste, pibe. La contraseña sigue siendo: El fuego nunca muere.", options: [back, bye] };
  if (npc === "tito" && nodeId === "password" && progress.passwordKnown) return { id: nodeId, speaker: npc, text: "¿Ah, sí? A ver, iluminame... ¿El fuego nunca muere? Interesante. Así que hablaste con el metalero. Está bien, te doy el disco. Pero si abrís un portal al infierno, lo limpiás vos.", kicker: "ARCHIVO DESBLOQUEADO", options: [option("archive", "Abrir el Archivo Prohibido", "archive"), back, bye] };
  if (npc === "tito" && nodeId === "archive" && progress.archiveUnlocked) return { id: nodeId, speaker: npc, text: "El Archivo Prohibido está en la tienda. Nadie dijo que fuera buena idea escucharlo.", options: [back, bye] };
  return null;
}

export function chooseStoreDialogue(npc, nodeId, optionId, progress, context = {}) {
  const node = getStoreDialogueNode(npc, nodeId, progress, context);
  const chosen = node?.options.find((entry) => entry.id === optionId);
  if (!chosen) return { nodeId, progress, changed: false };
  let next = progress;
  if (chosen.effect === "rumor" && npc === "tito") next = { ...next, rumorKnown: true };
  if (chosen.effect === "duelUnlock" && npc === "rulo" && next.rumorKnown) next = { ...next, duelUnlocked: true };
  if (chosen.effect === "duelWrong" && npc === "rulo" && next.duelUnlocked) next = { ...next, duelStep: 0 };
  if (chosen.effect === "duelCorrect" && npc === "rulo" && next.duelUnlocked && !next.duelCompleted) {
    const step = Number(optionId.split(":")[1]);
    if (step === next.duelStep) next = step === 2
      ? { ...next, duelStep: 0, duelCompleted: true, passwordKnown: true }
      : { ...next, duelStep: step + 1 };
  }
  if (chosen.effect === "archive" && npc === "tito" && next.passwordKnown && next.duelCompleted) next = { ...next, archiveUnlocked: true };
  return { nodeId: chosen.next, progress: next, changed: next !== progress, questEvent: chosen.questEvent, clubEvent: chosen.clubEvent };
}
