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

test("the altar requires sentinels, gargoyle, and witness", () => {
  let p = normalizeUnderworldProgress(undefined, true);
  p = advanceUnderworld(p, "arrival", undefined, true);
  assert.match(underworldObjective(p), /Visión de Frecuencia/);
  p = advanceUnderworld(p, "bridge-crossed", undefined, true);
  assert.equal(p.bridgeCrossed, false);
  p = advanceUnderworld(p, "vision-toggle", undefined, true);
  p = advanceUnderworld(p, "bridge-crossed", undefined, true);
  assert.equal(p.bridgeCrossed, true);
  assert.equal(advanceUnderworld(p, "altar", undefined, true).completed, false);
  for (const enemy of [0, 1]) for (let i = 0; i < UNDERWORLD_MAX_HEALTH.sentinel; i++)
    p = advanceUnderworld(p, "enemy-hit", enemy, true);
  assert.deepEqual(p.enemies, [0, 0]);
  assert.match(underworldObjective(p), /Gárgola/);
  assert.equal(advanceUnderworld(p, "altar", undefined, true).completed, false);
  for (let i = 0; i < UNDERWORLD_MAX_HEALTH.gargola; i++) p = advanceUnderworld(p, "gargola-hit", undefined, true);
  assert.equal(p.gargolaHealth, 0);
  assert.match(underworldObjective(p), /Testigo/);
  assert.equal(advanceUnderworld(p, "testigo-hit", undefined, true).testigoHealth, UNDERWORLD_MAX_HEALTH.testigo);
  p = advanceUnderworld(p, "testigo-intro-seen", undefined, true);
  assert.equal(p.testigoIntroSeen, true);
  assert.equal(advanceUnderworld(p, "altar", undefined, true).completed, false);
  for (let i = 0; i < UNDERWORLD_MAX_HEALTH.testigo; i++) p = advanceUnderworld(p, "testigo-hit", undefined, true);
  assert.equal(p.testigoHalfLineSeen, true);
  assert.equal(p.testigoHealth, 0);
  assert.equal(advanceUnderworld(p, "altar", undefined, true).completed, false);
  p = advanceUnderworld(p, "testigo-defeat-line-seen", undefined, true);
  p = advanceUnderworld(p, "altar", undefined, true);
  assert.equal(p.completed, true);
  assert.equal(normalizeUnderworldProgress(p, true).completed, true);
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
