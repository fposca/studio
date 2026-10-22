// Friends at the club share the existing conversation UI and NPC loader.
export const ROCK_CLUB_FRIENDS = [
  { id: "diego", name: "Diego", role: "Amigo de NeonBoy", avatar: "DG", model: new URL("../assets/neonboy-animaciones/club-de-rock/diego.club.glb", import.meta.url).href, clip: "Talk_with_Hands_Open", fitHeight: 1.81 },
  { id: "maxi", name: "Maxi", role: "Baterista metalero", avatar: "MX", model: new URL("../assets/neonboy-animaciones/club-de-rock/maxi.club.glb", import.meta.url).href, clip: "Long_Breathe_and_Look_Around", fitHeight: 1.85 },
  { id: "gera", name: "Gera", role: "Amigo de NeonBoy", avatar: "GR", model: new URL("../assets/neonboy-animaciones/club-de-rock/gera.club.glb", import.meta.url).href, clip: "Talk_with_Right_Hand_Open", fitHeight: 1.79 },
  { id: "pablito", name: "Pablito", role: "Amigo de NeonBoy", avatar: "PB", model: new URL("../assets/neonboy-animaciones/club-de-rock/pablo.club.glb", import.meta.url).href, clip: "Short_Breathe_and_Look_Around", fitHeight: 1.77 },
  { id: "claudia", name: "Claudia", role: "Amiga de NeonBoy", avatar: "CL", model: new URL("../assets/neonboy-animaciones/club-de-rock/claudia.club.glb", import.meta.url).href, clip: "Long_Breathe_and_Look_Around", fitHeight: 1.75 },
].map((npc) => ({ ...npc, deferLoad: true, priorityLoad: true }));

export const FRIENDS_TABLE_NPC = {
  id: "friendsTable", name: "Los amigos", role: "Mesa de los amigos", avatar: "★",
};

const FRIEND_IDS = ROCK_CLUB_FRIENDS.map(({ id }) => id);
const TOPICS = Object.freeze({
  diego: ["music", "reggaeton", "band", "argument"],
  maxi: ["drums", "technique", "band", "soundcheck"],
  gera: ["grunge", "guitars", "club"],
  pablito: ["concert", "demons", "life"],
  claudia: ["club", "friends", "concert"],
  friendsTable: ["band", "tastes", "aliens", "demons", "stage", "anomaly"],
});
const VALID_TOPICS = new Set(Object.entries(TOPICS).flatMap(([id, topics]) => topics.map((topic) => `${id}:${topic}`)));
export const FRIENDS_SAVE_KEY = "neonboy.universe.club-friends.v1";
export const INITIAL_FRIENDS_PROGRESS = Object.freeze({
  met: [], groupMet: false, topics: [], anomalyDiscussed: false,
});

export function normalizeFriendsProgress(value) {
  return {
    met: FRIEND_IDS.filter((id) => Array.isArray(value?.met) && value.met.includes(id)),
    groupMet: value?.groupMet === true,
    topics: [...VALID_TOPICS].filter((topic) => Array.isArray(value?.topics) && value.topics.includes(topic)),
    anomalyDiscussed: value?.anomalyDiscussed === true,
  };
}

export function advanceFriendsProgress(value, event) {
  const progress = normalizeFriendsProgress(value);
  if (event === "meet:friendsTable") return { ...progress, groupMet: true };
  if (event?.startsWith("meet:")) {
    const id = event.slice(5);
    if (FRIEND_IDS.includes(id) && !progress.met.includes(id)) return { ...progress, met: [...progress.met, id] };
  }
  if (event?.startsWith("discuss:")) {
    const topic = event.slice(8);
    if (VALID_TOPICS.has(topic) && !progress.topics.includes(topic))
      return { ...progress, topics: [...progress.topics, topic], anomalyDiscussed: progress.anomalyDiscussed || topic === "friendsTable:anomaly" };
  }
  return progress;
}

export function loadFriendsProgress(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(FRIENDS_SAVE_KEY) || "null");
    return normalizeFriendsProgress(saved?.version === 1 ? saved.progress : null);
  } catch { return normalizeFriendsProgress(null); }
}

export function saveFriendsProgress(progress, storage = globalThis.localStorage) {
  try {
    storage.setItem(FRIENDS_SAVE_KEY, JSON.stringify({ version: 1, progress: normalizeFriendsProgress(progress) }));
    return true;
  } catch { return false; }
}

