import { MATRIX_LAYOUT } from './matrixLayout.js';

const ignoredObstacles = new Set(['island floor']);

// Open gate leaves move their obstacle bounds aside. Enemies can cross the
// doorway when it is clear, while closed leaves and walls remain solid.
export function canMatrixEnemyStand(x, z, obstacles, self, ignoreMemoryBlocks = false) {
  if (x <= -13 || x >= 13 || z <= MATRIX_LAYOUT.playerBackZ + 1 || z >= MATRIX_LAYOUT.playerFrontZ - 1) return false;
  return !obstacles.some(obstacle => {
    if (obstacle === self || obstacle.x === 999 || ignoredObstacles.has(obstacle.id) ||
      (ignoreMemoryBlocks && obstacle.id?.startsWith('memory block '))) return false;
    return obstacle.radius
      ? Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + .52
      : Math.abs(x - obstacle.x) < obstacle.hx + .52 && Math.abs(z - obstacle.z) < obstacle.hz + .52;
  });
}
