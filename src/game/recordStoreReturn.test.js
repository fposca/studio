import test from "node:test";
import assert from "node:assert/strict";
import { completeFrequency09, normalizeArcadeProgress, revisitStoreAfterVision } from "./arcadeProgress.js";
import { advanceStoreInvestigation, storeInvestigationObjective } from "./recordStoreReturn.js";
import { INITIAL_STORE_PROGRESS, getStoreDialogueNode } from "./recordStoreDialogue.js";
import { createNewUniverseGame, readUniverseSaves, writeUniverseSave } from "./neonUniverseSaves.js";

test("the altered shop stays locked before FREQUENCY 09 and old saves normalize safely", () => {
  const oldSave = normalizeArcadeProgress({ recordStoreRevisitedAfterVision: true });
  assert.equal(oldSave.recordStoreFutureVisionSeen, false);
  assert.equal(oldSave.recordStoreAlteredIntroSeen, false);
  assert.equal(storeInvestigationObjective(oldSave), null);
  assert.equal(advanceStoreInvestigation(oldSave, "intro"), oldSave);
  const normalTito = getStoreDialogueNode("tito", "greeting", INITIAL_STORE_PROGRESS, {});
  assert.equal(normalTito.options.some((item) => item.id === "altered:tito"), false);
});

test("the store investigation advances in order, survives a save and keeps old dialogue", () => {
  let progress = revisitStoreAfterVision(completeFrequency09(null));
  const context = { recordStoreAltered: true, storeInvestigation: progress };
  const tito = getStoreDialogueNode("tito", "greeting", INITIAL_STORE_PROGRESS, context);
  assert.ok(tito.options.some((item) => item.id === "altered:tito"));
  assert.ok(tito.options.some((item) => item.id === "topic:tito:discs"));
  assert.equal(advanceStoreInvestigation(progress, "ghost"), progress);
  for (const event of ["intro", "tito", "jukebox", "record", "clue", "ghost"]) {
    progress = advanceStoreInvestigation(progress, event);
    assert.equal(advanceStoreInvestigation(progress, event), progress);
  }
  assert.equal(storeInvestigationObjective(progress), "Volvé al estudio y hablá con Hugo Mendez sobre la señal.");
  assert.equal(getStoreDialogueNode("tito", "altered:tito:intro", INITIAL_STORE_PROGRESS, context).lines.length, 12);
  assert.ok(getStoreDialogueNode("rulo", "altered:rulo", INITIAL_STORE_PROGRESS, context).lines.length > 0);
  assert.ok(getStoreDialogueNode("roxy", "altered:roxy", INITIAL_STORE_PROGRESS, context).lines.length > 0);
  const data = createNewUniverseGame();
  data.arcadeProgress = progress;
  const entries = new Map();
  const storage = { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  assert.equal(writeUniverseSave("slot-1", data, storage, 1234).ok, true);
  const restored = readUniverseSaves(storage)["slot-1"].data.arcadeProgress;
  assert.equal(restored.recordStoreGhostSeen, true);
  assert.equal(storeInvestigationObjective(restored), "Volvé al estudio y hablá con Hugo Mendez sobre la señal.");
});
