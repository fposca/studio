import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  createSeatedAnimationClips,
  NEONBOY_AWAKE_SEATED_CLIP,
  NEONBOY_AWAKE_SEATED_ID,
  NEONBOY_TALKING_SEATED_CLIP,
  NEONBOY_TALKING_SEATED_CLIP_NAMES,
  NEONBOY_TALKING_SEATED_ID
} from "./neonboySeatedAnimation.js";

function seatedRig() {
  const model = new THREE.Group();
  model.userData.bundledModel = NEONBOY_AWAKE_SEATED_ID;
  const lowerSpine = new THREE.Bone();
  lowerSpine.name = "mixamorigSpine1";
  const spine = new THREE.Bone();
  spine.name = "mixamorigSpine2";
  const neck = new THREE.Bone();
  neck.name = "mixamorigNeck";
  const head = new THREE.Bone();
  head.name = "mixamorigHead";
  const leftArm = new THREE.Bone();
  leftArm.name = "mixamorigLeftForeArm";
  const rightArm = new THREE.Bone();
  rightArm.name = "mixamorigRightForeArm";
  const leftUpperArm = new THREE.Bone();
  leftUpperArm.name = "mixamorigLeftArm";
  const rightUpperArm = new THREE.Bone();
  rightUpperArm.name = "mixamorigRightArm";
  const leg = new THREE.Bone();
  leg.name = "mixamorigLeftUpLeg";
  model.add(lowerSpine);
  lowerSpine.add(spine);
  spine.add(neck, leftUpperArm, rightUpperArm, leg);
  leftUpperArm.add(leftArm);
  rightUpperArm.add(rightArm);
  neck.add(head);
  const times = Array.from({ length: 17 }, (_, index) => index / 16);
  const values = times.flatMap(() => [0, 0, 0, 1]);
  const source = new THREE.AnimationClip("Quieto", 1, [
    new THREE.QuaternionKeyframeTrack("mixamorigSpine2.quaternion", times, values),
    new THREE.QuaternionKeyframeTrack("mixamorigHead.quaternion", times, values),
    new THREE.QuaternionKeyframeTrack("mixamorigLeftForeArm.quaternion", times, values),
    new THREE.QuaternionKeyframeTrack("mixamorigRightForeArm.quaternion", times, values),
    new THREE.QuaternionKeyframeTrack("mixamorigLeftUpLeg.quaternion", times, values),
    new THREE.QuaternionKeyframeTrack("mixamorigLeftArm.quaternion", times, values),
    new THREE.QuaternionKeyframeTrack("mixamorigRightArm.quaternion", times, values)
  ]);
  return { model, source };
}

test("awake seated clip animates head, chest and arm without changing the source", () => {
  const { model, source } = seatedRig();
  const sourceTracks = source.tracks.map((track) => [...track.values]);
  const [awake] = createSeatedAnimationClips(model, [source]);
  assert.equal(awake.name, NEONBOY_AWAKE_SEATED_CLIP);
  assert.equal(awake.duration, source.duration);
  assert.ok(!awake.tracks.some((track) => track.name.endsWith(".scale")));
  for (const index of [0, 1, 3]) {
    assert.notDeepEqual([...awake.tracks[index].values], sourceTracks[index]);
    assert.deepEqual([...source.tracks[index].values], sourceTracks[index]);
    const first = [...awake.tracks[index].values.slice(0, 4)];
    const last = [...awake.tracks[index].values.slice(-4)];
    first.forEach((value, component) => assert.ok(Math.abs(value - last[component]) < 0.00001,
      `${awake.tracks[index].name} must loop cleanly`));
  }
});

test("the variant is independent of the other seated presets", () => {
  const { model, source } = seatedRig();
  model.userData.bundledModel = "neonboy-sentado-quieto-hd";
  assert.deepEqual(createSeatedAnimationClips(model, [source]), [source]);
  model.userData.bundledModel = NEONBOY_AWAKE_SEATED_ID;
  const generated = createSeatedAnimationClips(model, [source]);
  assert.equal(createSeatedAnimationClips(model, generated), generated);
});

