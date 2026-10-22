import test from "node:test";
import assert from "node:assert/strict";
import { advanceMasterTape, INITIAL_MASTER_TAPE_PROGRESS } from "./masterTapeQuest.js";
import { advanceClubShowQuest } from "./clubShowQuest.js";
import { createNewUniverseGame, readUniverseSaves, writeUniverseSave } from "./neonUniverseSaves.js";
import { getUniverseInventory, getUniverseInventoryAction, newlyObtainedInventoryItems } from "./universeInventory.js";

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
const byId = (items, id) => items.find((item) => item.id === id);

test("the tape and master follow their existing mission phases and cannot be delivered twice", () => {
  let masterTape = { ...INITIAL_MASTER_TAPE_PROGRESS };
  assert.deepEqual(getUniverseInventory({ masterTape }), []);
  masterTape = advanceMasterTape(masterTape, "takeTape");
  let items = getUniverseInventory({ masterTape });
  assert.equal(byId(items, "recording-tape").status, "available");
  assert.equal(getUniverseInventoryAction(byId(items, "recording-tape"),
    { scene: "studio", nearby: { kind: "hugo" }, masterTape })?.id, "give-tape");
  masterTape = advanceMasterTape(masterTape, "startReview");
  items = getUniverseInventory({ masterTape });
  assert.equal(byId(items, "recording-tape").status, "delivered");
  assert.equal(getUniverseInventoryAction(byId(items, "recording-tape"),
    { scene: "studio", nearby: { kind: "hugo" }, masterTape }), null);
  for (const channel of ["guitar", "bass", "drums"]) masterTape = advanceMasterTape(masterTape, "inspect:" + channel);
  masterTape = advanceMasterTape(masterTape, "claimMaster");
  items = getUniverseInventory({ masterTape });
  assert.equal(byId(items, "recording-tape").status, "used");
  assert.equal(byId(items, "restored-master").status, "available");
  assert.equal(byId(items, "studio-tokens").quantity, 1);
  masterTape = advanceMasterTape(masterTape, "deliverMaster");
  items = getUniverseInventory({ masterTape });
  assert.equal(byId(items, "restored-master").status, "delivered");
  assert.equal(getUniverseInventoryAction(byId(items, "restored-master"),
    { scene: "store", nearby: { kind: "npc", id: "tito" }, masterTape }), null);
});

test("the credential has a real contextual use and Charly's presentation is persistent", () => {
  const masterTape = { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 };
  let clubQuest = advanceClubShowQuest(null, "hugoSuggestsShow", masterTape);
  clubQuest = advanceClubShowQuest(clubQuest, "titoGrantsCredential", masterTape);
  let credential = byId(getUniverseInventory({ masterTape, clubQuest }), "club-credential");
  assert.equal(credential.status, "available");
  assert.equal(getUniverseInventoryAction(credential, { scene: "store", nearby: { kind: "npc", id: "tito" }, masterTape, clubQuest }), null);
  assert.equal(getUniverseInventoryAction(credential, { scene: "club", nearby: { kind: "club-npc", id: "charly" }, masterTape, clubQuest })?.id, "present-credential");
  clubQuest = advanceClubShowQuest(clubQuest, "charlyAuthorizes", masterTape);
  credential = byId(getUniverseInventory({ masterTape, clubQuest }), "club-credential");
  assert.equal(credential.status, "presented");
  assert.equal(getUniverseInventoryAction(credential, { scene: "club", nearby: { kind: "club-npc", id: "charly" }, masterTape, clubQuest }), null);
});

test("the same ten shop coins are the rockola balance, and the forbidden disc is only an archive access", () => {
  const storyProgress = { archiveUnlocked: true };
  const items = getUniverseInventory({ credits: 7, storyProgress });
  const coins = byId(items, "jukebox-coins");
  assert.equal(coins.quantity, 7);
  assert.equal(coins.capacity, 10);
  assert.match(coins.name, /fichas de rockola/);
  assert.equal(byId(items, "forbidden-archive").status, "unlocked");
  assert.equal(items.some((item) => item.id === "forbidden-disc"), false);
  assert.equal(byId(getUniverseInventory({ credits: 0, storyProgress }), "jukebox-coins"), undefined);
  assert.equal(getUniverseInventoryAction(coins, { scene: "store" })?.id, "open-jukebox");
  assert.equal(getUniverseInventoryAction(coins, { scene: "club" }), null);
});

test("old and new save slots derive their own inventory without an extra mutable ledger", () => {
  const storage = memoryStorage();
  const first = createNewUniverseGame();
  first.masterTape = { phase: "tape", reviewed: [], studioTokens: 0 };
  first.credits = 4;
  const second = createNewUniverseGame();
  second.masterTape = { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 };
  second.clubQuest = { hugoSuggestedShow: true, credentialGranted: true };
  writeUniverseSave("slot-1", first, storage, 100);
  writeUniverseSave("slot-2", second, storage, 200);
  const slots = readUniverseSaves(storage);
  const firstItems = getUniverseInventory(slots["slot-1"].data);
  const secondItems = getUniverseInventory(slots["slot-2"].data);
  assert.equal(byId(firstItems, "recording-tape").status, "available");
  assert.equal(byId(firstItems, "jukebox-coins").quantity, 4);
  assert.equal(byId(firstItems, "club-credential"), undefined);
  assert.equal(byId(secondItems, "restored-master").status, "delivered");
  assert.equal(byId(secondItems, "club-credential").status, "available");
  assert.equal(byId(secondItems, "jukebox-coins"), undefined);
  assert.deepEqual(newlyObtainedInventoryItems(new Set(firstItems.map((item) => item.id)), firstItems), []);
});
