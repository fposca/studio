import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { BODY_OFFSET } from "./gameRules.js";
import { GAME_SAVE_KEY, readGameSave, validateGameSave, writeGameSave } from "./gameSave.js";

await initializePhysics();
const wrap = (world) => ({ version: 1, savedAt: 1791468000000, period: "sunset",
  camera: { yaw: 0.3, pitch: 0.4, distance: 6 }, world: world.serialize() });
const memory = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

for (const level of [1, 3]) test(`level ${level} saves and restores coins, health, weapons, enemies and the checkpoint`, () => {
  const world = new GameWorld({ level, inventory: level === 3 ? ["unarmed", "sword"] : ["unarmed"], equipped: level === 3 ? "sword" : "unarmed" });
  const restored = new GameWorld({ level });
  try {
    world.step();
    world.inventory.add(level === 1 ? "sword" : "axe");
    world.equip(level === 1 ? "sword" : "axe");
    world.coins[0].collected = world.coins[2].collected = true;
    world.hearts[0].collected = true;
    world.collected = 2;
    world.artifacts[0].found = true;
    if (level === 3) world.scoreBase = 250;
    world.player.health = 64;
    world.player.x = 2;
    world.enemies[0].health = 0;
    world.enemies[1].health = 35;
    const storage = memory();
    const saved = writeGameSave(wrap(world), storage);
    assert.deepEqual(readGameSave(storage).save, saved);
    restored.restore(saved.world);
    assert.deepEqual(restored.serialize(), saved.world);
    assert.equal(restored.enemies[0].collider.isEnabled(), false);
    assert.equal(restored.player.body.translation().x, 2);
    assert.ok(Math.abs(restored.player.body.translation().y - restored.player.y - BODY_OFFSET) < 0.0001);
    assert.equal(restored.pickups[0].collected, true);
    assert.deepEqual(restored.hearts.filter((heart) => heart.collected).map((heart) => heart.id), [world.hearts[0].id]);
    assert.equal(restored.artifacts[0].found, true);
    assert.equal(restored.snapshot().score, level === 3 ? 350 : 100);
    assert.equal(restored.snapshot().defeated, 1);
    restored.step();
    assert.equal(restored.collected, 2);
    assert.equal(restored.enemies[0].health, 0);
    restored.restart();
    assert.deepEqual([...restored.inventory], saved.world.checkpoint);
    assert.equal(restored.equipped, saved.world.checkpointWeapon);
    assert.equal(restored.player.health, 100);
    assert.ok(restored.hearts.every((heart) => !heart.collected));
    assert.equal(restored.enemies[0].collider.isEnabled(), true);
  } finally { world.dispose(); restored.dispose(); }
});

test("an airborne save preserves vertical position and velocity until landing", () => {
  const world = new GameWorld(), restored = new GameWorld();
  try {
    world.step(); world.step({ jump: true });
    for (let i = 0; i < 8; i++) world.step();
    restored.restore(validateGameSave(wrap(world)).world);
    assert.equal(restored.player.y, world.player.y);
    assert.equal(restored.player.velocityY, world.player.velocityY);
    for (let i = 0; i < 60; i++) restored.step();
    assert.equal(restored.player.grounded, true);
    assert.ok(Math.abs(restored.player.y) < 0.02);
  } finally { world.dispose(); restored.dispose(); }
});

test("old saves without discoveries remain loadable", () => {
  const world = new GameWorld();
  try {
    const legacy = wrap(world);
    delete legacy.world.artifacts;
    delete legacy.world.hearts;
    delete legacy.world.scoreBase;
    const saved = validateGameSave(legacy);
    assert.deepEqual(saved.world.artifacts, []);
    assert.deepEqual(saved.world.hearts, []);
    assert.equal(saved.world.scoreBase, 0);
    world.restore(saved.world);
    assert.equal(world.snapshot().score, 0);
  } finally { world.dispose(); }
});

