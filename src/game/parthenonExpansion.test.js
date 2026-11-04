import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createParthenonExpansion } from "./parthenonExpansion.js";

test("Medusa rejects protected hits and accepts a direct final hit during vulnerability", () => {
  const events = [];
  const root = new THREE.Group(), medusa = new THREE.Group();
  root.add(medusa);
  const obstacles = [], colliders = [], enemy = { id: "medusa", x: 999, z: -37, radius: .55 };
  obstacles.push(enemy);
  const boss = createParthenonExpansion(root, obstacles, colliders, medusa, enemy, {
    onEvent: event => events.push(event), onDamage: () => {},
  });
  const progress = { altarRead: true, cursedHopliteHealth: 0, medusaBossDefeated: false };
  const player = { x: 0, y: 0, z: -28 };
  assert.equal(boss.startBoss(progress, true), true);
  boss.registerImpact({ kind: "parthenon-medusa", ricochets: 0 });
  assert.equal(boss.getStatus().health, 6);
  for (let i = 0; i < 200 && boss.getStatus().cycle !== "vulnerable"; i++)
    boss.update(.05, i * .05, progress, player, false, null);
  assert.equal(boss.getStatus().cycle, "vulnerable");
  for (let i = 0; i < 5; i++) boss.registerImpact({ kind: "parthenon-medusa", ricochets: 0 });
  assert.equal(boss.getStatus().health, 1);
  assert.equal(boss.getStatus().phaseNumber, 3);
  boss.registerImpact({ kind: "parthenon-medusa", ricochets: 0 });
  assert.equal(boss.getStatus().health, 0);
  assert.equal(events.filter(event => event === "medusa-defeat").length, 1);
  boss.registerImpact({ kind: "parthenon-medusa", ricochets: 1 });
  assert.equal(events.filter(event => event === "medusa-defeat").length, 1);
  boss.resetBoss("active");
  assert.equal(boss.getStatus().health, 6);
  assert.equal(boss.getStatus().phase, "active");
  assert.equal(boss.getStatus().petrification, 0);
  boss.dispose();
});


test("Medusa pursues NeonBoy after waking without crossing sanctuary obstacles", () => {
  const root = new THREE.Group(), medusa = new THREE.Group(); root.add(medusa);
  const collider = { id: "medusa", x: 999, z: -37.4, radius: .55 };
  const rubble = { id: "ruina", x: 6, z: -34, radius: 1.05 };
  const altar = { id: "altar", x: 0, z: -36, hx: 1.15, hz: .825 };
  const seals = [-5, 0, 5].map(x => ({ id: "seal", x, z: -34, radius: .5 }));
  const boss = createParthenonExpansion(root, [collider, rubble, altar, ...seals], [], medusa, collider);
  const progress = { altarRead: true, cursedHopliteHealth: 0, medusaBossDefeated: false };
  const player = { x: 0, y: 0, z: -29 };
  assert.equal(boss.startBoss(progress), true);
  for (let i = 0; i < 80; i++) boss.update(.05, i * .05, progress, player, false, null);
  assert.equal(boss.getStatus().phase, "intro");
  assert.equal(medusa.position.x, 8);
  assert.equal(medusa.position.z, -37.4);

  let movingFrames = 0, gazeFrames = 0;
  for (let i = 80; i < 680; i++) {
    const previous = medusa.position.clone();
    boss.update(.05, i * .05, progress, player, false, null);
    const status = boss.getStatus();
    if (status.moving) movingFrames++;
    if (status.phase === "active" && status.cycle === "gaze") {
      gazeFrames++;
      assert.ok(previous.distanceTo(medusa.position) < .0001);
    }
    for (const obstacle of [rubble, ...seals])
      assert.ok(Math.hypot(medusa.position.x - obstacle.x, medusa.position.z - obstacle.z) >= obstacle.radius + .68 - 1e-6);
    assert.ok(Math.abs(medusa.position.x - altar.x) >= altar.hx + .68 - 1e-6 ||
      Math.abs(medusa.position.z - altar.z) >= altar.hz + .68 - 1e-6);
    if (status.phase === "active") {
      assert.equal(collider.x, medusa.position.x);
      assert.equal(collider.z, medusa.position.z);
    }
  }
  assert.ok(movingFrames > 50);
  assert.ok(gazeFrames > 0);
  assert.ok(Math.hypot(medusa.position.x - player.x, medusa.position.z - player.z) < 3);
  const stopped = medusa.position.clone();
  boss.update(1, 40, progress, player, true, null);
  assert.ok(medusa.position.distanceTo(stopped) < .0001);
  boss.resetBoss("active");
  Object.assign(player, { x: -8, z: -37 });
  for (let i = 0; i < 800; i++) boss.update(.05, i * .05, progress, player, false, null);
  assert.ok(Math.hypot(medusa.position.x - player.x, medusa.position.z - player.z) < 3);
  boss.dispose();
});
