import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_LOST_SHIP_PROGRESS, advanceLostShipProgress, normalizeLostShipProgress,
  lostShipPressures, SHIP_ACCESS_ORDER, SHIP_CIRCUIT_ORDER, SHIP_LOCKER_ORDER,
  SHIP_NAVIGATION_ORDER,
} from "./lostShipQuest.js";

function run(progress, event, value) { return advanceLostShipProgress(progress, event, value); }
test("Puerta 01 can be completed from the azotea record without circular dependencies", () => {
  let p = { ...INITIAL_LOST_SHIP_PROGRESS };
  p = run(p, "hugo");
  for (const [index, turns] of [[0, 2], [1, 2], [2, 2]]) for (let n = 0; n < turns; n++) p = run(p, "signal-rotate", index);
  p = run(p, "signal-decode");
  p = run(p, "link");
  p = run(p, "arrive");
  p = run(p, "access-log");
  for (const symbol of SHIP_ACCESS_ORDER) p = run(p, "access-symbol", symbol);
  p = run(p, "access-open");
  // The module and locker clues are reachable before the reactor is powered.
  p = run(p, "module-take");
  for (const clue of ["monitor", "log", "sign"]) p = run(p, "locker-clue", clue);
  for (const symbol of SHIP_LOCKER_ORDER) p = run(p, "locker-symbol", symbol);
  p = run(p, "locker-open");
  p = run(p, "reactor-examine");
  p = run(p, "module-use");
  for (const circuit of SHIP_CIRCUIT_ORDER) p = run(p, "circuit-add", circuit);
  p = run(p, "circuit-restore");
  for (const [index, value] of [2, 1, 2].entries()) p = run(p, "regulator", { index, value });
  assert.deepEqual(lostShipPressures(p.regulators), [5, 5, 5]);
  p = run(p, "life-stabilize");
  p = run(p, "card-use");
  for (const clue of ["storage", "bridge", "reactor"]) p = run(p, "navigation-clue", clue);
  for (const [index, value] of SHIP_NAVIGATION_ORDER.entries()) p = run(p, "navigation-select", { index, value });
  p = run(p, "navigation-restore");
  p = run(p, "memory-take");
  p = run(p, "archive-open");
  assert.equal(p.archiveRecovered, false, "The memory must be used from the inventory");
  p = run(p, "memory-use");
  p = run(p, "traveler");
  p = run(p, "archive-open");
  assert.equal(p.archiveRecovered, true);
  assert.equal(normalizeLostShipProgress(JSON.parse(JSON.stringify(p)), true).archiveRecovered, true);
});
test("incorrect sequences and premature actions never skip their prerequisites", () => {
  let p = { ...INITIAL_LOST_SHIP_PROGRESS };
  p = run(p, "link");
  p = run(p, "access-open");
  p = run(p, "module-use");
  p = run(p, "card-use");
  p = run(p, "navigation-restore");
  p = run(p, "archive-open");
  assert.equal(p.linkActivated, false);
  assert.equal(p.archiveRecovered, false);
  p = run(p, "hugo");
  p = run(p, "access-log");
  for (const symbol of [...SHIP_ACCESS_ORDER].reverse()) p = run(p, "access-symbol", symbol);
  p = run(p, "access-open");
  assert.equal(p.accessGranted, false);
  p = run(p, "access-reset");
  assert.deepEqual(p.accessSymbols, []);
});
test("pressure target has one solution in the permitted valve range", () => {
  const matches = [];
  for (let a = 0; a <= 3; a++) for (let b = 0; b <= 3; b++) for (let c = 0; c <= 3; c++)
    if (lostShipPressures([a,b,c]).every(value => value === 5)) matches.push([a,b,c]);
  assert.deepEqual(matches, [[2,1,2]]);
});

test("normalization rejects a forged ending without the preceding clues", () => {
  const p = normalizeLostShipProgress({
    hugoBriefed: true, signalDecoded: true, linkActivated: true,
    accessGranted: true, powerRestored: true, navigationRestored: true,
    memoryTaken: true, memoryInstalled: true, archiveRecovered: true,
  }, true);
  assert.equal(p.linkActivated, false);
  assert.equal(p.archiveRecovered, false);
});

function completedShipSave() {
  return {
    hugoBriefed: true, signalSegments: [0, 1, 2], signalDecoded: true,
    linkActivated: true, arrivalSeen: true, accessLog: true,
    accessSymbols: SHIP_ACCESS_ORDER, accessGranted: true,
    reactorExamined: true, moduleTaken: true, moduleInstalled: true,
    circuitPath: SHIP_CIRCUIT_ORDER, powerRestored: true,
    lockerClues: ["log", "sign", "monitor"], lockerSymbols: SHIP_LOCKER_ORDER, lockerOpened: true,
    regulators: [2, 1, 2], lifeStable: true, bridgeCardUsed: true,
    navigationClues: ["reactor", "storage", "bridge"], navigationValues: SHIP_NAVIGATION_ORDER,
    navigationRestored: true, memoryTaken: true, memoryInstalled: true,
    travelerMet: true, archiveRecovered: true,
  };
}
test("older completed saves unlock the orb and the receiver cannot bypass the trial", () => {
  let p = normalizeLostShipProgress(completedShipSave(), true);
  assert.equal(p.orbUnlocked, true);
  assert.equal(p.orbAnnouncementSeen, false);
  p = run(p, "orb-receiver-hit");
  assert.equal(p.orbReceiverActivated, false);
  p = run(p, "orb-node-hit", 0);
  p = run(p, "orb-node-hit", 0);
  assert.deepEqual(p.orbNodes, [true, false, false]);
  p = run(p, "orb-node-hit", 1);
  p = run(p, "orb-node-hit", 2);
  assert.equal(p.orbDoorOpen, true);
  p = run(p, "orb-receiver-hit");
  assert.equal(p.orbReceiverActivated, false);
  for (let i = 0; i < 3; i++) p = run(p, "orb-enemy-hit");
  assert.equal(p.orbEnemyHealth, 0);
  assert.equal(p.orbEnemyDefeated, true);
  p = run(p, "orb-receiver-hit");
  assert.equal(p.orbReceiverActivated, true);
  assert.equal(normalizeLostShipProgress(JSON.parse(JSON.stringify(p)), true).orbReceiverActivated, true);
});
test("orb events cannot be used before completing Puerta 01", () => {
  let p = normalizeLostShipProgress({ ...INITIAL_LOST_SHIP_PROGRESS, orbNodes: [true, true, true], orbEnemyHealth: 0, orbReceiverActivated: true }, true);
  p = run(p, "orb-node-hit", 0);
  p = run(p, "orb-enemy-hit");
  assert.equal(p.orbUnlocked, false);
  assert.deepEqual(p.orbNodes, [false, false, false]);
  assert.equal(p.orbEnemyHealth, 3);
  assert.equal(p.orbReceiverActivated, false);
});
