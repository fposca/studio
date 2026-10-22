import test from "node:test";
import assert from "node:assert/strict";
import { createOrbitGame, ORBIT_DURATION, stepOrbitGame } from "./orbitDuelLogic.js";
import { finishOrbitDuel, NICO_ORBIT_SCORE, normalizeArcadeProgress, orbitHighScores } from "./arcadeProgress.js";
import { createNewUniverseGame, readUniverseSaves, writeUniverseSave, normalizeUniverseGame } from "./neonUniverseSaves.js";

test("shots destroy enemies and award the enemy's score", () => {
  const game = createOrbitGame(() => .5);
  game.spawnCooldown = 999;
  game.enemies.push({ id: 1, x: 190, y: 220, hp: 1, kind: "scout", speed: 0, score: 100, radius: 13, wave: 0, shotAt: 999 });
  game.shots.push({ x: 190, y: 220, r: 4 });
  const events = stepOrbitGame(game, .016);
  assert.equal(game.score, 100);
  assert.equal(game.enemies.length, 0);
  assert.ok(events.includes("destroy"));
});

test("three hits end the game, then no further ticks alter it", () => {
  const game = createOrbitGame(() => .5);
  game.spawnCooldown = 999;
  for (let i = 0; i < 3; i++) {
    game.invulnerable = 0;
    game.enemyShots.push({ x: game.playerX, y: 506, r: 4 });
    stepOrbitGame(game, .016);
  }
  assert.equal(game.lives, 0);
  assert.equal(game.phase, "ended");
  const snapshot = JSON.stringify(game, (key, value) => key === "random" ? undefined : value);
  stepOrbitGame(game, .04, { fire: true });
  assert.equal(JSON.stringify(game, (key, value) => key === "random" ? undefined : value), snapshot);
});

test("successful runs end after 75 seconds", () => {
  const game = createOrbitGame(() => .5);
  game.spawnCooldown = 999;
  game.time = ORBIT_DURATION - .02;
  const events = stepOrbitGame(game, .03);
  assert.equal(game.phase, "ended");
  assert.ok(events.includes("end"));
});

test("Nico's challenge and optional signal occur once and survive save normalization", () => {
  const first = finishOrbitDuel(normalizeArcadeProgress(null), NICO_ORBIT_SCORE + 100, true);
  assert.equal(first.firstNicoWin, true);
  assert.equal(first.showSignal, true);
  assert.equal(first.progress.beatNico, true);
  const second = finishOrbitDuel(first.progress, 100, true);
  assert.equal(second.firstNicoWin, false);
  assert.equal(second.showSignal, false);
  assert.equal(second.progress.bestScore, NICO_ORBIT_SCORE + 100);
  assert.equal(orbitHighScores(second.progress)[0].name, "NEONBOY");
});

test("Arcade records survive manual save/load and older saves gain safe defaults", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const game = createNewUniverseGame();
  game.arcadeProgress = finishOrbitDuel(game.arcadeProgress, 1900, true).progress;
  game.arcadeProgress = { ...game.arcadeProgress, met: ["pixel", "nico"] };
  assert.equal(writeUniverseSave("slot-2", game, storage, 123).ok, true);
  const restored = readUniverseSaves(storage)["slot-2"].data.arcadeProgress;
  assert.equal(restored.bestScore, 1900);
  assert.equal(restored.signalSeen, true);
  assert.deepEqual(restored.met, ["pixel", "nico"]);
  assert.equal(normalizeUniverseGame({ scene: "arcade" }).arcadeProgress.bestScore, 0);
});

test("quitting after a record preserves the optional signal for a completed run", () => {
  const quit = finishOrbitDuel(normalizeArcadeProgress(null), NICO_ORBIT_SCORE + 50, false);
  assert.equal(quit.progress.beatNico, true);
  assert.equal(quit.progress.signalSeen, false);
  const completed = finishOrbitDuel(quit.progress, 200, true);
  assert.equal(completed.firstNicoWin, false);
  assert.equal(completed.showSignal, true);
  assert.equal(completed.progress.signalSeen, true);
});
