import * as THREE from "three";

// Only index nearby static masonry. Rain contacts never raycast thousands of tiles per frame.
export function createRainSurfaceSampler(terrain, fallbackY, extent = 17) {
  const cells = new Map(), cellSize = 2;
  const matrix = new THREE.Matrix4(), local = new THREE.Matrix4(), box = new THREE.Box3();
  terrain?.updateWorldMatrix(true, true);
  terrain?.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.visible || !mesh.geometry) return;
    if (!Array.isArray(mesh.material) && mesh.material?.transparent) return;
    for (let parent = mesh.parent; parent && parent !== terrain; parent = parent.parent) if (!parent.visible) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const count = mesh.isInstancedMesh ? mesh.count : 1;
    for (let i = 0; i < count; i += 1) {
      if (mesh.isInstancedMesh) { mesh.getMatrixAt(i, local); matrix.multiplyMatrices(mesh.matrixWorld, local); }
      else matrix.copy(mesh.matrixWorld);
      box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix);
      if (box.max.x < -extent || box.min.x > extent || box.max.z < -extent || box.min.z > extent) continue;
      const entry = { geometry: mesh.geometry, matrix: matrix.clone(), box: box.clone() };
      for (let x = Math.floor(Math.max(-extent, box.min.x) / cellSize); x <= Math.floor(Math.min(extent, box.max.x) / cellSize); x += 1) {
        for (let z = Math.floor(Math.max(-extent, box.min.z) / cellSize); z <= Math.floor(Math.min(extent, box.max.z) / cellSize); z += 1) {
          const key = `${x},${z}`;
          if (!cells.has(key)) cells.set(key, []);
          cells.get(key).push(entry);
        }
      }
    }
  });
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const proxy = new THREE.Mesh(undefined, material);
  const unusedGeometry = proxy.geometry;
  const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 128);
  const normalMatrix = new THREE.Matrix3(), normal = new THREE.Vector3(), hits = [];
  return {
    sample(x, z) {
      let height = fallbackY;
      const result = { height, normal: [0, 1, 0] };
      raycaster.ray.origin.set(x, 64, z);
      for (const entry of cells.get(`${Math.floor(x / cellSize)},${Math.floor(z / cellSize)}`) || []) {
        if (x < entry.box.min.x || x > entry.box.max.x || z < entry.box.min.z || z > entry.box.max.z) continue;
        proxy.geometry = entry.geometry; proxy.matrixWorld.copy(entry.matrix); hits.length = 0;
        proxy.raycast(raycaster, hits);
        for (const hit of hits) if (hit.point.y >= height) {
          height = hit.point.y;
          normal.copy(hit.face.normal).applyMatrix3(normalMatrix.getNormalMatrix(entry.matrix)).normalize();
          if (normal.y < 0) normal.negate();
          result.height = height; result.normal = normal.toArray();
        }
      }
      return result;
    },
    dispose() { cells.clear(); material.dispose(); unusedGeometry.dispose(); }
  };
}