test("old level 2 saves replace the hammer with the axe throughout the checkpoint", () => {
  const world = new GameWorld({ level: 3, inventory: ["unarmed", "sword", "axe"], equipped: "axe" });
  try {
    const legacy = wrap(world);
    legacy.world.level = 2;
    legacy.world.layoutVersion = 2;
    legacy.world.inventory = ["unarmed", "sword", "hammer"];
    legacy.world.equipped = "hammer";
    legacy.world.checkpoint = ["unarmed", "sword", "hammer"];
    legacy.world.checkpointWeapon = "hammer";
    const saved = validateGameSave(legacy);
    assert.equal(saved.world.level, 3);
    assert.deepEqual(saved.world.inventory, ["unarmed", "sword", "axe"]);
    assert.deepEqual(saved.world.checkpoint, ["unarmed", "sword", "axe"]);
    assert.equal(saved.world.equipped, "axe");
    assert.equal(saved.world.checkpointWeapon, "axe");
  } finally { world.dispose(); }
});

test("old cemetery saves keep their progress and gain new zombies, coins and boss", () => {
  const world = new GameWorld({ level: 3 }), restored = new GameWorld({ level: 3 });
  try {
    world.step();
    const legacy = wrap(world);
    legacy.world.enemies = legacy.world.enemies.slice(0, 5);
    legacy.world.coins = [0, 1, 27];
    legacy.world.artifacts = ["lekythos"];
    legacy.world.enemies[0].health = 35;
    const saved = validateGameSave(legacy);
    assert.equal(saved.world.enemies.length, 12);
    assert.deepEqual(saved.world.coins, [0, 1, 27]);
    assert.equal(saved.world.enemies[0].health, 35);
    assert.equal(saved.world.enemies.at(-1).health, 480);
    restored.restore(saved.world);
    assert.equal(restored.snapshot().coins, 3);
    assert.equal(restored.snapshot().total, 42);
    assert.equal(restored.boss.active, false);
  } finally { world.dispose(); restored.dispose(); }
});

test("invalid saves are rejected without replacing the previous slot", () => {
  const world = new GameWorld(), storage = memory();
  try {
    const original = wrap(world);
    writeGameSave(original, storage);
    const edits = [
      (v) => { v.version = 2; }, (v) => { v.world.level = 99; },
      (v) => { delete v.world.level; },
      (v) => { v.world.player.x = Infinity; }, (v) => { v.world.player.health = 0; },
      (v) => { v.world.player.y = 100; }, (v) => { v.world.player.grounded = "yes"; },
      (v) => { v.world.inventory.push("crossbow"); }, (v) => { v.world.equipped = "sword"; },
      (v) => { v.world.coins = [0, 0]; }, (v) => { v.world.coins = [100]; },
      (v) => { v.world.artifacts = ["frieze", "frieze"]; },
      (v) => { v.world.artifacts = ["unknown"]; },
      (v) => { v.world.hearts = ["temple-entry", "temple-entry"]; },
      (v) => { v.world.hearts = ["unknown"]; },
      (v) => { v.world.scoreBase = 999; },
      (v) => { v.world.coins = world.coins.map((c) => c.id); v.world.enemies.at(-1).health = 0; },
      (v) => { v.world.enemies.pop(); }, (v) => { v.world.enemies[0].health = 999; },
      (v) => { v.world.checkpoint.push("sword"); }, (v) => { v.world.checkpointWeapon = "axe"; },
      (v) => { v.period = "storm"; }, (v) => { v.camera.distance = 0; }
    ];
    for (const edit of edits) {
      const invalid = structuredClone(original); edit(invalid);
      assert.throws(() => writeGameSave(invalid, storage));
      assert.deepEqual(readGameSave(storage).save, original);
    }
  } finally { world.dispose(); }
});

test("corrupt or blocked storage is recoverable, and reading never erases data", () => {
  const storage = memory();
  assert.deepEqual(readGameSave(storage), { save: null, error: "" });
  storage.setItem(GAME_SAVE_KEY, "broken-json");
  assert.ok(readGameSave(storage).error);
  assert.equal(storage.getItem(GAME_SAVE_KEY), "broken-json");
  storage.setItem(GAME_SAVE_KEY, "x".repeat(50001));
  assert.ok(readGameSave(storage).error);
  const blocked = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("quota"); } };
  assert.ok(readGameSave(blocked).error);
  const world = new GameWorld();
  try { assert.throws(() => writeGameSave(wrap(world), blocked), /No se pudo guardar/); }
  finally { world.dispose(); }
});

test("completed and lost rounds cannot overwrite a resumable game", () => {
  const world = new GameWorld();
  try {
    world.status = "won";
    assert.throws(() => world.serialize());
    world.status = "lost";
    assert.throws(() => world.serialize());
  } finally { world.dispose(); }
});
