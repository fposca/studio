import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { JUDGE_ENTRANCE_SECONDS, JUDGE_RETURN_SECONDS, judgeEntranceCameraPose, judgeReturnCameraPose } from "./halloweenJudgeCamera.js";

const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
const checkVector = (vector) => assert.ok([vector.x, vector.y, vector.z].every(Number.isFinite));

test("boss entrance travels from the player's view to a clear front-facing shot", () => {
  const start = new THREE.Vector3(9, 3, 9);
  const startLook = new THREE.Vector3(9, 1.2, 6);
  const boss = new THREE.Vector3(0, 0, -10.1);
  const position = new THREE.Vector3(), target = new THREE.Vector3();
  assert.equal(judgeEntranceCameraPose(start, startLook, boss, 0, position, target), false);
  assert.ok(position.distanceTo(start) < 1e-6);
  assert.ok(target.distanceTo(startLook) < 1e-6);
  judgeEntranceCameraPose(start, startLook, boss, JUDGE_ENTRANCE_SECONDS * .6, position, target);
  approx(position.x, 0);
  approx(position.z, boss.z + 7.7);
  assert.ok(position.y > 3);
  assert.equal(judgeEntranceCameraPose(start, startLook, boss, JUDGE_ENTRANCE_SECONDS, position, target), true);
  approx(position.x, .85);
  approx(position.z, boss.z + 2.7);
  approx(target.y, 1.5);
  approx(target.z, boss.z);
  checkVector(position);
  checkVector(target);
});

test("after the reveal, camera returns to the player view for combat", () => {
  const boss = new THREE.Vector3(0, 0, -10.1);
  const playerCamera = new THREE.Vector3(10, 1.68, 8);
  const playerLook = new THREE.Vector3(9.5, 1.68, 7.1);
  const fromPosition = new THREE.Vector3(.85, 2.5, boss.z + 2.7);
  const fromTarget = new THREE.Vector3(boss.x, 1.5, boss.z);
  const position = new THREE.Vector3(), target = new THREE.Vector3();
  assert.equal(judgeReturnCameraPose(boss, fromPosition, fromTarget, playerCamera, playerLook, 0, position, target), false);
  assert.ok(position.distanceTo(fromPosition) < 1e-6);
  assert.ok(target.distanceTo(fromTarget) < 1e-6);
  assert.equal(judgeReturnCameraPose(boss, fromPosition, fromTarget, playerCamera, playerLook, JUDGE_RETURN_SECONDS, position, target), true);
  assert.ok(position.distanceTo(playerCamera) < 1e-6);
  assert.ok(target.distanceTo(playerLook) < 1e-6);
  checkVector(position);
  checkVector(target);
});
