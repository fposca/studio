import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { instanceStaticShopBoxes } from "./halloweenShopInstancing.js";

test("static boxes become one instanced draw while interactive and transparent props remain", () => {
  const root = new THREE.Group(), material = new THREE.MeshBasicMaterial(), transparent = new THREE.MeshBasicMaterial({ transparent: true });
  const originals = [];
  for (let i = 0; i < 4; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1 + i, 1, 1), material);
    box.position.x = i * 3;
    root.add(box); originals.push(box);
  }
  const clickable = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  clickable.userData.shopAction = "open"; root.add(clickable);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), transparent); root.add(glass);
  const result = instanceStaticShopBoxes({ root, displayBins: [], wallDisplays: [], clickable: [clickable] });
  const batch = root.children.find((child) => child.isInstancedMesh);
  assert.deepEqual(result, { instancedMeshes: 4, estimatedDrawCallsSaved: 3 });
  assert.equal(batch.count, 4);
  assert.ok(root.children.includes(clickable));
  assert.ok(root.children.includes(glass));
  const matrix = new THREE.Matrix4();
  batch.getMatrixAt(2, matrix);
  assert.equal(matrix.elements[12], 6);
  assert.equal(matrix.elements[0], 3);
  batch.geometry.dispose(); material.dispose(); transparent.dispose();
});

test("named exterior walls remain separate so the camera can hide one wall", () => {
  const root = new THREE.Group(), material = new THREE.MeshBasicMaterial();
  const walls = Array.from({ length: 3 }, (_, index) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 8), material);
    wall.name = "Halloween / exterior wall";
    wall.position.x = index * 3;
    root.add(wall);
    return wall;
  });
  instanceStaticShopBoxes({ root, displayBins: [], wallDisplays: [], clickable: [] });
  assert.ok(walls.every((wall) => root.children.includes(wall)));
  assert.ok(walls.every((wall) => wall.isMesh && !wall.isInstancedMesh));
  walls.forEach((wall) => wall.geometry.dispose());
  material.dispose();
});
