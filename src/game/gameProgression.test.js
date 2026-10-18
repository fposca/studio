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
  if (world.dialogue) world.answerDialogue();
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
  assert.equal(world.equip("axe"), false);
  world.status = "lost";
  assert.equal(world.equip("sword"), false);
});

test("victory unlocks the sanctuary, keeps the sword and restores health at the checkpoint", (t) => {
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
  assert.equal(next.level.enemy, "hoplite");
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
  assert.ok(next.enemies.every((enemy) => enemy.health === enemy.maxHealth));
});

test("a campaign without a sword does not grant it automatically in later levels", (t) => {
  const world = setup(t); world.status = "won";
  const next = setup(t, world.nextLevelOptions());
  assert.equal(next.equip("sword"), false);
  assert.equal(next.equipped, "unarmed");
  next.status = "won";
  const cemetery = setup(t, next.nextLevelOptions());
  assert.equal(cemetery.level.id, 3);
  assert.equal(cemetery.equip("sword"), false);
  cemetery.status = "won";
  const catacombs = setup(t, cemetery.nextLevelOptions());
  assert.equal(catacombs.level.id, 4);
  assert.equal(catacombs.equip("sword"), false);
  catacombs.status = "won";
  assert.equal(catacombs.nextLevelOptions(), null);
});

for (const weapon of ["sword", "axe", "hammer"]) test(`${weapon} deals its own damage only once per swing`, (t) => {
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

test("ground-level cemetery coins and the axe remain reachable around the graves", (t) => {
  const world = setup(t, { level: 3 });
  for (const target of [...world.coins.slice(0, 3), world.pickups[0], ...world.coins.slice(3, 28)]) {
    let attempts = 0;
    while (!target.collected && attempts++ < 1300) {
      const dx = target.x - world.player.x, dz = target.z - world.player.z, d = Math.hypot(dx, dz);
      world.step({ x: dx / Math.max(d, 0.01), z: dz / Math.max(d, 0.01) });
    }
    assert.ok(target.collected, `unreachable ${target.id ?? target.weapon} at ${target.x},${target.z} from ${world.player.x},${world.player.z}`);
  }
  assert.equal(world.status, "playing");
  assert.equal(world.inventory.has("axe"), true);
});

test("cemetery platforms and their coins are reachable with real jumps", (t) => {
  const world = setup(t, { level: 3 });
  for (const route of [world.platforms.slice(0, 4), world.platforms.slice(4, 7),
    world.platforms.slice(7, 13), world.platforms.slice(13, 19)]) {
    const first = route[0];
    teleport(world, { x: first.x, y: 0, z: first.z + 3 });
    for (const target of route) {
      let landed = false;
      for (let frame = 0; frame < 115; frame++) {
        const dx = target.x - world.player.x, dz = target.z - world.player.z;
        const distance = Math.hypot(dx, dz);
        world.step({ x: distance > 0.15 ? dx / distance : 0, z: distance > 0.15 ? dz / distance : 0,
          run: true, jump: frame === 0 });
        if (world.player.grounded && world.player.platformId === target.id && distance < 0.4) { landed = true; break; }
      }
      assert.ok(landed, `${target.id} unreachable from ${world.player.x}, ${world.player.y}, ${world.player.z}`);
    }
  }
  assert.equal(world.coins.filter((coin) => coin.platformId && coin.collected).length, 38);
});

test("the axe breaks cemetery walls and exposes the secret relics", (t) => {
  const world = setup(t, { level: 3, inventory: ["axe"], equipped: "axe" });
  const door = world.secretDoors[0];
  const relic = world.artifacts.find((artifact) => artifact.secret === door.id);
  assert.equal(world.artifactAvailable(relic), false);
  teleport(world, { x: door.x + 1.4, y: 0, z: door.z });
  world.player.yaw = -Math.PI / 2;
  assert.equal(world.startAttack(world.player, "punch"), true);
  for (let i = 0; i < 45; i++) world.step();
  assert.equal(door.broken, true);
  assert.equal(door.collider.isEnabled(), false);
  assert.equal(world.artifactAvailable(relic), true);
  for (let i = 0; i < 110 && !relic.found; i++) world.step({ x: -1 });
  assert.equal(relic.found, true);
  assert.ok(world.player.x < door.x);
  const east = world.secretDoors[1], eastRelic = world.artifacts.find((artifact) => artifact.secret === east.id);
  teleport(world, { x: east.x - 1.4, y: 0, z: east.z });
  world.player.attack = null; world.player.cooldown = 0; world.player.yaw = Math.PI / 2;
  assert.equal(world.startAttack(world.player, "punch"), true);
  for (let i = 0; i < 45; i++) world.step();
  assert.equal(east.broken, true);
  for (let i = 0; i < 110 && !eastRelic.found; i++) world.step({ x: 1 });
  assert.equal(eastRelic.found, true);
});

test("zombie boss alternates a sweep and a crushing combo", (t) => {
  const world = setup(t, { level: 3 }), boss = world.boss;
  boss.health = boss.maxHealth;
  boss.active = true; boss.collider.setEnabled(true);
  teleport(world, { x: boss.x, y: 0, z: boss.z + 1.8 });
  world.step();
  assert.equal(boss.attack?.kind, "zombieSweep");
  assert.ok(ATTACKS.zombieSweep.reach > ATTACKS.zombieCrush.reach);
  assert.ok(ATTACKS.zombieCrush.damage > ATTACKS.zombieSweep.damage);
  boss.attack = null; boss.cooldown = 0;
  world.step();
  assert.equal(boss.attack?.kind, "zombieCrush");
});

test("demon attacks have readable windup, a lunge, damage and recovery", (t) => {
  const world = new GameWorld({ level: 3 }); t.after(() => world.dispose());
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
  for (const kind of ["thunder", "coin", "pickup", "heal", "victory", "punch", "kick", "sword", "axe", "hammer", "enemy", "demon", "hit", "metal", "heavy", "hurt", "defeat", "jump", "land"]) {
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

test("the rear cemetery mausoleum blocks the center while its side aisle reaches the boss", (t) => {
  const world = setup(t, { level: 3 });
  world.player.invulnerable = 100;
  teleport(world, { x: 0, y: 0, z: -62 });
  for (let i = 0; i < 150; i++) world.step({ z: -1, run: true });
  assert.ok(world.player.z > -64, `passed through the mausoleum: ${world.player.z}`);
  teleport(world, { x: 10, y: 0, z: -62 });
  for (let i = 0; i < 420 && world.player.z > -88; i++) world.step({ z: -1, run: true });
  assert.ok(world.player.z < -87.5, `side aisle ended at ${world.player.z}`);
  assert.equal(world.level.bounds.back, -93);
  assert.equal(world.boss.spawn.z, -89);
});

test("the rear ossuary can be opened with the axe and entered", (t) => {
  const world = setup(t, { level: 3, inventory: ["axe"], equipped: "axe" });
  const door = world.secretDoors.find((entry) => entry.id === "west-ossuary");
  const relic = world.artifacts.find((entry) => entry.secret === door.id);
  teleport(world, { x: door.x + 1.4, y: 0, z: door.z });
  world.player.yaw = -Math.PI / 2;
  assert.equal(world.startAttack(world.player, "punch"), true);
  for (let i = 0; i < 65; i++) world.step();
  assert.equal(door.broken, true);
  assert.equal(world.artifactAvailable(relic), true);
  for (let i = 0; i < 125 && !relic.found; i++) world.step({ x: -1 });
  assert.equal(relic.found, true);
});
