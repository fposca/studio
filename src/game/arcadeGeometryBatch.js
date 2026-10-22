import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Keep each editable cabinet as its own root. Repeated screws, buttons, tubes and
// vent slats become instances inside that root, so editor transforms still work.
export function batchArcadeDetails(root, colliders) {
  const protectedMeshes = new Set(colliders);
  function visit(parent) {
    for (const child of [...parent.children]) if (!child.isMesh) visit(child);
    const buckets = new Map();
    for (const mesh of parent.children) {
      if (!mesh.isMesh || mesh.isInstancedMesh || mesh.children.length || protectedMeshes.has(mesh) || Array.isArray(mesh.material)) continue;
      if (!["BoxGeometry", "CylinderGeometry"].includes(mesh.geometry.type)) continue;
      const key = `${mesh.geometry.uuid}/${mesh.material.uuid}/${mesh.castShadow}/${mesh.receiveShadow}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(mesh);
    }
    for (const meshes of buckets.values()) {
      if (meshes.length < 3) continue;
      const source = meshes[0];
      const batch = new THREE.InstancedMesh(source.geometry, source.material, meshes.length);
      batch.name = `arcade-details:${source.name}`;
      batch.castShadow = source.castShadow; batch.receiveShadow = source.receiveShadow;
      meshes.forEach((mesh, index) => { mesh.updateMatrix(); batch.setMatrixAt(index, mesh.matrix); parent.remove(mesh); });
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere(); parent.add(batch);
    }
    // Unlike primitive sizes can also share a draw call within an editable root.
    const mergeBuckets = new Map();
    for (const mesh of parent.children) {
      if (!mesh.isMesh || mesh.isInstancedMesh || mesh.children.length || protectedMeshes.has(mesh) || Array.isArray(mesh.material) || mesh.material.transparent) continue;
      if (!["BoxGeometry", "CylinderGeometry"].includes(mesh.geometry.type)) continue;
      const key = `${mesh.material.uuid}/${mesh.castShadow}/${mesh.receiveShadow}`;
      if (!mergeBuckets.has(key)) mergeBuckets.set(key, []);
      mergeBuckets.get(key).push(mesh);
    }
    for (const meshes of mergeBuckets.values()) {
      if (meshes.length < 3) continue;
      const source = meshes[0];
      const baked = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
      const geometry = mergeGeometries(baked);
      baked.forEach(item => item.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, source.material);
      merged.name = `arcade-assembly:${source.name}`;
      merged.castShadow = source.castShadow; merged.receiveShadow = source.receiveShadow;
      meshes.forEach(mesh => parent.remove(mesh)); parent.add(merged);
    }
  }
  visit(root);
}
