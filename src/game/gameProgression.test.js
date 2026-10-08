import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS, BODY_OFFSET } from "./gameRules.js";
import { synthesizeEffect } from "./gameSound.js";

await initializePhysics();
function setup(t, options) {
  const world = new GameWorld(options);
  t.after(() => world.dispose());
  world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  world.step();
  return world;
}
function teleport(world, target) {
  Object.assign(world.player, target, { velocityY: 0, velocityX: 0, velocityZ: 0 });
  const p = { x: target.x, y: target.y + BODY_OFFSET, z: target.z };
  world.player.body.setTranslation(p, true);
  world.player.body.setNextKinematicTranslation(p);
  world.physics.step();
  world.step();
}

test("weapons must be collected and cannot switch during a strike or after defeat", (t) => {
  const world = setup(t);
  assert.equal(world.equip("sword"), false);
  assert.equal(world.startAttack(world.player, "sword"), false);
  teleport(world, world.pickups[0]);
  assert.equal(world.pickups[0].collected, true);
  assert.equal(world.events.filter((event) => event.type === "pickup").length, 1);
  world.step();
  assert.equal(world.events.filter((event) => event.type === "pickup").length, 1);
  assert.equal(world.equipped, "unarmed");
  assert.equal(world.equip("sword"), true);
  world.startAttack(world.player, "punch");
  assert.equal(world.player.attack.kind, "sword");
  assert.equal(world.equip("unarmed"), false);
  for (let i = 0; i < 48; i++) world.step();
  assert.equal(world.equip("unarmed"), true);
  assert.equal(world.equip("hammer"), false);
  world.status = "lost";
  assert.equal(world.equip("sword"), false);
});

test("victory unlocks cemetery, keeps the sword and restores health at the checkpoint", (t) => {
  const world = setup(t);
  assert.equal(world.nextLevelOptions(), null);
  teleport(world, world.pickups[0]); world.equip("sword");
  world.player.health = 35;
  for (const coin of world.coins) teleport(world, coin);
  assert.equal(world.status, "won");
  const next = setup(t, world.nextLevelOptions());
  assert.equal(next.level.id, 2);
  assert.equal(next.equipped, "sword");
  assert.equal(next.player.health, 100);
  assert.equal(next.level.enemy, "demon");
  assert.equal(next.player.equipped, "sword");
  teleport(next, next.pickups[0]);
  assert.equal(next.equip("hammer"), true);
  next.startAttack(next.player, "punch");
  assert.equal(next.player.attack.kind, "hammer");
  assert.ok(ATTACKS.hammer.damage > ATTACKS.sword.damage);
  next.restart();
  assert.deepEqual([...next.inventory], ["unarmed", "sword"]);
  assert.equal(next.equipped, "sword");
  assert.equal(next.pickups[0].collected, false);
  assert.ok(next.enemies.every((enemy) => enemy.health === 120 && enemy.species === "demon"));
});

test("a campaign without a sword does not grant it automatically in the cemetery", (t) => {
  const world = setup(t); world.status = "won";
  const next = setup(t, world.nextLevelOptions());
  assert.equal(next.equip("sword"), false);
  assert.equal(next.equipped, "unarmed");
  next.status = "won";
  assert.equal(next.nextLevelOptions(), null);
});

for (const weapon of ["sword", "hammer"]) test(`${weapon} deals its own damage only once per swing`, (t) => {
  const world = setup(t, { inventory: [weapon], equipped: weapon });
  const enemy = world.enemies[0];
  Object.assign(enemy, { x: 0, y: 0, z: 11.25, health: 100, cooldown: 100 });
  const p = { x: enemy.x, y: BODY_OFFSET, z: enemy.z };
  enemy.body.setTranslation(p, true); enemy.body.setNextKinematicTranslation(p);
  enemy.collider.setEnabled(true); world.physics.step();
  world.startAttack(world.player, "punch");
  for (let i = 0; i < 70; i++) world.step();
  assert.equal(enemy.health, 100 - ATTACKS[weapon].damage);
  assert.equal(world.events.filter((event) => event.type === "hit").length, 1);
  assert.equal(world.events.find((event) => event.type === "hit").kind, weapon);
});

test("all cemetery coins and the hammer are reachable on foot with solid graves and crypt", (t) => {
  const world = setup(t, { level: 2 });
  for (const target of [...world.coins.slice(0, 3), world.pickups[0], ...world.coins.slice(3)]) {
    let attempts = 0;
    while (!target.collected && attempts++ < 1300) {
      const dx = target.x - world.player.x, dz = target.z - world.player.z, d = Math.hypot(dx, dz);
      world.step({ x: dx / Math.max(d, 0.01), z: dz / Math.max(d, 0.01) });
    }
    assert.ok(target.collected, `unreachable ${target.id ?? target.weapon} at ${target.x},${target.z} from ${world.player.x},${world.player.z}`);
  }
  assert.equal(world.status, "won");
  assert.equal(world.inventory.has("hammer"), true);
});

test("demon attacks have readable windup, a lunge, damage and recovery", (t) => {
  const world = new GameWorld({ level: 2 }); t.after(() => world.dispose());
  const enemy = world.enemies[0];
  teleport(world, { x: enemy.x, y: 0, z: enemy.z + 1.7 });
  const start = enemy.z;
  for (let i = 0; i < 15; i++) world.step();
  assert.equal(world.player.health, 100);
  assert.equal(enemy.attack.kind, "demon");
  for (let i = 0; i < 30; i++) world.step();
  assert.ok(enemy.z > start);
  assert.equal(world.player.health, 82);
});

test("sound effects have finite audio, headroom, a soft tail and distinct variations", () => {
  for (const kind of ["coin", "pickup", "victory", "punch", "kick", "sword", "hammer", "enemy", "demon", "hit", "metal", "heavy", "defeat", "jump", "land"]) {
    const samples = synthesizeEffect(kind, 22050, 0);
    assert.ok(samples.every(Number.isFinite), kind);
    assert.ok(samples.some((value) => Math.abs(value) > 0.01), kind);
    assert.ok(samples.every((value) => Math.abs(value) < 0.46), kind);
    assert.ok(Math.abs(samples.at(-1)) < 0.001, kind);
    assert.equal(Math.abs(samples[0]), 0);
    const alternate = synthesizeEffect(kind, 22050, 2);
    assert.ok(samples.some((value, index) => value !== alternate[index]), kind);
  }
});
