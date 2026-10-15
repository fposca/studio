import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHandGrip } from "./gameGrip.js";
import { createWeaponModel } from "./gameWeapons.js";

function fixture() {
  const model = new THREE.Group(), arm = new THREE.Bone(), hand = new THREE.Bone();
  hand.name = "RightHand";
  arm.add(hand); model.add(arm);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.015, 0.10, 0, 0.015, 0.10, 0, 0, 0.21, 0,
    -0.1, -0.2, 0, 0.1, -0.2, 0, 0, -0.1, 0
  ], 3));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute([
    1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ], 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(Array.from({ length: 24 }, (_, i) => i % 4 === 0 ? 1 : 0), 4));
  geometry.computeVertexNormals();
  const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshStandardMaterial());
  model.add(mesh); model.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton([arm, hand]));
  return { model, hand, mesh, geometry };
}

test("grip only curls distal hand vertices, preserves the source and restores it on disposal", () => {
  const { model, hand, mesh, geometry } = fixture();
  const source = geometry.attributes.position.array.slice();
  const grip = createHandGrip(model, hand);
  assert.notEqual(mesh.geometry, geometry);
  assert.deepEqual(geometry.attributes.position.array, source);
  const delta = mesh.geometry.morphAttributes.position[0].array;
  assert.ok(delta.every(Number.isFinite));
  assert.ok(mesh.geometry.morphAttributes.normal[0].array.every(Number.isFinite));
  assert.ok(delta[7] < 0 && delta[8] < 0, "fingers curl back toward the palm");
  assert.ok([...delta.slice(0, 6), ...delta.slice(9)].every((value) => value === 0), "palm and arm stay unchanged");
  grip.update(1); assert.equal(mesh.morphTargetInfluences[0], 1);
  grip.update(0); assert.equal(mesh.morphTargetInfluences[0], 0);
  let disposed = false;
  mesh.geometry.addEventListener("dispose", () => { disposed = true; });
  grip.dispose();
  assert.equal(disposed, true); assert.equal(mesh.geometry, geometry);
  assert.equal(grip.socket.parent, null);
  mesh.skeleton.dispose(); geometry.dispose(); mesh.material.dispose();
});

test("sword has one-handed proportions and a fixed transform relative to the palm", () => {
  const { model, hand, mesh, geometry } = fixture();
  const template = new THREE.Group();
  const source = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.9, 0.12), new THREE.MeshStandardMaterial());
  template.add(source);
  const sword = createWeaponModel("sword", template), grip = createHandGrip(model, hand);
  const size = new THREE.Box3().setFromObject(sword).getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.y - 1.14) < 0.001, `sword length ${size.y}`);
  assert.ok(sword.getObjectByProperty("isMesh", true).userData.sharedGameAsset);
  grip.socket.add(sword);
  const bladeDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(grip.socket.quaternion);
  assert.ok(bladeDirection.dot(new THREE.Vector3(-1, 0, 0)) > 0.999, "blade exits on the thumb side, not the little finger side");
  const origin = new THREE.Vector3(), local = new THREE.Vector3();
  for (const angle of [0, 0.5, 1.4, -2.2]) {
    hand.rotation.set(angle, angle * 0.3, -angle);
    model.updateMatrixWorld(true);
    sword.getWorldPosition(origin);
    hand.worldToLocal(local.copy(origin));
    assert.ok(local.distanceTo(grip.socket.position) < 1e-8);
    assert.equal(sword.parent.parent, hand);
  }
  grip.dispose(); mesh.skeleton.dispose(); geometry.dispose(); mesh.material.dispose();
  source.geometry.dispose(); source.material.dispose();
});

test("imported hammer and axe grow at least ten percent without changing their grip", () => {
  const template = new THREE.Group();
  const source = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.9, 0.12), new THREE.MeshStandardMaterial());
  template.add(source);
  for (const kind of ["hammer", "axe"]) {
    const weapon = createWeaponModel(kind, template);
    const bounds = new THREE.Box3().setFromObject(weapon);
    assert.ok(Math.abs(bounds.getSize(new THREE.Vector3()).y - 1.06) < 0.001);
    assert.ok(bounds.min.y < -0.24 && bounds.min.y > -0.25, `${kind} grip offset ${bounds.min.y}`);
    assert.ok(weapon.getObjectByProperty("isMesh", true).userData.sharedGameAsset);
  }
  source.geometry.dispose(); source.material.dispose();
});
