import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  createDragonAnimationClips,
  DRAGON_BREATHING_CLIP,
  DRAGON_FLYING_CLIP,
  initializeDragonFlight,
  updateDragonFlight
} from "./dragonAnimation.js";

function makeDragon() {
  const model = new THREE.Group();
  model.userData.bundledModel = "dragon-flying";
  const chest = new THREE.Bone();
  chest.name = "Bone_002";
  model.add(chest);
  [
    "Bone_003", "Bone_029", "Bone_027", "Bone_023", "Bone_034", "Bone_039",
    "Bone_033", "Bone_038", "Bone_010", "Bone_015", "Bone_009", "Bone_014",
    "Bone_042", "Bone_045", "Bone_041", "Bone_044"
  ].forEach((name) => {
    const bone = new THREE.Bone();
    bone.name = name;
    chest.add(bone);
  });
  return model;
}

test("dragon clips loop and preserve the original pose on regeneration", () => {
  const model = makeDragon();
  const clips = createDragonAnimationClips(model);
  assert.deepEqual(clips.map((clip) => clip.name), [DRAGON_BREATHING_CLIP, DRAGON_FLYING_CLIP]);
  assert.ok(clips.every((clip) => clip.tracks.length >= 8));
  const wing = clips[1].tracks.find((track) => track.name === "Bone_042.quaternion");
  assert.ok(wing);
  assert.deepEqual(Array.from(wing.values.slice(0, 4)), Array.from(wing.values.slice(-4)));
  assert.notDeepEqual(Array.from(wing.values.slice(0, 4)), Array.from(wing.values.slice(32, 36)));
  model.getObjectByName("Bone_042").rotation.z = 0.8;
  const regenerated = createDragonAnimationClips(model);
  const restoredWing = regenerated[1].tracks.find((track) => track.name === "Bone_042.quaternion");
  assert.deepEqual(Array.from(restoredWing.values), Array.from(wing.values));
});

test("breathing opens both wings and briefly turns the head without breaking the loop", () => {
  const model = makeDragon();
  const [breathing] = createDragonAnimationClips(model);
  for (const bone of ["Bone_042", "Bone_045", "Bone_041", "Bone_044", "Bone_027"]) {
    const track = breathing.tracks.find((entry) => entry.name === bone + ".quaternion");
    assert.ok(track, bone + " should be animated");
    assert.deepEqual(Array.from(track.values.slice(0, 4)), Array.from(track.values.slice(-4)));
    assert.notDeepEqual(Array.from(track.values.slice(0, 4)), Array.from(track.values.slice(32, 36)));
  }
  const head = breathing.tracks.find((entry) => entry.name === "Bone_027.quaternion");
  assert.deepEqual(Array.from(head.values.slice(0, 4)), Array.from(head.values.slice(8, 12)));
  assert.notDeepEqual(Array.from(head.values.slice(0, 4)), Array.from(head.values.slice(80, 84)));
});

test("flight has a pronounced, looping wing stroke and delayed wing tips", () => {
  const model = makeDragon();
  const [, flight] = createDragonAnimationClips(model);
  assert.equal(flight.duration, 1.45);
  for (const bone of ["Bone_042", "Bone_045"]) {
    const track = flight.tracks.find((entry) => entry.name === bone + ".quaternion");
    const raised = new THREE.Quaternion().fromArray(track.values, 8 * 4);
    const lowered = new THREE.Quaternion().fromArray(track.values, 24 * 4);
    assert.ok(raised.angleTo(lowered) > 1, bone + " should flap visibly");
    assert.deepEqual(Array.from(track.values.slice(0, 4)), Array.from(track.values.slice(-4)));
  }
  const tip = flight.tracks.find((entry) => entry.name === "Bone_041.quaternion");
  assert.ok(new THREE.Quaternion().fromArray(tip.values, 8 * 4)
    .angleTo(new THREE.Quaternion().fromArray(tip.values, 24 * 4)) > 0.35);
});

test("flight swings all four legs and flexes their joints without a loop jump", () => {
  const model = makeDragon();
  const [, flight] = createDragonAnimationClips(model);
  for (const bone of ["Bone_034", "Bone_039", "Bone_010", "Bone_015", "Bone_033", "Bone_038", "Bone_009", "Bone_014"]) {
    const track = flight.tracks.find((entry) => entry.name === bone + ".quaternion");
    assert.ok(track, bone + " should be animated");
    const swing = Math.max(...Array.from({ length: 16 }, (_, index) => {
      const forward = new THREE.Quaternion().fromArray(track.values, index * 4);
      const backward = new THREE.Quaternion().fromArray(track.values, (index + 16) * 4);
      return forward.angleTo(backward);
    }));
    const minimumSwing = ["Bone_034", "Bone_039", "Bone_010", "Bone_015"].includes(bone) ? 0.3 : 0.2;
    assert.ok(swing > minimumSwing, bone + " should move visibly");
    assert.deepEqual(Array.from(track.values.slice(0, 4)), Array.from(track.values.slice(-4)));
  }
});

test("flight moves through the air, pauses, loops and lands when breathing", () => {
  const model = makeDragon();
  model.userData.modelAnimation = { clip: DRAGON_FLYING_CLIP, playing: true, speed: 1 };
  initializeDragonFlight(model, true);
  assert.equal(model.position.y, 4.5);
  for (let i = 0; i < 50; i += 1) updateDragonFlight(model, 0.1);
  assert.ok(Math.abs(model.position.x) > 1);
  assert.ok(model.position.y > 4);
  assert.ok(Math.abs(model.position.y - 4.5) > 0.12);
  const paused = model.position.clone();
  model.userData.modelAnimation.playing = false;
  updateDragonFlight(model, 0.1);
  assert.ok(model.position.distanceTo(paused) < 0.0001);
  model.userData.modelAnimation.playing = true;
  for (let i = 0; i < 110; i += 1) updateDragonFlight(model, 0.1);
  assert.ok(Math.abs(model.position.x) < 0.05);
  assert.ok(Math.abs(model.position.z) < 0.05);
  model.userData.modelAnimation.clip = DRAGON_BREATHING_CLIP;
  for (let i = 0; i < 60; i += 1) updateDragonFlight(model, 0.1);
  assert.ok(model.position.y < 0.05);
});
