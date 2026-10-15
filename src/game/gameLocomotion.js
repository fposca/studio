const clamp = (n) => Math.max(0, Math.min(1, n));

export function landingCompression(remaining) {
  const progress = clamp(1 - remaining / 0.24);
  return remaining > 0 ? Math.sin(progress * Math.PI) : 0;
}
