import * as THREE from "three";
import { createLowDriftingFog } from "./lowDriftingFog.js";

// Heat currents stay in the river, outside the walkable platforms.
const VENTS = [
  [-8.5, 6, 6], [7.2, -6, 5.5], [-7, -19, 5.5],
  [7.5, -29, 6], [-10.5, -39, 7], [10, -48, 6],
];

function createLavaMaterial(clock) {
  return new THREE.ShaderMaterial({
    name: "Lava / corteza y corrientes localizadas",
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      time: clock, lavaMap: { value: null },
      vents: { value: VENTS.map(([x, z, radius]) => new THREE.Vector3(x, z, radius)) },
    },
    fog: true,
    vertexShader: `
      varying vec2 vLavaWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vLavaWorld = world.xz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform sampler2D lavaMap;
      uniform float time;
      uniform vec3 vents[6];
      varying vec2 vLavaWorld;
      #include <fog_pars_fragment>
      void main() {
        float activity = 0.0;
        for (int i = 0; i < 6; i++) {
          vec2 d = (vLavaWorld - vents[i].xy) / vents[i].z;
          activity += 1.0 - smoothstep(0.15, 1.0, length(d));
        }
        activity = min(activity, 1.0);
        vec2 uv = vLavaWorld * 0.075;
        vec2 drift = vec2(sin(vLavaWorld.y * 0.28 + time * 0.37),
          cos(vLavaWorld.x * 0.31 - time * 0.29));
        // Blend stationary crust with a flowing sample. Multiplying time by the
        // mask would progressively stretch UVs around vent boundaries.
        vec2 flow = drift * 0.034 + vec2(time * 0.007, -time * 0.004);
        vec3 still = texture2D(lavaMap, uv).rgb;
        vec3 surface = mix(still, texture2D(lavaMap, uv + flow).rgb, activity);
        float detail = texture2D(lavaMap, uv * 1.71 - flow * 0.65 + 0.37).r;
        float heat = smoothstep(0.055, 0.65, surface.r + detail * 0.13 * activity);
        float pulse = 0.94 + 0.06 * sin(time * 1.5 + vLavaWorld.x * 0.6 + vLavaWorld.y * 0.4);
        vec3 crust = vec3(0.018, 0.012, 0.016) + surface * 0.035;
        vec3 magma = mix(vec3(0.68, 0.035, 0.004), vec3(2.8, 0.66, 0.045), pow(heat, 1.7));
        magma *= mix(0.72, 1.12 * pulse, activity);
        gl_FragColor = vec4(mix(crust, magma, heat), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
}

function createEmbers(root, clock) {
  const count = VENTS.length * 16;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, z] = VENTS[Math.floor(i / 16)];
    positions.set([x, -3.04, z], i * 3);
    seeds.set([(i * .6180339) % 1, (i * .381966) % 1, (i * .754877) % 1], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.ShaderMaterial({
    name: "Brasas de lava / una sola pasada",
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), time: clock },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    vertexShader: `
      attribute vec3 seed;
      uniform float time;
      varying float vLife;
      varying float vHeat;
      #include <fog_pars_vertex>
      void main() {
        float age = fract(time * (0.10 + seed.y * 0.075) + seed.x);
        float angle = seed.z * 6.28318;
        vec3 p = position;
        p.x += cos(angle) * (0.5 + age * 2.3) + sin(time * 0.5 + seed.x * 20.0) * age * 0.4;
        p.z += sin(angle) * (0.5 + age * 2.3);
        p.y += age * (4.5 + seed.z * 3.8);
        vLife = smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(0.42, 1.0, age));
        vHeat = 1.0 - age;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp((32.0 + seed.y * 32.0) / max(1.0, -mvPosition.z), 1.0, 5.0);
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      varying float vLife;
      varying float vHeat;
      #include <fog_pars_fragment>
      void main() {
        float falloff = 1.0 - smoothstep(0.08, 0.5, length(gl_PointCoord - 0.5));
        float alpha = falloff * vLife * 0.8;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(mix(vec3(0.8, 0.08, 0.008), vec3(1.8, 0.75, 0.16), vHeat), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const embers = new THREE.Points(geometry, material);
  embers.name = "Brasas ascendentes sobre los sectores activos";
  embers.frustumCulled = false;
  embers.raycast = () => {};
  root.add(embers);
  return embers;
}

export function createUnderworldAtmosphere(scene, root) {
  const clock = { value: 0 };
  const lavaMaterial = createLavaMaterial(clock);
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), lavaMaterial);
  lava.name = "Río de lava / corrientes y corteza volcánica";
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = -3.1;
  lava.visible = false;
  root.add(lava);

  const banks = [];
  for (let row = 0; row < 7; row++) for (const side of [-1, 1]) {
    banks.push({ x: side * (row > 4 ? 10.5 : 6.8), z: 12 - row * 10.5,
      y: -1.25, width: 14, height: 3.2, opacity: .55,
      color: side < 0 ? 0x9c726d : 0x988697, driftX: 1.1, driftZ: .9 });
  }
  for (const z of [3, -10, -24, -38, -49]) banks.push({
    x: 0, z, y: .16, width: 7, height: 1.2, opacity: .22,
    color: 0xa6a0af, driftX: .45, driftZ: .55,
  });
  const fog = createLowDriftingFog(root, banks, { name: "Bruma del río / ceniza y vapor" });
  const embers = createEmbers(root, clock);

  // Only two shadowless lights illuminate nearby banks; distant lava stays emissive.
  const lavaLights = Array.from({ length: 2 }, () => {
    const light = new THREE.PointLight(0xff642b, 18, 14, 2);
    light.name = "Rebote cálido de lava";
    root.add(light);
    return light;
  });
  const fill = new THREE.DirectionalLight(0xb1bddb, .8);
  fill.name = "Luz fría del abismo / detalle de piedra";
  fill.position.set(9, 14, 12);
  fill.target.position.set(0, 0, -18);
  root.add(fill, fill.target);
  const ambient = scene.children.find(object => object.isHemisphereLight);
  if (ambient) {
    ambient.color.setHex(0xa8a6bc);
    ambient.groundColor.setHex(0x742815);
    ambient.intensity = .8;
  }

  let lightAge = 1;
  function update(dt, paused, camera, reducedMotion, player) {
    const step = paused || reducedMotion ? 0 : Math.min(dt, .05);
    clock.value += step;
    fog.update(step, reducedMotion, paused, camera);
    embers.visible = !reducedMotion;
    lightAge += paused ? 0 : Math.min(dt, .05);
    if (lightAge > .4 && player) {
      lightAge = 0;
      const nearest = VENTS.slice().sort((a, b) =>
        Math.hypot(a[0] - player.x, a[1] - player.z) - Math.hypot(b[0] - player.x, b[1] - player.z));
      lavaLights.forEach((light, index) => light.position.set(nearest[index][0], -.65, nearest[index][1]));
    }
    lavaLights.forEach((light, index) => {
      light.intensity = 18 + Math.sin(clock.value * 1.4 + index * 2.3) * 1.2;
    });
  }
  return {
    update,
    setLavaTexture(texture) { lavaMaterial.uniforms.lavaMap.value = texture; lava.visible = true; },
  };
}
