import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenDemonEncounter, GLASSES_PICKUP_WIDTH, GLASSES_POSITION } from "./halloweenDemonEncounter.js";

test("glasses remain inside the closed chest, appear when opened and stay gone after pickup", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try {
    const scene = new THREE.Scene();
    const actor = createHalloweenDemonEncounter(scene);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(actor.glasses.children[0]).getSize(new THREE.Vector3()).x - GLASSES_PICKUP_WIDTH) < .001);
    const model = new THREE.Group();
    model.add(new THREE.Mesh(new THREE.BoxGeometry(2, .6, .4), new THREE.MeshBasicMaterial()));
    actor.mountGlasses(model);
    assert.equal(actor.glasses.children[0].visible, false);
    assert.equal(model.parent, actor.glasses);
    assert.ok(Math.abs(new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).x - GLASSES_PICKUP_WIDTH) < .001);
    assert.equal(actor.glasses.position.z, GLASSES_POSITION.z);
    assert.equal(actor.glasses.position.x, GLASSES_POSITION.x);
    actor.update(.1, 1, { x: 0, z: 0 }, false, true);
    assert.equal(actor.glasses.visible, false, "closed chest hides the contents");
    actor.setChestOpen(true);
    actor.update(.1, 1.1, { x: 0, z: 0 }, false, true);
    assert.equal(actor.glasses.visible, true);
    assert.equal(actor.glasses.position.y, GLASSES_POSITION.y, "glasses rest inside, with no floating pickup animation");
    actor.collect();
    actor.setChestOpen(false);
    actor.setChestOpen(true);
    actor.update(.1, 1.2, { x: 0, z: 0 }, false, true);
    assert.equal(actor.glasses.visible, false);
    actor.stop();
  } finally {
    globalThis.document = previousDocument;
  }
});

test("one patrolling actor swaps persistent forms and keeps health across vision windows", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try {
    const scene = new THREE.Scene();
    const actor = createHalloweenDemonEncounter(scene);
    const makeAsset = () => {
      const body = new THREE.Group();
      body.add(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.8, .4), new THREE.MeshBasicMaterial()));
      return { scene: body, animations: [new THREE.AnimationClip("idle", 1, [])] };
    };
    actor.mountForm(makeAsset(), makeAsset());
    actor.mountForm(makeAsset(), makeAsset());
    const normal = actor.root.children[0], demon = actor.root.children[1];
    const originalPosition = actor.root.position.clone();
    actor.root.updateMatrixWorld(true);
    const normalHeight = new THREE.Box3().setFromObject(normal).getSize(new THREE.Vector3()).y;
    const matrixHeight = new THREE.Box3().setFromObject(demon).getSize(new THREE.Vector3()).y;
    assert.ok(Math.abs(normalHeight - 1.84) < .01, "the normal disguise keeps its original height");
    assert.ok(Math.abs(matrixHeight - 2.75) < .01, "Matrix form grows to the requested size");
    assert.equal(normal.visible, true);
    assert.equal(demon.visible, false);
    assert.equal(actor.hit(), null);
    actor.setVision(true, [1, 3, 5, 7]);
    assert.equal(normal.visible, false);
    assert.equal(demon.visible, true);
    assert.equal(actor.getOrbTarget().position.y, 1.35);
    assert.ok(actor.getOrbTarget().radius > 1, "the taller form has a matching orb hitbox");
    assert.equal(actor.hit(), 2);
    actor.setVision(false);
    assert.equal(normal.visible, true);
    assert.equal(actor.health, 2);
    assert.equal(actor.root.position.equals(originalPosition), true);
    actor.setVision(true);
    assert.equal(actor.hit(), 1);
    assert.equal(actor.hit(), 0);
    assert.equal(actor.hit(), null);
    actor.hideDefeated();
    actor.setVision(false);
    assert.equal(normal.visible, false);
    assert.equal(demon.visible, false);
    actor.stop();
  } finally {
    globalThis.document = previousDocument;
  }
});

test("telegraphed pulse damages once, then respects its cooldown", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try {
    const actor = createHalloweenDemonEncounter(new THREE.Scene());
    const player = { x: actor.position.x, z: actor.position.z };
    let damage = 0;
    for (let i = 0; i < 42; i++) actor.update(.1, i * .1, player, true, false, () => damage++);
    assert.equal(damage, 1);
    actor.update(.1, 5, player, true, true, () => damage++);
    assert.equal(damage, 1);
  } finally {
    globalThis.document = previousDocument;
  }
});


