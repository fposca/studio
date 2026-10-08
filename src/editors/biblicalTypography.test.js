import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import {
  animateBiblicalTypographyScene,
  biblicalCameraFraming,
  biblicalFrameAt,
  createBiblicalTypographyScene,
  DEFAULT_BIBLICAL_TYPOGRAPHY,
  disposeBiblicalTypographyScene,
  MAX_BIBLICAL_TEXTS,
  normalizeBiblicalTypography,
  splitBiblicalEmphasis,
  updateBiblicalTypographyScene
} from "./biblicalTypography.js";

test("biblical typography preserves edited verses and normalizes display settings", () => {
  const settings = normalizeBiblicalTypography({
    font: "modern",
    variant: "bold-italic",
    layout: "monumental",
    ink: "#aabbcc",
    accent: "invalid",
    speed: 3,
    verses: [{ text: "Nuevo texto", reference: "Prueba 1:2" }]
  });
  assert.equal(settings.verses.length, 1);
  assert.deepEqual(settings.verses[0], { text: "Nuevo texto", reference: "Prueba 1:2", emphasis: "" });
  assert.equal(normalizeBiblicalTypography().verses.length, 3);
  assert.equal(settings.font, "modern");
  assert.equal(settings.variant, "bold-italic");
  assert.equal(settings.layout, "monumental");
  assert.equal(settings.ink, "#aabbcc");
  assert.equal(settings.accent, DEFAULT_BIBLICAL_TYPOGRAPHY.accent);
  assert.equal(settings.speed, 1.8);
});

test("emphasis preserves the complete verse and supports edited accented words", () => {
  const parts = splitBiblicalEmphasis({ text: "El Se\u00f1or es mi pastor.", emphasis: "senor" });
  assert.deepEqual(parts, { before: "EL", hero: "SE\u00d1OR", after: "ES MI PASTOR." });
  const fallback = splitBiblicalEmphasis({ text: "Una esperanza permanece.", emphasis: "missing" });
  assert.equal([fallback.before, fallback.hero, fallback.after].join(" ").replace(/\s+([.,;])/g, "$1").trim(), "UNA ESPERANZA PERMANECE.");
  assert.deepEqual(splitBiblicalEmphasis({ text: "", emphasis: "" }), { before: "", hero: "", after: "" });
});

const loader = new FontLoader();
const fonts = Object.fromEntries([["droid-sans", "droid_sans_regular"], ["droid-sans-bold", "droid_sans_bold"], ["kalam", "kalam_regular"], ["kalam-bold", "kalam_bold"]].map(([id, file]) => [id, {
  font: loader.parse(JSON.parse(readFileSync(new URL("../assets/fonts/" + file + ".typeface.json", import.meta.url), "utf8")))
}]));

test("compositions are extruded geometry, stay in world space and release replaced resources", () => {
  const scene = createBiblicalTypographyScene(DEFAULT_BIBLICAL_TYPOGRAPHY, fonts);
  assert.deepEqual(scene.userData.verses.map((group) => group.userData.layout), ["editorial", "contemplative", "monumental"]);
  const group = scene.userData.verses[0];
  const hero = group.userData.parts.find((part) => part.mesh.userData.role === "emphasis").mesh;
  assert.equal(hero.geometry.type, "TextGeometry");
  assert.ok(hero.geometry.boundingBox.max.z - hero.geometry.boundingBox.min.z >= DEFAULT_BIBLICAL_TYPOGRAPHY.depth);
  assert.ok(hero.material.every((material) => !material.map));
  assert.equal(hero.castShadow, true);
  assert.ok(Array.from("\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00dc").every((character) => fonts["droid-sans-bold"].font.data.glyphs[character]));
  animateBiblicalTypographyScene(scene, 2);
  const firstPosition = hero.position.clone();
  const rotation = group.quaternion.clone();
  const camera = new THREE.PerspectiveCamera();
  camera.rotation.y = 1;
  animateBiblicalTypographyScene(scene, 2, camera);
  assert.ok(rotation.equals(group.quaternion));
  animateBiblicalTypographyScene(scene, 3);
  assert.ok(firstPosition.distanceTo(hero.position) > 0.001);
  let disposed = 0;
  hero.geometry.addEventListener("dispose", () => disposed++);
  animateBiblicalTypographyScene(scene, 0);
  scene.updateMatrixWorld(true);
  const before = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
  updateBiblicalTypographyScene(scene, { ...DEFAULT_BIBLICAL_TYPOGRAPHY, depth: 0.5 });
  animateBiblicalTypographyScene(scene, 0);
  scene.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
  assert.ok(before.distanceTo(after) < 0.3, "editing must not double-apply the animated parent transform");
  assert.equal(disposed, 1);
  disposeBiblicalTypographyScene(scene);
  assert.equal(scene.children.length, 0);
});

