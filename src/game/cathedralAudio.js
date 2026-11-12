import { createGameSound } from "./gameSound.js";

// Optional files are resolved at build time. An absent asset never produces a request.
const assets = import.meta.glob ? import.meta.glob("../assets/neonboy-animaciones/voces/catedral/*.{mp3,wav,ogg}", { eager: true, query: "?url", import: "default" }) : {};
const urls = Object.fromEntries(Object.entries(assets).map(([path, url]) => [path.split("/").at(-1).replace(/\.[^.]+$/, ""), url]));
export const CATHEDRAL_AUDIO_IDS = Object.freeze({
  ambience: "ambiente-catedral", wind: "viento-catedral", resonance: "resonancia-dimensional",
  memory: "pulso-recuerdo", seal: "activacion-sello", door: "apertura-puerta",
  altar: "activacion-altar", transmission: "interferencia-transmision", guitar: "primera-voz-guitarra",
});
const FALLBACKS = { memory: "chargeReady", seal: "metal", door: "heavy", altar: "chargeReady", transmission: "metal" };
export function createCathedralAudio() {
  const sound = createGameSound(), tracks = new Map(), pending = new Set(), rejected = new Set();
  let disposed = false, blocked = false, dialogue = false, unlocked = false;
  let player = { x: 0, z: 0, id: "neonboy" };
  const unlock = () => { if (!disposed && !blocked) { unlocked = true; rejected.clear(); sound.unlock(); } };
  window.addEventListener("pointerdown", unlock, true); window.addEventListener("keydown", unlock, true);
  function optional(id, loop = false) {
    const url = urls[CATHEDRAL_AUDIO_IDS[id]];
    if (!url) return null;
    if (!tracks.has(id)) {
      const audio = new Audio(url); audio.loop = loop; audio.preload = "none";
      tracks.set(id, audio);
    }
    return tracks.get(id);
  }
  function start(id, track) {
    if (pending.has(id) || rejected.has(id) || track.error) return;
    pending.add(id);
    track.play().catch(() => { if (!disposed) rejected.add(id); }).finally(() => {
      pending.delete(id);
      if (disposed || blocked || (dialogue && !["ambience", "wind"].includes(id))) track.pause();
    });
  }
  return {
    update({ suspended = false, cue = null, position }) {
      if (disposed) return;
      player = position || player; blocked = suspended || document.hidden; dialogue = !!cue;
      sound.setPaused(blocked || dialogue);
      for (const id of ["ambience", "wind"]) {
        const track = optional(id, true); if (!track) continue;
        track.volume = dialogue ? .025 : id === "wind" ? .055 : .09;
        if (blocked || !unlocked) track.pause();
        else if (track.paused && !track.error) start(id, track);
      }
      for (const [id, track] of tracks) if (!["ambience", "wind"].includes(id) && (blocked || dialogue)) track.pause();
    },
    play(id) {
      if (disposed || blocked || dialogue) return;
      const track = optional(id);
      if (track) { track.volume = .2; track.currentTime = 0; start(id, track); }
      else if (FALLBACKS[id]) sound.play({ type: FALLBACKS[id] }, player);
    },
    dispose() {
      if (disposed) return; disposed = true;
      window.removeEventListener("pointerdown", unlock, true); window.removeEventListener("keydown", unlock, true);
      sound.dispose();
      for (const audio of tracks.values()) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
      tracks.clear(); pending.clear(); rejected.clear();
    },
  };
}
