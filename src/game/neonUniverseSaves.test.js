import assert from "node:assert/strict";
import test from "node:test";
import {
  UNIVERSE_SAVES_KEY, createNewUniverseGame, latestUniverseSave,
  readUniverseSaves, readUniverseSavesWithLegacy, writeUniverseSave,
} from "./neonUniverseSaves.js";
import { STORE_DIALOGUE_SAVE_KEY } from "./recordStoreDialogue.js";
import { MASTER_TAPE_SAVE_KEY } from "./masterTapeQuest.js";
import { advanceClubShowQuest } from "./clubShowQuest.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("autosave and three manual slots keep independent progress and locations", () => {
  const storage = memoryStorage();
  const first = createNewUniverseGame();
  first.credits = 7;
  first.positions.store = { x: 2, z: -4, yaw: 1, viewYaw: 0.5 };
  assert.equal(writeUniverseSave("autosave", first, storage, 100).ok, true);
  const second = { ...first, scene: "studio", credits: 3,
    masterTape: { phase: "tape", reviewed: [], studioTokens: 0 } };
  assert.equal(writeUniverseSave("slot-2", second, storage, 200).ok, true);
  const slots = readUniverseSaves(storage);
  assert.equal(slots.autosave.data.credits, 7);
  assert.equal(slots["slot-2"].data.credits, 3);
  assert.equal(slots["slot-2"].data.scene, "studio");
  assert.deepEqual(slots["slot-2"].data.mapUnlocks, ["recording-studio"]);
  assert.equal(slots["slot-1"], null);
  assert.equal(latestUniverseSave(slots).id, "slot-2");
});

test("old dialogue and mission keys migrate once without deleting them", () => {
  const storage = memoryStorage();
  storage.setItem(STORE_DIALOGUE_SAVE_KEY, JSON.stringify({ version: 1, progress: { vendorMet: true } }));
  storage.setItem(MASTER_TAPE_SAVE_KEY, JSON.stringify({ version: 1, progress: { phase: "tape", reviewed: [] } }));
  const slots = readUniverseSavesWithLegacy(storage);
  assert.equal(slots.autosave.data.storyProgress.vendorMet, true);
  assert.equal(slots.autosave.data.masterTape.phase, "tape");
  assert.deepEqual(slots.autosave.data.mapUnlocks, ["recording-studio"]);
  assert.ok(storage.getItem(STORE_DIALOGUE_SAVE_KEY));
  assert.ok(storage.getItem(UNIVERSE_SAVES_KEY));
  assert.equal(readUniverseSavesWithLegacy(storage).autosave.savedAt, slots.autosave.savedAt);
});

test("invalid or blocked storage cannot invent a playable save", () => {
  const storage = memoryStorage();
  storage.setItem(UNIVERSE_SAVES_KEY, JSON.stringify({ version: 1, slots: { autosave: { savedAt: 5, data: { scene: "unknown" } } } }));
  assert.equal(readUniverseSaves(storage).autosave, null);
  assert.equal(writeUniverseSave("slot-4", createNewUniverseGame(), storage).ok, false);
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(readUniverseSavesWithLegacy(blocked).autosave, null);
  assert.equal(writeUniverseSave("autosave", createNewUniverseGame(), blocked).ok, false);
});

test("club access and sound-check progress survive a slot without bypassing the credential", () => {
  const storage = memoryStorage();
  const game = createNewUniverseGame();
  game.masterTape = { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 };
  game.mapUnlocks = ["rock-club"];
  assert.equal(writeUniverseSave("autosave", game, storage, 100).ok, true);
  assert.equal(readUniverseSaves(storage).autosave.data.mapUnlocks.includes("rock-club"), false);

  let quest = advanceClubShowQuest(game.clubQuest, "hugoSuggestsShow", game.masterTape);
  quest = advanceClubShowQuest(quest, "titoGrantsCredential", game.masterTape);
  quest = advanceClubShowQuest(quest, "charlyAuthorizes", game.masterTape);
  quest = advanceClubShowQuest(quest, "inspect:mixer", game.masterTape);
  game.clubQuest = quest;
  assert.equal(writeUniverseSave("slot-1", game, storage, 200).ok, true);
  const saved = readUniverseSaves(storage)["slot-1"].data;
  assert.equal(saved.clubQuest.credentialGranted, true);
  assert.equal(saved.clubQuest.backstageAuthorized, true);
  assert.deepEqual(saved.clubQuest.inspected, ["mixer"]);
  assert.equal(saved.mapUnlocks.includes("rock-club"), true);
  for (const id of ["amplifier", "microphone"]) quest = advanceClubShowQuest(quest, "inspect:" + id, game.masterTape);
  quest = advanceClubShowQuest(quest, "completeSoundcheck", game.masterTape);
  game.clubQuest = advanceClubShowQuest(quest, "completeRecital", game.masterTape);
  assert.equal(writeUniverseSave("slot-2", game, storage, 300).ok, true);
  assert.equal(readUniverseSaves(storage)["slot-2"].data.clubQuest.recitalCompleted, true);
  assert.equal(readUniverseSaves(storage)["slot-1"].data.clubQuest.recitalCompleted, false);
  assert.equal(readUniverseSaves(storage)["slot-2"].data.clubQuest.anomalySeen, false);
  game.clubQuest = advanceClubShowQuest(game.clubQuest, "seeAnomaly", game.masterTape);
  game.rikyProgress = { ...game.rikyProgress, postShowSeen: true };
  game.clubQuest = advanceClubShowQuest(game.clubQuest, "inspectAnomaly", game.masterTape);
  assert.equal(writeUniverseSave("slot-3", game, storage, 400).ok, true);
  const investigated = readUniverseSaves(storage)["slot-3"].data;
  assert.equal(investigated.clubQuest.anomalySeen, true);
  assert.equal(investigated.clubQuest.anomalyInvestigated, true);
  assert.equal(investigated.clubQuest.arcadeClueKnown, true);
  assert.equal(investigated.rikyProgress.postShowSeen, true);
  assert.equal(investigated.mapUnlocks.includes("arcade-1999"), true);
  investigated.scene = "arcade";
  investigated.positions.arcade = { x: 0, z: -16.3, yaw: Math.PI, viewYaw: 0 };
  assert.equal(writeUniverseSave("slot-3", investigated, storage, 500).ok, true);
  const arcadeSave = readUniverseSaves(storage)["slot-3"].data;
  assert.equal(arcadeSave.scene, "arcade");
  assert.equal(arcadeSave.positions.arcade.z, -16.3);
});
