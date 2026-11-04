import test from "node:test";
import assert from "node:assert/strict";
import { advanceVisionClock, selectHiddenMessageIndices, toggleVisionClock } from "./halloweenEncounterLogic.js";
import { receiveCombatDamage } from "../../src/game/combatHeartsLogic.js";

test("vision stays locked, runs for 10 seconds, then recharges for 20", () => {
  const locked = { phase: "locked", remaining: 0, activation: 0 };
  assert.equal(toggleVisionClock(locked), locked);
  const active = toggleVisionClock({ ...locked, phase: "ready" });
  assert.deepEqual(active, { phase: "active", remaining: 10, activation: 1 });
  assert.deepEqual(advanceVisionClock(active, 8, true), active);
  assert.equal(advanceVisionClock(active, 10, false).phase, "cooldown");
  const cooldown = advanceVisionClock(active, 10, false);
  assert.equal(cooldown.remaining, 20);
  assert.equal(toggleVisionClock(cooldown), cooldown);
  assert.equal(advanceVisionClock(cooldown, 20, false).phase, "ready");
});

test("hidden messages rotate four unique texts per activation", () => {
  for (let activation = 1; activation <= 8; activation++) {
    const indices = selectHiddenMessageIndices(activation);
    assert.equal(indices.length, 4);
    assert.equal(new Set(indices).size, 4);
    assert.ok(indices.every((index) => index >= 0 && index < 8));
  }
});

test("shared three-heart damage ignores repeat hits inside 1400ms", () => {
  const first = receiveCombatDamage(3, 0, 1000);
  assert.deepEqual(first, { hearts: 2, invulnerableUntil: 2400 });
  assert.equal(receiveCombatDamage(first.hearts, first.invulnerableUntil, 2399), null);
  const second = receiveCombatDamage(first.hearts, first.invulnerableUntil, 2400);
  assert.equal(second.hearts, 1);
  assert.equal(receiveCombatDamage(1, second.invulnerableUntil, 3800).hearts, 0);
});
