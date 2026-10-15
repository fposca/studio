import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS, BODY_OFFSET, BOUNDS, FIXED_STEP, MAX_HEALTH, canStrike, movementVector } from "./gameRules.js";

await initializePhysics();

function setup(t, enemies = false) {
  const world = new GameWorld();
  t.after(() => world.dispose());
  if (!enemies) world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  for (let i = 0; i < 5; i++) world.step();
  return world;
}

function place(world, actor, x, y, z, yaw = Math.PI) {
  Object.assign(actor, { x, y, z, yaw, velocityY: 0, velocityX: 0, velocityZ: 0, grounded: false });
  const position = { x, y: y + BODY_OFFSET, z };
  actor.body.setTranslation(position, true);
  actor.body.setNextKinematicTranslation(position);
  world.physics.step();
}

function advance(world, seconds, input = {}) {
  for (let i = 0; i < Math.round(seconds / FIXED_STEP); i++) world.step(input);
}

test("camera-relative movement preserves speed on diagonals", () => {
  assert.ok(Math.abs(Math.hypot(...Object.values(movementVector(1, -1, 0))) - 1) < 1e-10);
  const rotated = movementVector(0, -1, Math.PI / 2);
  assert.ok(Math.abs(rotated.x + 1) < 1e-10);
  assert.ok(Math.abs(rotated.z) < 1e-10);
});

test("walking collects each coin once and stopping returns to idle", (t) => {
  const world = setup(t);
  advance(world, 2.2, { z: -1 });
  assert.ok(world.player.z < 7);
  assert.equal(world.collected, 2);
  const z = world.player.z;
  advance(world, 0.6);
  assert.ok(Math.abs(world.player.z - z) < 0.01);
  assert.equal(world.player.mode, "idle");
  assert.equal(world.collected, 2);
});

test("jump leaves the floor, rejects an air jump and lands", (t) => {
  const world = setup(t);
  assert.equal(world.player.grounded, true);
  world.step({ jump: true });
  advance(world, 0.15);
  const height = world.player.y, velocity = world.player.velocityY;
  assert.ok(height > 0.7);
  world.step({ jump: true });
  assert.ok(world.player.velocityY < velocity);
  advance(world, 1.2);
  assert.equal(world.player.grounded, true);
  assert.ok(Math.abs(world.player.y) < 0.08);
});

test("jump reaches a higher arc and stays airborne a little longer", (t) => {
  const world = setup(t);
  world.step({ jump: true });
  let peak = world.player.y;
  let frames = 1;
  while (!world.player.grounded && frames < 120) {
    world.step();
    peak = Math.max(peak, world.player.y);
    frames += 1;
  }
  assert.ok(peak > 1.5 && peak < 1.9, `jump height: ${peak}`);
  assert.ok(frames * FIXED_STEP > 0.72 && frames * FIXED_STEP < 0.9, `airtime: ${frames * FIXED_STEP}`);
  assert.equal(world.player.grounded, true);
});

test("running is faster than walking and releasing run restores walking then idle", (t) => {
  const world = setup(t);
  advance(world, 0.3, { x: 1 });
  const walkingSpeed = world.player.speed;
  assert.equal(world.player.mode, "walk");
  advance(world, 0.3, { x: 1, run: true });
  assert.ok(world.player.speed > walkingSpeed * 1.45);
  assert.equal(world.player.mode, "run");
  assert.equal(world.player.running, true);
  advance(world, 0.2, { x: 1 });
  assert.equal(world.player.mode, "walk");
  assert.ok(Math.abs(world.player.speed - walkingSpeed) < 0.01);
  assert.equal(world.player.running, false);
  advance(world, 0.2);
  assert.equal(world.player.mode, "idle");
});

test("historical artifacts award points once and restart with the level", (t) => {
  const world = setup(t);
  for (const artifact of world.artifacts) {
    place(world, world.player, artifact.x, artifact.y, artifact.z);
    world.step();
    assert.equal(artifact.found, true);
    assert.equal(world.events.filter((event) => event.type === "discovery" && event.id === artifact.id).length, 1);
    world.events.length = 0;
    world.step();
    assert.equal(world.events.filter((event) => event.type === "discovery").length, 0);
  }
  assert.equal(world.snapshot().score, 250);
  assert.equal(world.snapshot().discoveries, 2);
  world.restart();
  assert.equal(world.snapshot().score, 0);
  assert.equal(world.snapshot().discoveries, 0);
});

test("artifact points carry into the cemetery without rediscovering level one", (t) => {
  const world = new GameWorld({ level: 3, score: 250 });
  t.after(() => world.dispose());
  world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  const artifact = world.artifacts[0];
  place(world, world.player, artifact.x, artifact.y, artifact.z);
  world.step();
  assert.equal(world.snapshot().score, 350);
  assert.deepEqual(world.serialize().artifacts, [artifact.id]);
  world.restart();
  assert.equal(world.snapshot().score, 250);
  assert.equal(world.snapshot().discoveries, 0);
});

test("level one hearts heal 25 percent once, but remain available at full health", (t) => {
  const world = setup(t);
  assert.equal(world.hearts.length, 4);
  const [first, second, third, fourth] = world.hearts;
  place(world, world.player, first.x, first.y, first.z);
  world.step();
  assert.equal(first.collected, false);
  assert.equal(world.player.health, MAX_HEALTH);

  world.player.health = 40;
  world.step();
  assert.equal(world.player.health, 65);
  assert.equal(first.collected, true);
  assert.equal(world.events.filter((event) => event.type === "heal").at(-1).amount, 25);
  world.step();
  assert.equal(world.player.health, 65);

  world.player.health = 99;
  place(world, world.player, second.x, second.y, second.z);
  world.step();
  assert.equal(world.player.health, MAX_HEALTH);
  assert.equal(second.collected, true);
  assert.equal(third.collected, false);
  assert.equal(fourth.collected, false);

  world.restart();
  assert.ok(world.hearts.every((heart) => !heart.collected));
});

