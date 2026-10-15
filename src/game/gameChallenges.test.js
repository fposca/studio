import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS, FIXED_STEP } from "./gameRules.js";
import { validateGameSave } from "./gameSave.js";

await initializePhysics();

function setup(t) {
  const world = new GameWorld();
  t.after(() => world.dispose());
  world.enemies.filter((enemy) => !enemy.boss).forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  world.step();
  return world;
}
function place(world, x, y, z) {
  const actor = world.player;
  Object.assign(actor, { x, y, z, grounded: false, velocityY: 0, velocityX: 0, velocityZ: 0, platformId: null });
  const position = { x, y: y + actor.bodyOffset, z };
  actor.body.setTranslation(position, true);
  actor.body.setNextKinematicTranslation(position);
  world.physics.step();
}
function save(world) {
  return { version: 1, savedAt: 1, period: "day", camera: { yaw: 0, pitch: 0.3, distance: 7 }, world: world.serialize() };
}

test("moving slabs carry an idle player and their coins without sliding", (t) => {
  const world = setup(t), platform = world.platforms[0];
  place(world, platform.x, platform.y + 0.015, platform.z);
  for (let i = 0; i < 5; i++) world.step();
  assert.equal(world.player.platformId, platform.id);
  const offset = world.player.x - platform.x;
  for (let i = 0; i < 120; i++) world.step();
  assert.equal(world.player.grounded, true);
  assert.ok(Math.abs(world.player.x - platform.x - offset) < 0.05);
  assert.ok(world.player.speed < 0.05);
  const coin = world.coins.find((entry) => entry.platformId === platform.id);
  assert.equal(coin.x, platform.x + coin.offsetX);
  assert.equal(coin.z, platform.z + coin.offsetZ);
});

for (const phase of [0, 1.5, 3.5]) test(`all seven moving platforms can be reached with real jumps at phase ${phase}`, (t) => {
  const world = setup(t);
  for (let i = 0; i < phase / FIXED_STEP; i++) world.step();
  const first = world.platforms[0];
  place(world, first.x, 0, first.z + 3);
  for (let i = 0; i < 5; i++) world.step();
  for (const target of world.platforms.slice(0, 7)) {
    let landed = false;
    for (let frame = 0; frame < 110; frame++) {
      const dx = target.x - world.player.x, dz = target.z - world.player.z, distance = Math.hypot(dx, dz);
      world.step({ x: distance > 0.15 ? dx / distance : 0, z: distance > 0.15 ? dz / distance : 0,
        run: true, jump: frame === 0 });
      if (world.player.grounded && world.player.platformId === target.id && distance < 0.4) { landed = true; break; }
    }
    assert.ok(landed, `${target.id} unreachable from ${world.player.x}, ${world.player.y}, ${world.player.z}`);
  }
  assert.equal(world.coins.filter((coin) => coin.platformId && coin.collected).length, 14);
});

for (const phase of [0, 1.5, 3.5]) test("the sky ascent reaches the dragon perch at phase " + phase, (t) => {
  const world = setup(t);
  world.dragonMet = true;
  for (let i = 0; i < phase / FIXED_STEP; i++) world.step();
  const branch = world.platforms.find((platform) => platform.id === "step-4");
  place(world, branch.x, branch.y + 0.015, branch.z);
  for (let i = 0; i < 5; i++) world.step();
  const route = world.platforms.slice(7);
  for (const target of route) {
    let landed = false;
    for (let frame = 0; frame < 140; frame++) {
      const dx = target.x - world.player.x, dz = target.z - world.player.z, distance = Math.hypot(dx, dz);
      world.step({ x: distance > 0.15 ? dx / distance : 0, z: distance > 0.15 ? dz / distance : 0,
        run: true, jump: frame === 0 });
      if (world.player.grounded && world.player.platformId === target.id && distance < 0.4) { landed = true; break; }
    }
    assert.ok(landed, target.id + " unreachable from " + world.player.x + ", " + world.player.y + ", " + world.player.z);
  }
  assert.ok(world.player.y > 14);
  assert.equal(world.coins.filter((coin) => coin.platformId?.startsWith("sky-") && coin.collected).length, 17);
});

test("moving slabs push nearby guardians clear instead of crossing their bodies", (t) => {
  const world = setup(t), enemy = world.enemies[1];
  Object.assign(enemy, { x: 13.7, y: 0, z: -12, health: enemy.maxHealth, active: true, grounded: true });
  const position = { x: enemy.x, y: enemy.bodyOffset, z: enemy.z };
  enemy.collider.setEnabled(true); enemy.body.setTranslation(position, true); enemy.body.setNextKinematicTranslation(position);
  world.physics.step();
  for (let frame = 0; frame < 360; frame++) {
    world.step();
    for (const platform of world.platforms) {
      const overlaps = Math.abs(enemy.x - platform.x) < platform.width / 2 + 0.31 &&
        Math.abs(enemy.z - platform.z) < platform.depth / 2 + 0.31 &&
        enemy.y < platform.y - 0.03 && enemy.y + 1.8 > platform.y - platform.height + 0.03;
      assert.equal(overlaps, false, "guardian crossed " + platform.id + " at frame " + frame);
    }
  }
});

test("the landed dragon speaks once and remembers Neonboy after loading", (t) => {
  const world = setup(t), perch = world.platforms.at(-1);
  world.time = world.level.dragon.landingTime + 1;
  world.updateChallenges(true);
  place(world, perch.x, perch.y + 0.015, perch.z);
  world.step();
  assert.equal(world.dialogue?.speaker, "Drag\u00f3n");
  assert.match(world.dialogue.text, /amigo/);
  assert.match(world.dialogue.text, /pr\u00f3ximos niveles/);
  world.answerDialogue();
  assert.equal(world.dragonMet, true);
  assert.equal(world.dragonDepartureTime, world.time);
  assert.equal(world.dragonCollider.isEnabled(), false);
  const restored = new GameWorld(); t.after(() => restored.dispose());
  restored.restore(validateGameSave(save(world)).world);
  assert.equal(restored.dragonMet, true);
  assert.equal(restored.dragonDepartureTime, world.dragonDepartureTime);
  assert.equal(restored.dragonCollider.isEnabled(), false);
  restored.step();
  assert.equal(restored.dialogue, null);
});

