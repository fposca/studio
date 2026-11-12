import * as THREE from "three";

const TAU = Math.PI * 2;
const COLORS = [0x79dbef, 0xe8c480, 0xec78b0];
const MEMORY_POSITIONS = [[-3.4, -26.5], [0, -30.4], [3.4, -26.5]];
const ease = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// A small, preallocated pool attached to cathedralEnergy's root and disposed by its owner.
export function createCathedralResonance(root, glowTexture) {
  const bursts = [], paths = [];
  const ringGeometry = new THREE.TorusGeometry(1, .009, 6, 64);
  const line = (positions, color) => {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  };
  function makeBurst(x, y, z, index, altar = false) {
    const group = new THREE.Group(); group.name = altar ? "Ondas de la Primera Voz" : "Activación / recuerdo " + index;
    root.add(group); group.visible = false;
    const color = altar ? 0xd5c2f2 : COLORS[index];
    const waves = [0, 1].map(i => {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const wave = new THREE.Mesh(ringGeometry, material);
      wave.position.set(x, i ? .045 : y, z); wave.rotation.x = Math.PI / 2; group.add(wave); return wave;
    });
    const marks = [];
    if (index === 0 && !altar) {
      for (let i = -2; i <= 2; i++) {
        marks.push(-.62, i * .22, 0, .62, i * .22, 0, i * .22, -.62, 0, i * .22, .62, 0);
      }
    } else if (index === 1 || altar) {
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6, xx = Math.cos(a) * .65, yy = Math.sin(a) * .65;
        marks.push(xx - .09, yy - .1, 0, xx, yy + .1, 0, xx, yy + .1, 0, xx + .09, yy - .1, 0,
          xx - .06, yy - .02, 0, xx + .06, yy - .02, 0);
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const xx = Math.sin(i * 2.4) * .62, yy = Math.cos(i * 3.2) * .5;
        marks.push(xx, yy, 0, xx + .18, yy, 0, xx + .18, yy, 0, xx + .18, yy + .12, 0);
      }
    }
    const glyphs = line(marks, color); glyphs.position.set(x, y, z); group.add(glyphs);
    const positions = new Float32Array(40 * 3), seeds = new Float32Array(40 * 3);
    for (let i = 0; i < 40; i++) seeds.set([Math.cos(i * 2.4) * .55, (i % 7) * .09, Math.sin(i * 2.4) * .55], i * 3);
    positions.set(seeds);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3.5);
    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      map: glowTexture, color, size: .055, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    particles.position.set(x, y - .4, z); group.add(particles);
    const b = { group, waves, glyphs, particles, seeds, positions, altar, index }; bursts.push(b); return b;
  }
  MEMORY_POSITIONS.forEach(([x, z], index) => makeBurst(x, 2.12, z, index));
  makeBurst(0, 2.75, -53.6, 1, true);

  const badgeGroup = new THREE.Group(); badgeGroup.name = "Sello / tres recuerdos";
  badgeGroup.position.set(0, 5.4, -41.32); root.add(badgeGroup);
  const badges = COLORS.map((color, i) => {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshStandardMaterial({
      color: 0x302532, emissive: color, emissiveIntensity: .03, metalness: .45, roughness: .4,
    }));
    mesh.position.x = (i - 1) * .52; badgeGroup.add(mesh); return mesh;
  });
  const cracks = line([-.9, 0, 0, -.45, .25, 0, -.45, .25, 0, -.2, -.12, 0, -.2, -.12, 0, .2, .15, 0, .2, .15, 0, .6, -.2, 0, .6, -.2, 0, .95, .06, 0], 0xc78cda);
  cracks.position.set(0, 4.05, -41.3); root.add(cracks);
  MEMORY_POSITIONS.forEach(([x, z], i) => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 2.12, z), new THREE.Vector3(x * .65, 3.8, (z - 42) / 2), new THREE.Vector3((i - 1) * .52, 5.4, -41.3)]);
    const material = new THREE.MeshBasicMaterial({ color: COLORS[i], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .012, 4, false), material);
    mesh.name = "Conexión del recuerdo / " + i; root.add(mesh);
    paths.push({ mesh, material, curve });
  });
  const spectrumGeometry = new THREE.BufferGeometry();
  const spectrumPositions = new Float32Array(32 * 6);
  spectrumGeometry.setAttribute("position", new THREE.BufferAttribute(spectrumPositions, 3).setUsage(THREE.DynamicDrawUsage));
  spectrumGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2.5);
  const spectrum = new THREE.LineSegments(spectrumGeometry, new THREE.LineBasicMaterial({ color: 0xbcefe1, transparent: true, opacity: .7, depthWrite: false }));
  spectrum.name = "Transmisión / espectro abstracto"; spectrum.position.set(0, 2.6, -52.95); spectrum.visible = false; root.add(spectrum);
  const symbol = line([0, .24, 0, -.21, -.12, 0, -.21, -.12, 0, .21, -.12, 0, .21, -.12, 0, 0, .24, 0,
    0, -.24, 0, -.21, .12, 0, -.21, .12, 0, .21, .12, 0, .21, .12, 0, 0, -.24, 0], 0xe7d2a1);
  symbol.name = "Símbolo de la Primera Voz"; symbol.position.set(0, 2.75, -53.08); symbol.visible = false; root.add(symbol);
  const hint = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: 0xe8cc97, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  hint.name = "Destino señalado por el Custodio"; hint.position.set(0, 1.43, -53.6); hint.rotation.x = -Math.PI / 2; root.add(hint);

  const presence = new THREE.Group(); presence.name = "Presencia del Custodio"; root.add(presence);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xa39ac4, transparent: true, opacity: .06, depthWrite: false, blending: THREE.AdditiveBlending }));
  aura.position.y = 1.4; aura.scale.set(1.5, 2.8, 1); presence.add(aura);
  const dustPositions = new Float32Array(18 * 3);
  for (let i = 0; i < 18; i++) dustPositions.set([Math.cos(i * 2.4) * .6, .35 + i / 18 * 2, Math.sin(i * 2.4) * .6], i * 3);
  const dustGeometry = new THREE.BufferGeometry(); dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ map: glowTexture, color: 0xc8b4e5, size: .04, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
  presence.add(dust);
  let gate = null, actor = null;
  return {
    attachGate(value) { gate = value; },
    attachCustodian(value) { actor = value; },
    update(time, progress, fx, reducedMotion, profile, camera) {
      const count = progress?.memories?.length || 0, vision = !!progress?.visionActive;
      bursts.forEach(b => {
        const age = b.altar ? Math.min(fx.altarAge, fx.finalAge) : fx.memoryAges[b.index];
        const visible = age < 2.6 && (!camera || camera.position.distanceTo(b.particles.position) < profile.effectDistance);
        b.group.visible = visible;
        if (!visible) return;
        const t = Math.min(1, age / 2.6), fade = Math.sin(Math.PI * t);
        b.waves.forEach((wave, i) => {
          wave.scale.setScalar(reducedMotion ? .8 : .5 + t * (b.altar ? 3.2 : 1.9) + i * .2);
          wave.material.opacity = fade * (reducedMotion ? .12 : .48);
        });
        b.glyphs.material.opacity = fade * .7;
        if (camera) b.glyphs.quaternion.copy(camera.quaternion);
        else b.glyphs.rotation.set(0, 0, 0);
        b.glyphs.rotateZ(reducedMotion ? 0 : (b.index === 2 ? Math.sin(t * 5) * .025 : t * .3));
        const n = Math.floor(40 * profile.particleScale);
        b.particles.geometry.setDrawRange(0, n); b.particles.material.opacity = fade * .8;
        for (let i = 0; i < n; i++) {
          b.positions[i * 3] = b.seeds[i * 3] * (reducedMotion ? 1 : 1 + t);
          b.positions[i * 3 + 1] = b.seeds[i * 3 + 1] + (reducedMotion ? 0 : t * 1.6);
          b.positions[i * 3 + 2] = b.seeds[i * 3 + 2] * (reducedMotion ? 1 : 1 + t);
        }
        b.particles.geometry.attributes.position.needsUpdate = true;
      });
      badges.forEach((badge, i) => { badge.material.emissiveIntensity = i < count ? .9 : .025; });
      cracks.material.opacity = count >= 2 && !progress?.altarOpen ? (vision ? .38 : .12) : 0;
      const convergence = fx.sealAge < 3 ? Math.sin(Math.PI * fx.sealAge / 3) : 0;
      paths.forEach((p, i) => {
        const recent = fx.memoryAges[i] < 2.6 ? Math.sin(Math.PI * fx.memoryAges[i] / 2.6) : 0;
        p.material.opacity = (i < count ? convergence * .7 + recent * .35 + (vision ? .08 : 0) : 0) * profile.haloScale;
        p.mesh.visible = p.material.opacity > .01;
      });
      if (gate) {
        const open = progress?.altarOpen ? (fx.sealAge < 3 ? ease(fx.sealAge / 1.1) : 1) : 0;
        gate.bars.visible = open < 1; gate.bars.scale.y = Math.max(.001, 1 - open); gate.bars.position.y = open * 5.3;
        gate.seal.visible = open < 1;
        gate.seal.scale.setScalar(1.45 * Math.max(.01, 1 - open));
        gate.bars.userData.openFraction = open;
      }
      spectrum.visible = !!fx.narrative || fx.altarAge < 3.4;
      if (spectrum.visible) {
        for (let i = 0; i < 32; i++) {
          const h = .05 + .22 * Math.abs(Math.sin(i * 1.7 + time * .8) * Math.sin(i * .3 - time * 1.1));
          spectrumPositions.set([(i - 15.5) * .075, -h, 0, (i - 15.5) * .075, h, 0], i * 6);
        }
        spectrumGeometry.attributes.position.needsUpdate = true;
        spectrum.material.opacity = .35 + .15 * Math.exp(-fx.narrativeAge);
      }
      symbol.visible = !!progress?.recordingHeard;
      symbol.material.opacity = fx.finalAge < 2.8 ? ease((fx.finalAge - .4) / 1.2) * .9 : .48;
      symbol.rotation.z = reducedMotion ? 0 : time * .09;
      hint.material.opacity = fx.hintAge < 3 ? Math.sin(Math.PI * fx.hintAge / 3) * .55 : progress?.altarOpen && !progress?.altarActivated ? .12 : 0;
      hint.scale.setScalar(1 + (reducedMotion ? 0 : .035 * Math.sin(time)));
      if (actor) {
        presence.position.copy(actor.position);
        aura.material.opacity = vision ? .13 : .045;
        dust.geometry.setDrawRange(0, Math.floor(18 * profile.particleScale));
        dust.rotation.y = reducedMotion ? 0 : time * .06;
      } else presence.visible = false;
    },
  };
}
