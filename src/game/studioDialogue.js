import { getMasterTapeDialogueNode, masterTapeOptions } from "./masterTapeQuest.js";
export const STUDIO_PROGRESS_KEY = "neonboy.recording-studio.progress.v1";

export const HUGO_NPC = {
  id: "hugo", name: "Hugo Mendez", role: "Profesor y productor musical", avatar: "HM"
};

export const STUDIO_SESSIONS = [
  { id: "wake-up", title: "Wake Up", credit: "Hugo grabó partes de guitarra, incluido un solo." },
  { id: "jesus-is-king", title: "Jesus is King", videoId: "poQC8HuC-PA", credit: "Hugo contribuyó con guitarras." },
  { id: "new-born", title: "New Born", videoId: "bPp4YoSrbmo", credit: "Hugo participó con guitarras." }
];

export const STUDIO_CHANNELS = [
  { id: "drums", title: "Batería", description: "Marca el pulso y sostiene la energía de la canción." },
  { id: "bass", title: "Bajo", description: "Conecta el ritmo con la armonía y sostiene las notas graves." },
  { id: "rhythm", title: "Guitarra rítmica", description: "Aporta acordes, riffs y una base para el arreglo." },
  { id: "lead", title: "Guitarra solista", description: "Destaca melodías y solos sin tapar los demás instrumentos." },
  { id: "voice", title: "Voz", description: "Comunica la letra y necesita un lugar claro en la mezcla." }
];

export const INITIAL_STUDIO_PROGRESS = Object.freeze({
  hugoMet: false, greetingCount: 0,
  studioComputerUnlocked: false, consoleUnlocked: false,
  computerExplored: false, consoleExplored: false, missionComplete: false,
  wakeUpInfo: false, jesusIsKingInfo: false, newBornInfo: false
});

export function loadStudioProgress(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STUDIO_PROGRESS_KEY) || "null");
    if (saved?.version !== 1 || !saved.progress) return { ...INITIAL_STUDIO_PROGRESS };
    const progress = { ...INITIAL_STUDIO_PROGRESS };
    for (const key of Object.keys(progress)) {
      if (key === "greetingCount") continue;
      progress[key] = saved.progress[key] === true;
    }
    progress.greetingCount = Number.isInteger(saved.progress.greetingCount)
      ? Math.max(0, Math.min(saved.progress.greetingCount, 100000)) : 0;
    if (!progress.studioComputerUnlocked) progress.computerExplored = false;
    if (!progress.hugoMet) progress.greetingCount = 0;
    if (!progress.computerExplored || !progress.consoleExplored) progress.missionComplete = false;
    return progress;
  } catch {
    return { ...INITIAL_STUDIO_PROGRESS };
  }
}

export function saveStudioProgress(progress, storage = globalThis.localStorage) {
  try {
    storage.setItem(STUDIO_PROGRESS_KEY, JSON.stringify({ version: 1, progress }));
    return true;
  } catch {
    return false;
  }
}

export function missionReady(progress) {
  return progress.studioComputerUnlocked && progress.computerExplored &&
    progress.consoleExplored && !progress.missionComplete;
}

const options = [
  { id: "studio", label: "¿Qué estás haciendo con mis canciones?", next: "studio" },
  { id: "wake-up", label: "¿Te acordás del solo que grabaste en Wake Up?", next: "wake-up", effect: "wakeUpInfo" },
  { id: "jesus-is-king", label: "¿Qué te pareció trabajar en Jesus is King?", next: "jesus-is-king", effect: "jesusIsKingInfo" },
  { id: "new-born", label: "¿Y qué te acordás de New Born?", next: "new-born", effect: "newBornInfo" },
  { id: "blues", label: "¿Qué preferís, blues o heavy metal?", next: "blues" },
  { id: "guitar", label: "¿Cuál es el secreto para tocar mejor?", next: "guitar" },
  { id: "hugo-records", label: "Hugo, ¿y vos no tenés discos propios?", next: "hugo-records" },
  { id: "hugo-cosmos", label: "¿Qué es El ternero, la vaca y el cosmos?", next: "hugo-cosmos" },
  { id: "hugo-more", label: "¿Dónde puedo escuchar más de tu música?", next: "hugo-more" },
  { id: "computer", label: "¿Puedo ver las sesiones en la computadora?", next: "computer", effect: "studioComputerUnlocked" },
  { id: "console", label: "¿Y si quiero escuchar cada instrumento por separado?", next: "console", effect: "consoleUnlocked" }
];