const lines = (pairs) => pairs.map(([speaker, text]) => ({ speaker, text }));
const option = (id, label, next = id) => ({ id, label, next });
const back = option("back", "Seguir hablando", "root");
const bye = option("bye", "Bueno, nos vemos.", "close");

const individual = {
  diego: {
    greeting: [
      ["DIEGO", "¡Mirá quién apareció! ¡La estrella del rock!"],
      ["NEONBOY", "¿Viniste a verme tocar?"],
      ["DIEGO", "No, vine porque me dijeron que había gente conocida."],
      ["NEONBOY", "¡Sos un fenómeno para dar ánimo!"],
      ["DIEGO", "Bueno, alguien tiene que decirte la verdad."],
    ],
    repeat: "Vine por los amigos. Si hay solos interminables, avisame.",
    options: [
      option("music", "Che, Diego, ¿escuchaste mi último tema?"),
      option("reggaeton", "¿Qué le encontrás al reguetón?"),
      option("band", "¿Qué opinás de mi banda?"),
      option("argument", "¿Alguna vez te va a gustar algo de lo que hago?"),
    ],
    topics: {
      music: [
        ["NEONBOY", "Che, Diego, ¿escuchaste mi último tema?"],
        ["DIEGO", "Sí. ¿Cuándo empieza la canción?"],
        ["NEONBOY", "¡Cómo que cuándo empieza!"],
        ["DIEGO", "Y... estuviste cinco minutos haciendo solos."],
        ["NEONBOY", "¡Eso es arte!"],
        ["DIEGO", "Para vos. Yo prefiero algo que se pueda bailar."],
        ["NEONBOY", "¡El metal también se puede bailar!"],
        ["DIEGO", "Sí, pero yo quiero seguir teniendo cuello mañana."],
      ],
      reggaeton: [
        ["NEONBOY", "¿Qué le encontrás al reguetón?"],
        ["DIEGO", "Que no tengo que escuchar un solo de guitarra de diez minutos."],
        ["NEONBOY", "¡Mis solos no duran diez minutos!"],
        ["DIEGO", "Tenés razón. A veces duran doce."],
      ],
      band: [
        ["NEONBOY", "¿Qué opinás de mi banda?"],
        ["DIEGO", "Tenés una cantante futurista, un guitarrista medio muerto, un bajista salido de una tumba y una perra en la batería."],
        ["NEONBOY", "¿Y?"],
        ["DIEGO", "Y vos sos el menos normal de todos."],
        ["NEONBOY", "¡Gracias por el apoyo!"],
      ],
      argument: [
        ["NEONBOY", "¿Alguna vez te va a gustar algo de lo que hago?"],
        ["DIEGO", "Puede ser."],
        ["NEONBOY", "¿En serio?"],
        ["DIEGO", "Sí. Cuando termines de hablar de eso."],
        ["NEONBOY", "¡Andá a escuchar cumbia!"],
        ["DIEGO", "¡Eso pensaba hacer!"],
      ],
    },
    farewell: "Dale, andá a tocar. Pero no te emociones con los solos.",
    postShow: [["DIEGO", "¡Cinco minutos de guitarra y encima se rompe todo!"], ["NEONBOY", "¡Diego, eso no era parte del show!"]],
  },
  maxi: {
    greeting: [["MAXI", "¡NeonBoy! ¡Tremendo escenario armaron!"], ["NEONBOY", "¡Gracias, Maxi! ¿Viste la batería?"], ["MAXI", "¡Obvio! Lo primero que miré."]],
    repeat: "Estoy atento a la batería. ¿Qué querés saber?",
    options: [
      option("drums", "¿Qué te parece el doble bombo?"),
      option("technique", "¿Qué es más difícil: tocar rápido o tocar preciso?"),
      option("band", "¿Cómo ves a 9th Revelation?"),
      option("soundcheck", "¿Podés ayudarme a revisar el sonido?"),
    ],
    topics: {
      drums: [["NEONBOY", "¿Qué te parece el doble bombo?"], ["MAXI", "Bien metalero. Ahora quiero escuchar cómo suena."], ["NEONBOY", "¡Vas a escuchar a Luján!"], ["MAXI", "¡La baterista más particular que vi en mi vida!"]],
      technique: [["NEONBOY", "¿Qué es más difícil: tocar rápido o tocar preciso?"], ["MAXI", "Rápido y mal puede tocar cualquiera. Lo difícil es mantener la precisión."], ["NEONBOY", "¡Eso también vale para la guitarra!"], ["MAXI", "Exactamente. Y para tocar todos juntos."]],
      band: [["NEONBOY", "¿Cómo ves a 9th Revelation?"], ["MAXI", "Visualmente son una locura. Quiero escuchar cómo combinan las guitarras con la batería."], ["NEONBOY", "Tenemos un montón de energía."], ["MAXI", "Bueno, guardá un poco para el recital."]],
      soundcheck: [["NEONBOY", "¿Podés ayudarme a revisar el sonido?"], ["MAXI", "Si hay un problema de ritmo o sincronización, avisame."]],
    },
    farewell: "¡Dale, nos vemos después del show!",
    postShow: [["MAXI", "¡La batería sonó tremenda! Pero ese ruido del final no vino de los bombos."]],
  },
  gera: {
    greeting: [["NEONBOY", "¡Gera! ¿Todo bien?"], ["GERA", "Todo tranquilo."], ["NEONBOY", "¿Te gusta el lugar?"], ["GERA", "Está bueno."], ["NEONBOY", "¡Qué entusiasmo!"], ["GERA", "Jajaja."]],
    repeat: "Todo tranquilo. Te escucho.",
    options: [option("grunge", "¿Qué preferís, grunge o metal?"), option("guitars", "¿Pesada o con buena melodía?"), option("club", "¿Notaste algo raro en este lugar?")],
    topics: {
      grunge: [["NEONBOY", "¿Qué preferís, grunge o metal?"], ["GERA", "Grunge."], ["NEONBOY", "¿Y el metal?"], ["GERA", "También me gusta."], ["NEONBOY", "¡Bueno, por lo menos coincidimos en algo!"]],
      guitars: [["NEONBOY", "¿Qué te gusta más, una canción pesada o una con buena melodía?"], ["GERA", "Si está bien hecha, cualquiera."], ["NEONBOY", "¿Y si tiene siete solos?"], ["GERA", "Capaz que seis sobran."]],
      club: [["NEONBOY", "¿Notaste algo raro en este lugar?"], ["GERA", "Hay algo extraño en el sonido."], ["NEONBOY", "¿Qué cosa?"], ["GERA", "No sé. Escuchá cuando se apaga la música."]],
    },
    farewell: "Nos vemos.",
    postShow: [["GERA", "Yo escuché algo raro antes de que fallaran las luces."]],
  },
  pablito: {
    greeting: [["NEONBOY", "¡Pablito! ¡Qué bueno verte!"], ["PABLITO", "¿Cómo andás? Todo tranquilo por acá."], ["NEONBOY", "¿Preparado para el recital?"], ["PABLITO", "Sí, sí. Cuando empiece, empieza."]],
    repeat: "Acá estamos, tranquilos.",
    options: [option("concert", "¿No estás ansioso por escuchar a la banda?"), option("demons", "¿Qué harías si apareciera un demonio acá?"), option("life", "¿Cómo hacés para estar siempre tan tranquilo?")],
    topics: {
      concert: [["NEONBOY", "¿No estás ansioso por escuchar a la banda?"], ["PABLITO", "No, tranquilo."], ["NEONBOY", "¡Vamos a tocar con todo!"], ["PABLITO", "Bueno, pero no rompas nada."]],
      demons: [["NEONBOY", "Che, Pablito... ¿qué harías si apareciera un demonio acá?"], ["PABLITO", "Y... habría que ver qué quiere."], ["NEONBOY", "¡Pero puede destruir el mundo!"], ["PABLITO", "Bueno, que espere a que termine el recital."]],
      life: [["NEONBOY", "¿Cómo hacés para estar siempre tan tranquilo?"], ["PABLITO", "Y... hay cosas que no vale la pena hacerse problema."], ["NEONBOY", "¡Necesito aprender eso!"], ["PABLITO", "Dejá de complicarte tanto."]],
    },
    farewell: "Dale, que salga lindo el show.",
    postShow: [["PABLITO", "Bueno, por suerte volvió la luz."]],
  },
  claudia: {
    greeting: [["CLAUDIA", "¡Hola, NeonBoy! Qué lindo encontrarnos todos acá."], ["NEONBOY", "¡Sí! Esto ya parece una reunión de amigos más que un recital."], ["CLAUDIA", "Bueno, una cosa no quita la otra."]],
    repeat: "¡Hola, NeonBoy! Estamos disfrutando el lugar.",
    options: [option("club", "¿Qué te parece el lugar?"), option("friends", "¿Cómo ves al grupo?"), option("concert", "¿Te vas a quedar a escuchar?")],
    topics: {
      club: [["NEONBOY", "¿Qué te parece el lugar?"], ["CLAUDIA", "Tiene mucha personalidad. Parece sacado de otra época."], ["NEONBOY", "¡Estamos en 1999!"], ["CLAUDIA", "Jajaja, entonces está bastante bien ambientado."]],
      friends: [["NEONBOY", "¿Cómo ves al grupo?"], ["CLAUDIA", "Cada uno con su personalidad, como siempre."], ["NEONBOY", "Y Diego llevándome la contra."], ["CLAUDIA", "Bueno, eso tampoco sorprende demasiado."]],
      concert: [["NEONBOY", "¿Te vas a quedar a escuchar?"], ["CLAUDIA", "Sí, quiero ver cómo sale todo."], ["NEONBOY", "¡Preparate para algo épico!"], ["CLAUDIA", "Bueno, ahora tenés que cumplir."]],
    },
    farewell: "¡Que disfrutes el show!",
    postShow: [["CLAUDIA", "¿Eso estaba preparado o fue un problema técnico?"]],
  },
};

