import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { normalizeConcertPose } from "./rockClubConcertPose.js";
import { createRockClubConcertPoseController } from "./rockClubConcertPoseController.js";

test("pose data accepts only known performers and bounded shoulder, arm, forearm and hand rotations", () => {
  const pose = normalizeConcertPose({
    neonboy: { LeftShoulder: [190, -190, 12], RightHand: [0, 45, 0], Hips: [3, 0, 0] },
    stranger: { LeftArm: [20, 0, 0] },
  });
  assert.deepEqual(Object.keys(pose), ["neonboy"]);
  assert.deepEqual(pose.neonboy.LeftShoulder, [180, -180, 12]);
  assert.deepEqual(pose.neonboy.RightHand, [0, 45, 0]);
  assert.equal(pose.neonboy.Hips, undefined);
});

test("manual arm pose layers over an animated rig and never accumulates across frames", () => {
  const scene = new THREE.Scene(), root = new THREE.Group();
  const arm = new THREE.Bone(); arm.name = "mixamorig:LeftArm"; root.add(arm); scene.add(root);
  const controller = createRockClubConcertPoseController(scene, { root }, { actors: new Map() });
  assert.ok(controller.available("neonboy").includes("LeftArm"));
  const input = { neonboy: { LeftArm: [90, 0, 0] } };
  controller.apply(input, {}, { id: "neonboy", bone: "LeftArm" });
  assert.ok(Math.abs(arm.rotation.x - Math.PI / 2) < 1e-6);
  controller.apply(input);
  assert.ok(Math.abs(arm.rotation.x - Math.PI / 2) < 1e-6);
  controller.clear();
  assert.ok(Math.abs(arm.rotation.x) < 1e-6);
  arm.rotation.x = 0.3; // A new frame from the character's clip.
  controller.apply(input);
  assert.ok(Math.abs(arm.rotation.x - 0.3 - Math.PI / 2) < 1e-6);
  controller.dispose();
  assert.ok(Math.abs(arm.rotation.x - 0.3) < 1e-6);
});
