import * as THREE from "three";
import { createOrbGlowTexture, createOrbHalo, createPlasmaOrb } from "./neonOrbVisuals.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createCathedralResonance } from "./cathedralResonance.js";
import { cathedralProfile } from "./cathedralQuality.js";

const TAU = Math.PI * 2;
const PALETTES = [
  { accent: 0x63cadf, deep: 0x102135, glow: 0x438cab, arc: 0xc0f5ff },
  { accent: 0xd4b46f, deep: 0x271633, glow: 0x9878b8, arc: 0xffe4a5 },
  { accent: 0xe55c9b, deep: 0x2d102a, glow: 0xb53d71, arc: 0xffb0ce },
];
const RECOVERED = PALETTES.map(p => ({ ...p, accent: p.arc }));
const FREQUENCY = { accent: 0xa4bee9, deep: 0x131f32, glow: 0x688ac3, arc: 0xd7e8ff };
const DEFAULT_PROFILE = cathedralProfile("high");
const IDLE_FX = { memoryAges: [Infinity, Infinity, Infinity], sealAge: Infinity, altarAge: Infinity, finalAge: Infinity, hintAge: Infinity, narrativeAge: Infinity, narrative: false };

// All effects belong to this scene. No extra lights, render targets or external textures.
export function createCathedralEnergy(parent) {
  const root = new THREE.Group(); root.name = "Catedral / ecos de energía"; parent.add(root);
  const glowTexture = createOrbGlowTexture();
  const resonance = createCathedralResonance(root, glowTexture);
  const bronze = new THREE.MeshStandardMaterial({ color: 0xaf9066, metalness: .66, roughness: .36 });
  const obsidian = new THREE.MeshStandardMaterial({ color: 0x262234, metalness: .48, roughness: .27 });
  const shardGeometry = new THREE.OctahedronGeometry(1);
  const rimGeometry = new THREE.TorusGeometry(.52, .012, 6, 64, Math.PI * .7);
  const socketGeometry = new THREE.CylinderGeometry(.43, .5, .08, 32);
  const collarGeometry = new THREE.TorusGeometry(.47, .017, 8, 64);
  const relics = [], portals = [];
  let time = 0, disposed = false;
  const addMesh = (group, geometry, material, name) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; group.add(mesh); return mesh;
  };
  function motes(group, radius, color, count = 28) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996, h = (i + .5) / count;
      const r = radius * (.62 + .35 * Math.sin(i * 17.7) ** 2);
      positions.set([Math.cos(a) * r, (h - .5) * radius * 2.3, Math.sin(a) * r], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      map: glowTexture, color, size: .033, transparent: true, opacity: .7,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    points.name = "Partículas de recuerdo"; group.add(points); return points;
  }
  function frequencyClue(index, x, z) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 192;
    const ctx = canvas.getContext("2d");
    ctx.translate(96, 96);
    ctx.beginPath(); ctx.moveTo(0, -85); ctx.lineTo(85, 0); ctx.lineTo(0, 85); ctx.lineTo(-85, 0); ctx.closePath();
    ctx.fillStyle = "rgba(12,21,31,.88)"; ctx.fill();
    ctx.strokeStyle = "#89cfc3"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, -41); ctx.lineTo(30, -41); ctx.moveTo(-30, 41); ctx.lineTo(30, 41);
    ctx.strokeStyle = "#738f98"; ctx.stroke();
    ctx.fillStyle = "#d6fff1";
    for (let i = 0; i <= index; i++) ctx.fillRect((i - index / 2) * 24 - 4, -22, 8, 44);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
    const clue = addMesh(root, new THREE.PlaneGeometry(.54, .54), material, "Pista de frecuencia / " + (index + 1));
    clue.position.set(x, 3.08, z); clue.visible = false; return clue;
  }
  function relic({ id, x, y, z, index = 0, size = 1, altar = false }) {
    const group = new THREE.Group(); group.name = altar ? "Primera Voz / resonador" : "Recuerdo / " + id;
    group.position.set(x, y, z); group.scale.setScalar(size); root.add(group);
    const palette = PALETTES[index % PALETTES.length];
    const plasma = createPlasmaOrb({ radius: .285, texture: glowTexture, phase: index * 1.8 });
    plasma.root.name = "Núcleo de plasma tallado";
    group.add(plasma.root);
    const cradle = new THREE.Group(); cradle.name = "Engarce de obsidiana y latón"; group.add(cradle);
    for (const side of [-1, 1]) {
      const shard = addMesh(cradle, shardGeometry, obsidian, "Cristal de contención");
      shard.position.y = side * .395; shard.scale.set(.15, .22, .15);
      const tip = addMesh(cradle, shardGeometry, bronze, "Remate de latón");
      tip.position.y = side * .565; tip.scale.set(.069, .095, .069);
    }
    const orbits = new THREE.Group(); orbits.name = "Armadura de frecuencia"; group.add(orbits);
    orbits.rotation.set(.44, .25, -.32);
    for (let i = 0; i < 2; i++) {
      const orbit = addMesh(orbits, rimGeometry, bronze, "Órbita metálica abierta"); orbit.rotation.z = i * Math.PI;
      const gem = addMesh(orbits, shardGeometry, obsidian, "Fragmento en órbita");
      gem.position.set(Math.cos(i * Math.PI + .4) * .52, Math.sin(i * Math.PI + .4) * .52, 0);
      gem.scale.set(.052, .1, .052); gem.rotation.z = i * Math.PI - .4;
    }
    const particles = motes(group, .67, palette.arc, altar ? 48 : 28);
    const halo = createOrbHalo(glowTexture, palette.glow, 1.6, .12); halo.name = "Resplandor del recuerdo"; group.add(halo);
    const socket = addMesh(root, socketGeometry, obsidian, "Receptor del recuerdo");
    socket.position.set(x, altar ? 1.41 : 1.36, z); socket.scale.setScalar(size);
    const collar = addMesh(socket, collarGeometry, bronze, "Borde del receptor");
    collar.rotation.x = Math.PI / 2; collar.position.y = .055;
    const reflection = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), new THREE.MeshBasicMaterial({
      map: glowTexture, color: palette.glow, transparent: true, opacity: .16,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    reflection.name = "Luz sobre el pedestal"; reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(x, altar ? 1.49 : 1.412, z); reflection.scale.setScalar(size); root.add(reflection);
    const clue = altar ? null : frequencyClue(index, x, z);
    const record = { id, group, plasma, particles, halo, orbits, reflection, clue, palette, y, index, altar, state: null };
    relics.push(record);
    return group;
  }
  function portal(x, y, z) {
    const group = new THREE.Group(); group.name = "Umbral del Abismo / frecuencia abierta";
    group.position.set(x, y, z); group.visible = false; root.add(group);
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: [
        "varying vec2 vUv;",
        "void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
      ].join("\n"),
      fragmentShader: [
        "uniform float uTime; varying vec2 vUv;",
        "void main(){",
        "vec2 p = (vUv - .5) * 2.; float r = length(p); float a = atan(p.y, p.x);",
        "float edge = 1. - smoothstep(.88, 1., r);",
        "float spiral = pow(.5 + .5 * sin(a * 6. + r * 28. - uTime * .6), 12.);",
        "float layers = pow(.5 + .5 * sin(r * 46. + sin(a * 4. - uTime * .2) * 1.4 - uTime * .4), 16.);",
        "float rim = exp(-pow((r - .88) * 38., 2.));",
        "float depth = smoothstep(.12, .8, r);",
        "vec3 color = vec3(.012, .014, .03) + vec3(.08, .045, .17) * depth;",
        "color += vec3(.13, .28, .29) * spiral * depth * .38 + vec3(.17, .1, .3) * layers * depth * .4;",
        "color += vec3(.42, .72, .65) * rim * .6;",
        "gl_FragColor = vec4(color, edge * .97);",
        "#include <colorspace_fragment>",
        "}",
      ].join("\n"),
      transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    const field = addMesh(group, new THREE.PlaneGeometry(3.55, 4.15), material, "Profundidad del umbral");
    const frame = new THREE.Group(); frame.name = "Marco del umbral"; group.add(frame);
    frame.scale.set(1, 1.17, 1);
    const arcGeometry = new THREE.TorusGeometry(1.68, .026, 8, 36, TAU / 6 - .13);
    for (let i = 0; i < 6; i++) {
      const arc = addMesh(frame, arcGeometry, bronze, "Marco segmentado"); arc.rotation.z = i * TAU / 6;
      const gem = addMesh(frame, shardGeometry, obsidian, "Sello del umbral");
      gem.position.set(Math.cos(i * TAU / 6) * 1.68, Math.sin(i * TAU / 6) * 1.68, .02);
      gem.scale.set(.065, .13, .065); gem.rotation.z = i * TAU / 6 - Math.PI / 2;
    }
    const particles = motes(group, 1.65, 0x9bdbce, 48); particles.scale.y = 1.2;
    portals.push({ group, material, particles, field }); return group;
  }
  return {
    memory: (id, x, z, index) => relic({ id, x, y: 2.12, z, index }),
    altar: (x, z) => relic({ id: "primera-voz", x, y: 2.75, z, index: 1, size: 1.7, altar: true }),
    portal,
    attachGate: resonance.attachGate,
    attachCustodian: resonance.attachCustodian,
    update(dt, progress, paused = false, reducedMotion = false, camera = null, options = {}) {
      if (disposed) return;
      if (!paused && !reducedMotion) time += Math.min(.05, Math.max(0, dt));
      const vision = Boolean(progress?.visionActive);
      const profile = options.profile || DEFAULT_PROFILE, fx = options.fx || IDLE_FX;
      const player = options.player;
      for (const r of relics) {
        const restored = r.altar ? Boolean(progress?.altarActivated) : Boolean(progress?.memories?.includes(r.id));
        const state = restored ? "restored" : vision ? "frequency" : "dormant";
        const palette = restored ? RECOVERED[r.index % 3] : vision ? FREQUENCY : r.palette;
        if (state !== r.state) {
          r.state = state; r.plasma.setPalette(palette);
          r.particles.material.color.set(palette.arc); r.halo.material.color.set(palette.glow);
          r.reflection.material.color.set(palette.glow);
          r.group.userData.restored = restored;
        }
        const nearby = player && Math.hypot(player.x - r.group.position.x, player.z - r.group.position.z) < 2.8;
        const ready = r.altar ? progress?.altarOpen : progress?.archiveOpen;
        const interactable = !!(nearby && ready && !restored);
        r.group.userData.interactable = interactable;
        const pulse = restored ? 0 : .06 * (1 + Math.sin(time * 1.4 + r.index));
        const activationAge = r.altar ? fx.altarAge : fx.memoryAges[r.index];
        const transient = activationAge < 2.6 ? Math.sin(Math.PI * activationAge / 2.6) * .28 : 0;
        const base = r.altar && !ready ? .22 : restored ? .95 : interactable ? .85 : .5;
        const finalDim = r.altar && fx.finalAge < 1.2 ? .28 + .72 * Math.min(1, Math.abs(fx.finalAge - .5) / .7) : 1;
        const clock = time * (r.altar && fx.narrative ? .45 : .28);
        r.plasma.update(clock, (base + pulse + transient) * finalDim);
        r.plasma.halo.material.opacity *= .48 * profile.haloScale;
        r.halo.material.opacity = (restored ? .15 : interactable ? .16 + pulse * .2 : .065) * profile.haloScale;
        r.group.position.y = r.y + Math.sin(time * .75 + r.index * 1.8) * .035;
        r.orbits.rotation.y = .25 + time * .09;
        r.particles.rotation.y = -time * .13;
        r.particles.material.opacity = reducedMotion ? .38 : .6;
        r.particles.geometry.setDrawRange(0, Math.floor(r.particles.geometry.attributes.position.count * profile.particleScale));
        const nearEnough = !camera || camera.position.distanceTo(r.group.position) < profile.effectDistance;
        r.particles.visible = nearEnough; r.halo.visible = nearEnough;
        r.reflection.material.opacity = (restored ? .25 : .13 + transient) * profile.haloScale;
        if (r.clue) {
          r.clue.visible = vision;
          if (camera) r.clue.quaternion.copy(camera.quaternion);
        }
      }
      for (const p of portals) {
        p.group.visible = Boolean(progress?.completed);
        p.material.uniforms.uTime.value = time;
        p.particles.rotation.z = time * .035;
        p.particles.geometry.setDrawRange(0, Math.floor(48 * profile.particleScale));
      }
      resonance.update(time, progress, fx, reducedMotion, profile, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true; disposeObjects([root]); glowTexture.dispose();
      root.removeFromParent();
    },
  };
}
