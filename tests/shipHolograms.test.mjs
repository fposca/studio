import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createShipHolograms } from "../src/editors/shipHolograms.js";

test("hologram modes cycle independently and ignore unknown targets", () => {
  const holograms = createShipHolograms();
  holograms.userData.animate(0, true);
  assert.match(holograms.userData.activate("anatomy"), /estructura interna/);
  assert.deepEqual(holograms.userData.getState(), { anatomy: 1, orbit: 0, navigation: 0 });
  assert.match(holograms.userData.activate("anatomy"), /escaneo corporal/);
  assert.match(holograms.userData.activate("orbit"), /cartografia/);
  assert.equal(holograms.userData.activate("missing"), null);
  assert.deepEqual(holograms.userData.getState(), { anatomy: 0, orbit: 1, navigation: 0 });
  holograms.userData.dispose();
});

test("hidden holograms cannot be activated", () => {
  const holograms = createShipHolograms();
  holograms.userData.animate(2000, false);
  assert.equal(holograms.userData.activate("navigation"), null);
  assert.equal(holograms.userData.getState().navigation, 0);
  holograms.userData.animate(2000, true);
  assert.match(holograms.userData.activate("navigation"), /diagnostico/);
  holograms.userData.dispose();
});

test("animation is deterministic when the editor seeks to the same scene time", () => {
  const holograms = createShipHolograms();
  const snapshot = (time) => {
    holograms.userData.animate(time, true);
    holograms.updateMatrixWorld(true);
    const values = [];
    holograms.traverse((object) => values.push([...object.matrixWorld.elements, object.visible]));
    return values;
  };
  const before = snapshot(6400);
  assert.notDeepEqual(snapshot(2200), before);
  assert.deepEqual(snapshot(6400), before);
  holograms.userData.dispose();
});

test("all three holograms expose pickable 3D targets", () => {
  const holograms = createShipHolograms();
  holograms.userData.animate(0, true);
  holograms.updateMatrixWorld(true);
  const ids = [];
  for (const target of holograms.userData.targets) {
    const position = target.getWorldPosition(new THREE.Vector3());
    const ray = new THREE.Raycaster(position.clone().add(new THREE.Vector3(0, 0, 8)), new THREE.Vector3(0, 0, -1));
    assert.ok(ray.intersectObject(target).length > 0);
    ids.push(target.userData.shipInteraction);
  }
  assert.deepEqual(ids.sort(), ["anatomy", "navigation", "orbit"]);
  holograms.userData.dispose();
});
