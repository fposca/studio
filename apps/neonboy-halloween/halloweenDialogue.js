import { HALLOWEEN_VOICE_PREFIXES } from "./halloweenVoiceManifest.js";

const conversations = {
  tito: {
    name: 'Tito "El Surco"', role: "Dueño de la tienda",
    intro: "Bienvenido a la tienda. Acá los discos cuentan historias, aunque algunas conviene escucharlas con la luz prendida.",
    topics: [
      ["Discos de NeonBoy", "Están por toda la tienda. Elegí una tapa para ver los temas y ponerlos a sonar."],
      ["La noche de Halloween", "La tienda abrió en Halloween. Desde entonces, cada 31 de octubre los vinilos parecen moverse solos."],
      ["La rockola", "Esa máquina conoce la discografía mejor que yo. Acercate y apretá E, o abrila desde el botón de arriba."]
    ]
  },
  rulo: {
    name: 'Rulo "Distorsión"', role: "Metalero",
    intro: "¿Viniste por los discos o por el mejor solo de guitarra que vas a escuchar esta noche?",
    topics: [
      ["Tu disco favorito", "Holy Fire. Ponelo fuerte y vas a entender por qué sigo viniendo."],
      ["NeonBoy", "Tiene una máscara rara, pero sabe hacer cantar a una guitarra. Se lo reconozco."],
      ["Halloween", "Si las luces parpadean durante un solo, no mires hacia el depósito."]
    ]
  },
  roxy: {
    name: "Roxy", role: "Guitarrista",
    intro: "Estoy buscando un disco. Si escuchás una guitarra desde el fondo, probablemente sea yo.",
    topics: [
      ["Qué escuchás", "Hoy tengo ganas de algo oscuro y melódico. Gloom funciona bastante bien para eso."],
      ["El olor a vinilo", "Tiene ese olor a cartón y vinilo que ninguna plataforma puede copiar."],
      ["Halloween", "Me gusta esta noche. Todo el mundo puede ser alguien más por unas horas."]
    ]
  },
  freddy: { name: "Bones", role: "Visitante de Halloween", intro: "Bones suelta una risa escalofriante y señala las estanterías del fondo.", topics: [["Qué hay al fondo", "Una buena colección de discos... y quizás algo que no debería estar ahí."]] },
  jason: { name: "Belfegor", role: "Visitante silencioso", intro: "Belfegor no dice una palabra. Mira la rockola y asiente una sola vez.", topics: [["La rockola", "Belfegor hace un gesto afirmativo. Parece que también quiere escuchar música."]] },
  "skeleton-holy": { name: "Guardián de Holy Fire", role: "Guardián de los discos", intro: "El esqueleto levanta su vinilo como si fuera un tesoro.", topics: [["Holy Fire", "Un disco con fuego en cada surco. Escuchalo y entendé por qué lo cuido."]] },
  "skeleton-unholy": { name: "Guardián de Unholy Fire", role: "Guardián de los discos", intro: "Un crujido de huesos acompaña el ritmo de una canción lejana.", topics: [["Unholy Fire", "La otra cara del fuego. No todos se animan a escucharla hasta el final."]] }
};

