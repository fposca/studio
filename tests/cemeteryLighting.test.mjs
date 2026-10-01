import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createCemeteryLighting, normalizeCemeteryLighting } from "../src/editors/cemeteryLighting.js";

test("cemetery lighting clamps saved settings", () => {
  assert.deepEqual(normalizeCemeteryLighting({ enabled: 1, darkness: 5, moon: -1, rim: "1.4", color: "invalid" }), {
    enabled: true, darkness: 1, moon: 0, rim: 1.4, color: "#8aa9bf"
  });
});

test("eerie cemetery lighting restores scene lights after rendering and switching scenes", () => {
  const scene = new THREE.Scene();
  const ambient = new THREE.HemisphereLight(0xffffff, 0x333333, 0.72);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  const fill = new THREE.DirectionalLight(0xc1d8e8, 1);
  const moonLights = [new THREE.SpotLight(0xa8c4dd, 210), new THREE.SpotLight(0xa8c4dd, 155)];
  moonLights[1].target.position.set(16, 0, -20);
  const panorama = { material: { uniforms: { intensity: { value: 0.86 } } } };
  scene.environmentIntensity = 0.76;
  const controller = createCemeteryLighting(scene, { ambient, keyLight, fill, moonLights, panorama });
  try {
    controller.update({ enabled: true, darkness: 0.7, moon: 1.4, rim: 0.5, color: "#789abc" }, true);
    assert.equal(fill.color.getHexString(), "789abc");
    assert.equal(moonLights[0].intensity, 294);
    assert.equal(moonLights[1].intensity, 108.5);
    assert.deepEqual(moonLights[1].target.position.toArray(), [2, 1, -2]);
    scene.onBeforeRender();
    assert.ok(ambient.intensity < 0.72);
    assert.ok(keyLight.intensity < 1.9);
    assert.ok(scene.environmentIntensity < 0.76);
    assert.ok(panorama.material.uniforms.intensity.value < 0.86);
    scene.onAfterRender();
    assert.equal(ambient.intensity, 0.72);
    assert.equal(keyLight.intensity, 1.9);
    assert.equal(scene.environmentIntensity, 0.76);
    assert.equal(panorama.material.uniforms.intensity.value, 0.86);
    controller.update({ enabled: true }, false);
    assert.equal(fill.color.getHexString(), "c1d8e8");
    assert.equal(fill.intensity, 1);
    assert.equal(moonLights[0].intensity, 210);
    assert.equal(moonLights[1].intensity, 155);
    assert.deepEqual(moonLights[1].target.position.toArray(), [16, 0, -20]);
    scene.onBeforeRender();
    assert.equal(ambient.intensity, 0.72);
  } finally {
    controller.dispose();
  }
});
