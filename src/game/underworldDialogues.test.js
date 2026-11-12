import test from "node:test";
import assert from "node:assert/strict";
import {
  UNDERWORLD_DIALOGUES, UNDERWORLD_SEQUENCES, UNDERWORLD_RANDOM_IDS,
  chooseUnderworldRandom, underworldConversationFor, underworldSubtitleDuration,
} from "./underworldDialogues.js";

test("every chapter 11 subtitle has a unique future audio identifier without loading a file", () => {
  const ids = Object.values(UNDERWORLD_SEQUENCES).flatMap((sequence) => sequence.ids);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    const line = UNDERWORLD_DIALOGUES[id];
    assert.ok(line.text.length > 0);
    assert.ok(line.speaker.length > 0);
    assert.equal(line.futureAudio, `/audio/underworld/${id}.mp3`);
    assert.ok(line.event);
    assert.ok(line.condition);
  }
  assert.equal(UNDERWORLD_SEQUENCES["testigo-intro"].ids.length, 9);
  assert.equal(UNDERWORLD_SEQUENCES["alma-first"].ids.length, 7);
});

test("Alma and Ferryman conversations follow the saved encounter and sentinel state", () => {
  const fresh = { almaMet: false, barqueroMet: false, enemies: [3, 3] };
  assert.equal(underworldConversationFor("alma", fresh), "alma-first");
  assert.equal(underworldConversationFor("barquero", fresh), "barquero-first");
  assert.equal(underworldConversationFor("alma", { ...fresh, almaMet: true }), "alma-followup");
  assert.equal(underworldConversationFor("barquero", { ...fresh, barqueroMet: true }), "barquero-hint");
  assert.equal(underworldConversationFor("barquero", { ...fresh, barqueroMet: true, enemies: [0, 0] }), "barquero-after");
  assert.equal(underworldConversationFor("barquero", { ...fresh, barqueroMet: true, enemies: [0, 0], barqueroAfterSentinelsHeard: true }), "barquero-hint");
});

test("ambient lines are paced and never repeat immediately", () => {
  assert.equal(UNDERWORLD_RANDOM_IDS.length, 5);
  for (const id of UNDERWORLD_RANDOM_IDS) assert.notEqual(chooseUnderworldRandom(id, () => 0), id);
  assert.ok(underworldSubtitleDuration("A") >= 2200);
  assert.ok(underworldSubtitleDuration("A".repeat(300)) <= 6500);
});
