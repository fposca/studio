import test from "node:test";
import assert from "node:assert/strict";
import { createNewUniverseGame, normalizeUniverseGame, writeUniverseSave } from "./neonUniverseSaves.js";
import {
  INITIAL_RIKY_PROGRESS, advanceRikyProgress, chooseRikyDialogue,
  getRikyDialogueNode, loadRikyProgress, saveRikyProgress,
} from "./rockClubRiky.js";

const incomplete = { phase: "review" };
const complete = { phase: "complete" };
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test("Riky remembers conversations and keeps the Matrix follow-up available", () => {
  let progress = INITIAL_RIKY_PROGRESS;
  const first = getRikyDialogueNode("greeting", progress, incomplete);
  assert.match(first.lines[0].text, /NeonBoy/);
  const answer = chooseRikyDialogue("greeting", "matrix", progress, incomplete);
  progress = advanceRikyProgress(progress, answer.rikyEvent, incomplete);
  assert.equal(answer.nodeId, "matrix");
  assert.equal(getRikyDialogueNode("matrix", progress, incomplete).options[0].id, "matrix-exit");
  assert.match(getRikyDialogueNode("matrix-exit", progress, incomplete).lines[2].text, /discos del futuro/);
  progress = advanceRikyProgress(progress, "meet", incomplete);
  assert.equal(getRikyDialogueNode("greeting", progress, incomplete).lines, undefined);
  assert.ok(getRikyDialogueNode("root", progress, incomplete).options.some((item) => item.id === "matrix"));
});

test("the optional frequency clue requires the restored master and a relevant talk", () => {
  let progress = advanceRikyProgress(INITIAL_RIKY_PROGRESS, "discuss:time", incomplete);
  assert.ok(!getRikyDialogueNode("root", progress, incomplete).options.some((item) => item.id === "frequency"));
  assert.equal(advanceRikyProgress(progress, "clue", incomplete).rikyFrequencyClueKnown, false);
  assert.ok(getRikyDialogueNode("root", progress, complete).options.some((item) => item.id === "frequency"));
  progress = advanceRikyProgress(progress, "clue", complete);
  assert.equal(progress.rikyFrequencyClueKnown, true);
  assert.equal(advanceRikyProgress(progress, "clue", complete).rikyFrequencyClueKnown, true);
  assert.ok(!getRikyDialogueNode("root", progress, complete, {}).options.some((item) => item.id === "post-show"));
  assert.ok(getRikyDialogueNode("root", progress, complete, { recitalCompleted: true, anomalySeen: true }).options.some((item) => item.id === "post-show"));
});

test("Riky's memory survives legacy storage and is isolated across save slots", () => {
  const local = storage();
  const discussed = advanceRikyProgress(INITIAL_RIKY_PROGRESS, "discuss:paranormal", complete);
  const known = advanceRikyProgress(discussed, "signal", complete);
  assert.equal(saveRikyProgress(known, local), true);
  assert.equal(loadRikyProgress(local).signalKnown, true);
  const first = createNewUniverseGame();
  first.masterTape = { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 };
  first.rikyProgress = advanceRikyProgress(known, "clue", complete);
  const second = createNewUniverseGame();
  assert.equal(writeUniverseSave("slot-1", first, local).ok, true);
  const saved = writeUniverseSave("slot-2", second, local);
  assert.equal(saved.slots["slot-1"].data.rikyProgress.rikyFrequencyClueKnown, true);
  assert.equal(saved.slots["slot-2"].data.rikyProgress.rikyFrequencyClueKnown, false);
  assert.equal(normalizeUniverseGame({ scene: "store" }).rikyProgress.met, false);
  assert.equal(normalizeUniverseGame({ scene: "store", rikyProgress: first.rikyProgress }).rikyProgress.rikyFrequencyClueKnown, false);
});
