import test from "node:test";
import assert from "node:assert/strict";
import { advanceUnderworld, normalizeUnderworldProgress, underworldObjective } from "./underworldQuest.js";
import { canStandInUnderworld } from "./underworldLayout.js";
import { createNewUniverseGame, normalizeUniverseGame } from "./neonUniverseSaves.js";

test("chapter 11 cannot be entered or advanced before chapter 10 completes", () => {
  const game = createNewUniverseGame();
  game.scene = "underworld";
  assert.equal(normalizeUniverseGame(game).scene, "store");
  assert.equal(advanceUnderworld(undefined, "vision-toggle", undefined, false).visionActive, false);
  assert.equal(advanceUnderworld(undefined, "altar", undefined, false).completed, false);
});

test("frequency vision reveals only the real bridge corridor", () => {
  assert.equal(canStandInUnderworld(0, -23, false), false);
  assert.equal(canStandInUnderworld(0, -23, true), true);
  assert.equal(canStandInUnderworld(4.4, -23, true), false);
  assert.equal(canStandInUnderworld(0, 9, false), true);
  assert.equal(canStandInUnderworld(6, -38, true), true);
});

test("the altar needs a crossed bridge and both defeated sentinels", () => {
  let p = normalizeUnderworldProgress(undefined, true);
  p = advanceUnderworld(p, "arrival", undefined, true);
  assert.match(underworldObjective(p), /Visión de Frecuencia/);
  p = advanceUnderworld(p, "bridge-crossed", undefined, true);
  assert.equal(p.bridgeCrossed, false);
  p = advanceUnderworld(p, "vision-toggle", undefined, true);
  p = advanceUnderworld(p, "bridge-crossed", undefined, true);
  assert.equal(p.bridgeCrossed, true);
  assert.equal(advanceUnderworld(p, "altar", undefined, true).completed, false);
  for (const enemy of [0, 1]) for (let i = 0; i < 2; i++)
    p = advanceUnderworld(p, "enemy-hit", enemy, true);
  assert.deepEqual(p.enemies, [0, 0]);
  p = advanceUnderworld(p, "altar", undefined, true);
  assert.equal(p.completed, true);
  assert.equal(normalizeUnderworldProgress(p, true).completed, true);
});

test("an invalid saved position on an invisible bridge returns to a safe landing", () => {
  const game = createNewUniverseGame();
  game.scene = "underworld";
  game.chapter10Progress = {coreAnalyzed:true,signalDetected:true,hugoConsulted:true,signalReconstructed:true,underworldUnlocked:true,chapterCompleted:true};
  game.underworldProgress = {arrivalRead:true,visionActive:false,bridgeCrossed:false,enemies:[2,2],completed:false};
  game.positions.underworld = {x:4.4,z:-23,yaw:Math.PI,viewYaw:0};
  const restored = normalizeUniverseGame(game);
  assert.equal(restored.scene, "underworld");
  assert.equal(restored.positions.underworld.x, 0);
  assert.equal(restored.positions.underworld.z, 10.5);
});
