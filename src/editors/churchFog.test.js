import assert from "node:assert/strict";
import test from "node:test";
import { CHURCH_FOG_BACKGROUNDS, createChurchFog, DEFAULT_CHURCH_FOG } from "./churchFog.js";

test("medieval village uses the church volumetric fog", () => {
  const sceneId = "sky-medieval-village";
  const fog = createChurchFog();
  const settings = { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.16 };

  assert.equal(CHURCH_FOG_BACKGROUNDS.has(sceneId), true);
  fog.userData.animate(settings, 0, CHURCH_FOG_BACKGROUNDS.has(sceneId), 1, true);
  assert.equal(fog.visible, true);
  assert.equal(fog.material.uniforms.fogDensity.value, 0.128);

  fog.userData.animate(settings, 0, false, 1, true);
  assert.equal(fog.visible, false);
  fog.userData.dispose();
});
