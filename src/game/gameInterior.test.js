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
