import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { MATRIX_MESSAGES } from "./halloweenMatrixMessagesConfig.js";
import { createHalloweenMatrixMessages, MATRIX_MESSAGE_STYLES } from "./halloweenMatrixMessages.js";

function setup({ enabled = true, configs = MATRIX_MESSAGES, wall = false } = {}) {
  const scene = new THREE.Scene();
  for (const config of configs) if (config.targetObjectId && config.targetObjectId !== "demon") {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3, 1), new THREE.MeshBasicMaterial({ color: 0x995522 }));
    sign.name = config.targetObjectId; scene.add(sign);
  }
  const camera = new THREE.PerspectiveCamera(60, 1.6, .05, 40);
  camera.position.set(0, 1, 4); camera.lookAt(0, 1, 0); camera.updateMatrixWorld();
  const player = { x: 0, z: 3 };
  const demon = { position: new THREE.Vector3(0, 0, 0), defeated: false };
  let allocations = 0;
  const calls = [], textures = [], occluders = [];
  if (wall) {
    const obstacle = new THREE.Mesh(new THREE.BoxGeometry(5, 4, .2));
    obstacle.position.set(0, 1, 2); scene.add(obstacle); obstacle.updateMatrixWorld(); occluders.push(obstacle);
  }
  const messages = createHalloweenMatrixMessages(scene, {
    enabled, configs, demon, getOccluders: () => occluders,
    textureFactory: () => { allocations++; const texture = new THREE.Texture(); textures.push(texture); return texture; },
    onDiscover: (...args) => calls.push(args),
  });
  const tick = (times = 4) => { for (let i = 0; i < times; i++) messages.update(.25, camera, player); };
  return { scene, camera, player, demon, calls, messages, tick, textures, allocations: () => allocations };
}
const readable = (id, x = 0) => ({ id, text: id, category: "awakening", position: [x, 1, 0], rotation: [0,0,0], scale: [2,.5], visibility: "matrix" });

test("15 deliberate locations have unique IDs and three distinct visual categories", () => {
  assert.equal(MATRIX_MESSAGES.length, 15);
  assert.equal(new Set(MATRIX_MESSAGES.map(item => item.id)).size, 15);
  assert.deepEqual(new Set(MATRIX_MESSAGES.map(item => item.category)), new Set(["control", "awakening", "demonic"]));
  assert.equal(MATRIX_MESSAGE_STYLES.control.glow, 0);
  assert.notEqual(MATRIX_MESSAGE_STYLES.awakening.color, MATRIX_MESSAGE_STYLES.demonic.color);
});

test("normal play and disabled Halloween allocate no message textures", () => {
  const f = setup(); f.tick(); assert.equal(f.allocations(), 0);
  const disabled = setup({ enabled: false }); disabled.messages.setActive(true); disabled.tick();
  assert.equal(disabled.allocations(), 0); assert.equal(disabled.calls.length, 0);
  f.messages.dispose(); disabled.messages.dispose();
});

test("source signs are untouched, textures reused, both faces readable and all resources disposed", () => {
  const f = setup();
  const source = f.scene.getObjectByName("venue-sign:NUEVOS DISCOS");
  const original = source.material;
  f.messages.setActive(true); f.tick();
  const initialAllocations = f.allocations();
  const faces = f.messages.entries.find(entry => entry.config.doubleFace).faces;
  assert.equal(faces.length, 2);
  assert.equal(faces[0].material.side, THREE.FrontSide);
  assert.equal(faces[1].rotation.y - faces[0].rotation.y, Math.PI);
  assert.ok(f.messages.entries.flatMap(entry => entry.faces).filter(face => face.visible).length <= 15);
  for (let i = 0; i < 30; i++) {
    f.messages.setActive(false);
    assert.ok(f.messages.entries.every(entry => entry.faces.every(face => !face.visible)));
    f.messages.setActive(true); f.tick();
  }
  assert.equal(f.allocations(), initialAllocations);
  assert.equal(source.material, original);
  let disposals = 0; f.textures.forEach(texture => texture.addEventListener("dispose", () => disposals++));
  f.messages.dispose();
  assert.equal(disposals, initialAllocations);
  assert.equal(source.children.length, 0);
});

test("demon warning follows the entity, disappears on defeat, finale waits for the next activation", () => {
  const f = setup(); f.messages.setActive(true); f.tick();
  const warning = f.messages.entries.find(entry => entry.config.id === "demon").faces[0];
  const finale = f.messages.entries.find(entry => entry.config.id === "freedom").faces[0];
  assert.equal(warning.visible, true); assert.equal(finale.visible, false);
  f.demon.position.set(2,0,1); f.tick();
  assert.equal(warning.position.x, 2); assert.equal(warning.position.z, 1);
  f.demon.defeated = true; f.tick();
  assert.equal(warning.visible, false); assert.equal(finale.visible, false);
  f.messages.setActive(false); f.messages.setActive(true); f.tick();
  assert.equal(finale.visible, true);
  assert.ok(f.messages.entries.flatMap(entry => entry.faces).filter(face => face.visible).length <= 15);
  f.messages.dispose();
});

test("only two distinct visible messages are discovered, with bounded audio notices", () => {
  const f = setup({ configs: [readable("a", -1), readable("b", 1), readable("c", 0)] });
  f.messages.setActive(true); f.tick(8);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0][2].silent, false); assert.equal(f.calls[1][2].silent, true);
  f.messages.setActive(false); f.messages.setActive(true); f.tick(8);
  assert.equal(f.calls.length, 2);
  f.messages.dispose();
});

test("walls, facing away, distance, and disabled vision prevent false discovery", () => {
  const blocked = setup({ configs: [readable("a")], wall: true });
  blocked.messages.setActive(true); blocked.tick(8); assert.equal(blocked.calls.length, 0);
  const away = setup({ configs: [readable("a")] }); away.camera.lookAt(0,1,10);
  away.messages.setActive(true); away.tick(8); assert.equal(away.calls.length, 0);
  const far = setup({ configs: [readable("a")] }); far.player.z = 10;
  far.messages.setActive(true); far.tick(8); assert.equal(far.calls.length, 0);
  const normal = setup({ configs: [readable("a")] }); normal.tick(8); assert.equal(normal.calls.length, 0);
  for (const f of [blocked,away,far,normal]) f.messages.dispose();
});

test("messages fade in, but reduced motion presents stable text immediately", () => {
  const f = setup({ configs: [readable("a")] });
  f.messages.setActive(true); f.messages.update(.1, f.camera, f.player);
  assert.ok(f.messages.entries[0].material.opacity > 0 && f.messages.entries[0].material.opacity < 1);
  f.messages.setActive(false); f.messages.setActive(true);
  f.messages.update(.01, f.camera, f.player, { reducedMotion: true });
  assert.equal(f.messages.entries[0].material.opacity, 1);
  f.messages.dispose();
});
