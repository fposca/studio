import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createNeonOrbAbility } from "../../src/game/neonOrbAbility.js";
import { createHalloweenDemonEncounter } from "./halloweenDemonEncounter.js";
import { HALLOWEEN_ORB_RANGE, resolveHalloweenOrbAim, resolveHalloweenOrbHeading } from "./halloweenCombatAim.js";

function withCanvas(testBody) {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try { testBody(); } finally { globalThis.document = previousDocument; }
}

test("third-person aim follows NeonBoy's facing direction with a small correction", () => {
  const player = { x: 0, z: 0 };
  const nearCenter = { position: { x: 1, z: -5 } };
  const outsideView = { position: { x: 5, z: -5 } };
  assert.equal(resolveHalloweenOrbHeading(Math.PI, player, null), Math.PI);
  assert.ok(Math.abs(resolveHalloweenOrbHeading(Math.PI, player, nearCenter) - Math.atan2(1, -5)) < 1e-9);
  assert.equal(resolveHalloweenOrbHeading(Math.PI, player, outsideView), Math.PI);
  assert.equal(resolveHalloweenOrbHeading(Math.PI, player, { position: { x: 0, z: -HALLOWEEN_ORB_RANGE - 1 } }), Math.PI);
  const aim = resolveHalloweenOrbAim({ firstPerson: false, yaw: 0 }, { ...player, yaw: Math.PI / 2 }, { position: { x: 5, z: 0 } });
  assert.equal(aim.heading, Math.PI / 2);
  assert.equal(aim.pitch, 0);
});

test("first-person shot goes through the exact center of the sight", () => {
  const view = { firstPerson: true, yaw: .3, firstPitch: -.15 };
  const aim = resolveHalloweenOrbAim(view, { x: 0, z: 0, yaw: 0 }, { position: { x: 5, z: 0 } });
  assert.equal(aim.heading, Math.PI + view.yaw);
  assert.equal(aim.pitch, view.firstPitch);
});

test("a low orb from the entrance hits the revealed demon once at the longer Halloween range", () => withCanvas(() => {
  const scene = new THREE.Scene();
  const demon = createHalloweenDemonEncounter(scene);
  assert.equal(demon.getOrbTarget(), null);
  demon.setVision(true);
  const target = demon.getOrbTarget();
  assert.equal(target.returnHit, true);
  const player = { x: demon.position.x, y: 0, z: 11.1 };
  const hits = [];
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => { const current = demon.getOrbTarget(); return current ? [current] : []; },
    getColliders: () => [], getMaxRange: () => HALLOWEEN_ORB_RANGE,
    onHit: () => hits.push(demon.hit()),
  });
  assert.equal(orb.fire(player, Math.PI, 0, new THREE.Vector3(player.x, .65, player.z)), true);
  for (let i = 0; i < 95; i++) orb.update(.05, player, i * .05);
  assert.deepEqual(hits, [2]);
  assert.equal(demon.health, 2);
  orb.dispose(); demon.stop();
}));

test("an orb fired from the demon's side follows NeonBoy instead of the camera", () => withCanvas(() => {
  const scene = new THREE.Scene();
  const demon = createHalloweenDemonEncounter(scene);
  demon.setVision(true);
  const player = { x: demon.position.x - 5, y: 0, z: demon.position.z, yaw: Math.PI / 2 };
  const aim = resolveHalloweenOrbAim({ firstPerson: false, yaw: 0 }, player, demon.getOrbTarget());
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => [demon.getOrbTarget()],
    getColliders: () => [],
    getMaxRange: () => HALLOWEEN_ORB_RANGE,
    onHit: () => demon.hit(),
  });
  assert.equal(orb.fire(player, aim.heading, aim.pitch), true);
  for (let i = 0; i < 95; i++) orb.update(.05, player, i * .05);
  assert.equal(demon.health, 2);
  orb.dispose(); demon.stop();
}));

test("a shelf collision still stops the orb before the demon", () => withCanvas(() => {
  const scene = new THREE.Scene();
  const demon = createHalloweenDemonEncounter(scene);
  demon.setVision(true);
  const player = { x: demon.position.x, y: 0, z: 2 };
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2, 2, .3));
  shelf.position.set(demon.position.x, 1, -2);
  shelf.updateMatrixWorld(true);
  const orb = createNeonOrbAbility(scene, {
    getTargets: () => [demon.getOrbTarget()], getColliders: () => [shelf],
    getMaxRange: () => HALLOWEEN_ORB_RANGE, onHit: () => demon.hit(),
  });
  orb.fire(player, Math.PI);
  for (let i = 0; i < 60; i++) orb.update(.05, player, i * .05);
  assert.equal(demon.health, 3);
  orb.dispose(); demon.stop(); shelf.geometry.dispose();
}));
