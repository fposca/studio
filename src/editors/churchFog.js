import * as THREE from "three";

export const CHURCH_FOG_BACKGROUNDS = new Set(["sky-ruined-gothic-church", "sky-gothic-church", "sky-cemetery", "sky-night-swamp", "sky-medieval-apocalypse", "sky-medieval-village", "sky-moonlit-peaks", "sky-space", "sky-space-ship"]);
export const DEFAULT_CHURCH_FOG = Object.freeze({
  enabled: false, intensity: 0.5, color: "#768291", height: 3.8, coverage: 32,
  windEnabled: true, windSpeed: 0.7, windDirection: 35, turbulence: 0.6
});

export function normalizeChurchFog(value = {}) {
  const result = { ...DEFAULT_CHURCH_FOG, ...value };
  for (const [key, min, max] of [["intensity", 0, 1], ["height", 0.3, 10], ["coverage", 8, 70],
    ["windSpeed", 0, 3], ["windDirection", 0, 360], ["turbulence", 0, 1]]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, min, max) : DEFAULT_CHURCH_FOG[key];
  }
  result.enabled = Boolean(result.enabled);
  result.windEnabled = Boolean(result.windEnabled);
  if (!/^#[\da-f]{6}$/i.test(result.color)) result.color = DEFAULT_CHURCH_FOG.color;
  return result;
}

