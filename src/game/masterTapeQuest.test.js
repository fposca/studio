import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_MASTER_TAPE_PROGRESS, MASTER_TAPE_SAVE_KEY, advanceMasterTape,
  loadMasterTapeProgress, saveMasterTapeProgress, masterTapeInventory,
  masterTapeOptions, getMasterTapeDialogueNode
} from "./masterTapeQuest.js";

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("El máster perdido requires three different console channels and grants one ficha once", () => {
  const storage = memoryStorage();
  let progress = loadMasterTapeProgress(storage);
  assert.deepEqual(progress, INITIAL_MASTER_TAPE_PROGRESS);
  assert.equal(advanceMasterTape(progress, "inspect:drums"), progress);
  assert.ok(masterTapeOptions("tito", progress).some((entry) => entry.id === "master:start"));
  progress = advanceMasterTape(progress, "takeTape");
  assert.deepEqual(masterTapeInventory(progress), ["Cinta de grabación de 1999"]);
  assert.ok(masterTapeOptions("hugo", progress).some((entry) => entry.id === "master:bring"));
  progress = advanceMasterTape(progress, "startReview");
  assert.deepEqual(masterTapeInventory(progress), []); // Hugo has the tape now.
  progress = advanceMasterTape(progress, "inspect:guitar");
  assert.equal(advanceMasterTape(progress, "inspect:guitar"), progress);
  progress = advanceMasterTape(progress, "inspect:bass");
  assert.equal(advanceMasterTape(progress, "claimMaster"), progress);
  progress = advanceMasterTape(progress, "inspect:drums");
  assert.ok(masterTapeOptions("hugo", progress).some((entry) => entry.id === "master:finish"));
  progress = advanceMasterTape(progress, "claimMaster");
  assert.equal(progress.studioTokens, 1);
  assert.deepEqual(masterTapeInventory(progress), ["Máster restaurado de 1999"]);
  assert.equal(advanceMasterTape(progress, "claimMaster"), progress);
  assert.equal(advanceMasterTape(progress, "takeTape"), progress);
  assert.equal(saveMasterTapeProgress(progress, storage), true);
  assert.deepEqual(loadMasterTapeProgress(storage), progress);
  progress = advanceMasterTape(progress, "deliverMaster");
  assert.equal(progress.phase, "complete");
  assert.equal(progress.studioTokens, 1);
  assert.equal(advanceMasterTape(progress, "deliverMaster"), progress);
  assert.equal(saveMasterTapeProgress(progress, storage), true);
  assert.deepEqual(loadMasterTapeProgress(storage), progress);
  assert.ok(storage.getItem(MASTER_TAPE_SAVE_KEY));
  assert.ok(getMasterTapeDialogueNode("tito", "master:tito-complete", progress));
});

test("invalid saves cannot unlock Neon Sessions or create extra fichas", () => {
  const storage = memoryStorage();
  storage.setItem(MASTER_TAPE_SAVE_KEY, JSON.stringify({ version: 1, progress: {
    phase: "complete", reviewed: ["guitar"], studioTokens: 500
  } }));
  assert.deepEqual(loadMasterTapeProgress(storage), INITIAL_MASTER_TAPE_PROGRESS);
  storage.setItem(MASTER_TAPE_SAVE_KEY, JSON.stringify({ version: 1, progress: {
    phase: "complete", reviewed: ["guitar", "bass", "drums", "drums"], studioTokens: 500
  } }));
  assert.deepEqual(loadMasterTapeProgress(storage), { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 });
});
