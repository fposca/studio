import test from "node:test";
import assert from "node:assert/strict";
import { createChapter15VisualTimeline, CHAPTER15_VISUAL_BUDGETS } from "./chapter15VisualState.js";

const advance = (timeline, seconds, progress, paused = false, reduced = false) => {
  for (let i = 0; i < Math.round(seconds * 10); i++) timeline.update(.1, progress, paused, reduced);
  return timeline.state;
};

test("visuals only observe mission state, respect pause and do not replay a restored solution", () => {
  const progress = Object.freeze({ arrived: true, hugoConsulted: true, visionActive: true, channelIsolated: true });
  const timeline = createChapter15VisualTimeline();
  assert.equal(advance(timeline, 1, progress).surge, 0);
  assert.equal(timeline.state.vision, true);
  const time = timeline.state.time;
  advance(timeline, 30, progress, true);
  assert.equal(timeline.state.time, time);
  assert.equal(timeline.state.stable, true);
  assert.equal(timeline.update(.1, { ...progress, visionActive: false }).vision, false);
});

test("the completion sweep fires once on the actual isolation transition", () => {
  const timeline = createChapter15VisualTimeline();
  timeline.update(.1, {});
  assert.ok(advance(timeline, 1, { channelIsolated: true }).surge > 0);
  assert.equal(advance(timeline, 5, { channelIsolated: true }).surge, 0);
});

test("apparitions are rare and finite; reduced motion suppresses temporal motion", () => {
  const timeline = createChapter15VisualTimeline();
  const progress = { arrived: true, hugoConsulted: true };
  let apparitionFrames = 0, reverseFrames = 0;
  for (let i = 0; i < 2400; i++) {
    const state = timeline.update(.1, progress);
    if (state.apparition > 0) apparitionFrames++;
    if (state.reverse) reverseFrames++;
  }
  assert.ok(apparitionFrames >= 65 && apparitionFrames <= 72);
  assert.ok(reverseFrames < 100);
  const reduced = createChapter15VisualTimeline();
  const state = advance(reduced, 49, { ...progress, visionActive: true }, false, true);
  assert.equal(state.apparition, 0); assert.equal(state.reverse, false);
  assert.equal(state.interference, 0); assert.equal(state.vision, true);
});

test("mobile visual budgets keep lights, particles and shadows bounded", () => {
  assert.ok(CHAPTER15_VISUAL_BUDGETS.low.dust < CHAPTER15_VISUAL_BUDGETS.medium.dust);
  assert.ok(CHAPTER15_VISUAL_BUDGETS.medium.dust < CHAPTER15_VISUAL_BUDGETS.high.dust);
  assert.equal(CHAPTER15_VISUAL_BUDGETS.low.shadowSize, 0);
  assert.equal(CHAPTER15_VISUAL_BUDGETS.low.pointLights, 3);
});


test("analog CRT interference returns occasionally without requiring Frequency Vision", () => {
  const timeline = createChapter15VisualTimeline();
  const progress = Object.freeze({ arrived: true, visionActive: false });
  assert.equal(advance(timeline, 7, progress).interference, 0);
  assert.ok(advance(timeline, 2, progress).interference > .5);
  assert.equal(advance(timeline, 6, progress).interference, 0);
  assert.ok(advance(timeline, 23, progress).interference > .5);
  const time = timeline.state.time;
  advance(timeline, 10, progress, true);
  assert.equal(timeline.state.time, time);
});
