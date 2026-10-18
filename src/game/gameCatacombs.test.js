import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS, BODY_OFFSET, FIXED_STEP } from "./gameRules.js";
import { validateGameSave } from "./gameSave.js";

await initializePhysics();
const create = (t) => { const world = new GameWorld({ level: 4 }); t.after(() => world.dispose()); return world; };
function place(world, x, z) {
  Object.assign(world.player, { x, y: 0, z, velocityY: 0, velocityX: 0, velocityZ: 0 });
  const position = { x, y: BODY_OFFSET, z };
  world.player.body.setTranslation(position, true);
  world.player.body.setNextKinematicTranslation(position);
  world.physics.step();
}
function frames(world, count, input = {}) { for (let i = 0; i < count; i++) world.step(input, FIXED_STEP); }
const wrapped = (world) => ({ version: 1, savedAt: 1, period: "night",
  camera: { yaw: 0, pitch: 0.3, distance: 7.5 }, world: world.serialize() });

test("Plato introduces the catacombs and offers later advice", (t) => {
  const world = create(t);
  world.step();
  assert.equal(world.dialogue.speaker, "Platon");
  assert.match(world.dialogue.text, /diez flechas/);
  world.answerDialogue();
  assert.equal(world.adviceIndex, 1);
  place(world, 0, -14);
  world.step();
  assert.match(world.dialogue.text, /losas altas/);
  world.answerDialogue();
  place(world, 0, -80);
  world.step();
  assert.match(world.dialogue.text, /guadana/);
  world.answerDialogue();
  assert.equal(world.adviceIndex, 3);
});

test("crossbow fires ten physical arrows, needs ammo, and opens rune walls", (t) => {
  const world = create(t);
  world.adviceIndex = 3;
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  const target = world.enemies[0];
  Object.assign(target, { x: 0, y: 0, z: 4.8, health: 105, stationary: true, cooldown: 100 });
  target.collider.setEnabled(true);
  target.body.setTranslation({ x: 0, y: target.bodyOffset, z: 4.8 }, true);
  target.body.setNextKinematicTranslation({ x: 0, y: target.bodyOffset, z: 4.8 });
  place(world, 0, 10.4);
  world.step({ yaw: 0 });
  assert.equal(world.pickups[0].collected, true);
  assert.equal(world.equip("crossbow"), true);
  assert.equal(world.startAttack(world.player, "punch"), true);
  frames(world, 45, { yaw: 0 });
  assert.equal(target.health, 105 - ATTACKS.crossbow.damage);
  for (let i = 1; i < 10; i++) {
    assert.equal(world.startAttack(world.player, "punch"), true);
    frames(world, 45, { yaw: 0 });
  }
  assert.equal(world.ammo, 0);
  assert.equal(world.startAttack(world.player, "punch"), false);
  place(world, 3.2, 4);
  world.step({ yaw: 0 });
  assert.equal(world.ammo, 5);
  assert.ok(world.ammoPickups[0].readyAt > world.time);
  place(world, 0, -15);
  world.step({ yaw: Math.PI / 2 });
  assert.equal(world.startAttack(world.player, "punch"), true);
  frames(world, 45, { yaw: Math.PI / 2 });
  assert.equal(world.secretDoors[0].broken, true);
  assert.equal(world.artifactAvailable(world.artifacts[0]), true);
  const saved = validateGameSave(wrapped(world));
  const restored = create(t);
  restored.restore(saved.world);
  assert.equal(restored.ammo, 4);
  assert.equal(restored.secretDoors[0].broken, true);
  assert.equal(restored.ammoPickups[0].readyAt, world.ammoPickups[0].readyAt);
});

test("catacomb walls and columns are solid", (t) => {
  const world = create(t);
  world.adviceIndex = 3;
  place(world, -7, -6);
  frames(world, 90, { x: -1, z: 0, yaw: 0, run: true });
  assert.ok(world.player.x > -8.5, `walked through the column: ${world.player.x}`);
});

