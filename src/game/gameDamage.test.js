import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { effectForEvent } from "./gameSound.js";
await initializePhysics();

test("real damage reports health lost once, including lethal hits", (t) => {
  const world = new GameWorld(); t.after(() => world.dispose());
  const player = world.player, attacker = world.enemies[0];
  world.damage(player, attacker, { damage: 28, knockback: 0 });
  const hit = world.events.at(-1);
  assert.equal(player.health, 72);
  assert.equal(hit.amount, 28); assert.equal(hit.previousHealth, 100);
  assert.equal(effectForEvent(hit, player.id), "hurt");
  const count = world.events.length;
  world.damage(player, attacker, { damage: 28, knockback: 0 });
  assert.equal(world.events.length, count);
  player.health = 3; player.invulnerable = 0;
  world.damage(player, attacker, { damage: 28, knockback: 0 });
  assert.equal(world.events.at(-1).type, "defeat");
  assert.equal(world.events.at(-1).amount, 3);
  assert.equal(effectForEvent(world.events.at(-1), player.id), "hurt");
});

test("player pain is distinct from enemy impacts, swings and pickups", () => {
  assert.equal(effectForEvent({ type: "hit", kind: "sword", actor: "enemy" }, "neonboy"), "metal");
  assert.equal(effectForEvent({ type: "hit", kind: "statue", actor: "neonboy" }, "neonboy"), "hurt");
  assert.equal(effectForEvent({ type: "defeat", actor: "enemy" }, "neonboy"), "defeat");
  assert.equal(effectForEvent({ type: "attack", kind: "crossbow", actor: "neonboy" }, "neonboy"), null);
  assert.equal(effectForEvent({ type: "heal", actor: "neonboy" }, "neonboy"), "heal");
});
