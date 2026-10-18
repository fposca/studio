import * as THREE from "three";

const CAPACITY = 520;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const PALETTES = {
  coin: [0xffdc69, 0xffb539, 0xfff5bd],
  pickup: [0x9cefe7, 0x73d4cb, 0xf4e2aa],
  heal: [0xff82bb, 0xffbfd9, 0xffffff],
  ammo: [0xe7c489, 0xb78bff, 0xffffff],
  discovery: [0xe6c184, 0xffe9ae, 0xffffff],
  hit: [0xff9064, 0xffd09b, 0xffffff],
  defeat: [0xff6c52, 0xd683ff, 0xffffff],
  hurt: [0xff545d, 0xffa4a6, 0xffffff],
  secret: [0xb68cff, 0xf6d891, 0xffffff],
  hammerImpact: [0xc071ff, 0xeee0ff, 0x9f65ff],
  shot: [0xd69bff, 0xffffff, 0xa064ff],
  boss: [0xff9560, 0xd587ff, 0xffffff],
  charged: [0xa457ff, 0xe0baff, 0xffffff],
  chargeReady: [0xb165ff, 0xe5c5ff, 0xffffff]
};

function kindFor(event, playerId) {
  if (event.charged) return "charged";
  if (["hit", "defeat"].includes(event.type) && event.actor === playerId) return "hurt";
  return PALETTES[event.type] ? event.type : "hit";
}

export function createGameParticles(scene) {
  const positions = new Float32Array(CAPACITY * 3);
  const colors = new Float32Array(CAPACITY * 3);
  const sizes = new Float32Array(CAPACITY);
  const alphas = new Float32Array(CAPACITY);
  positions.fill(-1000);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexColors: true, uniforms: {},
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vAlpha = aAlpha;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(aSize * 500.0 / max(0.6, -view.z), 1.0, 52.0);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float radius = length(gl_PointCoord * 2.0 - 1.0);
        float halo = 1.0 - smoothstep(0.18, 1.0, radius);
        float core = 1.0 - smoothstep(0.0, 0.31, radius);
        float alpha = vAlpha * (halo * 0.38 + core * 0.62);
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(vColor * (1.1 + core * 0.45), alpha);
      }`
  });
  const cloud = new THREE.Points(geometry, material);
  cloud.name = "Chispas de monedas y combate";
  cloud.frustumCulled = false;
  scene.add(cloud);
  const particles = Array.from({ length: CAPACITY }, () => ({ age: 0, life: 0 }));
  const ringGeometry = new THREE.RingGeometry(0.68, 0.76, 48);
  const rings = Array.from({ length: 16 }, () => {
    const mesh = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, age: 0, life: 0 };
  });
  let cursor = 0, ringCursor = 0, seed = 0;
  function emit(event, playerId) {
    const kind = kindFor(event, playerId);
    const palette = PALETTES[kind];
    const count = kind === "coin" ? 42 : ["charged", "chargeReady"].includes(kind) ? 44 : kind === "defeat" ? 32 :
      ["pickup", "discovery", "secret"].includes(kind) ? 30 : 22;
    const originY = event.y ?? 1;
    for (let j = 0; j < count; j++) {
      const i = cursor++ % CAPACITY;
      const particle = particles[i];
      const angle = j * GOLDEN_ANGLE + seed * 0.61;
      const variation = Math.abs(Math.sin((j + 1) * 13.37 + seed * 3.71));
      const speed = (kind === "coin" ? 2.2 : kind === "charged" ? 3.1 : 1.9) * (0.6 + variation * 0.95);
      const lift = kind === "coin" || kind === "heal" ? 1.25 : 0.55;
      particle.age = 0;
      particle.life = kind === "coin" ? 0.8 + variation * 0.55 : 0.48 + variation * 0.38;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = lift + variation * 2.4;
      particle.vz = Math.sin(angle) * speed;
      particle.gravity = kind === "coin" ? 4.2 : 5.8;
      particle.drag = kind === "charged" ? 1.6 : 2.4;
      particle.size = (j % 5 === 0 ? (kind === "coin" ? 0.29 : 0.19) : (kind === "coin" ? 0.13 : 0.085)) * (0.75 + variation * 0.7);
      const color = new THREE.Color(palette[j % palette.length]);
      positions.set([(event.x ?? 0) + Math.cos(angle) * 0.08,
        originY + Math.sin(angle * 2) * 0.08, (event.z ?? 0) + Math.sin(angle) * 0.08], i * 3);
      colors.set([color.r, color.g, color.b], i * 3);
      sizes[i] = particle.size;
      alphas[i] = 1;
    }
    seed++;
    if (["coin", "pickup", "heal", "defeat", "secret", "charged", "chargeReady"].includes(kind)) {
      const ring = rings[ringCursor++ % rings.length];
      ring.age = 0;
      ring.life = kind === "coin" ? 0.78 : 0.65;
      ring.mesh.position.set(event.x ?? 0, originY - 0.15, event.z ?? 0);
      ring.mesh.scale.setScalar(0.25);
      ring.mesh.material.color.set(palette[0]);
      ring.mesh.material.opacity = 0.8;
      ring.mesh.visible = true;
    }
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
  }
  function update(dt) {
    if (dt <= 0) return;
    let changed = false;
    for (let i = 0; i < CAPACITY; i++) {
      const p = particles[i];
      if (p.life <= 0) continue;
      changed = true;
      p.age += dt;
      if (p.age >= p.life) {
        p.life = 0;
        positions[i * 3 + 1] = -1000;
        alphas[i] = 0;
        continue;
      }
      const damping = Math.exp(-p.drag * dt);
      p.vx *= damping; p.vz *= damping;
      p.vy -= p.gravity * dt;
      positions[i * 3] += p.vx * dt;
      positions[i * 3 + 1] += p.vy * dt;
      positions[i * 3 + 2] += p.vz * dt;
      const progress = p.age / p.life;
      alphas[i] = Math.min(1, (1 - progress) * 3) * (0.8 + 0.2 * Math.sin(progress * Math.PI));
      sizes[i] = p.size * (1 - progress * 0.35);
    }
    if (changed) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
      geometry.attributes.aAlpha.needsUpdate = true;
    }
    for (const ring of rings) {
      if (!ring.mesh.visible) continue;
      ring.age += dt;
      const progress = ring.age / ring.life;
      if (progress >= 1) { ring.mesh.visible = false; continue; }
      ring.mesh.scale.setScalar(0.25 + progress * 1.8);
      ring.mesh.material.opacity = (1 - progress) ** 2 * 0.7;
    }
  }
  function clear() {
    particles.forEach((particle) => { particle.life = 0; });
    positions.fill(-1000);
    alphas.fill(0);
    rings.forEach((ring) => { ring.mesh.visible = false; });
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
  }
  return { emit, update, clear };
}
