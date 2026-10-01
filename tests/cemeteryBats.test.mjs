import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createCemeteryBats } from "../src/editors/cemeteryBats.js";

test("cemetery bats fly back and forth above the actors and respect reduced quality", () => {
  const group = createCemeteryBats();
  const mesh = group.getObjectByName("Bandada de murcielagos");
  const camera = new THREE.PerspectiveCamera(50, 1.6, 0.05, 300);
  camera.position.set(0, 3, 15);
  camera.lookAt(0, 2, -20);
  camera.updateMatrixWorld();
  const matrix = new THREE.Matrix4();
  const sample = (time, index = 0) => {
    group.userData.animate(time, camera);
    mesh.getMatrixAt(index, matrix);
    return new THREE.Vector3().setFromMatrixPosition(matrix);
  };
  try {
    assert.equal(group.visible, false);
    assert.equal(group.userData.count, 18);
    assert.equal(mesh.count, 18);
    assert.ok(mesh.material.color.r < 0.01, 'Bats should read as dark silhouettes against the sky');
    assert.ok(mesh.material.color.g < 0.01);
    const positions = Array.from({ length: 41 }, (_, index) => sample(index * 500));
    const velocities = positions.slice(1).map((position, index) => position.x - positions[index].x);
    assert.ok(velocities.some((speed) => speed > 0.05));
    assert.ok(velocities.some((speed) => speed < -0.05));
    assert.ok(Math.max(...positions.map((position) => position.x)) - Math.min(...positions.map((position) => position.x)) > 3);
    for (let index = 0; index < 18; index += 1) {
      const position = sample(3500, index);
      assert.ok(position.y > 3);
      assert.ok(position.z < -10);
    }
    group.userData.animate(5000, camera, true);
    assert.equal(mesh.count, 12);
    group.userData.animate(5500, camera, false);
    assert.equal(mesh.count, 18);
    assert.equal(mesh.geometry.getAttribute("aFlapPhase").count, 18);
    assert.equal(mesh.geometry.getAttribute("aFlapSpeed").count, 18);
  } finally {
    group.userData.dispose();
  }
});

test("wing shader follows scene time and keeps the body anchored", () => {
  const group = createCemeteryBats();
  const material = group.getObjectByName("Bandada de murcielagos").material;
  const program = { uniforms: {}, vertexShader: "#include <common>\n#include <begin_vertex>" };
  try {
    material.onBeforeCompile(program);
    assert.match(program.vertexShader, /aFlapPhase/);
    assert.match(program.vertexShader, /aFlapSpeed/);
    assert.match(program.vertexShader, /span \* span \* flap/);
    assert.equal(program.uniforms.uBatTime.value, 0);
    const camera = new THREE.PerspectiveCamera();
    group.userData.animate(2500, camera);
    assert.equal(program.uniforms.uBatTime.value, 2.5);
  } finally {
    group.userData.dispose();
  }
});
