import assert from "node:assert/strict";
import test from "node:test";
import { HD_WALK_GAIT_UNITS_PER_SECOND, speedForAnimationChange, syncedGaitRate } from "../src/editors/walkGait.js";

test("HD walk rate matches measured foot travel to world movement", () => {
  const modelScale = 2.8235295267549967;
  const nativeSpeed = HD_WALK_GAIT_UNITS_PER_SECOND * modelScale;
  assert.ok(nativeSpeed > 4 && nativeSpeed < 4.1);
  assert.ok(Math.abs(syncedGaitRate(1.45, modelScale) * nativeSpeed - 1.45) < 1e-8);
  assert.equal(syncedGaitRate(0, modelScale), 0);
  assert.equal(syncedGaitRate(1.45, 0), 0);
});

test("changing animation speed changes travel at the same ratio", () => {
  assert.equal(speedForAnimationChange(1.45, 1, 2), 2.9);
  assert.equal(speedForAnimationChange(2.9, 2, 1), 1.45);
  assert.equal(speedForAnimationChange(1.45, 1, 0), 1.45);
  assert.equal(speedForAnimationChange(1.45, 0, 1), 1.45);
});
