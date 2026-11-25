import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createUnderworldExpansion } from "./underworldExpansion.js";
import { createNeonOrbAbility } from "./neonOrbAbility.js";
import { advanceUnderworld, normalizeUnderworldProgress } from "./underworldQuest.js";

test("the ferryman's boat uses elapsed time, freezes on pause, and restores control", () => {
  let progress = normalizeUnderworldProgress({
    arrivalRead: true, visionActive: true, bridgeCrossed: true,
    flames: [0, 1, 2, 3, 4, 5], bridgeTrialComplete: true,
    ferrymanTrialStarted: true, memorySymbols: ["memory", "oblivion", "rebirth"],
    ferryStarted: true,
  }, true);
  const events = [];
  const scene = createUnderworldExpansion(new THREE.Group(), (event) => {
    events.push(event);
    progress = advanceUnderworld(progress, event, undefined, true);
  });
  const player = { x: 2.55, z: -11.3, y: 0, grounded: true };
  for (let i = 0; i < 100; i++) scene.update(.05, i * .05, progress, player, true);
  assert.equal(progress.ferryCompleted, false);
  assert.equal(player.z, -11.3);
  for (let i = 0; i < 220; i++) scene.update(.05, i * .05, progress, player, false);
  assert.equal(progress.ferryCompleted, true);
  assert.ok(Math.abs(player.z + 35.9) < .01);
  assert.ok(Math.abs(player.x - 5.7) < .01);
  assert.deepEqual(events.filter((event) => event === "ferry-complete"), ["ferry-complete"]);
  scene.update(.05, 12, progress, player, false);
  assert.equal(scene.transporting, false);
  scene.dispose();
});

test("dangerous bridge sections hurt once and return NeonBoy to a safe checkpoint", () => {
  const progress = normalizeUnderworldProgress({
    arrivalRead: true, visionActive: true, flames: [0, 1, 2, 3, 4, 5],
  }, true);
  let damage = 0;
  const scene = createUnderworldExpansion(new THREE.Group(), () => {}, () => { damage++; });
  const player = { x: .85, z: -16.5, y: 0, grounded: true };
  for (let i = 0; i < 5; i++) scene.update(.05, i * .05, progress, player, false);
  assert.equal(damage, 1);
  assert.equal(player.z, -15.1);
  scene.dispose();
});

test("ferry duration follows real delta when rendering falls to ten FPS", () => {
  let progress = normalizeUnderworldProgress({
    arrivalRead: true, visionActive: true, bridgeCrossed: true,
    flames: [0,1,2,3,4,5], bridgeTrialComplete: true,
    ferrymanTrialStarted: true, memorySymbols: ["memory","oblivion","rebirth"],
    ferryStarted: true,
  }, true);
  const scene = createUnderworldExpansion(new THREE.Group(), (event) => {
    progress = advanceUnderworld(progress, event, undefined, true);
  });
  const player = { x: 2.55, z: -11.3, y: 0, grounded: true };
  for (let i = 0; i < 111; i++)
    scene.update(.05, i * .1, progress, player, false, undefined, false, .1);
  assert.equal(progress.ferryCompleted, true);
  scene.dispose();
});

test("orb targets reveal the rebirth symbol and the three shield runes only in frequency vision", () => {
  let progress = normalizeUnderworldProgress({
    arrivalRead: true, visionActive: false, bridgeCrossed: true,
    flames: [0,1,2,3,4,5], bridgeTrialComplete: true, ferrymanTrialStarted: true,
    testigoHealth: 3, shieldActive: true,
  }, true);
  const scene = createUnderworldExpansion(new THREE.Group(), (event, value) => {
    progress = advanceUnderworld(progress, event, value, true);
  });
  assert.deepEqual(scene.getTargets(progress).map((target) => target.id), ["underworld-rebirth"]);
  scene.registerImpact({ id: "underworld-rebirth" });
  assert.ok(progress.memorySymbols.includes("rebirth"));
  progress = advanceUnderworld(progress, "vision-toggle", undefined, true);
  assert.equal(scene.getTargets(progress).filter((target) => target.id.startsWith("underworld-rune-")).length, 3);
  for (let i = 0; i < 3; i++) scene.registerImpact({ id: "underworld-rune-" + i });
  assert.equal(progress.shieldBroken, true);
  assert.equal(scene.getTargets(progress).filter((target) => target.id.startsWith("underworld-rune-")).length, 0);
  scene.dispose();
});
test("a forward Neon Orb shot recovers the Renacimiento symbol from the approach", () => {
  let progress = normalizeUnderworldProgress({
    ferrymanTrialStarted: true, memorySymbols: ["memory", "oblivion"],
  }, true);
  const root = new THREE.Scene();
  const expansion = createUnderworldExpansion(root, (event, value) => {
    progress = advanceUnderworld(progress, event, value, true);
  });
  const orb = createNeonOrbAbility(root, {
    getTargets: () => expansion.getTargets(progress),
    getColliders: () => [],
    getMaxRange: () => 12,
    onHit: (target) => expansion.registerImpact(target),
  });
  const player = { x: -0.15, y: 0, z: -10.2 };
  assert.equal(orb.fire(player, Math.PI), true);
  for (let i = 0; i < 40 && !progress.memorySymbols.includes("rebirth"); i++)
    orb.update(.05, player, i * .05);
  assert.equal(progress.memorySymbols.includes("rebirth"), true);
  orb.dispose();
  expansion.dispose();
});

