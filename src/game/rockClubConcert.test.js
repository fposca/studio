import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { CONCERT_SHOTS, concertShotAt, createConcertCamera, CONCERT_SEQUENCE_DURATION } from "./rockClubConcertCamera.js";
import { normalizeConcertTransforms } from "./rockClubConcertSettings.js";
import { createRockClubConcertProps } from "./rockClubConcertProps.js";

test("concert director cycles through every shot, pauses and stays inside the room", () => {
  const camera = new THREE.PerspectiveCamera();
  const director = createConcertCamera(camera, (id, target) => target.set(0, 1.55, -15.25));
  let time = 0;
  for (const shot of CONCERT_SHOTS) {
    assert.equal(concertShotAt(time + 0.01).shot.id, shot.id); time += shot.duration;
    for (let sample = 0; sample < 60; sample++) {
      director.update(shot.duration / 60, shot.id);
      assert.ok(camera.position.x >= -9.3 && camera.position.x <= 9.3);
      assert.ok(camera.position.y >= 0.85 && camera.position.y <= 4.85);
      assert.ok(camera.position.z >= -18.2 && camera.position.z <= 8.4);
      assert.ok(camera.quaternion.toArray().every(Number.isFinite));
    }
  }
  assert.equal(concertShotAt(CONCERT_SEQUENCE_DURATION).shot.id, "wide");
  director.reset(); director.update(2); const frozen = camera.position.clone();
  director.update(0); assert.ok(camera.position.equals(frozen));
  const reduced = createConcertCamera(camera, (id, target) => target.set(0, 1.55, -15.25), true);
  assert.equal(reduced.update(100), "wide");
});

test("automatic cameras cut every two seconds while manual pans and orbit stay smooth", () => {
  assert.equal(CONCERT_SEQUENCE_DURATION, 20);
  assert.equal(concertShotAt(1.99).shot.id, "wide");
  assert.equal(concertShotAt(2).shot.id, "neonboy");
  assert.equal(concertShotAt(4).shot.id, "guitar");
  assert.equal(concertShotAt(10).shot.id, "audience");
  assert.equal(concertShotAt(20).shot.id, "wide");
  assert.ok(concertShotAt(2.1, "john").progress > concertShotAt(1.9, "john").progress);

  const camera = new THREE.PerspectiveCamera();
  const director = createConcertCamera(camera, (id, target) => target.set(0, 1.55, -15.25));
  director.update(0, "orbit");
  for (let i = 0; i < 45; i++) {
    const previous = camera.position.clone();
    director.update(.05, "orbit");
    assert.ok(camera.position.distanceTo(previous) < .2, "the orbit must not spin a full turn in two seconds");
  }
  const frozen = camera.position.clone();
  director.update(0, "orbit");
  assert.ok(camera.position.equals(frozen));
});

test("instrument corrections reject invalid saved data and retain per-musician handedness", () => {
  const config = normalizeConcertTransforms({ neonboy: { position: [Infinity, 99, -99], rotation: [NaN, 500, 0], scale: -20, fretHand: "invalid" } });
  assert.deepEqual(config.neonboy.position, [0, 2, -2]);
  assert.deepEqual(config.neonboy.rotation, [0, 360, 0]);
  assert.equal(config.neonboy.scale, 0.4);
  assert.equal(config.neonboy.fretHand, "left");
  assert.equal(config["john-zool"].fretHand, "right");
});

test("instruments follow the waist without inheriting wrist scale and restore stage props", () => {
  const scene = new THREE.Scene(), slots = new Map();
  for (const id of ["guitar", "bass", "guitar-stand", "bass-stand"]) {
    const anchor = new THREE.Group(); scene.add(anchor);
    anchor.position.set(5, 0.48, -14); anchor.scale.setScalar(2.5);
    const model = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.12), new THREE.MeshStandardMaterial());
    model.name = `club-model:${id}`; model.position.y = 0.16; model.scale.setScalar(0.7); anchor.add(model);
    slots.set(id, { anchor });
  }
  function performer(x) {
    const root = new THREE.Group(); root.position.x = x; root.scale.setScalar(1.4); scene.add(root);
    const hip = new THREE.Bone(); hip.name = "mixamorig:Hips"; hip.position.y = 1; root.add(hip);
    const spine = new THREE.Bone(); spine.name = "mixamorig:Spine1"; spine.position.y = 0.35; hip.add(spine);
    for (const [side, sign] of [["Left", 1], ["Right", -1]]) {
      const bone = new THREE.Bone(); bone.name = `mixamorig:${side}Hand`;
      bone.position.set(sign * 0.25, 1 + sign * 0.1, 0.25); bone.scale.setScalar(3); root.add(bone);
    }
    return root;
  }
  const character = { root: performer(2.45) }, john = performer(-3.65), bass = performer(4.3);
  const actors = new Map([["john-zool", { root: john }], ["revenant", { root: bass }]]);
  const config = normalizeConcertTransforms();
  const props = createRockClubConcertProps(scene, { slots }, { actors }, character, () => config);
  const original = slots.get("guitar").anchor.getObjectByName("club-model:guitar");
  const originalPosition = original.position.clone();
  assert.equal(props.start(), 3); assert.equal(props.start(), 3);
  const grip = scene.getObjectByName("concert-grip:neonboy");
  assert.ok(grip.scale.equals(new THREE.Vector3(1, 1, 1)));
  const rotation = grip.quaternion.clone(), originalGrip = grip.position.clone();
  character.root.getObjectByName("mixamorig:RightHand").rotation.set(1.2, 0.4, 2);
  props.update(); assert.ok(grip.quaternion.angleTo(rotation) < 1e-6);
  assert.ok(grip.position.distanceTo(originalGrip) < 1e-6);
  const strummingHand = character.root.getObjectByName("mixamorig:RightHand");
  strummingHand.position.z += 0.2;
  props.update();
  assert.ok(grip.position.distanceTo(originalGrip) > 0.025, "strumming should move the guitar slightly");
  assert.ok(grip.position.distanceTo(originalGrip) < 0.1, "the guitar must stay at the waist");
  strummingHand.position.z -= 0.2;
  const spine = character.root.getObjectByName("mixamorig:Spine1");
  spine.rotation.z = 0.28;
  props.update();
  assert.ok(grip.position.distanceTo(originalGrip) > 0.04, "the guitar must follow torso sway");
  assert.ok(grip.quaternion.angleTo(rotation) > 0.1, "the guitar must tilt with the torso");
  character.root.getObjectByName("mixamorig:Hips").position.y += 0.2;
  const swayedY = grip.position.y;
  props.update(); assert.ok(grip.position.y > swayedY + 0.2);
  const movedGrip = grip.position.clone();
  character.root.position.x += 0.5;
  props.update(); assert.ok(grip.position.x > movedGrip.x + 0.49);
  assert.equal(scene.getObjectByName("concert-grip:john-zool").children[0].children[0].visible, true);
  assert.ok(original.position.equals(originalPosition)); assert.equal(original.visible, false);
  props.stop();
  assert.equal(original.visible, true); assert.equal(slots.get("guitar-stand").anchor.visible, true);
  assert.equal(scene.getObjectByName("concert-grip:neonboy"), undefined);
  assert.ok(original.position.equals(originalPosition));
  assert.equal(props.start(), 3); props.stop();
});
