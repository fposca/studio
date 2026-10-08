import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { DRAGON_BREATHING_CLIP, DRAGON_FLYING_CLIP } from "./dragonAnimation.js";
import { ensureDragonFire, updateDragonFire } from "./dragonFire.js";

function makeDragon() {
  const model = new THREE.Group();
  model.userData.bundledModel = "dragon-flying";
  model.userData.modelAnimation = { clip: DRAGON_FLYING_CLIP, playing: true, speed: 1 };
  model.userData.dragonFlight = { elapsed: 1 };
  const neck = new THREE.Bone();
  neck.name = "Bone_029";
  neck.position.set(0, 1, 0);
  const mouth = new THREE.Bone();
  mouth.name = "Bone_024";
  mouth.position.set(0, 0.5, 1);
  model.add(neck, mouth);
  return model;
}

test("flying dragon breathes fire from its moving mouth", () => {
  const model = makeDragon();
  const fire = ensureDragonFire(model);
  assert.equal(ensureDragonFire(model), fire);
  assert.equal(fire.visible, false);
  updateDragonFire(model, 0.1);
  assert.equal(fire.visible, true);
  assert.ok(fire.getObjectByName("DragonFireLight").intensity > 0);
  assert.ok(fire.getObjectByName("DragonFireParticles").material.uniforms.uStrength.value > 0);
  const firstPosition = fire.position.clone();
  model.getObjectByName("Bone_024").position.z += 0.5;
  updateDragonFire(model, 0.1);
  assert.ok(fire.position.z > firstPosition.z + 0.4);
  assert.ok(fire.quaternion.angleTo(new THREE.Quaternion()) > 0.1);
});

test("fire stops between bursts, when paused and in breathing mode", () => {
  const model = makeDragon();
  updateDragonFire(model, 0.1);
  const fire = ensureDragonFire(model);
  model.userData.dragonFlight.elapsed = 3;
  updateDragonFire(model, 0.1);
  assert.equal(fire.visible, false);
  model.userData.dragonFlight.elapsed = 1;
  updateDragonFire(model, 0);
  assert.equal(fire.visible, false);
  model.userData.modelAnimation.clip = DRAGON_BREATHING_CLIP;
  updateDragonFire(model, 0.1);
  assert.equal(fire.visible, false);
  assert.equal(fire.getObjectByName("DragonFireLight").intensity, 0);
});

test("fire survives scene serialization without duplicating the effect", () => {
  const model = makeDragon();
  updateDragonFire(model, 0.1);
  const restored = new THREE.ObjectLoader().parse(model.toJSON());
  const fire = restored.getObjectByName("DragonFire");
  assert.ok(fire);
  assert.equal(ensureDragonFire(restored), fire);
  updateDragonFire(restored, 0.1);
  assert.equal(fire.visible, true);
  assert.equal(fire.getObjectByName("DragonFirePlume").children.length, 3);
  assert.equal(restored.getObjectsByProperty("name", "DragonFire").length, 1);
});