test("three verses cycle with a smooth transition and respect speed", () => {
  assert.deepEqual(biblicalFrameAt(0), { active: 0, next: 1, transition: 0 });
  assert.equal(biblicalFrameAt(8).active, 0);
  assert.ok(biblicalFrameAt(8.5).transition > 0);
  assert.equal(biblicalFrameAt(9).active, 1);
  assert.equal(biblicalFrameAt(18).active, 2);
  assert.equal(biblicalFrameAt(27).active, 0);
  assert.equal(biblicalFrameAt(4.5, 2).active, 1);
});

test("editable text lists survive saving and cycle through every entry", () => {
  const verses = Array.from({ length: 15 }, (_, index) => ({ text: "Texto " + index, reference: "Referencia " + index, emphasis: "TEXTO" }));
  const settings = normalizeBiblicalTypography({ verses, muralRows: 99, layout: "mural" });
  assert.equal(settings.verses.length, MAX_BIBLICAL_TEXTS);
  assert.equal(settings.muralRows, 8);
  assert.deepEqual(normalizeBiblicalTypography(JSON.parse(JSON.stringify(settings))), settings);
  assert.equal(biblicalFrameAt(99, 1, 12).active, 11);
  assert.equal(biblicalFrameAt(108, 1, 12).active, 0);
  assert.equal(biblicalFrameAt(8.8, 1, 1).transition, 0);
  assert.equal(normalizeBiblicalTypography({ verses: [] }).verses.length, 1);
});

test("camera framing fits the complete immersive wall on desktop and portrait canvases", () => {
  for (const aspect of [1.8, 1.35, 0.6]) {
    const framing = biblicalCameraFraming("immersive", aspect, 45);
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
    camera.position.fromArray(framing.position);
    camera.lookAt(new THREE.Vector3(...framing.target));
    camera.updateMatrixWorld();
    for (const x of [-13.5, 13.5]) for (const y of [0.7, 15.7]) {
      const projected = new THREE.Vector3(x, y, -6.2).project(camera);
      assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1);
    }
  }
});

test("murals show all texts together in real geometry and release resources when changing modes", () => {
  const settings = normalizeBiblicalTypography({ ...DEFAULT_BIBLICAL_TYPOGRAPHY, layout: "mural" });
  const scene = createBiblicalTypographyScene(settings, fonts);
  const mural = scene.userData.mural;
  assert.equal(mural.userData.tiles.length, 24);
  assert.equal(mural.visible, true);
  assert.ok(scene.userData.verses.every((group) => !group.visible));
  assert.deepEqual([...new Set(mural.userData.tiles.map(({ tile }) => tile.userData.verseIndex))].sort(), [0, 1, 2]);
  const textMeshes = [];
  mural.traverse((mesh) => { if (mesh.userData.role) textMeshes.push(mesh); });
  assert.ok(textMeshes.length >= 24);
  assert.ok(textMeshes.every((mesh) => mesh.geometry.boundingBox.max.z > mesh.geometry.boundingBox.min.z));
  assert.ok(textMeshes.every((mesh) => mesh.geometry.groups.length <= 2));
  assert.ok(new Set(textMeshes.map((mesh) => mesh.geometry)).size < textMeshes.length);
  for (const { tile } of mural.userData.tiles) {
    const boxes = tile.children.filter((mesh) => mesh.userData.role).map((mesh) => {
      mesh.updateMatrix();
      return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix);
    });
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        const overlapX = Math.min(boxes[a].max.x, boxes[b].max.x) - Math.max(boxes[a].min.x, boxes[b].min.x);
        const overlapY = Math.min(boxes[a].max.y, boxes[b].max.y) - Math.max(boxes[a].min.y, boxes[b].min.y);
        assert.ok(overlapX <= 0 || overlapY <= 0, "text blocks must not overlap within a mural cell");
      }
    }
  }
  const tile = mural.userData.tiles[0].tile;
  animateBiblicalTypographyScene(scene, 2);
  const firstPosition = tile.position.clone();
  animateBiblicalTypographyScene(scene, 4);
  assert.ok(firstPosition.distanceTo(tile.position) > 0.001);
  assert.ok(mural.userData.tiles.every(({ tile }) => tile.visible));
  let disposed = 0;
  textMeshes[0].geometry.addEventListener("dispose", () => disposed++);
  updateBiblicalTypographyScene(scene, { ...settings, layout: "immersive" });
  assert.equal(disposed, 1);
  assert.ok(scene.userData.mural.userData.tiles.some(({ tile }) => Math.abs(tile.rotation.y) > 0.3));
  updateBiblicalTypographyScene(scene, { ...settings, layout: "sequence", verses: settings.verses.slice(0, 1) });
  animateBiblicalTypographyScene(scene, 8.8);
  assert.equal(mural.children.length, 0);
  assert.equal(scene.userData.verses.length, 1);
  assert.equal(scene.userData.verses[0].visible, true);
  disposeBiblicalTypographyScene(scene);
});

