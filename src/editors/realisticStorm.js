import * as THREE from "three";

export const DEFAULT_STORM = Object.freeze({
  enabled: false,
  intensity: 0.6,
  cloudDensity: 0.68,
  cloudSpeed: 0.32,
  windDirection: 25,
  lightningFrequency: 0.45,
  branching: 0.62,
  flash: 0.75,
  lightningColor: "#dce8ff"
});

export function normalizeStorm(value = {}) {
  const result = { ...DEFAULT_STORM, ...value };
  for (const [key, min, max] of [["intensity", 0, 1], ["cloudDensity", 0, 1], ["cloudSpeed", 0, 2],
    ["windDirection", 0, 360], ["lightningFrequency", 0, 1], ["branching", 0, 1], ["flash", 0, 1]]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, min, max) : DEFAULT_STORM[key];
  }
  result.enabled = Boolean(result.enabled);
  if (!/^#[\da-f]{6}$/i.test(result.lightningColor)) result.lightningColor = DEFAULT_STORM.lightningColor;
  return result;
}

let cloudNoiseData;
function createCloudNoise() {
  const size = 256;
  if (!cloudNoiseData) {
    cloudNoiseData = new Uint8Array(size * size);
    const hash = (x, y, period) => {
      let n = Math.imul((x % period + period) % period + 17, 374761393) ^
        Math.imul((y % period + period) % period + 43, 668265263);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const noise = (x, y, period) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const smooth = value => value * value * (3 - 2 * value);
      const fx = smooth(x - ix), fy = smooth(y - iy);
      return THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(hash(ix, iy, period), hash(ix + 1, iy, period), fx),
        THREE.MathUtils.lerp(hash(ix, iy + 1, period), hash(ix + 1, iy + 1, period), fx), fy);
    };
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const value = noise(x / 64, y / 64, 4) * 0.48 + noise(x / 32, y / 32, 8) * 0.28 +
        noise(x / 16, y / 16, 16) * 0.16 + noise(x / 8, y / 8, 32) * 0.08;
      cloudNoiseData[y * size + x] = Math.round(value * 255);
    }
  }
  const texture = new THREE.DataTexture(cloudNoiseData, size, size, THREE.RedFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function randomSource(seed) {
  return () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
    return (seed >>> 0) / 4294967296;
  };
}

