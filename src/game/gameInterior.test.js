import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS } from "./gameRules.js";
import { validateGameSave } from "./gameSave.js";

await initializePhysics();
function setup(t, options = {}) {
  const world = new GameWorld({ level: 2, ...options });
  t.after(() => world.dispose());
  return world;
}
function place(world, actor, x, z, yaw = Math.PI) {
  Object.assign(actor, { x, y: 0, z, yaw, velocityX: 0, velocityY: 0, velocityZ: 0, attack: null, cooldown: 0, stun: 0 });
  const position = { x, y: actor.bodyOffset, z };
  actor.body.setTranslation(position, true); actor.body.setNextKinematicTranslation(position);
  world.physics.step();
}
function accept(world) { world.step(); assert.ok(world.dialogue); world.answerDialogue(); }
function disableEnemies(world) {
  world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
}
const wrap = (world) => ({ version: 1, savedAt: 100, period: "night", camera: { yaw: 0, pitch: 0.3, distance: 7 }, world: world.serialize() });

test("the expanded sanctuary is traversable, carries a reachable gallery and saves deep progress", (t) => {
  const world = setup(t); accept(world); disableEnemies(world);
  assert.ok(world.level.bounds.back < -90);
  assert.ok(world.coins.length > 55);
  assert.equal(world.platforms.length, 9);
  place(world, world.player, 0, -39);
  for (let frame = 0; frame < 280; frame++) world.step({ z: -1, run: true });
  assert.ok(world.player.z < -53, "the open portal must lead into the second nave");
  assert.ok(world.player.z > -56, "the central relief should redirect the route");
  place(world, world.player, 10, -53);
  for (let frame = 0; frame < 550; frame++) world.step({ z: -1, run: true });
  assert.ok(world.player.z < -89, "the side aisle must reach the altar chamber");
  const first = world.platforms[0];
  place(world, world.player, first.x, first.z + 3);
  let landed = false;
  for (let frame = 0; frame < 100; frame++) {
    const dz = first.z - world.player.z;
    world.step({ z: dz < -0.12 ? -1 : 0, run: true, jump: frame === 0 });
    if (world.player.grounded && world.player.platformId === first.id) { landed = true; break; }
  }
  assert.ok(landed, "the first gallery slab must be reachable by jumping");
  for (const slab of world.platforms.slice(1)) {
    let arrived = false;
    for (let frame = 0; frame < 130; frame++) {
      const dx = slab.x - world.player.x, dz = slab.z - world.player.z;
      const distance = Math.hypot(dx, dz);
      world.step({ x: distance > 0.12 ? dx / distance : 0,
        z: distance > 0.12 ? dz / distance : 0, run: true, jump: frame === 0 });
      if (world.player.grounded && world.player.platformId === slab.id) { arrived = true; break; }
    }
    assert.ok(arrived, slab.id + " must be reachable from the preceding slab");
  }
  place(world, world.player, 18, -84);
  const saved = validateGameSave(wrap(world));
  assert.equal(saved.world.player.z, -84);
  const restored = setup(t); restored.restore(saved.world);
  assert.equal(restored.player.z, -84);
});

test("old sanctuary saves gain the new guardians and move Medusa to the new altar", (t) => {
  const world = setup(t); accept(world);
  const old = wrap(world);
  old.world.enemies = [...old.world.enemies.slice(0, 6), old.world.enemies.at(-1)];
  old.world.enemies.at(-1).z = -33;
  const migrated = validateGameSave(old);
  assert.equal(migrated.world.enemies.length, world.enemies.length);
  assert.equal(migrated.world.enemies.at(-1).z, -92);
  assert.ok(migrated.world.enemies.slice(6, -1).every((enemy) => enemy.health > 0));
  const restored = setup(t); restored.restore(migrated.world);
  assert.equal(restored.boss.z, -92);
});

test("Plato pauses the simulation until accepting, without repeating his introduction", (t) => {
  const world = setup(t);
  world.step();
  assert.equal(world.dialogue.speaker, "Platon");
  assert.equal(world.questStage, "unstarted");
  const position = { x: world.player.x, z: world.player.z };
  for (let i = 0; i < 60; i++) world.step({ x: 1, attack: "punch", jump: true });
  assert.equal(world.time, 0);
  assert.deepEqual({ x: world.player.x, z: world.player.z }, position);
  assert.equal(world.answerDialogue(), true);
  world.step();
  assert.equal(world.questStage, "searching");
  assert.equal(world.dialogue, null);
  assert.ok(world.time > 0);
});

test("statues attack nearby players but cannot walk, lunge or be knocked away", (t) => {
  const world = setup(t); accept(world);
  const statue = world.enemies.find((enemy) => enemy.stationary);
  for (let i = 0; i < 120; i++) world.step();
  assert.ok(Math.abs(statue.x - statue.spawn.x) < 0.005);
  assert.ok(Math.abs(statue.z - statue.spawn.z) < 0.005);
  assert.equal(statue.attack, null);
  place(world, world.player, statue.x, statue.z + 2.05);
  world.step();
  assert.equal(statue.attack?.kind, "statue");
  for (let i = 0; i < 58; i++) world.step();
  assert.equal(world.player.health, 100 - ATTACKS.statue.damage);
  world.damage(statue, world.player, ATTACKS.hammer);
  assert.equal(statue.velocityX, 0);
  assert.equal(Math.abs(statue.velocityZ), 0);
  assert.ok(Math.abs(statue.x - statue.spawn.x) < 0.005);
  assert.ok(Math.abs(statue.z - statue.spawn.z) < 0.005);
});

