import * as THREE from "three";
import { ATTACK_CHARGE_SECONDS } from "./gameRules.js";

export function createGameChargeAura(scene) {
  const root = new THREE.Group();
  root.name = "Aura violeta de Neonboy";
  scene.add(root);
  const rings = [
    { y: 0.12, radius: 0.66, speed: 0.65 },
    { y: 0.86, radius: 0.88, speed: -0.9 },
    { y: 1.53, radius: 0.62, speed: 1.1 }
  ].map(({ y, radius, speed }, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index === 1 ? 0xd294ff : 0x8f43ff, transparent: true, opacity: 0,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018 + index * 0.004, 6, 96), material);
    ring.name = "Anillo de energia";
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    root.add(ring);
    return { ring, speed };
  });
  const arcs = [0, 1].map((index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index ? 0xd9aaff : 0x9855ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.015, 6, 96, Math.PI * 1.55), material);
    arc.name = "Arco electrico";
    arc.position.y = 0.95;
    root.add(arc);
    return arc;
  });
  const count = 80, positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const sparks = new THREE.Points(geometry, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { strength: { value: 0 } },
    vertexShader: `
      uniform float strength;
      varying float vStrength;
      void main() {
        vStrength = strength;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp((0.08 + strength * 0.09) * 500.0 / max(0.6, -view.z), 2.0, 18.0);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      varying float vStrength;
      void main() {
        float radius = length(gl_PointCoord * 2.0 - 1.0);
        float alpha = (1.0 - smoothstep(0.1, 1.0, radius)) * (0.25 + vStrength * 0.65);
        gl_FragColor = vec4(vec3(0.68, 0.35, 1.0), alpha);
      }`
  }));
  sparks.name = "Motas del aura";
  sparks.frustumCulled = false;
  root.add(sparks);
  const light = new THREE.PointLight(0x9b4bff, 0, 4.3, 2);
  light.position.y = 1;
  root.add(light);
  root.visible = false;
  return {
    root,
    update(player, seconds, time, firstPerson) {
      const strength = THREE.MathUtils.clamp(seconds / ATTACK_CHARGE_SECONDS, 0, 1);
      root.visible = strength > 0 && !firstPerson && player.health > 0;
      if (!root.visible) return;
      root.position.set(player.x, player.y, player.z);
      rings.forEach(({ ring, speed }, index) => {
        ring.rotation.z = time * speed;
        ring.scale.setScalar(0.82 + strength * 0.3 + Math.sin(time * 5 + index * 2) * 0.035);
        ring.material.opacity = (0.12 + strength * 0.45) * (0.8 + Math.sin(time * 7 + index) * 0.2);
      });
      arcs.forEach((arc, index) => {
        arc.rotation.y = time * (index ? -1.2 : 1.5) + index * Math.PI;
        arc.rotation.z = index ? -0.36 : 0.32;
        arc.material.opacity = (0.08 + strength * 0.37) * (0.8 + Math.sin(time * 9 + index) * 0.2);
      });
      for (let i = 0; i < count; i++) {
        const angle = i * 2.39996 + time * (0.8 + (i % 3) * 0.22);
        const radius = 0.42 + (i % 7) * 0.065 + strength * 0.22;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = 0.1 + ((i * 0.173 + time * (0.7 + (i % 4) * 0.1)) % 1.8);
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      geometry.attributes.position.needsUpdate = true;
      sparks.material.uniforms.strength.value = strength;
      light.intensity = (0.3 + strength * 3.2) * (0.9 + Math.sin(time * 10) * 0.1);
    }
  };
}