test("immersive upgrades old projects to handwritten monochrome and packs unframed 3D phrases", () => {
  const settings = normalizeBiblicalTypography({ layout: "immersive", font: "condensed", ink: "#ff0000", accent: "#ffff00" });
  assert.equal(settings.font, "handwritten");
  assert.equal(settings.ink, "#ffffff");
  assert.equal(settings.accent, "#202020");
  assert.ok(Array.from("\u00c1\u00c9\u00cd\u00d3\u00da\u00d1\u00dc\u00bf\u00a1").every((character) => fonts.kalam.font.data.glyphs[character]));
  const scene = createBiblicalTypographyScene(settings, fonts);
  const mural = scene.userData.mural;
  assert.equal(mural.userData.tiles.length, settings.muralRows * 6);
  assert.ok(mural.userData.tiles.some(({ tile }) => Math.abs(tile.rotation.z) > 0.1));
  mural.traverse((mesh) => {
    if (!mesh.isMesh) return;
    assert.ok(mesh.userData.text, "no box, panel or closed border meshes");
    assert.ok(mesh.geometry.boundingBox.max.z > mesh.geometry.boundingBox.min.z);
    assert.equal(mesh.material[0].color.getHexString(), "ffffff");
    assert.equal(mesh.material[0].toneMapped, false);
    assert.ok(mesh.material.every((material) => !material.map));
  });
  const footprints = mural.userData.tiles.map(({ tile }) => tile.userData.footprint);
  for (let a = 0; a < footprints.length; a++) for (let b = a + 1; b < footprints.length; b++) {
    const first = footprints[a], second = footprints[b];
    assert.ok(Math.abs(first.x - second.x) >= first.halfW + second.halfW || Math.abs(first.y - second.y) >= first.halfH + second.halfH);
  }
  const firstMesh = mural.userData.tiles[0].tile.children[0];
  updateBiblicalTypographyScene(scene, { ...settings, lighting: "eerie", atmosphere: true });
  assert.equal(mural.userData.tiles[0].tile.children[0], firstMesh, "changing light must not rebuild text geometry");
  animateBiblicalTypographyScene(scene, 1);
  const light = scene.userData.rim.intensity;
  const position = mural.userData.tiles[0].tile.position.clone();
  animateBiblicalTypographyScene(scene, 1);
  assert.equal(scene.userData.rim.intensity, light);
  assert.ok(mural.userData.tiles[0].tile.position.equals(position), "paused scene time freezes all motion");
  animateBiblicalTypographyScene(scene, 3);
  assert.notEqual(scene.userData.rim.intensity, light);
  assert.equal(scene.userData.fog.enabled, true);
  assert.deepEqual(normalizeBiblicalTypography(JSON.parse(JSON.stringify(scene.userData.settings))), scene.userData.settings);
  updateBiblicalTypographyScene(scene, { ...settings, lighting: "normal", atmosphere: false });
  animateBiblicalTypographyScene(scene, 3);
  assert.equal(scene.userData.fill.intensity, 24);
  assert.equal(scene.userData.fog.enabled, false);
  disposeBiblicalTypographyScene(scene);
});

