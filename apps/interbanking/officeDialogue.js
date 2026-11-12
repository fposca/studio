export const OFFICE_LOGO_TEXT = "Interbanking es la plataforma digital de servicios financieros B2B líder en Argentina, diseñada para unificar la gestión bancaria de pequeñas, medianas y grandes empresas. Fundada en 1996, actúa como una cámara compensadora de fondos de alto valor y un ecosistema financiero multicanal que conecta a más de 220.000 empresas con 58 bancos de todo el país.";

export const OFFICE_ROXY = Object.freeze({ id: "office-roxy", name: "Roxy", role: "Recursos Humanos", avatar: "RX" });

export const OFFICE_DIALOGUE = Object.freeze({
  welcome: {
    id: "welcome",
    kicker: "INTERBANKING · RECURSOS HUMANOS",
    text: "¡Hola, Fernando! Bienvenido a la oficina. Soy Roxy, de Recursos Humanos. ¿En qué puedo ayudarte?",
    options: [
      { id: "first-day", label: "¿Qué me recomendás para mi primer día?", spoken: "Hola, es mi primer día en la oficina. ¿Qué me recomendás?", next: "first-day" },
      { id: "desk", label: "¿Dónde está mi escritorio?", spoken: "¿Me ayudás a encontrar mi escritorio?", next: "desk" },
      { id: "bye", label: "Gracias, voy a recorrer la oficina.", spoken: "Gracias, Roxy. Voy a recorrer la oficina.", next: null },
    ],
  },
  "first-day": {
    id: "first-day",
    kicker: "TU PRIMER DÍA",
    text: "Empezá con calma y conocé el espacio. La cocina está al fondo: tenés café, té y otras infusiones para servirte cuando quieras. Después, acercate a tu equipo; siempre hay alguien dispuesto a darte una mano.",
    options: [
      { id: "ask-desk", label: "¿Y dónde me siento?", spoken: "Perfecto. ¿Y dónde me siento?", next: "desk" },
      { id: "more", label: "Tengo otra pregunta.", spoken: "Tengo otra pregunta.", next: "welcome" },
      { id: "bye", label: "Gracias, Roxy.", spoken: "Gracias, Roxy.", next: null },
    ],
  },
  desk: {
    id: "desk",
    kicker: "TU EQUIPO",
    text: "Podés sentarte junto a tu equipo, en el lugar que acordaron para vos. Si todavía no te indicaron cuál es, avisame y te ayudo a ubicarlo.",
    options: [
      { id: "first-day", label: "¿Algún consejo para empezar?", spoken: "¿Algún consejo para empezar?", next: "first-day" },
      { id: "more", label: "Tengo otra pregunta.", spoken: "Tengo otra pregunta.", next: "welcome" },
      { id: "bye", label: "Gracias, ya voy para allá.", spoken: "Gracias, ya voy para allá.", next: null },
    ],
  },
});

export function getOfficeDialogueNode(nodeId, avatar) {
  const node = OFFICE_DIALOGUE[nodeId];
  if (nodeId !== "welcome" || avatar !== "victoria") return node;
  return { ...node, text: node.text.replace("Fernando", "Victoria").replace("Bienvenido", "Bienvenida") };
}

export const OFFICE_ALFREDO = Object.freeze({ id: "office-alfredo", name: "Alfredo", role: "Seguridad del edificio", avatar: "AS" });

const alfredoFollowUp = [
  { id: "more", label: "Tengo otra pregunta.", spoken: "Tengo otra pregunta.", next: "welcome" },
  { id: "bye", label: "Gracias, Alfredo.", spoken: "Gracias, Alfredo.", next: null },
];

export const OFFICE_ALFREDO_DIALOGUE = Object.freeze({
  welcome: {
    id: "welcome",
    kicker: "ORIENTACIÓN GENERAL · SEGURIDAD",
    text: "Soy Alfredo, del equipo de seguridad. Si hay que evacuar el edificio, te ayudo a saber qué hacer.",
    options: [
      { id: "alarm", label: "¿Qué hago si suena la alarma?", spoken: "¿Qué hago si suena la alarma?", next: "alarm" },
      { id: "route", label: "¿Por dónde salimos?", spoken: "¿Por dónde salimos?", next: "route" },
      { id: "meeting", label: "¿Qué hacemos al salir?", spoken: "¿Qué hacemos al salir?", next: "meeting" },
      { id: "bye", label: "Gracias, Alfredo.", spoken: "Gracias, Alfredo.", next: null },
    ],
  },
  alarm: {
    id: "alarm",
    kicker: "EVACUACIÓN · ALARMA",
    text: "Dejá tus cosas, avisá a quien tengas cerca y caminá hacia la salida señalizada. Seguí al personal de seguridad; no uses los ascensores.",
    options: alfredoFollowUp,
  },
  route: {
    id: "route",
    kicker: "EVACUACIÓN · RECORRIDO",
    text: "Seguí la señalización hasta la escalera de evacuación del piso. Mantené libres las puertas y los pasillos. Si una ruta está bloqueada, pedí a seguridad que te indique la alternativa.",
    options: alfredoFollowUp,
  },
  meeting: {
    id: "meeting",
    kicker: "EVACUACIÓN · AFUERA",
    text: "Andá al punto de encuentro señalizado, confirmá tu presencia con el responsable del grupo y esperá allí. Volvemos a entrar solo cuando seguridad lo autorice.",
    options: alfredoFollowUp,
  },
});
