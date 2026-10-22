import assert from "node:assert/strict";
import test from "node:test";
import { advanceClubShowQuest, clubShowObjective, loadClubShowQuest, saveClubShowQuest } from "./clubShowQuest.js";
import { getRockClubDialogueNode, chooseRockClubDialogue } from "./rockClubDialogue.js";
import { getStudioDialogueNode, chooseStudioDialogue, INITIAL_STUDIO_PROGRESS } from "./studioDialogue.js";
import { getStoreDialogueNode, chooseStoreDialogue, INITIAL_STORE_PROGRESS } from "./recordStoreDialogue.js";

const completeMaster = { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 };
const newMaster = { phase: "new", reviewed: [], studioTokens: 0 };
const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test("the show credential follows the completed master, Hugo and Tito exactly once", () => {
  let quest = advanceClubShowQuest(null, "titoGrantsCredential", completeMaster);
  assert.equal(quest.credentialGranted, false);
  quest = advanceClubShowQuest(quest, "hugoSuggestsShow", newMaster);
  assert.equal(quest.hugoSuggestedShow, false);
  quest = advanceClubShowQuest(quest, "hugoSuggestsShow", completeMaster);
  assert.equal(quest.hugoSuggestedShow, true);
  quest = advanceClubShowQuest(quest, "titoGrantsCredential", completeMaster);
  assert.equal(quest.credentialGranted, true);
  assert.deepEqual(advanceClubShowQuest(quest, "titoGrantsCredential", completeMaster), quest);
  assert.match(clubShowObjective(quest, completeMaster), /Charly/);
  const fake = storage();
  assert.equal(saveClubShowQuest(quest, fake), true);
  assert.deepEqual(loadClubShowQuest(fake, completeMaster), quest);
  assert.equal(loadClubShowQuest(fake, newMaster).credentialGranted, false);
});

test("sound check requires Charly's authorization and all three distinct devices", () => {
  let quest = advanceClubShowQuest(null, "hugoSuggestsShow", completeMaster);
  quest = advanceClubShowQuest(quest, "inspect:mixer", completeMaster);
  assert.deepEqual(quest.inspected, []);
  quest = advanceClubShowQuest(quest, "titoGrantsCredential", completeMaster);
  quest = advanceClubShowQuest(quest, "completeSoundcheck", completeMaster);
  assert.equal(quest.clubShowReady, false);
  quest = advanceClubShowQuest(quest, "charlyAuthorizes", completeMaster);
  assert.equal(quest.backstageAuthorized, true);
  quest = advanceClubShowQuest(quest, "inspect:mixer", completeMaster);
  quest = advanceClubShowQuest(quest, "inspect:mixer", completeMaster);
  assert.deepEqual(quest.inspected, ["mixer"]);
  quest = advanceClubShowQuest(quest, "inspect:amplifier", completeMaster);
  quest = advanceClubShowQuest(quest, "inspect:microphone", completeMaster);
  assert.equal(quest.clubShowReady, false);
  quest = advanceClubShowQuest(quest, "completeSoundcheck", completeMaster);
  assert.equal(quest.clubShowReady, true);
  assert.equal(quest.soundcheckComplete, true);
  assert.match(clubShowObjective(quest, completeMaster), /escenario está listo/);
});

test("existing Hugo and Tito dialogues expose the new gated branches", () => {
  const start = advanceClubShowQuest(null, "hugoSuggestsShow", completeMaster);
  const hugoRoot = getStudioDialogueNode("greeting", INITIAL_STUDIO_PROGRESS, completeMaster, {});
  assert.ok(hugoRoot.options.some((item) => item.id === "club:show"));
  assert.equal(chooseStudioDialogue("greeting", "club:show", INITIAL_STUDIO_PROGRESS, completeMaster, {}).clubEvent, "hugoSuggestsShow");
  const titoRoot = getStoreDialogueNode("tito", "greeting", INITIAL_STORE_PROGRESS, { masterTape: completeMaster, clubQuest: start });
  assert.ok(titoRoot.options.some((item) => item.id === "club:credential"));
  assert.equal(chooseStoreDialogue("tito", "greeting", "club:credential", INITIAL_STORE_PROGRESS,
    { masterTape: completeMaster, clubQuest: start }).clubEvent, "titoGrantsCredential");
  const credited = advanceClubShowQuest(start, "titoGrantsCredential", completeMaster);
  assert.equal(getStoreDialogueNode("tito", "greeting", INITIAL_STORE_PROGRESS,
    { masterTape: completeMaster, clubQuest: credited }).options.some((item) => item.id === "club:credential"), false);
});