test("immersive includes every edited text and supports long verses and empty entries", () => {
  const verses = Array.from({ length: 12 }, (_, index) => ({ text: ("Texto editado " + index + " esperanza y fortaleza. ").repeat(8), emphasis: "esperanza", reference: "Referencia " + index }));
  const settings = normalizeBiblicalTypography({ layout: "immersive", muralRows: 3, verses });
  const scene = createBiblicalTypographyScene(settings, fonts);
  const indices = new Set(scene.userData.mural.userData.tiles.map(({ tile }) => tile.userData.verseIndex));
  assert.equal(indices.size, 12);
  assert.ok(scene.userData.mural.userData.tiles.every(({ tile }) => Number.isFinite(tile.position.y)));
  updateBiblicalTypographyScene(scene, { ...settings, verses: [{ text: "", emphasis: "", reference: "Salmos 23:1" }] });
  assert.ok(scene.userData.mural.userData.tiles.every(({ tile }) => Number.isFinite(tile.position.y)));
  updateBiblicalTypographyScene(scene, { ...settings, verses: [{ text: "", emphasis: "", reference: "" }] });
  assert.equal(scene.userData.mural.children.length, 0);
  disposeBiblicalTypographyScene(scene);
});

test("compact immersive fills the same footprint with visible ink, without overlaps or extra draw groups", () => {
  for (const muralRows of [3, 6, 8]) {
    const settings = normalizeBiblicalTypography({ layout: "immersive", muralRows });
    const scene = createBiblicalTypographyScene(settings, fonts);
    const mural = scene.userData.mural;
    assert.deepEqual(mural.position.toArray(), [0, 8.2, -10]);
    assert.equal(mural.userData.tiles.length, muralRows * 6);
    let inkArea = 0, occupiedArea = 0;
    for (const { tile } of mural.userData.tiles) {
      const footprint = tile.userData.footprint;
      occupiedArea += footprint.halfW * footprint.halfH * 4;
      const mesh = tile.children[0];
      assert.equal(tile.children.length, 1, "each phrase is batched into one mesh");
      assert.ok(mesh.geometry.groups.length <= 2);
      const bounds = mesh.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().makeRotationZ(tile.rotation.z));
      assert.ok(bounds.max.x <= footprint.halfW && bounds.min.x >= -footprint.halfW);
      assert.ok(bounds.max.y <= footprint.halfH && bounds.min.y >= -footprint.halfH);
      assert.ok(Math.abs(footprint.x) + footprint.halfW <= 14);
      assert.ok(Math.abs(footprint.y) + footprint.halfH <= 7.5);
      const { index, attributes, groups } = mesh.geometry;
      const p = attributes.position;
      for (const group of groups.filter((part) => part.materialIndex === 0)) {
        for (let triangle = group.start; triangle < group.start + group.count; triangle += 3) {
          const a = index ? index.getX(triangle) : triangle;
          const b = index ? index.getX(triangle + 1) : triangle + 1;
          const c = index ? index.getX(triangle + 2) : triangle + 2;
          const area = ((p.getX(b) - p.getX(a)) * (p.getY(c) - p.getY(a)) - (p.getY(b) - p.getY(a)) * (p.getX(c) - p.getX(a))) / 2;
          if (area > 0) inkArea += area;
        }
      }
    }
    assert.ok(occupiedArea / (28 * 15) > 0.97, "phrase regions must cover the original area");
    assert.ok(inkArea / (28 * 15) > 0.18, "measure actual letter faces, not just nominal region sizes: " + inkArea / 420);
    const positions = mural.userData.tiles.map(({ tile }) => tile.position.toArray());
    updateBiblicalTypographyScene(scene, { ...settings, depth: 0.4 });
    animateBiblicalTypographyScene(scene, 0);
    assert.deepEqual(mural.userData.tiles.map(({ tile }) => tile.position.toArray()), positions, "layout must be deterministic after edits");
    disposeBiblicalTypographyScene(scene);
  }
});
