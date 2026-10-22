export const RIKY_SAVE_KEY = "neonboy.universe.riky.v1";

const TOPICS = ["guitar", "matrix", "time", "conspiracy", "paranormal", "band"];

export const INITIAL_RIKY_PROGRESS = Object.freeze({
  met: false,
  topics: [],
  signalKnown: false,
  rikyFrequencyClueKnown: false,
  postShowSeen: false,
});

export function normalizeRikyProgress(value) {
  return {
    met: value?.met === true,
    topics: TOPICS.filter((topic) => Array.isArray(value?.topics) && value.topics.includes(topic)),
    signalKnown: value?.signalKnown === true,
    rikyFrequencyClueKnown: value?.rikyFrequencyClueKnown === true,
    postShowSeen: value?.postShowSeen === true,
  };
}

export function loadRikyProgress(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(RIKY_SAVE_KEY) || "null");
    return normalizeRikyProgress(saved?.version === 1 ? saved.progress : null);
  } catch { return normalizeRikyProgress(null); }
}

export function saveRikyProgress(progress, storage = globalThis.localStorage) {
  try {
    storage.setItem(RIKY_SAVE_KEY, JSON.stringify({ version: 1, progress: normalizeRikyProgress(progress) }));
    return true;
  } catch { return false; }
}

export function canDiscoverRikyClue(progress, masterTape) {
  return masterTape?.phase === "complete" &&
    (progress.topics.includes("time") || progress.topics.includes("paranormal"));
}

export function advanceRikyProgress(value, event, masterTape, clubQuest) {
  const progress = normalizeRikyProgress(value);
  if (event === "meet") return { ...progress, met: true };
  if (event?.startsWith("discuss:")) {
    const topic = event.slice("discuss:".length);
    if (TOPICS.includes(topic) && !progress.topics.includes(topic))
      return { ...progress, topics: [...progress.topics, topic] };
  }
  if (event === "signal" && masterTape?.phase === "complete")
    return { ...progress, signalKnown: true };
  if (event === "clue" && canDiscoverRikyClue(progress, masterTape))
    return { ...progress, rikyFrequencyClueKnown: true };
  if (event === "postShow" && clubQuest?.anomalySeen === true)
    return { ...progress, postShowSeen: true };
  return progress;
}

const option = (id, label, next, event) => ({ id, label, next, event });
const back = option("back", "Seguir hablando", "root");
const bye = option("bye", "Terminar conversación", "close");
const lines = (pairs) => pairs.map(([speaker, text]) => ({ speaker, text }));

