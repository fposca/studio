import test from "node:test";
import assert from "node:assert/strict";
import { advanceThrone, normalizeThroneProgress, throneObjective } from "./throneQuest.js";
import { canStandInThrone, safeThroneSpawn } from "./throneLayout.js";

const step = (progress, event, value) => advanceThrone(progress, event, value, true);
function solvedHall() {
  let p = step(null, "enter");
  p = step(p, "inscription"); p = step(p, "vision-toggle");
  for (const vow of ["memoria", "voluntad", "libertad"]) p = step(p, "vow", vow);
  return p;
}
function solvedCore() {
  let p = solvedHall();
  for (const id of ["origen", "eco", "enlace"]) p = step(p, "inspect-core", id);
  p = step(p, "reflector-rotate"); p = step(p, "reflector-hit");
  p = step(p, "reflector-rotate"); p = step(p, "reflector-hit");
  p = step(p, "reflector-rotate"); p = step(p, "reflector-hit");
  return p;
}

test("chapter 13 remains locked behind the completed Cathedral", () => {
  assert.equal(advanceThrone(null, "enter", null, false).entered, false);
  assert.equal(normalizeThroneProgress({ completed: true, throneOpen: true }, false).completed, false);
});

test("wrong oath resets only the sequence and correct order opens the hall", () => {
  let p = step(null, "inscription");
  p = step(p, "vow", "memoria"); assert.equal(p.vows.length, 0);
  p = step(p, "vision-toggle"); p = step(p, "vow", "memoria");
  p = step(p, "vow", "libertad"); assert.deepEqual(p.vows, []);
  p = step(p, "vow", "memoria"); p = step(p, "vow", "voluntad"); p = step(p, "vow", "libertad");
  assert.equal(p.hallOpen, true);
  assert.equal(canStandInThrone(0, -20, p), true);
});

test("core requires examination, vision, aligned reflector and three real Orb hits", () => {
  let p = solvedHall();
  p = step(p, "reflector-hit"); assert.equal(p.conductors.length, 0);
  for (const id of ["origen", "eco", "enlace"]) p = step(p, "inspect-core", id);
  p = step(p, "reflector-hit"); assert.equal(p.conductors.length, 0);
  p = step(p, "reflector-rotate"); p = step(p, "reflector-hit");
  assert.deepEqual(p.conductors, ["origen"]);
  p = step(p, "vision-toggle"); p = step(p, "reflector-rotate"); p = step(p, "reflector-hit");
  assert.equal(p.conductors.length, 1);
  p = step(p, "vision-toggle"); p = step(p, "reflector-hit");
  p = step(p, "reflector-rotate"); p = step(p, "reflector-hit");
  assert.equal(p.throneOpen, true);
  assert.equal(canStandInThrone(0, -54, p), true);
});

test("boss shield, fracture, defeat, retry and future coordinate follow actual progress", () => {
  let p = step(solvedCore(), "boss-intro");
  for (let i = 0; i < 4; i++) p = step(p, "boss-hit");
  assert.equal(p.bossHealth, 8); assert.equal(p.shieldActive, true);
  assert.equal(step(p, "boss-hit").bossHealth, 8);
  p = step(p, "shield-node", "origen"); assert.equal(p.shieldNodes.length, 1);
  for (const id of ["eco", "enlace"]) p = step(p, "shield-node", id);
  assert.equal(p.shieldActive, false);
  const checkpoint = step(p, "retry");
  assert.equal(checkpoint.throneOpen, true);
  assert.equal(checkpoint.bossHealth, 12);
  p = step(p, "transmission"); assert.equal(p.transmissionExamined, false);
  for (let i = 0; i < 8; i++) p = step(p, "boss-hit");
  assert.equal(p.bossDefeated, true);
  assert.equal(throneObjective(p), "Investigá la transmisión temporal detrás del trono.");
  p = step(p, "transmission"); p = step(p, "complete");
  assert.equal(normalizeThroneProgress(p, true).futureCoordinate, "Buenos Aires, 2049");
  assert.equal(safeThroneSpawn({x:0,z:-95,yaw:0},p).z, -54);
});