const additionalTopics = {
  "tito": [
    {
      "id": "tito-05",
      "label": "El aniversario",
      "speaker": "tito",
      "text": "Cuatro años de NeonBoy... Parece que fue ayer cuando llegó el primer disco. Mirá todo lo que tenemos ahora. ¡Y pensar que algunos decían que el rock estaba muerto!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "tito-06",
      "label": "Los tiempos modernos",
      "speaker": "tito",
      "text": "Antes venían a preguntar si teníamos el último disco de Metallica. Ahora me preguntan si tenemos WiFi. ¡Qué tiempos, hermano!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "tito-07",
      "label": "La máscara",
      "speaker": "tito",
      "text": "¿NeonBoy? Claro que lo conozco. Vino una noche con esa máscara tan particular. Compró unas cuerdas de guitarra y desapareció sin hacer ruido.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "tito-08",
      "label": "Los discos",
      "speaker": "tito",
      "text": "Cada disco representa una etapa distinta. Algunos hablan de amor, otros de oscuridad... y algunos te dejan pensando bastante.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "tito-09",
      "label": "Halloween",
      "speaker": "tito",
      "text": "Anoche cerré la tienda a las doce. Cuando volví esta mañana, todos los discos estaban girando. Y eso que no había electricidad.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "tito-10",
      "label": "El secreto",
      "speaker": "tito",
      "text": "Te voy a contar algo, pero que quede entre nosotros. Hay un disco en esta tienda que nadie recuerda haber grabado.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "tito-11",
      "label": "El visitante",
      "speaker": "tito",
      "text": "Tomate tu tiempo. Acá no tenés que comprar nada para disfrutar de la música.",
      "category": "npc",
      "trigger": "topic"
    }
  ],
  "rulo": [
    {
      "id": "rulo-05",
      "label": "Los solos",
      "speaker": "rulo",
      "text": "¡Escuchame una cosa, maestro! Si un tema no tiene un solo de guitarra de por lo menos treinta segundos... ¡para mí es un interludio!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-06",
      "label": "Burn Lies",
      "speaker": "rulo",
      "text": "¿Escuchaste Burn Lies? ¡Ese tipo metió cinco solos en una sola canción! ¡Cinco! ¡Eso ya debería ser ilegal!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-07",
      "label": "El aniversario",
      "speaker": "rulo",
      "text": "¡Cuatro años de NeonBoy! ¡Cuatro años de guitarras, distorsión y vecinos llamando a la policía!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-08",
      "label": "El reguetón",
      "speaker": "rulo",
      "text": "El otro día entró uno preguntando por reguetón. Le dije que sí... que teníamos un disco para espantarlo.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-09",
      "label": "El volumen",
      "speaker": "rulo",
      "text": "Si el volumen está en diez, todavía te queda uno. ¡Ponelo en once, papá!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-10",
      "label": "Roxy",
      "speaker": "rulo",
      "text": "¿Viste a la metalera del fondo? Le dije que tocaba la guitarra como Malmsteen. Me pidió que le mostrara... y justo me acordé de que tenía que irme.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-11",
      "label": "La guitarra",
      "speaker": "rulo",
      "text": "Hay algo que nunca voy a entender de NeonBoy. ¿Cómo hace para tocar con esa máscara? ¡Yo no puedo ni afinar con anteojos!",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "rulo-12",
      "label": "El misterio",
      "speaker": "rulo",
      "text": "Anoche escuché un riff que venía del depósito. Lo raro es que no había ningún amplificador enchufado.",
      "category": "npc",
      "trigger": "topic"
    }
  ],
  "roxy": [
    {
      "id": "roxy-05",
      "label": "NeonBoy",
      "speaker": "roxy",
      "text": "¿El guitarrista de la máscara? Sí, lo vi por acá. No está mal lo que hace... aunque tampoco se lo voy a decir en la cara.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-06",
      "label": "Rulo",
      "speaker": "roxy",
      "text": "El metalero de allá me dijo que toca como Yngwie Malmsteen. Le pedí que me tocara algo... todavía está buscando la púa.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-07",
      "label": "Gloom",
      "speaker": "roxy",
      "text": "Gloom tiene algo especial. Es de esos discos que escuchás de noche, cuando no tenés ganas de hablar con nadie.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-08",
      "label": "El aniversario",
      "speaker": "roxy",
      "text": "Cuatro años de música... Nada mal. Hay bandas que no duran ni cuatro ensayos.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-09",
      "label": "La tienda",
      "speaker": "roxy",
      "text": "Me encantan las disquerías viejas. El olor de los vinilos, las tapas gigantes, los tipos discutiendo sobre guitarristas... Es casi como viajar en el tiempo.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-10",
      "label": "El misterio",
      "speaker": "roxy",
      "text": "¿Vos también viste esa sombra detrás de los discos? Pensé que era uno de los chicos haciendo una broma.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-11",
      "label": "El visitante",
      "speaker": "roxy",
      "text": "Si buscás algo tranquilo, probá otro estante. Acá las guitarras tienen personalidad.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "roxy-12",
      "label": "La música",
      "speaker": "roxy",
      "text": "Hay canciones que escuchás una vez y te olvidás. Y otras que se quedan con vos durante años. Esas son las que importan.",
      "category": "npc",
      "trigger": "topic"
    }
  ],
  "holy": [
    {
      "id": "holy-02",
      "label": "La llama",
      "speaker": "holy",
      "text": "El fuego no siempre destruye. A veces ilumina el camino que otros temen recorrer.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "holy-03",
      "label": "El guerrero",
      "speaker": "holy",
      "text": "Detrás de cada batalla hay una historia. Detrás de cada cicatriz, una canción.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "holy-04",
      "label": "El aniversario",
      "speaker": "holy",
      "text": "Cuatro años han pasado. Pero la llama que dio origen a esta música todavía arde.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "holy-05",
      "label": "La elección",
      "speaker": "holy",
      "text": "Escuchá con atención. No todas las voces que vienen de la oscuridad son enemigas.",
      "category": "npc",
      "trigger": "topic"
    }
  ],
  "unholy": [
    {
      "id": "unholy-02",
      "label": "La oscuridad",
      "speaker": "unholy",
      "text": "La oscuridad no necesita permiso para entrar. Solo necesita que apagues la última luz.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "unholy-03",
      "label": "La otra cara",
      "speaker": "unholy",
      "text": "Creés conocer el fuego... pero todavía no escuchaste lo que sucede cuando deja de iluminar.",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "unholy-04",
      "label": "El aniversario",
      "speaker": "unholy",
      "text": "Cuatro años construyendo un legado... ¿Cuánto tiempo creés que tardaría en arder?",
      "category": "npc",
      "trigger": "topic"
    },
    {
      "id": "unholy-05",
      "label": "El desafío",
      "speaker": "unholy",
      "text": "Muchos se acercan por curiosidad. Pocos permanecen hasta escuchar la última nota.",
      "category": "npc",
      "trigger": "topic"
    }
  ]
};
for (const [id, rows] of Object.entries(additionalTopics)) {
  const npcId = id === "holy" ? "skeleton-holy" : id === "unholy" ? "skeleton-unholy" : id;
  conversations[npcId].topics.push(...rows.map((row) => [row.label, row.text, row.id]));
}
conversations.freddy.topics = [];
conversations.jason.topics = [];
for (const id of ["tito", "rulo", "roxy"]) {
  conversations[id].introId = `${id}-01`;
  conversations[id].topics.slice(0, 3).forEach((topic, index) => { topic[2] = `${id}-0${index + 2}`; });
}
conversations["skeleton-holy"].topics[0][2] = "holy-01";
conversations["skeleton-unholy"].topics[0][2] = "unholy-01";
export const CONVERSATIONS = conversations;
export const AMBIENT_CONVERSATIONS = [
  {
    "id": "duo-01",
    "participants": [
      "rulo",
      "roxy"
    ],
    "lines": [
      {
        "id": "duo-01-rulo-01",
        "speaker": "rulo",
        "text": "Te digo que NeonBoy tiene una técnica tremenda.",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-01-roxy-01",
        "speaker": "roxy",
        "text": "¿Y vos cuándo vas a aprender a tocar así?",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-01-rulo-02",
        "speaker": "rulo",
        "text": "Estoy trabajando en eso...",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-01-roxy-02",
        "speaker": "roxy",
        "text": "Desde 1999, más o menos.",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      }
    ]
  },
  {
    "id": "duo-02",
    "participants": [
      "tito",
      "rulo"
    ],
    "lines": [
      {
        "id": "duo-02-tito-01",
        "speaker": "tito",
        "text": "¡Rulo! ¡Bajá un poco el volumen que se caen los discos!",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-02-rulo-01",
        "speaker": "rulo",
        "text": "¡Eso es porque están cabeceando, Tito!",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-02-tito-02",
        "speaker": "tito",
        "text": "¡Lo que va a cabecear es tu cabeza contra la puerta!",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      }
    ]
  },
  {
    "id": "duo-03",
    "participants": [
      "tito",
      "roxy"
    ],
    "lines": [
      {
        "id": "duo-03-tito-01",
        "speaker": "tito",
        "text": "¿Quién lo hubiera dicho?",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-03-roxy-01",
        "speaker": "roxy",
        "text": "Y todavía hay un montón de música por descubrir.",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      },
      {
        "id": "duo-03-tito-02",
        "speaker": "tito",
        "text": "Mientras haya alguien dispuesto a escuchar, esta tienda va a seguir abierta.",
        "category": "ambient",
        "trigger": "nearby-or-interaction"
      }
    ]
  }
];
export const ANNIVERSARY_LINES = [
  {
    "id": "aniversario-tito-01",
    "speaker": "tito",
    "text": "¿Escucharon eso? Esa guitarra... hace cuatro años que la escucho.",
    "category": "anniversary",
    "trigger": "three-distinct-songs"
  },
  {
    "id": "aniversario-rulo-01",
    "speaker": "rulo",
    "text": "¡Eso es NeonBoy, viejo! ¡Reconozco ese sonido en cualquier lado!",
    "category": "anniversary",
    "trigger": "three-distinct-songs"
  },
  {
    "id": "aniversario-roxy-01",
    "speaker": "roxy",
    "text": "Cuatro años de música... y todavía quedan muchas historias por contar.",
    "category": "anniversary",
    "trigger": "three-distinct-songs"
  },
  {
    "id": "aniversario-tito-02",
    "speaker": "tito",
    "text": "Cuatro años de música, amigos. Y esto recién empieza.",
    "category": "anniversary",
    "trigger": "three-distinct-songs"
  }
];
const voiceFiles = {
  ...import.meta.glob("../../halloween/*.{mp3,wav,ogg,m4a}", { eager: true, query: "?url", import: "default" }),
  ...import.meta.glob("./audio/*.{mp3,wav,ogg,m4a}", { eager: true, query: "?url", import: "default" })
};
export function getHalloweenVoiceUrl(id) {
  const entries = Object.entries(voiceFiles);
  const local = entries.find(([path]) => path.startsWith("./audio/") &&
    path.split("/").at(-1).toLocaleLowerCase("es").startsWith(`${id}.`.toLocaleLowerCase("es")));
  if (local) return local[1];
  const prefix = HALLOWEEN_VOICE_PREFIXES[id];
  if (!prefix) return null;
  const match = entries.find(([path]) =>
    path.split("/").at(-1).normalize("NFC").toLocaleLowerCase("es").startsWith(prefix.normalize("NFC").toLocaleLowerCase("es"))
  );
  return match?.[1] ?? null;
}
