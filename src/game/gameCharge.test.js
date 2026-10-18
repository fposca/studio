import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACK_CHARGE_SECONDS, CHARGED_DAMAGE_MULTIPLIER, FIXED_STEP } from "./gameRules.js";

await initializePhysics();

function setup(t, level, weapon, targetZ) {
  const world = new GameWorld({ level, inventory: ["unarmed", weapon], equipped: weapon });
  t.after(() => world.dispose());
  if (level === 4) world.adviceIndex = 3;
  const target = world.enemies[0];
  for (const enemy of world.enemies) {
    enemy.health = 0;
    enemy.collider.setEnabled(false);
  }
  Object.assign(target, { x: 0, y: 0, z: targetZ, health: 200, maxHealth: 200,
    active: true, stationary: true, cooldown: 100 });
  target.collider.setEnabled(true);
  const targetPosition = { x: 0, y: target.bodyOffset, z: targetZ };
  target.body.setTranslation(targetPosition, true);
  target.body.setNextKinematicTranslation(targetPosition);
  const playerZ = level === 4 ? 13 : 10;
  Object.assign(world.player, { x: 0, y: 0, z: playerZ, grounded: false,
    velocityX: 0, velocityY: 0, velocityZ: 0 });
  const playerPosition = { x: 0, y: world.player.bodyOffset, z: playerZ };
  world.player.body.setTranslation(playerPosition, true);
  world.player.body.setNextKinematicTranslation(playerPosition);
  world.physics.step();
  return { world, target };
}
function frames(world, count, input = {}) {
  for (let i = 0; i < count; i++) world.step({ yaw: 0, ...input }, FIXED_STEP);
}

test("a short sword hold releases a normal strike; 2.5 seconds doubles damage", (t) => {
  const quick = setup(t, 1, "sword", 8.5);
  frames(quick.world, 24, { attackHeld: true });
  assert.equal(quick.world.player.attack, null);
  assert.ok(quick.world.snapshot().charge > 0 && quick.world.snapshot().charge < 1);
  quick.world.step({ yaw: 0, attackReleased: true });
  assert.equal(quick.world.player.attack.charged, false);
  frames(quick.world, 50);
  assert.equal(quick.target.health, 155);

  const powered = setup(t, 1, "sword", 8.5);
  frames(powered.world, Math.ceil(ATTACK_CHARGE_SECONDS / FIXED_STEP), { attackHeld: true });
  assert.equal(powered.world.player.attack, null);
  assert.equal(powered.world.snapshot().chargeReady, true);
  assert.equal(powered.world.events.filter((event) => event.type === "chargeReady").length, 1);
  powered.world.step({ yaw: 0, attackReleased: true });
  assert.equal(powered.world.player.attack.charged, true);
  assert.equal(powered.world.snapshot().charge, 0);
  frames(powered.world, 50);
  assert.equal(powered.target.health, 200 - 45 * CHARGED_DAMAGE_MULTIPLIER);
  assert.ok(powered.world.events.some((event) => event.type === "hit" && event.charged));
});

test("a charged crossbow bolt spends one arrow and keeps its bonus until impact", (t) => {
  const { world, target } = setup(t, 4, "crossbow", 7);
  frames(world, Math.ceil(ATTACK_CHARGE_SECONDS / FIXED_STEP), { attackHeld: true });
  assert.equal(world.ammo, 10);
  world.step({ yaw: 0, attackReleased: true });
  assert.equal(world.ammo, 9);
  assert.equal(world.player.attack.charged, true);
  frames(world, 42);
  assert.equal(target.health, 200 - 58 * CHARGED_DAMAGE_MULTIPLIER);
  assert.ok(world.events.some((event) => event.type === "hit" && event.charged));
});

test("damage interrupts the charge without granting a powered attack", (t) => {
  const { world, target } = setup(t, 1, "sword", 8.5);
  frames(world, 120, { attackHeld: true });
  assert.ok(world.chargeTime > 1.9);
  world.damage(world.player, target, { damage: 8, knockback: 0 });
  assert.equal(world.chargeTime, 0);
  world.step({ yaw: 0, attackReleased: true });
  assert.equal(world.player.attack, null);
});
