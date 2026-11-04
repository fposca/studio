import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { advanceRealityChest, EMPTY_REALITY_CHEST } from "./halloweenRealityChestLogic.js";
import { createHalloweenGlassesChest, chestBlocksMovement, REALITY_CHEST, CONTAINED_GLASSES_POSITION } from "./halloweenGlassesChest.js";
import { STORE_OBSTACLES } from "../../src/game/recordStoreLayout.js";
import { createHalloweenRealityKeyPickup, REALITY_KEY_POSITION } from "./halloweenRealityKeyPickup.js";
import { canRevealRealityKey } from "./halloweenBelfegorLogic.js";
import { disposeObjects } from "../../src/game/disposeGameObjects.js";

test("the dropped key unlocks the box after pickup; glasses require an open lid", () => {
  let state = EMPTY_REALITY_CHEST;
  assert.equal(advanceRealityChest(state, "toggle"), state);
  assert.equal(advanceRealityChest(state, "collect"), state);
  assert.equal(advanceRealityChest(state, "ask"), state, "speaking does not put the key directly in the inventory");
  state = advanceRealityChest(state, "takeKey");
  assert.equal(state.keyOwned, true);
  assert.equal(advanceRealityChest(state, "takeKey"), state, "the key is collected only once");
  assert.equal(advanceRealityChest(state, "collect"), state);
  state = advanceRealityChest(state, "toggle");
  state = advanceRealityChest(state, "toggle");
  assert.equal(state.collected, false, "players may close the box without taking the glasses");
  state = advanceRealityChest(state, "toggle");
  state = advanceRealityChest(state, "collect");
  assert.equal(state.collected, true);
  assert.equal(advanceRealityChest(state, "collect"), state, "pickup is idempotent");
  state = advanceRealityChest(state, "toggle");
  assert.equal(advanceRealityChest(state, "toggle").open, true, "the empty box can be reopened");
  assert.deepEqual(advanceRealityChest(state, "reset"), EMPTY_REALITY_CHEST);
});

test("the hinged wooden chest is solid, reachable, and reverses smoothly without removing its contents", () => {
  const scene = new THREE.Scene();
  const chest = createHalloweenGlassesChest(scene);
  const closedBounds = new THREE.Box3().setFromObject(chest.root);
  assert.ok(closedBounds.min.y >= 0);
  assert.ok(closedBounds.max.y < .7, "the chest has human scale");
  assert.ok(closedBounds.containsPoint(new THREE.Vector3(...Object.values(CONTAINED_GLASSES_POSITION))));
  assert.ok(chestBlocksMovement(REALITY_CHEST.x, REALITY_CHEST.z));
  const approach = { x: REALITY_CHEST.x + 1.1, z: REALITY_CHEST.z };
  assert.equal(chestBlocksMovement(approach.x, approach.z), false);
  assert.ok(Math.hypot(approach.x - REALITY_CHEST.x, approach.z - REALITY_CHEST.z) < REALITY_CHEST.reach);
  assert.equal(STORE_OBSTACLES.some(({ x, z, hx, hz }) => Math.abs(x - approach.x) < hx + .46 && Math.abs(z - approach.z) < hz + .46), false);
  for (const { x, z, hx, hz } of STORE_OBSTACLES) {
    assert.equal(Math.abs(x - REALITY_CHEST.x) < hx + REALITY_CHEST.hx && Math.abs(z - REALITY_CHEST.z) < hz + REALITY_CHEST.hz, false, "box must not intersect store furniture");
  }
  chest.update(.3, true);
  assert.equal(chest.accessible, false);
  const partial = chest.lid.rotation.x;
  chest.update(.1, false);
  assert.ok(chest.lid.rotation.x > partial, "closing mid-opening reverses the hinge");
  chest.update(1, true);
  assert.equal(chest.accessible, true);
  assert.ok(chest.lid.rotation.x < -Math.PI / 2);
  chest.update(1, false);
  assert.equal(chest.accessible, false);
  assert.equal(chest.lid.rotation.x, -0);
  let drawCalls = 0;
  chest.root.traverse((object) => { if (object.isMesh) { drawCalls++; assert.ok(object.geometry.attributes.position.count > 0); } });
  assert.ok(drawCalls <= 10, "the detailed chest batches its static geometry for mobile");
  disposeObjects([scene]);
});

test("the key stays hidden until four Belfegor attempts, then appears in another aisle", () => {
  assert.ok(Math.hypot(REALITY_KEY_POSITION.x - REALITY_CHEST.x, REALITY_KEY_POSITION.z - REALITY_CHEST.z) > 10);
  const approach = { x: REALITY_KEY_POSITION.x + .85, z: REALITY_KEY_POSITION.z };
  assert.ok(Math.hypot(approach.x - REALITY_KEY_POSITION.x, approach.z - REALITY_KEY_POSITION.z) < REALITY_KEY_POSITION.reach);
  assert.equal(STORE_OBSTACLES.some(({ x, z, hx, hz }) => Math.abs(x - approach.x) < hx + .46 && Math.abs(z - approach.z) < hz + .46), false);
  const scene = new THREE.Scene();
  const key = createHalloweenRealityKeyPickup(scene);
  const bounds = new THREE.Box3().setFromObject(key.root);
  assert.ok(bounds.getSize(new THREE.Vector3()).x < .5);
  assert.ok(bounds.max.y < .1);
  assert.equal(key.root.visible, false);
  for (let attempts = 0; attempts < 4; attempts++) {
    key.setAvailable(canRevealRealityKey(attempts));
    assert.equal(key.root.visible, false);
  }
  key.setAvailable(canRevealRealityKey(4));
  assert.equal(key.root.visible, true);
  key.setAvailable(false);
  assert.equal(key.root.visible, false);
  disposeObjects([scene]);
});
