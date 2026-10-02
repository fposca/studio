import * as THREE from "three";
import nebulaGroundUrl from "../assets/environments/space-nebula-ground-v1.png";

export const DEFAULT_SPACE_SETTINGS = {
  starsEnabled: true,
  starIntensity: 1,
  twinkleDuration: 3.5,
  nebulaIntensity: 1,
  coreEnabled: true,
  rotationSpeed: 0.22,
  glowIntensity: 1,
  lightingEnabled: true,
  lightIntensity: 1
};

export function normalizeSpaceSettings(input = {}) {
  const number = (key, min, max) => THREE.MathUtils.clamp(
    Number.isFinite(Number(input[key])) ? Number(input[key]) : DEFAULT_SPACE_SETTINGS[key], min, max
  );
  return {
    starsEnabled: input.starsEnabled !== false,
    starIntensity: number("starIntensity", 0, 2),
    twinkleDuration: number("twinkleDuration", 0.5, 12),
    nebulaIntensity: number("nebulaIntensity", 0, 1.5),
    coreEnabled: input.coreEnabled !== false,
    rotationSpeed: number("rotationSpeed", 0, 1.5),
    glowIntensity: number("glowIntensity", 0, 2),
    lightingEnabled: input.lightingEnabled !== false,
    lightIntensity: number("lightIntensity", 0, 2)
  };
}