let noiseData;
function createNoiseTexture() {
  const size = 64;
  if (!noiseData) {
    noiseData = new Uint8Array(size ** 3);
    const hash = (x, y, z, period) => {
      let n = Math.imul(x % period + 11, 374761393) ^ Math.imul(y % period + 37, 668265263) ^ Math.imul(z % period + 71, 2147483647);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const noise = (x, y, z, period) => {
      const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
      const smooth = n => n * n * (3 - 2 * n);
      const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
      const mix = (a, b, t) => a + (b - a) * t;
      return mix(mix(mix(hash(ix, iy, iz, period), hash(ix + 1, iy, iz, period), fx),
        mix(hash(ix, iy + 1, iz, period), hash(ix + 1, iy + 1, iz, period), fx), fy),
      mix(mix(hash(ix, iy, iz + 1, period), hash(ix + 1, iy, iz + 1, period), fx),
        mix(hash(ix, iy + 1, iz + 1, period), hash(ix + 1, iy + 1, iz + 1, period), fx), fy), fz);
    };
    for (let z = 0; z < size; z += 1) for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      noiseData[(z * size + y) * size + x] = Math.round(255 * (
        noise(x / 16, y / 16, z / 16, 4) * 0.62 +
        noise(x / 8, y / 8, z / 8, 8) * 0.28 + noise(x / 4, y / 4, z / 4, 16) * 0.1));
    }
  }
  const texture = new THREE.Data3DTexture(noiseData, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

export function createChurchFog() {
  const maxSlices = 96;
  const plane = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry().copy(plane);
  plane.dispose();
  geometry.setAttribute("fogSlice", new THREE.InstancedBufferAttribute(Float32Array.from({ length: maxSlices }, (_, i) => i), 1));
  geometry.instanceCount = maxSlices;
  const uniforms = {
    fogNoise: { value: null }, fogTint: { value: new THREE.Color(DEFAULT_CHURCH_FOG.color) },
    fogHeight: { value: 3.8 }, fogRadius: { value: 32 }, fogDensity: { value: 0 },
    fogWind: { value: new THREE.Vector3() }, fogTime: { value: 0 }, fogTurbulence: { value: 0.6 },
    fogCenter: { value: new THREE.Vector3() }, fogRight: { value: new THREE.Vector3() },
    fogUp: { value: new THREE.Vector3() }, fogForward: { value: new THREE.Vector3() },
    fogCamera: { value: new THREE.Vector3() }, fogNear: { value: 0 }, fogFar: { value: 1 },
    fogExtent: { value: 1 }, fogCenterDepth: { value: 0 }, fogSlices: { value: maxSlices }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, glslVersion: THREE.GLSL3,
    vertexShader: `
      in float fogSlice;
      uniform vec3 fogCenter, fogRight, fogUp, fogForward;
      uniform float fogNear, fogFar, fogCenterDepth, fogExtent, fogSlices, fogHeight;
      out vec3 vFogWorld;
      void main() {
        float depth = mix(fogFar, fogNear, (fogSlice + 0.5) / fogSlices);
        vec3 center = fogCenter + fogForward * (depth - fogCenterDepth);
        vec2 lower = vec2(-fogExtent), upper = vec2(fogExtent);
        float margin = abs(fogForward.y) * (fogFar - fogNear) / fogSlices * 0.51;
        // Clip each slice to the height slab before rasterization to limit overdraw.
        if (abs(fogUp.y) >= abs(fogRight.y) && abs(fogUp.y) > 0.001) {
          float padding = abs(fogRight.y) * fogExtent + margin;
          float a = (-0.19 - padding - center.y) / fogUp.y;
          float b = (fogHeight - 0.19 + padding - center.y) / fogUp.y;
          lower.y = clamp(min(a, b), -fogExtent, fogExtent);
          upper.y = clamp(max(a, b), -fogExtent, fogExtent);
        } else if (abs(fogRight.y) > 0.001) {
          float padding = abs(fogUp.y) * fogExtent + margin;
          float a = (-0.19 - padding - center.y) / fogRight.y;
          float b = (fogHeight - 0.19 + padding - center.y) / fogRight.y;
          lower.x = clamp(min(a, b), -fogExtent, fogExtent);
          upper.x = clamp(max(a, b), -fogExtent, fogExtent);
        }
        vec2 plane = mix(lower, upper, position.xy + 0.5);
        vFogWorld = center + fogRight * plane.x + fogUp * plane.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(vFogWorld, 1.0);
      }
    `,
    fragmentShader: `
      precision highp sampler3D;
      uniform sampler3D fogNoise;
      uniform mat4 projectionMatrix;
      uniform vec3 fogTint, fogWind, fogForward, fogCamera;
      uniform float fogHeight, fogRadius, fogDensity, fogTime, fogTurbulence;
      uniform float fogNear, fogFar, fogSlices;
      in vec3 vFogWorld;
      out vec4 fogOutput;
      void main() {
        vec3 ray = normalize(vFogWorld - fogCamera);
        float rayScale = 1.0 / max(0.3, abs(dot(ray, fogForward)));
        float stepLength = (fogFar - fogNear) / fogSlices * rayScale;
        // Stratified samples hide layer boundaries without moving noise every frame.
        float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5;
        vec3 world = vFogWorld + ray * jitter * stepLength;
        float altitude = world.y + 0.19;
        float radial = length(world.xz) / fogRadius;
        if (altitude <= 0.0 || altitude >= fogHeight || radial >= 1.0) discard;
        vec3 p = (world - fogWind) * vec3(0.032, 0.095, 0.032);
        float broad = texture(fogNoise, p).r;
        float detail = texture(fogNoise, p * 2.37 + vec3(0.17, fogTime * 0.008, 0.43)).r;
        float cloud = smoothstep(0.27, 0.73, mix(broad, broad * 0.62 + detail * 0.38, fogTurbulence));
        float vertical = smoothstep(0.0, 0.16, altitude) *
          (1.0 - smoothstep(fogHeight * 0.65, fogHeight, altitude));
        vertical *= mix(1.0, 0.72, altitude / fogHeight);
        float edge = 1.0 - smoothstep(0.6, 1.0, radial);
        float alpha = 1.0 - exp(-cloud * vertical * edge * fogDensity * stepLength);
        if (alpha < 0.001) discard;
        vec3 tint = fogTint * (0.82 + detail * 0.24);
        vec4 clip = projectionMatrix * viewMatrix * vec4(world, 1.0);
        gl_FragDepth = clip.z / clip.w * 0.5 + 0.5;
        fogOutput = linearToOutputTexel(vec4(tint, alpha));
      }
    `,
    transparent: true, depthWrite: false, depthTest: true, toneMapped: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Niebla volumetrica de iglesia";
  mesh.userData.editorHelper = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  mesh.visible = false;
  const cameraPosition = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const centerOffset = new THREE.Vector3();
  let source, config = DEFAULT_CHURCH_FOG;
  mesh.userData.animate = (settings, time, inChurch, quality = 1, floorVisible = true) => {
    if (source !== settings) { source = settings; config = normalizeChurchFog(settings); }
    mesh.visible = Boolean(inChurch && floorVisible && config.enabled && config.intensity > 0);
    if (!mesh.visible) return;
    uniforms.fogNoise.value ||= createNoiseTexture();
    uniforms.fogTint.value.set(config.color);
    uniforms.fogHeight.value = config.height;
    uniforms.fogRadius.value = config.coverage;
    uniforms.fogDensity.value = config.intensity * 0.8;
    uniforms.fogTurbulence.value = config.turbulence;
    const seconds = config.windEnabled ? time * 0.001 * config.windSpeed : 0;
    const angle = THREE.MathUtils.degToRad(config.windDirection);
    uniforms.fogWind.value.set(Math.cos(angle) * seconds, 0, Math.sin(angle) * seconds);
    uniforms.fogTime.value = seconds;
    geometry.instanceCount = quality < 0.7 ? 48 : maxSlices;
    uniforms.fogSlices.value = geometry.instanceCount;
  };
  // View-aligned slices blend back-to-front and use the normal scene depth buffer.
  // Camera uniforms are refreshed here so PNG/video framing and camera shake stay aligned.
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(forward);
    const center = uniforms.fogCenter.value.set(0, config.height * 0.5 - 0.19, 0);
    const depth = centerOffset.copy(center).sub(cameraPosition).dot(forward);
    const extent = Math.hypot(config.coverage, config.height * 0.5);
    const near = Math.max(camera.near + 0.02, depth - extent);
    uniforms.fogCamera.value.copy(cameraPosition);
    uniforms.fogRight.value.setFromMatrixColumn(camera.matrixWorld, 0);
    uniforms.fogUp.value.setFromMatrixColumn(camera.matrixWorld, 1);
    uniforms.fogForward.value.copy(forward);
    uniforms.fogCenterDepth.value = depth;
    uniforms.fogExtent.value = extent;
    uniforms.fogNear.value = near;
    uniforms.fogFar.value = Math.max(near, Math.min(camera.far, depth + extent));
  };
  mesh.userData.dispose = () => {
    geometry.dispose(); material.dispose(); uniforms.fogNoise.value?.dispose();
  };
  return mesh;
}
