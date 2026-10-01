import assert from "node:assert/strict";
import test from "node:test";
import {
  createApocalypseFires, DEFAULT_APOCALYPSE_FIRES, MAX_APOCALYPSE_FIRES,
  normalizeApocalypseFires
} from "../src/editors/apocalypseFires.js";

test("fire settings preserve focus positions and clamp unsafe values", () => {
  const settings = normalizeApocalypseFires({
    enabled: true, count: 40, smokeDensity: -1, smokeSpeed: 99,
    smokeColor: "bad", positions: [{ x: 100, z: -90 }]
  });
  assert.equal(settings.count, MAX_APOCALYPSE_FIRES);
  assert.equal(settings.smokeDensity, 0);
  assert.equal(settings.smokeSpeed, 2.5);
  assert.equal(settings.smokeColor, DEFAULT_APOCALYPSE_FIRES.smokeColor);
  assert.deepEqual(settings.positions[0], { x: 60, z: -60 });
  assert.equal(settings.positions.length, MAX_APOCALYPSE_FIRES);
  assert.deepEqual(normalizeApocalypseFires(settings), settings);
});

test("fires emit smoke and light from each focus and stop outside the scene", () => {
  const system = createApocalypseFires();
  const smoke = system.getObjectByName("Columnas de humo irregular");
  const flames = system.getObjectByName("Llamas de incendios");
  const settings = normalizeApocalypseFires({
    ...DEFAULT_APOCALYPSE_FIRES, enabled: true, count: 3,
    positions: [{ x: -9, z: 5 }, { x: 8, z: -7 }, { x: 14, z: 4 }]
  });
  try {
    system.userData.animate(settings, 2000, true);
    assert.equal(system.visible, true);
    assert.equal(smoke.geometry.instanceCount, 6);
    assert.equal(flames.geometry.instanceCount, 36);
    assert.equal(system.children[4].position.x, 14);
    assert.ok(system.children[4].intensity > 0);
    assert.equal(system.children[5].visible, false);
    assert.equal(smoke.material.uniforms.smokeTime.value, 2);
    assert.equal(flames.material.uniforms.fireTime.value, 2);
    system.userData.animate({ ...settings, smokeDensity: 0 }, 2000, true);
    assert.equal(smoke.visible, false);
    assert.equal(flames.visible, true);
    system.userData.animate(settings, 2000, false);
    assert.equal(system.visible, false);
    system.userData.animate({ ...settings, enabled: false }, 2000, true);
    assert.equal(system.visible, false);
    system.userData.animate({ ...settings, count: 0 }, 2000, true);
    assert.equal(system.visible, false);
    let disposed = 0;
    for (const mesh of [smoke, flames]) for (const resource of [mesh.geometry, mesh.material]) {
      resource.addEventListener("dispose", () => disposed++);
    }
    system.userData.dispose();
    assert.equal(disposed, 4);
  } finally { system.removeFromParent(); }
});
