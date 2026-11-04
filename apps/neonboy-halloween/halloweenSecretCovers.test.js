import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenSecretCovers } from "./halloweenSecretCovers.js";

test("Holy Fire cover switches only during vision and restores its exact texture", () => {
  const original = new THREE.Texture();
  const alternate = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: original });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  const scene = new THREE.Scene();
  scene.add(mesh);
  const albums = [
    { id: "holy-fire", cover: "holy.jpg", tracks: ["same-song"] },
    { id: "unholy-fire", cover: "unholy.jpg", tracks: ["other-song"] }
  ];
  const shop = { covers: [original, alternate], albumTargets: [{ id: "holy-fire", x: 0, z: 0, reach: 2.1 }] };
  const controller = createHalloweenSecretCovers(scene, shop, albums);
  assert.equal(mesh.userData.halloweenSecretCover, true);
  controller.setActive(true);
  assert.equal(mesh.material.map, alternate);
  assert.deepEqual(albums[0].tracks, ["same-song"]);
  let count = 0;
  controller.discover({ x: 0, z: 0 }, () => count++);
  controller.discover({ x: 0, z: 0 }, () => count++);
  assert.equal(count, 1);
  controller.setActive(false);
  assert.equal(mesh.material.map, original);
  controller.reset();
  mesh.geometry.dispose(); material.dispose(); original.dispose(); alternate.dispose();
});
