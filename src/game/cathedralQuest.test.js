import assert from "node:assert/strict";
import test from "node:test";
import { advanceCathedral, cathedralObjective, normalizeCathedralProgress } from "./cathedralQuest.js";
import { CATHEDRAL_ALTAR_PLATFORM, CATHEDRAL_INTERACTIONS, CATHEDRAL_RESONATOR_COLLIDERS, canStandInCathedral, clearCathedralAltarSpawn, clearCathedralBlockedSpawn } from "./cathedralLayout.js";
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

test("closed Cathedral gates stop NeonBoy before the visible bars", () => {
  const closed = normalizeCathedralProgress({}, true);
  assert.equal(canStandInCathedral(0, -16.34, closed), true);
  assert.equal(canStandInCathedral(0, -16.36, closed), false);
  assert.equal(canStandInCathedral(0, -41.34, { ...closed, archiveOpen: true }), true);
  assert.equal(canStandInCathedral(0, -41.36, { ...closed, archiveOpen: true }), false);
  assert.equal(canStandInCathedral(0, -17, { ...closed, archiveOpen: true }), true);
  assert.equal(canStandInCathedral(0, -42, { ...closed, archiveOpen: true, altarOpen: true }), true);
  assert.equal(canStandInCathedral(3, -17, { ...closed, archiveOpen: true }), false);
});

test("the solid altar platform still leaves its interaction reachable from the aisle", () => {
  const altar = CATHEDRAL_INTERACTIONS.find((item) => item.id === "cathedral-altar");
  const closestFrontZ = CATHEDRAL_ALTAR_PLATFORM.z + CATHEDRAL_ALTAR_PLATFORM.hz + .46;
  assert.ok(altar.reach > Math.hypot(altar.x, altar.z - closestFrontZ) + .5);
  assert.equal(CATHEDRAL_ALTAR_PLATFORM.hx * 2, 6.5);
  assert.equal(CATHEDRAL_ALTAR_PLATFORM.hz * 2, 5.4);
});

test("a save inside the altar stone is restored to a reachable edge", () => {
  const progress = { archiveOpen: true, altarOpen: true };
  const embedded = { x: 0, z: -52.1 };
  const restored = clearCathedralAltarSpawn(embedded, progress);
  assert.ok(restored.z > -50.44);
  assert.ok(Math.hypot(restored.x, restored.z - CATHEDRAL_INTERACTIONS.find((item) => item.id === "cathedral-altar").z) < 3.8);
  assert.equal(clearCathedralAltarSpawn({ x: 0, z: -50.3 }, progress).z, -50.3);
});

test("saved positions inside resonators are cleared without losing interaction range", () => {
  const progress = { archiveOpen: true, altarOpen: true };
  for (const node of CATHEDRAL_RESONATOR_COLLIDERS) {
    const restored = clearCathedralBlockedSpawn({ x: node.x, z: node.z }, progress);
    const spot = CATHEDRAL_INTERACTIONS.find((item) => item.id.startsWith("cathedral-tone-") &&
      item.x === node.x && item.z === node.z);
    assert.ok(Math.hypot(restored.x - node.x, restored.z - node.z) >= node.radius + .46);
    assert.ok(Math.hypot(restored.x - spot.x, restored.z - spot.z) < spot.reach);
  }
  const fromAltar = clearCathedralBlockedSpawn({ x: 0, z: -52.1 }, progress);
  assert.ok(CATHEDRAL_RESONATOR_COLLIDERS.every((node) =>
    Math.hypot(fromAltar.x - node.x, fromAltar.z - node.z) >= node.radius + .46));
  assert.ok(Math.hypot(fromAltar.x, fromAltar.z + 53.3) < 3.8);
});

