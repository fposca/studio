import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenMirror } from "./halloweenMirror.js";

function withCanvas(run) {
  const previous = globalThis.document;
  const context = { fillRect() {}, strokeRect() {}, fillText() {}, beginPath() {}, ellipse() {}, fill() {} };
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  try { run(); } finally { globalThis.document = previous; }
}

test("mirror reflects a hidden first-person body and restores UI, shadows and render target", () => withCanvas(() => {
  const mirror = createHalloweenMirror({ mobile: true, lowPower: true });
  const scene = new THREE.Scene(); scene.add(mirror.root);
  const player = new THREE.Group(); player.visible = false; scene.add(player); mirror.setPlayer(player);
  const badge = new THREE.Group(); badge.name = "interaction-prompt"; scene.add(badge);
  const camera = new THREE.PerspectiveCamera(60, 1, .05, 50); camera.position.z = 4; camera.updateMatrixWorld(); scene.updateMatrixWorld(true);
  const originalTarget = { name: "main-target" }; let target = originalTarget, renders = 0;
  const renderer = {
    xr: { enabled: true }, shadowMap: { autoUpdate: true }, autoClear: true,
    state: { buffers: { depth: { setMask() {} } } },
    getRenderTarget: () => target, setRenderTarget: value => { target = value; },
    render(renderScene, reflectionCamera) {
      renders++;
      assert.equal(renderScene, scene);
      assert.ok(Math.abs(reflectionCamera.position.z - (.42 - 4)) < .001, "the camera must be mirrored across the actual glass");
      assert.equal(player.visible, true); assert.equal(badge.visible, false);
      assert.equal(mirror.surface.visible, false, "no recursive reflection");
      assert.equal(renderer.shadowMap.autoUpdate, false);
      assert.equal(target, mirror.surface.getRenderTarget());
    },
  };
  mirror.surface.onBeforeRender(renderer, scene, camera);
  assert.equal(renders, 1);
  assert.equal(player.visible, false); assert.equal(badge.visible, true);
  assert.equal(renderer.shadowMap.autoUpdate, true); assert.equal(renderer.xr.enabled, true);
  assert.equal(target, originalTarget); assert.equal(mirror.surface.visible, true);
  assert.equal(mirror.surface.getRenderTarget().width, 256);
  assert.equal(mirror.surface.getRenderTarget().samples, 0);
  mirror.setEnabled(false); mirror.invalidate(); mirror.surface.onBeforeRender(renderer, scene, camera);
  assert.equal(renders, 1, "closed panels/loading can suspend the reflection");
  mirror.setEnabled(true); camera.position.z = 20; camera.updateMatrixWorld(); mirror.surface.onBeforeRender(renderer, scene, camera);
  assert.equal(renders, 1, "distant mirrors must not render the shop again");
  camera.position.z = -4; camera.updateMatrixWorld(); mirror.surface.onBeforeRender(renderer, scene, camera);
  assert.equal(renders, 1, "the back of the mirror must not capture");
  mirror.dispose();
}));

test("Matrix preserves the real reflector and context restoration requests a fresh image", () => withCanvas(() => {
  const mirror = createHalloweenMirror();
  const material = mirror.surface.material, texture = material.uniforms.tDiffuse.value;
  mirror.setVision(true); mirror.setVision(false);
  assert.equal(mirror.surface.isReflector, true);
  assert.equal(mirror.surface.material, material);
  assert.equal(material.uniforms.tDiffuse.value, texture);
  material.uniforms.reflectionReady.value = 1;
  mirror.invalidate(); assert.equal(material.uniforms.reflectionReady.value, 0);
  let disposed = false; mirror.surface.getRenderTarget().addEventListener("dispose", () => { disposed = true; });
  mirror.dispose(); assert.equal(disposed, true);
}));
