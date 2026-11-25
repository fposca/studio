import test from "node:test";
import assert from "node:assert/strict";
import { SOVEREIGN_PHASES, sovereignBlinkDestination, sovereignCanOccupy, sovereignChaseTarget, sovereignColumnBetween, sovereignProjectileHits, steerSovereignVelocity } from "./throneCombat.js";

test("Sovereign gains speed, attack frequency and a wider volley in the final phase", () => {
  assert.ok(SOVEREIGN_PHASES[3].speed > SOVEREIGN_PHASES[1].speed);
  assert.ok(SOVEREIGN_PHASES[3].attackInterval < SOVEREIGN_PHASES[1].attackInterval);
  assert.ok(SOVEREIGN_PHASES[3].orbCount > SOVEREIGN_PHASES[1].orbCount);
  for (const phase of Object.values(SOVEREIGN_PHASES)) {
    assert.ok(phase.attacks.filter((type) => type === "bolt").length >= 2);
  }
});

test("blink destinations stay inside the arena and clear of the player and boss", () => {
  const boss = { x: 0, z: -76 };
  for (const player of [{ x: 0, z: -53 }, { x: 0, z: -64 }, { x: 0, z: -76 }, { x: 9, z: -76 }, { x: -6, z: -82 }]) {
    const target = sovereignBlinkDestination(player, boss);
    assert.ok(target, `Expected a safe blink destination for ${JSON.stringify(player)}`);
    assert.ok(sovereignCanOccupy(target.x, target.z));
    assert.ok(Math.hypot(target.x - player.x, target.z - player.z) >= 4.5);
    assert.ok(Math.hypot(target.x - boss.x, target.z - boss.z) >= 3);
    assert.equal(sovereignColumnBetween(target, player, .8), null);
  }
});

test("a guided center orb can catch a sprinting player", () => {
  const shot = { x: 0, z: 0 };
  const player = { x: 0, z: 8 };
  let velocity = { x: 0, z: 9.5 };
  let hit = false;
  const dt = 1 / 60;
  for (let frame = 0; frame < 120; frame++) {
    const age = frame * dt;
    player.x += 5 * dt;
    const start = { ...shot };
    if (age < .8 && velocity.x * (player.x - start.x) + velocity.z * (player.z - start.z) > 0)
      velocity = steerSovereignVelocity(velocity, start, player, 6 * dt);
    shot.x += velocity.x * dt;
    shot.z += velocity.z * dt;
    if (sovereignProjectileHits(start, shot, player)) { hit = true; break; }
  }
  assert.ok(hit);
});

test("projectile collision covers the path crossed between frames", () => {
  assert.ok(sovereignProjectileHits({ x: 0, z: 0 }, { x: 0, z: 2 }, { x: .7, z: 1 }));
  assert.equal(sovereignProjectileHits({ x: 0, z: 0 }, { x: 0, z: 2 }, { x: 1.2, z: 1 }), false);
});

test("Sovereign routes around the entrance column and reaches a player on the bridge", () => {
  const boss = { x: 0, z: -77 };
  const player = { x: 0, z: -53 };
  assert.ok(sovereignColumnBetween(boss, player, .8));
  let detoured = false;
  for (let i = 0; i < 700; i++) {
    const goal = sovereignChaseTarget(boss, player);
    assert.ok(goal);
    detoured ||= Math.abs(goal.x - player.x) > 1;
    const gap = Math.hypot(player.x - boss.x, player.z - boss.z);
    if (gap < 2.7 && !sovereignColumnBetween(boss, player, 1.65)) break;
    const distance = Math.hypot(goal.x - boss.x, goal.z - boss.z);
    const travel = Math.min(distance, 3.7 / 60);
    const nextX = boss.x + (goal.x - boss.x) / distance * travel;
    const nextZ = boss.z + (goal.z - boss.z) / distance * travel;
    assert.ok(sovereignCanOccupy(nextX, nextZ), `Route blocked at ${nextX}, ${nextZ}`);
    boss.x = nextX; boss.z = nextZ;
  }
  assert.ok(detoured);
  assert.ok(boss.z > -58, `Boss never reached the bridge: ${boss.z}`);
  assert.ok(Math.hypot(player.x - boss.x, player.z - boss.z) < 2.7);
  assert.equal(sovereignColumnBetween(boss, player, .8), null);
});
