import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { normalizeMaskNeon, updateMaskNeon } from "../src/editors/maskNeon.js";

test("mask neon settings remain bounded", () => {
  const settings = normalizeMaskNeon({ neonEnabled: 1, neonIntensity: 8, neonRadius: -3 });
  assert.equal(settings.neonEnabled, true);
  assert.equal(settings.neonIntensity, 2);
  assert.equal(settings.neonRadius, 0.5);
});

test("mask halo follows the head and switches off without removing the face material", () => {
  const model = new THREE.Group();
  model.scale.setScalar(2.8);
  const head = new THREE.Bone();
  head.name = "mixamorigHead";
  head.position.y = 1.5;
  const face = new THREE.Bone();
  face.name = "headfront";
  face.position.z = 0.11;
  head.add(face);
  model.add(head);
  const camera = new THREE.PerspectiveCamera();
  const pulse = { enabled: true, neonEnabled: true, neonIntensity: 0.8, neonRadius: 3.5, color: "#ff176b" };
  updateMaskNeon(model, pulse, 0.7, camera);
  const group = model.getObjectByName("NeonMaskGlow");
  const light = group.getObjectByName("NeonMaskPulseLight");
  const halo = group.getObjectByName("Halo neon de mascara");
  try {
    assert.equal(group.parent, face);
    assert.equal(group.visible, true);
    assert.ok(light.intensity > 0);
    assert.equal(light.distance, 3.5);
    assert.equal(halo.material.uniforms.uColor.value.getHexString(), "ff176b");
    assert.ok(halo.material.uniforms.uOpacity.value > 0);
    face.rotation.y = 0.5;
    model.updateMatrixWorld(true);
    const moved = group.getWorldPosition(new THREE.Vector3());
    face.rotation.y = 0;
    model.updateMatrixWorld(true);
    assert.ok(moved.distanceTo(group.getWorldPosition(new THREE.Vector3())) > 0.01);
    updateMaskNeon(model, { ...pulse, neonEnabled: false }, 0, camera);
    assert.equal(group.visible, false);
    updateMaskNeon(model, { ...pulse, color: "#00d4ff" }, 0.5, camera);
    assert.equal(model.getObjectByName("NeonMaskGlow"), group);
    assert.equal(light.color.getHexString(), "00d4ff");
  } finally {
    halo.geometry.dispose();
    halo.material.dispose();
  }
});