function randomSource(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function createNebulaFloorGeometry() {
  const geometry = new THREE.PlaneGeometry(280, 280, 96, 96);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const distance = Math.hypot(x, y);
    const relief = THREE.MathUtils.smoothstep(distance, 7, 18) *
      (Math.sin(x * 0.31 + y * 0.13) * 0.11 + Math.cos(y * 0.25 - x * 0.09) * 0.09);
    position.setZ(i, relief);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createNebulaFloorMaterial(color = "#d9e0e2") {
  const map = new THREE.TextureLoader().load(nebulaGroundUrl);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.MirroredRepeatWrapping;
  map.repeat.set(5, 5);
  map.anisotropy = 16;
  const material = new THREE.MeshStandardMaterial({
    color, map, roughness: 1, metalness: 0, envMapIntensity: 0.08,
    transparent: true, depthWrite: false
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNebulaTime = { value: 0 };
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
      #include <common>
      varying vec2 vNebulaGround;
    `).replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vNebulaGround = position.xy;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
      #include <common>
      uniform float uNebulaTime;
      varying vec2 vNebulaGround;
    `).replace("#include <color_fragment>", `
      #include <color_fragment>
      vec3 paintedGas = diffuseColor.rgb;
      float flow = 0.86 + 0.14 * sin(vNebulaGround.x * 0.075 + uNebulaTime * 0.13) *
        cos(vNebulaGround.y * 0.063 - uNebulaTime * 0.09);
      diffuseColor.rgb = paintedGas * flow * 0.86;
    `).replace("#include <alphamap_fragment>", `
      #include <alphamap_fragment>
      diffuseColor.a *= 1.0 - smoothstep(38.0, 115.0, length(vNebulaGround));
    `).replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      totalEmissiveRadiance += paintedGas * flow * 0.2;
    `);
    material.userData.nebulaShader = shader;
  };
  material.customProgramCacheKey = () => "volumetric-nebula-floor-v1";
  return material;
}

export function createSpaceScene() {
  const group = new THREE.Group();
  group.name = "Nebulosa y estrella espacial";
  group.visible = false;
  const random = randomSource(45821);
  const gasColors = [0x328c91, 0x9b4678, 0x8b754e];
  const gas = gasColors.map((color, layer) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(78 * 3);
    const sizes = new Float32Array(78);
    const phases = new Float32Array(78);
    for (let i = 0; i < 78; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 4 + Math.sqrt(random()) * 40;
      positions.set([Math.cos(angle) * radius, 0.12 + random() * 1.35, Math.sin(angle) * radius], i * 3);
      sizes[i] = 1.4 + random() * 3.5;
      phases[i] = random() * Math.PI * 2;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("gasSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("gasPhase", new THREE.BufferAttribute(phases, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uStrength: { value: 0.85 }
      },
      vertexShader: `
        attribute float gasSize;
        attribute float gasPhase;
        varying float vPhase;
        void main() {
          vPhase = gasPhase;
          vec4 view = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * view;
          gl_PointSize = clamp(gasSize * 340.0 / max(3.0, -view.z), 6.0, 105.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uStrength;
        varying float vPhase;
        void main() {
          vec2 p = (gl_PointCoord - 0.5) * 2.0;
          float detail = sin(p.x * 7.0 + sin(p.y * 8.0 + vPhase)) *
            cos(p.y * 6.0 - uTime * 0.12 + vPhase);
          float shape = length(p) * (0.85 + detail * 0.15);
          float feather = pow(1.0 - smoothstep(0.18, 1.0, shape), 2.0);
          float alpha = feather * (0.72 + detail * 0.28) * uStrength * 0.48;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide
    });
    const mesh = new THREE.Points(geometry, material);
    mesh.name = `Gas nebuloso ${layer + 1}`;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  });

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(1100 * 3);
  const starColors = new Float32Array(1100 * 3);
  const starPhases = new Float32Array(1100);
  const starSizes = new Float32Array(1100);
  const palette = [new THREE.Color("#dbeeff"), new THREE.Color("#a9e9ea"), new THREE.Color("#ffe5bb")];
  for (let i = 0; i < 1100; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 16 + Math.sqrt(random()) * 95;
    starPositions.set([Math.cos(angle) * radius, 2.5 + random() * 67, Math.sin(angle) * radius], i * 3);
    const color = palette[Math.floor(random() * palette.length)];
    starColors.set(color.toArray(), i * 3);
    starPhases[i] = random() * Math.PI * 2;
    starSizes[i] = 1.6 + random() * 2.5;
  }
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starsGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  starsGeometry.setAttribute("starPhase", new THREE.BufferAttribute(starPhases, 1));
  starsGeometry.setAttribute("starSize", new THREE.BufferAttribute(starSizes, 1));
  const starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uIntensity: { value: 1 }, uDuration: { value: 3.5 }
    },
    vertexShader: `
      attribute float starPhase;
      attribute float starSize;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        vColor = color;
        vPhase = starPhase;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(starSize * 38.0 / max(4.0, -view.z), 1.0, 4.5);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uDuration;
      varying vec3 vColor;
      varying float vPhase;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float pulse = 0.45 + 0.55 * sin(uTime * 6.2831853 / uDuration + vPhase);
        float alpha = (1.0 - smoothstep(0.1, 1.0, radius)) *
          (0.38 + pulse * 0.62) * uIntensity;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  stars.name = "Estrellas titilantes";
  stars.frustumCulled = false;
  group.add(stars);

  const core = new THREE.Group();
  core.name = "Estrella 3D";
  core.position.set(-13, 4.2, -23);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x7b422a, emissive: 0xff883f, emissiveIntensity: 1.2,
    roughness: 1, metalness: 0
  });
  coreMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uCoreTime = { value: 0 };
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
      #include <common>
      varying vec3 vCorePoint;
    `).replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vCorePoint = position;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
      #include <common>
      uniform float uCoreTime;
      varying vec3 vCorePoint;
      float coreHash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }
      float coreNoise(vec3 p) {
        vec3 c = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(coreHash(c), coreHash(c + vec3(1, 0, 0)), f.x),
          mix(coreHash(c + vec3(0, 1, 0)), coreHash(c + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(coreHash(c + vec3(0, 0, 1)), coreHash(c + vec3(1, 0, 1)), f.x),
          mix(coreHash(c + vec3(0, 1, 1)), coreHash(c + vec3(1, 1, 1)), f.x), f.y), f.z);
      }
    `).replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      float plasma = coreNoise(vCorePoint * 2.8 + vec3(uCoreTime * 0.18, 0.0, -uCoreTime * 0.1)) * 0.62 +
        coreNoise(vCorePoint * 7.2 - vec3(0.0, uCoreTime * 0.35, 0.0)) * 0.38;
      totalEmissiveRadiance *= 0.3 + smoothstep(0.3, 0.75, plasma) * 1.45;
    `);
    coreMaterial.userData.coreShader = shader;
  };
  coreMaterial.customProgramCacheKey = () => "rotating-space-star-v2";
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(2.15, 32, 24), coreMaterial);
  core.add(coreSphere);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const glowContext = glowCanvas.getContext("2d");
  const glowGradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  glowGradient.addColorStop(0, "rgba(255, 250, 220, 0.95)");
  glowGradient.addColorStop(0.22, "rgba(255, 239, 190, 0.9)");
  glowGradient.addColorStop(0.55, "rgba(255, 190, 115, 0.42)");
  glowGradient.addColorStop(1, "rgba(255, 110, 45, 0)");
  glowContext.fillStyle = glowGradient;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: true
  }));
  glow.name = "Resplandor de estrella";
  glow.scale.set(12, 12, 1);
  core.add(glow);
  group.add(core);

  const warmLight = new THREE.PointLight(0xffbb83, 65, 45, 1.6);
  warmLight.name = "Luz astral calida";
  warmLight.position.set(-8, 9, -5);
  const coolLight = new THREE.PointLight(0x70d5e3, 35, 42, 1.6);
  coolLight.name = "Rebote de nebulosa";
  coolLight.position.set(11, 6, 3);
  group.add(warmLight, coolLight);

  group.userData.animate = (input, time, active, floorVisible = true, quality = 1) => {
    const settings = normalizeSpaceSettings(input);
    group.visible = active;
    if (!active) return;
    const seconds = time * 0.001;
    stars.visible = settings.starsEnabled && settings.starIntensity > 0;
    starsMaterial.uniforms.uTime.value = seconds;
    starsMaterial.uniforms.uIntensity.value = settings.starIntensity;
    starsMaterial.uniforms.uDuration.value = settings.twinkleDuration;
    starsGeometry.setDrawRange(0, Math.round(1100 * quality));
    for (const mesh of gas) {
      mesh.visible = floorVisible && settings.nebulaIntensity > 0;
      mesh.geometry.setDrawRange(0, Math.round(78 * quality));
      mesh.material.uniforms.uTime.value = seconds;
      mesh.material.uniforms.uStrength.value = settings.nebulaIntensity;
    }
    core.visible = settings.coreEnabled;
    core.rotation.y = seconds * settings.rotationSpeed;
    glow.material.opacity = Math.min(1, settings.glowIntensity * (0.72 + Math.sin(seconds * 1.35) * 0.06));
    if (coreMaterial.userData.coreShader) coreMaterial.userData.coreShader.uniforms.uCoreTime.value = seconds;
    warmLight.visible = coolLight.visible = settings.lightingEnabled;
    warmLight.intensity = 65 * settings.lightIntensity * (0.94 + Math.sin(seconds * 0.7) * 0.06);
    coolLight.intensity = 35 * settings.lightIntensity;
  };
  group.userData.dispose = () => {
    gas.forEach((mesh) => { mesh.geometry.dispose(); mesh.material.dispose(); });
    starsGeometry.dispose();
    starsMaterial.dispose();
    coreSphere.geometry.dispose();
    coreMaterial.dispose();
    glow.material.dispose();
    glowTexture.dispose();
    warmLight.dispose();
    coolLight.dispose();
  };
  return group;
}
