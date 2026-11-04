// A single source of truth for NeonBoy's recorded cues. The absent combat-01
// recording is listed explicitly, so it cannot be mistaken for another line.
export const NEONBOY_VOICES = Object.freeze({
  "neonboy-intro-01": { file: "neonboy-intro-01.mp3", text: "A\u00f1o 1999... \u00bfOtra vez? \u00bfC\u00f3mo puede ser?", category: "intro", event: "scene-ready", priority: 50, cooldownMs: 0, probability: 1 },
  "neonboy-random-04": { file: "neonboy-random-04.mp3", text: "Hay algo extra\u00f1o en este lugar... Y no estoy hablando de los precios.", category: "exploration", event: "active-exploration", priority: 10, cooldownMs: 90000, probability: 1 },
  "neonboy-random-07": { file: "neonboy-random-07.mp3", text: "Si esto es una simulaci\u00f3n, por lo menos podr\u00edan mejorar los gr\u00e1ficos.", category: "exploration", event: "active-exploration", priority: 10, cooldownMs: 90000, probability: 1 },
  "neonboy-combat-01": { file: null, text: "\u00a1Elegiste al guitarrista equivocado!", category: "combat", event: "first-combat", priority: 40, cooldownMs: 0, probability: 1 },
  "neonboy-combat-02": { file: "neonboy-combat-02.mp3", text: "Para ser un demonio, habl\u00e1s demasiado.", category: "combat", event: "first-combat-fallback", priority: 40, cooldownMs: 0, probability: 1 },
  "neonboy-victory-03": { file: "neonboy-victory-03.mp3", text: "Te faltaron un par de ensayos, amigo.", category: "victory", event: "semidemon-defeated", priority: 70, cooldownMs: 0, probability: 0.85 },
  "neonboy-damage-02": { file: "neonboy-damage-02.mp3", text: "\u00a1Vas a pagar por eso!", category: "damage", event: "heart-lost", priority: 30, cooldownMs: 20000, probability: 1 },
  "neonboy-special-01": { file: "neonboy-special-01.mp3", text: "\u00a1Yippee-kai-ie, hijo de mala madre!", category: "victory", event: "semidemon-defeated", priority: 70, cooldownMs: 0, probability: 0.15 },
  "neonboy-special-02": { file: "neonboy-special-02.mp3", text: "Los demonios tienen el infierno... Yo tengo mi guitarra.", category: "victory", event: "judge-defeated", priority: 80, cooldownMs: 0, probability: 1 },
});

export function chooseExplorationCue(previousId, random = Math.random) {
  const ids = ["neonboy-random-04", "neonboy-random-07"];
  const available = ids.filter((id) => id !== previousId);
  return available[Math.floor(random() * available.length)] || ids[0];
}

export function chooseDemonVictoryCue(random = Math.random) {
  return random() < NEONBOY_VOICES["neonboy-special-01"].probability
    ? "neonboy-special-01" : "neonboy-victory-03";
}

export function resolveCombatCue(urls) {
  const file = NEONBOY_VOICES["neonboy-combat-01"].file;
  return file && urls[file] ? "neonboy-combat-01" : "neonboy-combat-02";
}
