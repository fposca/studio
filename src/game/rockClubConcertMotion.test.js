import test from "node:test";
import assert from "node:assert/strict";
import { insertConcertMotionFrame, normalizeConcertMotion, sampleConcertMotion } from "./rockClubConcertMotion.js";

test("guitar recording stores editable frames and interpolates the waist adjustment", () => {
  const start = { position: [0, 0, 0], rotation: [0, 350, 0], scale: 1 };
  const end = { position: [0.4, 0.2, -0.1], rotation: [0, 10, 0], scale: 1.2 };
  const first = insertConcertMotionFrame({ duration: 4, keyframes: [] }, 0, start);
  const track = insertConcertMotionFrame(first, 2, end);
  assert.equal(track.keyframes.length, 2);
  const middle = sampleConcertMotion(track, 1);
  assert.deepEqual(middle.position, [0.2, 0.1, -0.05]);
  assert.equal(middle.scale, 1.1);
  assert.ok(Math.abs(middle.rotation[1]) < 0.001 || Math.abs(middle.rotation[1] - 360) < 0.001);
  assert.deepEqual(sampleConcertMotion(track, 3).position, [0.2, 0.1, -0.05]);
  const replacement = insertConcertMotionFrame(track, 2.02, start);
  assert.equal(replacement.keyframes.length, 2);
  assert.deepEqual(replacement.keyframes[1].position, [0, 0, 0]);
});

test("malformed recordings are limited to known musicians, times, and transform ranges", () => {
  const result = normalizeConcertMotion({
    "john-zool": { duration: 99, keyframes: [
      { time: -20, position: [99, 0, 0], rotation: [0, 999, 0], scale: 50 },
    ] },
    unknown: { duration: 8, keyframes: [{ time: 1 }] },
  });
  assert.deepEqual(Object.keys(result), ["john-zool"]);
  assert.equal(result["john-zool"].duration, 30);
  assert.equal(result["john-zool"].keyframes[0].time, 0);
  assert.deepEqual(result["john-zool"].keyframes[0].position, [2, 0, 0]);
  assert.equal(result["john-zool"].keyframes[0].rotation[1], 360);
  assert.equal(result["john-zool"].keyframes[0].scale, 2);
});

test("recorded hand and shoulder poses interpolate with the guitar and remain editable", () => {
  const base = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };
  const first = insertConcertMotionFrame({ duration: 4, keyframes: [] }, 0, base,
    { LeftArm: [0, 0, 0], RightHand: [0, 0, 0] });
  const track = insertConcertMotionFrame(first, 2, base,
    { LeftArm: [80, 0, 0], RightHand: [0, 20, 0] });
  const pose = sampleConcertMotion(track, 1);
  assert.deepEqual(pose.bones.LeftArm, [40, 0, 0]);
  assert.deepEqual(pose.bones.RightHand, [0, 10, 0]);
  assert.deepEqual(normalizeConcertMotion({ neonboy: track }).neonboy.keyframes[1].bones.LeftArm, [80, 0, 0]);
});
