import * as THREE from "three";
import { createOrbHalo, createPlasmaOrb, createOrbBurst } from "./neonOrbVisuals.js";

const surfaceVertex = `
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = cameraPosition - world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide };

export function createMedusaMirror(texture, index = 0) {
  const group = new THREE.Group(); group.name = "Medusa / espejo de bronce y cristal";
  const bronze = new THREE.MeshStandardMaterial({ color: 0x9e7946, metalness: .82, roughness: .3 });
  const darkBronze = new THREE.MeshStandardMaterial({ color: 0x302c26, metalness: .75, roughness: .46 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd9cfad, metalness: .8, roughness: .22 });
  const inlayMaterial = new THREE.MeshBasicMaterial({ color: 0x8cddd3, ...additive, opacity: .7 });
  function ring(radius, thickness, material, z = 0) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 8, 72), material);
    mesh.position.z = z; group.add(mesh); return mesh;
  }
  ring(.704, .068, darkBronze);
  ring(.754, .018, bronze);
  ring(.655, .026, silver, .016);
  ring(.625, .008, inlayMaterial, .03);
  const trim = new THREE.InstancedMesh(new THREE.BoxGeometry(.022, .067, .028), bronze, 32);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 32; i++) {
    const angle = i / 32 * Math.PI * 2;
    transform.position.set(Math.sin(angle) * .71, Math.cos(angle) * .71, .066);
    transform.rotation.z = -angle; transform.updateMatrix(); trim.setMatrixAt(i, transform.matrix);
  }
  group.add(trim);
  for (let strand = 0; strand < 2; strand++) {
    const points = Array.from({ length: 97 }, (_, i) => {
      const a = i / 96 * Math.PI * 2, wave = Math.sin(a * 12 + strand * Math.PI);
      return new THREE.Vector3(Math.sin(a) * (.71 + wave * .018), Math.cos(a) * (.71 + wave * .018), .063 + Math.cos(a * 12 + strand * Math.PI) * .012);
    });
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 144, .009, 4, false), silver));
  }
  const jewelMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2eafa4, roughness: .18, metalness: .35,
    clearcoat: 1, emissive: 0x12685e, emissiveIntensity: .7 });
  const jewelGeometry = new THREE.OctahedronGeometry(.075);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const jewel = new THREE.Mesh(jewelGeometry, jewelMaterial);
    jewel.position.set(Math.sin(a) * .745, Math.cos(a) * .745, .067); jewel.scale.z = .5; group.add(jewel);
  }
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: index }, uImpact: { value: 0 } }, vertexShader: surfaceVertex,
    fragmentShader: `
      uniform float uTime; uniform float uImpact;
      varying vec2 vUv; varying vec3 vView; varying vec3 vNormal;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p), a = atan(p.y, p.x);
        float ripple = sin(r * 22.0 - uTime * 1.5 + sin(a * 4.0 + uTime * .35) * .8);
        float cloud = sin(p.x * 5.0 + uTime * .2 + sin(p.y * 7.0)) * sin(p.y * 4.0 - uTime * .27);
        float rim = pow(clamp(r, 0.0, 1.0), 10.0);
        float angle = abs(dot(normalize(vNormal), normalize(vView)));
        float shine = exp(-pow((p.x + p.y * .68 + .23 + (1.0 - angle) * .32) * 8.0, 2.0));
        float hairline = exp(-pow((p.x + p.y * .68 + .05) * 55.0, 2.0));
        float etching = pow(.5 + .5 * sin(a * 24.0), 12.0) * smoothstep(.78, .83, r) * (1.0 - smoothstep(.9, .94, r));
        float wave = pow(.5 + .5 * sin(r * 28.0 - (1.0 - uImpact) * 32.0), 12.0) * uImpact;
        vec3 color = mix(vec3(.012, .033, .045), vec3(.07, .22, .24), .45 + cloud * .27 + ripple * .05);
        color += vec3(.22, .52, .57) * shine * .62 + vec3(.5, .7, .68) * hairline * .18;
        color += vec3(.26, .8, .72) * (rim * .6 + etching * .42 + wave * .7);
        color += vec3(.75, 1.0, .95) * uImpact * .3;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `, side: THREE.DoubleSide, toneMapped: false,
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(.63, 72), material); face.position.z = .018; group.add(face);
  const halo = createOrbHalo(texture, 0x45cbbb, 1.9, .13); halo.position.z = -.035; group.add(halo);
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(18 * 3);
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const dustMaterial = new THREE.PointsMaterial({ map: texture, color: 0x9de4d9, size: .055, ...additive, opacity: .65 });
  const dust = new THREE.Points(dustGeometry, dustMaterial); dust.frustumCulled = false; group.add(dust);
  const normal = new THREE.Vector3(0, 0, 1), axis = new THREE.Vector3(0, 0, 1);
  let impact = 0;
  function update(dt, time, direction) {
    impact = Math.max(0, impact - dt * 1.6);
    if (direction?.lengthSq() > .001) {
      normal.copy(direction).normalize();
      group.quaternion.setFromUnitVectors(axis, normal);
    }
    material.uniforms.uTime.value = time + index * 2;
    material.uniforms.uImpact.value = impact;
    halo.material.opacity = .1 + impact * .4 + Math.sin(time * 1.8 + index) * .025;
    inlayMaterial.opacity = .65 + impact * .35;
    jewelMaterial.emissiveIntensity = .65 + impact * 2;
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996 + time * .15;
      const radius = .8 + Math.sin(time + i * .7) * .045;
      dustPositions.set([Math.cos(a) * radius, Math.sin(a) * radius, Math.sin(time * .8 + i) * .09], i * 3);
    }
    dustGeometry.attributes.position.needsUpdate = true;
  }
  return { group, normal, update, hit: () => { impact = 1; }, reset: () => { impact = 0; group.visible = false; } };
}

export function createMedusaBolt(texture, index = 0) {
  const mesh = new THREE.Group(); mesh.name = "Medusa / maldicion serpentina"; mesh.visible = false;
  const plasma = createPlasmaOrb({ radius: .18, texture, phase: index * 1.7 });
  plasma.root.position.y = .18;
  plasma.core.material.uniforms.uAccent.value.setHex(0xeb55b7);
  plasma.core.material.uniforms.uDeep.value.setHex(0x210b32);
  plasma.halo.material.color.setHex(0xc9329c);
  mesh.add(plasma.root);
  const tailMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLength: { value: 0 } }, vertexShader: surfaceVertex,
    fragmentShader: `
      uniform float uTime; uniform float uLength; varying vec2 vUv;
      void main() {
        float tail = vUv.y;
        float center = .5 + sin(tail * 12.0 - uTime * 9.0) * .11 * tail;
        float across = abs(vUv.x - center) * 2.0;
        float core = exp(-across * across * 65.0);
        float mist = exp(-across * across * 6.0) * (.65 + .35 * sin(tail * 24.0 - uTime * 12.0));
        float fade = pow(1.0 - tail, 1.5) * smoothstep(0.0, .16, tail) * uLength;
        vec3 color = mix(vec3(.55, .06, .32), vec3(1.0, .66, .9), core);
        gl_FragColor = vec4(color, (core * .7 + mist * .22) * fade);
        #include <colorspace_fragment>
      }
    `, ...additive,
  });
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(.9, 2.4), tailMaterial);
  tail.rotation.x = -Math.PI / 2; tail.position.set(0, -.055, -1.03); mesh.add(tail);
  const groundMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, vertexShader: surfaceVertex,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float r = length(p), a = atan(p.y, p.x);
        float arc = exp(-pow((r - .55 - sin(a * 3.0 - uTime * 7.0) * .035) * 37.0, 2.0));
        float streak = pow(.5 + .5 * sin(a * 3.0 - uTime * 7.0), 3.0);
        float glow = exp(-r * r * 7.0) * .19;
        gl_FragColor = vec4(mix(vec3(.72, .09, .42), vec3(1.0, .7, .87), arc * streak), glow + arc * (.18 + streak * .45));
        #include <colorspace_fragment>
      }
    `, ...additive,
  });
  const wake = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), groundMaterial);
  wake.rotation.x = -Math.PI / 2; wake.position.y = -.06; mesh.add(wake);
  const particles = new Float32Array(16 * 3), geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(particles, 3).setUsage(THREE.DynamicDrawUsage));
  const sparks = new THREE.Points(geometry, new THREE.PointsMaterial({ map: texture, size: .06, color: 0xffc0dc, ...additive, opacity: .8 }));
  sparks.frustumCulled = false; mesh.add(sparks);
  let age = 0;
  function reset() { age = 0; tailMaterial.uniforms.uLength.value = 0; }
  function update(dt, time) {
    age += dt; plasma.update(time + index, 1.15);
    tailMaterial.uniforms.uTime.value = time;
    tailMaterial.uniforms.uLength.value = Math.min(1, age * 4);
    groundMaterial.uniforms.uTime.value = time;
    for (let i = 0; i < 16; i++) {
      const t = (time * .95 + i / 16) % 1;
      particles.set([Math.sin(i * 2.4 + time * 5) * (.07 + t * .21), .16 + Math.sin(t * Math.PI) * .23, -t * Math.min(1.7, age * 5)], i * 3);
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { mesh, reset, update };
}

export function createMedusaGaze(range, halfAngle) {
  const vertices = [0, .035, 0], indices = [];
  for (let i = 0; i <= 64; i++) {
    const a = -halfAngle + i / 64 * halfAngle * 2;
    vertices.push(Math.sin(a) * range, .035, Math.cos(a) * range);
    if (i) indices.push(0, i, i + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uActive: { value: 0 }, uRange: { value: range }, uAngle: { value: halfAngle } },
    vertexShader: `varying vec2 vGround; void main() { vGround = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime, uActive, uRange, uAngle; varying vec2 vGround;
      void main() {
        float d = length(vGround), a = atan(vGround.x, vGround.y), along = d / uRange;
        float edge = pow(clamp(abs(a) / uAngle, 0.0, 1.0), 28.0);
        float wave = pow(.5 + .5 * sin(d * 4.8 - uTime * mix(3.5, 8.0, uActive)), 18.0);
        float veins = pow(.5 + .5 * sin(a * 44.0 + sin(d * 1.7 - uTime * 1.5) * 1.7), 14.0);
        float fade = smoothstep(.12, .7, d) * (1.0 - smoothstep(.65, 1.0, along));
        float energy = (.018 + edge * .28 + wave * (.07 + .08 * uActive) + veins * .024) * fade;
        vec3 color = mix(vec3(.55, .24, .42), vec3(.95, .24, .6), uActive);
        color = mix(color, vec3(.95, .65, .78), edge * .6 + wave * .3);
        gl_FragColor = vec4(color, energy);
        #include <colorspace_fragment>
      }
    `, ...additive,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.name = "Medusa / ondas de mirada petrificante"; mesh.visible = false;
  return { mesh, update: (time, active) => { material.uniforms.uTime.value = time; material.uniforms.uActive.value = active ? 1 : 0; } };
}

export function createMedusaImpact(texture, color) {
  const burst = createOrbBurst(texture, true);
  burst.root.name = "Medusa / impacto de energia";
  const accent = new THREE.Color(color), bright = accent.clone().lerp(new THREE.Color(0xffffff), .7);
  burst.root.traverse(object => {
    if (object.material?.color) object.material.color.copy(accent);
    if (object.isPoints) {
      const colors = object.geometry.attributes.color;
      for (let i = 0; i < colors.count; i++) (i % 3 ? bright : accent).toArray(colors.array, i * 3);
      colors.needsUpdate = true;
    }
  });
  return burst;
}
