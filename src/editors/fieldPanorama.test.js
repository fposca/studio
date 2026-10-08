import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { configureFieldPanoramaTexture, createFieldPanorama } from "./fieldPanorama.js";

test("field keeps the original bitmap and samples it without lower resolution mip levels", () => {
  const image = { width: 2172, height: 724 };
  const texture = new THREE.Texture(image);
  texture.repeat.set(2, 1);
  const version = texture.version;
  assert.equal(configureFieldPanoramaTexture(texture, 8), texture);
  assert.equal(texture.image, image);
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
  assert.equal(texture.mapping, THREE.EquirectangularReflectionMapping);
  assert.equal(texture.generateMipmaps, false);
  assert.equal(texture.minFilter, THREE.LinearFilter);
  assert.equal(texture.anisotropy, 8);
  assert.deepEqual(texture.repeat.toArray(), [1, 1]);
  assert.ok(texture.version > version);
  texture.dispose();
});

test("field is a direct photographic backdrop and can be cleared when changing scenes", () => {
  const field = createFieldPanorama();
  const texture = new THREE.Texture({ width: 2172, height: 724 });
  assert.equal(field.visible, false);
  field.userData.setTexture(texture);
  assert.equal(field.visible, true);
  assert.equal(field.material.uniforms.panorama.value, texture);
  assert.deepEqual(field.material.uniforms.panoramaTexelSize.value.toArray(), [1 / 2172, 1 / 724]);
  assert.equal(field.material.toneMapped, false);
  assert.equal(field.material.fog, false);
  assert.equal(field.material.uniforms.detailStrength.value, 0);
  assert.equal(field.material.depthWrite, false);
  field.userData.setTexture(null);
  assert.equal(field.visible, false);
  assert.equal(field.material.uniforms.panorama.value, null);
  field.userData.dispose();
  texture.dispose();
});

test("director camera motion keeps the sky centered and respects saved background rotation", () => {
  const field = createFieldPanorama();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
  scene.backgroundRotation.set(0.08, 0.7, 0);
  for (const position of [[0, 4, 20], [12, 7, 4], [-9, 2, -10]]) {
    camera.position.set(...position);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld(true);
    field.onBeforeRender(null, scene, camera);
    const expected = new THREE.Matrix4().makeRotationFromEuler(scene.backgroundRotation).setPosition(camera.position);
    assert.ok(field.matrixWorld.equals(expected));
  }
  field.userData.dispose();
});

test("disposing the field backdrop leaves texture ownership with the scene", () => {
  const field = createFieldPanorama();
  const texture = new THREE.Texture();
  let geometryDisposed = 0, materialDisposed = 0, textureDisposed = 0;
  field.geometry.addEventListener("dispose", () => geometryDisposed++);
  field.material.addEventListener("dispose", () => materialDisposed++);
  texture.addEventListener("dispose", () => textureDisposed++);
  field.userData.setTexture(texture);
  field.userData.dispose();
  assert.equal(geometryDisposed, 1);
  assert.equal(materialDisposed, 1);
  assert.equal(textureDisposed, 0);
  texture.dispose();
});
