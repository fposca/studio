import * as THREE from "three";
import { rockClubFloorHeight } from "./rockClubLayout.js";
import { createRockClubFog } from "./rockClubFog.js";

export function createRockClubLighting(scene, materials) {
  const smoke = createRockClubFog(scene);
  const down = new THREE.Vector3(0, -1, 0), direction = new THREE.Vector3();
  const coneGeometry = new THREE.ConeGeometry(1, 1, 20, 1, true);
  coneGeometry.translate(0, -0.5, 0); // Tip at the fixture, cone extends along -Y.
  const lampBody = new THREE.CylinderGeometry(.16, .19, .34, 16);
  const lensGeometry = new THREE.CylinderGeometry(.14, .14, .012, 16);
  const bracketGeometry = new THREE.BoxGeometry(.42, .09, .28);
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = haloCanvas.height = 128;
  const context = haloCanvas.getContext("2d");
  const halo = context.createRadialGradient(64, 64, 4, 64, 64, 63);
  halo.addColorStop(0, "rgba(255,255,255,.65)");
  halo.addColorStop(.48, "rgba(255,255,255,.32)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = halo;
  context.fillRect(0, 0, 128, 128);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const poolGeometry = new THREE.PlaneGeometry(1, 1);
  const fixtures = [];
  // Six real moving lights and four scenic uplight beams; no extra shadow passes.
  const setups = [
    { color: 0x42ff85, position: [-5.2, 5.02, -12.2], phase: 0 },
    { color: 0xff3856, position: [0, 5.02, -7.2], phase: 2.1 },
    { color: 0x397dff, position: [5.2, 5.02, -12.2], phase: 4.2 },
    { color: 0xff4ed8, position: [-4, 5.02, -17.6], phase: 1.05, audience: true },
    { color: 0x49ddff, position: [0, 5.02, -17.6], phase: 3.15 },
    { color: 0xffb14c, position: [4, 5.02, -17.6], phase: 5.25, audience: true },
    ...[-5.8, -2.1, 2.1, 5.8].map((x, i) => ({
      color: [0x4a81ff, 0xef39c7, 0x48ff97, 0xff384f][i],
      position: [x, 0.72, -17.8], phase: i * 1.7, uplight: true,
    })),
  ];
  for (const [index, setup] of setups.entries()) {
    const origin = new THREE.Vector3(...setup.position);
    const target = new THREE.Vector3();
    const angle = setup.uplight ? .15 : .26;
    const light = setup.uplight ? null : new THREE.SpotLight(setup.color, 62, 25, angle, .72, 1.4);
    if (light) {
      light.name = "club moving spotlight " + index;
      light.position.copy(origin);
      light.castShadow = false;
      scene.add(light, light.target);
    }
    const head = new THREE.Group();
    head.name = "moving head fixture " + index;
    head.position.copy(origin);
    scene.add(head);
    const shell = new THREE.Mesh(lampBody, materials.black);
    shell.position.y = .08;
    head.add(shell);
    const lens = new THREE.Mesh(lensGeometry, new THREE.MeshBasicMaterial({ color: setup.color, toneMapped: false }));
    lens.position.y = -.1;
    head.add(lens);
    const bracket = new THREE.Mesh(bracketGeometry, materials.metal);
    bracket.position.set(origin.x, setup.uplight ? .55 : 5.28, origin.z);
    scene.add(bracket);
    const beam = new THREE.Mesh(coneGeometry, new THREE.ShaderMaterial({
      uniforms: { beamColor: { value: new THREE.Color(setup.color) }, strength: { value: .08 } },
      vertexShader: "varying vec3 n; varying vec3 eye; varying float fade; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); n=normalMatrix*normal; eye=-p.xyz; fade=0.2+0.8*uv.y; gl_Position=projectionMatrix*p; }",
      fragmentShader: "uniform vec3 beamColor; uniform float strength; varying vec3 n; varying vec3 eye; varying float fade; void main(){ float edge=pow(abs(dot(normalize(n),normalize(eye))),0.65); gl_FragColor=vec4(beamColor,strength*edge*fade); }",
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    beam.name = "soft moving light beam " + index;
    beam.position.copy(origin);
    beam.renderOrder = 2;
    beam.raycast = () => {};
    scene.add(beam);
    let pool = null;
    if (!setup.uplight) {
      pool = new THREE.Mesh(poolGeometry, new THREE.MeshBasicMaterial({
        map: haloTexture, color: setup.color, transparent: true, opacity: .33, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false,
      }));
      pool.name = "moving light pool " + index;
      pool.rotation.x = -Math.PI / 2;
      pool.raycast = () => {};
      scene.add(pool);
    }
    fixtures.push({ light, head, beam, pool, origin, target, angle, setup });
  }

  const barGeometry = new THREE.CylinderGeometry(.027, .027, 1, 8);
  const up = new THREE.Vector3(0, 1, 0);
  function trussBar(a, b) {
    const start = new THREE.Vector3(...a), delta = new THREE.Vector3(...b).sub(start);
    const mesh = new THREE.Mesh(barGeometry, materials.metal);
    mesh.position.copy(start).addScaledVector(delta, .5);
    mesh.scale.y = delta.length();
    mesh.quaternion.setFromUnitVectors(up, delta.normalize());
    scene.add(mesh);
  }
  for (const centerZ of [-12.3, -17.6]) {
    for (const z of [centerZ - .2, centerZ + .2]) trussBar([-6, 5.2, z], [6, 5.2, z]);
    for (let x = -6; x < 6; x += 1) {
      trussBar([x, 5.2, centerZ - .2], [x + 1, 5.2, centerZ + .2]);
      trussBar([x, 5.2, centerZ + .2], [x + 1, 5.2, centerZ - .2]);
    }
  }

  const anomalyLight = new THREE.PointLight(0xf638bd, 0, 13, 2);
  anomalyLight.position.set(0, 4.4, -13.5);
  scene.add(anomalyLight);
  let elapsed = 0, concertActive = false, anomalyIntensity = 0;
  function update(dt, reducedMotion = false, paused = false, camera = null) {
    if (!paused) elapsed += dt;
    const time = reducedMotion ? 0 : elapsed;
    smoke.update(dt, reducedMotion, paused, camera);
    const irregular = reducedMotion ? 1 : (.64 + .36 * Math.sin(time * 17) * Math.sin(time * 7.3));
    anomalyLight.intensity = anomalyIntensity * (reducedMotion ? 8 : 20 * irregular);
    for (const { light, head, beam, pool, origin, target, angle, setup } of fixtures) {
      const phase = setup.phase;
      if (setup.uplight) {
        target.set(origin.x * .55 + Math.sin(time * .28 + phase) * 1.6, 4.7,
          -12.5 + Math.cos(time * .24 + phase) * 1.4);
      } else {
        const x = Math.sin(time * (concertActive ? .54 : .24) + phase) * 5.8;
        const z = concertActive
          ? (setup.audience ? -7.5 : -14.7) + Math.sin(time * .39 + phase + .8) * (setup.audience ? 3.5 : 2.1)
          : -10.2 + Math.sin(time * .17 + phase + .8) * 6.1;
        target.set(x, rockClubFloorHeight(x, z) + .055, z);
      }
      direction.copy(target).sub(origin);
      const length = direction.length();
      head.quaternion.setFromUnitVectors(down, direction.normalize());
      beam.quaternion.copy(head.quaternion);
      const radius = Math.tan(angle) * length;
      beam.scale.set(radius, length, radius);
      // Continuous sweeps and gentle brightness changes, without strobing.
      beam.material.uniforms.strength.value = concertActive ? .14 : .085;
      if (light) {
        light.target.position.copy(target);
        light.target.updateMatrixWorld();
        light.intensity = (concertActive ? 76 : 53) + Math.sin(time * (concertActive ? 1.1 : .55) + phase) * 7;
        if (anomalyIntensity && !reducedMotion)
          light.intensity *= 1 - anomalyIntensity * (.12 + .27 * Math.max(0, Math.sin(time * (9 + phase) + phase)));
        pool.position.copy(target);
        pool.scale.set(radius * 2.25, radius * 1.8, 1);
        pool.material.opacity = concertActive ? .44 : .29;
      }
    }
  }
  update(0);
  return {
    update,
    setAnomalyIntensity(value) { anomalyIntensity = Math.max(0, Math.min(1, value)); },
    setConcertActive(active) {
      concertActive = Boolean(active);
      smoke.setConcertActive(concertActive);
    },
  };
}
