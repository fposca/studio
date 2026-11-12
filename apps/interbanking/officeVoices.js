// Static URLs let Vite include the recordings in this scene's separate build.
export const OFFICE_VOICES = Object.freeze({
  roxy: {
    welcome: new URL("../../src/assets/neonboy-animaciones/interbanking/¡Hola,-Fernando!-Bienvenido-a-la-oficina.-Soy-Ro.mp3", import.meta.url).href,
    welcomeVictoria: new URL("../../src/assets/neonboy-animaciones/interbanking/Hola,-Victoria!-Bienvenido-a-la-oficina.-Soy-Ro.mp3", import.meta.url).href,
    "first-day": new URL("../../src/assets/neonboy-animaciones/interbanking/Empezá-con-calma-y-conocé-el-espacio.-La-cocina.mp3", import.meta.url).href,
    desk: new URL("../../src/assets/neonboy-animaciones/interbanking/Podés-sentarte-junto-a-tu-equipo,-en-el-lugar-qu.mp3", import.meta.url).href,
  },
  fernando: {
    welcome: {
      "first-day": new URL("../../src/assets/neonboy-animaciones/interbanking/-Hola,-es-mi-primer-día-en-la-oficina.-¿Qué-me-re.mp3", import.meta.url).href,
      desk: new URL("../../src/assets/neonboy-animaciones/interbanking/Me-ayudás-a-encontrar-mi-escritorio.mp3", import.meta.url).href,
      bye: new URL("../../src/assets/neonboy-animaciones/interbanking/Gracias,-Roxy.-Voy-a-recorrer-la-oficina.mp3", import.meta.url).href,
    },
    "first-day": {
      "ask-desk": new URL("../../src/assets/neonboy-animaciones/interbanking/Perfecto.-¿Y-dónde-me-siento.mp3", import.meta.url).href,
      more: new URL("../../src/assets/neonboy-animaciones/interbanking/Tengo-otra-pregunta.mp3", import.meta.url).href,
      bye: new URL("../../src/assets/neonboy-animaciones/interbanking/Alberto-Rodriguez-2026-11-11-11-26-Gracias,-Roxy.mp3", import.meta.url).href,
    },
    desk: {
      "first-day": new URL("../../src/assets/neonboy-animaciones/interbanking/¿Algún-consejo-para-empezar.mp3", import.meta.url).href,
      more: new URL("../../src/assets/neonboy-animaciones/interbanking/Tengo-otra-pregunta.mp3", import.meta.url).href,
      bye: new URL("../../src/assets/neonboy-animaciones/interbanking/Gracias,-ya-voy-para-allá.mp3", import.meta.url).href,
    },
  },
  victoria: {
    welcome: {
      "first-day": new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-38-Hola,-es-mi-primer-día-en-la-oficina.-¿Qué-me-re.mp3", import.meta.url).href,
      desk: new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-38-¿Me-ayudás-a-encontrar-mi-escritorio.mp3", import.meta.url).href,
      bye: new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-39-Gracias,-Roxy.-Voy-a-recorrer-la-oficina.mp3", import.meta.url).href,
    },
    "first-day": {
      "ask-desk": new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-39-Perfecto.-¿Y-dónde-me-siento.mp3", import.meta.url).href,
      more: new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-39-Tengo-otra-pregunta.mp3", import.meta.url).href,
      bye: new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-39-Gracias,-Roxy.mp3", import.meta.url).href,
    },
    desk: {
      "first-day": new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-40-Algún-consejo-para-empezar.mp3", import.meta.url).href,
      more: new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-39-Tengo-otra-pregunta.mp3", import.meta.url).href,
      bye: new URL("../../src/assets/neonboy-animaciones/interbanking/Mujer-2026-11-11-11-40-Gracias,-ya-voy-para-allá.mp3", import.meta.url).href,
    },
  },
});
