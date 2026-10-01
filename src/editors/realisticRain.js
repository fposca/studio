import * as THREE from "three";
import { createRainSurfaceSampler } from "./rainSurface.js";

export const DEFAULT_RAIN = Object.freeze({
  enabled: false, intensity: 0.8, directionX: 0.15, directionZ: 0, color: "#b9cbd5",
  speed: 1, dropSize: 1, gusts: 0.35, splashes: true, splashIntensity: 0.65
});

export function normalizeRain(value = {}) {
  const result = { ...DEFAULT_RAIN, ...value };
  for (const [key, min, max] of [["intensity", 0, 1.8], ["directionX", -1, 1], ["directionZ", -1, 1],
    ["speed", 0, 2.5], ["dropSize", 0.5, 2], ["gusts", 0, 1], ["splashIntensity", 0, 1]]) {
    const n = Number(result[key]);
    result[key] = Number.isFinite(n) ? THREE.MathUtils.clamp(n, min, max) : DEFAULT_RAIN[key];
  }
  result.enabled = Boolean(result.enabled); result.splashes = Boolean(result.splashes);
  if (!/^#[\da-f]{6}$/i.test(result.color)) result.color = DEFAULT_RAIN.color;
  return result;
}

const MAX_DROPS = 7200;
const MAX_CONTACTS = 360;
const CONTACT_STRIDE = MAX_DROPS / MAX_CONTACTS;
const HEIGHT = 16;
const motionShader = `
  uniform float rainTime, rainSize, rainGusts, rainSplash;
  uniform vec2 rainWind;
  attribute vec4 rainSeed;
  attribute vec4 rainGround;
  varying vec2 vRainUv;
  varying float vRainAlpha;
  vec2 windAt(float t) {
    return rainWind * (3.8 + rainGusts * sin(t * 0.73) * 1.8) +
      rainGusts * vec2(sin(t * 0.47), cos(t * 0.61)) * 0.6;
  }
  vec2 windIntegral(float a, float b) {
    return rainWind * (3.8 * (b - a) + rainGusts * 1.8 / 0.73 * (cos(a * 0.73) - cos(b * 0.73))) +
      rainGusts * 0.6 * vec2((cos(a * 0.47) - cos(b * 0.47)) / 0.47, (sin(b * 0.61) - sin(a * 0.61)) / 0.61);
  }
`;

function makeGeometry(seeds, ground, kinds) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry().copy(plane);
  plane.dispose();
  geometry.setAttribute("rainSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.setAttribute("rainGround", new THREE.InstancedBufferAttribute(ground, 4).setUsage(THREE.DynamicDrawUsage));
  if (kinds) geometry.setAttribute("rainKind", new THREE.InstancedBufferAttribute(kinds, 1));
  geometry.instanceCount = 0;
  return geometry;
}

export function createRealisticRain() {
  const group = new THREE.Group();
  group.name = "Lluvia realista"; group.userData.editorHelper = true; group.visible = false;
  let seed = 76489;
  const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  const seeds = new Float32Array(MAX_DROPS * 4), ground = new Float32Array(MAX_DROPS * 4);
  for (let i = 0; i < MAX_DROPS; i += 1) {
    const span = i % CONTACT_STRIDE === 0 ? 32 : i % 3 === 0 ? 96 : 48;
    seeds.set([(random() - 0.5) * span, (random() - 0.5) * span, random(), random()], i * 4);
    ground.set([-0.015, 0, 1, 0], i * 4);
  }
  const splashSeeds = new Float32Array(MAX_CONTACTS * 4 * 4);
  const splashGround = new Float32Array(splashSeeds.length), kinds = new Float32Array(MAX_CONTACTS * 4);
  for (let i = 0; i < MAX_CONTACTS; i += 1) for (let j = 0; j < 4; j += 1) {
    const offset = i * CONTACT_STRIDE * 4;
    splashSeeds.set(seeds.subarray(offset, offset + 4), (i * 4 + j) * 4); kinds[i * 4 + j] = j;
  }
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    rainTime: { value: 0 }, rainSize: { value: 1 }, rainGusts: { value: 0.35 },
    rainWind: { value: new THREE.Vector2() }, rainTint: { value: new THREE.Color(DEFAULT_RAIN.color) },
    rainSplash: { value: 0.65 }
  };
  const streakMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, fog: true,
    vertexShader: `
      ${motionShader}
      #include <fog_pars_vertex>
      void main() {
        float fallSpeed = 8.0 + rainSeed.w * 5.0;
        float cycle = fract(rainTime * fallSpeed / ${HEIGHT.toFixed(1)} + rainSeed.z);
        float remaining = (1.0 - cycle) * ${HEIGHT.toFixed(1)} / fallSpeed;
        vec2 horizontal = rainSeed.xy - windIntegral(rainTime, rainTime + remaining);
        vec3 world = vec3(horizontal.x, rainGround.x + (1.0 - cycle) * ${HEIGHT.toFixed(1)}, horizontal.y);
        vec2 wind = windAt(rainTime);
        vec3 velocity = normalize(vec3(wind.x, -fallSpeed, wind.y));
        vec3 viewVelocity = mat3(viewMatrix) * velocity;
        vec2 side = normalize(vec2(viewVelocity.y, -viewVelocity.x) + vec2(0.00001, 0.0));
        float streakLength = (0.17 + rainSeed.w * 0.22) * rainSize;
        float width = (0.009 + rainSeed.w * 0.006) * rainSize;
        vec4 mvPosition = viewMatrix * vec4(world, 1.0);
        mvPosition.xy += vec2(-side.y, side.x) * position.y * max(width, streakLength * length(viewVelocity.xy));
        mvPosition.xy += side * position.x * width;
        vRainUv = uv;
        vRainAlpha = (0.22 + rainSeed.w * 0.27) * smoothstep(0.0, 0.08, (1.0 - cycle) * ${HEIGHT.toFixed(1)}) *
          smoothstep(0.0, 0.06, cycle) * smoothstep(0.7, 2.0, -mvPosition.z) * (1.0 - smoothstep(55.0, 95.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform vec3 rainTint;
      varying vec2 vRainUv;
      varying float vRainAlpha;
      #include <fog_pars_fragment>
      void main() {
        float crossSection = exp(-pow((vRainUv.x - 0.5) * 4.0, 2.0));
        float ends = smoothstep(0.0, 0.22, vRainUv.y) * (1.0 - smoothstep(0.7, 1.0, vRainUv.y));
        float alpha = crossSection * ends * vRainAlpha;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(rainTint * 1.15, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `
  });
  const impactMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    vertexShader: `
      ${motionShader}
      attribute float rainKind;
      varying float vRainKind;
      #include <fog_pars_vertex>
      void main() {
        float fallSpeed = 8.0 + rainSeed.w * 5.0;
        float age = fract(rainTime * fallSpeed / ${HEIGHT.toFixed(1)} + rainSeed.z) * ${HEIGHT.toFixed(1)} / fallSpeed;
        float life = 0.22 + rainSeed.w * 0.1;
        vec3 normal = normalize(rainGround.yzw);
        vec3 tangent = normalize(cross(normal, vec3(0.0, 0.0, 1.0)));
        vec3 bitangent = cross(normal, tangent);
        vec3 world = vec3(rainSeed.x, rainGround.x, rainSeed.y) + normal * 0.006;
        vRainAlpha = max(0.0, 1.0 - age / life) * rainSplash;
        if (rainKind < 0.5) {
          float diameter = (0.04 + min(age, life) * 0.7) * rainSize;
          world += (tangent * position.x + bitangent * position.y) * diameter;
        } else {
          float angle = rainKind * 2.39996 + rainSeed.z * 6.28318;
          float elevation = age * (0.85 + rainSeed.w * 0.35) - 4.9 * age * age;
          world += (tangent * cos(angle) + bitangent * sin(angle)) * age * 0.4 * rainSize + normal * max(0.0, elevation);
          vRainAlpha *= step(0.0, elevation) * 0.65;
        }
        vec4 mvPosition = viewMatrix * vec4(world, 1.0);
        if (rainKind > 0.5) mvPosition.xy += position.xy * 0.02 * rainSize;
        vRainAlpha *= 1.0 - smoothstep(20.0, 38.0, -mvPosition.z);
        vRainUv = uv; vRainKind = rainKind;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform vec3 rainTint;
      varying vec2 vRainUv;
      varying float vRainAlpha, vRainKind;
      #include <fog_pars_fragment>
      void main() {
        float radius = length(vRainUv * 2.0 - 1.0);
        float alpha;
        if (vRainKind < 0.5) {
          float edge = max(0.06, fwidth(radius));
          alpha = (1.0 - smoothstep(0.0, edge, abs(radius - 0.78))) * 0.38;
        } else alpha = exp(-radius * radius * 4.5);
        alpha *= vRainAlpha;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(rainTint, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `
  });
  const streaks = new THREE.Mesh(makeGeometry(seeds, ground), streakMaterial);
  const impacts = new THREE.Mesh(makeGeometry(splashSeeds, splashGround, kinds), impactMaterial);
  streaks.name = "Gotas de lluvia"; impacts.name = "Salpicaduras de lluvia";
  for (const mesh of [streaks, impacts]) { mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.userData.editorHelper = true; group.add(mesh); }
  let source, config = DEFAULT_RAIN, previousTerrain, previousY;
  group.userData.animate = (settings, time, quality = 1, floor = {}) => {
    if (source !== settings) { source = settings; config = normalizeRain(settings); }
    group.visible = config.enabled && config.intensity > 0;
    if (!group.visible) return;
    uniforms.rainTime.value = time * 0.001 * config.speed;
    uniforms.rainSize.value = config.dropSize; uniforms.rainGusts.value = config.gusts;
    uniforms.rainWind.value.set(config.directionX, config.directionZ);
    uniforms.rainTint.value.set(config.color); uniforms.rainSplash.value = config.splashIntensity;
    const density = config.intensity / 1.8 * THREE.MathUtils.clamp(quality, 0.25, 1);
    streaks.geometry.instanceCount = Math.max(1, Math.round(MAX_DROPS * density));
    impacts.geometry.instanceCount = Math.ceil(streaks.geometry.instanceCount / CONTACT_STRIDE) * 4;
    impacts.visible = config.splashes && config.splashIntensity > 0 && floor.visible !== false && floor.surface !== "infernal";
    const terrain = floor.terrain || null, y = floor.y ?? -0.015;
    if (previousTerrain !== terrain || previousY !== y) {
      previousTerrain = terrain; previousY = y;
      const sampler = createRainSurfaceSampler(terrain, y);
      for (let i = 0; i < MAX_DROPS; i += 1) ground.set([y, 0, 1, 0], i * 4);
      for (let i = 0; i < MAX_CONTACTS; i += 1) {
        const offset = i * CONTACT_STRIDE * 4;
        const hit = sampler.sample(seeds[offset], seeds[offset + 1]);
        ground.set([hit.height, ...hit.normal], offset);
        for (let j = 0; j < 4; j += 1) splashGround.set(ground.subarray(offset, offset + 4), (i * 4 + j) * 4);
      }
      sampler.dispose();
      streaks.geometry.attributes.rainGround.needsUpdate = true;
      impacts.geometry.attributes.rainGround.needsUpdate = true;
    }
  };
  group.userData.dispose = () => {
    for (const mesh of [streaks, impacts]) { mesh.geometry.dispose(); mesh.material.dispose(); }
  };
  return group;
}
