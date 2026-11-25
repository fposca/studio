const make = (id, speaker, text) => Object.freeze({
  id, speaker, text, futureAudio: `/audio/catedral/${id}.mp3`,
});

// These paths are only discovered at build time. Missing recordings never trigger requests.
const voiceAssets = import.meta.glob
  ? import.meta.glob("../assets/neonboy-animaciones/voces/catedral/*.mp3", {
      eager: true, query: "?url", import: "default",
    })
  : {};
const voiceById = Object.fromEntries(Object.entries(voiceAssets).map(([path, url]) => [
  path.split("/").at(-1).replace(/\.mp3$/i, "").toLowerCase(), url,
]));
export function getCathedralVoiceUrl(id) {
  const key = id?.toLowerCase();
  if (key === "registro-primera-voz") return voiceById["primera-voz-guitarra"] || voiceById[key] || null;
  return voiceById[key] || null;
}

export const CATHEDRAL_CONVERSATION_NPC = Object.freeze({
  id: "cathedral-custodian", name: "Custodio de los Recuerdos",
  role: "Archivo de los Condenados", avatar: "CR",
});

export const CATHEDRAL_DIALOGUES = Object.freeze({
  first: Object.freeze([
    make("custodio-01", "CUSTODIO", "Te estaba esperando, NeonBoy."),
    make("neonboy-custodio-01", "NEONBOY", "Qué raro... últimamente todo el mundo parece conocerme."),
    make("custodio-02", "CUSTODIO", "No todos los que atraviesan las puertas llegan por primera vez."),
    make("neonboy-custodio-02", "NEONBOY", "¿Estás diciendo que ya estuve acá?"),
    make("custodio-03", "CUSTODIO", "Estoy diciendo que tus recuerdos no siempre cuentan toda la historia."),
    make("neonboy-custodio-03", "NEONBOY", "Fantástico. Ahora resulta que mi memoria también tiene errores de programación."),
    make("custodio-04", "CUSTODIO", "Los demonios custodian las puertas... pero las puertas no fueron creadas por demonios."),
    make("neonboy-custodio-04", "NEONBOY", "Entonces, ¿quién las construyó?"),
    make("custodio-05", "CUSTODIO", "Alguien que todavía no ha nacido."),
    make("neonboy-custodio-05", "NEONBOY", "Perfecto. Ya me faltaban paradojas temporales."),
  ]),
  anomaly: Object.freeze([
    make("neonboy-custodio-06", "NEONBOY", "Viajé por una nave perdida, un templo maldito y una ciudad que parecía una simulación. ¿Qué tienen en común?"),
    make("custodio-06", "CUSTODIO", "Todas fueron alcanzadas por la misma señal."),
    make("neonboy-custodio-07", "NEONBOY", "La Anomalía."),
    make("custodio-07", "CUSTODIO", "Así la llamás vos. Pero es solamente el efecto de algo mucho más antiguo."),
    make("neonboy-custodio-08", "NEONBOY", "¿Y qué es ese algo?"),
    make("custodio-08", "CUSTODIO", "Una transmisión que fue dividida deliberadamente para impedir que una presencia atravesara las dimensiones."),
    make("neonboy-custodio-09", "NEONBOY", "¿Quién la dividió?"),
    make("custodio-09", "CUSTODIO", "Alguien que conocía las consecuencias de escucharla completa."),
    make("neonboy-custodio-10", "NEONBOY", "Como siempre... todas las respuestas vienen con otra pregunta."),
  ]),
  archiveHint: Object.freeze([
    make("custodio-archivo-pista-01", "CUSTODIO", "La Anomal\u00eda dej\u00f3 una marca falsa en el Archivo. No conf\u00edes en lo que ves a simple vista."),
    make("neonboy-archivo-pista-01", "NEONBOY", "Entonces tengo que mirar los recuerdos en otra frecuencia."),
    make("custodio-archivo-pista-02", "CUSTODIO", "La se\u00f1al conserva lo que la piedra intenta olvidar."),
  ]),
  hint: Object.freeze([
    make("custodio-10", "CUSTODIO", "Reconstruiste los recuerdos. Pero todavía falta escuchar aquello que los une."),
    make("neonboy-custodio-11", "NEONBOY", "¿Otra grabación imposible?"),
    make("custodio-11", "CUSTODIO", "La primera voz. La señal que existía antes de que las puertas fueran abiertas."),
    make("neonboy-custodio-12", "NEONBOY", "¿Y dónde está?"),
    make("custodio-12", "CUSTODIO", "Toda voz nace en un pulso, deja un eco y busca su origen. Escuch\u00e1 los resonadores."),
    make("neonboy-custodio-13", "NEONBOY", "Entonces probemos con la mía."),
  ]),
  altar: Object.freeze([
    make("registro-primera-voz", "ARCHIVO / FECHA IMPOSIBLE", "Entre interferencias, el registro deja oír una guitarra eléctrica. La melodía le resulta familiar a NeonBoy."),
    make("neonboy-altar-01", "NEONBOY", "Un momento... Esa guitarra..."),
    make("custodio-altar-01", "CUSTODIO", "¿La reconocés?"),
    make("neonboy-altar-02", "NEONBOY", "Sí... Ese tema es mío. Yo lo grabé."),
    make("custodio-altar-02", "CUSTODIO", "Imposible. Este registro tiene más de mil años."),
    make("neonboy-altar-03", "NEONBOY", "Eso no puede ser. Mi música no existía entonces."),
    make("custodio-altar-03", "CUSTODIO", "El tiempo no se comporta aquí como en tu mundo."),
    make("neonboy-altar-04", "NEONBOY", "Entonces... ¿quién estaba tocando?"),
    make("custodio-altar-04", "CUSTODIO", "Esa es la pregunta que deberías hacerle a quien guarda el Trono del Abismo."),
  ]),
  farewell: Object.freeze([
    make("custodio-final-01", "CUSTODIO", "Recordá esto, NeonBoy: no siempre es el pasado el que persigue al futuro."),
    make("neonboy-final-01", "NEONBOY", "Cada vez entiendo menos este universo... Y eso que ya derroté a mi propia versión malvada."),
    make("custodio-final-02", "CUSTODIO", "Cuando llegues al trono, comprenderás por qué la señal te reconoce."),
    make("neonboy-final-02", "NEONBOY", "Bueno... espero que al menos el próximo demonio tenga respuestas."),
  ]),
  repeat: Object.freeze([
    make("custodio-recordatorio", "CUSTODIO", "Las respuestas siguen en el origen de la señal. El altar recuerda lo que otros olvidaron."),
  ]),
});
