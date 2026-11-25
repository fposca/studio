// Static URLs let Vite include the recordings in this scene's separate build.
export const OFFICE_VOICES = Object.freeze({
  roxy: {
    welcome: new URL("./voices/voice-01.mp3", import.meta.url).href,
    welcomeVictoria: new URL("./voices/voice-02.mp3", import.meta.url).href,
    "first-day": new URL("./voices/voice-03.mp3", import.meta.url).href,
    desk: new URL("./voices/voice-04.mp3", import.meta.url).href,
  },
  fernando: {
    welcome: {
      "first-day": new URL("./voices/voice-05.mp3", import.meta.url).href,
      desk: new URL("./voices/voice-06.mp3", import.meta.url).href,
      bye: new URL("./voices/voice-07.mp3", import.meta.url).href,
    },
    "first-day": {
      "ask-desk": new URL("./voices/voice-08.mp3", import.meta.url).href,
      more: new URL("./voices/voice-09.mp3", import.meta.url).href,
      bye: new URL("./voices/voice-10.mp3", import.meta.url).href,
    },
    desk: {
      "first-day": new URL("./voices/voice-11.mp3", import.meta.url).href,
      more: new URL("./voices/voice-09.mp3", import.meta.url).href,
      bye: new URL("./voices/voice-12.mp3", import.meta.url).href,
    },
  },
  victoria: {
    welcome: {
      "first-day": new URL("./voices/voice-13.mp3", import.meta.url).href,
      desk: new URL("./voices/voice-14.mp3", import.meta.url).href,
      bye: new URL("./voices/voice-15.mp3", import.meta.url).href,
    },
    "first-day": {
      "ask-desk": new URL("./voices/voice-16.mp3", import.meta.url).href,
      more: new URL("./voices/voice-17.mp3", import.meta.url).href,
      bye: new URL("./voices/voice-18.mp3", import.meta.url).href,
    },
    desk: {
      "first-day": new URL("./voices/voice-19.mp3", import.meta.url).href,
      more: new URL("./voices/voice-17.mp3", import.meta.url).href,
      bye: new URL("./voices/voice-20.mp3", import.meta.url).href,
    },
  },
});
