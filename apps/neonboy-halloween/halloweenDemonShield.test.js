import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenDemonShield } from "./halloweenDemonShield.js";

function fixture() {
  const scene = new THREE.Scene(), actor = new THREE.Group();
  scene.add(actor);
  const shield = createHalloweenDemonShield(scene, actor);
  const hit = new THREE.Vector3(0, 1.2, 1.1);
  return { shield, actor, hit };
}

test("the field is invisible until contact, follows its actor, fades and can reactivate", () => {
  const { shield, actor, hit } = fixture();
  assert.equal(shield.mesh.visible, false);
  assert.equal(shield.flash(hit), true);
  assert.equal(shield.mesh.visible, true);
  const initial = shield.mesh.material.uniforms.uStrength.value;
  actor.position.set(2, 0, 3);
  shield.update(.25);
  assert.equal(shield.mesh.position.x, 2);
  assert.equal(shield.mesh.position.z, 3);
  assert.ok(shield.mesh.material.uniforms.uStrength.value < initial);
  shield.update(.6);
  assert.equal(shield.mesh.visible, false);
  assert.equal(shield.flash(hit), true);
  assert.equal(shield.mesh.visible, true);
});

test("Matrix immediately cancels the visible shield and prevents new pulses", () => {
  const { shield, hit } = fixture();
  shield.flash(hit);
  shield.setDisabled(true);
  assert.equal(shield.mesh.visible, false);
  assert.equal(shield.flash(hit), false);
  shield.update(.1);
  assert.equal(shield.mesh.visible, false);
  shield.setDisabled(false);
  assert.equal(shield.mesh.visible, false, "switching back must not reveal the shield without a hit");
  assert.equal(shield.flash(hit), true);
});

test("reduced flashing keeps a softer, localized reaction", () => {
  const { shield, hit } = fixture();
  shield.flash(hit);
  shield.update(.1);
  const normal = shield.mesh.material.uniforms.uStrength.value;
  shield.flash(hit);
  shield.update(.1, true);
  assert.ok(shield.mesh.material.uniforms.uStrength.value < normal * .5);
});
