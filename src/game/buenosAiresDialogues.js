import { ESCAPE_BRIEFING } from "./buenosAiresEscapeLogic.js";
export const BUENOS_AIRES_CITIZEN_DIALOGUES = [
  [
    { speaker: "NEONBOY", text: "Disculpame, ¿qué año es?" },
    { speaker: "CIUDADANO", text: "Actualizando perfil..." },
    { speaker: "NEONBOY", text: "¿Qué? ¿Me escuchaste?" },
  ],
  [
    { speaker: "NEONBOY", text: "Che, ¿alguien me puede explicar qué está pasando?" },
    { speaker: "CIUDADANO", text: "Tu solicitud está siendo procesada." },
    { speaker: "NEONBOY", text: "¿Pero qué les pasa a todos?" },
  ],
  [
    { speaker: "NEONBOY", text: "¡¿Hay alguien normal en esta ciudad?!" },
    { speaker: "CIUDADANO", text: "Acepto los términos y condiciones." },
    { speaker: "NEONBOY", text: "Increíble. Vengo del infierno y acá nadie me da bola." },
  ],
];

export const BUENOS_AIRES_DISCONNECTED_DIALOGUE = [
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-01.mp3",
    "id": "desconectada-14-01",
    "text": "No sigas intentando hablarles. Ya no pueden escucharte.",
    "duration": 3075
  },
  {
    "speaker": "NEONBOY",
    "audioId": "neonboy-14-01.mp3",
    "id": "neonboy-14-01",
    "text": "\u00a1Por fin! Alguien que habla sin mirar una pantalla.",
    "duration": 2895
  },
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-02.mp3",
    "id": "desconectada-14-02",
    "text": "Baj\u00e1 la voz. La Red ya sabe que est\u00e1s ac\u00e1.",
    "duration": 2490
  },
  {
    "speaker": "NEONBOY",
    "audioId": "neonboy-14-02.mp3",
    "id": "neonboy-14-02",
    "text": "\u00bfQu\u00e9 Red? \u00bfLa del Wi-Fi?",
    "duration": 1800
  },
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-03.mp3",
    "id": "desconectada-14-03",
    "text": "La que controla lo que ven, lo que recuerdan... y lo que creen que est\u00e1n eligiendo.",
    "duration": 4335
  },
  {
    "speaker": "NEONBOY",
    "audioId": "neonboy-14-03.mp3",
    "id": "neonboy-14-03",
    "text": "Fant\u00e1stico. En 1999 me preocupaba que me robaran el auto. Ahora me quieren robar los pensamientos.",
    "duration": 5010
  },
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-04.mp3",
    "id": "desconectada-14-04",
    "text": "Hay tres transmisores secundarios. Mantienen a todos conectados a la misma se\u00f1al.",
    "duration": 4245
  },
  {
    "speaker": "NEONBOY",
    "audioId": "neonboy-14-04.mp3",
    "id": "neonboy-14-04",
    "text": "Bueno... Entonces vamos a desenchufar esta ciudad.",
    "duration": 2850
  },
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-05.mp3",
    "id": "desconectada-14-05",
    "text": "No los destruyas sin m\u00e1s. Primero tenemos que entender c\u00f3mo est\u00e1n conectados.",
    "duration": 4065
  }
];
export const BUENOS_AIRES_SYNCHRONIZATION_DIALOGUE = [
  {
    "speaker": "NEONBOY",
    "audioId": "neonboy-14-05.mp3",
    "id": "neonboy-14-05",
    "text": "Bueno... Ahora s\u00ed me est\u00e1n dando bola. \u00a1Y no me gusta un carajo!",
    "duration": 3480
  },
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-06.mp3",
    "id": "desconectada-14-06",
    "text": "\u00a1Nos detectaron! \u00a1La Red est\u00e1 reaccionando!",
    "duration": 2535
  },
  {
    "speaker": "NEONBOY",
    "audioId": "neonboy-14-06.mp3",
    "id": "neonboy-14-06",
    "text": "\u00bfY ahora qu\u00e9?",
    "duration": 1800
  },
  {
    "speaker": "LA DESCONECTADA",
    "audioId": "desconectada-14-07.mp3",
    "id": "desconectada-14-07",
    "text": "Tenemos que salir de ac\u00e1 antes de que lleguen los Vigilantes.",
    "duration": 3345
  }
];

