import test from "node:test";
import assert from "node:assert/strict";
import { planCitizenStep, moveCitizen, canMoveCitizen } from "./buenosAiresPedestrianMotion.js";
import { sampleCityRoute, canCitizenStand, createCityPopulation, CITY_WALK_ROUTES } from "./buenosAiresPopulation.js";

const player = { x: 0, z: 0 };
function walker(index, distance, direction = 1, speed = .85, route = 0) {
  const p = sampleCityRoute(route, distance, direction);
  return { config: { index, route, direction, speed, lane: 0 }, root: { position: { x: p.x, z: p.z } },
    target: { x: p.x, z: p.z }, distance, yaw: p.yaw, routeYaw: p.yaw, segment: p.segment,
    lod: "near", colliderRadius: 1.1, pause: 0, blocked: 0, aiTime: 0 };
}
function run(actors, seconds = 18, hz = 15, options = {}) {
  let minGap = Infinity, maxStep = 0, unsafe = 0, backwards = 0;
  const origins = actors.map(a => ({ distance: a.distance, direction: a.config.direction }));
  const dt = 1 / 60, canAvoid = options.canAvoid || (() => true);
  for (let frame = 0; frame < seconds * 60; frame++) {
    const time = (options.time ?? 13) + frame * dt;
    for (const actor of actors) {
      if (actor.config.route == null || actor.pause > 0) { actor.pause = Math.max(0, actor.pause - dt); continue; }
      actor.aiTime += dt;
      if (actor.aiTime >= 1 / hz) { planCitizenStep(actor, actors, options.player || player, actor.aiTime, time, canAvoid); actor.aiTime = 0; }
      const before = { ...actor.root.position };
      maxStep = Math.max(maxStep, moveCitizen(actor, actors, options.player || player, dt, time, canAvoid));
      const dx = actor.root.position.x - before.x, dz = actor.root.position.z - before.z;
      if (dx * Math.sin(actor.routeYaw) + dz * Math.cos(actor.routeYaw) < -.001) backwards++;
      if (!canCitizenStand(actor.root.position.x, actor.root.position.z) || !canAvoid(actor.root.position.x, actor.root.position.z)) unsafe++;
    }
    for (let i = 0; i < actors.length; i++) for (let j = i + 1; j < actors.length; j++)
      minGap = Math.min(minGap, Math.hypot(actors[i].root.position.x - actors[j].root.position.x, actors[i].root.position.z - actors[j].root.position.z));
  }
  return { minGap, maxStep, unsafe, backwards, progress: actors.map((a, i) => (a.distance - origins[i].distance) * origins[i].direction) };
}

for (const hz of [15, 2]) test(`opposing walkers pass without contact or reversing at ${hz} AI updates/second`, () => {
  const a = walker(0, 10), b = walker(1, 16, -1);
  const result = run([a, b], 16, hz);
  assert.ok(result.minGap >= 1.3 - 1e-5, JSON.stringify(result));
  assert.ok(result.progress.every(p => p > 9), JSON.stringify(result));
  assert.equal(result.unsafe, 0); assert.equal(a.config.direction, 1); assert.equal(b.config.direction, -1);
  assert.ok(result.backwards < 5, JSON.stringify(result));
  assert.ok(result.maxStep < .02);
});
test("a faster follower keeps space behind a slower walker", () => {
  const result = run([walker(0, 12, 1, .5), walker(1, 9, 1, 1)], 18);
  assert.ok(result.minGap >= 1.3 - 1e-5, JSON.stringify(result));
  assert.ok(result.progress.every(p => p > 7), JSON.stringify(result));
  assert.ok(result.backwards < 5, JSON.stringify(result));
});
test("a walker goes around a citizen stopped to use their phone", () => {
  const stopped = walker(0, 14); stopped.pause = 60;
  const mover = walker(1, 10);
  const result = run([stopped, mover], 16);
  assert.ok(result.minGap >= 1.3 - 1e-5, JSON.stringify(result));
  assert.ok(result.progress[1] > 8, JSON.stringify(result));
  assert.equal(stopped.distance, 14); assert.equal(result.unsafe, 0);
});
test("citizens crossing routes yield and both resume", () => {
  const result = run([walker(0, 59), walker(1, 3, -1, .85, 4)], 12);
  assert.ok(result.minGap >= 1.3 - 1e-5, JSON.stringify(result));
  assert.ok(result.progress.every(p => p > 5), JSON.stringify(result));
  assert.equal(result.unsafe, 0);
});
test("existing contact can separate without moving deeper or teleporting", () => {
  const a = walker(0, 12), b = walker(1, 12.9, -1);
  const before = Math.hypot(a.root.position.x - b.root.position.x, a.root.position.z - b.root.position.z);
  assert.equal(canMoveCitizen(a, a.root.position.x, a.root.position.z - .05, [a, b], player), false);
  assert.equal(canMoveCitizen(a, a.root.position.x, a.root.position.z + .05, [a, b], player), true);
  const result = run([a, b], 18);
  assert.ok(result.minGap >= before - 1e-5, JSON.stringify(result));
  assert.ok(Math.hypot(a.root.position.x - b.root.position.x, a.root.position.z - b.root.position.z) > 3, JSON.stringify(result));
  assert.ok(result.maxStep < .02);
});
test("a solid barrier stops movement without flipping direction every few seconds", () => {
  const a = walker(0, 10);
  const result = run([a], 12, 15, { canAvoid: (_x, z) => z >= 26 });
  assert.equal(result.unsafe, 0); assert.equal(a.config.direction, 1);
  assert.ok(a.root.position.z >= 26); assert.ok(result.progress[0] < 2.5);
});
test("red crossings remain blocking and player contact cannot be penetrated", () => {
  const a = walker(0, 2.3, 1, .85, 4);
  const result = run([a], 3, 15, { time: 1 });
  assert.ok(a.root.position.x <= -31.5, JSON.stringify(result));
  const b = walker(0, 12);
  const p = { x: b.root.position.x, z: b.root.position.z - 1.2 };
  assert.equal(canMoveCitizen(b, p.x, p.z, [b], p), false);
});

