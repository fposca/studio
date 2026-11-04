import assert from "node:assert/strict";
import test from "node:test";
import { medusaCanSee, medusaPhase, segmentBlockedByCover } from "./parthenonExpansionLogic.js";

test("a marble column blocks Medusa's gaze and a temporary unsafe column does not", () => {
  const medusa = { x: 0, z: 0 }, player = { x: 0, z: 7 };
  const column = { x: 0, z: 3.5, radius: .75, unsafe: false };
  assert.equal(medusaCanSee(player, medusa, 0, []), true);
  assert.equal(segmentBlockedByCover(medusa, player, [column]), true);
  assert.equal(medusaCanSee(player, medusa, 0, [column]), false);
  column.unsafe = true;
  assert.equal(medusaCanSee(player, medusa, 0, [column]), true);
  assert.equal(medusaCanSee({ x: 0, z: -7 }, medusa, 0, []), false);
  assert.equal(medusaCanSee({ x: 0, z: 20 }, medusa, 0, []), false);
});
test("boss phases turn at the configured health thresholds", () => {
  assert.equal(medusaPhase(6), 1);
  assert.equal(medusaPhase(4), 2);
  assert.equal(medusaPhase(2), 3);
});
