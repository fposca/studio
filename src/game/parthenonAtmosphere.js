import * as THREE from "three";
import { PARTHENON_PROPS } from "./parthenonLayout.js";
import { createLowDriftingFog } from "./lowDriftingFog.js";
import { batchTempleDetails } from "./parthenonGraphics.js";

function mesh(parent, geometry, material, position) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position); object.castShadow = object.receiveShadow = true;
  parent.add(object); return object;
}
function flameMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float time;
      void main() {
        float y = vUv.y;
        float x = vUv.x * 2.0 - 1.0 + sin(y * 13.0 - time * 7.0) * y * 0.17;
        float width = (1.0 - y) * (0.65 + sin(y * 21.0 - time * 8.0) * 0.1);
        float flame = (1.0 - smoothstep(width * 0.18, width, abs(x)))
          * smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.7, 1.0, y));
        vec3 color = mix(vec3(1.0, 0.14, 0.015), vec3(1.0, 0.8, 0.3), flame * (1.0 - y));
        gl_FragColor = vec4(color, flame * 0.83);
        #include <colorspace_fragment>
      }`,
  });
}
export function createParthenonAtmosphere(scene, root, materials, glowTexture) {
  scene.fog = new THREE.FogExp2(0x232332, .022);
  const moon = new THREE.DirectionalLight(0xacc8eb, 1.65);
  moon.name = "Parthenon moon with contact shadows";
  moon.position.set(-16, 24, 9); moon.target.position.set(0, 0, -12);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -23, right: 23, top: 35, bottom: -35, near: 1, far: 90 });
  moon.shadow.bias = -.00012; moon.shadow.normalBias = .035;
  moon.shadow.camera.updateProjectionMatrix();
  root.add(moon, moon.target);
  const coolFill = new THREE.PointLight(0x698ebf, 22, 26, 2);
  coolFill.position.set(-3, 5, -15); root.add(coolFill);
  const sanctuaryLight = new THREE.PointLight(0xce4eaa, 23, 17, 2);
  sanctuaryLight.position.set(0, 4, -35); root.add(sanctuaryLight);
  const gateLight = new THREE.PointLight(0xb45ce3, 13, 13, 2);
  gateLight.position.set(0, 3.3, -8); root.add(gateLight);
  const returnLight = new THREE.PointLight(0x8c63db, 8, 7, 2);
  returnLight.position.fromArray(PARTHENON_PROPS.find(prop => prop.id === "returnPortal").position);
  returnLight.position.y = 2.2; root.add(returnLight);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(82, 32, 18), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { zenith: { value: new THREE.Color(0x0a0e1c) }, horizon: { value: new THREE.Color(0x582335) } },
    vertexShader: `varying vec3 direction; void main() {
      direction = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `varying vec3 direction; uniform vec3 zenith; uniform vec3 horizon;
      void main() {
        float elevation = clamp(direction.y, 0.0, 1.0);
        float haze = pow(1.0 - elevation, 4.0);
        float cloud = sin(direction.x * 27.0 + direction.z * 13.0) * sin(direction.z * 21.0 - direction.y * 37.0);
        vec3 color = mix(zenith, horizon, haze) * (0.91 + cloud * haze * 0.09);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  sky.name = "red dimensional night sky"; sky.position.z = -12; root.add(sky);

  const torchPositions = [];
  for (const z of [9, -6, -19, -33]) for (const x of [-12.7, 12.7]) torchPositions.push([x, z]);
  const flames = flameMaterial(), torches = [];
  const emberMaterial = new THREE.MeshBasicMaterial({ color: 0xff872e, toneMapped: false });
  const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0xff8c43,
    transparent: true, opacity: .27, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const [x, z] of torchPositions) {
    const torch = new THREE.Group(); torch.name = "bronze tripod brazier"; torch.position.set(x, 0, z); root.add(torch);
    mesh(torch, new THREE.CylinderGeometry(.32, .39, .14, 16), materials.stone, [0, .07, 0]);
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;
      const leg = mesh(torch, new THREE.CylinderGeometry(.036, .055, 1.6, 8), materials.bronze,
        [Math.cos(angle) * .19, .88, Math.sin(angle) * .19]);
      leg.rotation.set(Math.sin(angle) * .12, 0, -Math.cos(angle) * .12);
    }
    const bowlPoints = [[.13,0], [.2,.04], [.34,.19], [.39,.3], [.39,.35], [.34,.35], [.29,.22], [.13,.07]];
    mesh(torch, new THREE.LatheGeometry(bowlPoints.map(p => new THREE.Vector2(...p)), 24), materials.oxidized, [0, 1.56, 0]);
    const rim = mesh(torch, new THREE.TorusGeometry(.38, .034, 8, 32), materials.bronze, [0, 1.9, 0]);
    rim.rotation.x = Math.PI / 2;
    const coal = mesh(torch, new THREE.CircleGeometry(.32, 24), emberMaterial, [0, 1.85, 0]);
    coal.rotation.x = -Math.PI / 2; coal.castShadow = false;
    for (const angle of [0, Math.PI / 2]) {
      const flame = mesh(torch, new THREE.PlaneGeometry(.77, .95), flames, [0, 2.24, 0]);
      flame.rotation.y = angle; flame.castShadow = flame.receiveShadow = false;
    }
    const aura = new THREE.Sprite(glowMaterial); aura.position.y = 2.12; aura.scale.set(1.6, 1.6, 1); torch.add(aura);
    batchTempleDetails(torch);
    torches.push({ position: new THREE.Vector3(x, 2.15, z), phase: torches.length * 2.17 });
  }
  // Four shadowless flame lights follow the nearest braziers; distant fires retain their emissive geometry.
  const flameLights = Array.from({ length: 4 }, () => {
    const light = new THREE.PointLight(0xffa14f, 19, 10.5, 2); root.add(light); return light;
  });

  const banks = [];
  for (let row = 0; row < 8; row++) for (let col = 0; col < 3; col++) banks.push({
    x: -10 + col * 10 + Math.sin(row * 1.7) * 1.3, z: 12 - row * 6.6,
    y: .32 + (row % 3) * .12, width: 9 + col, height: 1.5 + (row % 2) * .3,
    color: row > 5 ? 0x9c839f : 0x9ca9c0, opacity: row > 5 ? .45 : .39,
    driftX: .9, driftZ: .55,
  });
  const fog = createLowDriftingFog(root, banks, { name: "Parthenon ground mist" });

  const dustCount = 110, positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    positions[i * 3] = Math.sin(i * 12.9898) * 14;
    positions[i * 3 + 1] = .3 + (i * .713 % 1) * 5;
    positions[i * 3 + 2] = 15 - (i * .371 % 1) * 54;
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(geometry, new THREE.PointsMaterial({
    map: glowTexture, color: 0xddd0c5, size: .055, sizeAttenuation: true, transparent: true,
    opacity: .38, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  dust.name = "temple suspended ash"; dust.raycast = () => {}; root.add(dust);

  let time = 0, lightAge = 1, bossMood = 0, nearest = torches.slice(0, 4);
  function update(dt, reducedMotion = false, paused = false, camera = null, player = null) {
    if (!paused && !reducedMotion) time += dt;
    flames.uniforms.time.value = time;
    fog.update(dt, reducedMotion, paused, camera);
    if (!paused) lightAge += dt;
    if (lightAge > .35 && player) {
      lightAge = 0;
      nearest = [...torches].sort((a, b) => Math.hypot(a.position.x - player.x, a.position.z - player.z)
        - Math.hypot(b.position.x - player.x, b.position.z - player.z)).slice(0, 4);
    }
    flameLights.forEach((light, i) => {
      const torch = nearest[i];
      light.position.copy(torch.position);
      light.intensity = 19 + Math.sin(time * 9 + torch.phase) * 1.7 + Math.sin(time * 17 + torch.phase) * .7;
    });
    sanctuaryLight.intensity = 23 - bossMood * 9 + Math.sin(time * .8) * 2;
    sanctuaryLight.color.setHex(bossMood > .75 ? 0xb13770 : 0xce4eaa);
    scene.fog.density = .022 + bossMood * .008;
    moon.intensity = 1.65 - bossMood * .42;
    if (!paused && !reducedMotion) {
      for (let i = 0; i < dustCount; i++) {
        positions[i * 3 + 1] += dt * (.04 + (i % 4) * .012);
        if (positions[i * 3 + 1] > 5.4) positions[i * 3 + 1] = .3;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  }
  update(0);
  return { update, setBossMood: value => { bossMood = Math.max(0, Math.min(1, value)); }, obstacles: torchPositions.map(([x,z])=>({id:"brazier",x,z,radius:.38})), dispose: () => moon.dispose() };
}
