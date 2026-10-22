import test from "node:test";
import assert from "node:assert/strict";
import { createPixelSprintGame, PIXEL_GROUND, PIXEL_LEVEL, PIXEL_WORLD, stepPixelSprint } from "./pixelSprintLogic.js";

test("PIXEL SPRINT moves, jumps and lands on reachable ground", () => {
  const game = createPixelSprintGame();
  stepPixelSprint(game, .05, { right: true });
  assert.ok(game.player.x > 48);
  stepPixelSprint(game, .05, { jump: true });
  assert.ok(game.player.vy < 0);
  for (let i = 0; i < 25; i++) stepPixelSprint(game, .05);
  assert.equal(game.player.grounded, true);
  assert.equal(game.player.y + 32, PIXEL_GROUND);
});

test("PIXEL SPRINT collects points, can win and can lose", () => {
  const game = createPixelSprintGame();
  game.player.x = game.coins[0].x - 10; game.player.y = game.coins[0].y - 16;
  assert.ok(stepPixelSprint(game, .01).includes("coin"));
  assert.equal(game.score, 50);
  game.player.x = PIXEL_WORLD - 92;
  assert.ok(stepPixelSprint(game, .05, { right: true }).includes("win"));
  assert.equal(game.result, "win");
  assert.ok(game.score >= 350);
  const lost = createPixelSprintGame();
  lost.lives = 1; lost.player.y = 480;
  assert.ok(stepPixelSprint(lost, .05).includes("end"));
  assert.equal(lost.result, "loss");
});

test("PIXEL SPRINT full level is beatable in about one minute", () => {
  const game = createPixelSprintGame();
  for (let frame = 0; frame < 2200 && game.phase === "playing"; frame++) {
    const x = game.player.x;
    const gap = PIXEL_LEVEL.gaps.some((part) => part.x - x > 35 && part.x - x < 125);
    const block = PIXEL_LEVEL.blocks.some((part) => part.x - x > 15 && part.x - x < 95);
    const enemy = game.enemies.some((part) => part.alive && part.x - x > 15 && part.x - x < 95);
    stepPixelSprint(game, .05, { right: true, jump: game.player.grounded && (gap || block || enemy) });
  }
  assert.equal(game.result, "win");
  assert.ok(game.time >= 55 && game.time <= 90);
  assert.ok(game.lives > 0);
});
