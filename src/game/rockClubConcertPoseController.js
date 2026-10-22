import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { CONCERT_POSE_ACTORS, CONCERT_POSE_BONES } from "./rockClubConcertPose.js";
import { findConcertBone } from "./rockClubConcertProps.js";

export function createRockClubConcertPoseController(scene, character, clubActors, camera = null, domElement = null, onGizmoChange = null) {
  const applied = [];
  const inverse = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const marker = new THREE.Group();
  const axes = new THREE.AxesHelper(0.26);
  axes.material.depthTest = false;
  axes.renderOrder = 100;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffb1e7, depthTest: false, toneMapped: false }));
  dot.renderOrder = 101;
  marker.add(axes, dot);
  marker.visible = false;
  scene.add(marker);
  const proxy = camera && domElement ? new THREE.Object3D() : null;
  const control = proxy ? new TransformControls(camera, domElement) : null;
  let dragging = false, gizmoActor = null, gizmoBone = null;
  const baseWorld = new THREE.Quaternion(), baseOffset = new THREE.Quaternion();
  const delta = new THREE.Quaternion(), solved = new THREE.Quaternion(), angles = new THREE.Euler();
  if (control) {
    scene.add(proxy, control.getHelper());
    control.setMode("rotate");
    control.setSpace("local");
    control.setSize(0.7);
    control.addEventListener("dragging-changed", (event) => { dragging = event.value; });
    control.addEventListener("objectChange", () => {
      if (!gizmoActor || !gizmoBone || !onGizmoChange) return;
      delta.copy(baseWorld).invert().multiply(proxy.quaternion);
      solved.copy(baseOffset).multiply(delta);
      angles.setFromQuaternion(solved, "XYZ");
      onGizmoChange(gizmoActor, gizmoBone, [angles.x, angles.y, angles.z].map(THREE.MathUtils.radToDeg));
    });
  }

  function rootFor(id) {
    return id === "neonboy" ? character?.root : clubActors?.actors.get(id)?.model;
  }
  function available(id) {
    const root = rootFor(id);
    return root ? CONCERT_POSE_BONES.filter((entry) => findConcertBone(root, entry.id)).map((entry) => entry.id) : [];
  }
  function clear() {
    for (const { bone, rotation } of applied) bone.quaternion.multiply(inverse.copy(rotation).invert());
    applied.length = 0;
    marker.visible = false;
  }
  function apply(pose = {}, animated = {}, selected = null) {
    clear();
    for (const { id } of CONCERT_POSE_ACTORS) {
      const root = rootFor(id);
      if (!root) continue;
      const bones = { ...pose[id], ...animated[id] };
      for (const { id: boneId } of CONCERT_POSE_BONES) {
        const values = bones[boneId];
        if (!values?.some((value) => Math.abs(value) > 0.001)) continue;
        const bone = findConcertBone(root, boneId);
        if (!bone) continue;
        const rotation = new THREE.Quaternion().setFromEuler(euler.set(
          ...values.map(THREE.MathUtils.degToRad), "XYZ"));
        bone.quaternion.multiply(rotation);
        applied.push({ bone, rotation });
      }
    }
    const bone = selected?.id && selected?.bone ? findConcertBone(rootFor(selected.id), selected.bone) : null;
    if (bone) {
      bone.updateWorldMatrix(true, false);
      bone.getWorldPosition(marker.position);
      bone.getWorldQuaternion(marker.quaternion);
      if (selected.gizmo && control) {
        marker.visible = false;
        gizmoActor = selected.id; gizmoBone = selected.bone;
        if (control.object !== proxy) control.attach(proxy);
        if (!dragging) {
          proxy.position.copy(marker.position);
          proxy.quaternion.copy(marker.quaternion);
          baseWorld.copy(proxy.quaternion);
          const values = pose[selected.id]?.[selected.bone] || [0, 0, 0];
          baseOffset.setFromEuler(euler.set(...values.map(THREE.MathUtils.degToRad), "XYZ"));
        }
      } else {
        control?.detach();
        gizmoActor = null; gizmoBone = null;
        marker.visible = true;
      }
    } else {
      control?.detach();
      gizmoActor = null; gizmoBone = null;
    }
  }
  function dispose() {
    clear();
    control?.detach();
    control?.getHelper().removeFromParent();
    control?.dispose();
    proxy?.removeFromParent();
    marker.removeFromParent();
    axes.geometry.dispose(); axes.material.dispose();
    dot.geometry.dispose(); dot.material.dispose();
  }
  return { available, clear, apply, dispose,
    hide() { clear(); control?.detach(); gizmoActor = null; gizmoBone = null; },
    isGizmoActive: () => Boolean(control?.object) };
}
