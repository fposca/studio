export const FIXED_STEP = 1 / 60;
export const PLAYER_SPAWN = Object.freeze({ x: 0, y: 0, z: 13 });
export const MAX_HEALTH = 100;
export const MOVE_SPEED = 2.8;
export const RUN_SPEED = 4.4;
export const JUMP_SPEED = 7;
export const GRAVITY = 20;
export const BODY_OFFSET = 0.9;
export const BOUNDS = Object.freeze({ left: -16.8, right: 16.8, back: -43.5, front: 21 });

export const WEAPONS = Object.freeze([
  { id: "unarmed", name: "Punos", key: "1" },
  { id: "sword", name: "Espada", key: "2" },
  { id: "hammer", name: "Martillo", key: "3" },
  { id: "crossbow", name: "Ballesta", available: false },
  { id: "axe", name: "Hacha", available: false }
]);

export const ATTACKS = Object.freeze({
  punch: { duration: 0.48, impact: 0.2, end: 0.33, reach: 1.65, damage: 25, arc: 0.15, knockback: 3.5 },
  kick: { duration: 0.76, impact: 0.34, end: 0.5, reach: 2.15, damage: 40, arc: 0.05, knockback: 5.5 },
  sword: { duration: 0.64, impact: 0.25, end: 0.39, reach: 2.5, damage: 45, arc: -0.05, knockback: 4.2 },
  hammer: { duration: 1.02, impact: 0.57, end: 0.72, reach: 2.3, damage: 75, arc: 0.05, knockback: 7 },
  enemy: { duration: 0.96, impact: 0.51, end: 0.66, reach: 1.8, damage: 12, arc: 0.25, knockback: 3.4 },
  demon: { duration: 1.12, impact: 0.6, end: 0.76, reach: 2.1, damage: 18, arc: 0.1, knockback: 4.8 }
});

export const COIN_POSITIONS = Object.freeze([
  [0, 0, 10], [0, 0, 7], [0, 0, 4], [-4, 0, 3], [-8, 0, 3], [-13.4, 0, 0],
  [-14, 0, -5], [-14, 0, -11], [-14, 0, -18], [-14, 0, -25], [-14, 0, -33], [-14, 0, -40],
  [-7, 0, -42.5], [0, 0, -42.5], [7, 0, -42.5], [14, 0, -40], [14, 0, -33],
  [14, 0, -25], [14, 0, -18], [14, 0, -10], [14, 0, -2], [8, 0, 3], [4, 0, 3], [0, 0.75, -10.4]
]);

export const ENEMY_SPAWNS = Object.freeze([
  { x: -7, y: 0, z: -0.5 }, { x: 13.7, y: 0, z: -12 },
  { x: -13.7, y: 0, z: -26 }, { x: 3.2, y: 0, z: -42 }
]);

export function movementVector(horizontal, vertical, yaw) {
  const length = Math.max(1, Math.hypot(horizontal, vertical));
  const x = horizontal / length, z = vertical / length;
  return { x: x * Math.cos(yaw) + z * Math.sin(yaw), z: -x * Math.sin(yaw) + z * Math.cos(yaw) };
}

export function canStrike(attacker, victim, attack) {
  const dx = victim.x - attacker.x, dz = victim.z - attacker.z;
  const distance = Math.hypot(dx, dz);
  if (distance > attack.reach || Math.abs(attacker.y - victim.y) > 1.35) return false;
  if (distance < 0.05) return true;
  return (Math.sin(attacker.yaw) * dx + Math.cos(attacker.yaw) * dz) / distance >= attack.arc;
}

export function attackEnvelope(kind, elapsed) {
  const attack = ATTACKS[kind];
  if (!attack || elapsed <= 0 || elapsed >= attack.duration) return 0;
  const peak = attack.impact + 0.04;
  const t = elapsed < peak ? elapsed / peak : (attack.duration - elapsed) / (attack.duration - peak);
  return t * t * (3 - 2 * t);
}