test("Charly requires the credential and only offers completion after the sound check", () => {
  let quest = advanceClubShowQuest(null, "meetCharly", completeMaster);
  assert.equal(getRockClubDialogueNode("charly", "greeting", quest, {}).options.find((item) => item.id === "credential").next, "no-credential");
  quest = advanceClubShowQuest(quest, "hugoSuggestsShow", completeMaster);
  quest = advanceClubShowQuest(quest, "titoGrantsCredential", completeMaster);
  assert.equal(chooseRockClubDialogue("charly", "greeting", "credential", quest, {}).clubEvent, "charlyAuthorizes");
  quest = advanceClubShowQuest(quest, "charlyAuthorizes", completeMaster);
  assert.equal(getRockClubDialogueNode("charly", "root", quest, {}).options.some((item) => item.id === "soundcheck-ready"), false);
  for (const id of ["mixer", "amplifier", "microphone"]) quest = advanceClubShowQuest(quest, "inspect:" + id, completeMaster);
  assert.equal(getRockClubDialogueNode("charly", "root", quest, {}).options.find((item) => item.id === "soundcheck-ready").event, "completeSoundcheck");
});


test("the first recital is gated, survives reload, and unlocks post-show dialogue", () => {
  const early = advanceClubShowQuest(null, "completeRecital", completeMaster);
  assert.equal(early.recitalCompleted, false);
  let quest = advanceClubShowQuest(null, "hugoSuggestsShow", completeMaster);
  quest = advanceClubShowQuest(quest, "titoGrantsCredential", completeMaster);
  quest = advanceClubShowQuest(quest, "charlyAuthorizes", completeMaster);
  for (const id of ["mixer", "amplifier", "microphone"])
    quest = advanceClubShowQuest(quest, "inspect:" + id, completeMaster);
  quest = advanceClubShowQuest(quest, "completeSoundcheck", completeMaster);
  assert.equal(quest.recitalCompleted, false);
  quest = advanceClubShowQuest(quest, "completeRecital", completeMaster);
  assert.equal(quest.recitalCompleted, true);
  assert.match(clubShowObjective(quest, completeMaster), /Burn Lies/);
  const fake = storage();
  saveClubShowQuest(quest, fake);
  assert.equal(loadClubShowQuest(fake, completeMaster).recitalCompleted, true);
  assert.equal(loadClubShowQuest(fake, newMaster).recitalCompleted, false);
  assert.ok(!getRockClubDialogueNode("charly", "root", quest, {}).options.some((item) => item.id === "post-show"));
  quest = advanceClubShowQuest(quest, "seeAnomaly", completeMaster);
  assert.equal(quest.anomalySeen, true);
  assert.ok(getRockClubDialogueNode("charly", "root", quest, {}).options.some((item) => item.id === "post-show"));
  assert.match(clubShowObjective(quest, completeMaster), /Riky/);
  quest = advanceClubShowQuest(quest, "inspectAnomaly", completeMaster);
  assert.equal(quest.arcadeClueKnown, true);
  assert.equal(advanceClubShowQuest(quest, "inspectAnomaly", completeMaster).arcadeClueKnown, true);
  saveClubShowQuest(quest, fake);
  assert.equal(loadClubShowQuest(fake, completeMaster).anomalyInvestigated, true);
});
