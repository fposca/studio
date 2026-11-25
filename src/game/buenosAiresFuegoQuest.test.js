import test from "node:test";
import assert from "node:assert/strict";
import { advanceBuenosAires, normalizeBuenosAiresProgress, buenosAiresObjective } from "./buenosAiresQuest.js";
import { countFuegoComponents, countFuegoInstalled } from "./buenosAiresFuegoQuest.js";

const defeated = {
  entered: true, introSeen: true, advertisingComplete: true, trafficComplete: true,
  coreComplete: true, synchronizationSeen: true, vigilanteEncountered: true,
  vigilanteStarted: true, vigilanteDefeated: true, record1999Found: true,
  escapeUnlocked: true, escapeBriefed: true,
};
const step = (p, event) => advanceBuenosAires(p, event, true);

test("old victory saves keep the boss and 1999 clue but must repair the Fuego", () => {
  const p = normalizeBuenosAiresProgress(defeated, true);
  assert.equal(p.vigilanteDefeated, true);
  assert.equal(p.record1999Found, true);
  assert.equal(p.escapeUnlocked, false);
  assert.equal(p.fuegoStarted, false);
  assert.match(buenosAiresObjective(p), /REVISÁ EL RENAULT/);
  assert.equal(step(p, "fuego-power-take").fuegoPowerCellTaken, false);
});

test("all three components require their clues and explicit collection", () => {
  let p = step(defeated, "fuego-start");
  assert.equal(p.fuegoStarted, true);
  assert.match(buenosAiresObjective(p), /0\/3/);
  assert.equal(step(p, "fuego-key-take").fuegoKeyTaken, false);
  p = step(p, "vision-toggle");
  p = step(p, "fuego-key-discover");
  p = step(p, "fuego-key-take");
  assert.equal(p.fuegoKeyTaken, true);
  assert.equal(step(p, "fuego-power-maintenance").fuegoPowerMaintenanceOpen, false);
  p = step(p, "fuego-power-examine");
  p = step(p, "fuego-power-maintenance");
  p = step(p, "fuego-power-take");
  assert.equal(p.fuegoPowerCellTaken, true);
  assert.equal(step(p, "fuego-navigation-symbol:calle").fuegoNavigationSequence.length, 0);
  for (const id of ["libertad", "calle", "cielo"])
    p = step(p, "fuego-navigation-clue:" + id);
  p = step(p, "fuego-navigation-symbol:calle");
  p = step(p, "fuego-navigation-symbol:libertad");
  assert.deepEqual(p.fuegoNavigationSequence, []);
  for (const id of ["calle", "cielo", "libertad"])
    p = step(p, "fuego-navigation-symbol:" + id);
  assert.equal(p.fuegoNavigationTerminalOpen, true);
  p = step(p, "fuego-navigation-take");
  assert.equal(countFuegoComponents(p), 3);
  assert.match(buenosAiresObjective(p), /VOLVÉ AL RENAULT/);
  assert.deepEqual(normalizeBuenosAiresProgress(JSON.parse(JSON.stringify(p)), true), p);
});

test("installed parts, archive reveal and ignition persist without completing chapter", () => {
  let p = step(defeated, "fuego-start");
  p = step(p, "vision-toggle");
  for (const event of ["fuego-key-discover", "fuego-key-take", "fuego-power-examine",
    "fuego-power-maintenance", "fuego-power-take",
    ...["calle", "cielo", "libertad"].map(id => "fuego-navigation-clue:" + id),
    ...["calle", "cielo", "libertad"].map(id => "fuego-navigation-symbol:" + id),
    "fuego-navigation-take"])
    p = step(p, event);
  assert.equal(step(p, "fuego-power-on").fuegoPowered, false);
  for (const id of ["fuego_key", "fuego_power_cell", "fuego_navigation_module"])
    p = step(p, "fuego-install:" + id);
  assert.equal(countFuegoInstalled(p), 3);
  assert.equal(p.fuegoRecordShown, false);
  p = step(p, "fuego-record-shown");
  assert.equal(p.fuegoRecordShown, true);
  p = step(p, "fuego-power-on");
  assert.equal(p.fuegoPowered, true);
  assert.equal(p.escapeUnlocked, true);
  assert.equal(p.completed, false);
  assert.deepEqual(normalizeBuenosAiresProgress(JSON.parse(JSON.stringify(p)), true), p);
});
