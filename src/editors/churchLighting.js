import * as THREE from "three";

export const DEFAULT_CHURCH_LIGHTING = Object.freeze({
  enabled: false, intensity: 1, moon: 1, fill: 0.65, candles: 1.4,
  beams: 0.35, flicker: 0.35, speed: 0.65
});

export function normalizeChurchLighting(value = {}) {
  const result = { ...DEFAULT_CHURCH_LIGHTING, ...value };
  result.enabled = Boolean(result.enabled);
  for (const [key, max] of [["intensity", 2], ["moon", 2], ["fill", 1.5], ["candles", 3],
    ["beams", 1], ["flicker", 1], ["speed", 2]]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, 0, max) : DEFAULT_CHURCH_LIGHTING[key];
  }
  return result;
}

function createShaft(start, end, radius, color) {
  const length = start.distanceTo(end);
  const material = new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(color) }, strength: { value: 0 }, time: { value: 0 } },
    vertexShader: `
      varying vec2 vShaftUv;
      varying vec3 vShaftNormal;
      varying vec3 vShaftView;
      void main() {
        vShaftUv = uv;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vShaftView = -viewPosition.xyz;
        vShaftNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 tint;
      uniform float strength;
      uniform float time;
      varying vec2 vShaftUv;
      varying vec3 vShaftNormal;
      varying vec3 vShaftView;
      void main() {
        float edge = pow(abs(dot(normalize(vShaftNormal), normalize(vShaftView))), 2.0);
        float ends = smoothstep(0.0, 0.22, vShaftUv.y) * (1.0 - smoothstep(0.7, 1.0, vShaftUv.y));
        float wisps = 0.8 + sin(vShaftUv.y * 21.0 - time * 0.3 + sin(vShaftUv.x * 18.85)) * 0.2;
        gl_FragColor = vec4(tint, strength * edge * ends * wisps);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, toneMapped: false
  });
  material.forceSinglePass = true;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, radius, length, 32, 1, true), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), start.clone().sub(end).normalize());
  mesh.name = "Haz lunar tenue";
  mesh.renderOrder = 2;
  return mesh;
}

export function createChurchLighting() {
  const group = new THREE.Group();
  group.name = "Iluminacion tetrica";
  group.userData.editorHelper = true;
  group.visible = false;
  const moon = new THREE.SpotLight(0xa6c2de, 500, 48, 0.55, 0.68, 2);
  moon.name = "Luna de la nave";
  moon.position.set(-6, 11, 4);
  moon.target.position.set(0, 0, -1);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 0.5;
  moon.shadow.camera.far = 48;
  moon.shadow.bias = -0.00012;
  moon.shadow.normalBias = 0.018;
  moon.shadow.radius = 2;
  const rim = new THREE.SpotLight(0x729d9a, 180, 35, 0.5, 0.8, 2);
  rim.name = "Contraluz espectral";
  rim.position.set(5, 8, -8);
  rim.target.position.set(0, 1, 0);
  const fill = new THREE.PointLight(0x8294b5, 25, 22, 2);
  fill.name = "Relleno de las mascaras";
  fill.position.set(2, 4, 7);
  group.add(moon, moon.target, rim, rim.target, fill);
  const shafts = [
    createShaft(moon.position, moon.target.position, 3.1, 0xa6c2de),
    createShaft(rim.position, new THREE.Vector3(0, 0, 0), 2.3, 0x729d9a)
  ];
  group.add(...shafts);
  let config = DEFAULT_CHURCH_LIGHTING;
  let pulse = 1;
  let detach = () => {};

  group.userData.animate = (settings, time, inChurch, floorVisible = true) => {
    config = settings || DEFAULT_CHURCH_LIGHTING;
    group.visible = Boolean(inChurch && config.enabled);
    if (!group.visible) return;
    const seconds = time * 0.001 * config.speed;
    pulse = 1 + config.flicker * (Math.sin(seconds * 0.71) * 0.12 + Math.sin(seconds * 1.37 + 1.2) * 0.06);
    moon.intensity = 500 * config.intensity * config.moon * pulse;
    moon.castShadow = moon.intensity > 0;
    rim.intensity = 180 * config.intensity * config.moon * (2 - pulse);
    fill.intensity = 25 * config.intensity * config.fill;
    for (const shaft of shafts) {
      shaft.visible = floorVisible && config.beams > 0 && config.moon > 0 && config.intensity > 0;
      shaft.material.uniforms.strength.value = config.beams * config.intensity * config.moon * pulse * 0.065;
      shaft.material.uniforms.time.value = seconds;
    }
  };

  group.userData.bind = (scene, { ambient, keyLight, ruins, panorama }) => {
    detach();
    const before = scene.onBeforeRender, after = scene.onAfterRender;
    const saved = new Map();
    let environment = 1, panoramaIntensity = 1, keyShadow = true;
    let architecture, candleLights = [];
    const scale = (light, factor) => {
      if (!light) return;
      saved.set(light, light.intensity);
      light.intensity *= factor;
    };
    const restore = () => {
      if (!saved.size) return;
      for (const [light, intensity] of saved) light.intensity = intensity;
      saved.clear();
      keyLight.castShadow = keyShadow;
      scene.environmentIntensity = environment;
      if (panorama) panorama.material.uniforms.intensity.value = panoramaIntensity;
    };
    // Render-only overrides keep the user's original lights intact for saving and switching rigs.
    scene.onBeforeRender = function(...args) {
      before.apply(this, args);
      if (!group.visible) return;
      scale(ambient, 0.58);
      scale(keyLight, 0.12);
      scale(ruins.getObjectByName("Rebote lunar de la nave"), 0.3);
      scale(ruins.getObjectByName("Luz suave de las ruinas"), 0.1);
      const nextArchitecture = ruins.getObjectByName("Ruinas laterales y velas");
      if (architecture !== nextArchitecture) {
        architecture = nextArchitecture;
        candleLights = architecture?.children.filter(object => object.isPointLight) || [];
      }
      for (const light of candleLights) scale(light, config.candles * config.intensity * pulse);
      keyShadow = keyLight.castShadow;
      keyLight.castShadow = false;
      environment = scene.environmentIntensity;
      scene.environmentIntensity *= 0.72;
      if (panorama) {
        panoramaIntensity = panorama.material.uniforms.intensity.value;
        panorama.material.uniforms.intensity.value *= 0.78;
      }
    };
    scene.onAfterRender = function(...args) { restore(); after.apply(this, args); };
    detach = () => { restore(); scene.onBeforeRender = before; scene.onAfterRender = after; };
  };
  group.userData.dispose = () => {
    detach();
    for (const shaft of shafts) { shaft.geometry.dispose(); shaft.material.dispose(); }
    moon.dispose(); rim.dispose(); fill.dispose();
  };
  return group;
}
