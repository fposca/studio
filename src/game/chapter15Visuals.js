import * as THREE from "three";
import { createChapter15StoreEchoes } from "./chapter15StoreEchoes.js";
import { createStoreInvasionVision } from "./storeInvasionVision.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { CHAPTER15_VISUAL_BUDGETS, chapter15VisualTier, createChapter15VisualTimeline } from "./chapter15VisualState.js";

const TAU = Math.PI * 2;
const violet = new THREE.Color(0xbda0f4), amber = new THREE.Color(0xffc48b);

function canvasSurface(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter;
  return { canvas, ctx: canvas.getContext("2d"), texture };
}

function panel(parent, name, width, height, material, position) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.name = name; mesh.position.set(...position); parent.add(mesh);
  return mesh;
}

function signalMaterial(color, opacity = .5) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false });
}

function glassInterference() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, strength: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float time; uniform float strength;
      void main() {
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(0.0, 0.08, 1.0 - vUv.x);
        float y = vUv.y + sin(vUv.x * 14.0 + time * 0.65) * 0.014 * strength;
        float wave = pow(max(0.0, sin(y * 100.0 - time * 1.5)), 18.0);
        float band = pow(max(0.0, sin(y * 9.0 + time * 0.4)), 14.0);
        gl_FragColor = vec4(mix(vec3(0.51, 0.65, 0.66), vec3(0.67, 0.46, 0.88), band),
          edge * strength * (wave * 0.15 + band * 0.11 + pow(max(0.0, sin((vUv.x + y * .32) * 17.0 + time * .12)), 70.0) * .18));
      }`,
  });
}

// Materials are cloned per variant and per surface role. Texture maps are only
// read: no shared texture, GLB, geometry or global catalog is modified.
function surfaceVariants() {
  const copies = new Map(), assignments = [], visited = new WeakSet();
  function materialFor(original, role) {
    if (!original?.isMeshStandardMaterial) return original;
    const key = original.uuid + ":" + role;
    if (copies.has(key)) return copies.get(key);
    const copy = original.clone();
    copy.name = "chapter15:" + (original.name || role);
    copy.envMapIntensity = .8;
    if (role === "instrument") {
      copy.roughness = Math.min(copy.roughness, .27);
      copy.metalness = Math.max(copy.metalness, .18);
      copy.envMapIntensity = 1.2;
      // Preserve baked texture colors and metallic maps on the existing GLBs.
    } else if (role === "equipment") {
      copy.roughness = Math.min(copy.roughness, .34);
      copy.metalness = Math.max(copy.metalness, .30);
      copy.envMapIntensity = 1.05;
    } else if (role === "glass") {
      if (copy.isMeshPhysicalMaterial) copy.transmission = 0; // no extra transmission render on Android
      copy.color.setHex(0x9faeb5); copy.opacity = .10; copy.roughness = .17;
      copy.metalness = .17; copy.depthWrite = false;
    } else if (role === "wood") {
      copy.roughness = .44; copy.metalness = .02;
      copy.envMapIntensity = .48;
    } else if (role === "fabric") {
      copy.roughness = .98; copy.metalness = 0;
      if (copy.bumpMap) copy.bumpScale = Math.max(copy.bumpScale, .009);
    } else if (copy.metalness > .55) {
      copy.roughness = Math.min(copy.roughness, .3);
    }
    copies.set(key, copy);
    return copy;
  }
  return {
    apply(root, role = "room") {
      root?.traverse(object => {
        if (!object.isMesh || visited.has(object) || object.userData.chapter15Effect) return;
        visited.add(object);
        const original = object.material;
        const resolve = material => {
          const name = (object.name + " " + material?.name).toLowerCase();
          const kind = /glass/.test(name) ? "glass" : /fabric|felt|rug/.test(name) ? "fabric"
            : /parquet|walnut|timber|floor/.test(name) ? "wood" : role;
          return materialFor(material, kind);
        };
        object.material = Array.isArray(original) ? original.map(resolve) : resolve(original);
        assignments.push([object, original]);
      });
    },
    dispose() {
      for (const [object, original] of assignments) object.material = original;
      // Texture ownership remains with the original scene, disposed by its loader.
      for (const material of copies.values()) material.dispose();
      copies.clear(); assignments.length = 0;
    },
  };
}

function drawMeters(surface, state) {
  const { ctx, canvas } = surface, w = canvas.width, h = canvas.height;
  ctx.fillStyle = "#111718"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#766c59"; ctx.lineWidth = 2; ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.save(); ctx.scale(w / 1024, h / 256);
  ctx.font = "bold 14px Arial, sans-serif"; ctx.fillStyle = "#c2b9a5";
  ctx.fillText("NEON RECORDING  /  ANALOG DESK", 20, 23);
  for (let meter = 0; meter < 2; meter++) {
    const x = 22 + meter * 152;
    ctx.fillStyle = "#c5ad78"; ctx.fillRect(x, 40, 138, 118);
    ctx.strokeStyle = "#454331"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + 69, 149, 74, Math.PI * 1.19, Math.PI * 1.81); ctx.stroke();
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (1.19 + i * .062);
      ctx.beginPath(); ctx.moveTo(x + 69 + Math.cos(a) * 72, 149 + Math.sin(a) * 72);
      ctx.lineTo(x + 69 + Math.cos(a) * 64, 149 + Math.sin(a) * 64); ctx.stroke();
    }
    const level = .45 + Math.sin(state.time * 1.4 + meter) * .16 + state.surge * .3;
    const angle = Math.PI * (1.2 + level * .6);
    ctx.strokeStyle = "#823626"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 69, 149); ctx.lineTo(x + 69 + Math.cos(angle) * 67, 149 + Math.sin(angle) * 67); ctx.stroke();
    ctx.fillStyle = "#363d34"; ctx.font = "bold 15px Arial"; ctx.fillText(meter ? "VU / R" : "VU / L", x + 42, 62);
  }
  for (let channel = 0; channel < 16; channel++) {
    const x = 354 + channel * 39;
    const hidden = channel === 13 && (state.vision || state.stable);
    const level = state.stable ? 7 : 4 + Math.floor((Math.sin(state.time * 1.3 + channel * 1.7) + 1) * 2 + state.surge * 4);
    for (let step = 0; step < 10; step++) {
      ctx.fillStyle = hidden ? step < level ? "#c3a0fa" : "#30213d"
        : step < level ? step > 7 ? "#d6a96a" : "#96bf8c" : "#25302c";
      ctx.fillRect(x, 157 - step * 11, 22, 7);
    }
    ctx.fillStyle = "#c3b69e"; ctx.font = "12px monospace";
    ctx.fillText(hidden ? "?" : String(channel + 1).padStart(2, "0"), x + 3, 181);
  }
  ctx.fillStyle = state.vision || state.stable ? "#ccb6f5" : "#b5b9a8";
  ctx.font = "17px monospace";
  ctx.fillText(state.stable ? "CH ?  /  SIGNAL LOCKED  /  44.1 kHz"
    : state.vision ? "CH ?  /  +2049 dB  /  FREQ: --:--" : "TAPE RETURN  /  44.1 kHz  /  SESSION 1999", 24, 220);
  ctx.fillStyle = "#bca97d"; ctx.fillRect(24, 237, 968, 2);
  ctx.restore(); surface.texture.needsUpdate = true;
}

function drawCRT(surface, state) {
  const { ctx, canvas } = surface, w = canvas.width, h = canvas.height;
  const abnormal = state.vision || state.interference > .15;
  ctx.save(); ctx.scale(w / 640, h / 400);
  ctx.fillStyle = "#0b2427"; ctx.fillRect(0, 0, 640, 400);
  ctx.fillStyle = "#91a9a4"; ctx.fillRect(18, 18, 604, 363);
  ctx.fillStyle = "#152d4b"; ctx.fillRect(22, 22, 596, 31);
  ctx.fillStyle = "#eceddb"; ctx.font = "bold 17px monospace";
  ctx.fillText("NEON AUDIO WORKSTATION - SESSION 04", 31, 44);
  ctx.fillStyle = "#172d2c"; ctx.fillRect(29, 87, 582, 219);
  ctx.font = "15px monospace"; ctx.fillStyle = "#223a3b"; ctx.fillText("File   Edit   Track   Transport   Help", 30, 76);
  for (let row = 0; row < 4; row++) {
    const y = 101 + row * 48;
    ctx.fillStyle = "#8fb29e"; ctx.fillText(["VOX", "GTR", "TAPE", "AUX"][row], 38, y + 21);
    ctx.strokeStyle = row === 3 && abnormal ? "#c5a1ed" : "#78a894";
    ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 240; i++) {
      const amplitude = Math.sin(i * .31 + row) * Math.sin(i * .067 + state.time * .3) * 13;
      const x = 106 + i * 2;
      if (!i) ctx.moveTo(x, y + 16 + amplitude); else ctx.lineTo(x, y + 16 + amplitude);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "#2d4948"; ctx.fillRect(29, 316, 582, 54);
  ctx.fillStyle = abnormal ? "#e4c5fa" : "#b9d8b8"; ctx.font = "bold 16px monospace";
  ctx.fillText(abnormal ? "ARCHIVO TEMPORAL NO RECONOCIDO" : state.stable ? "CINTA AISLADA / SIGNAL LOCKED" : "REC READY   00:04:19   16 bit / 44.1 kHz", 40, 338);
  ctx.font = "14px monospace";
  ctx.fillText(abnormal ? "REGISTRO: 2049  /  FRECUENCIA FUERA DE RANGO" : "STUDIO A / 1999 / ANALOG INPUT", 40, 359);
  // A slow horizontal drift, not blinking text or rapid flashing.
  if (abnormal) {
    const y = 70 + (state.time * 14) % 220;
    ctx.fillStyle = "#bfa5d42b"; ctx.fillRect(27, y, 586, 8);
    ctx.fillStyle = "#bdabc71c"; ctx.fillRect(38, y + 19, 558, 3);
  }
  if (state.interference > .05) {
    const y = 85 + Math.floor((state.time * 31) % 180);
    const drift = Math.sin(state.time * 7.0) * state.interference * 15;
    ctx.drawImage(canvas, 28, y, 580, 15, 28 + drift, y, 580, 15);
    ctx.fillStyle = `rgba(195, 184, 214, ${state.interference * .20})`;
    ctx.fillRect(28, y + 16, 580, 6);
  }
  ctx.fillStyle = "#020d172d";
  for (let y = 0; y < 400; y += 4) ctx.fillRect(0, y, 640, 1);
  const vignette = ctx.createRadialGradient(320, 185, 90, 320, 200, 350);
  vignette.addColorStop(0, "#00000000"); vignette.addColorStop(1, "#00000077");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, 640, 400);
  ctx.restore(); surface.texture.needsUpdate = true;
}

export function createChapter15Visuals(scene, mode, base, initialTier = "high") {
  const isStudio = mode === "studio";
  const materials = surfaceVariants();
  // Capture only the existing scenery before any chapter additions or NPCs load.
  materials.apply(isStudio ? scene : base.root);
  const root = new THREE.Group(); root.name = "chapter15-remaster"; scene.add(root);
  const owned = [root], lights = [], lightBackups = [];
  const timeline = createChapter15VisualTimeline();
  let tier, budget, lastPaint = -1, lastVision = null, lastStable = null, disposed = false;
  let state = timeline.state;
  const snapshot = { tier: "high", dust: 0, pointLights: 0, shadowLights: 0, vision: false,
    crt: isStudio ? "1999" : null, console: isStudio ? "analog" : null, reverse: false,
    apparition: false, interference: false, surge: false, jukebox: isStudio ? null : "warm", studioReady: false };
  function groupOn(parent, name) {
    const group = new THREE.Group(); group.name = name; group.userData.chapter15Effect = true;
    parent.add(group); owned.push(group); return group;
  }

  const ambient = scene.children.find(object => object.isHemisphereLight);
  if (ambient) {
    ambient.color.setHex(0xcbd2dc); ambient.groundColor.setHex(0x3b2c27);
    ambient.intensity = isStudio ? .23 : .6;
  }
  scene.environmentIntensity = isStudio ? .19 : .36;
  scene.fog?.color.setHex(isStudio ? 0x1c1821 : 0x241c24);
  scene.traverse(object => {
    if (!object.isLight || object.isHemisphereLight) return;
    lightBackups.push({ object, color: object.color.clone(), intensity: object.intensity, visible: object.visible, position: object.position.clone() });
    if (object.isPointLight) {
      const studioRoomIndex = base.roomLights?.indexOf(object) ?? -1;
      let intensity = isStudio ? object.intensity : object.intensity * .68;
      let priority = 4;
      if (isStudio) {
        if (studioRoomIndex >= 0) {
          intensity = [23, 5.5, 16][studioRoomIndex]; priority = [1, 2, 0][studioRoomIndex];
          object.color.setHex(studioRoomIndex === 1 ? 0xa16bff : 0xffbe80);
          if (studioRoomIndex === 1) object.position.set(2.4, 2.4, -3.7);
        } else if (object.position.z < -10) { intensity = 2.4; priority = 5; }
        else if (object.position.z < -5) { intensity = 4; priority = 3; }
        else { intensity = 1.8; priority = 4; object.color.setHex(0xb8c6df); } // player fill
      } else {
        if (object === base.glow) { intensity = 5; priority = 0; }
        else if (object.parent === scene) { intensity = 14; priority = 1; object.color.setHex(0xffdbb6); }
        else { intensity = object.intensity < 6 ? 2 : 19; priority = 3; }
      }
      object.castShadow = false;
      lights.push({ object, intensity, priority, anomaly: isStudio && (studioRoomIndex === 1 || object.position.x < -7 && object.position.z < -5) });
    }
    if (object.isSpotLight || object.isDirectionalLight) {
      object.color.setHex(0xffd3a6); object.intensity = isStudio ? 105 : 1.55;
      if (object.isSpotLight) { object.penumbra = .88; object.angle = .79; object.target.position.set(0, .9, -2.1); }
      object.shadow.bias = -.00025; object.shadow.normalBias = .035; object.shadow.radius = 3;
    }
  });
  lights.sort((a, b) => a.priority - b.priority);

  // One particle draw call; slow group motion avoids updating dozens of positions.
  const dustTexture = canvasSurface(32, 32);
  const glow = dustTexture.ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
  glow.addColorStop(0, "#fff3d9a0"); glow.addColorStop(.25, "#fff3d940"); glow.addColorStop(1, "#fff3d900");
  dustTexture.ctx.fillStyle = glow; dustTexture.ctx.fillRect(0, 0, 32, 32);
  const positions = new Float32Array(72 * 3);
  for (let i = 0; i < 72; i++) {
    positions.set([Math.sin(i * 127.1) * 8.8, .5 + ((i * .618) % 1) * 3.6,
      isStudio ? -5 + Math.sin(i * 311.7) * 12 : 1 + Math.sin(i * 311.7) * 13], i * 3);
  }
  const dustGeometry = new THREE.BufferGeometry(); dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ map: dustTexture.texture,
    color: 0xeed2ad, size: .055, transparent: true, opacity: .46, depthWrite: false, sizeAttenuation: true }));
  dust.name = "chapter15-dust"; root.add(dust);

  let meters = null, meterPanel = null, meterFrame = null, crt = null, crtPanel = null;
  const frequency = new THREE.Group(); frequency.name = "chapter15-frequency-only"; root.add(frequency); frequency.visible = false;
  const hiddenMaterial = isStudio ? signalMaterial(0xb49aef, .72) : null;
  let channel = null, sweep = null, windowEffect = null, apparition = null, jukeboxEffect = null;
  const warmMaterials = [], warmSources = [], anomalyLamps = [];
  let energyCurve = null, energyPulse = null;
  if (isStudio) {
    const consoleSlot = base.slots.get("console");
    const consoleFx = groupOn(consoleSlot.assembly, "chapter15-console-inlays");
    meters = canvasSurface(1024, 256);
    meterFrame = new THREE.Mesh(new THREE.BoxGeometry(5.55, .44, .035), new THREE.MeshStandardMaterial({ color: 0x252a2b, metalness: .68, roughness: .33 }));
    meterFrame.position.set(0, 1.65, -.65); meterFrame.rotation.x = -.4; consoleFx.add(meterFrame);
    meterPanel = panel(consoleFx, "chapter15-VU-meters", 5.45, .41,
      new THREE.MeshBasicMaterial({ map: meters.texture, toneMapped: false }), [0, 1.66, -.627]);
    meterPanel.rotation.x = -.4;
    channel = panel(consoleFx, "chapter15-hidden-channel", .10, 1.23, hiddenMaterial, [-3.05, 1.47, .02]);
    channel.rotation.x = -Math.PI / 2; channel.visible = false;
    sweep = panel(consoleFx, "chapter15-signal-sweep", .17, 1.55, signalMaterial(0xcab0ff, .0), [0, 1.52, 0]);
    sweep.rotation.x = -Math.PI / 2; sweep.visible = false;
    const crtSlot = base.slots.get("crt");
    const crtFx = groupOn(crtSlot.assembly, "chapter15-CRT-display");
    crt = canvasSurface(640, 400);
    crtPanel = panel(crtFx, "chapter15-CRT-screen", .72, .45,
      new THREE.MeshBasicMaterial({ map: crt.texture, toneMapped: false }), [0, .39, .521]);

    // A cable-shaped frequency trace connects the desk with the live booth.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.05, 1.4, -2.1), new THREE.Vector3(-4.1, .12, -4.9),
      new THREE.Vector3(3.2, .09, -8.9), new THREE.Vector3(3.2, 1.6, -10.08),
      new THREE.Vector3(2.55, 1.6, -14.4),
    ]);
    const trace = new THREE.Mesh(new THREE.TubeGeometry(curve, 52, .029, 5, false), hiddenMaterial);
    trace.name = "chapter15-hidden-connection"; frequency.add(trace);
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 52, .075, 5, false), signalMaterial(0x985aff, .16));
    frequency.add(halo);
    energyCurve = curve;
    energyPulse = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), signalMaterial(0xe3cfff, .95));
    energyPulse.name = "chapter15-frequency-pulse"; frequency.add(energyPulse);
    for (const [x, y, z, radius] of [[2.55, 1.5, -14.15, .3], [-2, .7, -16.25, 1.05], [8.65, .85, 1, .4]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .012, 4, 40), hiddenMaterial);
      ring.position.set(x, y, z); frequency.add(ring);
    }
    windowEffect = panel(root, "chapter15-booth-reflection", 15.1, 3.35, glassInterference(), [-1.65, 2.72, -10.088]);
    // A blurred silhouette texture, never a new character or collision body.
    const silhouette = canvasSurface(128, 256), ink = silhouette.ctx;
    ink.filter = "blur(7px)"; ink.fillStyle = "#d2a5ff";
    ink.beginPath(); ink.ellipse(64, 47, 20, 27, -.08, 0, TAU); ink.fill();
    ink.beginPath(); ink.moveTo(45, 76); ink.quadraticCurveTo(15, 94, 22, 220);
    ink.lineTo(103, 220); ink.quadraticCurveTo(110, 95, 82, 76); ink.fill();
    apparition = panel(root, "chapter15-impossible-reflection", 1.1, 2.05,
      new THREE.MeshBasicMaterial({ map: silhouette.texture, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), [1.8, 1.38, -11.3]);
    apparition.visible = false;
    // Small amber status lamps reuse one geometry and an instanced draw call.
    const rack = base.slots.get("rack");
    const rackFx = groupOn(rack.assembly, "chapter15-rack-signal");
    const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.017, 6, 4), signalMaterial(0xefb979, .85), 6);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 6; i++) { matrix.makeTranslation(.70, .63 + i * .315, 1.3); lamps.setMatrixAt(i, matrix); }
    rackFx.add(lamps);
    const ledMaterial = signalMaterial(0xb18aff, .65);
    const consoleLed = new THREE.Mesh(new THREE.BoxGeometry(5.2, .012, .012), ledMaterial);
    consoleLed.position.set(0, -.195, .025); meterFrame.add(consoleLed);
    const crtLed = new THREE.Mesh(new THREE.SphereGeometry(.016, 8, 6), ledMaterial);
    crtLed.position.set(.40, .37, .025); crtFx.add(crtLed);
    anomalyLamps.push(ledMaterial);
  } else {
    materials.apply(base.jukebox, "equipment");
    // Follow the existing cabinet transform and leave its playable screen intact.
    const jukeboxFx = groupOn(base.jukebox, "chapter15-jukebox-reflections");
    jukeboxEffect = panel(jukeboxFx, "chapter15-jukebox-frequency", 1.46, .82, glassInterference(), [0, 1.92, .789]);
    for (const index of [0, 4, 8]) {
      const display = base.wallDisplays[index];
      if (!display) continue;
      const reflection = groupOn(display, "chapter15-sleeve-reflection");
      const shine = panel(reflection, "chapter15-record-resonance", 1.35, 1.4, glassInterference(), [-.22, .05, .06]);
      shine.userData.frequencyMaterial = true;
      frequency.userData.recordReflections ??= [];
      frequency.userData.recordReflections.push(shine);
    }
  }

  // Clock detail is shared by both variants, but owned only by this chapter.
  const clockSurface = canvasSurface(256, 256), ink = clockSurface.ctx;
  ink.fillStyle = "#d3c4a5"; ink.beginPath(); ink.arc(128, 128, 125, 0, TAU); ink.fill();
  ink.strokeStyle = "#252a2a"; ink.fillStyle = "#252a2a"; ink.lineWidth = 3;
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * TAU, r = i % 5 ? 108 : 99;
    ink.beginPath(); ink.moveTo(128 + Math.sin(a) * r, 128 - Math.cos(a) * r);
    ink.lineTo(128 + Math.sin(a) * 116, 128 - Math.cos(a) * 116); ink.stroke();
  }
  ink.textAlign = "center"; ink.font = "bold 20px Arial";
  for (const [n, x, y] of [[12, 128, 57], [3, 205, 135], [6, 128, 213], [9, 50, 135]]) ink.fillText(String(n), x, y);
  ink.font = "10px Arial"; ink.fillText("QUARTZ / STUDIO", 128, 167);
  const clock = new THREE.Group(); clock.name = "chapter15-clock";
  clock.position.set(isStudio ? 9.70 : -10.839, isStudio ? 2.7 : 3.5, isStudio ? -3.1 : -7.2);
  clock.rotation.y = isStudio ? -Math.PI / 2 : Math.PI / 2; // case rests against the corresponding room wall
  root.add(clock);
  const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x58524b, metalness: .75, roughness: .32 });
  const clockCase = new THREE.Mesh(new THREE.TorusGeometry(.37, .034, 8, 48), caseMaterial); clock.add(clockCase);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.35, 48), new THREE.MeshStandardMaterial({ map: clockSurface.texture, roughness: .65 }));
  clock.add(face);
  const handMaterial = new THREE.MeshBasicMaterial({ color: 0x232a2b });
  const hand = (length, width, depth) => {
    const pivot = new THREE.Group(); clock.add(pivot);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, length, .009), handMaterial);
    mesh.position.set(0, length * .4, depth); pivot.add(mesh); return pivot;
  };
  const hourHand = hand(.16, .024, .013), minuteHand = hand(.25, .016, .024), secondHand = hand(.29, .006, .035);
  hourHand.rotation.z = -.8; minuteHand.rotation.z = -2.1;
  const clockAura = new THREE.Mesh(new THREE.TorusGeometry(.39, .012, 4, 48), signalMaterial(0xba9ee5, 0)); clock.add(clockAura);

  function applyQuality(value) {
    const next = chapter15VisualTier(value);
    if (tier === next) return;
    tier = next; budget = CHAPTER15_VISUAL_BUDGETS[tier];
    dustGeometry.setDrawRange(0, budget.dust);
    lights.forEach(({ object }, index) => { object.visible = index < budget.pointLights; });
    let shadows = 0;
    scene.traverse(object => {
      if (!object.isDirectionalLight && !object.isSpotLight) return;
      object.castShadow = budget.shadowSize > 0;
      if (object.castShadow) {
        shadows++;
        if (object.shadow.mapSize.x !== budget.shadowSize) {
          object.shadow.map?.dispose(); object.shadow.map = null;
          object.shadow.mapSize.set(budget.shadowSize, budget.shadowSize);
        }
      }
    });
    Object.assign(snapshot, { tier, dust: budget.dust, pointLights: Math.min(lights.length, budget.pointLights), shadowLights: shadows });
  }
  applyQuality(initialTier);

  // Use the exact Matrix shader of the city. Clone ownership is nested: restore
  // code materials first, then restore this variant's cinematic materials.
  const storeEchoes = isStudio ? null : createChapter15StoreEchoes(frequency);
  const codeVision = createStoreInvasionVision(scene);
  const registeredActors = new WeakSet();
  snapshot.matrixNpcs = []; snapshot.futureEchoes = false;
  const codedMeshes = new WeakSet();
  snapshot.matrixMeshes = 0; snapshot.matrixActors = 0;
  function registerCode(object, profile = "world") {
    if (!object || !codeVision || disposed) return;
    codeVision.register(object, profile);
    object.traverse(mesh => {
      if (!mesh.isMesh || codedMeshes.has(mesh)) return;
      if ([mesh.material].flat().some(material => material?.name.startsWith("Invasion /"))) {
        codedMeshes.add(mesh); snapshot.matrixMeshes++;
        if (mesh.isSkinnedMesh) snapshot.matrixActors++;
      }
    });
  }
  // Transparent glass, displays and frequency accents keep their own colors.
  scene.traverse(object => {
    const isFloor = /parquet|rug/.test(object.name) || (!isStudio && object.parent === base.root
      && object.rotation.x === -Math.PI / 2 && object.position.y < .1);
    if (object.isMesh) registerCode(object, isFloor ? "bridge" : "world");
  });

  // Bind emissive pulses AFTER Matrix cloning, so the animated materials are
  // the ones actually rendered, including when Frequency Vision is off.
  if (!isStudio) {
    base.jukebox.traverse(object => {
      if (!object.isMesh) return;
      for (const material of [object.material].flat()) {
        if (material?.emissive?.getHex() && material.emissiveIntensity > .6 && !warmMaterials.includes(material)) {
          warmMaterials.push(material); warmSources.push({ color: material.emissive.clone(), intensity: material.emissiveIntensity });
        }
      }
    });
  }

  return {
    snapshot, applyQuality,
    registerActor(object, profile = "dynamic", npcId = null) {
      if (!object || registeredActors.has(object) || disposed) return;
      registerCode(object, profile); registeredActors.add(object);
      if (npcId && !snapshot.matrixNpcs.includes(npcId)) snapshot.matrixNpcs.push(npcId);
    },
    onStudioAssetsLoaded() {
      if (!isStudio || disposed) return;
      for (const [id, entry] of base.slots) {
        if (id === "hugo") { registerCode(entry.modelRoot, "dynamic"); continue; }
        materials.apply(entry.modelRoot, /guitar|drumkit/.test(id) ? "instrument" : "equipment");
        registerCode(entry.modelRoot);
      }
      const loadedConsole = base.slots.get("console").modelRoot;
      if (loadedConsole) {
        loadedConsole.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(loadedConsole);
        const top = base.slots.get("console").assembly.worldToLocal(new THREE.Vector3(0, box.max.y, 0)).y;
        meterFrame.position.y = top + .18; meterPanel.position.y = top + .19;
        channel.position.y = top + .025; sweep.position.y = top + .029;
        // Lay the hidden strip along the real sloped deck, rather than above it.
        const assembly = base.slots.get("console").assembly;
        const ray = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, -1, 0).transformDirection(assembly.matrixWorld);
        const heights = [-.595, .635].map(z => {
          const origin = assembly.localToWorld(new THREE.Vector3(-3.05, top + 1, z));
          ray.set(origin, direction);
          const hit = ray.intersectObject(loadedConsole, true)[0];
          return hit ? assembly.worldToLocal(hit.point).y + .018 : top + .025;
        });
        const slope = (heights[1] - heights[0]) / 1.23;
        channel.position.y = (heights[0] + heights[1]) / 2;
        channel.rotation.x = -Math.PI / 2 - Math.atan(slope);
        channel.scale.y = Math.sqrt(1 + slope * slope);
      }
      if (base.slots.get("crt").modelRoot) {
        // A DAW window on the existing CRT. Keep the baked 1999 desktop and
        // taskbar around it; the tiny offset clears the irregular scanned glass.
        crtPanel.scale.set(.667, .667, 1); crtPanel.position.set(.14, .585, .018);
      }
      snapshot.studioReady = true;
    },
    update(dt, progress, paused, reducedMotion, playingVideo = false, player = { x: 0, z: 0 }) {
      if (disposed) return;
      state = timeline.update(dt, progress, paused, reducedMotion);
      const t = reducedMotion ? 0 : state.time;
      codeVision?.update(paused ? 0 : dt, state.vision, player, reducedMotion);
      frequency.visible = state.vision;
      storeEchoes?.update(t, state.vision, reducedMotion);
      snapshot.futureEchoes = Boolean(storeEchoes?.root.visible);
      if (energyPulse && state.vision) energyCurve.getPointAt((t * .18) % 1, energyPulse.position);
      anomalyLamps.forEach(material => { material.opacity = state.vision ? .90 : .50 + Math.sin(t * 1.25) * .16; });
      dust.position.y = Math.sin(t * .12) * .08;
      dust.rotation.y = Math.sin(t * .045) * .008;
      for (const { object, intensity, anomaly } of lights) {
        if (!object.visible) continue;
        object.intensity = intensity * (1 + (anomaly ? (state.vision ? .35 : Math.sin(t * 1.25) * .18) + state.interference * .18 : 0));
      }
      if (!isStudio) {
        for (const fixture of base.ceilingFixtures) {
          fixture.material.color.copy(fixture.color).multiplyScalar(1 - state.interference * .16);
        }
        // These materials are clones. The original store's amber tubes stay unchanged.
        const response = state.vision ? .48 : progress?.compared ? .15 + Math.sin(t * .8) * .06 : state.interference * .28;
        warmMaterials.forEach((material, i) => {
          material.emissive.copy(warmSources[i].color).lerp(violet, response);
          material.emissiveIntensity = warmSources[i].intensity * (1 + Math.sin(t * .85) * .035 - state.interference * .2);
        });
        base.glow.color.copy(amber).lerp(violet, response);
        jukeboxEffect.visible = !playingVideo && (state.vision || state.interference > 0 || Boolean(progress?.compared));
        jukeboxEffect.material.uniforms.time.value = t;
        jukeboxEffect.material.uniforms.strength.value = state.vision ? .85 : response;
        for (const shine of frequency.userData.recordReflections || []) {
          shine.visible = state.vision;
          shine.material.uniforms.time.value = t;
          shine.material.uniforms.strength.value = state.vision ? .9 : 0;
        }
        snapshot.jukebox = playingVideo ? "playback" : state.vision || progress?.compared ? "resonance" : "warm";
      }
      if (!paused && !reducedMotion) {
        const step = dt * (state.reverse ? 2.1 : -.105);
        secondHand.rotation.z += step;
        minuteHand.rotation.z += step / 60;
        hourHand.rotation.z += step / 720;
      }
      clockAura.material.opacity = state.reverse ? .25 * Math.sin((state.time % 83 - 34) * Math.PI / 3) ** 2 : state.vision ? .11 : 0;
      if (isStudio) {
        channel.visible = state.vision || state.stable;
        hiddenMaterial.opacity = state.stable ? .85 : .65 + Math.sin(t * 1.1) * .08;
        sweep.visible = state.surge > 0;
        sweep.position.x = -3.4 + Math.min(1, state.surgeAge / 3.6) * 6.8;
        sweep.material.opacity = state.surge * .4;
        windowEffect.material.uniforms.time.value = t;
        windowEffect.material.uniforms.strength.value = state.vision ? .95 : .25 + state.interference * .3;
        windowEffect.visible = true;
        apparition.visible = state.vision || state.apparition > 0;
        apparition.material.opacity = state.vision ? .48 : state.apparition * .20;
        const changed = lastVision !== state.vision || lastStable !== state.stable;
        if (changed || !paused && !reducedMotion && state.time - lastPaint >= 1 / budget.textureHz) {
          const painted = reducedMotion ? { ...state, time: 0 } : state;
          drawMeters(meters, painted); drawCRT(crt, painted);
          lastPaint = state.time; lastVision = state.vision; lastStable = state.stable;
        }
        snapshot.crt = state.vision || state.interference > .15 ? "2049" : state.stable ? "signal-locked" : "1999";
        snapshot.console = state.stable ? "stable" : state.vision ? "hidden-channel" : "analog";
      }
      Object.assign(snapshot, { vision: state.vision, reverse: state.reverse, apparition: Boolean(apparition?.visible),
        interference: state.interference > 0, surge: state.surge > 0 });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      codeVision?.dispose();
      materials.dispose();
      for (const { object, color, intensity, visible, position } of lightBackups) {
        object.color.copy(color); object.intensity = intensity; object.visible = visible; object.position.copy(position);
      }
      // Includes inlays parented to original slots and sleeve overlays outside root.
      disposeObjects(owned);
      for (const group of owned) group.removeFromParent();
      owned.length = 0;
    },
  };
}
