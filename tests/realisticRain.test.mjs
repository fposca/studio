import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createRealisticRain, DEFAULT_RAIN, normalizeRain } from "../src/editors/realisticRain.js";
import { createRainSurfaceSampler } from "../src/editors/rainSurface.js";

test("legacy rain settings keep their color, intensity and wind", () => {
  const saved = { enabled: true, intensity: 1.45, directionX: -0.4, directionZ: 0.3, color: "#78ff32" };
  assert.deepEqual(normalizeRain(saved), { ...DEFAULT_RAIN, ...saved });
  const invalid = normalizeRain({ intensity: 9, speed: -1, dropSize: Infinity, directionZ: NaN, color: "bad" });
  assert.equal(invalid.intensity, 1.8); assert.equal(invalid.speed, 0);
  assert.equal(invalid.dropSize, 1); assert.equal(invalid.directionZ, 0); assert.equal(invalid.color, DEFAULT_RAIN.color);
});

test("contacts use transformed stone geometry and the exposed bed in gaps", () => {
  const terrain = new THREE.Group(), geometry = new THREE.BoxGeometry(1, 0.2, 1);
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial(), 2);
  mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0.3, 0));
  const matrix = new THREE.Matrix4().makeRotationZ(0.2); matrix.setPosition(2, 0.2, 0);
  mesh.setMatrixAt(1, matrix); terrain.add(mesh);
  const sampler = createRainSurfaceSampler(terrain, -0.19);
  try {
    assert.ok(Math.abs(sampler.sample(0, 0).height - 0.4) < 1e-6);
    assert.equal(sampler.sample(1, 0).height, -0.19);
    const tilted = sampler.sample(2, 0);
    assert.ok(tilted.height > 0.3 && tilted.height < 0.31);
    assert.ok(tilted.normal[0] < -0.19 && tilted.normal[1] > 0.97);
  } finally { sampler.dispose(); geometry.dispose(); mesh.material.dispose(); mesh.dispose(); }
});

test("rain is deterministic, pausable, scalable and impacts can be switched off", () => {
  const rain = createRealisticRain(), [drops, impacts] = rain.children;
  const settings = { ...DEFAULT_RAIN, enabled: true };
  try {
    rain.userData.animate(settings, 4000);
    assert.equal(rain.visible, true); assert.equal(drops.geometry.instanceCount, 3200);
    const initial = drops.geometry.attributes.rainSeed.array.slice();
    const groundVersion = drops.geometry.attributes.rainGround.version;
    rain.userData.animate(settings, 4000);
    assert.equal(drops.material.uniforms.rainTime.value, 4);
    assert.deepEqual(drops.geometry.attributes.rainSeed.array, initial);
    assert.equal(drops.geometry.attributes.rainGround.version, groundVersion);
    rain.userData.animate({ ...settings, speed: 0 }, 8000);
    assert.equal(drops.material.uniforms.rainTime.value, 0);
    rain.userData.animate(settings, 8000, 0.55);
    assert.equal(drops.geometry.instanceCount, 1760);
    for (const floor of [{ visible: false }, { surface: "infernal" }]) {
      rain.userData.animate(settings, 0, 1, floor); assert.equal(impacts.visible, false);
    }
    rain.userData.animate({ ...settings, splashes: false }, 0); assert.equal(impacts.visible, false);
    rain.userData.animate({ ...settings, splashIntensity: 0 }, 0); assert.equal(impacts.visible, false);
    rain.userData.animate({ ...settings, intensity: 0 }, 0); assert.equal(rain.visible, false);
    rain.userData.animate({ ...settings, enabled: false }, 0); assert.equal(rain.visible, false);
    let disposed = 0;
    for (const mesh of rain.children) for (const resource of [mesh.geometry, mesh.material]) resource.addEventListener("dispose", () => disposed++);
    rain.userData.dispose(); assert.equal(disposed, 4);
  } finally { rain.removeFromParent(); }
});
