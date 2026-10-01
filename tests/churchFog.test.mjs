import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { CHURCH_FOG_BACKGROUNDS, DEFAULT_CHURCH_FOG, createChurchFog, normalizeChurchFog } from "../src/editors/churchFog.js";

test("old fog settings retain their color and density and acquire volume controls", () => {
  const saved = { enabled: true, intensity: 0.12, color: "#354151" };
  assert.deepEqual(normalizeChurchFog(saved), { ...DEFAULT_CHURCH_FOG, ...saved });
  assert.deepEqual(saved, { enabled: true, intensity: 0.12, color: "#354151" });
  assert.ok(CHURCH_FOG_BACKGROUNDS.has("sky-ruined-gothic-church"));
  assert.ok(CHURCH_FOG_BACKGROUNDS.has("sky-gothic-church"));
  assert.ok(CHURCH_FOG_BACKGROUNDS.has("sky-cemetery"));
  assert.ok(CHURCH_FOG_BACKGROUNDS.has("sky-night-swamp"));
  assert.ok(CHURCH_FOG_BACKGROUNDS.has("sky-medieval-apocalypse"));
  assert.ok(!CHURCH_FOG_BACKGROUNDS.has("sky-infernal"));
});

test("invalid settings fall back and slider limits are enforced", () => {
  const settings = normalizeChurchFog({ height: Infinity, intensity: 3, coverage: -20,
    windSpeed: -5, windDirection: 1000, turbulence: "bad", color: "red" });
  assert.equal(settings.height, 3.8);
  assert.equal(settings.intensity, 1);
  assert.equal(settings.coverage, 8);
  assert.equal(settings.windSpeed, 0);
  assert.equal(settings.windDirection, 360);
  assert.equal(settings.turbulence, 0.6);
  assert.equal(settings.color, DEFAULT_CHURCH_FOG.color);
  assert.equal(normalizeChurchFog({ height: "6.5" }).height, 6.5);
});

test("volume is lazy, scoped, switchable and hidden for transparent floor output", () => {
  const fog = createChurchFog(), uniforms = fog.material.uniforms;
  const config = { ...DEFAULT_CHURCH_FOG, enabled: true };
  try {
    assert.equal(uniforms.fogNoise.value, null);
    fog.userData.animate(config, 0, false);
    assert.equal(fog.visible, false);
    assert.equal(uniforms.fogNoise.value, null);
    fog.userData.animate(config, 0, true);
    assert.equal(fog.visible, true);
    const texture = uniforms.fogNoise.value;
    assert.equal(texture.isData3DTexture, true);
    assert.equal(texture.image.data.length, 64 ** 3);
    fog.userData.animate(config, 0, true, 0.35);
    assert.equal(fog.geometry.instanceCount, 48);
    assert.equal(uniforms.fogNoise.value, texture);
    for (const [settings, scope, floor] of [[config, false, true], [config, true, false],
      [{ ...config, intensity: 0 }, true, true], [{ ...config, enabled: false }, true, true]]) {
      fog.userData.animate(settings, 0, scope, 1, floor);
      assert.equal(fog.visible, false);
    }
    let disposed = 0;
    for (const resource of [texture, fog.geometry, fog.material]) resource.addEventListener("dispose", () => disposed++);
    fog.userData.dispose();
    assert.equal(disposed, 3);
  } finally { fog.removeFromParent(); }
});

test("wind uses the scene clock, supports direction, zero speed and disabled motion", () => {
  const fog = createChurchFog(), uniforms = fog.material.uniforms;
  const config = { ...DEFAULT_CHURCH_FOG, enabled: true, windSpeed: 1, windDirection: 0 };
  try {
    fog.userData.animate(config, 5000, true);
    assert.deepEqual(uniforms.fogWind.value.toArray(), [5, 0, 0]);
    fog.userData.animate(config, 5000, true);
    assert.deepEqual(uniforms.fogWind.value.toArray(), [5, 0, 0]);
    fog.userData.animate({ ...config, windDirection: 90 }, 5000, true);
    assert.ok(Math.abs(uniforms.fogWind.value.x) < 1e-10);
    assert.equal(uniforms.fogWind.value.z, 5);
    for (const patch of [{ windSpeed: 0 }, { windEnabled: false }]) {
      fog.userData.animate({ ...config, ...patch }, 5000, true);
      assert.equal(uniforms.fogWind.value.length(), 0);
      assert.equal(uniforms.fogTime.value, 0);
    }
    const camera = new THREE.PerspectiveCamera(45, 1.5, 0.05, 500);
    camera.position.set(8, 5, 12); camera.lookAt(0, 1, 0); camera.updateMatrixWorld();
    fog.onBeforeRender(null, null, camera);
    assert.ok(uniforms.fogNear.value >= camera.near);
    assert.ok(uniforms.fogFar.value <= camera.far);
    assert.ok(uniforms.fogFar.value > uniforms.fogNear.value);
    assert.deepEqual(uniforms.fogCamera.value.toArray(), camera.position.toArray());
  } finally { fog.userData.dispose(); }
});
