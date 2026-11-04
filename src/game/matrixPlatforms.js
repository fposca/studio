// Waist-high props are solid at floor level and support the player once jumped onto.
export function canClearMatrixPlatform(obstacle, feetY) {
  return Number.isFinite(obstacle.platformTop) && feetY >= obstacle.platformTop - .04;
}

export function matrixPlatformHeight(x, z, fromY, toY, obstacles) {
  let height = 0;
  for (const obstacle of obstacles) {
    const top = obstacle.platformTop;
    if (!Number.isFinite(top) || top > fromY + .04 || top < toY - .04) continue;
    if (Math.abs(x - obstacle.x) <= obstacle.hx + .24 &&
        Math.abs(z - obstacle.z) <= obstacle.hz + .24) height = Math.max(height, top);
  }
  return height;
}