const conversations = {
  guitar: {
    lines: [
      ["NEONBOY", "¿Para vos quién es el guitarrista más virtuoso?"],
      ["RIKY", "Ufff... depende de qué llames virtuosismo. Steve Vai, Satriani, Malmsteen... cada uno tiene algo tremendo."],
      ["NEONBOY", "¿Y qué importa más, la velocidad o la expresión?"],
      ["RIKY", "Las dos pueden servir. Pero tocar rápido sin transmitir nada es como hablar durante una hora y no decir absolutamente nada."],
      ["NEONBOY", "Entonces mis solos de cinco minutos están bien."],
      ["RIKY", "Jajaja, no dije eso. ¡Vos siempre encontrás una excusa para meter otro solo!"],
    ],
    followup: option("guitar-limit", "¿Existe un límite para tocar la guitarra?", "guitar-limit"),
  },
  matrix: {
    lines: [
      ["NEONBOY", "Riky, ¿vos creés que vivimos en la Matrix?"],
      ["RIKY", "Es una idea fascinante. Imaginate que todo lo que vemos fuera información procesada por algún sistema."],
      ["NEONBOY", "¿Y quién programó todo esto?"],
      ["RIKY", "¡Ahí está la pregunta! Si existe un programador, ¿quién programó al programador?"],
      ["NEONBOY", "Bueno, entonces estamos complicados."],
      ["RIKY", "Especialmente si el sistema tiene los mismos bugs que tu computadora."],
    ],
    followup: option("matrix-exit", "¿Y cómo saldríamos de una simulación?", "matrix-exit"),
  },
  time: {
    lines: [
      ["NEONBOY", "¿Vos pensás que se puede viajar en el tiempo?"],
      ["RIKY", "Viajar hacia el futuro, en cierto sentido, ya forma parte de la física. La relatividad nos muestra que el tiempo no transcurre igual para todos."],
      ["NEONBOY", "¿Y volver al pasado?"],
      ["RIKY", "Ahí entramos en terreno mucho más especulativo. Hay ideas teóricas, pero no sabemos hacerlo."],
      ["NEONBOY", "Yo volvería a los 90 para comprar guitarras baratas."],
      ["RIKY", "¡Jajaja! ¿Tenés una máquina del tiempo y la querés usar para comprar una Stratocaster?"],
      ["NEONBOY", "¡Varias Stratocaster!"],
    ],
    followup: option("time-nonlinear", "¿Y si el tiempo no fuera lineal?", "time-nonlinear"),
  },
  conspiracy: {
    lines: [
      ["NEONBOY", "Che, Riky, ¿qué teoría de conspiración te parece más interesante?"],
      ["RIKY", "Me interesan las historias sobre proyectos secretos, tecnología que parecía imposible y todas esas cosas que la gente intenta explicar."],
      ["NEONBOY", "¿Y vos te creés todas?"],
      ["RIKY", "¡No! Una cosa es hacerse preguntas y otra muy distinta es creer cualquier cosa sin pruebas."],
      ["NEONBOY", "Eso te lo voy a recordar la próxima vez que me mandes veinte videos a las tres de la mañana."],
      ["RIKY", "Jajaja, ¡pero mirá que algunos son interesantes!"],
    ],
    followup: option("conspiracy-proof", "¿Y si alguien ocultara algo importante?", "conspiracy-proof"),
  },
  paranormal: {
    lines: [
      ["NEONBOY", "¿Vos creés que existen cosas que todavía no podemos explicar?"],
      ["RIKY", "Seguro hay fenómenos que no entendemos del todo. Pero que algo sea extraño no significa automáticamente que sea sobrenatural."],
      ["NEONBOY", "¿Y si escuchás una voz en una grabación donde nadie habló?"],
      ["RIKY", "Primero revisaría las pistas, los efectos, las interferencias... y después vería qué queda sin explicar."],
      ["NEONBOY", "¡Eso es exactamente lo que nos pasó en el estudio!"],
      ["RIKY", "¿En serio? Contame."],
    ],
  },
  band: {
    lines: [
      ["NEONBOY", "¿Te vas a quedar a escuchar a 9th Revelation?"],
      ["RIKY", "¡Obvio! Quiero escuchar cómo suenan esas guitarras en vivo."],
      ["NEONBOY", "Tenemos a Lilith-9 cantando, John Zool en la segunda guitarra, Revenant en el bajo y Luján en la batería."],
      ["RIKY", "Jajaja, ¡tenés una banda bastante particular!"],
      ["NEONBOY", "¿Qué tiene de raro?"],
      ["RIKY", "Nada, nada... solamente que tu baterista es una perrita espacial y el bajista parece que volvió del cementerio."],
      ["NEONBOY", "¡Pero tocan bárbaro!"],
      ["RIKY", "Entonces que arranque el show."],
    ],
  },
};

const followupTopics = {
  "guitar-limit": "guitar", "matrix-exit": "matrix",
  "time-nonlinear": "time", "conspiracy-proof": "conspiracy",
  "paranormal-signal": "paranormal",
};

