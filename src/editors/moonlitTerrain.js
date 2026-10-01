import * as THREE from "three";

export function moonlitGroundHeight(x, z) {
  const distance = Math.hypot(x, z);
  const relief = Math.sin(x * 0.18 + z * 0.07) * 0.12
    + Math.cos(z * 0.23 - x * 0.08) * 0.09
    + Math.sin(x * 0.57 + z * 0.41) * 0.035;
  const outerRidge = THREE.MathUtils.smoothstep(distance, 15, 75)
    * (0.32 + Math.sin(x * 0.08 - z * 0.1) * 0.2);
  return THREE.MathUtils.smoothstep(distance, 5, 19) * relief + outerRidge;
}

export function createMoonlitTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(280, 280, 192, 192);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(index, moonlitGroundHeight(positions.getX(index), -positions.getY(index)));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
