import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ROCK_CLUB_FRIENDS, FRIENDS_TABLE_NPC, INITIAL_FRIENDS_PROGRESS,
  advanceFriendsProgress, getFriendsDialogueNode, chooseFriendsDialogue,
  normalizeFriendsProgress, saveFriendsProgress, loadFriendsProgress,
} from "./rockClubFriends.js";
import { ROCK_CLUB_FRIENDS_TABLE, ROCK_CLUB_LAYOUT, ROCK_CLUB_OBSTACLES } from "./rockClubLayout.js";
import { createNewUniverseGame, normalizeUniverseGame, writeUniverseSave, readUniverseSaves } from "./neonUniverseSaves.js";

const transforms = JSON.parse(readFileSync(new URL("./rockClubActorTransforms.json", import.meta.url), "utf-8"));
const radius = 0.46;
const walkable = (x, z) => Math.abs(x) < ROCK_CLUB_LAYOUT.playerLimitX &&
  z > ROCK_CLUB_LAYOUT.playerBackZ && z < ROCK_CLUB_LAYOUT.playerFrontZ &&
  !ROCK_CLUB_OBSTACLES.some((item) =>
    Math.abs(x - item.x) < item.hx + radius && Math.abs(z - item.z) < item.hz + radius);

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("the five friends use distinct real models, poses and editable positions around a reachable table", () => {
  assert.deepEqual(ROCK_CLUB_FRIENDS.map(({ id }) => id), ["diego", "maxi", "gera", "pablito", "claudia"]);
  assert.equal(FRIENDS_TABLE_NPC.id, "friendsTable");
  assert.equal(new Set(ROCK_CLUB_FRIENDS.map(({ model }) => model)).size, 5);
  for (const friend of ROCK_CLUB_FRIENDS) {
    assert.ok(existsSync(fileURLToPath(friend.model)), friend.id + " model missing");
    assert.ok(friend.clip);
    assert.ok(friend.deferLoad);
    const transform = transforms[friend.id];
    assert.ok(transform && transform.reach >= 1);
    assert.ok(Math.hypot(transform.position[0] + 5.7, transform.position[2] - 0.6) < 3, friend.id + " too far from table");
    assert.ok(!ROCK_CLUB_OBSTACLES.some((item) =>
      Math.abs(transform.position[0] - item.x) < item.hx + 0.32 &&
      Math.abs(transform.position[2] - item.z) < item.hz + 0.32), friend.id + " intersects scenery");
  }
  for (let i = 0; i < ROCK_CLUB_FRIENDS.length; i++) {
    for (let j = i + 1; j < ROCK_CLUB_FRIENDS.length; j++) {
      const a = transforms[ROCK_CLUB_FRIENDS[i].id].position;
      const b = transforms[ROCK_CLUB_FRIENDS[j].id].position;
      assert.ok(Math.hypot(a[0] - b[0], a[2] - b[2]) >= 0.9, "friends overlap");
    }
  }
  assert.ok(walkable(-5.4, 1.8));
  assert.ok(Math.hypot(-5.4 - ROCK_CLUB_FRIENDS_TABLE.x, 1.8 - ROCK_CLUB_FRIENDS_TABLE.z) < ROCK_CLUB_FRIENDS_TABLE.reach);
});

