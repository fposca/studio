import * as THREE from "three";

// Small procedural texture: shared by all halos in one effect, no image download.
export function createOrbGlowTexture() {
  const size = 96;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const radius = Math.hypot((x + .5) / size * 2 - 1, (y + .5) / size * 2 - 1);
      const alpha = Math.max(0, Math.exp(-radius * radius * 5.5) - Math.exp(-5.5));
      const at = (y * size + x) * 4;
      pixels.set([255, 255, 255, Math.round(alpha * 255)], at);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createOrbHalo(texture, color, size, opacity = .4) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  sprite.scale.setScalar(size);
  return sprite;
}

export function createPlasmaOrb({ radius = .18, texture, phase = 0, active = false }) {
  const root = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: phase }, uEnergy: { value: .8 },
      uAccent: { value: new THREE.Color(active ? 0x58e8ff : 0xe252da) },
      uDeep: { value: new THREE.Color(active ? 0x073c5a : 0x241141) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vLocal;
      varying vec3 vView;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vLocal = normalize(position);
        vView = cameraPosition - world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uEnergy;
      uniform vec3 uAccent;
      uniform vec3 uDeep;
      varying vec3 vNormal;
      varying vec3 vLocal;
      varying vec3 vView;
      float hash(vec3 p) {
        p = fract(p * .3183099 + vec3(.13, .47, .73));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 n = normalize(vNormal);
        vec3 p = vLocal * 4.5 + vec3(uTime * .21, -uTime * .32, uTime * .13);
        float flow = noise(p) + .45 * noise(p * 2.1 + uTime * .11);
        float veins = pow(1.0 - abs(sin(flow * 12.0 + vLocal.y * 5.0)), 8.0);
        float rim = pow(1.0 - max(0.0, dot(n, normalize(vView))), 2.5);
        float key = .35 + .65 * max(0.0, dot(n, normalize(vec3(-.4, .7, .8))));
        vec3 color = uDeep * (.65 + key) + uAccent * (flow * .16 + veins * .54) * uEnergy;
        color += mix(uAccent, vec3(.7, .94, 1.0), .7) * (rim * .66 + pow(veins, 3.0) * .28) * uEnergy;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
    toneMapped: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), material);
  const halo = createOrbHalo(texture, active ? 0x67ddff : 0xcb4cda, radius * 7, .32);
  const arcMaterial = new THREE.MeshBasicMaterial({
    color: active ? 0x9af6ff : 0xf1a2ef, transparent: true, opacity: .6,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const arcGeometry = new THREE.TorusGeometry(radius * 1.22, radius * .026, 6, 48, Math.PI * 1.25);
  const arcs = [new THREE.Mesh(arcGeometry, arcMaterial), new THREE.Mesh(arcGeometry, arcMaterial)];
  arcs[0].rotation.set(.8, .3, phase);
  arcs[1].rotation.set(-.6, 1.1, phase + 2.4);
  root.add(core, halo, ...arcs);
  let activated = active;
  function setActive(value) {
    if (activated === value) return;
    activated = value;
    material.uniforms.uAccent.value.set(value ? 0x58e8ff : 0xe252da);
    material.uniforms.uDeep.value.set(value ? 0x073c5a : 0x241141);
    halo.material.color.set(value ? 0x67ddff : 0xcb4cda);
    arcMaterial.color.set(value ? 0x9af6ff : 0xf1a2ef);
  }
  function update(elapsed, energy = 1) {
    material.uniforms.uTime.value = elapsed + phase;
    material.uniforms.uEnergy.value = energy;
    core.rotation.y = elapsed * .24 + phase;
    core.rotation.z = Math.sin(elapsed * .7 + phase) * .08;
    arcs[0].rotation.z = elapsed * .9 + phase;
    arcs[1].rotation.y = -elapsed * .65 + phase;
    halo.material.opacity = .2 + energy * .16 + Math.sin(elapsed * 3 + phase) * .025;
    halo.scale.setScalar(radius * (6.7 + Math.sin(elapsed * 2 + phase) * .2));
  }
  function setPalette({ accent, deep, glow, arc }) {
    material.uniforms.uAccent.value.set(accent);
    material.uniforms.uDeep.value.set(deep);
    halo.material.color.set(glow);
    arcMaterial.color.set(arc);
  }
  return { root, core, halo, setActive, setPalette, update };
}


// Distance-sampled ribbon: its length stays consistent at different frame rates.
export function createOrbTrail({ width = .14, spacing = .065 } = {}) {
  const count = 28;
  const history = Array.from({ length: count }, () => new THREE.Vector3());
  const positions = new Float32Array(count * 6);
  const tangents = new Float32Array(count * 6);
  const uv = new Float32Array(count * 4);
  const indices = [];
  for (let i = 0; i < count; i += 1) {
    uv.set([0, i / (count - 1), 1, i / (count - 1)], i * 4);
    if (i < count - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("tangent", new THREE.BufferAttribute(tangents, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uReturning: { value: 0 }, uOpacity: { value: 1 }, uWidth: { value: width },
      uHead: { value: new THREE.Color().setRGB(.45, .92, 1.) },
      uTail: { value: new THREE.Color().setRGB(.56, .055, .72) },
      uCore: { value: new THREE.Color().setRGB(.8, .96, 1.) },
    },
    vertexShader: `
      attribute vec3 tangent;
      uniform float uWidth;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 side = cross(tangent, cameraPosition - position);
        if (dot(side, side) < .00001) side = cross(tangent, vec3(0., 1., .01));
        side = normalize(side);
        float width = uWidth * pow(1.0 - uv.y, .7) + .004;
        vec3 p = position + side * (uv.x * 2.0 - 1.0) * width;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uReturning;
      uniform float uOpacity;
      uniform vec3 uHead;
      uniform vec3 uTail;
      uniform vec3 uCore;
      varying vec2 vUv;
      void main() {
        float across = abs(vUv.x * 2.0 - 1.0);
        float core = pow(1.0 - across, 5.0);
        float soft = pow(1.0 - across, 1.5);
        vec3 tail = mix(uTail, vec3(.07, .3, .65), uReturning);
        vec3 color = mix(uHead, tail, vUv.y);
        color = mix(color, uCore, core * .65);
        float alpha = (soft * .38 + core * .6) * pow(1.0 - vUv.y, 1.35);
        gl_FragColor = vec4(color, alpha * mix(1., .65, uReturning) * uOpacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Orbe Neon / estela";
  mesh.frustumCulled = false;
  mesh.visible = false;
  const tangent = new THREE.Vector3();
  let carry = 0;
  function reset(at) {
    history.forEach(point => point.copy(at));
    carry = 0;
    mesh.visible = false;
  }
  function update(from, to, returning) {
    const distance = from.distanceTo(to);
    if (distance > 0) {
      for (let at = spacing - carry; at <= distance; at += spacing) {
        for (let i = count - 1; i > 0; i -= 1) history[i].copy(history[i - 1]);
        history[0].lerpVectors(from, to, at / distance);
      }
      carry = (carry + distance) % spacing;
    }
    for (let i = 0; i < count; i += 1) {
      const point = i === 0 ? to : history[i - 1];
      const ahead = i <= 1 ? to : history[i - 2];
      tangent.subVectors(ahead, history[i]).normalize();
      if (tangent.lengthSq() < .001) tangent.set(0, 0, 1);
      point.toArray(positions, i * 6);
      point.toArray(positions, i * 6 + 3);
      tangent.toArray(tangents, i * 6);
      tangent.toArray(tangents, i * 6 + 3);
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.tangent.needsUpdate = true;
    material.uniforms.uReturning.value = returning ? 1 : 0;
    mesh.visible = true;
  }
  return { mesh, reset, update };
}

// Reused burst pool; no geometries or materials are allocated while casting.
export function createOrbBurst(texture, impact = false, {
  glowColor = impact ? 0x75edff : 0xf093eb,
  ringColor = impact ? 0x8aefff : 0xf4b6ee,
  sparkColor = 0xed92e4, highlightColor = 0xa7f3ff,
} = {}) {
  const root = new THREE.Group();
  root.visible = false;
  const duration = impact ? .48 : .24;
  const glow = createOrbHalo(texture, glowColor, 1, 0);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: ringColor, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .016, 6, 64), ringMaterial);
  const count = impact ? 22 : 12;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.39996;
    const speed = .8 + (i % 5) * .28;
    velocities.set([Math.cos(angle) * speed, Math.sin(angle) * speed, .3 + (i % 4) * .27], i * 3);
    color.set(i % 3 === 0 ? sparkColor : highlightColor).toArray(colors, i * 3);
    sizes[i] = .04 + (i % 4) * .018;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const sparkMaterial = new THREE.ShaderMaterial({
    uniforms: { uFade: { value: 1 } },
    vertexShader: `
      attribute vec3 color;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 p = modelViewMatrix * vec4(position, 1.);
        gl_PointSize = clamp(size * 680. / max(.1, -p.z), 1., 20.);
        gl_Position = projectionMatrix * p;
      }
    `,
    fragmentShader: `
      uniform float uFade;
      varying vec3 vColor;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.;
        float alpha = max(0., exp(-r * r * 4.) - .018) * uFade;
        gl_FragColor = vec4(vColor, alpha);
        #include <colorspace_fragment>
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const sparks = new THREE.Points(geometry, sparkMaterial);
  sparks.frustumCulled = false;
  root.add(glow, ring, sparks);
  const axis = new THREE.Vector3(0, 0, 1), heading = new THREE.Vector3();
  let age = duration;
  function trigger(at, direction) {
    age = 0;
    root.position.copy(at);
    if (impact) root.position.addScaledVector(direction, -.04);
    heading.copy(direction).multiplyScalar(impact ? -1 : 1);
    root.quaternion.setFromUnitVectors(axis, heading);
    root.visible = true;
    update(0);
  }
  function update(dt) {
    if (!root.visible) return;
    age += dt;
    const t = Math.min(1, age / duration);
    root.visible = t < 1;
    ring.scale.setScalar(.08 + (impact ? .72 : .34) * (1 - (1 - t) ** 2));
    ringMaterial.opacity = (1 - t) ** 2 * .7;
    glow.scale.setScalar((impact ? .85 : .6) + t * .7);
    glow.material.opacity = (1 - t) ** 3 * .65;
    sparkMaterial.uniforms.uFade.value = (1 - t) ** 1.4;
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = velocities[i * 3] * age;
      positions[i * 3 + 1] = velocities[i * 3 + 1] * age - age * age * .45;
      positions[i * 3 + 2] = velocities[i * 3 + 2] * age;
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { root, trigger, update };
}
