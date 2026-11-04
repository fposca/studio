// Segment tests prevent a fast orb from skipping small targets on slow frames.
export function segmentSphereHit(start, end, center, radius) {
  const dx = end.x - start.x, dy = end.y - start.y, dz = end.z - start.z;
  const ox = start.x - center.x, oy = start.y - center.y, oz = start.z - center.z;
  const a = dx * dx + dy * dy + dz * dz;
  if (a < 1e-9) return ox * ox + oy * oy + oz * oz <= radius * radius ? 0 : null;
  const b = 2 * (ox * dx + oy * dy + oz * dz);
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  if (c <= 0) return 0;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

// Rounded vertical hit area for tall enemies: low shots hit their legs as well as their torso.
export function segmentVerticalCapsuleHit(start, end, center, radius, halfHeight) {
  const low = center.y - halfHeight, high = center.y + halfHeight;
  const bottom = segmentSphereHit(start, end, { x: center.x, y: low, z: center.z }, radius);
  const top = segmentSphereHit(start, end, { x: center.x, y: high, z: center.z }, radius);
  let nearest = Math.min(bottom ?? Infinity, top ?? Infinity);
  const dx = end.x - start.x, dz = end.z - start.z;
  const ox = start.x - center.x, oz = start.z - center.z;
  const a = dx * dx + dz * dz;
  const c = ox * ox + oz * oz - radius * radius;
  if (c <= 0 && start.y >= low && start.y <= high) return 0;
  if (a > 1e-9) {
    const b = 2 * (ox * dx + oz * dz);
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      for (const t of [(-b - root) / (2 * a), (-b + root) / (2 * a)]) {
        const y = start.y + (end.y - start.y) * t;
        if (t >= 0 && t <= 1 && y >= low && y <= high) nearest = Math.min(nearest, t);
      }
    }
  }
  return Number.isFinite(nearest) ? nearest : null;
}
