import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenOrbAbility } from "./halloweenOrbReactions.js";
import { createHalloweenDemonEncounter } from "./halloweenDemonEncounter.js";

function shot({ matrix = false, wall = false, offset = 0 } = {}) {
  const saved = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }) };
  try {
    const scene = new THREE.Scene();
    const demon = createHalloweenDemonEncounter(scene);
    demon.setVision(matrix);
    const player = { x: demon.position.x + offset, y: 0, z: demon.position.z + 5 };
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 3, .3));
    shelf.position.set(demon.position.x, 1, demon.position.z + 2.5);
    shelf.updateMatrixWorld(true);
    let taunts = 0, hits = 0, shields = 0;
    const orb = createHalloweenOrbAbility(scene, {
      demon, onTaunt: () => taunts++, onShieldHit: () => shields++,
      getTargets: () => { const target = demon.getOrbTarget(); return target ? [target] : []; },
      getColliders: () => wall ? [shelf] : [],
      onHit: () => { demon.hit(); hits++; },
    });
    const projectile = scene.getObjectByName("NeonBoy / Orbe Neon");
    let minimumZ = Infinity;
    orb.fire(player, Math.PI);
    for (let i = 0; i < 160; i++) {
      orb.update(.04, player, i * .04);
      minimumZ = Math.min(minimumZ, projectile.position.z);
    }
    const result = { taunts, hits, shields, phase: orb.getStatus().phase, health: demon.health, passedThrough: minimumZ < demon.position.z - 1 };
    orb.dispose(); demon.stop(); shelf.geometry.dispose(); shelf.material.dispose();
    return result;
  } finally { globalThis.document = saved; }
}

test("normal form deflects the orb back to NeonBoy, with one shield pulse and no damage", () => {
  assert.deepEqual(shot(), { taunts: 1, hits: 0, shields: 1, phase: "ready", health: 3, passedThrough: false });
});
test("a missed shot does not trigger a taunt", () => {
  assert.equal(shot({ offset: 5 }).taunts, 0);
});
test("shelves block the taunt as well as the projectile", () => {
  const result = shot({ wall: true });
  assert.equal(result.taunts, 0);
  assert.equal(result.shields, 0);
  assert.equal(result.passedThrough, false);
  assert.equal(result.health, 3);
});
test("revealed form takes damage and never laughs at a successful hit", () => {
  const result = shot({ matrix: true });
  assert.equal(result.taunts, 0);
  assert.equal(result.shields, 0);
  assert.equal(result.hits, 1);
  assert.equal(result.health, 2);
});


test("a returning orb detours around a protected demon and reaches NeonBoy", () => {
  const saved = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }) };
  try {
    const scene = new THREE.Scene(), demon = createHalloweenDemonEncounter(scene);
    const player = { x: demon.position.x + 3, y: 0, z: demon.position.z + 4 };
    let shields = 0;
    const orb = createHalloweenOrbAbility(scene, { demon, onShieldHit: () => shields++ });
    orb.fire(player, 0);
    orb.update(.1, player, .1);
    orb.recall();
    const projectile = scene.getObjectByName("NeonBoy / Orbe Neon");
    projectile.position.set(demon.position.x, 1.18, demon.position.z - 4);
    player.x = demon.position.x;
    let nearest = Infinity;
    for (let i = 0; i < 200; i++) {
      orb.update(.04, player, i * .04);
      nearest = Math.min(nearest, Math.hypot(projectile.position.x - demon.position.x, projectile.position.z - demon.position.z));
    }
    assert.equal(shields, 1);
    assert.ok(nearest >= 1.07, "the returning orb must stay outside the shield");
    assert.equal(orb.getStatus().phase, "ready", "the shield cannot trap the returning orb");
    assert.equal(demon.health, 3);
    orb.dispose(); demon.stop();
  } finally { globalThis.document = saved; }
});

test("switching to Matrix during flight removes the shield collision and permits a lethal hit", () => {
  const saved = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }) };
  try {
    const scene = new THREE.Scene(), demon = createHalloweenDemonEncounter(scene);
    demon.setVision(true); demon.hit(); demon.hit(); demon.setVision(false);
    const player = { x: demon.position.x, y: 0, z: demon.position.z + 5 };
    let shields = 0;
    const orb = createHalloweenOrbAbility(scene, {
      demon, onShieldHit: () => shields++,
      getTargets: () => { const target = demon.getOrbTarget(); return target ? [target] : []; },
      onHit: () => demon.hit(),
    });
    orb.fire(player, Math.PI);
    orb.update(.1, player, .1);
    demon.setVision(true);
    for (let i = 0; i < 160; i++) orb.update(.04, player, i * .04);
    assert.equal(demon.health, 0);
    assert.equal(shields, 0);
    assert.equal(demon.getShieldTarget(), null);
    demon.setVision(false);
    assert.equal(demon.getShieldTarget(), null, "a dead demon cannot regain its shield");
    orb.dispose(); demon.stop();
  } finally { globalThis.document = saved; }
});

test("Halloween orb keeps its glow without adding another shop point light", () => {
  const saved = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }) };
  try {
    const scene = new THREE.Scene();
    const demon = createHalloweenDemonEncounter(scene);
    const orb = createHalloweenOrbAbility(scene, { demon });
    const projectile = scene.getObjectByName("NeonBoy / Orbe Neon");
    assert.ok(projectile, "the original plasma orb still exists");
    assert.equal(projectile.children.some((child) => child.isPointLight), false);
    orb.fire({ x: 0, y: 0, z: 5 }, Math.PI);
    orb.update(.1, { x: 0, y: 0, z: 5 }, .1);
    assert.equal(projectile.visible, true);
    orb.dispose();
    demon.stop();
  } finally { globalThis.document = saved; }
});
