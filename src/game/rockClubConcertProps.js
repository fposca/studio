import * as THREE from "three";
import { sampleConcertMotion } from "./rockClubConcertMotion.js";
import { CONCERT_EDITABLES, defaultConcertTransform } from "./rockClubConcertSettings.js";

export function findConcertBone(model, name) {
  let result = null;
  model?.traverse((object) => {
    if (object.isBone && object.name.replace(/[^a-z0-9]/gi, "").toLowerCase().endsWith(name.toLowerCase())) result = object;
  });
  return result;
}

// A guitar follows the line between both hands in world space. Wrist rotation
// and the skeleton's imported scale never leak into the instrument transform.
export function createRockClubConcertProps(scene, club, clubActors, character, getTransforms, getMotion = () => ({}), getMotionOffsets = () => ({})) {
  const attachments = [];
  const hidden = new Map();
  const fret = new THREE.Vector3(), strum = new THREE.Vector3(), waist = new THREE.Vector3(), bodyPosition = new THREE.Vector3(), rightAxis = new THREE.Vector3();
  const xAxis = new THREE.Vector3(), yAxis = new THREE.Vector3(), zAxis = new THREE.Vector3();
  const upAxis = new THREE.Vector3(0, 1, 0), sideVector = new THREE.Vector3();
  const forward = new THREE.Vector3(), worldRotation = new THREE.Quaternion(), bodyRotation = new THREE.Quaternion(), bodyOrientation = new THREE.Quaternion(), basis = new THREE.Matrix4();
  const offsetRotation = new THREE.Euler(), bodyOffsetWorld = new THREE.Vector3();
  const expectedHand = new THREE.Vector3(), handMotion = new THREE.Vector3(), neckDirection = new THREE.Vector3();

  function attach(entry) {
    const slot = club.slots.get(entry.slot);
    const original = slot?.anchor.getObjectByName(`club-model:${entry.slot}`);
    const performer = entry.id === "neonboy" ? character?.root : clubActors.actors.get(entry.id)?.root;
    const left = findConcertBone(performer, "LeftHand"), right = findConcertBone(performer, "RightHand"), hips = findConcertBone(performer, "Hips");
    const body = findConcertBone(performer, "Spine1") || findConcertBone(performer, "Spine2")
      || findConcertBone(performer, "Spine") || hips;
    if (!original || !performer || !left || !right) return;
    const model = original.clone(true);
    model.visible = true;
    // Remove the floor-stand fitting, then fit the instrument independently.
    model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.scale.setScalar(1);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
    if (size.y < 0.001) return;
    const fittedScale = entry.height / size.y;
    const center = bounds.getCenter(new THREE.Vector3());
    model.scale.setScalar(fittedScale);
    model.position.set(-center.x * fittedScale, -(bounds.min.y + size.y * entry.bodyPivot) * fittedScale, -center.z * fittedScale);
    const tintedMaterials = [];
    if (entry.id === "neonboy") model.traverse((object) => {
      if (!object.isMesh) return;
      const wasArray = Array.isArray(object.material);
      object.material = [object.material].flat().map((material) => {
        const tinted = material.clone();
        tinted.color?.multiply(new THREE.Color(0xff9af2));
        if (tinted.emissive) { tinted.emissive.set(0x8d197f); tinted.emissiveIntensity = 0.25; }
        tintedMaterials.push(tinted);
        return tinted;
      });
      if (!wasArray) object.material = object.material[0];
    });
    const frame = new THREE.Group(), adjustment = new THREE.Group();
    frame.name = `concert-grip:${entry.id}`;
    frame.add(adjustment); adjustment.add(model); scene.add(frame);
    const axes = new THREE.AxesHelper(0.4);
    axes.material.depthTest = false; axes.renderOrder = 10; axes.visible = false;
    adjustment.add(axes);
    // Capture the instrument offset in the animated torso's own coordinates.
    // The skeleton can move and rotate while its Hips translation stays in place.
    performer.updateWorldMatrix(true, true);
    const bodyOffset = new THREE.Vector3(), bodyRestInverse = new THREE.Quaternion();
    const handOffsets = { left: new THREE.Vector3(), right: new THREE.Vector3() };
    if (hips && body) {
      hips.getWorldPosition(waist);
      body.getWorldPosition(bodyPosition);
      body.getWorldQuaternion(bodyRotation);
      performer.getWorldQuaternion(worldRotation);
      forward.set(0, 0, 1).applyQuaternion(worldRotation);
      bodyOffset.copy(waist).addScaledVector(forward, 0.24);
      bodyOffset.y += 0.04;
      bodyOffset.sub(bodyPosition).applyQuaternion(bodyRotation.clone().invert());
      bodyRestInverse.copy(worldRotation).invert().multiply(bodyRotation).invert();
      const inverseBody = bodyRotation.clone().invert();
      left.getWorldPosition(handOffsets.left).sub(bodyPosition).applyQuaternion(inverseBody);
      right.getWorldPosition(handOffsets.right).sub(bodyPosition).applyQuaternion(inverseBody);
    }
    attachments.push({ entry, performer, left, right, hips, body, bodyOffset, bodyRestInverse, handOffsets,
      frame, adjustment, tintedMaterials, axes, side: null, fretHand: null });
    for (const object of [original, club.slots.get(`${entry.slot}-stand`)?.anchor]) {
      if (object && !hidden.has(object)) { hidden.set(object, object.visible); object.visible = false; }
    }
  }

  function update(editor = null, motionSeconds = 0, recordingId = null) {
    for (const item of attachments) {
      item.axes.visible = Boolean(editor?.open && editor.selected === item.entry.id);
      const settings = getTransforms()?.[item.entry.id] || defaultConcertTransform(item.entry.id);
      const track = getMotion()?.[item.entry.id];
      const scrub = editor?.open && editor.frozen && editor.selected === item.entry.id ? editor.scrub : null;
      const recorded = track?.enabled && track.keyframes?.length && recordingId !== item.entry.id
        ? sampleConcertMotion(track, scrub ?? motionSeconds - (getMotionOffsets()?.[item.entry.id] || 0)) : null;
      const pose = recorded ? { ...settings, ...recorded } : settings;
      item.performer.updateWorldMatrix(true, true);
      const fretBone = settings.fretHand === "right" ? item.right : item.left;
      const strumBone = settings.fretHand === "right" ? item.left : item.right;
      fretBone.getWorldPosition(fret); strumBone.getWorldPosition(strum);
      item.performer.getWorldQuaternion(worldRotation);
      forward.set(0, 0, 1).applyQuaternion(worldRotation);
      if (settings.anchor === "waist" && item.hips) {
        item.hips.getWorldPosition(waist);
        item.body.getWorldPosition(bodyPosition);
        item.body.getWorldQuaternion(bodyRotation);
        // Remove the torso's initial rig orientation but keep its animated sway.
        bodyOrientation.copy(bodyRotation).multiply(item.bodyRestInverse);
        rightAxis.set(1, 0, 0).applyQuaternion(bodyOrientation);
        forward.set(0, 0, 1).applyQuaternion(bodyOrientation);
        if (item.fretHand !== settings.fretHand) {
          item.side = Math.sign(rightAxis.dot(sideVector.subVectors(fret, waist))) || 1;
          item.fretHand = settings.fretHand;
        }
        yAxis.copy(rightAxis).multiplyScalar(item.side).addScaledVector(upAxis, 0.12).normalize();
        // Let the fretting hand steer the neck slightly; keep the body at the waist.
        neckDirection.subVectors(fret, strum);
        if (neckDirection.lengthSq() > 0.04) {
          neckDirection.normalize();
          if (neckDirection.dot(yAxis) > 0.35) yAxis.lerp(neckDirection, 0.22).normalize();
        }
        const restStrum = settings.fretHand === "right" ? item.handOffsets.left : item.handOffsets.right;
        expectedHand.copy(restStrum).applyQuaternion(bodyRotation).add(bodyPosition);
        handMotion.subVectors(strum, expectedHand).clampLength(0, 0.18).multiplyScalar(0.4);
        strum.copy(bodyPosition).add(bodyOffsetWorld.copy(item.bodyOffset).applyQuaternion(bodyRotation)).add(handMotion);
      } else {
        yAxis.subVectors(fret, strum);
        if (yAxis.lengthSq() < 0.0025) continue;
        yAxis.normalize();
      }
      zAxis.copy(forward).addScaledVector(yAxis, -forward.dot(yAxis));
      if (zAxis.lengthSq() < 0.001) zAxis.set(0, 1, 0).addScaledVector(yAxis, -yAxis.y);
      zAxis.normalize(); xAxis.crossVectors(yAxis, zAxis).normalize(); zAxis.crossVectors(xAxis, yAxis).normalize();
      basis.makeBasis(xAxis, yAxis, zAxis);
      item.frame.position.copy(strum);
      item.frame.quaternion.setFromRotationMatrix(basis);
      item.adjustment.position.fromArray(pose.position);
      item.adjustment.rotation.copy(offsetRotation.set(...pose.rotation.map(THREE.MathUtils.degToRad)));
      item.adjustment.scale.setScalar(pose.scale);
    }
  }
  function start() {
    if (!attachments.length) CONCERT_EDITABLES.filter((entry) => entry.slot).forEach(attach);
    update();
    return attachments.length;
  }
  function stop() {
    for (const item of attachments.splice(0)) {
      item.axes.dispose();
      item.tintedMaterials.forEach((material) => material.dispose());
      item.frame.removeFromParent();
    }
    for (const [object, visible] of hidden) object.visible = visible;
    hidden.clear();
  }
  return { start, stop, update, getTarget(id, target) {
    const item = attachments.find((attachment) => attachment.entry.id === id);
    return item ? item.frame.getWorldPosition(target) : null;
  } };
}
