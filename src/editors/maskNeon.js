import * as THREE from "three";

export const DEFAULT_MASK_NEON = Object.freeze({
  neonEnabled: false, neonIntensity: 0.75, neonRadius: 3
});
const EFFECT_CACHE = new WeakMap();

export function normalizeMaskNeon(pulse = {}) {
  const result = { ...DEFAULT_MASK_NEON, ...pulse };
  result.neonEnabled = Boolean(result.neonEnabled);
  const intensity = Number(result.neonIntensity);
  const radius = Number(result.neonRadius);
  result.neonIntensity = Number.isFinite(intensity) ? THREE.MathUtils.clamp(intensity, 0, 2) : DEFAULT_MASK_NEON.neonIntensity;
  result.neonRadius = Number.isFinite(radius) ? THREE.MathUtils.clamp(radius, 0.5, 8) : DEFAULT_MASK_NEON.neonRadius;
  return result;
}

function createMaskGlow(model) {
  const face = model.getObjectByName("headfront");
  const head = model.getObjectByName("mixamorigHead") || face;
  const anchor = face?.isBone ? face : head || model;
  const group = new THREE.Group();
  group.name = "NeonMaskGlow";
  group.userData.editorHelper = true;

  model.updateMatrixWorld(true);
  const facePosition = anchor.getWorldPosition(new THREE.Vector3());
  const localPosition = model.worldToLocal(facePosition).add(new THREE.Vector3(0, 0, 0.065));
  group.position.copy(anchor.worldToLocal(model.localToWorld(localPosition)));

  const light = new THREE.PointLight(0xff176b, 0, 3, 2);
  light.name = "NeonMaskPulseLight";
  light.castShadow = false;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ff176b") }, uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float ring = smoothstep(0.08, 0.34, r) * (1.0 - smoothstep(0.45, 0.98, r));
        gl_FragColor = vec4(uColor, ring * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false
  }));
  halo.name = "Halo neon de mascara";
  halo.renderOrder = 3;
  group.add(light, halo);
  anchor.add(group);
  return { group, light, halo, anchor };
}

export function updateMaskNeon(model, pulse, amount, camera) {
  let effect = EFFECT_CACHE.get(model);
  if (!pulse?.enabled || !pulse.neonEnabled || !camera) {
    if (effect) effect.group.visible = false;
    return;
  }
  if (!effect) {
    const group = model.getObjectByName("NeonMaskGlow");
    effect = group
      ? { group, light: group.getObjectByName("NeonMaskPulseLight"), halo: group.getObjectByName("Halo neon de mascara") }
      : createMaskGlow(model);
    EFFECT_CACHE.set(model, effect);
  }
  const { group, light, halo } = effect;
  group.visible = true;
  const strength = THREE.MathUtils.clamp(pulse.neonIntensity ?? 0.75, 0, 2);
  light.color.set(pulse.color || "#ff176b");
  light.distance = THREE.MathUtils.clamp(pulse.neonRadius ?? 3, 0.5, 8);
  light.intensity = strength * (0.45 + amount * 0.55) * 22;
  halo.material.uniforms.uColor.value.copy(light.color);
  halo.material.uniforms.uOpacity.value = strength * amount * 0.27;
  const parentRotation = group.parent.getWorldQuaternion(new THREE.Quaternion());
  halo.quaternion.copy(parentRotation.invert().multiply(camera.quaternion));
}
