import * as THREE from "three";
import { createPlasmaOrb, createOrbHalo, createOrbTrail, createOrbBurst } from "./neonOrbVisuals.js";

const PALETTES = {
  plasma: { accent: 0xff568b, deep: 0x320d52, glow: 0xdb387f, arc: 0xffc1ae, tail: 0x9c31ca },
  corrupted: { accent: 0xff315d, deep: 0x270822, glow: 0xe52964, arc: 0xffaa83, tail: 0x7e24b5 },
};
const BURST_COLORS = {
  glowColor: 0xff5483, ringColor: 0xffb59c, sparkColor: 0xf45ba2, highlightColor: 0xffe0b8,
};
const FADE_TIME = .28;

// One reusable effect per projectile slot. No per-shot textures, lights or geometry.
// The parent stays at world origin because the ribbon records world positions.
export function createEnemyOrbVisual(texture, phase = 0) {
  const root = new THREE.Group();
  root.name = "Enemy orb / effects";
  const body = new THREE.Group();
  body.name = "Enemy orb / plasma";
  const plasma = createPlasmaOrb({ radius: .16, texture, phase });
  const hotCore = createOrbHalo(texture, 0xffe2c3, .28, .7);
  hotCore.position.z = .13;
  body.add(plasma.root, hotCore);

  const trail = createOrbTrail({ width: .105, spacing: .055 });
  trail.mesh.name = "Enemy orb / energy wake";
  const uniforms = trail.mesh.material.uniforms;
  uniforms.uCore.value.set(0xffdfc4);
  const muzzle = createOrbBurst(texture, false, BURST_COLORS);
  const impact = createOrbBurst(texture, true, BURST_COLORS);
  muzzle.root.name = "Enemy orb / discharge";
  impact.root.name = "Enemy orb / impact";

  const count = 24;
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    seeds.set([i / count, i * 2.39996, .5 + (i % 5) * .12], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
  const sparksMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uFade: { value: 1 },
      uColor: { value: new THREE.Color(0xff9c80) },
    },
    vertexShader: `
      attribute vec3 seed;
      uniform float uTime;
      varying float vFade;
      void main() {
        float age = fract(seed.x + uTime * 1.4);
        float angle = seed.y + age * 2.5;
        float radius = .07 + age * .18;
        vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, -.08 - age * .95);
        vec4 view = modelViewMatrix * vec4(p, 1.);
        vFade = pow(1. - age, 1.5) * smoothstep(0., .12, age);
        gl_PointSize = clamp((.022 + seed.z * .022) * 680. / max(.1, -view.z), 1., 12.);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float uFade;
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.;
        float glow = max(0., exp(-r * r * 5.) - .007);
        vec3 color = mix(uColor, vec3(1., .87, .73), pow(glow, 3.));
        gl_FragColor = vec4(color, glow * vFade * uFade);
        #include <colorspace_fragment>
      }
    `,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const sparks = new THREE.Points(geometry, sparksMaterial);
  sparks.frustumCulled = false;
  body.add(sparks);
  root.add(body, trail.mesh, muzzle.root, impact.root);

  const previous = new THREE.Vector3();
  const heading = new THREE.Vector3(0, 0, 1), axis = new THREE.Vector3(0, 0, 1);
  let flying = false, fadeAge = FADE_TIME, scale = 1, dissipating = false;

  function clear() {
    flying = false;
    dissipating = false;
    fadeAge = FADE_TIME;
    root.visible = body.visible = trail.mesh.visible = muzzle.root.visible = impact.root.visible = false;
  }

  function start(at, velocity, corrupted = false) {
    clear();
    const palette = corrupted ? PALETTES.corrupted : PALETTES.plasma;
    scale = corrupted ? 1.65 : 1;
    heading.copy(velocity).normalize();
    if (heading.lengthSq() < .001) heading.copy(axis);
    body.position.copy(at);
    body.quaternion.setFromUnitVectors(axis, heading);
    body.scale.setScalar(scale);
    previous.copy(at);
    plasma.setPalette(palette);
    uniforms.uHead.value.set(palette.arc);
    uniforms.uTail.value.set(palette.tail);
    uniforms.uWidth.value = .105 * scale;
    uniforms.uOpacity.value = .85;
    sparksMaterial.uniforms.uColor.value.set(palette.arc);
    trail.reset(at);
    muzzle.trigger(at, heading);
    root.visible = body.visible = flying = true;
    fadeAge = 0;
    update(0, 0);
  }

  function finish(hit = false) {
    if (!flying) return;
    flying = false;
    fadeAge = 0;
    dissipating = !hit;
    if (hit) {
      body.visible = false;
      impact.trigger(body.position, heading);
    }
  }

  function update(dt, elapsed, reducedMotion = false) {
    if (!root.visible) return;
    muzzle.update(dt);
    impact.update(dt);
    if (flying) {
      trail.update(previous, body.position, false);
      previous.copy(body.position);
    } else {
      fadeAge = Math.min(FADE_TIME, fadeAge + dt);
    }
    const fade = flying ? 1 : 1 - fadeAge / FADE_TIME;
    const clock = reducedMotion ? phase : elapsed;
    plasma.update(clock, (reducedMotion ? 1 : 1.15) * fade);
    plasma.halo.material.opacity *= fade;
    hotCore.material.opacity = .72 * fade;
    sparksMaterial.uniforms.uTime.value = clock + phase;
    sparksMaterial.uniforms.uFade.value = fade * (reducedMotion ? .25 : .85);
    uniforms.uOpacity.value = fade * (reducedMotion ? .4 : .85);
    if (dissipating) {
      body.scale.setScalar(scale * fade);
      body.visible = fade > 0;
    }
    if (!flying && fade === 0) {
      body.visible = trail.mesh.visible = false;
      root.visible = muzzle.root.visible || impact.root.visible;
    }
  }

  clear();
  return { root, body, start, finish, update, clear };
}