const topics = {
  studio: [
    ["NEONBOY", "¿Qué estás haciendo con mis canciones?"],
    ["HUGO", "Estoy trabajando en las pistas. Hay que editar, ordenar los instrumentos, equilibrar los volúmenes y encontrarle su lugar a cada sonido."],
    ["NEONBOY", "¿Y después?"],
    ["HUGO", "Después viene la masterización. La idea es que todo el trabajo que hiciste termine sonando como corresponde."]
  ],
  "wake-up": [
    ["NEONBOY", "¿Te acordás del solo que grabaste en Wake Up?"],
    ["HUGO", "¡Cómo no me voy a acordar! Metí unas guitarras ahí, incluido un solo. Ese tema tiene momentos muy interesantes."],
    ["NEONBOY", "Quedó buenísimo."],
    ["HUGO", "Cuando las ideas funcionan, hay que aprovecharlas. Cada guitarra tiene que aportar algo a la canción."]
  ],
  "jesus-is-king": [
    ["NEONBOY", "¿Qué te pareció trabajar en Jesus is King?"],
    ["HUGO", "Fue otro de los temas donde pude aportar guitarras. Está bueno trabajar con músicas distintas y buscar qué necesita cada canción."],
    ["NEONBOY", "¿Aunque sea heavy?"],
    ["HUGO", "¡Claro! El blues es lo mío, pero una buena guitarra es una buena guitarra."]
  ],
  "new-born": [
    ["NEONBOY", "¿Y qué te acordás de New Born?"],
    ["HUGO", "También participé con guitarras. Es otra de esas canciones donde lo importante es acompañar la idea y que cada parte tenga su lugar."],
    ["NEONBOY", "Es un tema bastante especial para mí."],
    ["HUGO", "Entonces hay que cuidar la interpretación y los detalles. Eso también se transmite cuando alguien escucha la canción."]
  ],
  blues: [
    ["NEONBOY", "¿Qué preferís, blues o heavy metal?"],
    ["HUGO", "Vos ya sabés que lo mío es el blues."],
    ["NEONBOY", "¡Pero te hago grabar heavy igual!"],
    ["HUGO", "¡Y bueno! Me traés cada cosa... Pero mientras haya buenas guitarras, estamos bien."]
  ],
  guitar: [
    ["NEONBOY", "¿Cuál es el secreto para tocar mejor?"],
    ["HUGO", "No hay secretos mágicos. Escuchar, practicar, tener paciencia y aprender a decir algo con el instrumento."],
    ["NEONBOY", "¿No alcanza con tocar quinientas notas por segundo?"],
    ["HUGO", "Podés tocar quinientas, pero si ninguna dice nada, estamos complicados."]
  ],
  "hugo-records": [
    ["NEONBOY", "Hugo, ¿y vos no tenés discos propios?"],
    ["HUGO", "¡Claro que tengo! ¿O te pensás que solamente me dedico a arreglar tus guitarras? Fijate en los cuadros, ahí tenés parte de mi historia."]
  ],
  "hugo-cosmos": [
    ["NEONBOY", "¿Qué es El ternero, la vaca y el cosmos?"],
    ["HUGO", "Es un disco mío de trece temas. Acercate a la computadora y escuchalo. Después me contás qué te parece."]
  ],
  "hugo-more": [
    ["NEONBOY", "¿Dónde puedo escuchar más de tu música?"],
    ["HUGO", "En la computadora tenés mis grabaciones. Y si te gustan, también podés buscarme en mis plataformas."]
  ],
  computer: [
    ["NEONBOY", "¿Puedo ver las sesiones en la computadora?"],
    ["HUGO", "Sí, acercate. Ahí podemos organizar las pistas y ver cómo está armado un tema."],
    ["NEONBOY", "¿Y puedo tocar algo?"],
    ["HUGO", "¡Con cuidado! No me vayas a borrar la sesión."]
  ],
  console: [
    ["NEONBOY", "¿Y si quiero escuchar cada instrumento por separado?"],
    ["HUGO", "Para eso está la consola. Podemos escuchar las pistas individuales y entender qué aporta cada instrumento."],
    ["NEONBOY", "¿Hasta los solos?"],
    ["HUGO", "Especialmente los solos, que sé que te gustan."]
  ],
  farewell: [
    ["NEONBOY", "Bueno, Hugo, te dejo trabajar."],
    ["HUGO", "Dale. Y cuando tengas otra idea, traela y la escuchamos."]
  ],
  "mission-complete": [
    ["NEONBOY", "Ahora entiendo mejor todo lo que pasa después de grabar las guitarras."],
    ["HUGO", "Claro. Grabar es una parte. Después hay que darle forma a todo para que la canción funcione."]
  ]
};

