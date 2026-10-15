import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { ATTACKS, FIXED_STEP } from "./gameRules.js";
import { validateGameSave } from "./gameSave.js";
await initializePhysics();
const make = (t) => {
  const world = new GameWorld({ level: 4 }); t.after(() => world.dispose()); world.adviceIndex = 3;
  for (const enemy of world.enemies) { enemy.health = 0; enemy.collider.setEnabled(false); }
  return world;
};
function place(world, actor, x, y, z) {
  Object.assign(actor, { x, y, z, velocityY: 0, velocityX: 0, velocityZ: 0 });
  const position = { x, y: y + actor.bodyOffset, z };
  actor.body.setTranslation(position, true); actor.body.setNextKinematicTranslation(position);
  world.physics.step();
}
test("first-person strafing and melee keep facing the view instead of snapping behind", (t) => {
  const world = make(t);
  world.step({ firstPerson: true, yaw: 0.7, x: 1 });
  assert.equal(world.player.yaw, Math.PI + 0.7);
  const target = world.enemies[0];
  Object.assign(target, { health: 100, active: true });
  place(world, target, world.player.x, 0, world.player.z + 1);
  world.step({ firstPerson: true, yaw: 0, attack: "punch" });
  for (let i = 0; i < 25; i++) world.step({ firstPerson: true, yaw: 0 });
  assert.equal(world.player.yaw, Math.PI);
  assert.equal(target.health, 100);
});
test("crossbow rays follow vertical aim and hit elevated enemies", (t) => {
  const world = make(t);
  world.inventory.add("crossbow"); world.equip("crossbow");
  place(world, world.player, 0, 0, 10);
  world.step({ firstPerson: true, yaw: 0, aimPitch: 0.3, attack: "punch" });
  // Create the shot without advancing enemy AI/gravity, then trace it in the physics world.
  world.updateAttack(world.player, world.enemies, ATTACKS.crossbow.impact);
  const arrow = world.arrows[0];
  assert.equal(arrow.pitch, 0.3);
  assert.ok(arrow.y > 1.5);
  const target = world.enemies[0];
  Object.assign(target, { health: 100, active: true }); target.collider.setEnabled(true);
  place(world, target, 0, arrow.y + Math.tan(0.3) * 4 - target.bodyOffset, 6);
  for (let i = 0; i < 20; i++) world.updateArrows(FIXED_STEP);
  assert.equal(target.health, 100 - ATTACKS.crossbow.damage);
  assert.equal(world.arrows.length, 0);
});
test("first-person arrows start at eye position and cannot skip a nearby wall", (t) => {
  const world = make(t); world.inventory.add("crossbow"); world.equip("crossbow");
  const door = world.secretDoors[0];
  place(world, world.player, door.x + door.width / 2 + 0.1, 0, door.z);
  world.step({ firstPerson: true, yaw: Math.PI / 2, attack: "punch" });
  world.updateAttack(world.player, world.enemies, ATTACKS.crossbow.impact);
  world.updateArrows(FIXED_STEP);
  assert.equal(door.broken, true);
  assert.equal(world.arrows.length, 0);
});
test("camera mode and vertical aim survive save validation while legacy cameras remain valid", (t) => {
  const world = make(t);
  const save = { version: 1, savedAt: 1, period: "night", world: world.serialize(),
    camera: { yaw: 1, pitch: 0.26, distance: 7.5, firstPerson: true, lookPitch: -0.4 } };
  assert.deepEqual(validateGameSave(save).camera, save.camera);
  assert.throws(() => validateGameSave({ ...save, camera: { ...save.camera, lookPitch: 2 } }));
  assert.throws(() => validateGameSave({ ...save, camera: { ...save.camera, firstPerson: "yes" } }));
  delete save.camera.firstPerson; delete save.camera.lookPitch;
  assert.deepEqual(validateGameSave(save).camera, save.camera);
});
