import * as THREE from "three";
import { DRAGON_FLYING_CLIP, isDragonModel } from "./dragonAnimation.js";

const FIRE_FORWARD = new THREE.Vector3(0, 0, 1);
const PARTICLE_COUNT = 95;

function createFireParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const seeds = new Float32Array(PARTICLE_COUNT);
  const angles = new Float32Array(PARTICLE_COUNT);
  const spreads = new Float32Array(PARTICLE_COUNT);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    seeds[index] = index / PARTICLE_COUNT;
    angles[index] = index * 2.39996323;
    spreads[index] = (Math.sin(index * 73.15) * 43758.5453) % 1;
    if (spreads[index] < 0) spreads[index] += 1;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute("aSpread", new THREE.BufferAttribute(spreads, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uReach: { value: 1 }
    },
    vertexShader: `
      attribute float aSeed;
      attribute float aAngle;
      attribute float aSpread;
      uniform float uTime;
      uniform float uReach;
      varying float vLife;
      varying float vSpread;
      void main() {
        float life = fract(aSeed + uTime * 0.78);
        float radius = (0.025 + life * 0.3) * sqrt(aSpread);
        float twist = aAngle + uTime * 7.0 + life * 5.0;
        vec3 flame = vec3(cos(twist) * radius, sin(twist) * radius, life * 2.4 * uReach);
        flame.x += sin(life * 17.0 - uTime * 10.0 + aAngle) * life * 0.055;
        flame.y += cos(life * 13.0 + uTime * 8.0 + aAngle) * life * 0.055;
        vec4 viewPosition = modelViewMatrix * vec4(flame, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp((9.0 + life * 13.0) * (9.0 / max(2.0, -viewPosition.z)) *
          (0.75 + aSpread * 0.5), 2.0, 38.0);
        vLife = life;
        vSpread = aSpread;
      }
    `,
    fragmentShader: `
      uniform float uStrength;
      varying float vLife;
      varying float vSpread;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
        float glow = exp(-radius * radius * 3.4);
        float core = exp(-radius * radius * 12.0);
        float fade = 1.0 - smoothstep(0.65, 1.0, vLife);
        vec3 color = mix(vec3(1.0, 0.7, 0.18), vec3(0.9, 0.16, 0.015),
          smoothstep(0.05, 0.82, vLife));
        float alpha = (glow * 0.3 + core * 0.25) * fade * uStrength *
          (0.7 + vSpread * 0.3);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: false
  });
  const particles = new THREE.Points(geometry, material);
  particles.name = "DragonFireParticles";
  particles.userData.editorHelper = true;
  particles.frustumCulled = false;
  return particles;
}

function createFirePlume() {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 0 },
      uReach: { value: 1 }
    },
    vertexShader: `
      uniform float uReach;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 flame = vec3((uv.x - 0.5) * 1.05, 0.0, uv.y * 2.4 * uReach);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(flame, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float along = vUv.y;
        float center = 0.5 + sin(along * 14.0 - uTime * 9.0) * 0.055 * along;
        float width = (0.1 + 0.33 * sin(along * 3.14159)) *
          (1.0 - smoothstep(0.8, 1.0, along));
        float edge = 1.0 - smoothstep(width * 0.32, width, abs(vUv.x - center));
        float flicker = 0.78 + 0.22 * sin(along * 34.0 - uTime * 13.0 + vUv.x * 12.0);
        float alpha = edge * flicker * (1.0 - smoothstep(0.7, 1.0, along)) *
          smoothstep(0.0, 0.06, along) * uStrength * 0.32;
        vec3 color = mix(vec3(1.0, 0.78, 0.19), vec3(0.9, 0.09, 0.01),
          smoothstep(0.08, 0.95, along));
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const plume = new THREE.Group();
  plume.name = "DragonFirePlume";
  plume.userData.editorHelper = true;
  for (let index = 0; index < 3; index += 1) {
    const layer = new THREE.Mesh(geometry, material);
    layer.rotation.z = index * Math.PI / 3;
    layer.frustumCulled = false;
    layer.userData.editorHelper = true;
    plume.add(layer);
  }
  return plume;
}

export function ensureDragonFire(model) {
  if (!isDragonModel(model)) return null;
  const existing = model.getObjectByName("DragonFire");
  if (existing) {
    if (!existing.getObjectByName("DragonFirePlume")) existing.add(createFirePlume());
    return existing;
  }
  const fire = new THREE.Group();
  fire.name = "DragonFire";
  fire.userData.editorHelper = true;
  fire.visible = false;
  const particles = createFireParticles();
  const light = new THREE.PointLight(0xff6920, 0, 4.5, 2);
  light.name = "DragonFireLight";
  light.userData.editorHelper = true;
  light.position.z = 0.35;
  fire.add(createFirePlume(), particles, light);
  model.add(fire);
  return fire;
}

export function updateDragonFire(model, delta) {
  const fire = ensureDragonFire(model);
  if (!fire) return;
  const animation = model.userData.modelAnimation;
  const elapsed = model.userData.dragonFlight?.elapsed || 0;
  const cycle = elapsed % 5.1;
  const active = animation?.clip === DRAGON_FLYING_CLIP && animation.playing
    && animation.speed > 0 && delta > 0;
  const attack = THREE.MathUtils.clamp((cycle - 0.4) / 0.2, 0, 1);
  const release = THREE.MathUtils.clamp((2.2 - cycle) / 0.35, 0, 1);
  const strength = active ? attack * release * (0.85 + Math.sin(elapsed * 24) * 0.15) : 0;
  fire.visible = strength > 0.015;
  const light = fire.getObjectByName("DragonFireLight");
  light.intensity = fire.visible ? strength * 4.5 : 0;
  if (!fire.visible) return;

  const mouth = model.getObjectByName("Bone_024");
  const neck = model.getObjectByName("Bone_029");
  if (!mouth || !neck) {
    fire.visible = false;
    light.intensity = 0;
    return;
  }
  const mouthPosition = model.worldToLocal(mouth.getWorldPosition(new THREE.Vector3()));
  const neckPosition = model.worldToLocal(neck.getWorldPosition(new THREE.Vector3()));
  const direction = mouthPosition.clone().sub(neckPosition);
  direction.y *= 0.55;
  direction.normalize();
  fire.position.copy(mouthPosition).addScaledVector(direction, 0.08);
  fire.quaternion.setFromUnitVectors(FIRE_FORWARD, direction);
  const reach = THREE.MathUtils.clamp((cycle - 0.4) / 0.45, 0.1, 1);
  const plume = fire.getObjectByName("DragonFirePlume");
  for (const uniforms of [
    fire.getObjectByName("DragonFireParticles").material.uniforms,
    plume.children[0].material.uniforms
  ]) {
    uniforms.uTime.value = elapsed % 1000;
    uniforms.uStrength.value = strength;
    uniforms.uReach.value = reach;
  }
}
