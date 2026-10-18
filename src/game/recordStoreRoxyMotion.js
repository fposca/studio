export const ROXY_WAYPOINTS = Object.freeze([
  { x: 1.25, z: 3.2 },
  { x: 1.25, z: 0.0 },
  { x: 1.25, z: -3.2 }
]);

export function createRoxyPatrol() {
  return { ...ROXY_WAYPOINTS[0], target: 1, direction: 1, pause: 1.4, mode: "idle" };
}

export function advanceRoxyPatrol(patrol, dt, player, musicPlaying, talking) {
  if (talking) return { ...patrol, mode: "talking" };
  if (musicPlaying) return { ...patrol, mode: "guitar" };

  const stepTime = Math.max(0, Math.min(dt, 0.1));
  if (patrol.pause > 0) return { ...patrol, pause: Math.max(0, patrol.pause - stepTime), mode: "idle" };

  const target = ROXY_WAYPOINTS[patrol.target];
  const dx = target.x - patrol.x;
  const dz = target.z - patrol.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.03) {
    const direction = patrol.target === ROXY_WAYPOINTS.length - 1 ? -1 : patrol.target === 0 ? 1 : patrol.direction;
    return { ...patrol, x: target.x, z: target.z, target: patrol.target + direction,
      direction, pause: patrol.target === 1 ? 1.9 : 2.6, mode: "idle" };
  }

  const travel = Math.min(distance, stepTime * 0.72);
  const x = patrol.x + dx / distance * travel;
  const z = patrol.z + dz / distance * travel;
  if (player && Math.hypot(player.x - x, player.z - z) < 0.9) {
    return { ...patrol, pause: 0.45, mode: "idle" };
  }
  return { ...patrol, x, z, mode: "walk" };
}
