import test from "node:test";
import assert from "node:assert/strict";
import { createBarrioBrawlGame, stepBarrioBrawl } from "./barrioBrawlLogic.js";

function readyGame() {
  const game = createBarrioBrawlGame(() => .5);
  game.announcement = ""; game.announcementTime = 0;
  return game;
}

test("BARRIO BRAWL requires real reach and enforces attack recovery", () => {
  const game = readyGame();
  stepBarrioBrawl(game, .05, { punch: true });
  stepBarrioBrawl(game, .05);
  stepBarrioBrawl(game, .05);
  assert.equal(game.foe.hp, 100);
  game.player.attack = null; game.player.cooldown = 0;
  game.player.x = 210; game.foe.x = 252;
  stepBarrioBrawl(game, .05, { punch: true });
  stepBarrioBrawl(game, .05);
  stepBarrioBrawl(game, .05);
  assert.equal(game.foe.hp, 90);
  const score = game.score;
  stepBarrioBrawl(game, .05, { punch: true });
  assert.equal(game.foe.hp, 90);
  assert.equal(game.score, score);
});

test("BARRIO BRAWL supports blocking, rounds, wins and losses", () => {
  const game = readyGame();
  game.player.x = 210; game.foe.x = 252; game.foe.guard = true;
  game.aiState = "defend";
  stepBarrioBrawl(game, .05, { kick: true });
  stepBarrioBrawl(game, .05);
  stepBarrioBrawl(game, .05);
  assert.equal(game.foe.hp, 96);
  game.wins[0] = 1; game.foe.hp = 1; game.foe.guard = false;
  game.player.attack = null; game.player.cooldown = 0;
  stepBarrioBrawl(game, .05, { punch: true });
  stepBarrioBrawl(game, .05);
  stepBarrioBrawl(game, .05);
  assert.equal(game.result, "win");
  const lost = readyGame();
  lost.wins[1] = 1; lost.player.hp = 1; lost.time = .01;
  stepBarrioBrawl(lost, .05);
  assert.equal(lost.result, "loss");
});
