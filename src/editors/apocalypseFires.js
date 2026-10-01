import * as THREE from "three";

export const MAX_APOCALYPSE_FIRES = 6;
const DEFAULT_POSITIONS = [
  [-5.5, -7], [9, -10], [-14, -24], [13, 15], [-12, 18], [17, -33]
];
export const DEFAULT_APOCALYPSE_FIRES = {
  enabled: false, count: 2, flameSize: 1, smokeDensity: 0.95,
  smokeHeight: 8, smokeSpeed: 0.75, wind: 0.3, smokeColor: "#514b48",
  positions: DEFAULT_POSITIONS.map(([x, z]) => ({ x, z }))
};

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? THREE.MathUtils.clamp(number, min, max) : fallback;
};

export function normalizeApocalypseFires(value = {}) {
  return {
    enabled: Boolean(value.enabled ?? DEFAULT_APOCALYPSE_FIRES.enabled),
    count: Math.round(clamp(value.count, 0, MAX_APOCALYPSE_FIRES, DEFAULT_APOCALYPSE_FIRES.count)),
    flameSize: clamp(value.flameSize, 0.4, 2, DEFAULT_APOCALYPSE_FIRES.flameSize),
    smokeDensity: clamp(value.smokeDensity, 0, 1.5, DEFAULT_APOCALYPSE_FIRES.smokeDensity),
    smokeHeight: clamp(value.smokeHeight, 2, 14, DEFAULT_APOCALYPSE_FIRES.smokeHeight),
    smokeSpeed: clamp(value.smokeSpeed, 0, 2.5, DEFAULT_APOCALYPSE_FIRES.smokeSpeed),
    wind: clamp(value.wind, -1.5, 1.5, DEFAULT_APOCALYPSE_FIRES.wind),
    smokeColor: /^#[\da-f]{6}$/i.test(value.smokeColor) ? value.smokeColor : DEFAULT_APOCALYPSE_FIRES.smokeColor,
    positions: DEFAULT_POSITIONS.map(([x, z], index) => ({
      x: clamp(value.positions?.[index]?.x, -60, 60, x),
      z: clamp(value.positions?.[index]?.z, -60, 60, z)
    }))
  };
}

function instancedPlanes(perSource, attributeName) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry().copy(plane);
  plane.dispose();
  const indexes = new Float32Array(MAX_APOCALYPSE_FIRES * perSource);
  const seeds = new Float32Array(indexes.length);
  for (let i = 0; i < indexes.length; i += 1) {
    indexes[i] = Math.floor(i / perSource);
    seeds[i] = i % perSource;
  }
  geometry.setAttribute("fireSource", new THREE.InstancedBufferAttribute(indexes, 1));
  geometry.setAttribute(attributeName, new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.instanceCount = 0;
  return geometry;
}

const smokeVertex = `
  attribute float fireSource, smokeLayer;
  uniform vec3 sources[6];
  uniform float smokeTime, smokeHeight, smokeWind, smokeSize;
  varying vec2 vSmokeUv;
  varying float vSmokeLayer;
  void main() {
    vec3 source = sources[int(fireSource + 0.5)];
    float layer = smokeLayer - 0.5;
    float drift = smokeWind * smokeHeight * 0.42;
    vec3 center = source + vec3(drift * 0.5, smokeHeight * 0.5 + 0.18, layer * 0.32);
    vec4 viewCenter = viewMatrix * vec4(center, 1.0);
    float width = (1.45 + smokeHeight * 0.18) * smokeSize;
    viewCenter.xy += vec2(position.x * width + position.y * drift,
      position.y * smokeHeight);
    gl_Position = projectionMatrix * viewCenter;
    vSmokeUv = uv;
    vSmokeLayer = smokeLayer;
  }
`;

