import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { bindRetroGamerLighting, normalizeRetroGamerLighting } from "./retroGamerLighting.js";

test("old and invalid projects get defaults, but an explicit off state survives", () => {
  assert.deepEqual(normalizeRetroGamerLighting(), { period: "day", lights: true });
  assert.deepEqual(normalizeRetroGamerLighting(null), { period: "day", lights: true });
  assert.deepEqual(normalizeRetroGamerLighting({ period: "invalid", lights: "false" }), { period: "day", lights: true });
  assert.deepEqual(normalizeRetroGamerLighting({ period: "night", lights: false }), { period: "night", lights: false });
});

test("night lighting applies only during room renders and restores the shared lights", () => {
  const scene = new THREE.Scene();
  const room = new THREE.Group();
  const ambient = new THREE.HemisphereLight(0xffeeee, 0x334433, 0.7);
  const keyLight = new THREE.DirectionalLight(0xffddaa, 1.8);
  scene.environmentIntensity = 0.65;
  const originalColors = [ambient.color.getHex(), keyLight.color.getHex()];
  room.userData.lighting = { period: "night", lights: false };
  const detach = bindRetroGamerLighting(scene, room, { ambient, keyLight });
  scene.onBeforeRender();
  const dark = ambient.intensity;
  assert.ok(dark < 0.1);
  assert.ok(keyLight.intensity < 0.1);
  scene.onAfterRender();
  assert.equal(ambient.intensity, 0.7);
  assert.equal(keyLight.intensity, 1.8);
  assert.equal(scene.environmentIntensity, 0.65);
  assert.deepEqual([ambient.color.getHex(), keyLight.color.getHex()], originalColors);
  room.userData.lighting.lights = true;
  scene.onBeforeRender();
  assert.ok(ambient.intensity > dark);
  scene.onAfterRender();
  room.visible = false;
  scene.onBeforeRender();
  assert.equal(ambient.intensity, 0.7);
  scene.onAfterRender();
  detach();
});

test("cleanup restores an in-flight render and preserves existing render hooks", () => {
  const scene = new THREE.Scene();
  const room = new THREE.Group();
  const ambient = new THREE.HemisphereLight();
  const keyLight = new THREE.DirectionalLight();
  let calls = 0;
  const before = () => { calls += 1; };
  const after = () => { calls += 1; };
  scene.onBeforeRender = before;
  scene.onAfterRender = after;
  room.userData.lighting = { period: "sunset", lights: false };
  const detach = bindRetroGamerLighting(scene, room, { ambient, keyLight });
  const intensity = ambient.intensity;
  scene.onBeforeRender();
  scene.onAfterRender();
  assert.equal(calls, 2);
  scene.onBeforeRender();
  detach();
  assert.equal(ambient.intensity, intensity);
  assert.equal(scene.onBeforeRender, before);
  assert.equal(scene.onAfterRender, after);
});
