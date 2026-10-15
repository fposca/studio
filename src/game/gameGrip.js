import * as THREE from "three";

// This HD rig has one hand bone, not individual finger joints. A local morph
// curls the glove around the grip without changing the shared GLB or the wrist.
export function createHandGrip(model, hand) {
  if (!hand) return null;
  const morphs = [];
  model.traverse((mesh) => {
    if (!mesh.isSkinnedMesh || mesh.geometry.morphAttributes.position?.length) return;
    const boneIndex = mesh.skeleton.bones.indexOf(hand);
    if (boneIndex < 0) return;
    const source = mesh.geometry, positions = source.attributes.position;
    const indices = source.attributes.skinIndex, weights = source.attributes.skinWeight;
    const toHand = new THREE.Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[boneIndex], mesh.bindMatrix);
    const fromHand = toHand.clone().invert();
    const target = source.clone(), deformed = target.attributes.position;
    const point = new THREE.Vector3(), original = new THREE.Vector3();
    const changed = new Uint8Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      let weight = 0;
      for (let c = 0; c < 4; c++) if (indices.getComponent(i, c) === boneIndex) weight += weights.getComponent(i, c);
      if (weight < 0.5) continue;
      original.fromBufferAttribute(positions, i);
      point.copy(original).applyMatrix4(toHand);
      if (point.y <= 0.105 || point.y > 0.27) continue;
      const angle = Math.min(2.65, (point.y - 0.105) / 0.052);
      const radius = 0.059 + point.z;
      point.set(point.x, 0.105 + Math.sin(angle) * radius, Math.cos(angle) * radius - 0.059);
      point.applyMatrix4(fromHand).lerp(original, 1 - THREE.MathUtils.smoothstep(weight, 0.5, 0.95));
      deformed.setXYZ(i, point.x, point.y, point.z);
      changed[i] = 1;
    }
    target.computeVertexNormals();
    const geometry = source.clone();
    const delta = new Float32Array(positions.count * 3), normals = new Float32Array(delta.length);
    for (let i = 0; i < positions.count; i++) if (changed[i]) for (let c = 0; c < 3; c++) {
      delta[i * 3 + c] = deformed.getComponent(i, c) - positions.getComponent(i, c);
      normals[i * 3 + c] = target.attributes.normal.getComponent(i, c) - source.attributes.normal.getComponent(i, c);
    }
    geometry.morphTargetsRelative = true;
    geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(delta, 3)];
    geometry.morphAttributes.normal = [new THREE.Float32BufferAttribute(normals, 3)];
    geometry.morphAttributes.position[0].name = "weaponGrip";
    target.dispose();
    mesh.geometry = geometry;
    mesh.updateMorphTargets();
    morphs.push({ mesh, source, geometry });
  });
  const socket = new THREE.Group();
  socket.name = "Empunadura derecha";
  socket.position.set(0, 0.11, -0.055);
  // The thumb is on the hand's -X side: the blade must exit on that side.
  socket.rotation.z = Math.PI / 2;
  model.updateMatrixWorld(true);
  const scale = hand.getWorldScale(new THREE.Vector3()).x;
  socket.scale.setScalar(1 / scale);
  hand.add(socket);
  return {
    socket,
    update(weight) { morphs.forEach(({ mesh }) => { mesh.morphTargetInfluences[0] = weight; }); },
    dispose() {
      socket.removeFromParent();
      morphs.forEach(({ mesh, source, geometry }) => { mesh.geometry = source; mesh.updateMorphTargets(); geometry.dispose(); });
    }
  };
}
