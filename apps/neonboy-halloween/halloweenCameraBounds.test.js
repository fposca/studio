import test from "node:test";
import assert from "node:assert/strict";
import { clampHalloweenCamera } from "./halloweenCameraBounds.js";
import { STORE_LAYOUT } from "../../src/game/recordStoreLayout.js";

test("first-person camera stays inside every store wall", () => {
  const camera = { x: 100, z: -100, y: 4 };
  assert.equal(clampHalloweenCamera(camera), camera);
  assert.equal(camera.x, STORE_LAYOUT.sideWallX - .55);
  assert.equal(camera.z, STORE_LAYOUT.backWallZ + .55);
  camera.x = -100;
  camera.z = 100;
  clampHalloweenCamera(camera);
  assert.equal(camera.x, -STORE_LAYOUT.sideWallX + .55);
  assert.equal(camera.z, STORE_LAYOUT.frontWallZ - .55);
  assert.equal(camera.y, 4);
});