const smokeFragment = `
  uniform vec3 smokeTint;
  uniform float smokeTime, smokeSpeed, smokeDensity;
  varying vec2 vSmokeUv;
  varying float vSmokeLayer;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }
  float cloud(vec2 p) {
    return noise(p) * 0.56 + noise(p * 2.13) * 0.29 + noise(p * 4.27) * 0.15;
  }
  void main() {
    float h = vSmokeUv.y;
    float travel = smokeTime * smokeSpeed * 0.32;
    vec2 p = vec2(vSmokeUv.x * 5.8 + vSmokeLayer * 7.3, h * 7.2 - travel);
    p.x += (cloud(vec2(h * 2.4 + vSmokeLayer, travel * 0.55)) - 0.5) * 1.4;
    float broad = cloud(p * 0.67);
    float detail = cloud(p * 1.45 + vec2(2.7, -1.9));
    float sway = (cloud(vec2(h * 3.8, travel * 0.38 + vSmokeLayer * 3.2)) - 0.5) * (0.16 + h * 0.66);
    sway += sin(h * 10.0 + travel * 0.8 + vSmokeLayer * 2.7) * h * 0.13;
    float billow = cloud(vec2(h * 7.3 + vSmokeLayer * 3.7, travel * 0.55));
    float width = mix(0.12, 0.36, h) * (0.5 + billow * 0.9) *
      (0.77 + 0.28 * sin(h * 13.0 - travel * 0.6 + vSmokeLayer * 2.2));
    float distanceToPlume = abs(vSmokeUv.x - 0.5 - sway) / width;
    float ragged = distanceToPlume + (broad - 0.5) * 0.8;
    float outline = 1.0 - smoothstep(0.38, 1.04, ragged);
    float wisps = smoothstep(0.29, 0.69, broad * 0.43 + detail * 0.57);
    float fade = smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.65, 1.0, h));
    float alpha = outline * wisps * fade * smokeDensity * (0.45 + vSmokeLayer * 0.06);
    if (alpha < 0.008) discard;
    vec3 color = mix(smokeTint * vec3(0.65, 0.49, 0.42), smokeTint * 1.45,
      smoothstep(0.04, 0.7, h));
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const flameVertex = `
  attribute float fireSource, flameSeed;
  uniform vec3 sources[6];
  uniform float fireTime, flameSize;
  varying vec2 vFlameUv;
  varying float vFlameSeed;
  void main() {
    vec3 source = sources[int(fireSource + 0.5)];
    float seed = flameSeed;
    float height = flameSize * (0.55 + fract(seed * 0.618) * 0.72);
    float x = (fract(seed * 0.7549) - 0.5) * 1.05 * flameSize;
    float z = (fract(seed * 0.429) - 0.5) * 0.72 * flameSize;
    vec4 viewCenter = viewMatrix * vec4(source + vec3(x, height * 0.5, z), 1.0);
    float sway = sin(fireTime * 7.0 + seed * 2.4 + uv.y * 6.0) * uv.y * 0.1;
    viewCenter.xy += vec2(position.x * (0.29 + fract(seed * 0.71) * 0.19) * flameSize + sway,
      position.y * height);
    gl_Position = projectionMatrix * viewCenter;
    vFlameUv = uv;
    vFlameSeed = seed;
  }