test("each friend has an introduction, repeat greeting and branching topics", () => {
  let progress = normalizeFriendsProgress(INITIAL_FRIENDS_PROGRESS);
  for (const friend of ROCK_CLUB_FRIENDS) {
    const greeting = getFriendsDialogueNode(friend.id, "greeting", progress);
    assert.ok(greeting.lines?.length >= 3, friend.id + " greeting missing");
    assert.ok(greeting.options.length >= 4);
    const topic = greeting.options[0];
    const choice = chooseFriendsDialogue(friend.id, "greeting", topic.id, progress);
    assert.equal(choice.nodeId, topic.next);
    assert.equal(choice.friendsEvent, `discuss:${friend.id}:${topic.id}`);
    assert.ok(getFriendsDialogueNode(friend.id, topic.next, progress).lines.length >= 2);
    progress = advanceFriendsProgress(progress, "meet:" + friend.id);
    progress = advanceFriendsProgress(progress, choice.friendsEvent);
    assert.ok(getFriendsDialogueNode(friend.id, "greeting", progress).text);
    assert.equal(chooseFriendsDialogue(friend.id, topic.next, "back", progress).nodeId, "root");
    assert.equal(chooseFriendsDialogue(friend.id, "root", "bye", progress).nodeId, "farewell");
  }
  assert.equal(progress.met.length, 5);
  assert.equal(progress.topics.length, 5);
});

test("the group conversation gates optional clues and Riky, and only shows post-show lines after a real show event", () => {
  const start = getFriendsDialogueNode("friendsTable", "greeting", INITIAL_FRIENDS_PROGRESS);
  assert.ok(start.lines.some((line) => line.speaker === "DIEGO"));
  assert.equal(start.options.some((choice) => choice.id === "anomaly"), false);
  const ready = getFriendsDialogueNode("friendsTable", "greeting", INITIAL_FRIENDS_PROGRESS, { signalKnown: true });
  assert.equal(ready.options.some((choice) => choice.id === "anomaly"), true);
  const aliens = getFriendsDialogueNode("friendsTable", "aliens", INITIAL_FRIENDS_PROGRESS, { rikyNearby: true });
  assert.ok(aliens.lines.some((line) => line.speaker === "RIKY"));
  assert.equal(getFriendsDialogueNode("friendsTable", "aliens", INITIAL_FRIENDS_PROGRESS).lines.some((line) => line.speaker === "RIKY"), false);
  assert.equal(getFriendsDialogueNode("friendsTable", "anomaly", INITIAL_FRIENDS_PROGRESS), null);
  assert.ok(getFriendsDialogueNode("friendsTable", "anomaly", INITIAL_FRIENDS_PROGRESS, { signalKnown: true }).lines.length);
  assert.equal(getFriendsDialogueNode("diego", "greeting", INITIAL_FRIENDS_PROGRESS).options.some((choice) => choice.id === "postShow"), false);
  assert.ok(getFriendsDialogueNode("diego", "postShow", INITIAL_FRIENDS_PROGRESS, { anomalySeen: true }).lines.length);
  const talked = advanceFriendsProgress(INITIAL_FRIENDS_PROGRESS, "discuss:friendsTable:anomaly");
  assert.equal(talked.anomalyDiscussed, true);
  assert.equal(advanceFriendsProgress(talked, "discuss:friendsTable:anomaly").topics.length, 1);
});

test("friend introductions and topics persist in local progress and game save slots", () => {
  const memory = storage();
  let progress = advanceFriendsProgress(INITIAL_FRIENDS_PROGRESS, "meet:diego");
  progress = advanceFriendsProgress(progress, "meet:friendsTable");
  progress = advanceFriendsProgress(progress, "discuss:diego:music");
  assert.equal(saveFriendsProgress(progress, memory), true);
  assert.deepEqual(loadFriendsProgress(memory), progress);
  const game = createNewUniverseGame();
  game.friendsProgress = progress;
  assert.equal(writeUniverseSave("slot-3", game, memory, 100).ok, true);
  assert.deepEqual(readUniverseSaves(memory)["slot-3"].data.friendsProgress, progress);
  const oldGame = { ...game };
  delete oldGame.friendsProgress;
  assert.deepEqual(normalizeFriendsProgress(readUniverseSaves(memory)["slot-3"].data.friendsProgress), progress);
  assert.deepEqual(createNewUniverseGame().friendsProgress.met, []);
  assert.deepEqual(normalizeUniverseGame(oldGame).friendsProgress.met, []);
});
