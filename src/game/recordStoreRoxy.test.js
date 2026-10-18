import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_STORE_PROGRESS, getStoreDialogueNode, meetStoreNpc, chooseStoreDialogue } from "./recordStoreDialogue.js";
import { advanceRoxyPatrol, createRoxyPatrol } from "./recordStoreRoxyMotion.js";

test("Roxy answers all three questions and remembers a previous visit", () => {
  const progress = { ...INITIAL_STORE_PROGRESS };
  const greeting = getStoreDialogueNode("roxy", "greeting", progress);
  assert.equal(greeting.options.length, 4);
  assert.equal(greeting.text, "");
  const exchanges = [
    ["visits", "Sí. Hasta que llegaste vos."],
    ["records", "Felicitaciones. ¿Querés una medalla o que te deje de hablar?"],
    ["solo", "Prefiero escuchar cómo te alejás. ¡Largo!"]
  ];
  for (const [id, answer] of exchanges) {
    const chosen = chooseStoreDialogue("roxy", "greeting", `ask:roxy:${id}`, progress);
    assert.equal(chosen.nodeId, `reply:roxy:${id}`);
    assert.equal(getStoreDialogueNode("roxy", chosen.nodeId, progress).text, answer);
  }
  const revisited = meetStoreNpc(progress, "roxy");
  assert.equal(getStoreDialogueNode("roxy", "greeting", revisited).text, "¿Otra vez vos? ¿No te había dicho que te fueras?");
});

test("Roxy patrols with stops, plays in place, and resumes walking when music ends", () => {
  let patrol = createRoxyPatrol();
  const modes = new Set();
  for (let i = 0; i < 240; i++) {
    patrol = advanceRoxyPatrol(patrol, 0.05, { x: 0, z: 0 }, false, false);
    modes.add(patrol.mode);
  }
  assert(modes.has("walk"));
  assert(modes.has("idle"));
  assert(patrol.z < 3.2);
  const position = { x: patrol.x, z: patrol.z };
  for (let i = 0; i < 50; i++) patrol = advanceRoxyPatrol(patrol, 0.05, { x: 0, z: 0 }, true, false);
  assert.equal(patrol.mode, "guitar");
  assert.deepEqual({ x: patrol.x, z: patrol.z }, position);
  patrol = advanceRoxyPatrol(patrol, 0.05, { x: 0, z: 0 }, true, true);
  assert.equal(patrol.mode, "talking");
  const resumedModes = new Set();
  for (let i = 0; i < 70; i++) {
    patrol = advanceRoxyPatrol(patrol, 0.05, { x: 0, z: 0 }, false, false);
    resumedModes.add(patrol.mode);
  }
  assert(resumedModes.has("walk"));
});
