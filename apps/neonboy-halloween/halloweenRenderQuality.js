// Keep mobile detail visible without asking low-end GPUs to draw at full device DPR.
export function chooseHalloweenPixelRatio(width, height, devicePixelRatio, touchDevice, lowPowerMobile) {
  const maxRatio = touchDevice ? (lowPowerMobile ? 1.3 : 1.65) : 1.25;
  const pixelBudget = touchDevice ? (lowPowerMobile ? 700_000 : 1_200_000) : Infinity;
  const viewportPixels = Math.max(1, width) * Math.max(1, height);
  return Math.max(1, Math.min(Math.max(1, devicePixelRatio || 1), maxRatio, Math.sqrt(pixelBudget / viewportPixels)));
}