for (const hz of [15, 2]) test(`the full city stays separated and clears congestion at ${hz} AI updates/second`, () => {
  const actors = createCityPopulation().map(config => {
    if (config.route == null) return { config, lod: "near", root: { position: { x: config.x, z: config.z } }, pause: 0 };
    const actor = walker(config.index, config.offset * CITY_WALK_ROUTES[config.route].length, config.direction, config.speed, config.route);
    actor.config = config;
    const p = sampleCityRoute(config.route, actor.distance, config.direction, config.lane);
    actor.root.position = { x: p.x, z: p.z }; actor.target = { ...actor.root.position };
    actor.lastMoved = 0; actor.headingChanges = 0;
    return actor;
  });
  let minGap = Infinity, unsafe = 0, longestWait = 0;
  const dt = 1 / 30, seconds = 150, stoppedPlayer = { x: 0, z: 42 };
  for (let frame = 0; frame < seconds / dt; frame++) {
    const time = frame * dt;
    for (const a of actors) {
      if (a.config.route == null) continue;
      if (a.pause > 0) { a.pause = Math.max(0, a.pause - dt); continue; }
      a.aiTime += dt;
      if (a.aiTime >= 1 / hz) { planCitizenStep(a, actors, stoppedPlayer, a.aiTime, time); a.aiTime = 0; }
      const before = { ...a.root.position };
      const travelled = moveCitizen(a, actors, stoppedPlayer, dt, time);
      if (travelled > dt * .025) a.lastMoved = time;
      longestWait = Math.max(longestWait, a.blocked);
      const dot = (a.root.position.x - before.x) * Math.sin(a.routeYaw) + (a.root.position.z - before.z) * Math.cos(a.routeYaw);
      if (Math.abs(dot) > dt * .06) {
        const direction = Math.sign(dot);
        if (a.lastDirection && a.lastDirection !== direction) a.headingChanges++;
        a.lastDirection = direction;
      }
      if (!canCitizenStand(a.root.position.x, a.root.position.z)) unsafe++;
    }
    for (let i = 0; i < actors.length; i++) for (let j = i + 1; j < actors.length; j++)
      minGap = Math.min(minGap, Math.hypot(actors[i].root.position.x - actors[j].root.position.x, actors[i].root.position.z - actors[j].root.position.z));
  }
  assert.ok(minGap >= 1.3 - 1e-5, `minimum clearance: ${minGap}`);
  assert.equal(unsafe, 0);
  assert.ok(longestWait < 15, `wait beyond the red-light cycle: ${longestWait}`);
  for (const a of actors.filter(a => a.config.route != null)) {
    assert.ok(seconds - a.lastMoved < 15, `trapped: ${a.config.id}`);
    assert.ok(a.headingChanges < 35, `oscillating: ${a.config.id} (${a.headingChanges} turns)`);
  }
});
