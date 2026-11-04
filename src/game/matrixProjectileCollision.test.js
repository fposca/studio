import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {firstMatrixProjectileImpact} from './matrixProjectileCollision.js';

const raycaster = new THREE.Raycaster();
const shot = (z, y = 1.18) => new THREE.Vector3(0, y, z);
const player = {x: 0, y: 0, z: -4};

function sign(z, y = 1.18) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, .6, .09));
  mesh.position.set(0, y, z);
  mesh.updateMatrixWorld(true);
  return mesh;
}

test('enemy fireball hits a thin sign before the player, even in one long frame', () => {
  const impact = firstMatrixProjectileImpact(shot(0), shot(-5), player, [sign(-2)], raycaster);
  assert.equal(impact?.kind, 'cover');
  assert.ok(impact.point.z > -2.1 && impact.point.z < -1.9);
});

test('cover behind the player does not prevent a hit', () => {
  const impact = firstMatrixProjectileImpact(shot(0), shot(-5), player, [sign(-4.8)], raycaster);
  assert.equal(impact?.kind, 'player');
  assert.ok(impact.point.z > -4);
});

test('fireball passes a sign only when its path actually clears the panel', () => {
  const impact = firstMatrixProjectileImpact(shot(0), shot(-5), player, [sign(-2, 3)], raycaster);
  assert.equal(impact?.kind, 'player');
  assert.equal(firstMatrixProjectileImpact(shot(0, 3), shot(-5, 3), player, [], raycaster), null);
});

test('the visible fireball halo collides with a low boss sign before the core crosses it', () => {
  const panel = sign(-2, .6);
  const bounds = new THREE.Box3().setFromObject(panel).expandByScalar(.68);
  const impact = firstMatrixProjectileImpact(shot(0, 1.5), shot(-5, 1.5), player, [panel], raycaster, [bounds]);
  assert.equal(impact?.kind, 'cover');
  assert.ok(impact.point.z > -2);
});
