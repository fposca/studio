import test from "node:test";
import assert from "node:assert/strict";
import { finishArcadeMiniGame, finishOrbitDuel, normalizeArcadeProgress } from "./arcadeProgress.js";
import { createNewUniverseGame, readUniverseSaves, writeUniverseSave } from "./neonUniverseSaves.js";
import { getArcadeDialogueNode } from "./arcadeDialogue.js";

test("arcade records stay separate and preserve old ORBIT DUEL scores", () => {
  const old = normalizeArcadeProgress({ bestScore: 2200, gamesPlayed: 4 });
  assert.equal(old.bestScore, 2200);
  const pixel = finishArcadeMiniGame(old, "pixel", { score: 450, won: true });
  const brawl = finishArcadeMiniGame(pixel, "brawl", { score: 710, won: true, roundsWon: 2 });
  const jungle = finishArcadeMiniGame(brawl, "jungle", { score: 930, won: true, accuracy: 89, maxCombo: 18 });
  assert.equal(jungle.bestScore, 2200);
  assert.equal(jungle.records.pixel.bestScore, 450);
  assert.equal(jungle.records.brawl.bestRounds, 2);
  assert.equal(jungle.records.jungle.bestAccuracy, 89);
  assert.equal(finishOrbitDuel(jungle, 100).progress.records.jungle.bestScore, 930);
});

test("arcade records survive universe save and load in another scene", () => {
  const store = new Map(), storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const game = createNewUniverseGame();
  game.scene = "arcade";
  game.arcadeProgress = finishArcadeMiniGame(game.arcadeProgress, "pixel", { score: 600, won: true });
  assert.equal(writeUniverseSave("slot-1", game, storage, 1000).ok, true);
  const saved = readUniverseSaves(storage)["slot-1"].data;
  saved.scene = "store";
  assert.equal(writeUniverseSave("slot-1", saved, storage, 2000).ok, true);
  assert.equal(readUniverseSaves(storage)["slot-1"].data.arcadeProgress.records.pixel.bestScore, 600);
});

test("new NPC topics and success comments appear without replacing existing topics", () => {
  let progress = normalizeArcadeProgress(null);
  progress = finishArcadeMiniGame(progress, "pixel", { score: 600, won: true });
  progress = finishArcadeMiniGame(progress, "brawl", { score: 700, won: true, roundsWon: 2 });
  progress = finishArcadeMiniGame(progress, "jungle", { score: 800, won: true, accuracy: 90, maxCombo: 10 });
  const topics = (npc) => getArcadeDialogueNode(npc, "menu", progress, true).options.map(({ id }) => id);
  assert.ok(topics("pixel").includes("recommendations") && topics("pixel").includes("frequency"));
  assert.ok(topics("pixel").includes("sprintWin"));
  assert.ok(topics("nico").includes("brawl") && topics("nico").includes("brawlWin"));
  assert.ok(topics("vicky").includes("rhythm") && topics("vicky").includes("rhythmWin"));
});
