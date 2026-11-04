import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { snapshotCanvasTexture, createHalloweenTextureCache } from "./halloweenTextures.js";
import { createHalloweenCodeVision } from "./halloweenCodeVision.js";

function artwork() {
  const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 128]);
  const texture = new THREE.CanvasTexture({ width: 2, height: 2, getContext: () => ({ getImageData: () => ({ data: pixels }) }) });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4.5, 6.25);
  return { texture, pixels };
}

test("procedural artwork keeps its pixels, orientation and tiling after the canvas is cleared", () => {
  const { texture, pixels } = artwork();
  const snapshot = snapshotCanvasTexture(texture);
  assert.deepEqual([...snapshot.image.data], [...pixels.slice(8), ...pixels.slice(0, 8)]);
  assert.equal(snapshot.flipY, false);
  assert.equal(snapshot.colorSpace, texture.colorSpace);
  assert.equal(snapshot.wrapS, THREE.RepeatWrapping);
  assert.deepEqual(snapshot.repeat.toArray(), [4.5, 6.25]);
  assert.equal(snapshot.minFilter, texture.minFilter);
  assert.equal(snapshot.generateMipmaps, true);
  pixels.fill(0);
  assert.equal(snapshot.image.data[2], 255);
});

test("floor map and bump map share a persistent texture that can be reuploaded", () => {
  const { texture } = artwork();
  const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture });
  const root = new THREE.Mesh(new THREE.PlaneGeometry(), material);
  const cache = createHalloweenTextureCache();
  cache.prepare(root);
  assert.equal(material.map, material.bumpMap);
  assert.ok(material.map.isDataTexture);
  const first = material.map;
  cache.prepare(root);
  assert.equal(material.map, first);
  const version = first.version;
  cache.restore();
  assert.ok(first.version > version);
  cache.dispose();
});

test("repeated vision toggles restore exact original materials, textures, fog and background", () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120d18);
  scene.fog = new THREE.Fog(0x211824, 20, 48);
  const originalFog = scene.fog, originalBackground = scene.background;
  const original = new THREE.MeshStandardMaterial({ color: 0x70556d, map: artwork().texture });
  const sign = new THREE.MeshBasicMaterial({ map: artwork().texture, toneMapped: false });
  const materials = [original, sign];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), materials);
  scene.add(mesh);
  const originalColor = original.color.clone(), originalCompile = original.onBeforeCompile;
  const effect = createHalloweenCodeVision(scene, { atlas: new THREE.DataTexture() });
  for (let i = 0; i < 5; i++) {
    effect.setActive(true);
    assert.notEqual(mesh.material, materials);
    assert.notEqual(mesh.material[0], original);
    assert.equal(mesh.material[0].map, original.map);
    assert.equal(original.onBeforeCompile, originalCompile);
    assert.ok(original.color.equals(originalColor));
    effect.update(.1, { x: 1, z: 2 });
    effect.setActive(false);
    assert.equal(mesh.material, materials);
    assert.equal(scene.fog, originalFog);
    assert.equal(scene.background, originalBackground);
  }
  effect.dispose();
});

test("characters loaded during code vision also restore their own material", () => {
  const scene = new THREE.Scene();
  const effect = createHalloweenCodeVision(scene, { atlas: new THREE.DataTexture() });
  effect.setActive(true);
  const original = new THREE.MeshStandardMaterial({ color: 0x181828 });
  const actor = new THREE.SkinnedMesh(new THREE.BoxGeometry(), original);
  scene.add(actor);
  effect.register();
  assert.notEqual(actor.material, original);
  effect.setActive(false);
  assert.equal(actor.material, original);
  effect.dispose();
});

test("NeonBoy's code profile stays isolated from shared scenery materials across late loads and toggles", () => {
  const scene = new THREE.Scene();
  const original = new THREE.MeshStandardMaterial({ color: 0x181828 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(), original);
  const player = new THREE.SkinnedMesh(new THREE.BoxGeometry(), original);
  scene.add(wall, player);
  const effect = createHalloweenCodeVision(scene, { atlas: new THREE.DataTexture() });
  effect.setActive(true);
  const worldMaterial = wall.material;
  effect.register(player, { profile: "player" });
  const playerMaterial = player.material;
  assert.notEqual(playerMaterial, worldMaterial);
  assert.notEqual(playerMaterial.customProgramCacheKey(), worldMaterial.customProgramCacheKey());
  assert.equal(original.defines?.HALLOWEEN_PLAYER_CODE, undefined);
  let playerDisposals = 0, worldDisposals = 0;
  playerMaterial.addEventListener("dispose", () => playerDisposals++);
  worldMaterial.addEventListener("dispose", () => worldDisposals++);
  for (let i = 0; i < 3; i++) {
    effect.register(scene);
    effect.setActive(false);
    assert.equal(player.material, original);
    assert.equal(wall.material, original);
    effect.setActive(true);
    assert.equal(player.material, playerMaterial);
    assert.equal(wall.material, worldMaterial);
  }
  effect.dispose();
  assert.equal(player.material, original);
  assert.equal(wall.material, original);
  assert.equal(playerDisposals, 1);
  assert.equal(worldDisposals, 1);
});


test("demon code damage fades independently and resets when Matrix closes", () => {
  const scene = new THREE.Scene();
  const original = new THREE.MeshStandardMaterial();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(), original);
  const demon = new THREE.Mesh(new THREE.BoxGeometry(), original);
  const player = new THREE.Mesh(new THREE.BoxGeometry(), original);
  scene.add(wall, demon, player);
  const effect = createHalloweenCodeVision(scene, { atlas: new THREE.DataTexture() });
  effect.register(demon, { profile: "demon" });
  effect.register(player, { profile: "player" });
  effect.setActive(true);
  assert.equal(demon.material.defines.HALLOWEEN_DEMON_CODE, 1);
  assert.equal(wall.material.defines?.HALLOWEEN_DEMON_CODE, undefined);
  assert.equal(player.material.defines?.HALLOWEEN_DEMON_CODE, undefined);
  const shader = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
  demon.material.onBeforeCompile(shader);
  effect.hitDemon();
  effect.update(.1, { x: 0, z: 0 }, false, demon);
  assert.ok(shader.uniforms.halloweenDemonHit.value > .8);
  effect.update(1, { x: 0, z: 0 }, false, demon);
  assert.equal(shader.uniforms.halloweenDemonHit.value, 0);
  effect.hitDemon();
  effect.update(.1, { x: 0, z: 0 }, true, demon);
  assert.ok(shader.uniforms.halloweenDemonHit.value < .45);
  effect.setActive(false);
  assert.equal(shader.uniforms.halloweenDemonHit.value, 0);
  assert.equal(demon.material, original);
  effect.dispose();
});
