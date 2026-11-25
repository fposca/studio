// Reuse the existing device budgets and adaptive sampler; no Halloween save/settings are read.
import { GRAPHICS_PROFILES, createAdaptiveGraphicsQuality, graphicsPixelRatio } from "../../apps/neonboy-halloween/halloweenGraphicsQuality.js";
export { createAdaptiveGraphicsQuality, graphicsPixelRatio };
export function initialCathedralTier(device = globalThis.navigator) {
  const mobile = /Android|iPhone|iPad/i.test(device?.userAgent || "") || (device?.maxTouchPoints > 1 && /Mac/i.test(device?.platform || ""));
  if (!mobile) return "high";
  return (device?.deviceMemory && device.deviceMemory <= 4) || (device?.hardwareConcurrency && device.hardwareConcurrency <= 4) ? "low" : "medium";
}
export function cathedralProfile(tier = "high") {
  const key = tier === "ultra" ? "high" : ["low", "medium", "high"].includes(tier) ? tier : "high";
  const shared = GRAPHICS_PROFILES[key];
  return { tier: key, particleScale: key === "low" ? .28 : shared.particleScale,
    fogBanks: key === "low" ? 2 : key === "medium" ? 6 : 10,
    effectDistance: key === "low" ? 15 : key === "medium" ? 24 : 40,
    haloScale: key === "low" ? .55 : key === "medium" ? .8 : 1,
    pixelRatio: (w, h, dpr = 1) => Math.min(1, graphicsPixelRatio(w, h, dpr, key)) };
}
