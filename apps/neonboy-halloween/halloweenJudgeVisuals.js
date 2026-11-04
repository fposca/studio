import * as THREE from "three";

const TAU = Math.PI * 2;
const smooth = (value) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

// Tiny procedural textures stay in CPU memory for WebGL context restoration.
// No postprocessing, extra render targets, lights or texture downloads.
function glowTexture(soft = false) {
  const size = 64, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = Math.hypot((x + .5) / size * 2 - 1, (y + .5) / size * 2 - 1);
    const alpha = soft ? Math.max(0, 1 - r) ** 2 : Math.exp(-r * r * 7) * Math.max(0, 1 - r);
    const i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.round(alpha * 255);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function particlePool(count, texture, size) {
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3), life = new Float32Array(count), duration = new Float32Array(count);
  const shades = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.PointsMaterial({ map: texture, size, vertexColors: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: .85 });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  let cursor = 0, active = 0;
  return {
    points,
    emit(x, y, z, vx, vy, vz, seconds, color) {
      const index = cursor++ % count, offset = index * 3;
      positions[offset] = x; positions[offset + 1] = y; positions[offset + 2] = z;
      velocities[offset] = vx; velocities[offset + 1] = vy; velocities[offset + 2] = vz;
      shades[offset] = color.r; shades[offset + 1] = color.g; shades[offset + 2] = color.b;
      life[index] = duration[index] = seconds;
    },
    update(dt, quiet) {
      active = 0;
      for (let i = 0; i < count; i++) {
        const offset = i * 3;
        life[i] = Math.max(0, life[i] - dt);
        const fade = life[i] / (duration[i] || 1);
        if (life[i]) {
          active++;
          positions[offset] += velocities[offset] * dt;
          positions[offset + 1] += velocities[offset + 1] * dt;
          positions[offset + 2] += velocities[offset + 2] * dt;
          velocities[offset + 1] -= dt * .18;
        }
        const intensity = fade * Math.min(1, (1 - fade) * 12) * (quiet ? .5 : 1);
        colors[offset] = shades[offset] * intensity;
        colors[offset + 1] = shades[offset + 1] * intensity;
        colors[offset + 2] = shades[offset + 2] * intensity;
      }
      points.visible = active > 0;
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    },
    clear() { life.fill(0); colors.fill(0); points.visible = false; },
  };
}

function sigilGeometry() {
  const vertices = [];
  const line = (a, ra, b, rb) => vertices.push(Math.cos(a) * ra, Math.sin(a) * ra, 0, Math.cos(b) * rb, Math.sin(b) * rb, 0);
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * TAU;
    line(a, 1.03, a, i % 4 === 0 ? 1.21 : 1.1);
    if (i % 2 === 0) {
      line(a - .035, .82, a, .94); line(a, .94, a + .035, .82);
      line(a - .035, .82, a + .035, .82);
    }
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
}

