import * as THREE from "three";

const ATLASES = {
  man: new URL("../assets/neonboy-animaciones/peaton-hombre-camina-celular.crowd.webp", import.meta.url).href,
  woman: new URL("../assets/neonboy-animaciones/peaton-mujer-camina-celular.crowd.webp", import.meta.url).href,
  executive: new URL("../assets/neonboy-animaciones/ejecutivo-camina-celular.crowd.webp", import.meta.url).href,
  elder: new URL("../assets/neonboy-animaciones/senora-camina-celular.crowd.webp", import.meta.url).href,
  fatman: new URL("../assets/neonboy-animaciones/bsas/fatman-caminando.crowd.webp", import.meta.url).href,
  oldman: new URL("../assets/neonboy-animaciones/bsas/viejo-caminando.crowd.webp", import.meta.url).href,
  parrotman: new URL("../assets/neonboy-animaciones/bsas/viejo-loro-caminando.crowd.webp", import.meta.url).href,
};
// Ordinary alpha-cutout quads, NOT instanced SkinnedMesh. Poses and view angles
// are baked offline from the original GLBs. Seven draw calls for the whole crowd.
export function createCityCrowdLod(group, capacity = 64, { codeVision } = {}) {
  const batches = new Map(), transform = new THREE.Object3D();
  const textureLoader = new THREE.TextureLoader();
  let disposed = false;
  const ready = Promise.all(Object.entries(ATLASES).map(async ([type, url]) => {
    const map = await textureLoader.loadAsync(url);
    if (disposed) { map.dispose(); return; }
    map.colorSpace = THREE.SRGBColorSpace;
    map.generateMipmaps = false; map.minFilter = THREE.LinearFilter;
    const geometry = new THREE.PlaneGeometry(1.2, 2.4).translate(0, 1.1, 0);
    const tiles = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 2), 2);
    tiles.setUsage(THREE.DynamicDrawUsage); geometry.setAttribute("crowdTile", tiles);
    const material = new THREE.MeshBasicMaterial({ map, color: 0x8a9cad, alphaTest: .35, depthWrite: true });
    material.onBeforeCompile = shader => {
      shader.vertexShader = "attribute vec2 crowdTile;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>",
        "#include <uv_vertex>\nvMapUv = (vMapUv + crowdTile) / vec2(8.0, 5.0);");
    };
    material.customProgramCacheKey = () => "city-crowd-atlas-v1";
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.name = "Ciudadanos / LOD " + type; mesh.userData.cityKeep = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0; mesh.frustumCulled = false; group.add(mesh);
    codeVision?.register(mesh, "crowd");
    batches.set(type, { mesh, tiles });
  })).catch(error => { if (!disposed) console.warn("No se pudo cargar el LOD urbano", error); });
  function update(actors, camera, player) {
    for (const batch of batches.values()) batch.mesh.count = 0;
    const eye = camera?.position || { x: player.x, z: player.z + 4 };
    for (const actor of actors) {
      if (actor.lod !== "middle" && actor.lod !== "far") continue;
      const batch = batches.get(actor.config.type); if (!batch) continue;
      const { x, z } = actor.root.position;
      const angle = Math.atan2(eye.x - x, eye.z - z);
      const direction = THREE.MathUtils.euclideanModulo(Math.round((angle - actor.root.rotation.y) / (Math.PI / 4)), 8);
      const frame = actor.pause > 0 || actor.synchronized || actor.waiting ? 4 : Math.floor(actor.poseTime * 4) % 4;
      transform.position.copy(actor.root.position); transform.rotation.set(0, angle, 0); transform.updateMatrix();
      const i = batch.mesh.count++;
      batch.mesh.setMatrixAt(i, transform.matrix);
      batch.tiles.setXY(i, direction, 4 - frame);
    }
    for (const { mesh, tiles } of batches.values()) {
      mesh.visible = mesh.count > 0; mesh.instanceMatrix.needsUpdate = true; tiles.needsUpdate = true;
    }
  }
  // Resources belong to group and are disposed by the city's shared traversal.
  return { ready, update, batches, dispose() { disposed = true; for (const { mesh } of batches.values()) { codeVision?.unregister(mesh); mesh.dispose(); } } };
}