test("the dragon is solid while perched and clears the way after saying goodbye", (t) => {
  const world = setup(t), dragon = world.level.dragon;
  world.time = dragon.landingTime + 1;
  world.updateChallenges(true);
  assert.equal(world.dragonCollider.isEnabled(), true);
  world.dragonMet = true; world.dragonDepartureTime = world.time;
  world.updateChallenges(true);
  assert.equal(world.dragonCollider.isEnabled(), false);
  place(world, dragon.x, dragon.y + 0.015, dragon.z + 2.2);
  for (let frame = 0; frame < 90; frame++) world.step({ z: -1, run: true });
  assert.ok(world.coins.find((coin) => coin.platformId === "dragon-perch").collected);
});

test("elevated coins cannot be collected from underneath", (t) => {
  const world = setup(t), platform = world.platforms[3];
  place(world, platform.x, 0, platform.z);
  world.step();
  assert.ok(world.coins.filter((coin) => coin.platformId === platform.id).every((coin) => !coin.collected));
});

test("spikes hurt once during invulnerability and can be cleared in the air", (t) => {
  const world = setup(t), hazard = world.hazards.find((entry) => entry.kind === "spikes");
  place(world, hazard.x, 0, hazard.z);
  world.step();
  assert.equal(world.player.health, 100 - hazard.damage);
  for (let i = 0; i < 12; i++) world.step();
  assert.equal(world.player.health, 100 - hazard.damage);
  world.player.invulnerable = 0;
  place(world, hazard.x, 1, hazard.z);
  world.step();
  assert.equal(world.player.health, 100 - hazard.damage);
});

test("the boss appears only after every regular enemy dies; victory still requires coins", (t) => {
  const world = new GameWorld(); t.after(() => world.dispose());
  assert.equal(world.boss.active, false);
  assert.equal(world.boss.collider.isEnabled(), false);
  assert.equal(world.boss.bodyOffset, world.player.bodyOffset * 2);
  world.coins.forEach((coin) => { coin.collected = true; });
  world.collected = world.coins.length;
  world.step();
  assert.equal(world.status, "playing");
  assert.equal(world.boss.active, false);
  const oldSave = save(world); oldSave.world.bossActive = true;
  assert.equal(validateGameSave(oldSave).world.bossActive, false);
  world.enemies.filter((enemy) => !enemy.boss).slice(0, -1).forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  world.step();
  assert.equal(world.boss.active, false);
  const lastGuard = world.enemies.filter((enemy) => !enemy.boss).at(-1);
  lastGuard.health = 0; lastGuard.collider.setEnabled(false);
  world.step();
  assert.equal(world.boss.active, true);
  assert.equal(world.boss.collider.isEnabled(), true);
  assert.equal(world.boss.maxHealth, 360);
  assert.ok(ATTACKS.boss.damage > ATTACKS.demon.damage);
  const restored = new GameWorld();
  t.after(() => restored.dispose());
  restored.restore(validateGameSave(save(world)).world);
  assert.equal(restored.boss.active, true);
  assert.equal(restored.collected, restored.coins.length);
  world.boss.health = 0;
  world.step();
  assert.equal(world.status, "won");
  assert.equal(world.nextLevelOptions().level, 2);
});

test("the boss telegraphs a heavier hit and does not lose its attack to one punch", (t) => {
  const world = setup(t), boss = world.boss;
  boss.active = true; boss.collider.setEnabled(true); boss.cooldown = 0;
  place(world, boss.x, 0, boss.z + 2.3);
  world.step();
  assert.equal(boss.attack.kind, "boss");
  world.damage(boss, world.player, ATTACKS.punch);
  assert.equal(boss.attack.kind, "boss");
  for (let i = 0; i < 35; i++) world.step();
  assert.equal(world.player.health, 100);
  for (let i = 0; i < 23; i++) world.step();
  assert.equal(world.player.health, 100 - ATTACKS.boss.damage);
});

test("saving on a platform restores its phase and continues carrying the player", (t) => {
  const world = setup(t), platform = world.platforms[1];
  for (let i = 0; i < 70; i++) world.step();
  place(world, platform.x, platform.y + 0.015, platform.z);
  for (let i = 0; i < 10; i++) world.step();
  const restored = new GameWorld();
  t.after(() => restored.dispose());
  restored.restore(validateGameSave(save(world)).world);
  assert.equal(restored.player.platformId, platform.id);
  for (let i = 0; i < 45; i++) { world.step(); restored.step(); }
  assert.ok(Math.abs(world.player.z - restored.player.z) < 0.02);
  assert.equal(restored.player.grounded, true);
  assert.ok(Math.abs(restored.platforms[1].z - platform.z) < FIXED_STEP);
});

test("older level-one saves gain the new boss without losing their collected coins", (t) => {
  const world = setup(t), legacy = save(world);
  delete legacy.world.layoutVersion;
  legacy.world.enemies.pop();
  legacy.world.coins = [0, 1, 2];
  const migrated = validateGameSave(legacy);
  assert.equal(migrated.world.enemies.length, world.enemies.length);
  assert.equal(migrated.world.enemies.at(-1).health, 360);
  assert.deepEqual(migrated.world.coins, [0, 1, 2]);
});
