// Presentation only: never advances, normalizes or writes quest progress.
export const CHAPTER15_VISUAL_BUDGETS = Object.freeze({
  low: { dust: 18, textureHz: 4, pointLights: 3, shadowSize: 0 },
  medium: { dust: 42, textureHz: 7, pointLights: 5, shadowSize: 512 },
  high: { dust: 72, textureHz: 10, pointLights: 7, shadowSize: 1024 },
});

export const chapter15VisualTier = tier => tier === "low" || tier === "medium" ? tier : "high";
const envelope = (t, start, duration) => t <= start || t >= start + duration ? 0 : Math.sin(Math.PI * (t - start) / duration) ** 2;

export function createChapter15VisualTimeline() {
  let time = 0, previousIsolated = null, solvedAt = -100;
  const state = { time: 0, vision: false, stable: false, interference: 0, apparition: 0, reverse: false, surge: 0, surgeAge: 100 };
  return {
    update(dt, progress = {}, paused = false, reducedMotion = false) {
      if (!paused) time += Math.max(0, Math.min(.1, dt));
      const stable = Boolean(progress.channelIsolated);
      // Loading a solved save must not replay the completion effect.
      if (previousIsolated === false && stable) solvedAt = time;
      previousIsolated = stable;
      state.time = time;
      state.vision = Boolean(progress.visionActive);
      state.stable = stable;
      state.surgeAge = time - solvedAt;
      state.surge = reducedMotion ? 0 : envelope(time, solvedAt, 3.6);
      state.interference = reducedMotion || !progress.arrived ? 0
        : envelope(time % 29, 8, 3.4);
      // Only two quiet appearances per scene visit, never a recurring haunt loop.
      state.apparition = reducedMotion || !progress.hugoConsulted ? 0
        : Math.max(envelope(time, 48, 3.2), envelope(time, 157, 3.8));
      state.reverse = !reducedMotion && time % 83 > 34 && time % 83 < 37;
      return state;
    },
    get state() { return state; },
  };
}
