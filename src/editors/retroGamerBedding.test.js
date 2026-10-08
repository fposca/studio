import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRetroGamerBedding } from "./retroGamerBedding.js";

function createBedding() {
  const printMap = new THREE.Texture();
  const clothMap = new THREE.Texture();
  clothMap.colorSpace = THREE.SRGBColorSpace;
  return { bedding: createRetroGamerBedding({ printMap, clothMap }), printMap, clothMap };
}

test("duvet is closed, padded geometry with a continuous print from head to foot", () => {
  const { bedding } = createBedding();
  const duvet = bedding.getObjectByName("Acolchado Monkey Island");
  const { position, uv } = duvet.geometry.attributes;
  const count = position.count / 2;
  const top = new THREE.Vector3(), bottom = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    top.fromBufferAttribute(position, i);
    bottom.fromBufferAttribute(position, i + count);
    assert.ok(Math.abs(top.distanceTo(bottom) - 0.048) < 0.00001);
    assert.ok(uv.getX(i) >= 0 && uv.getX(i) <= 1);
    assert.ok(uv.getY(i) >= 0 && uv.getY(i) <= 1);
    if (uv.getY(i) === 1) assert.ok(Math.abs(top.z + 1.42) < 0.001, "Artwork top faces the pillow");
  }
  const edges = new Map();
  const indices = duvet.geometry.index.array;
  for (let i = 0; i < indices.length; i += 3) {
    for (const [a, b] of [[indices[i], indices[i + 1]], [indices[i + 1], indices[i + 2]], [indices[i + 2], indices[i]]]) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edges.set(key, (edges.get(key) || 0) + 1);
    }
  }
  assert.ok([...edges.values()].every((count) => count === 2), "Every edge belongs to two faces");
  assert.equal(duvet.geometry.groups.reduce((sum, group) => sum + group.count, 0), indices.length);
});

test("hanging duvet stays outside the wooden frame and above the floor", () => {
  const { bedding } = createBedding();
  const duvet = bedding.getObjectByName("Acolchado Monkey Island");
  const positions = duvet.geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    assert.ok(Number.isFinite(x + y + z));
    assert.ok(y > 0.08, "Cloth must not reach the floor");
    assert.ok(x < 1.6, "Cloth must stay inside the room wall");
    const insideFrame = Math.abs(x) < 1.3 && Math.abs(z) < 2.2 && y < 0.68;
    assert.ok(!insideFrame, `Cloth intersects frame at ${x}, ${y}, ${z}`);
  }
  assert.ok(duvet.geometry.boundingBox.min.y < 0.6, "Duvet drapes over the foot of the bed");
  assert.ok(duvet.geometry.boundingBox.max.y > 1.14, "Filling must have visible loft");
});

test("fabric is matte, printing uses sRGB, and shared source textures are unchanged", () => {
  const { bedding, printMap, clothMap } = createBedding();
  const duvet = bedding.getObjectByName("Acolchado Monkey Island");
  const [print, reverse] = duvet.material;
  assert.equal(print.map.colorSpace, THREE.SRGBColorSpace);
  assert.equal(print.map.wrapS, THREE.ClampToEdgeWrapping);
  assert.equal(print.map.wrapT, THREE.ClampToEdgeWrapping);
  assert.equal(print.map.source, printMap.source);
  assert.equal(print.bumpMap.colorSpace, THREE.NoColorSpace);
  assert.ok(print.roughness >= 0.9 && print.metalness === 0);
  assert.equal(print.emissive.getHex(), 0);
  assert.equal(reverse.map, null);
  assert.equal(clothMap.colorSpace, THREE.SRGBColorSpace);
  assert.deepEqual(clothMap.repeat.toArray(), [1, 1]);
  assert.equal(printMap.colorSpace, THREE.NoColorSpace);
});

test("pillow has smoothed indexed geometry and quilting remains paired line segments", () => {
  const { bedding } = createBedding();
  const pillow = bedding.getObjectByName("Funda de algodon");
  assert.ok(pillow.geometry.index);
  pillow.geometry.computeBoundingBox();
  assert.ok(pillow.geometry.boundingBox.max.y > 0.21);
  const normals = pillow.geometry.attributes.normal;
  for (const value of normals.array) assert.ok(Number.isFinite(value));
  const stitches = bedding.getObjectByName("Puntadas del acolchado");
  assert.equal(stitches.geometry.attributes.position.count % 2, 0);
  assert.ok(bedding.getObjectByName("Costura de la almohada"));
  assert.ok(bedding.getObjectByName("Ribete del acolchado"));
});
