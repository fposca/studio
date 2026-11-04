const urls = import.meta.glob([
  "./audio/sfx/*.wav",
  "!./audio/sfx/boss-spawn.wav",
  "!./audio/sfx/boss-death.wav",
  "!./audio/sfx/boss-teleport.wav",
], { eager: true, query: "?url", import: "default" });
const sources = Object.fromEntries(Object.entries(urls).map(([path, url]) => [path.split("/").pop().replace(".wav", ""), url]));
sources["boss-spawn"] = new URL("../../src/assets/neonboy-animaciones/voces/demonio final/aparecerDemonio.mp3", import.meta.url).href;
sources["boss-death"] = new URL("../../src/assets/neonboy-animaciones/voces/demonio final/desapareceDemobio.mp3", import.meta.url).href;
sources["boss-teleport-in"] = sources["boss-spawn"];
sources["boss-teleport-out"] = sources["boss-death"];
// Music and dialogue remain on their existing players; these are short, restrained cues.
export const SFX = Object.freeze({
  "chest-open": { volume: .42, category: "interaction", event: "wooden lid opens", priority: 3 },
  "chest-close": { volume: .34, category: "interaction", event: "wooden lid closes", priority: 3 },
  "chest-locked": { volume: .27, category: "interaction", event: "locked latch rattles", cooldown: .5, priority: 3 },
  "reality-key": { volume: .3, category: "interaction", event: "Collect the reality key", priority: 3 },
  "telefono-ring": { volume: .19, category: "ambient", event: "incoming call", cooldown: 0, priority: 5 },
  "telefono-pickup": { volume: .24, category: "interaction", event: "answer call", priority: 3 },
  "telefono-static": { volume: .13, category: "interaction", event: "phone line", priority: 2 },
  "telefono-hangup": { volume: .22, category: "interaction", event: "end call", priority: 3 },
  "matrix-activate": { volume: .22, category: "interaction", event: "vision on", priority: 3 },
  "matrix-deactivate": { volume: .2, category: "interaction", event: "vision off", priority: 3 },
  "matrix-glitch": { volume: .14, category: "ambient", event: "vision anomaly", cooldown: 12, priority: 1 },
  "matrix-secret": { volume: .21, category: "interaction", event: "new secret", cooldown: .7, priority: 3 },
  "mirror-whisper": { volume: .14, category: "ambient", event: "mirror nearby", cooldown: 18, priority: 1 },
  "mirror-reveal": { volume: .22, category: "interaction", event: "mirror revealed", priority: 3 },
  "vhs-pickup": { volume: .25, category: "interaction", event: "collect VHS", priority: 3 },
  "vhs-insert": { volume: .21, category: "interaction", event: "insert VHS", priority: 3 },
  "vhs-static": { volume: .11, category: "interaction", event: "VHS ready", priority: 2 },
  "vhs-play": { volume: .18, category: "interaction", event: "video playback", priority: 3 },
  "electric-flicker": { volume: .13, category: "ambient", event: "light outage", cooldown: 15, priority: 1 },
  "demon-hit": { volume: .25, category: "combat", event: "orb hit", priority: 3 },
  "demon-code-hit": { volume: .33, category: "combat", event: "code damaged", priority: 3 },
  "demon-shield": { volume: .3, category: "combat", event: "shield deflection", priority: 3 },
  "demon-taunt": { volume: .30, category: "combat", event: "immune taunt", cooldown: 2.8, priority: 2 },
  "demon-death": { volume: .25, category: "combat", event: "demon defeated", priority: 4 },
  "heart-lost": { volume: .25, category: "combat", event: "heart lost", priority: 4 },
  "game-over": { volume: .24, category: "combat", event: "game over", priority: 5 },
  "boss-spawn": { volume: .22, category: "combat", event: "judge appears", priority: 4 },
  "boss-question": { volume: .18, category: "interaction", event: "judge question", priority: 3 },
  "boss-correct": { volume: .2, category: "interaction", event: "judge recognizes answer", priority: 3 },
  "boss-wrong": { volume: .2, category: "interaction", event: "judge taunts", priority: 3 },
  "boss-fury": { volume: .24, category: "combat", event: "judge combat", priority: 4 },
  "boss-teleport-in": { volume: .2, category: "combat", event: "judge reappears", priority: 4 },
  "boss-teleport-out": { volume: .2, category: "combat", event: "judge disappears", priority: 4 },
  "boss-orb": { volume: .19, category: "combat", event: "dark orb", priority: 3 },
  "boss-wave": { volume: .21, category: "combat", event: "infernal wave", priority: 3 },
  "boss-hit": { volume: .24, category: "combat", event: "judge hit", priority: 4 },
  "boss-death": { volume: .30, category: "combat", event: "judge defeat", priority: 4 },
  "anniversary-unlock": { volume: .26, category: "interaction", event: "vinyl unlocked", priority: 4 },
});
export function createHalloweenSfx() {
  const cache = new Map(), active = new Set(), last = new Map();
  function get(id) {
    if (!sources[id]) return null;
    if (!cache.has(id)) {
      const audio = new Audio(sources[id]);
      audio.preload = "none";
      audio.addEventListener("ended", () => active.delete(id));
      audio.addEventListener("pause", () => active.delete(id));
      cache.set(id, audio);
    }
    return cache.get(id);
  }
  function stop(id) {
    const audio = cache.get(id);
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
    active.delete(id);
  }
  return {
    play(id, { loop = false, force = false } = {}) {
      const meta = SFX[id], audio = get(id);
      if (!meta || !audio) return null;
      const now = performance.now();
      if (!force && now - (last.get(id) ?? -Infinity) < (meta.cooldown ?? 0) * 1000) return audio;
      if (!force && active.has(id)) return audio;
      if (active.size >= 3) {
        const low = [...active].find((other) => SFX[other].priority < meta.priority);
        if (!low) return null;
        stop(low);
      }
      last.set(id, now);
      audio.loop = loop;
      audio.volume = meta.volume;
      audio.currentTime = 0;
      active.add(id);
      Promise.resolve(audio.play()).catch(() => active.delete(id));
      return audio;
    },
    stop,
    stopAll() { for (const id of [...active]) stop(id); },
    dispose() {
      for (const id of cache.keys()) {
        stop(id);
        cache.get(id).removeAttribute("src");
        cache.get(id).load();
      }
      cache.clear(); last.clear();
    },
  };
}