test("hoplites pursue and use their own close-range attack", (t) => {
  const world = setup(t); accept(world);
  const enemy = world.enemies[0];
  place(world, world.player, enemy.x, enemy.z + 4);
  const start = enemy.z;
  for (let i = 0; i < 120; i++) world.step();
  assert.ok(enemy.z > start + 1);
  assert.ok(world.events.some((event) => event.type === "attack" && event.kind === "hoplite"));
});

test("hammer pickup opens sealed chambers, awards unique secrets and restarts at the checkpoint", (t) => {
  const world = setup(t, { inventory: ["sword"], equipped: "sword" }); accept(world); disableEnemies(world);
  const door = world.secretDoors[0], artifact = world.artifacts[0];
  place(world, world.player, door.x + 1.5, door.z, -Math.PI / 2);
  world.step({ attack: "punch" });
  for (let i = 0; i < 75; i++) world.step();
  assert.equal(door.broken, false);
  assert.equal(door.collider.isEnabled(), true);
  assert.equal(world.artifactAvailable(artifact), false);
  const pickup = world.pickups[0];
  place(world, world.player, pickup.x, pickup.z); world.step();
  assert.equal(world.inventory.has("hammer"), true);
  assert.equal(world.equip("hammer"), true);
  place(world, world.player, door.x + 1.5, door.z, -Math.PI / 2);
  world.step({ attack: "punch" });
  for (let i = 0; i < 78; i++) world.step();
  assert.equal(door.broken, true);
  assert.equal(door.collider.isEnabled(), false);
  assert.equal(world.events.filter((event) => event.type === "secret").length, 1);
  for (let i = 0; i < 95; i++) world.step({ x: -1 });
  assert.ok(world.player.x < door.x - 1);
  place(world, world.player, artifact.x, artifact.z); world.step();
  assert.equal(artifact.found, true);
  assert.equal(world.snapshot().score, 250);
  world.step(); assert.equal(world.snapshot().score, 250);
  world.restart();
  assert.equal(door.broken, false); assert.equal(door.collider.isEnabled(), true);
  assert.equal(world.inventory.has("hammer"), false);
  assert.equal(world.equipped, "sword");
});

test("the seal requires Medusa and the mission ends only when returning to Plato", (t) => {
  const world = setup(t, { inventory: ["sword", "hammer"], equipped: "hammer" }); accept(world);
  const seal = world.artifacts.find((artifact) => artifact.questItem);
  assert.equal(world.boss.active, false);
  place(world, world.player, 0, -27); world.step();
  assert.equal(world.boss.active, false);
  world.enemies.filter((enemy) => !enemy.boss).forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  world.step();
  assert.equal(world.boss.active, true);
  place(world, world.player, seal.x, seal.z); world.step();
  assert.equal(seal.found, false);
  world.boss.health = 0; world.boss.collider.setEnabled(false); world.step();
  assert.equal(seal.found, true);
  assert.equal(world.questStage, "returning");
  assert.equal(world.status, "playing");
  place(world, world.player, world.level.quest.x, world.level.quest.z); world.step();
  assert.equal(world.dialogue.action, "Entregar sello");
  world.answerDialogue();
  assert.equal(world.status, "won");
  assert.equal(world.snapshot().score, 700);
  assert.equal(world.collected < world.coins.length, true);
  const next = new GameWorld(world.nextLevelOptions()); t.after(() => next.dispose());
  assert.equal(next.level.id, 3); assert.equal(next.level.enemy, "demon");
  assert.equal(next.equipped, "hammer"); assert.ok(next.inventory.has("sword"));
  assert.equal(next.scoreBase, 700);
});

test("collecting every coin alone cannot skip the sanctuary mission", (t) => {
  const world = setup(t); accept(world); disableEnemies(world);
  world.coins.forEach((coin) => { coin.collected = true; }); world.collected = world.coins.length;
  world.step(); assert.equal(world.status, "playing"); assert.equal(world.nextLevelOptions(), null);
});

test("sanctuary saves restore mission, secrets, real hammer and a defeated Medusa", (t) => {
  const world = setup(t, { inventory: ["sword"], equipped: "sword", score: 250 }); accept(world);
  world.inventory.add("hammer"); world.equip("hammer");
  world.secretDoors[0].broken = true; world.artifacts[0].found = true;
  world.boss.health = 0; world.boss.active = true;
  world.artifacts[2].found = true; world.questStage = "returning";
  world.hearts[0].collected = true; world.player.health = 75;
  place(world, world.player, 0, -36);
  const saved = validateGameSave(wrap(world));
  const restored = setup(t); restored.restore(saved.world);
  assert.deepEqual(restored.serialize(), saved.world);
  assert.equal(restored.equipped, "hammer"); assert.equal(restored.secretDoors[0].collider.isEnabled(), false);
  assert.equal(restored.boss.collider.isEnabled(), false); assert.equal(restored.snapshot().score, 700);
  assert.equal(restored.questStage, "returning");
  const invalid = structuredClone(saved); invalid.world.secretDoors = [];
  assert.throws(() => validateGameSave(invalid));
  const invalidSeal = structuredClone(saved); invalidSeal.world.enemies.at(-1).health = 420;
  assert.throws(() => validateGameSave(invalidSeal));
});
