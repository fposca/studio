import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { chooseEnemyReappearance, createUnderworldCombat } from "./underworldCombat.js";
import { canStandInUnderworld } from "./underworldLayout.js";
import { advanceUnderworldChase } from "./underworldActors.js";

test("enemy reappearance stays on the arena and gives the player room to dodge", () => {
  const actor = { homeZ: -40.5, group: { position: { x: 5, z: -40.5 } } };
  const player = { x: 0, z: -39 };
  const destination = chooseEnemyReappearance(actor, player, true, canStandInUnderworld);
  assert.ok(destination);
  assert.equal(canStandInUnderworld(destination.x, destination.z, true), true);
  assert.ok(Math.hypot(destination.x - player.x, destination.z - player.z) >= 2.8);
  assert.equal(chooseEnemyReappearance(actor, { x: 0, z: -24 }, false, canStandInUnderworld), null);
  assert.equal(canStandInUnderworld(3.9, 8, true), false);
  assert.equal(canStandInUnderworld(0, 8, true), true);
});

test("the final boss pursues across the arena and navigates onto the bridge after the mechanism is solved", () => {
  const progress = { mechanismSolved: true, ferryCompleted: true };
  const boss = { x: 4.5, z: -32.5 };
  const player = { x: 0, z: -24 };
  for (let frame = 0; frame < 160; frame++)
    advanceUnderworldChase(boss, player, 2.65, .05, false, progress);
  assert.ok(boss.z > -30, `boss did not enter the bridge: ${boss.z}`);
  assert.ok(Math.hypot(boss.x - player.x, boss.z - player.z) < 1);
  assert.equal(canStandInUnderworld(boss.x, boss.z, false, 1.35, progress), true);
});

test("enemy projectiles and impact animations freeze on pause and never damage twice", () => {
  const root = new THREE.Group();
  let damage = 0;
  const combat = createUnderworldCombat(root, () => { damage++; });
  const player = { x: 0, y: 0, z: 2 };
  const actor = { type: "centinela", group: new THREE.Group(), hp: () => 5 };
  try {
    combat.fire(actor, player);
    combat.update(.05, player, {});
    const projectile = root.children[0].children.find(child => child.visible);
    const body = projectile.getObjectByName("Enemy orb / plasma");
    const beforePause = body.position.clone();
    const shader = body.children[0].children[0].material.uniforms.uTime;
    const pausedTime = shader.value;
    for (let frame = 0; frame < 120; frame++) combat.update(0, player, {});
    assert.ok(body.position.equals(beforePause));
    assert.equal(shader.value, pausedTime);
    assert.equal(damage, 0);

    for (let frame = 0; frame < 20 && !damage; frame++) combat.update(.05, player, {});
    assert.equal(damage, 1);
    assert.equal(combat.activeCount, 0);
    const impact = projectile.getObjectByName("Enemy orb / impact");
    assert.ok(impact.visible && projectile.visible);
    const ringScale = impact.children[1].scale.clone();
    for (let frame = 0; frame < 120; frame++) combat.update(0, player, {});
    assert.ok(impact.children[1].scale.equals(ringScale));
    for (let frame = 0; frame < 20; frame++) combat.update(.05, player, {});
    assert.equal(damage, 1);
    assert.equal(projectile.visible, false);
  } finally {
    combat.dispose();
  }
  assert.equal(root.children.length, 0);
});
