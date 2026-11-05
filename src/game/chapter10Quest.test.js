import test from "node:test";
import assert from "node:assert/strict";
import { advanceChapter10, chapter10FragmentsReady, normalizeChapter10Progress, chapter10Objective } from "./chapter10Quest.js";
import { getScenarioStatus, NEON_UNIVERSE_SCENARIOS } from "./neonUniverseScenarios.js";
import { createNewUniverseGame, normalizeUniverseGame, writeUniverseSave, readUniverseSaves } from "./neonUniverseSaves.js";

test("an old chapter 9 save begins chapter 10 at the core and keeps prior data", () => {
  const old = normalizeChapter10Progress(undefined, true);
  assert.equal(old.coreAnalyzed, false);
  assert.match(chapter10Objective(old), /núcleo/);
  const analyzed = advanceChapter10(old, "core-examine", undefined, true);
  assert.equal(analyzed.signalDetected, false);
  const signal = advanceChapter10(analyzed, "signal-detect", undefined, true);
  assert.match(chapter10Objective(signal), /Hugo/);
  assert.equal(advanceChapter10(old, "hugo-consult", undefined, true).hugoConsulted, false);
});

test("console requires the three prior door milestones and the correct order", () => {
  let progress = advanceChapter10(advanceChapter10(advanceChapter10(undefined, "core-examine", undefined, true), "signal-detect", undefined, true), "hugo-consult", undefined, true);
  assert.equal(chapter10FragmentsReady({archiveRecovered:true},{frequencyFragment02Analyzed:true},{archiveRead:true}), true);
  progress = advanceChapter10(progress, "channel", "pulse", true, false);
  assert.deepEqual(progress.channelInput, []);
  progress = advanceChapter10(progress, "channel", "pulse", true, true);
  assert.deepEqual(progress.channelInput, ["pulse"]);
  progress = advanceChapter10(progress, "channel", "frequency", true, true);
  assert.deepEqual(progress.channelInput, []);
  for (const channel of ["pulse", "memory", "frequency"]) progress = advanceChapter10(progress, "channel", channel, true, true);
  assert.equal(progress.signalReconstructed, true);
  assert.equal(progress.underworldUnlocked, true);
  assert.equal(advanceChapter10(progress, "complete", undefined, true).chapterCompleted, true);
});

test("underworld becomes playable after chapter 10 and survives save and load", () => {
  const underworld = NEON_UNIVERSE_SCENARIOS.find((entry) => entry.id === "underworld");
  assert.equal(getScenarioStatus(underworld, []), "secret");
  assert.equal(getScenarioStatus(underworld, ["underworld"]), "available");
  assert.equal(underworld.destination, "underworld");
  const game = createNewUniverseGame();
  assert.equal(normalizeUniverseGame(game).chapter10Progress.chapterCompleted, false);
  game.chapter10Progress = { coreAnalyzed:true, signalDetected:true, hugoConsulted:true, signalReconstructed:true, underworldUnlocked:true, chapterCompleted:true };
  const saved = normalizeUniverseGame(game);
  assert.equal(saved.chapter10Progress.chapterCompleted, true);
  assert.equal(saved.mapUnlocks.includes("underworld"), true);
  assert.equal(saved.scene, "store");
  game.scene = "underworld";
  assert.equal(normalizeUniverseGame(game).scene, "underworld");
  const memory = new Map();
  const storage = { getItem:key=>memory.get(key) ?? null, setItem:(key,value)=>memory.set(key,value) };
  assert.equal(writeUniverseSave("slot-1", game, storage, 1000).ok, true);
  const restored = readUniverseSaves(storage)["slot-1"].data;
  assert.equal(restored.chapter10Progress.chapterCompleted, true);
  assert.equal(restored.mapUnlocks.includes("underworld"), true);
  assert.equal(restored.scene, "underworld");
});
