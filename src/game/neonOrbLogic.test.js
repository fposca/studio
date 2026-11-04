import test from "node:test";
import * as THREE from "three";
import { createNeonOrbAbility } from "./neonOrbAbility.js";
import assert from "node:assert/strict";
import { segmentSphereHit, segmentVerticalCapsuleHit } from "./neonOrbLogic.js";

test("the orb detects a target even when a frame steps past it", () => {
  assert.ok(Math.abs(segmentSphereHit({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -2 }, { x: 0, y: 0, z: -1 }, .2) - .4) < 1e-8);
  assert.equal(segmentSphereHit({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -2 }, { x: 2, y: 0, z: -1 }, .2), null);
});

test("the boss orb reaches Medusa from the temple corridor when the combat range is extended", () => {
  const scene = new THREE.Scene(), hits = [];
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => [{ kind: "parthenon-medusa", position: new THREE.Vector3(0, 1.45, -29), radius: .75 }],
    getColliders: () => [], getMaxRange: () => 40, onHit: target => hits.push(target.kind),
  });
  const player = { x: 0, y: 0, z: -8 };
  assert.equal(orb.fire(player, Math.PI), true);
  for (let i = 0; i < 70 && hits.length === 0; i++) orb.update(.05, player, i * .05);
  assert.deepEqual(hits, ["parthenon-medusa"]);
  orb.dispose();
});

test("a low Neonboy orb connects with Neon Evil's legs without hitting empty space beside him", () => {
  const start = new THREE.Vector3(0, .6, 2);
  const end = new THREE.Vector3(0, .6, -2);
  const boss = new THREE.Vector3(0, 1.48, 0);
  assert.equal(segmentSphereHit(start, end, new THREE.Vector3(0, 1.7, 0), 1.01), null);
  assert.ok(segmentVerticalCapsuleHit(start, end, boss, .88, .55) !== null);
  assert.equal(segmentVerticalCapsuleHit(
    new THREE.Vector3(1.5, .6, 2), new THREE.Vector3(1.5, .6, -2), boss, .88, .55,
  ), null);

  const scene = new THREE.Scene(), hits = [];
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => [{ kind: "matrix-enemy", id: "neon-evil", position: boss, radius: .72, capsuleHalfHeight: .55 }],
    getColliders: () => [], onHit: target => hits.push(target.id),
  });
  const player = { x: 0, y: 0, z: 2 };
  assert.equal(orb.fire(player, Math.PI, 0, start), true);
  for (let i = 0; i < 12 && hits.length === 0; i += 1) orb.update(.05, player, i * .05);
  assert.deepEqual(hits, ["neon-evil"]);
  orb.dispose();
});

test("a returning orb damages Neon Evil when it crosses him, once per return", () => {
  const scene = new THREE.Scene(), hits = [];
  const player = {x: 0, y: 0, z: 0};
  const boss = {kind: "matrix-enemy", id: "neon-evil", position: new THREE.Vector3(0, 1.5, -4), radius: .82, capsuleHalfHeight: .9, returnHit: true};
  let targetPresent = false;
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => targetPresent ? [boss] : [], getColliders: () => [],
    onHit: target => hits.push({id: target.id, returning: Boolean(target.returning)}),
  });
  assert.equal(orb.fire(player, Math.PI), true);
  for (let i = 0; i < 16; i++) orb.update(.05, player, i * .05);
  assert.equal(orb.recall(), true);
  targetPresent = true;
  for (let i = 16; i < 60; i++) orb.update(.05, player, i * .05);
  assert.deepEqual(hits, [{id: "neon-evil", returning: true}]);
  orb.dispose();
});

test("an outward hit does not count again just because the orb turns back at the same spot", () => {
  const scene = new THREE.Scene(), hits = [];
  const player = {x: 0, y: 0, z: 0};
  const boss = {kind: "matrix-enemy", id: "neon-evil", position: new THREE.Vector3(0, 1.5, -4), radius: .82, capsuleHalfHeight: .9, returnHit: true};
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => [boss], getColliders: () => [], onHit: target => hits.push(Boolean(target.returning)),
  });
  assert.equal(orb.fire(player, Math.PI), true);
  for (let i = 0; i < 60; i++) orb.update(.05, player, i * .05);
  assert.deepEqual(hits, [false]);
  orb.dispose();
});
