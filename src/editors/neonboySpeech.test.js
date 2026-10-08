import assert from "node:assert/strict";
import test from "node:test";
import { neonboySpeechAmountAt, neonboySpeechPoseAt, normalizeNeonboySpeech } from "./neonboySpeech.js";

test("speech settings stay within the timeline and control ranges", () => {
  const settings = normalizeNeonboySpeech({ enabled: true, start: 8, end: 12, speed: 30, intensity: 4 }, 10);
  assert.deepEqual(settings, { enabled: true, start: 8, end: 10, speed: 8, intensity: 1.5 });
  assert.deepEqual(normalizeNeonboySpeech({ start: 12, end: 1 }, 5), {
    enabled: false, start: 4.9, end: 5, speed: 3.4, intensity: 0.8
  });
});

test("the smile only moves inside its speaking interval", () => {
  const settings = normalizeNeonboySpeech({ enabled: true, start: 1, end: 2, speed: 2, intensity: 1 }, 5);
  assert.equal(neonboySpeechAmountAt(settings, 0.9), 0);
  assert.equal(neonboySpeechAmountAt(settings, 1), 0);
  assert.ok(neonboySpeechAmountAt(settings, 1.18) > 0);
  assert.equal(neonboySpeechAmountAt(settings, 2), 0);
  assert.equal(neonboySpeechAmountAt({ ...settings, enabled: false }, 1.18), 0);
});

test("speed changes the gesture and intensity scales it", () => {
  const slow = normalizeNeonboySpeech({ enabled: true, start: 0, end: 3, speed: 1, intensity: 1 });
  const fast = normalizeNeonboySpeech({ ...slow, speed: 5 });
  const quiet = normalizeNeonboySpeech({ ...slow, intensity: 0.5 });
  assert.notEqual(neonboySpeechAmountAt(slow, 0.43), neonboySpeechAmountAt(fast, 0.43));
  assert.equal(neonboySpeechAmountAt(quiet, 0.43), neonboySpeechAmountAt(slow, 0.43) * 0.5);
});

test("speech varies mouth shape and returns to rest between phrases", () => {
  const settings = normalizeNeonboySpeech({ enabled: true, end: 20, intensity: 1 });
  const samples = Array.from({ length: 1000 }, (_, i) => neonboySpeechPoseAt(settings, 0.2 + i * 0.01));
  for (const key of ["open", "round", "wide", "press"]) {
    assert.ok(samples.every(pose => Number.isFinite(pose[key]) && pose[key] >= 0 && pose[key] <= 1));
    assert.ok(samples.some(pose => pose[key] > 0.35), `${key} must be visible`);
  }
  assert.ok(samples.some(pose => Object.values(pose).every(value => value === 0)));
  assert.notDeepEqual(neonboySpeechPoseAt(settings, 0.43), neonboySpeechPoseAt(settings, 8 / settings.speed + 0.43));
});

test("seeking and export reproduce the same smooth poses without state", () => {
  const settings = normalizeNeonboySpeech({ enabled: true, start: 1, end: 12, speed: 8, intensity: 1.5 });
  const frames = Array.from({ length: 720 }, (_, i) => neonboySpeechPoseAt(settings, i / 60));
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    assert.deepEqual(neonboySpeechPoseAt(settings, i / 60), frames[i]);
  }
  for (let time = 0.999; time <= 12.001; time += 0.001) {
    const a = neonboySpeechPoseAt(settings, time);
    const b = neonboySpeechPoseAt(settings, time + 0.00001);
    for (const key of Object.keys(a)) assert.ok(Math.abs(a[key] - b[key]) < 0.005, `jump in ${key} at ${time}`);
  }
});

test("disabling speech or setting zero aperture restores every part of the smile", () => {
  const settings = normalizeNeonboySpeech({ enabled: true, start: 1, end: 3 });
  const rest = { open: 0, round: 0, wide: 0, press: 0 };
  for (const time of [0, 1, 3, 4, NaN, Infinity]) assert.deepEqual(neonboySpeechPoseAt(settings, time), rest);
  assert.deepEqual(neonboySpeechPoseAt({ ...settings, intensity: 0 }, 1.2), rest);
  assert.deepEqual(neonboySpeechPoseAt({ ...settings, enabled: false }, 1.2), rest);
});