const followups = {
  "guitar-limit": [
    ["NEONBOY", "¿Pensás que existe un límite para tocar la guitarra?"],
    ["RIKY", "El límite físico existe, pero musicalmente siempre podés encontrar otra forma de expresarte."],
    ["NEONBOY", "¿Y si practicamos hasta tocar mil notas por segundo?"],
    ["RIKY", "Primero tratemos de tocar las primeras cien bien."],
  ],
  "matrix-exit": [
    ["NEONBOY", "¿Y cómo saldríamos de una simulación?"],
    ["RIKY", "Primero habría que encontrar algo que no encaje con las reglas."],
    ["NEONBOY", "¿Como encontrar mis discos del futuro en una tienda de 1999?"],
    ["RIKY", "...Eso, por ejemplo, es bastante raro."],
  ],
  "time-nonlinear": [
    ["NEONBOY", "¿Y si el tiempo no fuera lineal?"],
    ["RIKY", "Sería interesante pensar que pasado, presente y futuro están relacionados de una manera que todavía no comprendemos completamente."],
    ["NEONBOY", "Entonces capaz que mis canciones ya existen antes de que las componga."],
    ["RIKY", "Como idea para una historia de ciencia ficción, es espectacular."],
  ],
  "conspiracy-proof": [
    ["NEONBOY", "¿Y si alguien estuviera ocultando algo importante?"],
    ["RIKY", "Podría pasar, pero habría que encontrar evidencias reales. Si no, cualquier historia parece posible."],
    ["NEONBOY", "¿Y si encontramos una grabación que todavía no se hizo?"],
    ["RIKY", "Bueno... en este universo eso ya sería una pista bastante importante."],
  ],
  "paranormal-signal": [
    ["NEONBOY", "Hugo encontró una señal extraña cuando revisábamos una grabación."],
    ["RIKY", "Entonces prestale atención. Capaz es solamente una interferencia... o capaz encontramos algo interesante."],
  ],
  frequency: [
    ["RIKY", "Che, NeonBoy... hay algo que me quedó dando vueltas de lo que contaste."],
    ["NEONBOY", "¿Qué cosa?"],
    ["RIKY", "Esa grabación que apareció fuera de su tiempo. ¿Y si la señal fuera la clave del misterio?"],
    ["NEONBOY", "¿Una señal de dónde?"],
    ["RIKY", "No tengo idea. Pero yo compararía lo que aparece en los discos con lo que sale en las pantallas."],
    ["NEONBOY", "¿Y si encontramos algo?"],
    ["RIKY", "Ahí recién empezamos a investigar."],
  ],
  "post-show": [
    ["NEONBOY", "Riky, ¿viste lo que pasó con las luces?"],
    ["RIKY", "Sí, pero las luces no son lo que me preocupa."],
    ["NEONBOY", "¿Entonces?"],
    ["RIKY", "Por un momento escuché una frecuencia muy extraña. No parecía parte de la canción."],
    ["NEONBOY", "¿Pensás que fue una interferencia?"],
    ["RIKY", "Puede ser. Pero me hizo acordar a nuestras charlas sobre el tiempo y las simulaciones."],
    ["NEONBOY", "¿La Matrix otra vez?"],
    ["RIKY", "Jajaja, no estoy diciendo que vivamos en una simulación. Digo que algo no encaja."],
    ["NEONBOY", "¿Y qué hacemos?"],
    ["RIKY", "Yo revisaría la consola. Quizás quedó alguna pista."],
  ],
  "arcade-hint": [
    ["NEONBOY", "Esto parece una secuencia digital... ¿Dónde más podría encontrar algo así en 1999?"],
    ["RIKY", "¿Te acordás de las máquinas recreativas? Algunas tienen sonidos y patrones bastante particulares."],
    ["NEONBOY", "¿Decís que revise el Arcade?"],
    ["RIKY", "Es una posibilidad. Pero primero guardemos lo que encontramos."],
  ],
};

