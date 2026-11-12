import * as THREE from "three";

// Halloween-only draw-call reduction. Keep every clickable, animated or named mesh intact.
export function instanceStaticShopBoxes(shop) {
  const excluded = new Set([shop.jukebox, shop.table, shop.coinGroup]);
  const parents = new Set([shop.root, ...shop.displayBins.map(({ group }) => group), ...shop.wallDisplays]);
  for (const child of shop.root.children) if (child.isGroup && !excluded.has(child)) parents.add(child);
  const clickable = new Set(shop.clickable);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const scale = new THREE.Matrix4(), transform = new THREE.Matrix4();
  let merged = 0, draws = 0;
  for (const parent of parents) {
    const batches = new Map();
    for (const mesh of parent.children) {
      if (!mesh.isMesh || mesh.geometry?.type !== "BoxGeometry" || !mesh.visible || mesh.name ||
        mesh.children.length || clickable.has(mesh) || Object.keys(mesh.userData).length ||
        !mesh.material || Array.isArray(mesh.material) || mesh.material.transparent || mesh.material.alphaTest) continue;
      const { widthSegments = 1, heightSegments = 1, depthSegments = 1 } = mesh.geometry.parameters;
      if (widthSegments !== 1 || heightSegments !== 1 || depthSegments !== 1) continue;
      const key = [mesh.material.uuid, mesh.castShadow, mesh.receiveShadow, mesh.renderOrder].join("/");
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(mesh);
    }
    for (const meshes of batches.values()) {
      if (meshes.length < 3) continue;
      const first = meshes[0];
      const batch = new THREE.InstancedMesh(unitBox, first.material, meshes.length);
      batch.name = "Halloween / decoracion estatica instanciada";
      batch.castShadow = first.castShadow;
      batch.receiveShadow = first.receiveShadow;
      batch.renderOrder = first.renderOrder;
      meshes.forEach((mesh, index) => {
        mesh.updateMatrix();
        const { width, height, depth } = mesh.geometry.parameters;
        scale.makeScale(width, height, depth);
        transform.multiplyMatrices(mesh.matrix, scale);
        batch.setMatrixAt(index, transform);
        parent.remove(mesh);
      });
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      parent.add(batch);
      merged += meshes.length;
      draws += meshes.length - 1;
    }
  }
  if (!merged) unitBox.dispose();
  return { instancedMeshes: merged, estimatedDrawCallsSaved: draws };
}
