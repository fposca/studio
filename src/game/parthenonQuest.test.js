import assert from "node:assert/strict";
import test from "node:test";
import { advanceParthenonProgress, normalizeParthenonProgress, parthenonObjective } from "./parthenonQuest.js";

function step(progress, event, payload) {
  return advanceParthenonProgress(progress, event, payload, true);
}

test("Puerta 02 stays locked until the ship stabilizes the receiver", () => {
  const forged = { entered: true, hopliteAwake: true, hopliteHealth: 0,
    guardianClueSeen: true, guardianSequence: ["owl", "serpent", "sun"],
    mirrors: [true, true], reflectionPuzzleCompleted: true,
    sealClues: ["court", "reflector", "sanctuary"], sealSequence: ["time", "gate", "witness"],
    medusaFirstEncounterSeen: true, altarRead: true };
  assert.equal(normalizeParthenonProgress(forged, false).entered, false);
  assert.equal(normalizeParthenonProgress(forged, false).altarRead, false);
  assert.equal(advanceParthenonProgress(null, "enter", null, false).entered, false);
});

test("guardian order, two reflections, seals and altar require their clues", () => {
  let p = step(null, "enter");
  p = step(p, "guardian-hit", "owl");
  assert.deepEqual(p.guardianSequence, []);
  p = step(p, "urn-hit");
  assert.equal(normalizeParthenonProgress(p, true).urnBroken, true);
  p = step(p, "wake");
  for (let i = 0; i < 3; i++) p = step(p, "hoplite-hit");
  assert.equal(p.hopliteHealth, 0);
  p = step(p, "guardian-clue");
  p = step(p, "guardian-hit", "sun");
  assert.deepEqual(p.guardianSequence, []);
  for (const id of ["owl", "serpent", "sun"]) p = step(p, "guardian-hit", id);
  assert.equal(p.guardianPuzzleCompleted, true);
  p = step(p, "reflection-hit");
  assert.equal(p.reflectionPuzzleCompleted, false);
  p = step(p, "mirror-hit", 0);
  p = step(p, "mirror-hit", 1);
  p = step(p, "reflection-hit");
  assert.equal(p.reflectionPuzzleCompleted, true);
  p = step(p, "seal-hit", "time");
  assert.deepEqual(p.sealSequence, []);
  for (const id of ["court", "reflector", "sanctuary"]) p = step(p, "seal-clue", id);
  p = step(p, "seal-hit", "gate");
  assert.deepEqual(p.sealSequence, []);
  for (const id of ["time", "gate", "witness"]) p = step(p, "seal-hit", id);
  assert.equal(p.templeSealsCompleted, true);
  p = step(p, "altar-read");
  assert.equal(p.altarRead, false);
  p = step(p, "medusa-seen");
  p = step(p, "altar-read");
  assert.equal(p.altarRead, true);
  assert.match(parthenonObjective(p), /REGISTRO DIMENSIONAL/);
});

test("checkpoint retry preserves defeated enemies and solved mechanisms", () => {
  let p = step(null, "enter");
  p = step(p, "wake");
  p = step(p, "hoplite-hit");
  assert.equal(step(p, "retry").hopliteHealth, 3);
  p = step(step(p, "hoplite-hit"), "hoplite-hit");
  p = step(p, "retry");
  assert.equal(p.hopliteHealth, 0);
  assert.equal(normalizeParthenonProgress(p, true).hopliteHealth, 0);
});

test("old completed temple saves unlock the new chapter without losing solved puzzles", () => {
  const old = normalizeParthenonProgress({
    entered: true, hopliteAwake: true, hopliteHealth: 0,
    guardianClueSeen: true, guardianSequence: ["owl", "serpent", "sun"],
    mirrors: [true, true], reflectionPuzzleCompleted: true,
    sealClues: ["court", "reflector", "sanctuary"], sealSequence: ["time", "gate", "witness"],
    medusaFirstEncounterSeen: true, altarRead: true,
  }, true);
  assert.equal(old.altarRead, true);
  assert.equal(old.cursedHopliteHealth, 4);
  assert.equal(old.medusaBossDefeated, false);
  let p = step(old, "cursed-hoplite-hit");
  assert.equal(p.cursedHopliteAwake, true);
  for (let i = 0; i < 3; i++) p = step(p, "cursed-hoplite-hit");
  assert.equal(p.cursedHopliteHealth, 0);
  assert.equal(step(p, "retry").cursedHopliteHealth, 0);
  p = step(p, "medusa-start");
  p = step(p, "medusa-defeat");
  assert.equal(p.medusaBossDefeated, true);
  p = step(p, "fragment-collect");
  assert.equal(p.frequencyFragment02Collected, true);
  p = step(p, "fragment-analyze");
  assert.equal(p.frequencyFragment02Analyzed, true);
  assert.equal(p.guardianPuzzleCompleted, true);
  assert.equal(p.templeSealsCompleted, true);
});

test("forged boss reward cannot bypass the old chapter or the encounter", () => {
  const forged = normalizeParthenonProgress({
    entered: true, medusaBossDefeated: true, frequencyFragment02Collected: true,
    frequencyFragment02Analyzed: true,
  }, true);
  assert.equal(forged.medusaBossDefeated, false);
  assert.equal(forged.frequencyFragment02Collected, false);
  assert.equal(step(forged, "fragment-collect").frequencyFragment02Collected, false);
});
