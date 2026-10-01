import assert from "node:assert/strict";
import test from "node:test";
import { createRealisticStorm, DEFAULT_STORM, normalizeStorm } from "../src/editors/realisticStorm.js";

test("legacy storm settings gain stable high quality defaults", () => {
  const saved = { enabled: true, intensity: 0.8 };
  assert.deepEqual(normalizeStorm(saved), { ...DEFAULT_STORM, ...saved });
  const invalid = normalizeStorm({ intensity: 4, cloudDensity: -2, cloudSpeed: Infinity,
    windDirection: 900, lightningFrequency: NaN, branching: 8, flash: -1, lightningColor: "white" });
  assert.equal(invalid.intensity, 1);
  assert.equal(invalid.cloudDensity, 0);
  assert.equal(invalid.cloudSpeed, DEFAULT_STORM.cloudSpeed);
  assert.equal(invalid.windDirection, 360);
  assert.equal(invalid.lightningFrequency, DEFAULT_STORM.lightningFrequency);
  assert.equal(invalid.branching, 1);
  assert.equal(invalid.flash, 0);
  assert.equal(invalid.lightningColor, DEFAULT_STORM.lightningColor);
});

test("lightning is deterministic and can never remain visible after its pulse", () => {
  const storm = createRealisticStorm();
  const settings = { ...DEFAULT_STORM, enabled: true, lightningFrequency: 1 };
  const clouds = storm.getObjectByName("Nubes volumetricas de tormenta");
  const core = storm.getObjectByName("Nucleo de los rayos");
  const glow = storm.getObjectByName("Halo de los rayos");
  const light = storm.getObjectByName("Destello de tormenta");
  try {
    storm.userData.animate(settings, 40, 1);
    assert.ok(storm.visible && clouds.visible && core.visible && glow.visible && light.visible);
    assert.ok(core.count > 34 && core.count <= 120);
    const matrixVersion = core.instanceMatrix.version;
    const opacity = core.material.opacity;
    storm.userData.animate(settings, 40, 1);
    assert.equal(core.instanceMatrix.version, matrixVersion);
    assert.equal(core.material.opacity, opacity);
    storm.userData.animate(settings, 700, 1);
    assert.equal(core.visible, false);
    assert.equal(glow.visible, false);
    assert.equal(light.visible, false);
    assert.equal(light.intensity, 0);
    assert.equal(clouds.material.uniforms.lightningFlash.value, 0);
    storm.userData.animate({ ...settings, enabled: false }, 40, 1);
    assert.equal(storm.visible, false);
    assert.equal(core.visible, false);
  } finally { storm.userData.dispose(); }
});

test("cloud motion follows the scene clock and reduced quality trims branches", () => {
  const storm = createRealisticStorm();
  const config = { ...DEFAULT_STORM, enabled: true, branching: 1, cloudSpeed: 0.8, windDirection: 90 };
  const clouds = storm.getObjectByName("Nubes volumetricas de tormenta");
  const core = storm.getObjectByName("Nucleo de los rayos");
  try {
    storm.userData.animate(config, 1000, 1);
    assert.ok(Math.abs(clouds.material.uniforms.cloudDirection.value.x) < 1e-10);
    assert.equal(clouds.material.uniforms.cloudDirection.value.y, 1);
    assert.ok(Math.abs(clouds.material.uniforms.cloudTime.value - 0.0048) < 1e-12);
    const full = core.count;
    storm.userData.animate(config, 1000, 0.35);
    assert.ok(core.count < full);
    storm.userData.animate({ ...config, cloudSpeed: 0 }, 9000, 1);
    assert.equal(clouds.material.uniforms.cloudTime.value, 0);
  } finally { storm.userData.dispose(); }
});