const groupGreeting = [
  ["NEONBOY", "¡Bueno! ¿Qué hacen todos reunidos acá?"],
  ["MAXI", "¡Esperando el recital!"],
  ["GERA", "Charlando."],
  ["PABLITO", "Acá, tranquilos."],
  ["CLAUDIA", "Nos estábamos poniendo al día."],
  ["DIEGO", "Yo esperando que pongan otra música."],
  ["NEONBOY", "¡Diego, por favor!"],
];

const groupTopics = {
  band: [
    ["NEONBOY", "Bueno, ¿qué opinan de mi banda?"],
    ["MAXI", "¡Yo quiero escuchar esa batería!"],
    ["GERA", "Las guitarras tienen buena pinta."],
    ["CLAUDIA", "Visualmente es una banda bastante original."],
    ["PABLITO", "Mientras la pasen bien..."],
    ["DIEGO", "Yo todavía estoy tratando de entender lo de la perra baterista."],
    ["NEONBOY", "¡Es Luján! ¡Una profesional!"],
  ],
  tastes: [
    ["NEONBOY", "¿Quién tiene los mejores gustos musicales acá?"],
    ["MAXI", "¡Los metaleros!"],
    ["GERA", "El grunge tiene lo suyo."],
    ["DIEGO", "Yo pongo cumbia y bailamos todos."],
    ["NEONBOY", "¡Eso jamás va a pasar en mi recital!"],
    ["PABLITO", "A mí pongan lo que quieran."],
    ["CLAUDIA", "Bueno, por suerte no hace falta que a todos nos guste lo mismo."],
    ["DIEGO", "¡Exactamente! Por eso a mí no me gusta NeonBoy."],
    ["NEONBOY", "¡Era necesario aclararlo otra vez!"],
  ],
  aliens: [
    ["NEONBOY", "Che... ¿ustedes creen que existe vida extraterrestre?"],
    ["MAXI", "Con lo grande que es el universo, no sería raro."],
    ["GERA", "Podría ser."],
    ["CLAUDIA", "Es una pregunta interesante. Todavía hay muchísimo que desconocemos."],
    ["DIEGO", "¿Otra vez con eso? ¡Vinimos a escuchar música!"],
    ["NEONBOY", "¡Con Riky podemos hablar de estas cosas durante horas!"],
    ["PABLITO", "Bueno, si vienen extraterrestres, que paguen entrada."],
  ],
  demons: [
    ["NEONBOY", "Supongamos que aparece un demonio en medio del recital."],
    ["MAXI", "¿Y sigue el doble bombo?"],
    ["GERA", "Yo buscaría la salida."],
    ["CLAUDIA", "Primero habría que entender qué está pasando."],
    ["DIEGO", "¡Viste! Yo sabía que tanto metal iba a terminar mal."],
    ["NEONBOY", "¡NO ES CULPA DEL METAL!"],
    ["PABLITO", "Bueno, no discutan. Todavía no apareció ninguno."],
  ],
  stage: [
    ["NEONBOY", "¿Quién de ustedes se anima a tocar con 9th Revelation?"],
    ["MAXI", "Si necesitan baterista suplente, avisame."],
    ["GERA", "Yo miro desde acá."],
    ["CLAUDIA", "Yo prefiero disfrutar el espectáculo."],
    ["PABLITO", "Estoy cómodo acá."],
    ["DIEGO", "Yo subo si ponen reguetón."],
    ["NEONBOY", "¡Entonces no subís nunca!"],
    ["DIEGO", "¡Mejor!"],
  ],
  anomaly: [
    ["GERA", "Che, ¿escucharon ese ruido cuando se cortó la música?"],
    ["MAXI", "Sí, pero no parecía venir de la batería."],
    ["CLAUDIA", "¿No podría ser algún problema del equipo?"],
    ["NEONBOY", "Hugo encontró algo parecido en una grabación."],
    ["DIEGO", "¡Ah, bueno! Ahora todos los ruidos van a ser paranormales."],
    ["PABLITO", "Yo esperaría a ver si vuelve a pasar."],
  ],
};

