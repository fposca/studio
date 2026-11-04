export const CURSED_HOPLITE = Object.freeze({
  health: 4, speed: 1.35, patrolSpeed: .65, detectRange: 8.5,
  attackRange: 1.65, windup: .95, recovery: 2.05, hurtTime: .55,
});

export const MEDUSA = Object.freeze({
  health: 6, gazeRange: 15, gazeHalfAngle: .68,
  charge: 1.65, gaze: 3, vulnerable: 3.9, recovery: 2.6,
  petrifyRate: .34, petrifyRecovery: .29, stunTime: .8,
  groundSpeed: 5.4, chaseSpeed: 1.75, stopRange: 2.2,
});

export const MEDUSA_ARENA = Object.freeze({ minX: -10.6, maxX: 10.6, minZ: -38.8, maxZ: -27.2 });

export function medusaPathClear(start, end, canStand) {
  const distance = Math.hypot(end.x - start.x, end.z - start.z);
  const samples = Math.ceil(distance / .4);
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    if (!canStand(start.x + (end.x - start.x) * t, start.z + (end.z - start.z) * t)) return false;
  }
  return true;
}

export function findMedusaRoute(start, target, canStand) {
  const width = 27, height = 15, step = .8, minX = -10.4, minZ = -38.4;
  const count = width * height, free = new Uint8Array(count);
  const point = index => ({ x: minX + index % width * step, z: minZ + Math.floor(index / width) * step });
  let startIndex = -1, targetIndex = -1, startDistance = Infinity, targetDistance = Infinity;
  for (let index = 0; index < count; index++) {
    const p = point(index);
    if (!canStand(p.x, p.z)) continue;
    free[index] = 1;
    const fromStart = (p.x - start.x) ** 2 + (p.z - start.z) ** 2;
    const fromTarget = (p.x - target.x) ** 2 + (p.z - target.z) ** 2;
    if (fromStart < startDistance) { startDistance = fromStart; startIndex = index; }
    if (fromTarget < targetDistance) { targetDistance = fromTarget; targetIndex = index; }
  }
  if (startIndex < 0 || targetIndex < 0) return [];
  const previous = new Int16Array(count).fill(-1);
  const cost = new Float32Array(count).fill(Infinity);
  const open = [startIndex], queued = new Uint8Array(count);
  cost[startIndex] = 0; queued[startIndex] = 1;
  while (open.length) {
    let best = 0, bestEstimate = Infinity;
    for (let i = 0; i < open.length; i++) {
      const p = point(open[i]), estimate = cost[open[i]] + Math.hypot(p.x - target.x, p.z - target.z);
      if (estimate < bestEstimate) { bestEstimate = estimate; best = i; }
    }
    const current = open.splice(best, 1)[0]; queued[current] = 0;
    if (current === targetIndex) {
      const route = [];
      for (let at = current; at !== startIndex; at = previous[at]) route.push(point(at));
      return route.reverse();
    }
    const x = current % width, z = Math.floor(current / width);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nx >= width || nz < 0 || nz >= height) continue;
      const next = nz * width + nx;
      if (!free[next] || (dx && dz && (!free[z * width + nx] || !free[nz * width + x]))) continue;
      const newCost = cost[current] + Math.hypot(dx, dz) * step;
      if (newCost >= cost[next]) continue;
      cost[next] = newCost; previous[next] = current;
      if (!queued[next]) { open.push(next); queued[next] = 1; }
    }
  }
  return [];
}

export function medusaPhase(health) {
  return health <= 2 ? 3 : health <= 4 ? 2 : 1;
}

export function segmentBlockedByCover(start, end, covers) {
  const dx = end.x - start.x, dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared < .0001) return false;
  return covers.some(cover => {
    if (cover.unsafe || cover.x === 999) return false;
    const t = Math.max(0, Math.min(1, ((cover.x - start.x) * dx + (cover.z - start.z) * dz) / lengthSquared));
    return Math.hypot(start.x + dx * t - cover.x, start.z + dz * t - cover.z) < cover.radius + .18;
  });
}

export function medusaCanSee(player, medusa, facing, covers, range = MEDUSA.gazeRange) {
  const dx = player.x - medusa.x, dz = player.z - medusa.z;
  const distance = Math.hypot(dx, dz);
  if (distance > range || distance < .1) return false;
  const angle = Math.atan2(dx, dz) - facing;
  if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) > MEDUSA.gazeHalfAngle) return false;
  return !segmentBlockedByCover(medusa, player, covers);
}