test("normal reguetonero plays its kick and damages NeonBoy outside matrix vision", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try {
    const scene = new THREE.Scene();
    const actor = createHalloweenDemonEncounter(scene);
    const makeAsset = (clip) => {
      const body = new THREE.Group();
      body.add(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.8, .4), new THREE.MeshBasicMaterial()));
      return { scene: body, animations: [clip] };
    };
    const idle = () => makeAsset(new THREE.AnimationClip("idle", 1, []));
    const attack = makeAsset(new THREE.AnimationClip("Spartan_Kick", 1.4, [
      new THREE.NumberKeyframeTrack(".rotation[y]", [0, .7, 1.4], [0, 1, 0]),
    ]));
    actor.mountForm(idle(), idle(), attack);
    actor.mountForm(idle(), idle());
    const normal = actor.root.children[0];
    const player = { x: actor.position.x, z: actor.position.z };
    let damage = 0, maximumKickRotation = 0;
    for (let i = 0; i < 42; i++) {
      actor.update(.1, i * .1, player, false, false, () => damage++);
      maximumKickRotation = Math.max(maximumKickRotation, normal.rotation.y);
    }
    assert.equal(normal.visible, true);
    assert.ok(maximumKickRotation > .3, "the kick animation must play on the normal model");
    assert.equal(damage, 1);
    assert.equal(actor.health, 3, "attacking does not damage the enemy");
    actor.stop();
  } finally {
    globalThis.document = previousDocument;
  }
});


test("matrix form reuses compatible kick bones and still deals damage", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try {
    const actor = createHalloweenDemonEncounter(new THREE.Scene());
    const rig = () => {
      const scene = new THREE.Group();
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.8, .4), new THREE.MeshBasicMaterial()));
      const hips = new THREE.Object3D(); hips.name = "mixamorigHips"; scene.add(hips);
      return { scene, animations: [new THREE.AnimationClip("idle", 1, [])] };
    };
    const kick = { scene: new THREE.Group(), animations: [new THREE.AnimationClip("Spartan_Kick", 1.4, [
      new THREE.NumberKeyframeTrack("mixamorigHips.rotation[y]", [0, .7, 1.4], [0, 1, 0]),
      new THREE.NumberKeyframeTrack("missingFinger.rotation[y]", [0, 1.4], [0, 1]),
    ])] };
    actor.mountForm(rig(), rig(), kick);
    actor.mountForm(rig(), rig(), kick);
    actor.setVision(true);
    const demon = actor.root.children[1];
    const player = { x: actor.position.x, z: actor.position.z };
    let damage = 0, maximumKickRotation = 0;
    for (let i = 0; i < 42; i++) {
      actor.update(.1, i * .1, player, true, false, () => damage++);
      maximumKickRotation = Math.max(maximumKickRotation, demon.getObjectByName("mixamorigHips").rotation.y);
    }
    assert.equal(demon.visible, true);
    assert.ok(maximumKickRotation > .3);
    assert.equal(damage, 1);
    actor.stop();
  } finally {
    globalThis.document = previousDocument;
  }
});


test("matrix demon plays the death clip before disappearing", () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, strokeRect() {}, fillText() {} }) }),
  };
  try {
    const actor = createHalloweenDemonEncounter(new THREE.Scene());
    const makeAsset = (clip) => {
      const body = new THREE.Group();
      body.add(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.8, .4), new THREE.MeshBasicMaterial()));
      const head = new THREE.Object3D(); head.name = "mixamorigHead"; body.add(head);
      return { scene: body, animations: [clip] };
    };
    const idle = () => makeAsset(new THREE.AnimationClip("idle", 1, []));
    const death = makeAsset(new THREE.AnimationClip("Dead", 1, [
      new THREE.NumberKeyframeTrack("mixamorigHead.rotation[y]", [0, 1], [0, 1]),
    ]));
    actor.mountForm(idle(), idle());
    actor.mountForm(idle(), idle(), null, death);
    actor.setVision(true);
    assert.equal(actor.hit(), 2);
    assert.equal(actor.hit(), 1);
    assert.equal(actor.hit(), 0);
    const body = actor.root.children[1];
    actor.update(.5, .5, { x: 0, z: 0 }, true, false);
    assert.ok(body.getObjectByName("mixamorigHead").rotation.y > .3);
    actor.hideDefeated();
    assert.equal(body.visible, true, "the final voice cannot cut off the animation");
    actor.update(.5, 1, { x: 0, z: 0 }, false, false);
    assert.equal(body.visible, false);
    actor.stop();
  } finally {
    globalThis.document = previousDocument;
  }
});