// IDs reserve future voice files. Subtitles never request missing MP3s.
export const BUENOS_AIRES_VIGILANTE_DIALOGUES = {
  "vigilante-intro": [
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-01",
      "audioId": "vigilante-14-01.mp3",
      "text": "Usuario no registrado. Identificaci\u00f3n requerida."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-01",
      "audioId": "neonboy-vigilante-01.mp3",
      "text": "\u00bfY vos qui\u00e9n sos? \u00bfRobocop con problemas de se\u00f1al?"
    },
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-02",
      "audioId": "vigilante-14-02.mp3",
      "text": "Identidad detectada: NeonBoy. Procedencia temporal incompatible."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-02",
      "audioId": "neonboy-vigilante-02.mp3",
      "text": "\u00bfC\u00f3mo sab\u00e9s qui\u00e9n soy?"
    },
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-03",
      "audioId": "vigilante-14-03.mp3",
      "text": "Registro original localizado. A\u00f1o 1999."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-03",
      "audioId": "neonboy-vigilante-03.mp3",
      "text": "\u00bfQu\u00e9 tiene que ver 1999 con esta locura?"
    },
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-04",
      "audioId": "vigilante-14-04.mp3",
      "text": "Informaci\u00f3n restringida. Iniciando protocolo de contenci\u00f3n."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-04",
      "audioId": "neonboy-vigilante-04.mp3",
      "text": "Bueno... Se termin\u00f3 la charla."
    }
  ],
  "vigilante-phase": [
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-05",
      "audioId": "vigilante-14-05.mp3",
      "text": "Anomal\u00eda temporal confirmada. Resistencia no autorizada."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-05",
      "audioId": "neonboy-vigilante-05.mp3",
      "text": "\u00a1La resistencia no necesita autorizaci\u00f3n, pedazo de lata!"
    }
  ],
  "vigilante-defeat": [
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-06",
      "audioId": "vigilante-14-06.mp3",
      "text": "Fallo cr\u00edtico... Identidad reconocida..."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-06",
      "audioId": "neonboy-vigilante-06.mp3",
      "text": "\u00bfOtra vez con mi identidad? \u00bfQu\u00e9 saben de m\u00ed?"
    },
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-07",
      "audioId": "vigilante-14-07.mp3",
      "text": "Registro original... Neon Recording Studio... A\u00f1o 1999..."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-07",
      "audioId": "neonboy-vigilante-07.mp3",
      "text": "\u00a1Par\u00e1! \u00a1Yo conozco ese estudio!"
    },
    {
      "speaker": "VIGILANTE",
      "id": "vigilante-14-08",
      "audioId": "vigilante-14-08.mp3",
      "text": "Transmisi\u00f3n... origen... se\u00f1al..."
    }
  ],
  "escape": [
    {
      "speaker": "LA DESCONECTADA",
      "id": "desconectada-14-08",
      "audioId": "desconectada-14-08.mp3",
      "text": "\u00a1Tenemos que irnos! La Red enviar\u00e1 m\u00e1s Vigilantes."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-08",
      "audioId": "neonboy-vigilante-08.mp3",
      "text": "\u00bfY c\u00f3mo pens\u00e1s escapar?"
    },
    {
      "speaker": "LA DESCONECTADA",
      "id": "desconectada-14-09",
      "audioId": "desconectada-14-09.mp3",
      "text": "Conozco un veh\u00edculo que puede sacarnos de ac\u00e1."
    },
    {
      "speaker": "NEONBOY",
      "id": "neonboy-vigilante-09",
      "audioId": "neonboy-vigilante-09.mp3",
      "text": "Espero que no me digas que tenemos que correr hasta Avellaneda."
    }
  ]
};

export const BUENOS_AIRES_FUEGO_DIALOGUES = {
  "fuego-flight-briefing": ESCAPE_BRIEFING,
  "fuego-intro": [
    { speaker: "LA DESCONECTADA", text: "Tenemos un problema. El vehículo no está listo para despegar." },
    { speaker: "NEONBOY", text: "¿Cómo que no? ¡Es un Renault Fuego volador! ¡Tiene que funcionar!" },
    { speaker: "LA DESCONECTADA", text: "Le falta la llave, una celda de energía y el módulo de navegación. Perdí la llave cerca de la confitería de Corrientes." },
    { speaker: "NEONBOY", text: "En 1999 ya era difícil conseguirle repuestos. Imaginate cincuenta años después." },
    { speaker: "LA DESCONECTADA", text: "Si conseguimos los tres componentes, podríamos escapar sin conectarnos a la Red." },
    { speaker: "NEONBOY", text: "Bueno... A buscar repuestos en el futuro." },
  ],
  "fuego-key": [
    { speaker: "PEATÓN", text: "Objeto encontrado. Propietario no verificado." },
    { speaker: "NEONBOY", text: "¡Es la llave del Fuego! ¡Dámela, que tenemos que salir de acá!" },
    { speaker: "PEATÓN", text: "Transferencia de objeto autorizada." },
  ],
  "fuego-power": [
    { speaker: "NEONBOY", text: "¿Esto reemplaza la nafta?" },
    { speaker: "LA DESCONECTADA", text: "Es una celda de energía de alta densidad." },
    { speaker: "NEONBOY", text: "Espero que no consuma como un V8." },
  ],
  "fuego-navigation": [
    { speaker: "NEONBOY", text: "Un GPS que no necesita Internet... Ahora sí me gusta el futuro." },
  ],
  "fuego-record": [
    { speaker: "LA DESCONECTADA", text: "¿Conocés ese lugar?" },
    { speaker: "NEONBOY", text: "Sí... Ahí grabé mi música." },
    { speaker: "LA DESCONECTADA", text: "Entonces la Red está conectada con tu pasado." },
    { speaker: "NEONBOY", text: "Y alguien se tomó muchas molestias para ocultarlo." },
  ],
  "fuego-ignition": [
    { speaker: "NEONBOY", text: "¡Arrancó! ¡No lo puedo creer!" },
    { speaker: "LA DESCONECTADA", text: "El sistema está listo. Podemos despegar." },
    { speaker: "NEONBOY", text: "¡Es un milagro más grande que todo lo que vi en el Inframundo!" },
  ],
};
export function cityDialogueLines(dialogue) {
  if (!dialogue) return [];
  return BUENOS_AIRES_FUEGO_DIALOGUES[dialogue.kind] || BUENOS_AIRES_VIGILANTE_DIALOGUES[dialogue.kind] || (dialogue.kind === "disconnected"
    ? BUENOS_AIRES_DISCONNECTED_DIALOGUE : BUENOS_AIRES_CITIZEN_DIALOGUES[dialogue.variant]) || [];
}

