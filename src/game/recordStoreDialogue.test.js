import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_STORE_PROGRESS, STORE_DIALOGUE_SAVE_KEY, chooseStoreDialogue, getStoreDialogueNode,
  loadStoreProgress, meetStoreNpc, saveStoreProgress
} from "./recordStoreDialogue.js";

function choose(npc, node, choice, progress) {
  return chooseStoreDialogue(npc, node, choice, progress);
}

test("Tito and Rulo gate the forbidden record behind rumor, duel and password", () => {
  let progress = { ...INITIAL_STORE_PROGRESS };
  assert.deepEqual(getStoreDialogueNode("tito", "greeting", progress).options.map((entry) => entry.id),
    ["master:start", "master:hugo", "topic:tito:discs", "topic:tito:door", "more", "bye"]);
  assert.equal(getStoreDialogueNode("rulo", "greeting", progress).options.length, 4);
  assert.equal(choose("tito", "more", "password", progress).changed, false);
  assert.equal(choose("rulo", "more", "duel", progress).changed, false);

  progress = choose("tito", "root", "topic:tito:door", progress).progress;
  assert.equal(progress.rumorKnown, true);
  progress = choose("rulo", "root", "mystery", progress).progress;
  assert.equal(progress.duelUnlocked, true);

  progress = choose("rulo", "duel:0", "duelAnswer:0:0", progress).progress;
  assert.equal(progress.duelStep, 1);
  progress = choose("rulo", "duel:1", "duelAnswer:1:0", progress).progress;
  assert.equal(progress.duelStep, 0);
  assert.equal(progress.passwordKnown, false);

  progress = choose("rulo", "duel:0", "duelAnswer:0:0", progress).progress;
  progress = choose("rulo", "duel:1", "duelAnswer:1:1", progress).progress;
  progress = choose("rulo", "duel:2", "duelAnswer:2:2", progress).progress;
  assert.equal(progress.duelCompleted, true);
  assert.equal(progress.passwordKnown, true);
  assert.equal(progress.archiveUnlocked, false);
  const unlocked = choose("tito", "more", "password", progress);
  assert.equal(unlocked.progress.archiveUnlocked, true);
  assert.equal(choose("tito", "more", "password", unlocked.progress).changed, false);
});

test("dialogue progress is versioned, validated and reacts only to known music", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const progress = meetStoreNpc({ ...INITIAL_STORE_PROGRESS }, "tito");
  assert.equal(saveStoreProgress(progress, storage), true);
  assert.equal(JSON.parse(values.get(STORE_DIALOGUE_SAVE_KEY)).version, 1);
  assert.equal(loadStoreProgress(storage).vendorMet, true);
  values.set(STORE_DIALOGUE_SAVE_KEY, JSON.stringify({ version: 1, progress: { archiveUnlocked: true, passwordKnown: true } }));
  assert.equal(loadStoreProgress(storage).archiveUnlocked, false);
  const music = getStoreDialogueNode("rulo", "greeting", progress, { currentSong: "Burn Lies" });
  assert.match(music.text, /tres semanas/);
  const ordinary = getStoreDialogueNode("rulo", "greeting", progress, { currentSong: "No existe" });
  assert.doesNotMatch(ordinary.text, /tres semanas/);
});

test("Halloween visitors have their own interactions without advancing the Tito and Rulo story", () => {
  const progress = { ...INITIAL_STORE_PROGRESS };
  assert.equal(getStoreDialogueNode("jason", "greeting", progress), null);
  const freddy = getStoreDialogueNode("freddy", "greeting", progress);
  assert.match(freddy.text, /carcajada/);
  assert.deepEqual(freddy.options.map((choice) => choice.id), ["bye"]);
  for (const id of ["skeleton-holy", "skeleton-unholy"]) {
    const node = getStoreDialogueNode(id, "greeting", progress);
    assert.equal(node.text, "Neonboy, ¿sos vos?");
    assert.equal(choose(id, "greeting", "bye", progress).changed, false);
  }
});