function rootOptions(progress, masterTape, clubQuest) {
  return [
    option("guitar", "Música y guitarristas", "guitar", "discuss:guitar"),
    option("matrix", "Matrix y realidad", "matrix", "discuss:matrix"),
    option("time", "Tiempo y espacio", "time", "discuss:time"),
    option("conspiracy", "Conspiraciones", "conspiracy", "discuss:conspiracy"),
    option("paranormal", "Fenómenos paranormales", "paranormal", "discuss:paranormal"),
    option("band", "9th Revelation", "band", "discuss:band"),
    ...(canDiscoverRikyClue(progress, masterTape)
      ? [option("frequency", "La frecuencia perdida", "frequency", progress.rikyFrequencyClueKnown ? undefined : "clue")] : []),
    ...(clubQuest?.anomalySeen === true
      ? [option("post-show", "¿Viste lo que pasó durante el recital?", "post-show", "postShow")] : []),
    ...(clubQuest?.arcadeClueKnown === true
      ? [option("arcade-hint", "La señal digital de la consola", "arcade-hint")] : []),
    bye,
  ];
}

export function getRikyDialogueNode(nodeId, value, masterTape, clubQuest) {
  const progress = normalizeRikyProgress(value);
  if (nodeId === "greeting" || nodeId === "root") return {
    id: nodeId,
    kicker: "RIKY · AMIGOS, GUITARRAS Y MISTERIOS",
    ...(nodeId === "greeting" && !progress.met ? {
      lines: lines([
        ["RIKY", "¡Ehhh, NeonBoy! Justo estaba pensando en una cosa... ¿y si todo esto fuera una simulación?"],
        ["NEONBOY", "¡No empezamos a hablar y ya estamos con la Matrix!"],
        ["RIKY", "Jajaja, bueno, pero pensalo un segundo... ¿cómo sabés que esto es real?"],
      ]),
    } : { text: progress.topics.length % 2
      ? "Justo estaba pensando en algo... pero mejor no te digo, porque terminamos hablando tres horas."
      : "¡Ehhh, NeonBoy! ¿Seguimos con las guitarras o hoy toca hablar del universo?" }),
    options: rootOptions(progress, masterTape, clubQuest),
  };
  const conversation = conversations[nodeId];
  if (conversation) return {
    id: nodeId, kicker: "CHARLA CON RIKY",
    lines: lines(conversation.lines),
    options: [
      ...(progress.topics.includes(nodeId) && conversation.followup ? [conversation.followup] : []),
      ...(nodeId === "paranormal" && masterTape?.phase === "complete"
        ? [option("paranormal-signal", "Hugo encontró una señal extraña en una grabación.", "paranormal-signal", "signal")] : []),
      back, bye,
    ],
  };
  if (followups[nodeId]) {
    if (followupTopics[nodeId] && !progress.topics.includes(followupTopics[nodeId])) return null;
    if (nodeId === "paranormal-signal" && masterTape?.phase !== "complete") return null;
    if (nodeId === "frequency" && !canDiscoverRikyClue(progress, masterTape)) return null;
    if (nodeId === "post-show" && clubQuest?.anomalySeen !== true) return null;
    if (nodeId === "arcade-hint" && clubQuest?.arcadeClueKnown !== true) return null;
    return { id: nodeId, kicker: nodeId === "frequency"
      ? (progress.rikyFrequencyClueKnown ? "PISTA · LA FRECUENCIA PERDIDA" : "NUEVA PISTA DESCUBIERTA")
      : "CHARLA CON RIKY",
      lines: lines(followups[nodeId]), options: [back, bye] };
  }
  return null;
}

export function chooseRikyDialogue(nodeId, optionId, value, masterTape, clubQuest) {
  const node = getRikyDialogueNode(nodeId, value, masterTape, clubQuest);
  const chosen = node?.options.find((entry) => entry.id === optionId);
  return chosen ? { nodeId: chosen.next, rikyEvent: chosen.event } : { nodeId };
}
