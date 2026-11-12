export const GRAPHICS_SETTINGS_KEY = "neonboy.halloween.graphics.v1";
export const GRAPHICS_MODES = ["auto", "low", "medium", "high", "ultra"];
export const GRAPHICS_TIERS = ["low", "medium", "high", "ultra"];

export const GRAPHICS_PROFILES = Object.freeze({
  low: Object.freeze({ label: "Baja", targetFps: 30, maxPixelRatio: 1, pixelBudget: 520_000,
    shadows: false, shadowSize: 0, lampCount: 2, fillCount: 2, particleScale: .5, far: 46 }),
  medium: Object.freeze({ label: "Media", targetFps: 30, maxPixelRatio: 1.25, pixelBudget: 800_000,
    shadows: true, shadowSize: 512, lampCount: 4, fillCount: 3, particleScale: .75, far: 60 }),
  high: Object.freeze({ label: "Alta", targetFps: 60, maxPixelRatio: 1.65, pixelBudget: 1_200_000,
    shadows: true, shadowSize: 1024, lampCount: 6, fillCount: 4, particleScale: 1, far: 75 }),
  ultra: Object.freeze({ label: "Ultra", targetFps: 60, maxPixelRatio: 2, pixelBudget: 2_000_000,
    shadows: true, shadowSize: 2048, lampCount: 6, fillCount: 4, particleScale: 1.15, far: 75 }),
});

export function readGraphicsSettings(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(GRAPHICS_SETTINGS_KEY) || "null");
    return { mode: GRAPHICS_MODES.includes(value?.mode) ? value.mode : "auto", showFps: value?.showFps === true };
  } catch { return { mode: "auto", showFps: false }; }
}

export function saveGraphicsSettings(settings, storage = globalThis.localStorage) {
  const value = { mode: GRAPHICS_MODES.includes(settings.mode) ? settings.mode : "auto", showFps: settings.showFps === true };
  try { storage.setItem(GRAPHICS_SETTINGS_KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function graphicsPixelRatio(width, height, devicePixelRatio, tier) {
  const profile = GRAPHICS_PROFILES[tier] || GRAPHICS_PROFILES.medium;
  return Math.max(.5, Math.min(Math.max(1, devicePixelRatio || 1), profile.maxPixelRatio,
    Math.sqrt(profile.pixelBudget / Math.max(1, width * height))));
}

// Samples real rendered frame spacing. Long pauses and hidden tabs are excluded.
export function createAdaptiveGraphicsQuality(initialTier = "medium") {
  let tier = GRAPHICS_TIERS.includes(initialTier) ? initialTier : "medium";
  let mode = "auto", lastTime = 0, sampleMs = 0, sampleFrames = 0, activeMs = 0;
  let slowSamples = 0, fastSamples = 0, nextChangeAt = 0;
  return {
    get tier() { return tier; },
    setMode(nextMode) {
      const valid = GRAPHICS_MODES.includes(nextMode) ? nextMode : "auto";
      if (mode === valid) return tier;
      mode = valid; slowSamples = fastSamples = 0; sampleMs = sampleFrames = 0;
      if (mode !== "auto") tier = mode;
      nextChangeAt = activeMs + 12_000;
      return tier;
    },
    resetTiming() { lastTime = 0; sampleMs = sampleFrames = 0; slowSamples = fastSamples = 0; },
    frame(now, active = true) {
      const delta = lastTime ? now - lastTime : 0;
      lastTime = now;
      if (!active || delta < 5 || delta > 500) { sampleMs = sampleFrames = 0; return null; }
      sampleMs += delta; sampleFrames++; activeMs += delta;
      if (sampleMs < 2500) return null;
      const fps = Math.round(sampleFrames * 1000 / sampleMs);
      const frameMs = Math.round(sampleMs / sampleFrames * 10) / 10;
      sampleMs = sampleFrames = 0;
      if (mode === "auto" && activeMs >= 7_500 && activeMs >= nextChangeAt) {
        const index = GRAPHICS_TIERS.indexOf(tier);
        const down = [0, 24, 43, 53][index], up = [42, 52, 58, Infinity][index];
        slowSamples = fps < down ? slowSamples + 1 : 0;
        fastSamples = fps > up ? fastSamples + 1 : 0;
        if (slowSamples >= 2 && index > 0) { tier = GRAPHICS_TIERS[index - 1]; nextChangeAt = activeMs + 15_000; slowSamples = fastSamples = 0; }
        else if (fastSamples >= 5 && index < GRAPHICS_TIERS.length - 1) { tier = GRAPHICS_TIERS[index + 1]; nextChangeAt = activeMs + 20_000; slowSamples = fastSamples = 0; }
      }
      return { fps, frameMs, tier };
    },
  };
}
