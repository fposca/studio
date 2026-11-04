import assert from "node:assert/strict";
import test from "node:test";
import { createFirstPersonMotion } from "./firstPersonMotion.js";

test("first-person movement ramps up, normalizes diagonals and brakes within a short step", () => {
  const motion = createFirstPersonMotion();
  const first = { ...motion.update(1 / 60, 1, 0, 5) };
  assert.ok(-first.dz > 0 && -first.dz < 5 / 60 * .4);
  for (let i = 0; i < 60; i++) motion.update(1 / 60, 1, 1, 5);
  const moving = motion.update(1 / 60, 1, 1, 5);
  assert.ok(Math.abs(Math.hypot(moving.dx, moving.dz) * 60 - 5) < .001);
  let brakingDistance = 0;
  for (let i = 0; i < 30; i++) {
    const step = motion.update(1 / 60);
    brakingDistance += Math.hypot(step.dx, step.dz);
  }
  assert.ok(brakingDistance < .17);
  const stopped = motion.update(1 / 60);
  assert.equal(Math.hypot(stopped.dx, stopped.dz), 0);
});

test("movement and look respond consistently at 30, 60 and 120 fps", () => {
  const travel = fps => {
    const motion = createFirstPersonMotion(.7);
    let x = 0, z = 0;
    for (const [forward, right] of [[1, 0], [1, 1], [0, 0]])
      for (let i = 0; i < fps / 2; i++) {
        const step = motion.update(1 / fps, forward, right, 2.8);
        x += step.dx; z += step.dz;
      }
    motion.look(200, -80);
    for (let i = 0; i < fps / 2; i++) motion.update(1 / fps);
    return { x, z, ...motion.update(0) };
  };
  const reference = travel(60);
  for (const fps of [30, 120]) {
    const actual = travel(fps);
    assert.ok(Math.hypot(actual.x - reference.x, actual.z - reference.z) < .001);
    assert.ok(Math.abs(actual.yaw - reference.yaw) < 1e-8);
    assert.ok(Math.abs(actual.pitch - reference.pitch) < 1e-8);
  }
});

test("forward travel follows the visible yaw and reset clears movement and pending mouse input", () => {
  const motion = createFirstPersonMotion();
  motion.look(300, 120);
  const step = { ...motion.update(1 / 60, 1) };
  assert.ok(step.yaw < 0 && step.yaw > -.72);
  assert.ok(step.pitch > 0 && step.pitch < .288);
  const heading = Math.atan2(step.dx, step.dz);
  assert.ok(Math.abs(Math.atan2(Math.sin(heading - step.yaw - Math.PI), Math.cos(heading - step.yaw - Math.PI))) < 1e-8);
  motion.look(500, 500);
  motion.reset(step.yaw, step.pitch);
  const stopped = motion.update(.05);
  assert.equal(stopped.yaw, step.yaw); assert.equal(stopped.pitch, step.pitch);
  assert.equal(Math.hypot(stopped.dx, stopped.dz), 0);
});
