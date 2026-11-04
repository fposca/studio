import test from "node:test";
import assert from "node:assert/strict";
import { advanceImpossibleRecording, impossibleRecordingObjective,
  isSignalClean, normalizeImpossibleRecording, signalInterference } from "./studioImpossibleRecording.js";

test("the recording chapter starts only after the ghost and advances in order", () => {
  const original = { impossibleRecordingStarted: false };
  assert.equal(advanceImpossibleRecording(original, "talk", false), original);
  assert.equal(advanceImpossibleRecording(original, "reverse", true), original);
  let progress = original;
  for (const event of ["talk", "computer", "analyze", "reverse", "anomaly", "rooftop"]) {
    progress = advanceImpossibleRecording(progress, event, true);
    assert.equal(advanceImpossibleRecording(progress, event, true), progress);
  }
  assert.equal(impossibleRecordingObjective(true, progress),
    "Investigá el origen de la señal desde un punto elevado de la ciudad.");
  assert.equal(impossibleRecordingObjective(false, progress), null);
});

test("audio bands provide a readable target and normalization removes invalid skips", () => {
  assert.equal(isSignalClean({ low: 25, mid: 70, high: 35 }), true);
  assert.equal(isSignalClean({ low: 60, mid: 50, high: 60 }), false);
  assert.ok(signalInterference({ low: 60, mid: 50, high: 60 }) >
    signalInterference({ low: 30, mid: 65, high: 40 }));
  const invalid = normalizeImpossibleRecording({
    impossibleRecordingStarted: true, signalComputerExamined: false,
    signalAnalysisCompleted: true, reversedSignalDecoded: true,
    studioAnomalySeen: true, rooftopClueKnown: true,
  }, true);
  assert.equal(invalid.signalAnalysisCompleted, false);
  assert.equal(invalid.rooftopClueKnown, false);
  assert.equal(normalizeImpossibleRecording(invalid, false).impossibleRecordingStarted, false);
});