test("the controller climbs the temple steps and stops at its wall", (t) => {
  const world = setup(t);
  place(world, world.player, 0, 0, -4.5);
  advance(world, 3.6, { z: -1 });
  assert.ok(world.player.y > 0.7 && world.player.y < 0.85, `feet at ${world.player.y}`);
  assert.ok(world.player.z > -12.3 && world.player.z < -11.8, `wall stop at ${world.player.z}`);
});

test("columns and the perimeter block movement", (t) => {
  const world = setup(t);
  place(world, world.player, -8.75, 0.76, -6.9);
  advance(world, 1, { z: -1 });
  assert.ok(world.player.z > -7.3);
  place(world, world.player, 15, 0, 12);
  advance(world, 2, { x: 1 });
  assert.ok(world.player.x < BOUNDS.right);
  assert.ok(world.player.x > BOUNDS.right - 0.5);
});

test("strikes require range, height and a forward arc", () => {
  const attacker = { x: 0, y: 0, z: 0, yaw: 0 };
  assert.equal(canStrike(attacker, { x: 0, y: 0, z: 1 }, ATTACKS.punch), true);
  assert.equal(canStrike(attacker, { x: 0, y: 0, z: -1 }, ATTACKS.punch), false);
  assert.equal(canStrike(attacker, { x: 0, y: 3, z: 1 }, ATTACKS.punch), false);
  assert.equal(canStrike(attacker, { x: 0, y: 0, z: 3 }, ATTACKS.kick), false);
});

test("a punch damages a target only once and a kick hits harder", (t) => {
  const world = setup(t);
  const enemy = world.enemies[0];
  enemy.health = 80;
  enemy.cooldown = 10;
  enemy.collider.setEnabled(true);
  place(world, world.player, 0, 0, 10);
  place(world, enemy, 0, 0, 8.9, 0);
  assert.equal(world.startAttack(world.player, "punch"), true);
  advance(world, 0.6);
  assert.equal(enemy.health, 55);
  place(world, enemy, world.player.x, 0, world.player.z - 1.2, 0);
  assert.equal(world.startAttack(world.player, "kick"), true);
  advance(world, 0.85);
  assert.equal(enemy.health, 15);
});

test("solid temple walls block line of sight and attacks", (t) => {
  const world = setup(t);
  const enemy = world.enemies[0];
  place(world, world.player, 0, 0.75, -12);
  place(world, enemy, 0, 0.75, -13.5);
  assert.equal(canStrike(world.player, enemy, ATTACKS.kick), true);
  assert.equal(world.hasLineOfSight(world.player, enemy), false);
});

test("enemy attack has a windup; damage grants temporary invulnerability", (t) => {
  const world = setup(t, true);
  const enemy = world.enemies[0];
  place(world, enemy, world.player.x, 0, world.player.z - 1.1, 0);
  advance(world, 0.3);
  assert.equal(world.player.health, MAX_HEALTH);
  advance(world, 0.45);
  assert.equal(world.player.health, MAX_HEALTH - ATTACKS.enemy.damage);
  world.damage(world.player, enemy, ATTACKS.enemy);
  assert.equal(world.player.health, MAX_HEALTH - ATTACKS.enemy.damage);
});

test("death stops simulation; restart restores enemies, coins and health", (t) => {
  const world = setup(t);
  world.player.health = 0;
  world.step();
  assert.equal(world.status, "lost");
  const time = world.time;
  advance(world, 1, { z: -1 });
  assert.equal(world.time, time);
  world.restart();
  assert.equal(world.status, "playing");
  assert.equal(world.player.health, MAX_HEALTH);
  assert.equal(world.collected, 0);
  assert.ok(world.enemies.every((enemy) => enemy.health === enemy.maxHealth && enemy.collider.isEnabled() === !enemy.boss));
});

test("collecting all accessible coins wins the round", (t) => {
  const world = setup(t);
  for (const coin of world.coins) {
    place(world, world.player, coin.x, coin.y, coin.z);
    world.step();
  }
  assert.equal(world.collected, world.coins.length);
  assert.equal(world.status, "won");
});

test("the ground coin route remains reachable while jumping past the new obstacles", (t) => {
  const world = setup(t);
  for (const coin of world.coins.filter((entry) => !entry.platformId)) {
    // Leave the low return platform around its east edge before walking underneath the upper slabs.
    if (coin.id === 20) {
      for (const [x, z] of [[16.5, -10], [16.5, -2]]) {
        for (let frame = 0; frame < 400; frame++) {
          const dx = x - world.player.x, dz = z - world.player.z, distance = Math.hypot(dx, dz);
          if (distance < 0.15) break;
          world.player.invulnerable = 1;
          world.step({ x: dx / distance, z: dz / distance });
        }
      }
    }
    let attempts = 0;
    while (!coin.collected && attempts++ < 1100) {
      const dx = coin.x - world.player.x, dz = coin.z - world.player.z;
      const distance = Math.hypot(dx, dz);
      world.player.invulnerable = 1;
      const obstacleAhead = coin.id === 19 || world.hazards.some((hazard) => Math.hypot(hazard.x - world.player.x, hazard.z - world.player.z) < 3);
      world.step({ x: dx / Math.max(distance, 0.01), z: dz / Math.max(distance, 0.01), jump: obstacleAhead && world.player.grounded });
    }
    assert.ok(coin.collected, `coin ${coin.id} unreachable from ${world.player.x}, ${world.player.z}`);
  }
  assert.equal(world.status, "playing");
});
