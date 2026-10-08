import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRetroGamerBookshelfContents } from "./retroGamerBookshelf.js";

function buildContents() {
  const previousDocument = globalThis.document;
  // Raster appearance is checked in the browser; these tests cover geometry and maps.
  const context = Object.fromEntries(["save", "restore", "translate", "rotate", "fillRect", "strokeRect", "fillText", "beginPath", "ellipse", "rect", "stroke", "arc", "fill"].map((name) => [name, () => {}]));
  context.createLinearGradient = () => ({ addColorStop() {} });
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  const clothMap = new THREE.Texture();
  const postersMap = new THREE.Texture();
  clothMap.colorSpace = THREE.SRGBColorSpace;
  postersMap.colorSpace = THREE.SRGBColorSpace;
  try {
    return { contents: createRetroGamerBookshelfContents({ clothMap, postersMap }), clothMap, postersMap };
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

test("shelf has individual books, game boxes and CD cases without intersecting the furniture", () => {
  const { contents } = buildContents();
  contents.updateMatrixWorld(true);
  const counts = {};
  const shelves = [[0.23, 1.13], [1.23, 2.15], [2.25, 3.17], [3.27, 4.33]];
  const epsilon = 0.00001;
  const bounds = contents.children.map((prop) => {
    counts[prop.userData.shelfProp] = (counts[prop.userData.shelfProp] || 0) + 1;
    const box = new THREE.Box3().setFromObject(prop);
    assert.ok(box.min.x >= -1.29 && box.max.x <= 1.29, `${prop.name}: shelf sides`);
    assert.ok(box.min.z > -0.4025 && box.max.z < 0.46, `${prop.name}: shelf depth`);
    assert.ok(shelves.some(([bottom, top]) => box.min.y >= bottom - epsilon && box.max.y <= top), `${prop.name}: shelf height`);
    return box;
  });
  assert.deepEqual(counts, { book: 22, game: 2, cd: 5 });
  for (let i = 0; i < bounds.length; i += 1) {
    for (let j = i + 1; j < bounds.length; j += 1) {
      assert.ok(!bounds[i].intersectsBox(bounds[j]), `${contents.children[i].name} intersects ${contents.children[j].name}`);
    }
  }
});

test("standing and stacked books rest on a shelf or on the book below", () => {
  const { contents } = buildContents();
  contents.updateMatrixWorld(true);
  const books = contents.children.filter((item) => item.userData.shelfProp === "book");
  assert.equal(books.filter((item) => Math.abs(item.rotation.z) > 1).length, 5);
  const bounds = books.map((item) => new THREE.Box3().setFromObject(item));
  for (const box of bounds) {
    const supported = [0.23, 1.23, 2.25].some((y) => Math.abs(box.min.y - y) < 0.00001)
      || bounds.some((below) => below !== box && Math.abs(box.min.y - below.max.y - 0.003) < 0.00001
        && below.max.x > box.min.x && below.min.x < box.max.x);
    assert.ok(supported, "Book must not float");
  }
});

test("print atlases are shared, mapped inside their cells and do not mutate input textures", () => {
  const { contents, clothMap, postersMap } = buildContents();
  const printSources = new Set();
  const maps = new Set();
  contents.traverse((object) => {
    const material = object.material;
    if (!material) return;
    if (material.bumpMap) assert.equal(material.bumpMap.colorSpace, THREE.NoColorSpace);
    if (material.map) {
      const map = material.map;
      maps.add(map);
      assert.equal(map.colorSpace, THREE.SRGBColorSpace);
      if (map.image?.height === 2048) {
        printSources.add(map.source);
        assert.ok(map.offset.x >= 0 && map.offset.x + map.repeat.x <= 1);
        assert.ok(map.offset.y >= 0 && map.offset.y + map.repeat.y <= 1);
      }
    }
  });
  assert.equal(printSources.size, 2);
  assert.ok(maps.size > 16);
  assert.equal(clothMap.colorSpace, THREE.SRGBColorSpace);
  assert.deepEqual(postersMap.repeat.toArray(), [1, 1]);
  assert.deepEqual(postersMap.offset.toArray(), [0, 0]);
});
