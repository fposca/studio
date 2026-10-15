import test from "node:test";
import assert from "node:assert/strict";
import { hammerMotion } from "./gameHammerMotion.js";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS, FIXED_STEP } from "./gameRules.js";
import { effectForEvent } from "./gameSound.js";

await initializePhysics();

test("hammer winds up visibly, accelerates into the damage frame and settles", () => {
  const early = hammerMotion(0.2), raised = hammerMotion(0.38);
  const falling = hammerMotion(0.52), impact = hammerMotion(ATTACKS.hammer.impact);
  const rebound = hammerMotion(ATTACKS.hammer.impact + 0.035);
  const rested = hammerMotion(ATTACKS.hammer.duration);
  assert.ok(raised.windup > early.windup);
  assert.ok(raised.windup > 0.95);
  assert.equal(raised.slam, 0);
  assert.ok(falling.slam > 0.2 && falling.slam < 0.6);
  assert.equal(impact.slam, 1);
  assert.ok(rebound.jolt > 0.3);
  assert.equal(rested.slam, 0);
  assert.equal(rested.windup, 0);
});

test("one thud accompanies each first-person hammer impact without changing its damage", (t) => {
  const world = new GameWorld({ level: 2 }); t.after(() => world.dispose());
  world.questStage = "searching";
  world.inventory.add("hammer"); world.equip("hammer");
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  const target = world.enemies[0]; target.health = 100; target.active = true; target.collider.setEnabled(true);
  target.stationary = true; target.cooldown = 100;
  target.x = world.player.x; target.y = world.player.y; target.z = world.player.z - 1.5;
  const position = { x: target.x, y: target.y + target.bodyOffset, z: target.z };
  target.body.setTranslation(position, true); target.body.setNextKinematicTranslation(position);
  world.physics.step();
  for (let i = 0; i < 90; i++) world.step({ firstPerson: true, yaw: 0, attack: i === 0 ? "punch" : null }, FIXED_STEP);
  const thuds = world.events.filter((event) => event.type === "hammerImpact");
  assert.equal(thuds.length, 1);
  assert.equal(effectForEvent(thuds[0], world.player.id), "heavy");
  assert.equal(target.health, 100 - ATTACKS.hammer.damage);
});