test("talking seated clip gestures with both hands, preserves legs and loops", () => {
  const { model, source } = seatedRig();
  model.userData.bundledModel = NEONBOY_TALKING_SEATED_ID;
  const [talking] = createSeatedAnimationClips(model, [source]);
  assert.equal(talking.name, NEONBOY_TALKING_SEATED_CLIP);
  assert.equal(talking.duration, source.duration);
  for (const index of [0, 1, 2, 3]) {
    assert.notDeepEqual([...talking.tracks[index].values], [...source.tracks[index].values]);
    const first = [...talking.tracks[index].values.slice(0, 4)];
    const last = [...talking.tracks[index].values.slice(-4)];
    first.forEach((value, component) => assert.ok(Math.abs(value - last[component]) < 0.00001,
      `${talking.tracks[index].name} must loop cleanly`));
  }
  assert.deepEqual([...talking.tracks[4].values], [...source.tracks[4].values]);
  for (const [boneName, width] of [["mixamorigSpine1", 1.08], ["mixamorigSpine2", 1.12], ["mixamorigNeck", 1 / (1.08 * 1.12)]]) {
    const track = talking.tracks.find((entry) => entry.name === `${boneName}.scale`);
    assert.ok(track, `${boneName} must have its own width track`);
    assert.deepEqual([...track.values], [Math.fround(width), 1, 1, Math.fround(width), 1, 1]);
  }
  assert.equal(createSeatedAnimationClips(model, [talking])[0], talking);
});

test("talking seated offers distinct loopable dialogue clips without changing the source", () => {
  const { model, source } = seatedRig();
  model.userData.bundledModel = NEONBOY_TALKING_SEATED_ID;
  const sourceValues = source.tracks.map((track) => [...track.values]);
  const clips = createSeatedAnimationClips(model, [source]);
  assert.equal(clips.length, 8);
  assert.deepEqual(clips.map((clip) => clip.name), NEONBOY_TALKING_SEATED_CLIP_NAMES);
  assert.equal(new Set(clips.map((clip) => clip.name)).size, clips.length);
  assert.deepEqual(source.tracks.map((track) => [...track.values]), sourceValues);

  for (const clip of clips) {
    assert.equal(clip.duration, source.duration);
    assert.deepEqual([...clip.tracks[4].values], sourceValues[4], `${clip.name} must keep the seated legs`);
    for (const boneName of ["mixamorigSpine1", "mixamorigSpine2", "mixamorigNeck"]) {
      assert.ok(clip.tracks.some((track) => track.name === `${boneName}.scale`),
        `${clip.name} must keep the wider back`);
    }
    for (const track of clip.tracks.filter((entry) => entry.name.endsWith(".quaternion"))) {
      const first = [...track.values.slice(0, 4)];
      const last = [...track.values.slice(-4)];
      first.forEach((value, index) => assert.ok(Math.abs(value - last[index]) < 0.00001,
        `${clip.name}: ${track.name} must loop cleanly`));
    }
  }
});

test("calm dialogue keeps arms still, one-arm gestures only on the right, applause rests again", () => {
  const { model, source } = seatedRig();
  model.userData.bundledModel = NEONBOY_TALKING_SEATED_ID;
  const clips = createSeatedAnimationClips(model, [source]);
  const trackValues = (clip, bone) => [...clip.tracks.find((track) => track.name === `${bone}.quaternion`).values];
  const calm = clips.find((clip) => clip.name === "Dialogo tranquilo");
  const oneArm = clips.find((clip) => clip.name === "Un brazo");
  const applause = clips.find((clip) => clip.name === "Aplauso y pausa");
  for (const bone of ["mixamorigLeftArm", "mixamorigRightArm", "mixamorigLeftForeArm", "mixamorigRightForeArm"]) {
    assert.deepEqual(trackValues(calm, bone), trackValues(source, bone), `${bone} should rest during calm dialogue`);
  }
  for (const bone of ["mixamorigLeftArm", "mixamorigLeftForeArm"]) {
    assert.deepEqual(trackValues(oneArm, bone), trackValues(source, bone), `${bone} should rest during one-arm dialogue`);
  }
  for (const bone of ["mixamorigRightArm", "mixamorigRightForeArm"]) {
    assert.notDeepEqual(trackValues(oneArm, bone), trackValues(source, bone), `${bone} should gesture`);
  }
  for (const bone of ["mixamorigLeftArm", "mixamorigRightArm", "mixamorigLeftForeArm", "mixamorigRightForeArm"]) {
    const values = trackValues(applause, bone);
    assert.notDeepEqual(values, trackValues(source, bone), `${bone} should clap`);
    assert.deepEqual(values.slice(0, 4), trackValues(source, bone).slice(0, 4), `${bone} should begin at rest`);
    assert.deepEqual(values.slice(-4), trackValues(source, bone).slice(-4), `${bone} should end at rest`);
  }
  const leftArm = trackValues(applause, "mixamorigLeftArm");
  assert.notDeepEqual(leftArm.slice(6 * 4, 7 * 4), leftArm.slice(8 * 4, 9 * 4),
    "the hands should close and open between claps");
  assert.deepEqual(leftArm.slice(13 * 4, 14 * 4), trackValues(source, "mixamorigLeftArm").slice(13 * 4, 14 * 4),
    "the arms should rest during the pause");
});
