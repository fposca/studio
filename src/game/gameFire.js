import * as THREE from "three";

const flameVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flameFragment = `
  uniform float uTime;
  uniform float uSeed;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float height = vUv.y;
    float drift = (sin(uTime * 3.4 + height * 8.0 + uSeed) * 0.06
      + sin(uTime * 6.1 + height * 17.0 + uSeed * 1.7) * 0.022) * height;
    float distanceFromCore = abs(vUv.x - 0.5 - drift);
    float width = mix(0.36, 0.007, pow(height, 1.25));
    width *= 0.92 + 0.08 * sin(height * 22.0 - uTime * 4.0 + uSeed);
    float edge = 1.0 - smoothstep(width * 0.6, width, distanceFromCore);
    float base = smoothstep(0.0, 0.13, height);
    float tip = 1.0 - smoothstep(0.83, 1.0, height);
    float shimmer = 0.84 + 0.16 * sin(height * 27.0 - uTime * 8.0 + uSeed)
      * sin(height * 13.0 + uTime * 5.0);
    float alpha = edge * base * tip * shimmer * uStrength;
    if (alpha < 0.01) discard;
    float core = 1.0 - smoothstep(width * 0.1, width * 0.66, distanceFromCore);
    core *= 1.0 - smoothstep(0.52, 0.9, height);
    vec3 color = mix(vec3(0.72, 0.07, 0.015), vec3(1.0, 0.43, 0.035),
      smoothstep(0.0, 0.7, height));
    color = mix(color, vec3(1.0, 0.78, 0.2), core * 0.86);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

function flameSheet(width, height, seed, strength) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uStrength: { value: strength } },
    vertexShader: flameVertex, fragmentShader: flameFragment,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  sheet.castShadow = sheet.receiveShadow = false;
  sheet.frustumCulled = false;
  return sheet;
}

export function createGameFire(parent, { x, y, z, size = 1, intensity = 15, distance = 10, seed = 0 }) {
  const root = new THREE.Group();
  root.name = "Fuego de antorcha";
  root.position.set(x, y, z);
  parent.add(root);
  const sheets = [
    flameSheet(0.78 * size, 0.91 * size, seed, 0.84),
    flameSheet(0.78 * size, 0.91 * size, seed + 1.6, 0.68),
    flameSheet(0.43 * size, 0.66 * size, seed + 3.4, 0.64)
  ];
  sheets[0].position.y = sheets[1].position.y = 0.46 * size;
  sheets[1].rotation.y = Math.PI / 2;
  sheets[2].position.set(0.13 * size, 0.34 * size, -0.03 * size);
  sheets[2].rotation.y = Math.PI / 4;
  sheets.forEach((sheet) => root.add(sheet));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.16 * size, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xff7d24, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glow.position.y = 0.11 * size;
  glow.scale.y = 0.48;
  root.add(glow);
  const sparks = 7;
  const sparkGeometry = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(sparks * 3);
  sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const sparkPoints = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({ color: 0xffba55,
    size: 0.075 * size, sizeAttenuation: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sparkPoints.frustumCulled = false;
  root.add(sparkPoints);
  const light = new THREE.PointLight(0xff9b52, intensity, distance, 2);
  light.position.y = 0.24 * size;
  root.add(light);
  function update(time, brightness = 1) {
    const phase = time * 0.006 + seed;
    sheets.forEach((sheet, index) => {
      sheet.material.uniforms.uTime.value = time * 0.001;
      const wobble = Math.sin(phase * (1.7 + index * 0.24) + index * 2.1);
      sheet.scale.y = 1 + wobble * 0.1 + Math.sin(phase * 2.6 + index) * 0.045;
      sheet.rotation.z = wobble * 0.075;
    });
    for (let index = 0; index < sparks; index++) {
      const progress = (time * (0.00034 + index * 0.000045) + index / sparks + seed * 0.11) % 1;
      sparkPositions[index * 3] = Math.sin(phase + index * 3.7) * 0.19 * size * progress;
      sparkPositions[index * 3 + 1] = (0.15 + progress * 0.86) * size;
      sparkPositions[index * 3 + 2] = Math.cos(phase * 0.7 + index * 2.3) * 0.16 * size * progress;
    }
    sparkGeometry.attributes.position.needsUpdate = true;
    light.intensity = intensity * brightness * (0.88 + Math.sin(phase * 2.3) * 0.08 + Math.sin(phase * 5.1) * 0.04);
    glow.material.opacity = 0.25 + Math.sin(phase * 2.3) * 0.04;
  }
  update(0);
  return { root, light, update };
}
