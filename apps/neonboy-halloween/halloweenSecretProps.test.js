import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenSecretProps, SECRET_POSITIONS, VHS_PICKUP_WIDTH } from "./halloweenSecretProps.js";
import { chestBlocksMovement } from "./halloweenGlassesChest.js";
import { GLASSES_POSITION } from "./halloweenDemonEncounter.js";
import { STORE_LAYOUT, STORE_OBSTACLES } from "../../src/game/recordStoreLayout.js";

test("both hidden pickups remain reachable from walkable aisles", () => {
  const walkable = ({ x, z }) => Math.abs(x) < STORE_LAYOUT.playerLimitX &&
    z > STORE_LAYOUT.playerBackZ && z < STORE_LAYOUT.playerFrontZ &&
    !STORE_OBSTACLES.some((obstacle) =>
      Math.abs(x - obstacle.x) < obstacle.hx + .46 &&
      Math.abs(z - obstacle.z) < obstacle.hz + .46);
  const glassesApproach = { x: -7.4, z: -8.2 };
  assert.equal(chestBlocksMovement(glassesApproach.x, glassesApproach.z), false);
  const vhsApproach = { x: -8, z: -11.8 };
  assert.equal(walkable(glassesApproach), true);
  assert.equal(walkable(vhsApproach), true);
  assert.ok(Math.hypot(glassesApproach.x - GLASSES_POSITION.x, glassesApproach.z - GLASSES_POSITION.z) < 1.55);
  assert.ok(Math.hypot(vhsApproach.x - SECRET_POSITIONS.vhs.x, vhsApproach.z - SECRET_POSITIONS.vhs.z) < SECRET_POSITIONS.vhs.reach);
});

test("VHS pickup fits a cassette-sized model and remains collectible", () => {
  const previousDocument = globalThis.document;
  const context = {
    fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, ellipse() {}, fill() {}, arc() {}, stroke() {},
    createLinearGradient() { return { addColorStop() {} }; },
  };
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => context }) };
  try {
    const props = createHalloweenSecretProps(new THREE.Scene());
    const model = new THREE.Group();
    model.add(new THREE.Mesh(new THREE.BoxGeometry(2, .4, 1), new THREE.MeshBasicMaterial()));
    assert.equal(props.mount("vhs", model), true);
    const width = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).x;
    assert.ok(Math.abs(width - VHS_PICKUP_WIDTH) < .001);
    assert.equal(props.slots.vhs.position.z, SECRET_POSITIONS.vhs.z);
    props.setVhsCollected(true);
    assert.equal(props.slots.vhs.visible, false);
    assert.equal(props.slots.secretVinyl.visible, false);
    props.setSecretVinylUnlocked(true);
    assert.equal(props.slots.secretVinyl.visible, true);
    props.dispose();
  } finally {
    globalThis.document = previousDocument;
  }
});


test("phone rests on the counter and faces the player", () => {
  const previousDocument = globalThis.document;
  const context = {
    fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, ellipse() {}, fill() {}, arc() {}, stroke() {},
    createLinearGradient() { return { addColorStop() {} }; },
  };
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => context }) };
  try {
    const props = createHalloweenSecretProps(new THREE.Scene());
    const model = new THREE.Group();
    model.add(new THREE.Mesh(new THREE.BoxGeometry(2, .4, 1), new THREE.MeshBasicMaterial()));
    assert.equal(props.mount("phone", model), true);
    props.slots.phone.updateMatrixWorld(true);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(model).min.y - 1.245) < .001);
    assert.ok(Math.abs(props.slots.phone.rotation.y - Math.PI) < .001);
    props.dispose();
  } finally {
    globalThis.document = previousDocument;
  }
});


test("mirror has a readable locator on the shop side of the wall in both visions", () => {
  const previousDocument = globalThis.document;
  const context = {
    fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, ellipse() {}, fill() {}, arc() {}, stroke() {},
    createLinearGradient() { return { addColorStop() {} }; },
  };
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => context }) };
  try {
    const props = createHalloweenSecretProps(new THREE.Scene());
    const frame = props.slots.mirror.getObjectByName("Halloween / Mirror locator");
    const title = props.slots.mirror.getObjectByName("Halloween / Mirror title");
    assert.ok(frame && title, "the mirror remains identifiable even if its optional GLB fails");
    const model = new THREE.Group();
    model.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, .12), new THREE.MeshBasicMaterial()));
    assert.equal(props.mount("mirror", model), true);
    props.slots.mirror.updateMatrixWorld(true);
    assert.ok(new THREE.Box3().setFromObject(frame).max.x < SECRET_POSITIONS.mirror.x);
    assert.ok(new THREE.Box3().setFromObject(title).max.x < SECRET_POSITIONS.mirror.x);
    const normalColor = frame.children[0].material.color.getHex();
    props.setVision(true);
    assert.notEqual(frame.children[0].material.color.getHex(), normalColor);
    assert.equal(title.visible, true);
    props.dispose();
  } finally {
    globalThis.document = previousDocument;
  }
});
