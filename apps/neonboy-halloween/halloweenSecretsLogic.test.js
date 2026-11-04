import test from "node:test";
import assert from "node:assert/strict";
import { SECRET_COVERS, MIRROR_MESSAGES, PHONE_LINES, HALLOWEEN_NPC_IDS, nextPhoneInterval, getAnniversaryProgress, canUnlockAnniversary, canSummonJudge, canUnlockSecretVinyl } from "./halloweenSecretsLogic.js";
import { STORE_NPCS } from "../../src/game/recordStoreDialogue.js";

test("secret cover swaps Holy Fire visually without changing album data", () => {
  assert.equal(SECRET_COVERS["holy-fire"].alternateId, "unholy-fire");
  assert.equal(SECRET_COVERS.glowshine.alternateId, null);
  assert.equal(MIRROR_MESSAGES.length, 5);
  assert.equal(PHONE_LINES.length, 4);
  assert.deepEqual(new Set(HALLOWEEN_NPC_IDS), new Set(STORE_NPCS.map((npc) => npc.id)));
});
test("phone calls stay within the active play interval", () => {
  assert.equal(nextPhoneInterval(() => 0, true), 12);
  assert.equal(nextPhoneInterval(() => 1, true), 24);
  assert.equal(nextPhoneInterval(() => 0), 18);
  assert.equal(nextPhoneInterval(() => 1), 30);
});
test("the anniversary follows the Judge and the optional archive unlocks the pink vinyl", () => {
  const discovered = new Set([
    ...Object.keys(SECRET_COVERS),
    ...MIRROR_MESSAGES.map((_, index) => `mirror:${index}`),
    ...PHONE_LINES.map((_, index) => `phone:${index}`),
    "vhs:inserted", "matrix-message:entry", "matrix-message:logo",
    ...HALLOWEEN_NPC_IDS.map((id) => `npc-dialogue:${id}`),
  ]);
  const state = { demonHealth: 0, vhsCollected: true, discovered, songsPlayed: 3 };
  assert.deepEqual(getAnniversaryProgress(state), {
    covers: 4, mirrors: 5, calls: 4, vhsInserted: true, npcDialogues: 7,
    demonDefeated: true, songs: 3, matrixMessages: 2, completed: 27, total: 27,
  });
  assert.equal(canUnlockAnniversary(state), false);
  assert.equal(canUnlockAnniversary({ ...state, judgeDefeated: true }), true);
  assert.equal(canUnlockSecretVinyl({ ...state, judgeDefeated: true }), true);
  const missingOneDialogue = new Set(discovered);
  missingOneDialogue.delete("npc-dialogue:roxy");
  assert.equal(canUnlockSecretVinyl({ ...state, judgeDefeated: true, discovered: missingOneDialogue }), false);
  assert.equal(canUnlockSecretVinyl({ demonHealth: 3, judgeDefeated: true, vhsCollected: false, discovered: new Set(), songsPlayed: 0 }), false);
  assert.equal(canUnlockAnniversary({ demonHealth: 3, judgeDefeated: true, discovered: new Set(), songsPlayed: 0 }), true);
});


test("anniversary counts only two different configured Matrix messages", () => {
  const state = { discovered: new Set(["matrix-message:entry", "matrix-message:logo", "matrix-message:mirror", "matrix-message:made-up", "matrix-message:freedom"]) };
  assert.equal(getAnniversaryProgress(state).matrixMessages, 2);
  state.discovered = new Set(["matrix-message:entry", "matrix-message:entry", "matrix-message:made-up", "matrix-message:freedom"]);
  assert.equal(getAnniversaryProgress(state).matrixMessages, 1);
});


test("the final Judge waits for the subdemon, four calls, the VHS, seven dialogues and a Matrix view of the mirror", () => {
  const ready = { demonDefeated: true, callsAnswered: 4, vhsInserted: true, npcDialogues: 7, visionActive: true, mirrorInView: true, judgePhase: "inactive" };
  assert.equal(canSummonJudge(ready), true);
  for (const change of [
    { demonDefeated: false }, { callsAnswered: 3 }, { vhsInserted: false },
    { npcDialogues: 6 }, { visionActive: false },
    { mirrorInView: false }, { judgePhase: "combat" },
  ]) assert.equal(canSummonJudge({ ...ready, ...change }), false);
});