const followupGreetings = [
  "¿Cómo andás? ¿Trajiste algo nuevo?",
  "Estaba revisando unas guitarras. ¿Qué necesitás?",
  "¿Venís a escuchar cómo quedó la mezcla?",
  "Sentate y escuchamos un poco."
];
const option = (id, label, next, effect, clubEvent) => ({ id, label, next, effect, clubEvent });
const back = option("back", "Seguir preguntando", "root");
const bye = option("bye", "Terminar conversación", "farewell");

export function getStudioDialogueNode(nodeId, progress, masterTape, clubQuest = {}) {
  if (nodeId.startsWith("master:")) return getMasterTapeDialogueNode("hugo", nodeId, masterTape);
  if (nodeId === "greeting" || nodeId === "root") {
    return {
      id: nodeId, kicker: "HUGO MENDEZ · ESTUDIO 1999",
      text: nodeId === "root" ? "Dale, veamos qué necesitás." :
        progress.hugoMet ? followupGreetings[(Math.max(1, progress.greetingCount) - 1) % followupGreetings.length] :
          "¡Eh, apareciste! Justo estaba escuchando las pistas que me trajiste. Hay buenas ideas acá... vamos a ver cómo hacemos para que suenen todavía mejor.",
      options: [
        ...(missionReady(progress) ? [option("complete", "Contarle a Hugo lo que aprendí", "mission-complete")] : []),
        ...(masterTape?.phase === "complete" ? [clubQuest.hugoSuggestedShow
          ? option("club:reminder", "¿Dónde podía tocar en vivo?", "club:reminder")
          : option("club:show", "¿Y ahora qué hacemos con el máster?", "club:show", undefined, "hugoSuggestsShow")] : []),
        ...masterTapeOptions("hugo", masterTape), ...options, bye
      ]
    };
  }
  if (nodeId === "club:show" && masterTape?.phase === "complete") return {
    id: nodeId, kicker: "LA CREDENCIAL DEL SHOW",
    lines: [
      { speaker: "NEONBOY", text: "¿Y ahora qué hacemos con el máster?" },
      { speaker: "HUGO", text: "Bueno, la grabación ya está lista. Ahora falta que salgas a tocarla en vivo." },
      { speaker: "NEONBOY", text: "¿Y dónde querés que toque?" },
      { speaker: "HUGO", text: "Andá a hablar con Tito. Seguro conoce algún lugar donde puedas tocar." },
    ], options: [back, bye],
  };
  if (nodeId === "club:reminder" && masterTape?.phase === "complete") return {
    id: nodeId, text: "Andá a hablar con Tito. Seguro conoce algún lugar donde puedas tocar.", options: [back, bye],
  };
  if (topics[nodeId]) {
    const isFarewell = nodeId === "farewell";
    const isMission = nodeId === "mission-complete";
    return {
      id: nodeId, kicker: isMission ? "DETRÁS DE LA MEZCLA" : undefined,
      lines: topics[nodeId].map(([speaker, text]) => ({ speaker, text })),
      options: isFarewell ? [option("close", "Cerrar conversación", "close")] :
        isMission ? [option("claim", "Guardar el archivo especial", "mission-reward", "missionComplete"), back] :
          [back, bye]
    };
  }
  if (nodeId === "mission-reward" && progress.missionComplete) {
    return { id: nodeId, kicker: "MISIÓN COMPLETADA · DETRÁS DE LA MEZCLA",
      text: "Desbloqueaste «Cómo se produce la música de NeonBoy» en el archivo del estudio.",
      options: [back, bye] };
  }
  return null;
}

export function chooseStudioDialogue(nodeId, optionId, progress, masterTape, clubQuest) {
  const node = getStudioDialogueNode(nodeId, progress, masterTape, clubQuest);
  const choice = node?.options.find((entry) => entry.id === optionId);
  if (!choice) return { nodeId, progress, changed: false };
  const next = choice.effect && !progress[choice.effect] ? { ...progress, [choice.effect]: true } : progress;
  return { nodeId: choice.next, progress: next, changed: next !== progress, questEvent: choice.questEvent, clubEvent: choice.clubEvent };
}
