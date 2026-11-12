import assert from "node:assert/strict";
import test from "node:test";
import { advanceCathedral, cathedralObjective, normalizeCathedralProgress } from "./cathedralQuest.js";
import { canStandInCathedral } from "./cathedralLayout.js";
import { createNewUniverseGame, normalizeUniverseGame } from "./neonUniverseSaves.js";

function completedChapter11Game() {
  const game = createNewUniverseGame();
  game.chapter10Progress = {
    coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
    signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true,
  };
  game.underworldProgress = {
    bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0],
    gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true,
  };
  return game;
}

test("the cathedral stays locked until Chapter 11 is complete", () => {
  const game = createNewUniverseGame();
  game.scene = "cathedral";
  game.mapUnlocks = ["cathedral"];
  const saved = normalizeUniverseGame(game);
  assert.equal(saved.scene, "store");
  assert.equal(saved.mapUnlocks.includes("cathedral"), false);
  assert.equal(saved.cathedralProgress.completed, false);
  assert.equal(advanceCathedral(null, "enter", null, false).entered, false);
});

test("seal mistakes reset only the sequence and open the archive in the correct order", () => {
  let p = advanceCathedral(null, "enter", null, true);
  p = advanceCathedral(p, "inscription", null, true);
  p = advanceCathedral(p, "seal", "memoria", true);
  p = advanceCathedral(p, "seal", "verdad", true);
  assert.deepEqual(p.seals, []);
  assert.equal(p.archiveOpen, false);
  for (const id of ["memoria", "tiempo", "verdad"]) p = advanceCathedral(p, "seal", id, true);
  assert.equal(p.archiveOpen, true);
  assert.equal(canStandInCathedral(0, -18, p), true);
  assert.equal(canStandInCathedral(0, -43, p), false);
});

test("memories require vision, reject wrong order and reveal the altar", () => {
  let p = advanceCathedral(null, "enter", null, true);
  for (const id of ["memoria", "tiempo", "verdad"]) p = advanceCathedral(p, "seal", id, true);
  assert.deepEqual(advanceCathedral(p, "memory", "nave", true).memories, []);
  p = advanceCathedral(p, "vision-toggle", null, true);
  p = advanceCathedral(p, "memory", "nave", true);
  p = advanceCathedral(p, "memory", "fracturada", true);
  assert.deepEqual(p.memories, []);
  for (const id of ["nave", "partenon", "fracturada"]) p = advanceCathedral(p, "memory", id, true);
  assert.equal(p.altarOpen, true);
  assert.equal(canStandInCathedral(0, -43, p), true);
  p = advanceCathedral(p, "altar", null, true);
  assert.equal(advanceCathedral(p, "complete", null, true).completed, false);
  p = advanceCathedral(p, "recording", null, true);
  p = advanceCathedral(p, "complete", null, true);
  assert.equal(p.completed, true);
  assert.match(cathedralObjective(p), /Trono del Abismo/);
});

test("old saves gain Cathedral access after Chapter 11; new progress survives normalization", () => {
  const game = completedChapter11Game();
  game.scene = "cathedral";
  let saved = normalizeUniverseGame(game);
  assert.equal(saved.scene, "cathedral");
  assert.equal(saved.mapUnlocks.includes("cathedral"), true);
  assert.equal(saved.cathedralProgress.entered, false);
  let p = advanceCathedral(saved.cathedralProgress, "enter", null, true);
  for (const id of ["memoria", "tiempo", "verdad"]) p = advanceCathedral(p, "seal", id, true);
  p = advanceCathedral(p, "vision-toggle", null, true);
  for (const id of ["nave", "partenon", "fracturada"]) p = advanceCathedral(p, "memory", id, true);
  p = advanceCathedral(p, "custodian-first", null, true);
  p = advanceCathedral(p, "custodian-anomaly", null, true);
  p = advanceCathedral(p, "custodian-hint", null, true);
  p = advanceCathedral(advanceCathedral(advanceCathedral(p, "altar", null, true), "recording", null, true), "complete", null, true);
  game.cathedralProgress = p;
  game.positions.cathedral = { x: 2, z: -52, yaw: Math.PI, viewYaw: .1 };
  saved = normalizeUniverseGame(game);
  assert.equal(saved.cathedralProgress.completed, true);
  assert.equal(saved.positions.cathedral.z, -52);
  assert.equal(saved.scene, "cathedral");
  assert.deepEqual(normalizeCathedralProgress({ ...p, memories: ["nave", "fracturada"] }, true).memories, ["nave"]);
});

test("custodian conversations persist, the altar revelation cannot complete early, and old complete saves migrate", () => {
  let p = normalizeCathedralProgress({}, true);
  assert.equal(p.custodianMet, false);
  assert.equal(advanceCathedral(p, "custodian-anomaly", null, true).anomalyHeard, false);
  p = advanceCathedral(p, "custodian-first", null, true);
  p = advanceCathedral(p, "custodian-anomaly", null, true);
  assert.equal(p.custodianMet, true);
  assert.equal(p.anomalyHeard, true);
  for (const id of ["memoria", "tiempo", "verdad"]) p = advanceCathedral(p, "seal", id, true);
  p = advanceCathedral(p, "vision-toggle", null, true);
  for (const id of ["nave", "partenon", "fracturada"]) p = advanceCathedral(p, "memory", id, true);
  p = advanceCathedral(p, "custodian-hint", null, true);
  assert.equal(p.altarHintHeard, true);
  p = advanceCathedral(p, "altar", null, true);
  assert.equal(advanceCathedral(p, "complete", null, true).completed, false);
  p = advanceCathedral(p, "recording", null, true);
  assert.equal(p.recordingHeard, true);
  p = advanceCathedral(p, "complete", null, true);
  assert.equal(p.completed, true);
  const old = normalizeCathedralProgress({
    seals: ["memoria", "tiempo", "verdad"], memories: ["nave", "partenon", "fracturada"],
    altarActivated: true, completed: true,
  }, true);
  assert.equal(old.completed, true);
  assert.equal(old.recordingHeard, true);
  assert.equal(old.anomalyHeard, true);
});