export function createHalloweenJudgeVisuals(scene, { lowPower = false } = {}) {
  const effects = new THREE.Group();
  effects.name = "Juez / portal, plasma y cenizas";
  scene.add(effects);
  const sparkTexture = glowTexture(), hazeTexture = glowTexture(true);
  const sparks = particlePool(lowPower ? 144 : 240, sparkTexture, .2);
  const haze = particlePool(lowPower ? 24 : 40, hazeTexture, .8);
  effects.add(sparks.points, haze.points);
  const purple = new THREE.Color(0xc267ff), hot = new THREE.Color(0xffb1d7), red = new THREE.Color(0xff426d);
  const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const portal = new THREE.Group();
  portal.rotation.x = -Math.PI / 2;
  const outer = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.27, 64), basic(0xbc69ff, .7));
  const inner = new THREE.Mesh(new THREE.RingGeometry(.73, .76, 64), basic(0xff6cba, .65));
  const runes = new THREE.LineSegments(sigilGeometry(), new THREE.LineBasicMaterial({ color: 0xe194ff,
    transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const well = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5), basic(0x9e30cb, .28));
  well.material.map = hazeTexture;
  portal.add(well, outer, inner, runes);
  effects.add(portal);
  portal.visible = false;
  const strands = [];
  for (let i = 0; i < 3; i++) {
    const path = new THREE.CatmullRomCurve3(Array.from({ length: 48 }, (_, j) => {
      const t = j / 47, a = t * TAU * 1.3, r = (1 - t * .75) * 1.1;
      return new THREE.Vector3(Math.cos(a) * r, .1 + t * 3.35, Math.sin(a) * r);
    }));
    const line = new THREE.Mesh(new THREE.TubeGeometry(path, 64, .008, 4, false), basic(i === 0 ? 0xe6a0dc : 0x9d55ef, .55));
    line.visible = false;
    effects.add(line); strands.push(line);
  }
  const projectile = new THREE.Group();
  projectile.name = "Juez / orbe hostil";
  projectile.visible = false;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.19, 1), basic(0xb75cff, .4));
  core.material.wireframe = true;
  const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(.14, 2), basic(0xffc5f2));
  heart.scale.set(1, 1.15, 1);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTexture, color: 0xc95aff, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: .85, toneMapped: false }));
  aura.scale.setScalar(1.25);
  projectile.add(core, heart, aura);
  const arcs = [];
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.21 + i * .025, .009, 4, 32, Math.PI * 1.55), basic(i === 1 ? 0xe74da9 : 0x8b35ff, .8));
    arc.rotation.set(i * .9, i * 1.4, i * 2.1);
    projectile.add(arc); arcs.push(arc);
  }
  effects.add(projectile);
  const shock = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 64), basic(0xe395ff, 0));
  shock.rotation.x = -Math.PI / 2;
  shock.visible = false;
  effects.add(shock);
  const impactGlow = new THREE.Sprite(aura.material.clone());
  impactGlow.visible = false;
  effects.add(impactGlow);
  // Code vision must not replace the effect materials or generate shader variants.
  effects.traverse(object => { object.userData.halloweenCodeExclude = true; });
  let serial = 1, emission = 0, trail = 0, shockAge = 10, shockSize = 1, impactAge = 10;
  let deathBurst = false, phase = "inactive", lastX = 0, lastZ = 0;
  const random = () => { serial = (serial * 1664525 + 1013904223) >>> 0; return serial / 4294967296; };

  function burst(position, count = 32, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = random() * TAU, r = (.35 + random()) * power;
      sparks.emit(position.x, position.y, position.z, Math.cos(a) * r, (.3 + random() * 1.4) * power,
        Math.sin(a) * r, .4 + random() * .9, i % 3 ? purple : hot);
    }
    for (let i = 0; i < (lowPower ? 3 : 6); i++) haze.emit(position.x, position.y, position.z,
      (random() - .5) * power, .15 + random() * .35, (random() - .5) * power, .7 + random(), purple);
  }
  function pulse(position, size) {
    shock.position.set(position.x, .07, position.z); shockAge = 0; shockSize = size; shock.visible = true;
  }
  return {
    projectile,
    setPhase(next, position) {
      phase = next; emission = 0; deathBurst = false;
      if (next === "spawning") pulse(position, 2.1);
      if (next === "dying") { projectile.visible = false; burst({ x: position.x, y: 1.3, z: position.z }, lowPower ? 32 : 54, .8); }
      if (["inactive", "gone", "game-over"].includes(next)) {
        portal.visible = projectile.visible = shock.visible = impactGlow.visible = false;
        strands.forEach(line => { line.visible = false; }); sparks.clear(); haze.clear();
      }
    },
    teleportOut(position) { burst({ x: position.x, y: 1, z: position.z }, 24); pulse(position, 1.1); },
    teleportIn(position) { portal.position.set(position.x, .055, position.z); burst({ x: position.x, y: 1, z: position.z }, 32); pulse(position, 1.6); },
    hit(position) { burst({ x: position.x, y: 1.4, z: position.z }, 24, .65); },
    enrage(position) { pulse(position, 3); burst({ x: position.x, y: 1.3, z: position.z }, lowPower ? 36 : 60, 1.25); },
    impact(position) { burst(position, 28, .75); impactGlow.position.copy(position); impactGlow.visible = true; impactAge = 0; },
    wave(position, radius = 2.55) { pulse(position, radius); },
    update(dt, elapsed, position, phaseTime, deathDuration, quiet = false, charging = false, deathAnchor = position, vanishing = false) {
      if (["inactive", "gone", "game-over"].includes(phase)) return;
      lastX = position.x; lastZ = position.z;
      const spawning = phase === "spawning", dying = phase === "dying";
      const fade = dying ? 1 - smooth((phaseTime - deathDuration) / 1.3) : 1;
      const energy = spawning ? Math.sin(Math.min(1, phaseTime / 5) * Math.PI) : dying ? fade * .8 : .22;
      portal.visible = fade > 0 && !vanishing;
      portal.position.set(lastX, .055, lastZ);
      portal.scale.setScalar(spawning ? .5 + smooth(phaseTime / 2) * .7 : dying ? .9 + smooth(phaseTime / deathDuration) * .3 : .85);
      outer.material.opacity = (.18 + energy * .6) * fade;
      inner.material.opacity = (.18 + energy * .65) * fade;
      runes.material.opacity = (.22 + energy * .7) * fade;
      well.material.opacity = (.06 + energy * .3) * fade;
      outer.rotation.z += dt * (quiet ? .06 : -.22);
      inner.rotation.z += dt * (quiet ? .06 : .3);
      runes.rotation.z += dt * .08;
      for (let s = 0; s < strands.length; s++) {
        const line = strands[s];
        line.visible = spawning && phaseTime > .25 && phaseTime < 4.6;
        if (!line.visible) continue;
        line.material.opacity = Math.sin(Math.min(1, phaseTime / 4.6) * Math.PI) * (quiet ? .2 : .45);
        line.position.set(lastX, 0, lastZ);
        line.rotation.y = s / 3 * TAU + elapsed * (quiet ? .25 : 1.3);
        const radius = 1 - smooth(phaseTime / 5) * .3;
        line.scale.set(radius, 1, radius);
      }
      emission += dt * (lowPower ? 22 : 42) * (quiet ? .5 : 1);
      while (emission >= 1) {
        emission--;
        if (!spawning && !dying && !charging) continue;
        if (dying && phaseTime > deathDuration + 1.3) continue;
        const a = random() * TAU, radius = spawning ? .6 + random() * .65 : random() * .8;
        const y = dying ? .25 + random() * .5 : random() * 2.8;
        sparks.emit((dying ? deathAnchor.x : lastX) + Math.cos(a) * radius, y, (dying ? deathAnchor.z : lastZ) + Math.sin(a) * radius,
          -Math.sin(a) * .3, .45 + random() * .6, Math.cos(a) * .3, .5 + random(), random() > .75 ? red : purple);
        if (serial % 4 === 0) haze.emit(lastX + Math.cos(a) * radius, .18, lastZ + Math.sin(a) * radius,
          Math.cos(a) * .15, .2, Math.sin(a) * .15, .8, purple);
      }
      if (dying && phaseTime >= deathDuration && !deathBurst) {
        deathBurst = true;
        pulse(deathAnchor, 2.3);
        burst({ x: deathAnchor.x, y: .35, z: deathAnchor.z }, lowPower ? 42 : 72, 1.2);
      }
      if (projectile.visible) {
        heart.rotation.y += dt * 2;
        arcs.forEach((arc, i) => { arc.rotation.y += dt * (i % 2 ? -2 : 2.7) * (quiet ? .3 : 1); arc.rotation.z += dt * .8; });
        aura.material.opacity = quiet ? .65 : .74 + .1 * Math.sin(elapsed * 5);
        trail += dt * (lowPower ? 32 : 55);
        while (trail >= 1) {
          trail--;
          const p = projectile.position;
          sparks.emit(p.x + (random() - .5) * .2, p.y + (random() - .5) * .2, p.z + (random() - .5) * .2,
            0, .12, 0, .25 + random() * .3, random() > .5 ? hot : purple);
          if (serial % 3 === 0) haze.emit(p.x, p.y, p.z, 0, .06, 0, .3, purple);
        }
      } else trail = 0;
      if (shock.visible) {
        shockAge += dt;
        const t = Math.min(1, shockAge / 1.15);
        shock.scale.setScalar(.15 + smooth(t) * shockSize);
        shock.material.opacity = (1 - t) ** 2 * (quiet ? .2 : .7);
        shock.visible = t < 1;
      }
      if (impactGlow.visible) {
        impactAge += dt;
        impactGlow.scale.setScalar(.4 + impactAge * 2);
        impactGlow.material.opacity = Math.max(0, 1 - impactAge / .35) * (quiet ? .35 : .85);
        impactGlow.visible = impactAge < .35;
      }
      sparks.update(dt, quiet); haze.update(dt, quiet);
    },
    dispose() {
      const geometries = new Set(), materials = new Set();
      effects.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose());
      sparkTexture.dispose(); hazeTexture.dispose(); effects.removeFromParent();
    },
  };
}
