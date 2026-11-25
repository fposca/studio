import test from "node:test";
import assert from "node:assert/strict";
import { UNDERWORLD_MAX_HEALTH, advanceUnderworld, normalizeUnderworldProgress, underworldObjective } from "./underworldQuest.js";
import { UNDERWORLD_PORTAL_STOP_Z, canStandInUnderworld } from "./underworldLayout.js";
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
  assert.equal(canStandInUnderworld(0, -23, false, 1.08, { mechanismSolved: true, ferryCompleted: true }), true);
  assert.equal(canStandInUnderworld(0, -33, true, 1.08, { ferryCompleted: false }), false);
  assert.equal(canStandInUnderworld(0, -33, true, 1.08, { ferryCompleted: true }), true);
});

test("the red door and altar block movement, and old saves return in front of them", () => {
  assert.equal(canStandInUnderworld(0, UNDERWORLD_PORTAL_STOP_Z + .01, true), true);
  assert.equal(canStandInUnderworld(0, UNDERWORLD_PORTAL_STOP_Z - .01, true), false);
  assert.equal(canStandInUnderworld(2.8, -51, true), false);
  const game = createNewUniverseGame();
  game.scene = "underworld";
  game.chapter10Progress = {coreAnalyzed:true,signalDetected:true,hugoConsulted:true,signalReconstructed:true,underworldUnlocked:true,chapterCompleted:true};
  game.underworldProgress = {bridgeCrossed:true,completed:true,enemies:[0,0]};
  game.positions.underworld = {x:0,z:-52.2,yaw:Math.PI,viewYaw:0};
  const restored = normalizeUniverseGame(game);
  assert.equal(restored.positions.underworld.z, -47.9);
  assert.equal(canStandInUnderworld(restored.positions.underworld.x, restored.positions.underworld.z, true), true);
});

test("the expanded chapter requires every stage before the red door opens", () => {
  let p = normalizeUnderworldProgress(undefined, true);
  const step = (event, value) => { p = advanceUnderworld(p, event, value, true); };
  step("arrival");
  assert.match(underworldObjective(p), /seis llamas/);
  for (let i = 0; i < 6; i++) step("flame-activate", i);
  step("altar");
  assert.equal(p.completed, false);
  assert.match(underworldObjective(p), /Visi/);
  step("vision-toggle");
  step("bridge-trial-complete");
  assert.equal(p.bridgeTrialComplete, true);
  step("ferryman-start");
  step("symbol-memory");
  assert.equal(p.memorySymbols.length, 0);
  step("memory-clue");
  step("symbol-memory");
  step("symbol-oblivion");
  step("symbol-rebirth");
  assert.deepEqual(p.memorySymbols, ["memory", "oblivion", "rebirth"]);
  step("ferry-start");
  step("ferry-complete");
  step("ring-activate", "rebirth");
  assert.deepEqual(p.ringSequence, []);
  assert.equal(p.ringMistakeCount, 1);
  step("ring-activate", "memory");
  step("ring-activate", "oblivion");
  step("ring-activate", "rebirth");
  assert.equal(p.mechanismSolved, true);
  for (const enemy of [0, 1]) for (let i = 0; i < 3; i++) step("ambush-hit", enemy);
  for (const enemy of [0, 1]) for (let i = 0; i < UNDERWORLD_MAX_HEALTH.sentinel; i++) step("enemy-hit", enemy);
  for (let i = 0; i < UNDERWORLD_MAX_HEALTH.gargola; i++) step("gargola-hit");
  step("testigo-intro-seen");
  for (let i = 0; i < 5; i++) step("testigo-hit");
  assert.equal(p.testigoHealth, 3);
  assert.equal(p.shieldActive, true);
  step("testigo-hit");
  assert.equal(p.testigoHealth, 3);
  for (let i = 0; i < 3; i++) step("witness-rune-hit", i);
  assert.equal(p.shieldActive, false);
  assert.equal(p.shieldBroken, true);
  for (let i = 0; i < 3; i++) step("testigo-hit");
  step("altar");
  assert.equal(p.completed, false);
  step("testigo-defeat-line-seen");
  step("altar");
  assert.equal(p.completed, true);
  assert.equal(normalizeUnderworldProgress(p, true).completed, true);
});

test("new incomplete saves cannot bypass the expanded stages with old bridge flags", () => {
  const old = normalizeUnderworldProgress({ arrivalRead: true, bridgeCrossed: true,
    enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, completed: false }, true);
  assert.equal(old.completed, false);
  assert.equal(old.flames.length, 0);
  assert.equal(old.mechanismSolved, false);
  assert.equal(advanceUnderworld(old, "altar", undefined, true).completed, false);
});

test("completed chapter 11 saves stay complete after adding encounters", () => {
  const saved = {arrivalRead:true,visionActive:true,bridgeCrossed:true,enemies:[0,0],completed:true};
  const restored = normalizeUnderworldProgress(saved, true);
  assert.equal(restored.gargolaHealth, 0);
  assert.equal(restored.testigoHealth, 0);
  assert.equal(restored.completed, true);
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


test("unfinished old arena saves return to the dock side without losing combat progress", () => {
  const game = createNewUniverseGame();
  game.scene = "underworld";
  game.chapter10Progress = {coreAnalyzed:true,signalDetected:true,hugoConsulted:true,
    signalReconstructed:true,underworldUnlocked:true,chapterCompleted:true};
  game.underworldProgress = { arrivalRead:true, visionActive:true, bridgeCrossed:true,
    enemies:[0,5], gargolaHealth:2, testigoHealth:8, completed:false };
  game.positions.underworld = {x:0,z:-36,yaw:Math.PI,viewYaw:0};
  const restored = normalizeUniverseGame(game);
  assert.equal(restored.positions.underworld.z, 10.5);
  assert.deepEqual(restored.underworldProgress.enemies, [0,5]);
});

test("older partial fights retain proportional damage and defeated enemies", () => {
  const saved = { bridgeCrossed: true, enemies: [2, 0], gargolaHealth: 1,
    testigoHealth: 3, testigoIntroSeen: true };
  const upgraded = normalizeUnderworldProgress(saved, true);
  assert.deepEqual(upgraded.enemies, [4, 0]);
  assert.equal(upgraded.gargolaHealth, 2);
  assert.equal(upgraded.testigoHealth, 5);
  assert.equal(upgraded.combatVersion, 1);
  assert.deepEqual(normalizeUnderworldProgress(upgraded, true), upgraded);
});
