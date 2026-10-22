import test from "node:test";
import assert from "node:assert/strict";
import { ARCADE_NPCS, chooseArcadeDialogue, getArcadeDialogueNode } from "./arcadeDialogue.js";
import { ARCADE_ASSETS, defaultArcadeTransform } from "./arcadeLayout.js";
import { meetArcadeNpc, normalizeArcadeProgress } from "./arcadeProgress.js";

test("the three Arcade NPCs have stable IDs and editable transforms", () => {
  assert.deepEqual(ARCADE_NPCS.map(({ id }) => id), ["pixel", "nico", "vicky"]);
  for (const npc of ARCADE_NPCS) {
    assert.ok(ARCADE_ASSETS.some((asset) => asset.id === npc.id));
    assert.ok(defaultArcadeTransform(npc.id)?.reach > 2);
    assert.match(npc.model, new RegExp(npc.id + "\\.glb"));
  }
});

test("each Arcade NPC introduces themselves, then offers their own topics", () => {
  const progress = normalizeArcadeProgress(null);
  for (const npc of ARCADE_NPCS) {
    const first = getArcadeDialogueNode(npc.id, "greeting", progress, true);
    assert.ok(first.lines.length >= 3);
    assert.equal(chooseArcadeDialogue(npc.id, "greeting", "menu").nodeId, "menu");
    const menu = getArcadeDialogueNode(npc.id, "greeting", meetArcadeNpc(progress, npc.id), true);
    assert.equal(menu.id, "menu");
    assert.ok(menu.options.length > 1);
  }
  assert.ok(getArcadeDialogueNode("nico", "win", { ...progress, bestScore: 2000 }, true).lines[0].text.includes("No puede ser"));
  assert.ok(getArcadeDialogueNode("vicky", "strange", progress, true).lines.at(-1).text.includes("señal"));
});

test("FREQUENCY 09 dialogue respects the existing anomaly state", () => {
  const progress = meetArcadeNpc(normalizeArcadeProgress(null), "pixel");
  assert.ok(!getArcadeDialogueNode("pixel", "menu", progress, false).options.some(({ id }) => id === "frequency"));
  assert.ok(getArcadeDialogueNode("pixel", "menu", progress, true).options.some(({ id }) => id === "frequency"));
});