`;

const flameFragment = `
  uniform float fireTime;
  varying vec2 vFlameUv;
  varying float vFlameSeed;
  void main() {
    float h = vFlameUv.y;
    float center = 0.5 + sin(h * 6.0 + fireTime * 5.8 + vFlameSeed * 2.2) * h * 0.12;
    float width = ((1.0 - h) * 0.41 + 0.015) *
      (0.88 + 0.12 * sin(h * 13.0 + fireTime * 6.2 + vFlameSeed));
    float body = 1.0 - smoothstep(width * 0.64, width, abs(vFlameUv.x - center));
    float alpha = body * smoothstep(0.0, 0.11, h) * (1.0 - smoothstep(0.76, 1.0, h));
    alpha *= 0.34 + 0.09 * sin(fireTime * 12.0 + vFlameSeed * 3.7);
    if (alpha < 0.01) discard;
    vec3 color = mix(vec3(1.0, 0.3, 0.025), vec3(0.72, 0.045, 0.005), h);
    color = mix(vec3(1.0, 0.84, 0.34), color, smoothstep(0.02, 0.5, h));
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

export function createApocalypseFires() {
  const group = new THREE.Group();
  group.name = "Incendios y humo de apocalipsis";
  group.userData.editorHelper = true;
  group.visible = false;
  const sources = DEFAULT_POSITIONS.map(([x, z]) => new THREE.Vector3(x, 0.02, z));
  const common = { sources: { value: sources }, smokeTime: { value: 0 }, fireTime: { value: 0 } };
  const smokeGeometry = instancedPlanes(2, "smokeLayer");
  const smokeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      sources: common.sources, smokeTime: common.smokeTime,
      smokeHeight: { value: 8 }, smokeWind: { value: 0.3 }, smokeSize: { value: 1 },
      smokeSpeed: { value: 0.75 }, smokeDensity: { value: 0.95 },
      smokeTint: { value: new THREE.Color("#514b48") }
    },
    vertexShader: smokeVertex, fragmentShader: smokeFragment,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    toneMapped: false
  });
  const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
  smoke.name = "Columnas de humo irregular";
  smoke.frustumCulled = false;
  smoke.renderOrder = 2;
  const flameGeometry = instancedPlanes(12, "flameSeed");
  const flameMaterial = new THREE.ShaderMaterial({
    uniforms: { sources: common.sources, fireTime: common.fireTime, flameSize: { value: 1 } },
    vertexShader: flameVertex, fragmentShader: flameFragment,
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
  });
  const flames = new THREE.Mesh(flameGeometry, flameMaterial);
  flames.name = "Llamas de incendios";
  flames.frustumCulled = false;
  flames.renderOrder = 3;
  group.add(smoke, flames);

  const lights = sources.map((position, index) => {
    const light = new THREE.PointLight(index % 2 ? 0xff9b53 : 0xff7032, 0, 12, 2);
    light.position.copy(position).y = 0.9;
    group.add(light);
    return light;
  });
  let input, settings = DEFAULT_APOCALYPSE_FIRES;
  group.userData.animate = (value, time, active) => {
    if (input !== value) { input = value; settings = normalizeApocalypseFires(value); }
    group.visible = Boolean(active && settings.enabled && settings.count > 0);
    if (!group.visible) return;
    sources.forEach((position, index) => {
      position.set(settings.positions[index].x, 0.02, settings.positions[index].z);
      const light = lights[index];
      light.position.set(position.x, 0.9, position.z);
      light.visible = index < settings.count;
      if (light.visible) light.intensity = (12 + settings.flameSize * 23) *
        (0.9 + 0.1 * Math.sin(time * 0.009 + index * 2.1));
    });
    smokeGeometry.instanceCount = settings.count * 2;
    flameGeometry.instanceCount = settings.count * 12;
    smokeMaterial.uniforms.smokeTime.value = time * 0.001;
    smokeMaterial.uniforms.smokeHeight.value = settings.smokeHeight;
    smokeMaterial.uniforms.smokeWind.value = settings.wind;
    smokeMaterial.uniforms.smokeSize.value = settings.flameSize;
    smokeMaterial.uniforms.smokeSpeed.value = settings.smokeSpeed;
    smokeMaterial.uniforms.smokeDensity.value = settings.smokeDensity;
    smokeMaterial.uniforms.smokeTint.value.set(settings.smokeColor);
    common.fireTime.value = time * 0.001;
    flameMaterial.uniforms.flameSize.value = settings.flameSize;
    smoke.visible = settings.smokeDensity > 0;
  };
  group.userData.dispose = () => {
    smokeGeometry.dispose(); smokeMaterial.dispose();
    flameGeometry.dispose(); flameMaterial.dispose();
  };
  group.userData.stats = { maxSources: MAX_APOCALYPSE_FIRES, smokeSheetsPerSource: 2, flameSheetsPerSource: 12 };
  return group;
}
