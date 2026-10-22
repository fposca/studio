import test from "node:test";
import assert from "node:assert/strict";
import { createJunglePulseGame, JUNGLE_DURATION, stepJunglePulse } from "./junglePulseLogic.js";

test("JUNGLE PULSE judges notes from audio timestamps, including misses", () => {
  const game = createJunglePulseGame(), [first, second] = game.notes;
  assert.ok(stepJunglePulse(game, first.time, [{ lane: first.lane, time: first.time }]).includes("perfect"));
  assert.equal(game.score, 100);
  assert.ok(stepJunglePulse(game, second.time + .12, [{ lane: second.lane, time: second.time + .12 }]).includes("good"));
  assert.equal(game.combo, 2);
  stepJunglePulse(game, game.notes[2].time + .2);
  assert.ok(game.misses >= 1);
  assert.equal(game.combo, 0);
});

test("JUNGLE PULSE can finish with S rank and tracks wrong keys", () => {
  const game = createJunglePulseGame();
  for (const note of game.notes) stepJunglePulse(game, note.time, [{ lane: note.lane, time: note.time }]);
  stepJunglePulse(game, JUNGLE_DURATION);
  assert.equal(game.rank, "S");
  assert.equal(game.accuracy, 100);
  assert.equal(game.result, "win");
  const bad = createJunglePulseGame();
  stepJunglePulse(bad, 1, [{ lane: 0, time: 1 }]);
  stepJunglePulse(bad, JUNGLE_DURATION);
  assert.equal(bad.result, "loss");
  assert.ok(bad.extraMisses > 0);
  assert.equal(bad.accuracy, 0);
});
