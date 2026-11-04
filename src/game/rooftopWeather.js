import * as THREE from "three";
import { roofRandom } from "./rooftopMaterials.js";

export function createRooftopWeather(root, puddles) {
  const count = 780;
  const positions = new Float32Array(count * 6);
  const drops = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    drops[i * 4] = (roofRandom(i + 1000) - .5) * 29;
    drops[i * 4 + 1] = roofRandom(i + 2000) * 14;
    drops[i * 4 + 2] = (roofRandom(i + 3000) - .5) * 29;
    drops[i * 4 + 3] = .2 + roofRandom(i + 4000) * .35;
  }
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3); attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", attribute);
  const rain = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x9badbf, transparent: true, opacity: .31, depthWrite: false }));
  rain.frustumCulled = false; root.add(rain);
  const rippleCount = 26;
  const rippleMaterial = new THREE.MeshBasicMaterial({ color: 0x8198ac, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide });
  const ripples = new THREE.InstancedMesh(new THREE.RingGeometry(.92, 1, 16), rippleMaterial, rippleCount);
  const dummy = new THREE.Object3D(); root.add(ripples);
  return { update(dt, elapsed, reducedMotion) {
    rain.visible = !reducedMotion; ripples.visible = !reducedMotion;
    if (reducedMotion) return;
    const wind = .8 + Math.sin(elapsed * .37) * .35;
    for (let i = 0; i < count; i++) {
      const d = i * 4, index = i * 6;
      drops[d] += dt * wind; drops[d + 1] -= dt * (10 + roofRandom(i + 5000) * 5);
      if (drops[d + 1] < .02) drops[d + 1] = 13.7;
      if (drops[d] > 14.5) drops[d] = -14.5;
      const hiddenByStair = Math.abs(drops[d]) < 2 && drops[d + 2] > 8.8 && drops[d + 1] < 3.2;
      const length = hiddenByStair ? 0 : drops[d + 3];
      positions[index] = drops[d]; positions[index + 1] = drops[d + 1]; positions[index + 2] = drops[d + 2];
      positions[index + 3] = drops[d] - length * .09 * wind;
      positions[index + 4] = drops[d + 1] + length; positions[index + 5] = drops[d + 2] - length * .025;
    }
    attribute.needsUpdate = true;
    for (let i = 0; i < rippleCount; i++) {
      const puddle = puddles[i % puddles.length];
      const age = (elapsed * .7 + roofRandom(i + 6000)) % 1;
      const spread = .025 + age * .19;
      dummy.position.set(puddle.x + (roofRandom(i + 6100) - .5) * puddle.radius, .026, puddle.z + (roofRandom(i + 6200) - .5) * puddle.radius);
      dummy.rotation.x = -Math.PI / 2; dummy.scale.setScalar(spread); dummy.updateMatrix();
      ripples.setMatrixAt(i, dummy.matrix);
    }
    ripples.instanceMatrix.needsUpdate = true;
  } };
}
