import * as THREE from "three";
import { batchTempleDetails, templeBoxGeometry } from "./parthenonGraphics.js";
import { createOrbHalo } from "./neonOrbVisuals.js";

const TAU = Math.PI * 2;
const effectVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const noiseGLSL = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
  float nebula(vec2 p) {
    float n = noise(p) * .57;
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    n += noise(p) * .28;
    return n + noise(p * 2.03) * .15;
  }
`;

function addMesh(parent, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position); parent.add(mesh);
  return mesh;
}
function instances(parent, name, geometry, material, count, place) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
    place(dummy, i); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true; parent.add(mesh);
  return mesh;
}
function ellipticalBand(outerX, outerY, innerX, innerY, depth) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outerX, outerY, 0, TAU, false);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, innerX, innerY, 0, TAU, true); shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, curveSegments: 80, bevelEnabled: true,
    bevelThickness: .018, bevelSize: .015, bevelSegments: 2,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}
function ellipticalRing(parent, x, y, tube, material, z = 0) {
  const ring = addMesh(parent, new THREE.TorusGeometry(1, tube, 8, 96), material, [0, 0, z]);
  ring.scale.set(x, y, 1);
  return ring;
}

// One bounded particle buffer per effect; no allocations or new emitters during play.
function motes(texture, count, color, size, positionAt) {
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.PointsMaterial({ map: texture, color, size, transparent: true,
    opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const points = new THREE.Points(geometry, material); points.frustumCulled = false;
  const update = time => {
    for (let i = 0; i < count; i++) positionAt(positions, i * 3, i, time);
    geometry.attributes.position.needsUpdate = true;
  };
  update(0);
  return { points, update };
}

export function createParthenonReturnPortal(materials, glow) {
  const root = new THREE.Group(); root.name = "Partenon / portal de regreso";
  const frame = new THREE.Group(); root.add(frame);
  const metal = materials.bronze.clone(), dark = materials.oxidized;
  metal.emissive.setHex(0x5a371b); metal.emissiveIntensity = .18;
  const cyan = new THREE.MeshBasicMaterial({ color: 0x8ce8ed, toneMapped: false });
  const gold = new THREE.MeshBasicMaterial({ color: 0xe3b784, toneMapped: false });
  const recess = new THREE.MeshStandardMaterial({ color: 0x18262c, metalness: .65, roughness: .42 });
  const body = addMesh(frame, ellipticalBand(1.40, 1.72, 1.14, 1.49, .25), dark);
  body.castShadow = body.receiveShadow = true;
  addMesh(frame, ellipticalBand(1.38, 1.70, 1.20, 1.55, .27), metal);
  for (const side of [-1, 1]) {
    ellipticalRing(frame, 1.36, 1.68, .017, metal, side * .16);
    ellipticalRing(frame, 1.18, 1.53, .022, metal, side * .16);
    ellipticalRing(frame, 1.13, 1.48, .009, cyan, side * .15);
    instances(frame, "portal / engraved tablets", templeBoxGeometry(.14, .15, .035, .008), recess, 32, (d, i) => {
      const a = i / 32 * TAU;
      d.position.set(Math.cos(a) * 1.27, Math.sin(a) * 1.61, side * .158);
      d.rotation.z = Math.atan2(1.61 * Math.cos(a), -1.27 * Math.sin(a)) - Math.PI / 2;
    });
    instances(frame, "portal / glyph inlays", new THREE.BoxGeometry(.012, .072, .009), gold, 96, (d, i) => {
      const a = Math.floor(i / 3) / 32 * TAU, mark = i % 3;
      const rotation = Math.atan2(1.61 * Math.cos(a), -1.27 * Math.sin(a)) - Math.PI / 2;
      const offset = (mark - 1) * .034;
      d.position.set(Math.cos(a) * 1.27 + Math.cos(rotation) * offset,
        Math.sin(a) * 1.61 + Math.sin(rotation) * offset, side * .183);
      d.rotation.z = rotation + (mark === 1 ? .8 : 0);
      d.scale.y = mark === 1 ? .8 : 1;
    });
    instances(frame, "portal / bronze studs", new THREE.SphereGeometry(.027, 8, 6), metal, 24, (d, i) => {
      const a = (i + .5) / 24 * TAU;
      d.position.set(Math.cos(a) * 1.40, Math.sin(a) * 1.72, side * .13);
    });
  }
  for (const side of [-1, 1]) {
    const foot = addMesh(frame, templeBoxGeometry(.6, .24, .65, .035), materials.stone, [side * .94, -1.73, 0]);
    foot.receiveShadow = foot.castShadow = true;
    addMesh(frame, templeBoxGeometry(.52, .06, .57, .015), metal, [side * .94, -1.58, 0]);
    addMesh(frame, templeBoxGeometry(.24, .38, .34, .025), dark, [side * .94, -1.39, 0]);
    const clasp = addMesh(frame, new THREE.OctahedronGeometry(.14, 0), metal, [side * 1.4, 0, 0]);
    clasp.scale.set(.6, 1.8, 1.5);
  }
  const crown = addMesh(frame, new THREE.OctahedronGeometry(.18, 0), metal, [0, 1.74, 0]);
  crown.scale.set(1, 1.3, .8);
  addMesh(frame, new THREE.OctahedronGeometry(.075, 0), cyan, [0, 1.77, .13]);
  addMesh(frame, new THREE.OctahedronGeometry(.075, 0), cyan, [0, 1.77, -.13]);
  batchTempleDetails(frame);

  const veilMaterial = new THREE.ShaderMaterial({
    name: "Parthenon dimensional passage", uniforms: { uTime: { value: 0 } },
    vertexShader: effectVertex,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      ${noiseGLSL}
      void main() {
        vec2 p = (vUv - .5) * 2.0;
        float r = length(p), a = atan(p.y, p.x);
        float twist = (1.0 - r) * 3.8 + uTime * .24;
        vec2 q = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * p;
        float cloud = nebula(q * 5.2 + vec2(uTime * .035, -uTime * .06));
        float filaments = pow(max(0.0, sin(a * 4.0 + r * 17.0 - cloud * 7.0 - uTime * .65)), 12.0);
        float ring = exp(-abs(r - .94 - .012 * sin(a * 9.0 + uTime)) * 110.0);
        float spiral = filaments * smoothstep(.08, .45, r) * (1.0 - smoothstep(.82, 1.0, r));
        vec3 color = mix(vec3(.008, .015, .043), vec3(.075, .025, .17), cloud);
        color += mix(vec3(.045, .21, .30), vec3(.29, .045, .25), cloud) * pow(cloud, 2.0) * 2.2;
        color += mix(vec3(.12, .58, .72), vec3(.45, .12, .54), cloud) * spiral * .65;
        // A dark central throat and receding rings suggest distance through the veil.
        float depthRing = pow(max(0.0, sin(log(max(r, .035)) * 12.0 + uTime * .8)), 24.0);
        color += vec3(.09, .22, .36) * depthRing * smoothstep(.06, .45, r) * (1.0 - r) * .35;
        color *= smoothstep(.01, .22, r) * .85 + .15;
        vec2 starCell = floor(q * 90.0), starLocal = fract(q * 90.0) - .5;
        float star = smoothstep(.97, 1.0, hash(starCell)) * exp(-dot(starLocal, starLocal) * 140.0);
        color += vec3(.5, .8, 1.0) * star * (.7 + .3 * sin(uTime * .7 + hash(starCell) * 40.0));
        color += vec3(.28, .85, .92) * ring * 1.2;
        gl_FragColor = vec4(color, 1.0 - smoothstep(.97, 1.0, r));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
  });
  const veil = addMesh(root, new THREE.PlaneGeometry(2.3, 3.02), veilMaterial);
  veil.name = "portal / dimensional veil";
  const halo = createOrbHalo(glow, 0x6388e9, 4.4, .12); halo.scale.y = 5.4; root.add(halo);
  const dust = motes(glow, 44, 0x98e6ff, .055, (p, offset, i, t) => {
    const a = i * 2.39996 + t * (.06 + i % 3 * .015), r = .70 + (i % 11) * .031;
    p[offset] = Math.cos(a) * r * 1.13; p[offset + 1] = Math.sin(a) * r * 1.48;
    p[offset + 2] = Math.sin(i * 7.3 + t * .4) * .24;
  }); root.add(dust.points);
  const groundGlow = addMesh(root, new THREE.PlaneGeometry(3.7, 3.0), new THREE.MeshBasicMaterial({
    map: glow, color: 0x768ff2, transparent: true, opacity: .23,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), [0, -1.822, 0]); groundGlow.rotation.x = -Math.PI / 2;
  let time = 0;
  return { root, update(dt, reducedMotion = false) {
    time += Math.max(0, dt) * (reducedMotion ? .15 : 1);
    veilMaterial.uniforms.uTime.value = time; dust.update(time);
    halo.material.opacity = .12 + Math.sin(time * .7) * .015;
  } };
}

function shardGeometry() {
  const vertices = [], colors = [];
  const points = [new THREE.Vector3(.07, .64, -.025)];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    points.push(new THREE.Vector3(Math.cos(a) * .24, .09 + Math.sin(a * 2) * .035, Math.sin(a) * .24));
  }
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + .12;
    points.push(new THREE.Vector3(Math.cos(a) * .18, -.24, Math.sin(a) * .18));
  }
  points.push(new THREE.Vector3(-.04, -.55, .025));
  const face = (a, b, c, tint) => {
    for (const index of [a, b, c]) { vertices.push(...points[index].toArray()); colors.push(...tint); }
  };
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    const tint = i % 2 ? [.5, .82, 1] : [.8, .56, 1];
    face(0, 1 + next, 1 + i, tint);
    face(1 + i, 1 + next, 6 + i, tint);
    face(1 + next, 6 + next, 6 + i, tint);
    face(11, 6 + i, 6 + next, tint);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals(); return geometry;
}

export function createFrequencyFragmentVisual(glow) {
  const root = new THREE.Group(); root.name = "Fragmento de Frecuencia 02"; root.visible = false;
  const relic = new THREE.Group(); relic.name = "fragment / suspended relic"; root.add(relic);
  const geometry = shardGeometry();
  const shell = new THREE.MeshPhysicalMaterial({ color: 0xbceaff, vertexColors: true, metalness: .28,
    roughness: .16, clearcoat: 1, clearcoatRoughness: .09, emissive: 0x13364d, emissiveIntensity: .65,
    transparent: true, opacity: .72, depthWrite: false, side: THREE.DoubleSide });
  const crystal = addMesh(relic, geometry, shell); crystal.renderOrder = 2;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 24),
    new THREE.LineBasicMaterial({ color: 0xafedff, transparent: true, opacity: .55, toneMapped: false }));
  edges.renderOrder = 3; relic.add(edges);
  const coreMaterial = new THREE.ShaderMaterial({
    name: "Frequency fragment living core", uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vPosition = position;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vView = -view.xyz; vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec3 vView;
      ${noiseGLSL}
      void main() {
        float cloud = nebula(vec2(vPosition.y * 7.0 - uTime * .09, vPosition.x * 13.0 + vPosition.z * 7.0));
        float flow = sin(vPosition.y * 28.0 - uTime * .65 + cloud * 14.0);
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
        vec3 color = mix(vec3(.015, .075, .19), vec3(.32, .03, .24), cloud);
        color += vec3(.36, .83, .95) * (pow(max(0.0, flow), 28.0) * .6 + rim * .5);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const core = addMesh(relic, geometry, coreMaterial); core.scale.setScalar(.78);
  const metal = new THREE.MeshStandardMaterial({ color: 0xbca06e, metalness: .78, roughness: .31 });
  const inlay = new THREE.MeshBasicMaterial({ color: 0xa2eeee, toneMapped: false });
  const collar = addMesh(relic, new THREE.CylinderGeometry(.265, .23, .075, 5, 1, true), metal, [0, -.12, 0]);
  collar.rotation.y = Math.PI / 10;
  for (const y of [-.155, -.085]) {
    const trim = addMesh(relic, new THREE.TorusGeometry(y < -.1 ? .23 : .265, .012, 6, 5), metal, [0, y, 0]);
    trim.rotation.x = Math.PI / 2; trim.rotation.z = Math.PI / 10;
  }
  // A small frequency crest is physically inset into the band, visible as the relic turns.
  instances(relic, "fragment / frequency crest", new THREE.BoxGeometry(.015, .06, .018), inlay, 15, (d, i) => {
    const side = Math.floor(i / 3), mark = i % 3, a = side / 5 * TAU;
    d.position.set(Math.cos(a) * .25 - Math.sin(a) * (mark - 1) * .04,
      -.12, Math.sin(a) * .25 + Math.cos(a) * (mark - 1) * .04);
    d.rotation.y = Math.PI / 2 - a; d.scale.y = mark === 1 ? .9 : .45;
  });
  const orbits = new THREE.Group(); root.add(orbits);
  for (let i = 0; i < 2; i++) {
    const hoop = new THREE.Group(); hoop.rotation.set(.65 + i * 1.05, 0, i * .8); orbits.add(hoop);
    const arc = addMesh(hoop, new THREE.TorusGeometry(.49 + i * .06, .018, 8, 72, TAU * .80), metal);
    arc.rotation.z = i * Math.PI;
    addMesh(hoop, new THREE.TorusGeometry(.49 + i * .06, .005, 6, 72, TAU * .78), inlay, [0, 0, .018]);
  }
  const satellites = new THREE.Group(); root.add(satellites);
  for (let i = 0; i < 3; i++) {
    const shard = addMesh(satellites, geometry, shell);
    const a = i / 3 * TAU;
    shard.position.set(Math.cos(a) * .67, .08 + Math.sin(a) * .2, Math.sin(a) * .67);
    shard.scale.setScalar(.16 + i * .025); shard.rotation.set(.25, a, -.18);
    const inner = addMesh(shard, geometry, coreMaterial); inner.scale.setScalar(.78);
  }
  const halo = createOrbHalo(glow, 0x649eea, 1.7, .21); relic.add(halo);
  const glint = createOrbHalo(glow, 0xd8faff, .22, .9); glint.position.set(.07, .64, -.025); relic.add(glint);
  const particles = motes(glow, 30, 0xc3e9ff, .034, (p, offset, i, t) => {
    const age = (i / 30 + t * .07) % 1, a = i * 2.39996 + t * .32;
    const r = .36 + Math.sin(age * Math.PI) * .35;
    p[offset] = Math.cos(a) * r; p[offset + 1] = -.5 + age * 1.4; p[offset + 2] = Math.sin(a) * r;
  }); root.add(particles.points);
  const pool = addMesh(root, new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({
    map: glow, color: 0x67a9e4, transparent: true, opacity: .32,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }), [0, -.57, 0]); pool.rotation.x = -Math.PI / 2;
  const light = new THREE.PointLight(0x79cfe7, 2.5, 4.2, 2); root.add(light);
  let time = 0;
  return { root, update(dt, reducedMotion = false) {
    time += Math.max(0, dt) * (reducedMotion ? .15 : 1);
    relic.position.y = Math.sin(time * 1.25) * .06; relic.rotation.y = time * .32;
    orbits.rotation.y = -time * .18; satellites.rotation.y = time * .14;
    coreMaterial.uniforms.uTime.value = time; particles.update(time);
    light.intensity = 2.5 + Math.sin(time * 1.4) * .2;
  } };
}