test("memories require vision, reject wrong order and reveal the altar", () => {
  let p = advanceCathedral(null, "enter", null, true);
  assert.deepEqual(advanceCathedral(p, "seal", "memoria", true).seals, []);
  p = advanceCathedral(p, "inscription", null, true);
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
  assert.equal(p.altarTuning, true);
  assert.equal(p.altarActivated, false);
  assert.equal(advanceCathedral(p, "complete", null, true).completed, false);
  for (const id of ["pulso", "eco", "origen"]) p = advanceCathedral(p, "altar-node", id, true);
  assert.equal(p.altarActivated, true);
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
  p = advanceCathedral(p, "inscription", null, true);
  p = advanceCathedral(p, "inscription", null, true);
  for (const id of ["memoria", "tiempo", "verdad"]) p = advanceCathedral(p, "seal", id, true);
  p = advanceCathedral(p, "vision-toggle", null, true);
  for (const id of ["nave", "partenon", "fracturada"]) p = advanceCathedral(p, "memory", id, true);
  p = advanceCathedral(p, "custodian-first", null, true);
  p = advanceCathedral(p, "custodian-anomaly", null, true);
  p = advanceCathedral(p, "custodian-hint", null, true);
  p = advanceCathedral(p, "altar", null, true);
  for (const id of ["pulso", "eco", "origen"]) p = advanceCathedral(p, "altar-node", id, true);
  p = advanceCathedral(advanceCathedral(p, "recording", null, true), "complete", null, true);
  game.cathedralProgress = p;
  game.positions.cathedral = { x: 2, z: -52, yaw: Math.PI, viewYaw: .1 };
  saved = normalizeUniverseGame(game);
  assert.equal(saved.cathedralProgress.completed, true);
  assert.equal(saved.positions.cathedral.z, -52);
  assert.equal(saved.scene, "cathedral");
  assert.deepEqual(normalizeCathedralProgress({ ...p, completed: false, altarActivated: false, recordingHeard: false, memories: ["nave", "fracturada"] }, true).memories, ["nave"]);
});

test("custodian conversations persist, the altar revelation cannot complete early, and old complete saves migrate", () => {
  let p = normalizeCathedralProgress({}, true);
  assert.equal(p.custodianMet, false);
  assert.equal(advanceCathedral(p, "custodian-anomaly", null, true).anomalyHeard, false);
  p = advanceCathedral(p, "custodian-first", null, true);
  p = advanceCathedral(p, "custodian-anomaly", null, true);
  assert.equal(p.custodianMet, true);
  assert.equal(p.anomalyHeard, true);
  p = advanceCathedral(p, "inscription", null, true);
  for (const id of ["memoria", "tiempo", "verdad"]) p = advanceCathedral(p, "seal", id, true);
  p = advanceCathedral(p, "vision-toggle", null, true);
  for (const id of ["nave", "partenon", "fracturada"]) p = advanceCathedral(p, "memory", id, true);
  p = advanceCathedral(p, "custodian-hint", null, true);
  assert.equal(p.altarHintHeard, true);
  p = advanceCathedral(p, "altar", null, true);
  assert.equal(advanceCathedral(p, "complete", null, true).completed, false);
  for (const id of ["pulso", "eco", "origen"]) p = advanceCathedral(p, "altar-node", id, true);
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

test("altar tuning requires vision, correct order, and keeps previous puzzles after a mistake", () => {
  let p = normalizeCathedralProgress({
    inscriptionRead: true, seals: ["memoria", "tiempo", "verdad"],
    memories: ["nave", "partenon", "fracturada"],
  }, true);
  p = advanceCathedral(p, "altar", null, true);
  assert.equal(advanceCathedral(p, "altar-node", "pulso", true).altarSequence.length, 0);
  p = advanceCathedral(p, "vision-toggle", null, true);
  p = advanceCathedral(p, "altar-node", "pulso", true);
  p = advanceCathedral(p, "altar-node", "origen", true);
  assert.deepEqual(p.altarSequence, []);
  assert.equal(p.archiveOpen, true);
  assert.equal(p.altarOpen, true);
  assert.deepEqual(p.memories, ["nave", "partenon", "fracturada"]);
  assert.equal(p.altarActivated, false);
  for (const id of ["pulso", "eco", "origen"]) p = advanceCathedral(p, "altar-node", id, true);
  assert.equal(p.altarActivated, true);
  assert.deepEqual(normalizeCathedralProgress(p, true).altarSequence, ["pulso", "eco", "origen"]);
});

test("completed legacy Cathedral saves remain complete without stored tuning fields", () => {
  const p = normalizeCathedralProgress({ completed: true }, true);
  assert.equal(p.completed, true);
  assert.equal(p.altarActivated, true);
  assert.deepEqual(p.altarSequence, ["pulso", "eco", "origen"]);
  assert.equal(p.recordingHeard, true);
});
