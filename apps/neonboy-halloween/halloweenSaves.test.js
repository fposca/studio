import test from "node:test";
import assert from "node:assert/strict";
import { HALLOWEEN_SAVE_KEY, readHalloweenSaves, writeHalloweenSave, deleteHalloweenSave, normalizeHalloweenProgress } from "./halloweenSaves.js";

const storage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test("three local save slots round-trip progress independently", () => {
  const store = storage();
  const newGame = writeHalloweenSave(store, 1, {}, 100);
  assert.equal(newGame.progress.hearts, 3);
  assert.equal(newGame.progress.demonHealth, 3);
  deleteHalloweenSave(store, 1);
  const first = writeHalloweenSave(store, 0, {
    chest: { keyOwned: true, open: true, collected: true }, demonHealth: 0,
    hearts: 2, credits: 7, phoneCalls: 3, belfegorAttempts: 4,
    discoveredSecrets: ["npc-dialogue:tito", "mirror:0"], vhsCollected: true,
    songs: ["track-01"], player: { x: 2, z: -8, yaw: 1 }, firstPerson: true,
  }, 123);
  writeHalloweenSave(store, 2, { judgeDefeated: true, phoneCalls: 4 }, 456);
  const saves = readHalloweenSaves(store);
  assert.equal(saves.length, 3);
  assert.equal(saves[1], null);
  assert.deepEqual(saves[0], first);
  assert.equal(saves[0].progress.chest.collected, true);
  assert.equal(saves[0].progress.player.z, -8);
  assert.ok(saves[0].progress.discoveredSecrets.includes("phone:2"));
  assert.equal(saves[2].progress.judgeDefeated, true);
  deleteHalloweenSave(store, 0);
  assert.equal(readHalloweenSaves(store)[0], null);
  assert.equal(readHalloweenSaves(store)[2].savedAt, 456);
});

test("invalid and stale save data cannot create an unsafe game state", () => {
  const store = storage();
  store.setItem(HALLOWEEN_SAVE_KEY, "{broken");
  assert.deepEqual(readHalloweenSaves(store), [null, null, null]);
  const progress = normalizeHalloweenProgress({
    chest: { collected: true }, hearts: -5, credits: 100, demonHealth: 50,
    phoneCalls: 8, player: { x: Infinity, z: -100 }, discoveredSecrets: ["x", "x", 7],
  });
  assert.equal(progress.chest.keyOwned, true);
  assert.equal(progress.hearts, 1);
  assert.equal(progress.credits, 10);
  assert.equal(progress.demonHealth, 3);
  assert.equal(progress.phoneCalls, 4);
  assert.deepEqual(progress.player, { x: 0, z: -12.15, yaw: Math.PI });
  assert.deepEqual(progress.discoveredSecrets, ["x", "phone:0", "phone:1", "phone:2", "phone:3"]);
});