const groupOptions = [
  option("band", "¿Qué opinan de 9th Revelation?"),
  option("tastes", "¿Quién tiene mejores gustos musicales?"),
  option("aliens", "¿Creen en los extraterrestres?"),
  option("demons", "¿Qué harían si apareciera un demonio?"),
  option("stage", "¿Quién se anima a subir al escenario?"),
];

export function getFriendsDialogueNode(npcId, nodeId, progressValue, context = {}) {
  const progress = normalizeFriendsProgress(progressValue);
  const isGroup = npcId === "friendsTable";
  if (!isGroup && !FRIEND_IDS.includes(npcId)) return null;
  if (isGroup) {
    const options = [...groupOptions, ...(context.signalKnown ? [option("anomaly", "¿Escucharon la interferencia?")] : []),
      option("bye", "Bueno, me voy a preparar.", "close")];
    if (nodeId === "greeting" || nodeId === "root") return {
      id: nodeId, kicker: "CLUB DE ROCK · MESA DE LOS AMIGOS",
      ...(nodeId === "greeting" && !progress.groupMet
        ? { lines: lines(groupGreeting) }
        : { text: "La mesa sigue animada. Diego ya está por discutir con alguien." }),
      options,
    };
    if (!groupTopics[nodeId] || (nodeId === "anomaly" && !context.signalKnown)) return null;
    const pairs = nodeId === "aliens" && context.rikyNearby
      ? [...groupTopics.aliens.slice(0, -1), ["RIKY", "El universo es enorme. Hay muchas preguntas que todavía no sabemos responder."],
        ["NEONBOY", "¡Por fin alguien que me entiende!"], ["DIEGO", "¡Ahora son dos!"], groupTopics.aliens.at(-1)]
      : groupTopics[nodeId];
    return { id: nodeId, kicker: "LA MESA DE LOS AMIGOS", lines: lines(pairs), options: [back, bye] };
  }

  const character = individual[npcId];
  const options = [...character.options,
    ...(context.anomalySeen ? [option("postShow", "¿Qué te pareció el recital?")] : []),
    option("bye", "Bueno, nos vemos.", "farewell")];
  if (nodeId === "greeting" || nodeId === "root") return {
    id: nodeId, kicker: "CLUB DE ROCK · AMIGOS DE NEONBOY",
    ...(nodeId === "greeting" && !progress.met.includes(npcId)
      ? { lines: lines(character.greeting) }
      : { text: character.repeat }),
    options,
  };
  if (nodeId === "farewell") return { id: nodeId, text: character.farewell, options: [option("close", "Cerrar conversación", "close")] };
  if (nodeId === "postShow" && context.anomalySeen)
    return { id: nodeId, lines: lines(character.postShow), options: [back, bye] };
  if (!character.topics[nodeId]) return null;
  return { id: nodeId, lines: lines(character.topics[nodeId]), options: [back, bye] };
}

export function chooseFriendsDialogue(npcId, nodeId, optionId, progress, context) {
  const node = getFriendsDialogueNode(npcId, nodeId, progress, context);
  const chosen = node?.options.find((entry) => entry.id === optionId);
  return chosen ? {
    nodeId: chosen.next,
    friendsEvent: chosen.next !== "root" && chosen.next !== "close" && chosen.next !== "farewell"
      ? `discuss:${npcId}:${chosen.next}` : null,
  } : { nodeId };
}
