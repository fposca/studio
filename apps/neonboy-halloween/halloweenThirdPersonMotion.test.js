import test from "node:test";
import assert from "node:assert/strict";
import { createHalloweenThirdPersonMotion, smoothHalloweenHeading } from "./halloweenThirdPersonMotion.js";

test("arrow movement accelerates, curves between directions, and stops quickly", () => {
  const motion = createHalloweenThirdPersonMotion();
  const first = { ...motion.update(1 / 60, 1, 0, 2.8, 0) };
  assert.ok(first.dz < 0 && -first.dz < 2.8 / 60 * .3);
  for (let i = 0; i < 45; i++) motion.update(1 / 60, 1, 0, 2.8, 0);
  const turn = { ...motion.update(1 / 60, 0, 1, 2.8, 0) };
  assert.ok(turn.dx > 0 && turn.dz < 0, "the player arcs into a new direction");
  let stoppingDistance = 0;
  for (let i = 0; i < 30; i++) {
    const step = motion.update(1 / 60);
    stoppingDistance += Math.hypot(step.dx, step.dz);
  }
  assert.ok(stoppingDistance < .16);
  motion.reset();
  assert.deepEqual(motion.update(1 / 60), { dx: 0, dz: 0 });
});

test("travel stays consistent across frame rates and blocked axes stop pushing", () => {
  const distance = (fps) => {
    const motion = createHalloweenThirdPersonMotion();
    let z = 0;
    for (let i = 0; i < fps; i++) z += motion.update(1 / fps, 1, 0, 2.8, 0).dz;
    return z;
  };
  assert.ok(Math.abs(distance(30) - distance(120)) < .001);
  const motion = createHalloweenThirdPersonMotion();
  for (let i = 0; i < 30; i++) motion.update(1 / 60, 0, 1);
  motion.block({ x: true });
  assert.equal(motion.update(1 / 60).dx > 0, false);
});

test("heading follows the shortest turn even across the angle boundary", () => {
  const heading = smoothHalloweenHeading(3.12, -3.12, 1 / 60);
  assert.ok(heading > 3.12 && heading < 3.2);
  assert.equal(smoothHalloweenHeading(1, 2, 0), 1);
});
