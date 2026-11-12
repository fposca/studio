import test from "node:test";
import assert from "node:assert/strict";
import { createCathedralPresentation } from "./cathedralPresentation.js";
import { initialCathedralTier, cathedralProfile } from "./cathedralQuality.js";
import { advanceCathedral, normalizeCathedralProgress } from "./cathedralQuest.js";

const full = { memories: ["nave", "partenon", "fracturada"], altarOpen: true, altarActivated: true, recordingHeard: true };
test("loading a completed cathedral restores state without replaying presentation", () => {
  const events = [], p = createCathedralPresentation(full, e => events.push(e));
  p.update(.05, full); p.update(.05, { ...full });
  assert.deepEqual(events, []); assert.equal(p.fx.sealAge, Infinity); assert.equal(p.cinema, null);
});
test("accepted memory changes emit once; seal opens only on the complete sequence", () => {
  const events = [], p = createCathedralPresentation({ memories: [] }, e => events.push(e));
  p.update(.05, { memories: ["nave"] }); p.update(.05, { memories: ["nave"] });
  assert.equal(events.filter(e => e.type === "memory").length, 1);
  assert.equal(events.some(e => e.type === "seal-open"), false);
  p.update(.05, { memories: ["nave", "partenon"] });
  p.update(.05, full);
  assert.equal(events.filter(e => e.type === "memory").length, 3);
  assert.equal(events.filter(e => e.type === "seal-open").length, 1);
});
test("presentation pauses and the final reveal can be skipped without duplicate completion", () => {
  const events = [], p = createCathedralPresentation({ ...full, recordingHeard: false }, e => events.push(e));
  p.update(.05, full);
  const age = p.fx.finalAge;
  p.update(.05, full, { suspended: true }); assert.equal(p.fx.finalAge, age);
  p.update(0, full, { skip: 1 });
  p.update(.05, full, { skip: 1 });
  assert.equal(events.filter(e => e.type === "final-ready").length, 1); assert.equal(p.cinema, null);
});
test("final reveal finishes once even when normal simulation is dialogue-locked", () => {
  const events = [], p = createCathedralPresentation({ ...full, recordingHeard: false }, e => events.push(e));
  for (let i = 0; i < 80; i++) p.update(.05, full, { suspended: false });
  assert.equal(events.filter(e => e.type === "final-ready").length, 1);
});
test("repeated memory interactions keep progress, and wrong unrecovered memories still reset", () => {
  let p = normalizeCathedralProgress({ seals: ["memoria","tiempo","verdad"], visionActive: true }, true);
  p = advanceCathedral(p, "memory", "nave", true);
  const repeated = advanceCathedral(p, "memory", "nave", true);
  assert.deepEqual(repeated.memories, ["nave"]);
  assert.deepEqual(advanceCathedral(repeated, "memory", "fracturada", true).memories, []);
  assert.deepEqual(advanceCathedral({ ...p, visionActive: false }, "memory", "partenon", true).memories, ["nave"]);
});
test("mobile quality reuses conservative budgets and scales density without removing clues", () => {
  assert.equal(initialCathedralTier({ userAgent: "Android", deviceMemory: 4, hardwareConcurrency: 8 }), "low");
  assert.equal(initialCathedralTier({ userAgent: "Android", deviceMemory: 8, hardwareConcurrency: 8 }), "medium");
  assert.equal(initialCathedralTier({ userAgent: "Windows" }), "high");
  assert.ok(cathedralProfile("low").particleScale < cathedralProfile("high").particleScale);
  assert.ok(cathedralProfile("low").pixelRatio(1920,1080,2) < 1);
});
