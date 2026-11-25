export const OFFICE_LIMITS = Object.freeze({ minX: -11.55, maxX: 11.55, minZ: -12.45, maxZ: 10.95 });

// Aisles remain open between the rows of desks. These proxies match the
// furniture, reception counter and kitchen cabinets in officeScene.js.
export const OFFICE_OBSTACLES = Object.freeze([
  ...[-7.25, -1.9, 3.45].flatMap(z => [
    { x: -4.45, z, hx: 1.77, hz: .86 },
    { x: 4.3, z, hx: 1.77, hz: .86 },
    { x: 8.65, z, hx: 1.77, hz: .86 },
    ...[-4.45, 4.3, 8.65].flatMap(x => [-.82, .82].map(offset =>
      ({ x: x + offset, z: z + 1.14, hx: .39, hz: .37 }))),
  ]),
  { x: -3.75, z: 7.6, hx: 1.85, hz: .72 },
  { x: -6.6, z: -10.75, hx: 1.65, hz: .48 },
  { x: -2.65, z: -11.6, hx: 1.08, hz: .55 },
  { x: 2.65, z: -11.6, hx: 1.08, hz: .55 },
]);

export const OFFICE_CHARACTERS = Object.freeze([
  { x: -1.8, z: -5.2, radius: .48 }, // Roxy.
  { x: 2.7, z: -5.2, radius: .48 }, // Alfredo.
]);

export function canStandInOffice(x, z, radius = .35) {
  if (x < OFFICE_LIMITS.minX + radius || x > OFFICE_LIMITS.maxX - radius ||
    z < OFFICE_LIMITS.minZ + radius || z > OFFICE_LIMITS.maxZ - radius) return false;
  if (x < -8.55 && z < 8.8) return false; // glass wall and its corridor
  if (OFFICE_CHARACTERS.some(actor => Math.hypot(x - actor.x, z - actor.z) < actor.radius + radius)) return false;
  return !OFFICE_OBSTACLES.some(box =>
    Math.abs(x - box.x) < box.hx + radius && Math.abs(z - box.z) < box.hz + radius);
}
