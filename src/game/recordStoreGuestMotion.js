export const GUEST_WAYPOINTS = Object.freeze({
  freddy: Object.freeze([
    { x: -8.3, z: -5.8 }, { x: -6.45, z: -5.8 }, { x: -6.45, z: -1.6 },
    { x: -6.45, z: 4.3 }, { x: -8.2, z: 4.3 }
  ]),
  jason: Object.freeze([
    { x: 8.3, z: 4.2 }, { x: 8.3, z: 6.8 }, { x: 7.25, z: 9.2 },
    { x: 8.5, z: 8.2 }
  ])
});

export function createGuestPatrol(id) {
  const first = GUEST_WAYPOINTS[id]?.[0];
  if (!first) throw new Error(`Unknown store guest: ${id}`);
  return { id, x: first.x, z: first.z, target: 1, direction: 1,
    heading: id === "freddy" ? Math.PI / 3 : -Math.PI / 2,
    pause: id === "freddy" ? 2.2 : 3.1, mode: "idle" };
}

export function advanceGuestPatrol(patrol, dt, player, talking) {
  if (talking) return { ...patrol, mode: "talking" };
  const stepTime = Math.max(0, Math.min(dt, 0.1));
  if (player && Math.hypot(player.x - patrol.x, player.z - patrol.z) < 2.4) {
    return { ...patrol, pause: Math.max(patrol.pause, 0.45), mode: "idle" };
  }
  if (patrol.pause > 0) return { ...patrol, pause: Math.max(0, patrol.pause - stepTime), mode: "idle" };
  const points = GUEST_WAYPOINTS[patrol.id];
  const target = points[patrol.target];
  const dx = target.x - patrol.x, dz = target.z - patrol.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.035) {
    const direction = patrol.target === points.length - 1 ? -1 : patrol.target === 0 ? 1 : patrol.direction;
    return { ...patrol, x: target.x, z: target.z, target: patrol.target + direction,
      direction, pause: 1.4 + ((patrol.target + (patrol.id === "jason" ? 2 : 0)) % 3) * 0.65, mode: "idle" };
  }
  const heading = Math.atan2(dx, dz);
  const travel = Math.min(distance, stepTime * (patrol.id === "freddy" ? 0.73 : 0.57));
  const x = patrol.x + dx / distance * travel, z = patrol.z + dz / distance * travel;
  if (player && Math.hypot(player.x - x, player.z - z) < 2.4) {
    return { ...patrol, pause: 0.65, mode: "idle" };
  }
  return { ...patrol, x, z, heading, mode: "walk" };
}
