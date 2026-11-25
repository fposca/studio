import test from "node:test";
import assert from "node:assert/strict";
import { CHAPTER15_INITIAL, advanceChapter15, chapter15Objective, normalizeChapter15Progress } from "./chapter15Quest.js";

test("chapter 15 is gated by the completed escape and its fourth channel needs the clues", () => {
  let p = advanceChapter15(CHAPTER15_INITIAL, "arrive", false);
  assert.equal(p.started, false);
  p = advanceChapter15(p, "arrive", true);
  assert.equal(p.arrived, true);
  assert.match(chapter15Objective(p), /Hugo/);
  p = advanceChapter15(p, "mix:silence", true);
  assert.deepEqual(p.mixSequence, []);
  p = advanceChapter15(p, "hugo-talk", true);
  p = advanceChapter15(p, "console-examine", true);
  p = advanceChapter15(p, "note-read", true);
  p = advanceChapter15(p, "vision-toggle", true);
  p = advanceChapter15(p, "channel-see", true);
  p = advanceChapter15(p, "mix:silence", true);
  p = advanceChapter15(p, "mix:hidden", true);
  assert.deepEqual(p.mixSequence, []);
  for (const id of ["silence", "pulse", "hidden"]) p = advanceChapter15(p, "mix:" + id, true);
  assert.equal(p.channelIsolated, true);
  p = advanceChapter15(p, "tape-take", true);
  assert.equal(p.tapeTaken, true);
});

test("suspect investigation needs physical evidence, testimony and a journal comparison", () => {
  let p = normalizeChapter15Progress({ started: true, arrived: true, hugoConsulted: true, consoleExamined: true,
    noteRead: true, hiddenChannelSeen: true, mixSequence: ["silence", "pulse", "hidden"], channelIsolated: true, tapeTaken: true }, true);
  p = advanceChapter15(p, "store-enter", true);
  for (const id of ["tito", "roxy", "rulo"]) p = advanceChapter15(p, "talk:" + id, true);
  assert.equal(p.confrontationUnlocked, false);
  for (const id of ["tito", "roxy", "rulo"]) p = advanceChapter15(p, "evidence:" + id, true);
  assert.equal(p.evidence.length, 3);
  assert.match(chapter15Objective(p), /Compar/);
  p = advanceChapter15(p, "compare", true);
  assert.equal(p.confrontationUnlocked, true);
  assert.equal(p.completed, undefined);
});

test("invalid or old-save chapter 15 flags are sanitized", () => {
  const falseProgress = normalizeChapter15Progress({ started: true, tapeTaken: true, evidence: ["tito"] }, false);
  assert.equal(falseProgress.started, false);
  assert.equal(falseProgress.tapeTaken, false);
  const p = normalizeChapter15Progress({ started: true, evidence: ["tito", "tito", "alien"], talked: ["roxy", "alien"], mixSequence: ["hidden"] }, true);
  assert.deepEqual(p.evidence, []);
  assert.deepEqual(p.talked, []);
  assert.deepEqual(p.mixSequence, []);
  const forged = normalizeChapter15Progress({ started: true, arrived: true, hugoConsulted: true, consoleExamined: true, noteRead: true, hiddenChannelSeen: true, channelIsolated: true, tapeTaken: true, storeEntered: true, evidence: ["tito"] }, true);
  assert.equal(forged.channelIsolated, false);
  assert.equal(forged.tapeTaken, false);
  assert.deepEqual(forged.evidence, []);
});


test("store continuity migrates old saves and does not advance the investigation", () => {
  const legacy = { started: true, arrived: true, hugoConsulted: true, consoleExamined: true,
    noteRead: true, hiddenChannelSeen: true, mixSequence: ["silence", "pulse", "hidden"],
    channelIsolated: true, tapeTaken: true, storeEntered: true, evidence: ["roxy"], talked: ["tito"] };
  const before = normalizeChapter15Progress(legacy, true);
  assert.equal(before.storeArrivalSeen, false);
  const after = advanceChapter15(before, "store-arrival-seen", true);
  assert.deepEqual(after, { ...before, storeArrivalSeen: true });
  assert.equal(chapter15Objective(after), chapter15Objective(before));
  const restored = normalizeChapter15Progress(JSON.parse(JSON.stringify(after)), true);
  assert.deepEqual(restored, after);
  assert.deepEqual(advanceChapter15(restored, "store-enter", true), restored);
  assert.equal(normalizeChapter15Progress(after, false).storeArrivalSeen, false);
  assert.equal(advanceChapter15({ ...before, storeEntered: false }, "store-arrival-seen", true).storeArrivalSeen, false);
});
