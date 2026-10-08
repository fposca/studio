import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { buildSpaceShipSet } from "./spaceShipInterior.js";

test("biomechanical ship hull has textured metal and an unobstructed stage", () => {
  const maps = { alloy: new THREE.Texture(), brushed: new THREE.Texture(), relief: new THREE.Texture() };
  const environment = new THREE.Texture();
  let environmentDisposed = false;
  environment.addEventListener("dispose", () => { environmentDisposed = true; });
  const ship = buildSpaceShipSet(maps, environment);
  ship.userData.animate(0, true);
  ship.updateMatrixWorld(true);
  const meshes = [], lights = [];
  ship.traverse((object) => {
    assert.ok(!/monitor|hologra|consola|proyector|computo|pantalla/i.test(object.name));
    assert.equal(object.userData.shipInteraction, undefined);
    if (object.isMesh) meshes.push(object);
    if (object.isLight) lights.push(object);
  });
  assert.ok(meshes.length <= 16, "repeated hull detail should stay batched");
  assert.equal(lights.filter((light) => light.isRectAreaLight).length, 5);
  const metal = meshes.filter((mesh) => mesh.material.metalness >= 0.8);
  assert.ok(metal.length >= 4);
  assert.ok(metal.every((mesh) => mesh.material.map?.isTexture && mesh.material.bumpMap?.isTexture));
  const deck = ship.getObjectByName("Nave / Cubierta de metal gastado").material;
  assert.equal(deck.envMap, environment);
  assert.ok(deck.envMapIntensity < 0.2, "deck reflections should not wash out the dark metal");
  const shadowCatcher = ship.getObjectByName("Sombras sobre cubierta");
  assert.ok(shadowCatcher?.receiveShadow && shadowCatcher.material.isShadowMaterial);
  assert.ok(shadowCatcher.position.y > 0.1 && shadowCatcher.position.y < 0.13);
  for (const mesh of meshes) {
    assert.ok(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite));
  }
  const ray = new THREE.Raycaster();
  for (const x of [-4, 0, 4]) for (const y of [1, 3, 5]) {
    ray.set(new THREE.Vector3(x, y, 18), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObjects(meshes, false)[0];
    assert.ok(hit, "the closed rear bulkhead must be visible");
    assert.ok(hit.distance > 35, "the camera-facing end and character area must remain open");
  }
  const bounds = new THREE.Box3().setFromObject(ship);
  assert.ok(bounds.min.x >= -13.51 && bounds.max.x <= 13.51);
  assert.ok(bounds.min.z >= -21.6 && bounds.max.z <= 11.1);
  assert.ok(bounds.max.y > 10 && bounds.max.y < 11.5);
  const resources = new Set(Object.values(maps));
  meshes.forEach((mesh) => { resources.add(mesh.geometry); resources.add(mesh.material); });
  let disposed = 0;
  resources.forEach((resource) => resource.addEventListener("dispose", () => disposed++));
  ship.userData.dispose();
  assert.equal(disposed, resources.size);
  ship.userData.dispose();
  assert.equal(disposed, resources.size, "cleanup must be idempotent");
  assert.equal(environmentDisposed, false, "the shared editor environment must stay alive");
  ship.userData.animate(1000, true);
  assert.equal(ship.visible, false);
});

test("ship practical lighting animates gently, freezes with scene time and hides outside the preset", () => {
  const ship = buildSpaceShipSet();
  const emission = ship.getObjectByName("Nave / Luz ambar 0").material;
  assert.equal(ship.visible, false);
  ship.userData.animate(1200, true);
  const first = emission.emissiveIntensity;
  ship.userData.animate(1200, true);
  assert.equal(emission.emissiveIntensity, first);
  ship.userData.animate(3700, true);
  assert.notEqual(emission.emissiveIntensity, first);
  assert.ok(emission.emissiveIntensity >= 1.9 && emission.emissiveIntensity <= 2.1);
  ship.userData.animate(3700, false);
  assert.equal(ship.visible, false);
  ship.userData.dispose();
});
