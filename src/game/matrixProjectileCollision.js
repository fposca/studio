import * as THREE from 'three';
import {segmentVerticalCapsuleHit} from './neonOrbLogic.js';

// Compare hits along the whole frame's flight segment so fast shots cannot skip thin signs.
export function firstMatrixProjectileImpact(start, end, player, colliders, raycaster, signBounds = []) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 1e-9) return null;
  direction.divideScalar(length);
  raycaster.set(start, direction);
  raycaster.far = length;
  const cover = raycaster.intersectObjects(colliders, false)[0];
  let coverDistance = cover?.distance ?? Infinity;
  let coverPoint = cover?.point ?? null;
  // The fuchsia blast has a broad visible halo; stop it when that halo reaches a sign.
  const boxPoint = new THREE.Vector3();
  for (const box of signBounds) {
    const point = box.containsPoint(start) ? start : raycaster.ray.intersectBox(box, boxPoint);
    if (!point) continue;
    const distance = start.distanceTo(point);
    if (distance <= length && distance < coverDistance) {coverDistance = distance; coverPoint = point.clone();}
  }
  const playerCenter = {x: player.x, y: player.y + 1.18, z: player.z};
  const playerTime = segmentVerticalCapsuleHit(start, end, playerCenter, .55, .2);
  const playerDistance = playerTime === null ? Infinity : playerTime * length;
  if (coverPoint && coverDistance <= playerDistance) return {kind: 'cover', point: coverPoint};
  if (playerTime !== null) return {kind: 'player', point: start.clone().lerp(end, playerTime)};
  return null;
}