test("both elevated coin trails can be reached with jumps", (t) => {
  const world = create(t);
  world.adviceIndex = 3;
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  for (const trail of [world.platforms.slice(0, 3), world.platforms.slice(3, 6),
    world.platforms.slice(6, 12), world.platforms.slice(12, 18)]) {
    place(world, trail[0].x, trail[0].z + 2.8);
    frames(world, 5);
    for (const target of trail) {
      let landed = false;
      for (let frame = 0; frame < 110; frame++) {
        const dx = target.x - world.player.x, dz = target.z - world.player.z;
        const distance = Math.hypot(dx, dz);
        world.step({ x: distance > 0.15 ? dx / distance : 0,
          z: distance > 0.15 ? dz / distance : 0, run: true, jump: frame === 0 });
        if (world.player.grounded && world.player.platformId === target.id && distance < 0.4) {
          landed = true; break;
        }
      }
      assert.ok(landed, `${target.id} unreachable`);
    }
  }
});

test("mummy chief's scythe has a windup and damages within its long reach", (t) => {
  const world = create(t);
  world.adviceIndex = 3;
  for (const enemy of world.enemies) if (!enemy.boss) { enemy.health = 0; enemy.collider.setEnabled(false); }
  const boss = world.boss;
  world.activateBoss();
  place(world, boss.x, boss.z + 2.5);
  boss.yaw = 0;
  boss.cooldown = 0;
  assert.equal(world.startAttack(boss, "mummyChief"), true);
  frames(world, 20);
  assert.equal(world.player.health, 100);
  frames(world, 55);
  assert.ok(world.player.health < 100);
  assert.equal(world.events.some((event) => event.type === "hit" && event.kind === "mummyChief"), true);
});

test("the new rune gates have solid center panels and passable side aisles", (t) => {
  const world = create(t);
  world.adviceIndex = 3;
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  world.player.invulnerable = 100;
  for (const z of [-55, -79]) {
    place(world, 0, z + 3);
    frames(world, 115, { z: -1, run: true });
    assert.ok(world.player.z > z + 0.45, `crossed the center wall at ${z}`);
    place(world, 7, z + 3);
    frames(world, 115, { z: -1, run: true });
    assert.ok(world.player.z < z - 2, `side aisle blocked at ${z}: ${world.player.z}`);
  }
  assert.equal(world.boss.spawn.z, -91);
});

test("a rear bone vault opens with the crossbow", (t) => {
  const world = new GameWorld({ level: 4, inventory: ["crossbow"], equipped: "crossbow" });
  t.after(() => world.dispose());
  world.adviceIndex = 3;
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  const door = world.secretDoors.find((entry) => entry.id === "west-bone-vault");
  const relic = world.artifacts.find((entry) => entry.secret === door.id);
  place(world, -10, door.z);
  world.step({ yaw: Math.PI / 2 });
  assert.equal(world.startAttack(world.player, "punch"), true);
  frames(world, 50, { yaw: Math.PI / 2 });
  assert.equal(door.broken, true);
  assert.equal(world.artifactAvailable(relic), true);
  assert.equal(world.ammo, 9);
});

test("the four visible sarcophagi block movement and support a falling player", (t) => {
  const world = create(t);
  world.adviceIndex = 3;
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  for (const [x, z] of [[-9, 1], [9, -10], [-9, -22], [8.8, -35]]) {
    Object.assign(world.player, { x, y: 2.4, z, grounded: false, velocityY: 0, velocityX: 0, velocityZ: 0 });
    const body = { x, y: 2.4 + BODY_OFFSET, z };
    world.player.body.setTranslation(body, true);
    world.player.body.setNextKinematicTranslation(body);
    world.physics.step();
    frames(world, 75);
    assert.ok(world.player.grounded, `not grounded on sarcophagus ${x},${z}`);
    assert.ok(Math.abs(world.player.y - 0.95) < 0.08,
      `fell through sarcophagus ${x},${z}: ${world.player.y}`);
  }
  place(world, 8.8, -32.8);
  frames(world, 80, { z: -1, run: true });
  assert.ok(world.player.z > -33.55, `walked through sarcophagus: ${world.player.z}`);
});
