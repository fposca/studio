import * as THREE from "three";
import { createLowDriftingFog } from "./lowDriftingFog.js";

const LAVA_URL = new URL("../assets/environments/infernal-floor.chapter11.jpg", import.meta.url).href;

// The crust stays fixed; only the hotter channels flow. One surface, no post-processing.
export function createThroneAtmosphere(scene, root) {
  const clock = { value: 0 };
  let disposed = false;
  const texture = new THREE.TextureLoader().load(LAVA_URL, (map) => {
    if (disposed) map.dispose();
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.ShaderMaterial({
    name: "Abismo / corteza volcánica y magma",
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), time: clock, lavaMap: { value: texture } },
    fog: true,
    vertexShader: `
      varying vec2 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float time;
      uniform sampler2D lavaMap;
      varying vec2 vWorld;
      #include <fog_pars_fragment>
      void main() {
        vec2 uv = vWorld * 0.065;
        vec3 crustMap = texture2D(lavaMap, uv).rgb;
        vec2 drift = vec2(sin(vWorld.y * .19 + time * .18), cos(vWorld.x * .24 - time * .13)) * .022;
        vec3 flowing = texture2D(lavaMap, uv + drift + vec2(time * .0018, -time * .0011)).rgb;
        float activity = smoothstep(.25, .8, sin(vWorld.x * .16 + vWorld.y * .12) * .5 + .5);
        float heat = smoothstep(.11, .78, mix(crustMap.r, flowing.r, activity * .65));
        float fleck = texture2D(lavaMap, uv * 3.17 + .4).r;
        vec3 rock = vec3(.022, .018, .025) + vec3(fleck * .035);
        vec3 magma = mix(vec3(.48, .018, .003), vec3(2.2, .62, .075), pow(heat, 1.65));
        magma *= .91 + .09 * sin(time * .65 + vWorld.y * .28);
        gl_FragColor = vec4(mix(rock, magma, heat), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), material);
  lava.name = "Mar de magma / corrientes lentas";
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(0, -1.65, -44);
  root.add(lava);

  const banks = [];
  for (let i = 0; i < 9; i++) for (const side of [-1, 1]) {
    banks.push({ x: side * (i > 5 ? 20 : 12), z: 8 - i * 12,
      y: -.4, width: 17, height: 3, color: 0x806f80, opacity: .24, driftX: .65, driftZ: .4 });
  }
  const fog = createLowDriftingFog(root, banks, { name: "Vapor sobre el magma" });
  const positions = new Float32Array(180 * 3), seeds = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    const side = i % 2 ? -1 : 1, z = 16 - ((i * 7.137) % 116);
    positions.set([side * (z < -58 ? 21 : 12), -1.2, z], i * 3);
    seeds.set([(i * .618) % 1, (i * .754) % 1, (i * .381) % 1], i * 3);
  }
  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  emberGeometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
  const emberMaterial = new THREE.ShaderMaterial({
    uniforms: { time: clock }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float time;
      attribute vec3 seed;
      varying float vAlpha;
      void main() {
        float age = fract(seed.x + time * (.04 + seed.y * .025));
        vec3 p = position + vec3(sin(seed.z * 20. + age * 4.) * 2., age * 6., cos(seed.x * 20.) * 2.);
        vAlpha = smoothstep(0., .12, age) * (1. - smoothstep(.3, 1., age));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp(42. / max(1., -mvPosition.z), 1., 4.);
      }`,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float a = (1. - smoothstep(.04, .5, length(gl_PointCoord - .5))) * vAlpha;
        gl_FragColor = vec4(1., .38, .09, a * .7);
      }`,
  });
  const embers = new THREE.Points(emberGeometry, emberMaterial);
  embers.name = "Brasas / un solo emisor"; embers.frustumCulled = false; root.add(embers);

  scene.background = new THREE.Color(0x100e18);
  scene.fog = new THREE.FogExp2(0x211b2a, .014);
  scene.environmentIntensity = .42;
  const ambient = scene.children.find((object) => object.isHemisphereLight);
  if (ambient) { ambient.color.setHex(0x9eabc7); ambient.groundColor.setHex(0x49302c); ambient.intensity = 1.05; }
  const key = new THREE.DirectionalLight(0xd7ddeb, 2.3);
  key.position.set(-12, 20, 10); key.target.position.set(0, 0, -32); root.add(key, key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -17; key.shadow.camera.right = 17;
  key.shadow.camera.top = 17; key.shadow.camera.bottom = -17;
  key.shadow.camera.near = .5; key.shadow.camera.far = 48;
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = .025;
  key.shadow.bias = -.0002;
  key.shadow.radius = 2;
  const rim = new THREE.DirectionalLight(0xd39267, 1.3);
  rim.position.set(13, 6, -70); rim.target.position.set(0, 1, -20); root.add(rim, rim.target);
  const lights = [-1, 1].map((side) => {
    const light = new THREE.PointLight(0xff773f, 19, 22, 2);
    light.position.set(side * 10, .4, -7); root.add(light); return light;
  });
  return {
    update(dt, paused, reducedMotion, player) {
      if (!paused && !reducedMotion) clock.value += Math.min(dt, .05);
      key.position.set(player.x - 9, 17, player.z + 8);
      key.target.position.set(player.x, 0, player.z - 3);
      fog.update(dt, reducedMotion, paused);
      embers.visible = !reducedMotion;
      lights.forEach((light, i) => {
        light.position.z = player.z - 3;
        light.position.x = (i ? 1 : -1) * (player.z < -58 ? 16 : 10);
        light.intensity = 19 + Math.sin(clock.value * .8 + i * 2) * .8;
      });
    },
    dispose() { disposed = true; texture.dispose(); material.dispose(); emberMaterial.dispose(); emberGeometry.dispose(); lava.geometry.dispose(); },
  };
}
