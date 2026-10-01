import assert from "node:assert/strict";
import test from "node:test";
import { createApocalypseLighting, DEFAULT_APOCALYPSE_LIGHTING } from "../src/editors/apocalypseLighting.js";

test("apocalypse lighting is scene-bound, adjustable and deterministic", () => {
  const lighting = createApocalypseLighting();
  const settings = { ...DEFAULT_APOCALYPSE_LIGHTING, enabled: true };
  assert.equal(lighting.visible, false);
  lighting.userData.animate(settings, 1000, true);
  assert.equal(lighting.visible, true);
  assert.equal(lighting.children.length, 3);
  const first = lighting.children[0].intensity;
  lighting.userData.animate(settings, 1000, true);
  assert.equal(lighting.children[0].intensity, first);
  lighting.userData.animate(settings, 1000, true, { enabled: true, count: 2 });
  assert.equal(lighting.children[0].visible, false);
  assert.ok(lighting.children[2].intensity > 0);
  lighting.userData.animate(settings, 1000, true, { enabled: false, count: 2 });
  assert.equal(lighting.children[0].visible, true);
  lighting.userData.animate({ ...settings, intensity: 1.2 }, 1000, true);
  assert.ok(lighting.children[0].intensity > first);
  lighting.userData.animate({ ...settings, enabled: false }, 1000, true);
  assert.equal(lighting.visible, false);
  lighting.userData.animate(settings, 1000, false);
  assert.equal(lighting.visible, false);
  lighting.userData.animate({ ...settings, intensity: 0 }, 1000, true);
  assert.equal(lighting.visible, false);
});