function createCloudDome() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      cloudNoise: { value: createCloudNoise() }, cloudTime: { value: 0 }, cloudDensity: { value: 0.68 },
      cloudIntensity: { value: 0.6 }, cloudDirection: { value: new THREE.Vector2() },
      lightningFlash: { value: 0 }, lightningTint: { value: new THREE.Color(DEFAULT_STORM.lightningColor) }
    },
    vertexShader: `
      varying vec3 vStormDirection;
      void main() {
        vStormDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }
    `,
    fragmentShader: `
      uniform sampler2D cloudNoise;
      uniform float cloudTime, cloudDensity, cloudIntensity, lightningFlash;
      uniform vec2 cloudDirection;
      uniform vec3 lightningTint;
      varying vec3 vStormDirection;
      void main() {
        vec3 direction = normalize(vStormDirection);
        float horizon = smoothstep(0.015, 0.22, direction.y);
        if (horizon <= 0.001) discard;
        vec2 skyUv = vec2(atan(direction.z, direction.x) / 6.2831853 + 0.5,
          acos(clamp(direction.y, 0.0, 1.0)) / 3.14159265);
        vec2 drift = cloudDirection * cloudTime;
        float broad = texture2D(cloudNoise, skyUv * vec2(2.3, 1.45) + drift).r;
        float medium = texture2D(cloudNoise, skyUv * vec2(5.7, 3.2) - drift * 1.7 + 0.23).r;
        float detail = texture2D(cloudNoise, skyUv * vec2(13.0, 7.5) + drift * 2.3 + 0.57).r;
        float field = broad * 0.58 + medium * 0.29 + detail * 0.13;
        float threshold = mix(0.68, 0.36, cloudDensity);
        float cloud = smoothstep(threshold - 0.12, threshold + 0.12, field);
        cloud *= horizon * (0.42 + cloudIntensity * 0.58);
        float underside = smoothstep(0.28, 0.82, field);
        vec3 color = mix(vec3(0.055, 0.075, 0.105), vec3(0.25, 0.31, 0.38), underside);
        color = mix(color, lightningTint * 1.35, lightningFlash * (0.32 + broad * 0.68));
        gl_FragColor = vec4(color, cloud * 0.88);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    fog: false
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 28, 0, Math.PI * 2, 0, Math.PI / 2), material);
  dome.name = "Nubes volumetricas de tormenta";
  dome.userData.editorHelper = true;
  dome.frustumCulled = false;
  dome.renderOrder = -900;
  dome.scale.set(180, 58, 180);
  const cameraPosition = new THREE.Vector3();
  dome.onBeforeRender = (_renderer, _scene, camera) => {
    camera.getWorldPosition(cameraPosition);
    dome.position.copy(cameraPosition);
    dome.updateMatrixWorld();
  };
  return dome;
}

function createBoltMeshes(maxSegments = 120) {
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: DEFAULT_STORM.lightningColor, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
  });
  const glowMaterial = coreMaterial.clone();
  glowMaterial.opacity = 0;
  const core = new THREE.InstancedMesh(geometry, coreMaterial, maxSegments);
  const glow = new THREE.InstancedMesh(geometry, glowMaterial, maxSegments);
  core.name = "Nucleo de los rayos";
  glow.name = "Halo de los rayos";
  for (const mesh of [core, glow]) {
    mesh.userData.editorHelper = true;
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.renderOrder = 5;
  }
  return { geometry, core, glow, coreMaterial, glowMaterial, maxSegments };
}

function fillBoltInstances(bolts, strike, branching) {
  const random = randomSource(9137 + strike * 104729);
  const end = new THREE.Vector3((random() - 0.5) * 16, 0.04, -7 + (random() - 0.5) * 12);
  const start = new THREE.Vector3(end.x + (random() - 0.5) * 5, 20 + random() * 4, end.z + (random() - 0.5) * 4);
  const main = [start.clone()];
  let x = start.x, z = start.z;
  const mainSteps = 34;
  for (let i = 1; i <= mainSteps; i += 1) {
    const progress = i / mainSteps;
    x = THREE.MathUtils.lerp(x, end.x, 0.19) + (random() - 0.5) * (1.15 - progress * 0.55);
    z = THREE.MathUtils.lerp(z, end.z, 0.19) + (random() - 0.5) * (0.9 - progress * 0.4);
    main.push(new THREE.Vector3(i === mainSteps ? end.x : x,
      THREE.MathUtils.lerp(start.y, end.y, progress), i === mainSteps ? end.z : z));
  }
  const segments = main.slice(1).map((point, i) => [main[i], point, 1]);
  const branchAttempts = Math.round(branching * 7);
  for (let branch = 0; branch < branchAttempts; branch += 1) {
    const originIndex = 5 + Math.floor(random() * 23);
    let point = main[originIndex].clone();
    const direction = new THREE.Vector3((random() - 0.5) * 1.8, -0.24 - random() * 0.45, (random() - 0.5) * 1.8).normalize();
    const branchSteps = 3 + Math.floor(random() * 5);
    for (let step = 0; step < branchSteps && segments.length < bolts.maxSegments; step += 1) {
      const next = point.clone().addScaledVector(direction, 0.65 + random() * 0.75);
      direction.x += (random() - 0.5) * 0.4;
      direction.z += (random() - 0.5) * 0.4;
      direction.y -= random() * 0.06;
      direction.normalize();
      segments.push([point, next, 0.55 - step / branchSteps * 0.25]);
      point = next;
    }
  }
  const up = new THREE.Vector3(0, 1, 0), midpoint = new THREE.Vector3(), direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion(), matrix = new THREE.Matrix4(), scale = new THREE.Vector3();
  segments.slice(0, bolts.maxSegments).forEach(([from, to, weight], index) => {
    direction.subVectors(to, from);
    const length = direction.length();
    midpoint.addVectors(from, to).multiplyScalar(0.5);
    quaternion.setFromUnitVectors(up, direction.normalize());
    scale.set(0.032 * weight, length, 0.032 * weight);
    matrix.compose(midpoint, quaternion, scale);
    bolts.core.setMatrixAt(index, matrix);
    scale.set(0.16 * weight, length * 1.015, 0.16 * weight);
    matrix.compose(midpoint, quaternion, scale);
    bolts.glow.setMatrixAt(index, matrix);
  });
  bolts.core.count = bolts.glow.count = Math.min(segments.length, bolts.maxSegments);
  bolts.core.instanceMatrix.needsUpdate = bolts.glow.instanceMatrix.needsUpdate = true;
  return end;
}

function lightningPulse(phase) {
  const pulse = (start, duration, strength) => {
    const local = (phase - start) / duration;
    return local > 0 && local < 1 ? Math.sin(local * Math.PI) * strength : 0;
  };
  return Math.max(pulse(0.035, 0.075, 1), pulse(0.16, 0.11, 0.72), pulse(0.34, 0.07, 0.34));
}

export function createRealisticStorm() {
  const group = new THREE.Group();
  group.name = "Tormenta realista";
  group.userData.editorHelper = true;
  group.visible = false;
  const clouds = createCloudDome();
  const bolts = createBoltMeshes();
  const flashLight = new THREE.PointLight(DEFAULT_STORM.lightningColor, 0, 75, 1.4);
  flashLight.name = "Destello de tormenta";
  flashLight.userData.editorHelper = true;
  flashLight.visible = false;
  group.add(clouds, bolts.glow, bolts.core, flashLight);
  let source, config = DEFAULT_STORM, strikeKey = "";
  const strikePosition = new THREE.Vector3();
  group.userData.animate = (settings, time, quality = 1) => {
    if (source !== settings) { source = settings; config = normalizeStorm(settings); }
    group.visible = config.enabled && config.intensity > 0;
    if (!group.visible) {
      bolts.core.visible = bolts.glow.visible = flashLight.visible = false;
      flashLight.intensity = 0;
      clouds.material.uniforms.lightningFlash.value = 0;
      return;
    }
    const seconds = time * 0.001;
    const angle = THREE.MathUtils.degToRad(config.windDirection);
    const uniforms = clouds.material.uniforms;
    uniforms.cloudTime.value = seconds * config.cloudSpeed * 0.006;
    uniforms.cloudDensity.value = config.cloudDensity;
    uniforms.cloudIntensity.value = config.intensity;
    uniforms.cloudDirection.value.set(Math.cos(angle), Math.sin(angle));
    uniforms.lightningTint.value.set(config.lightningColor);
    const period = THREE.MathUtils.lerp(9, 1.8, config.lightningFrequency);
    const strike = Math.floor(seconds / period);
    const phase = seconds - strike * period;
    const buildKey = `${strike}:${Math.round(config.branching * quality * 100)}`;
    if (buildKey !== strikeKey) {
      strikeKey = buildKey;
      strikePosition.copy(fillBoltInstances(bolts, strike, config.branching * THREE.MathUtils.clamp(quality, 0.35, 1)));
      flashLight.position.copy(strikePosition).setY(7);
    }
    const pulse = lightningPulse(phase) * config.intensity;
    const boltVisible = pulse > 0.012;
    bolts.core.visible = bolts.glow.visible = boltVisible;
    bolts.coreMaterial.color.set(config.lightningColor);
    bolts.glowMaterial.color.set(config.lightningColor);
    bolts.coreMaterial.opacity = pulse;
    bolts.glowMaterial.opacity = pulse * 0.18;
    flashLight.color.set(config.lightningColor);
    flashLight.visible = boltVisible && config.flash > 0;
    flashLight.intensity = pulse * config.flash * 850;
    uniforms.lightningFlash.value = pulse * config.flash;
  };
  group.userData.dispose = () => {
    clouds.geometry.dispose();
    clouds.material.uniforms.cloudNoise.value.dispose();
    clouds.material.dispose();
    bolts.geometry.dispose();
    bolts.coreMaterial.dispose();
    bolts.glowMaterial.dispose();
  };
  group.userData.debug = { lightningPulse };
  return group;
}
