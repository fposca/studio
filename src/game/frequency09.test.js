import test from "node:test";
import assert from "node:assert/strict";
import { canActivateFrequency09, completeFrequency09, normalizeArcadeProgress, revisitStoreAfterVision } from "./arcadeProgress.js";
import { getArcadeDialogueNode } from "./arcadeDialogue.js";
import { createNewUniverseGame, readUniverseSaves, writeUniverseSave } from "./neonUniverseSaves.js";

test("FREQUENCY 09 opens only after the club anomaly and completes once", () => {
  const before = normalizeArcadeProgress(null);
  assert.equal(canActivateFrequency09({ anomalySeen: false }, before), false);
  assert.equal(canActivateFrequency09({ anomalySeen: true }, before), true);
  const after = completeFrequency09(before);
  assert.equal(after.frequency09EventSeen, true);
  assert.equal(after.recordStoreFutureVisionSeen, true);
  assert.equal(canActivateFrequency09({ anomalySeen: true }, after), false);
  assert.deepEqual(completeFrequency09(after), after);
  assert.equal(revisitStoreAfterVision(before).recordStoreRevisitedAfterVision, false);
  assert.equal(revisitStoreAfterVision(after).recordStoreRevisitedAfterVision, true);
});

test("the future vision survives manual saves and unlocks three NPC reactions", () => {
  const data = createNewUniverseGame();
  data.scene = "arcade";
  data.arcadeProgress = completeFrequency09(data.arcadeProgress);
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(writeUniverseSave("slot-1", data, storage, 1234).ok, true);
  const restored = readUniverseSaves(storage)["slot-1"].data.arcadeProgress;
  assert.equal(restored.frequency09EventSeen, true);
  for (const npc of ["pixel", "nico", "vicky"]) {
    const menu = getArcadeDialogueNode(npc, "menu", restored, true);
    assert.ok(menu.options.some((option) => option.id === "afterVision"));
    assert.ok(getArcadeDialogueNode(npc, "afterVision", restored, true).lines.length > 0);
  }
});
