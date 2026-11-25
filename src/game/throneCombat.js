import { THRONE_ARENA_COLUMNS } from "./throneLayout.js";

export const SOVEREIGN_PHASES = Object.freeze({
  1: Object.freeze({ speed: 2.8, attackInterval: 2.15, blinkInterval: 6.4, orbCount: 3, orbSpeed: 9.5, attacks: ["bolt", "melee", "bolt", "wave"] }),
  2: Object.freeze({ speed: 1.8, attackInterval: 2.6, blinkInterval: 5.1, orbCount: 3, orbSpeed: 10, attacks: ["bolt", "wave", "bolt", "hazard"] }),
  3: Object.freeze({ speed: 3.7, attackInterval: 1.7, blinkInterval: 3.8, orbCount: 5, orbSpeed: 11, attacks: ["bolt", "hazard", "bolt", "wave", "bolt", "melee"] }),
});

export function sovereignColumnBetween(start, end, clearance = .7) {
  return THRONE_ARENA_COLUMNS.find((column) => sovereignProjectileHits(start, end, column, clearance)) || null;
}

export function sovereignCanOccupy(x, z) {
  if (z < -88 || z > -51.3) return false;
  const inArena = Math.hypot(x, z + 76) <= 16.3;
  const onBridge = z >= -61.5 && Math.abs(x) <= 2.8;
  return (inArena || onBridge) &&
    THRONE_ARENA_COLUMNS.every((column) => Math.hypot(x - column.x, z - column.z) >= 1.65);
}

export function sovereignChaseTarget(boss, player, index = 0) {
  const target = { x: player.x, z: Math.max(-88, Math.min(-51.3, player.z)) };
  const blocking = sovereignColumnBetween(boss, target, 1.65);
  if (!blocking) return target;
  const preferredSide = Math.abs(boss.x - blocking.x) > .25 ? Math.sign(boss.x - blocking.x)
    : Math.abs(player.x - blocking.x) > .25 ? Math.sign(player.x - blocking.x)
      : index % 2 ? -1 : 1;
  const direction = player.z >= boss.z ? 1 : -1;
  for (const side of [preferredSide, -preferredSide]) {
    const waypoint = { x: blocking.x + side * 2.7, z: blocking.z - direction * 1.3 };
    if (sovereignCanOccupy(waypoint.x, waypoint.z)) return waypoint;
  }
  return null;
}

export function sovereignBlinkDestination(player, boss, index = 0) {
  const bearing = Math.atan2(boss.x - player.x, boss.z - player.z);
  const offsets = [.55, -.55, 1.1, -1.1, 1.65, -1.65, 2.4, -2.4];
  for (const radius of [4.6, 5.2, 6.2]) {
    for (let i = 0; i < offsets.length; i++) {
      const angle = bearing + offsets[(index + i) % offsets.length];
      const x = player.x + Math.sin(angle) * radius;
      const z = player.z + Math.cos(angle) * radius;
      if (sovereignCanOccupy(x, z) && Math.hypot(x - boss.x, z - boss.z) >= 3 &&
        !sovereignColumnBetween({ x, z }, player, .8)) return { x, z };
    }
  }
  return null;
}

export function steerSovereignVelocity(velocity, origin, target, maxTurn) {
  const speed = Math.hypot(velocity.x, velocity.z);
  if (speed === 0) return velocity;
  const current = Math.atan2(velocity.x, velocity.z);
  const desired = Math.atan2(target.x - origin.x, target.z - origin.z);
  const difference = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
  const angle = current + Math.max(-maxTurn, Math.min(maxTurn, difference));
  return { x: Math.sin(angle) * speed, z: Math.cos(angle) * speed };
}

export function sovereignProjectileHits(start, end, player, radius = 1) {
  const dx = end.x - start.x, dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  const fraction = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((player.x - start.x) * dx + (player.z - start.z) * dz) / lengthSquared))
    : 0;
  return Math.hypot(start.x + dx * fraction - player.x, start.z + dz * fraction - player.z) <= radius;
}
