import test from "node:test";
import assert from "node:assert/strict";
import { landingCompression } from "./gameLocomotion.js";
import { GameWorld, initializePhysics } from "./gameWorld.js";

await initializePhysics();

test("landing compression starts and ends at rest", () => {
  assert.equal(landingCompression(0.24), 0);
  assert.equal(landingCompression(0), 0);
  assert.equal(landingCompression(0.12), 1);
});

test("jump pressed just before landing is buffered once, without midair double jumps", () => {
  const world = new GameWorld();
  try {
    world.step(); world.step({ jump: true });
    world.step({ jump: true });
    assert.equal(world.events.filter((e) => e.type === "jump").length, 1);
    let steps = 0;
    while (!(world.player.velocityY < -2 && world.player.y < 0.25) && steps++ < 100) world.step();
    assert.ok(steps < 100);
    world.step({ jump: true });
    for (let i = 0; i < 8; i++) world.step();
    assert.equal(world.events.filter((e) => e.type === "jump").length, 2);
    assert.ok(world.player.y > 0.3);
    for (let i = 0; i < 90; i++) world.step();
    assert.equal(world.player.grounded, true);
    assert.equal(world.player.landing, 0);
    assert.equal(world.events.filter((e) => e.type === "jump").length, 2);
  } finally { world.dispose(); }
});

test("landing has a short recovery and coyote time permits leaving an edge", () => {
  const world = new GameWorld();
  try {
    world.step(); world.step();
    world.player.grounded = false;
    world.step({ jump: true });
    assert.ok(world.player.velocityY > 6);
    for (let i = 0; i < 90 && !world.player.grounded; i++) world.step();
    assert.ok(world.player.landing > 0);
    for (let i = 0; i < 20; i++) world.step();
    assert.equal(world.player.landing, 0);
  } finally { world.dispose(); }
});
