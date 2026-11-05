import test from "node:test";
import assert from "node:assert/strict";
import { HALLOWEEN_SAVE_KEY, HALLOWEEN_LEGACY_SAVE_KEY, readHalloweenSaves, writeHalloweenSave, deleteHalloweenSave, normalizeHalloweenProgress } from "./halloweenSaves.js";

const storage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
};

test("one local save keeps progress and can be restarted", () => {
  const store = storage();
  const first = writeHalloweenSave(store, 0, {
    chest: { keyOwned: true, open: true, collected: true }, demonHealth: 0,
    hearts: 2, credits: 7, phoneCalls: 3, belfegorAttempts: 4,
    discoveredSecrets: ["npc-dialogue:tito", "mirror:0"], vhsCollected: true,
    songs: ["track-01"], player: { x: 2, z: -8, yaw: 1 }, firstPerson: true,
  }, 123);
  const saves = readHalloweenSaves(store);
  assert.deepEqual(saves, [first]);
  assert.equal(saves[0].progress.chest.collected, true);
  assert.equal(saves[0].progress.player.z, -8);
  assert.ok(saves[0].progress.discoveredSecrets.includes("phone:2"));
  assert.throws(() => writeHalloweenSave(store, 1, {}, 456), RangeError);
  deleteHalloweenSave(store, 0);
  assert.deepEqual(readHalloweenSaves(store), [null]);
});

test("the newest legacy slot becomes the single save without deleting older data", () => {
  const store = storage();
  const legacy = JSON.stringify({ version: 1, slots: [
    { slot: 0, savedAt: 100, progress: { phoneCalls: 1 } },
    { slot: 1, savedAt: 300, progress: { phoneCalls: 3, credits: 7 } },
    { slot: 2, savedAt: 200, progress: { phoneCalls: 2 } },
  ] });
  store.setItem(HALLOWEEN_LEGACY_SAVE_KEY, legacy);
  const [selected] = readHalloweenSaves(store);
  assert.equal(selected.slot, 0);
  assert.equal(selected.savedAt, 300);
  assert.equal(selected.progress.phoneCalls, 3);
  assert.equal(store.getItem(HALLOWEEN_LEGACY_SAVE_KEY), legacy);
  assert.equal(store.getItem(HALLOWEEN_SAVE_KEY), null);
  writeHalloweenSave(store, 0, selected.progress, 400);
  assert.equal(readHalloweenSaves(store)[0].savedAt, 400);
  assert.equal(store.getItem(HALLOWEEN_LEGACY_SAVE_KEY), legacy);
  deleteHalloweenSave(store, 0);
  assert.deepEqual(readHalloweenSaves(store), [null]);
  assert.equal(store.getItem(HALLOWEEN_LEGACY_SAVE_KEY), null);
  assert.equal(store.getItem(HALLOWEEN_SAVE_KEY), null);
});

test("invalid and stale save data cannot create an unsafe game state", () => {
  const store = storage();
  store.setItem(HALLOWEEN_SAVE_KEY, "{broken");
  assert.deepEqual(readHalloweenSaves(store), [null]);
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

test("new game overwrites the completed local progress with a clean game", () => {
  const store = storage();
  writeHalloweenSave(store, 0, {
    judgeDefeated: true, phoneCalls: 4, demonHealth: 0, credits: 10,
    chest: { collected: true }, discoveredSecrets: ["mirror:0"],
  }, 100);
  const next = writeHalloweenSave(store, 0, {}, 200);
  assert.deepEqual(readHalloweenSaves(store), [next]);
  assert.equal(next.progress.judgeDefeated, false);
  assert.equal(next.progress.phoneCalls, 0);
  assert.equal(next.progress.demonHealth, 3);
  assert.equal(next.progress.credits, 0);
  assert.equal(next.progress.chest.collected, false);
  assert.deepEqual(next.progress.discoveredSecrets, []);
});
