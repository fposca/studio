const line = (id, speaker, text) => Object.freeze({ id, speaker, text, futureAudio: `/audio/trono/${id}.mp3` });
export const THRONE_CONVERSATION_NPC = Object.freeze({ id: "soberano", name: "El Soberano del Abismo", role: "Guardián de la transmisión", avatar: "SA" });
export const THRONE_DIALOGUES = Object.freeze({
  arrival: [
    line("voz-trono-01", "VOZ DEL TRONO", "Finalmente llegaste, NeonBoy."),
    line("neonboy-trono-01", "NEONBOY", "Bueno... Por lo menos esta vez alguien me estaba esperando."),
    line("voz-trono-02", "VOZ DEL TRONO", "Te observé atravesar las puertas. Cada mundo. Cada combate. Cada recuerdo."),
    line("neonboy-trono-02", "NEONBOY", "¿Y no tenías nada mejor que hacer?"),
    line("voz-trono-03", "VOZ DEL TRONO", "Reuniste lo que había sido separado. Ahora la señal puede volver a despertar."),
    line("neonboy-trono-03", "NEONBOY", "Pará un segundo... ¿Me estás diciendo que todo esto fue una trampa?"),
    line("voz-trono-04", "VOZ DEL TRONO", "Eso depende de lo que hagas a continuación."),
  ],
  encounter: [
    line("soberano-01", "SOBERANO", "Vos creés que estás reparando el universo."),
    line("neonboy-soberano-01", "NEONBOY", "Bueno, alguien tiene que hacer el trabajo sucio."),
    line("soberano-02", "SOBERANO", "Pero cada fragmento que recuperaste acercó la señal a su forma original."),
    line("neonboy-soberano-02", "NEONBOY", "¿Entonces me estuvieron usando?"),
    line("soberano-03", "SOBERANO", "No conozco a quien te envió. Pero conozco lo que intenta despertar."),
    line("neonboy-soberano-03", "NEONBOY", "Entonces dejá de hablar en acertijos y decime cómo detenerlo."),
    line("soberano-04", "SOBERANO", "La verdad no puede entregarse a quien todavía no es capaz de sostenerla."),
    line("neonboy-soberano-04", "NEONBOY", "Listo... Otro demonio que se recibió de filósofo."),
    line("soberano-05", "SOBERANO", "Demostrá que tu voluntad es más fuerte que la señal."),
  ],
  shield: [
    line("soberano-combate-01", "SOBERANO", "La señal responde a tu presencia... Como si te conociera."),
    line("neonboy-combate-01", "NEONBOY", "Sí, ya me dijeron eso. ¿No tenés algo nuevo?"),
  ],
  fracture: [line("neonboy-combate-02", "NEONBOY", "¡Vamos! ¡Ya estoy cansado de este infierno!")],
  defeat: [
    line("soberano-final-01", "SOBERANO", "Creí que la señal te consumiría... Pero sobreviviste."),
    line("neonboy-final-01", "NEONBOY", "Ya pasé por cosas peores. Aunque admito que esta estuvo cerca."),
    line("soberano-final-02", "SOBERANO", "Escuchame bien. El Abismo no es el origen."),
    line("neonboy-final-02", "NEONBOY", "¿Entonces dónde empezó todo?"),
    line("soberano-final-03", "SOBERANO", "La transmisión está buscando una época en la que no necesite abrir puertas para llegar a todos."),
    line("neonboy-final-03", "NEONBOY", "¿Qué significa eso?"),
    line("soberano-final-04", "SOBERANO", "Un mundo donde millones de personas entregarán voluntariamente su atención a una sola red."),
    line("neonboy-final-04", "NEONBOY", "No entiendo... ¿Qué clase de mundo es ese?"),
    line("soberano-final-05", "SOBERANO", "El futuro del tuyo."),
  ],
  future: [
    line("neonboy-futuro-01", "NEONBOY", "Un momento... Ese es el Obelisco."),
    line("soberano-final-06", "SOBERANO", "Tu ciudad. Pero ya no pertenece a tu tiempo."),
    line("neonboy-futuro-02", "NEONBOY", "¿Qué le pasó a Buenos Aires?"),
    line("soberano-final-07", "SOBERANO", "La señal aprendió a propagarse sin que nadie la obligara a entrar."),
    line("neonboy-futuro-03", "NEONBOY", "Entonces voy a tener que ir a verlo con mis propios ojos."),
    line("neonboy-final-05", "NEONBOY", "Empecé buscando una cinta en una disquería... y ahora tengo que salvar el futuro. Necesito unas vacaciones."),
  ],
});

const voiceAssets = import.meta.glob ? import.meta.glob("../assets/neonboy-animaciones/voces/trono/*.mp3", { eager: true, query: "?url", import: "default" }) : {};
const voiceById = Object.fromEntries(Object.entries(voiceAssets).map(([path, url]) => [path.split("/").at(-1).replace(/\.mp3$/i, "").toLowerCase(), url]));
export const getThroneVoiceUrl = (id) => voiceById[id?.toLowerCase()] || null;
