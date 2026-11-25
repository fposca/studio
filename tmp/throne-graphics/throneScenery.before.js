import * as THREE from "three";
import { THRONE_CONDUCTORS, THRONE_VOWS, THRONE_MAX_HEALTH } from "./throneQuest.js";
import { THRONE_INTERACTIONS, THRONE_OBSTACLES, canStandInThrone } from "./throneLayout.js";

const MODEL_URL = new URL("../assets/neonboy-animaciones/capitulo13/soberano.mobile.glb", import.meta.url).href;
const CLIPS = Object.fromEntries(["camina", "ataque", "invoca", "muerte"].map((name) => [name,
  new URL(`../assets/neonboy-animaciones/capitulo13/soberano-${name}.anim.glb`, import.meta.url).href]));
const SHIELD_POSITIONS = [[-8, -67], [8, -67], [0, -60]];

function lavaTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = "#160708"; context.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 42; i++) {
    const x = (i * 79.7) % 128, y = (i * 39.1) % 128;
    context.strokeStyle = i % 3 ? "#a5210a" : "#ff6b1e";
    context.lineWidth = i % 4 ? 1.3 : 2.8;
    context.beginPath(); context.moveTo(x, y);
    context.bezierCurveTo(x + 9, y - 4, x + 16, y + 12, x + 27, y + 5);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(10, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function stoneTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  let seed = 41;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  ctx.fillStyle = "#26202a"; ctx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const offset = row % 2 ? 31 : 0, x = col * 64 - offset, y = row * 64;
    const shade = Math.floor(70 + random() * 25);
    ctx.fillStyle = "rgb(" + shade + "," + Math.floor(shade * .81) + "," + Math.floor(shade * .87) + ")";
    ctx.fillRect(x + 2, y + 2, 61, 60);
    ctx.strokeStyle = "rgba(173,137,149,.24)"; ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, 59, 58);
    for (let fleck = 0; fleck < 16; fleck++) {
      ctx.fillStyle = random() > .5 ? "rgba(17,12,20,.18)" : "rgba(212,181,184,.10)";
      ctx.fillRect(x + 4 + random() * 54, y + 4 + random() * 52, 1 + random() * 3, 1 + random() * 2);
    }
    if (random() > .48) {
      ctx.strokeStyle = "rgba(25,14,22,.35)"; ctx.lineWidth = 1 + random() * 1.2;
      ctx.beginPath(); ctx.moveTo(x + random() * 40, y + 2);
      ctx.lineTo(x + 21 + random() * 25, y + 24 + random() * 16);
      ctx.lineTo(x + 11 + random() * 48, y + 60); ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 14);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

function futureProjectionTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(120,243,238,.67)"; ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const x = 20 + (i * 47 % 216), y = 26 + (i * 71 % 180);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (i % 3 ? 2 : 8), y); ctx.stroke();
  }
  ctx.shadowColor = "#6bf5ef"; ctx.shadowBlur = 13;
  ctx.strokeStyle = "#a1fff7"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(128, 22); ctx.lineTo(139, 50); ctx.lineTo(139, 197);
  ctx.lineTo(117, 197); ctx.lineTo(117, 50); ctx.closePath(); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeRect(121, 64, 14, 91); ctx.strokeRect(123, 164, 10, 28);
  ctx.beginPath(); ctx.ellipse(128, 198, 38, 9, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "#a1fff7";
  ctx.fillText("BUENOS AIRES / 2049", 128, 237);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildThrone(scene, { onEvent, onDamage, initialProgress } = {}) {
  const root = new THREE.Group(); root.name = "Capítulo 13 / El Trono del Abismo"; scene.add(root);
  scene.background = new THREE.Color(0x17090e);
  scene.fog = new THREE.FogExp2(0x210d1c, .012);
  const floorMap = stoneTexture();
  const material = {
    stone: new THREE.MeshStandardMaterial({ color: 0x241d29, roughness: .85, metalness: .08 }),
    platform: new THREE.MeshStandardMaterial({ map: floorMap, color: 0xd8d0d1, roughness: .9, metalness: .06 }),
    obsidian: new THREE.MeshStandardMaterial({ color: 0x0c0b13, roughness: .44, metalness: .28 }),
    gold: new THREE.MeshStandardMaterial({ color: 0x9a6e3c, roughness: .4, metalness: .7 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9b1738, emissive: 0x5b0920, emissiveIntensity: 1.1 }),
    violet: new THREE.MeshStandardMaterial({ color: 0x6436a2, emissive: 0x4a1b83, emissiveIntensity: 1.2 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x65d7d5, emissive: 0x239b9e, emissiveIntensity: 1.4 }),
    darkGlass: new THREE.MeshPhysicalMaterial({ color: 0x543c72, metalness: .48, roughness: .2, transparent: true, opacity: .82 }),
  };
  const geometry = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    sphere: new THREE.IcosahedronGeometry(1, 1),
    torus: new THREE.TorusGeometry(1, .055, 6, 32),
    plane: new THREE.PlaneGeometry(1, 1),
  };
  const add = (geo, mat, x, y, z, sx, sy, sz, parent = root) => {
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
  };
  const box = (mat, x, y, z, sx, sy, sz) => add(geometry.box, mat, x, y, z, sx, sy, sz);
  const cylinder = (mat, x, y, z, radius, height) => add(geometry.cylinder, mat, x, y, z, radius, height, radius);
  const ring = (mat, x, y, z, radius) => { const mesh = add(geometry.torus, mat, x, y, z, radius, 1, radius); mesh.rotation.x = Math.PI / 2; return mesh; };
  const lavaMap = lavaTexture();
  const lavaMaterial = new THREE.MeshBasicMaterial({ map: lavaMap, color: 0xf15328 });
  const lava = add(new THREE.PlaneGeometry(170, 150), lavaMaterial, 0, -.9, -46, 1, 1, 1);
  lava.rotation.x = -Math.PI / 2;
  const lavaLight = new THREE.PointLight(0xff3a14, 38, 38, 2); lavaLight.position.set(0, 1, -49); root.add(lavaLight);
  const violetLight = new THREE.PointLight(0x8439d8, 24, 38, 2); violetLight.position.set(0, 6, -83); root.add(violetLight);
  root.add(new THREE.AmbientLight(0xd1b9c4, 1.1));
  root.add(new THREE.HemisphereLight(0xb5a1b8, 0x712d25, .65));
  for (const [x, z, hue] of [[-6, -8, 0xc64f72], [6, -32, 0xa459da], [-10, -70, 0xd7513e], [10, -80, 0xc34d78]]) {
    const light = new THREE.PointLight(hue, 12, 15, 2); light.position.set(x, 4.4, z); root.add(light);
  }
  // Three connected, bounded stone surfaces, with visible lava on both sides.
  box(material.platform, 0, -.25, -3, 18, .6, 33);
  box(material.platform, 0, -.22, -34, 16.4, .55, 31);
  cylinder(material.platform, 0, -.32, -76, 18.7, .65);
  box(material.platform, 0, -.25, -56, 8, .6, 13);
  for (let z = 10; z > -91; z -= 2.4) {
    const half = z < -51 ? 15 : z < -18 ? 8 : 9;
    if (z < -50 && z > -60) continue;
    box(material.gold, -half, .075, z, .055, .055, 1.25);
    box(material.gold, half, .075, z, .055, .055, 1.25);
  }
  const columnPositions = [[-8, 7], [8, 7], [-8, -12], [8, -12], [-7.5, -24], [7.5, -24], [-7.5, -43], [7.5, -43], [-14, -72], [14, -72]];
  for (const [x, z] of columnPositions) {
    cylinder(material.obsidian, x, 3.8, z, .72, 7.6);
    cylinder(material.gold, x, .18, z, .95, .18);
    cylinder(material.gold, x, 7.53, z, 1, .18);
    ring(material.violet, x, 5.8, z, .82);
  }
  for (const z of [-16.7, -49]) {
    for (const x of [-4.5, 4.5]) {
      box(material.obsidian, x, 4.9, z, 1.2, 9.8, 1.4);
      box(material.gold, x, 8.8, z, 1.55, .12, 1.5);
    }
    box(material.obsidian, 0, 9.4, z, 10, 1.1, 1.3);
    ring(material.gold, 0, 7.55, z, 3.2).rotation.x = 0;
  }
  const hallGate = box(material.red, 0, 2.15, -17.7, 5.8, 4.2, .22);
  const coreGate = box(material.violet, 0, 2.15, -49.5, 6.2, 4.2, .22);
  // Salón: contrasting oath statues and a central carved inscription.
  const statues = THRONE_VOWS.map((id, index) => {
    const x = id === "memoria" ? 0 : id === "libertad" ? -5.8 : 5.8;
    const z = id === "memoria" ? -6.5 : -4.7;
    const pedestal = cylinder(material.obsidian, x, .6, z, .9, 1.2);
    const body = add(geometry.sphere, material.stone, x, 2.45, z, .75, 1.35, .55);
    add(geometry.sphere, material.gold, x, 3.85, z, .38, .42, .36);
    const rune = ring(index === 0 ? material.violet : material.red, x, 1.35, z, .48);
    rune.rotation.x = 0; rune.position.z += .55;
    return { id, rune, pedestal, body };
  });
  box(material.obsidian, 0, .45, 5.9, 2.4, .9, 1.2);
  box(material.gold, 0, .94, 5.9, 2.32, .055, 1.14);
  const oathGlyphs = THRONE_VOWS.map((_, index) => ring(material.cyan, (index - 1) * .5, 1.01, 5.9, .17));
  // Cámara: low-poly conductors, actual reflector target and three energy paths.
  const conductors = THRONE_CONDUCTORS.map((id, index) => {
    const [x, z] = [[-5.5, -31.5], [0, -36.5], [5.5, -31.5]][index];
    cylinder(material.obsidian, x, .7, z, 1.05, 1.4);
    cylinder(material.gold, x, 1.35, z, .63, .16);
    const crystal = add(geometry.sphere, material.red, x, 2.15, z, .48, .75, .48);
    const halo = ring(material.violet, x, 2.15, z, .86); halo.rotation.x = 0;
    return { id, x, z, crystal, halo };
  });
  cylinder(material.obsidian, 0, .7, -28, 1, 1.4);
  const reflector = add(geometry.box, material.darkGlass, 0, 1.8, -28, 1.25, 1.5, .22);
  ring(material.cyan, 0, .08, -28, 1.15);
  const reflectorTarget = new THREE.Vector3(0, 1.7, -28);
  const energyBeams = conductors.map(({ x, z }) => {
    const start = new THREE.Vector3(0, 1.7, -28), end = new THREE.Vector3(x, 2.15, z);
    const mesh = add(geometry.cylinder, material.cyan, (start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2, .025, start.distanceTo(end), .025);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    mesh.visible = false; return mesh;
  });
  box(material.obsidian, -6.2, .7, -23.2, 1.5, 1.4, 1.1);
  // Arena and monumental throne. The seat remains solid in navigation.
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const x = Math.sin(angle) * 17, z = -76 + Math.cos(angle) * 17;
    cylinder(material.obsidian, x, 3.6, z, .54, 7.2);
    cylinder(material.gold, x, .2, z, .8, .16);
  }
  box(material.obsidian, 0, 1.15, -92, 7.2, 2.3, 3.3);
  box(material.obsidian, 0, 5.2, -93.2, 7.2, 8.4, .65);
  box(material.gold, 0, 7.4, -92.7, 6.7, .12, .8);
  for (const x of [-2.8, 2.8]) {
    const finial = add(geometry.sphere, material.violet, x, 9.1, -93.1, .3, .8, .3);
    finial.rotation.z = x > 0 ? -.35 : .35;
  }
  const temporalCore = add(geometry.sphere, material.violet, 0, 5.6, -89, 1.1, 1.1, 1.1);
  const futureMap = futureProjectionTexture();
  const futureMaterial = new THREE.MeshBasicMaterial({
    map: futureMap, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, opacity: .82,
  });
  const futureProjection = add(geometry.plane, futureMaterial, 0, 5.4, -87.6, 4.2, 4.2, 1);
  futureProjection.visible = false;

  ring(material.gold, 0, 5.6, -89, 1.45).rotation.x = 0;
  const boss = new THREE.Group(); boss.position.set(0, 0, -77); root.add(boss);
  const fallback = new THREE.Group(); boss.add(fallback);
  add(geometry.cylinder, material.obsidian, 0, 1.8, 0, .85, 2.9, .85, fallback);
  add(geometry.sphere, material.gold, 0, 3.28, 0, .42, .42, .43, fallback);
  for (const x of [-.55, .55]) add(geometry.box, material.obsidian, x, 3.85, 0, .22, .9, .26, fallback);
  const shield = add(geometry.sphere, new THREE.MeshBasicMaterial({ color: 0x8437ce, wireframe: true, transparent: true, opacity: .42 }), 0, 2.1, 0, 2.5, 2.5, 2.5, boss);
  const shieldNodes = THRONE_CONDUCTORS.map((id, i) => {
    const [x, z] = SHIELD_POSITIONS[i];
    cylinder(material.obsidian, x, .8, z, .75, 1.6);
    const core = add(geometry.sphere, material.cyan, x, 1.85, z, .39, .39, .39);
    const halo = ring(material.violet, x, 1.85, z, .66); halo.rotation.x = 0;
    return { id, x, z, core, halo, revealUntil: 0 };
  });
  const attackMark = ring(material.red, 0, .12, -77, 1.1); attackMark.visible = false;
  const hazard = ring(material.red, 0, .13, -76, 2.5); hazard.visible = false;
  const projectile = add(geometry.sphere, material.red, 0, 1.5, -77, .26, .26, .26); projectile.visible = false;
  const ashGeometry = new THREE.BufferGeometry();
  const ashCount = 90, ashPositions = new Float32Array(ashCount * 3);
  for (let i = 0; i < ashCount; i++) { ashPositions[i * 3] = (i * 29.7 % 30) - 15; ashPositions[i * 3 + 1] = (i * 13.3 % 8) + .5; ashPositions[i * 3 + 2] = -50 - (i * 37.7 % 45); }
  ashGeometry.setAttribute("position", new THREE.BufferAttribute(ashPositions, 3));
  const ash = new THREE.Points(ashGeometry, new THREE.PointsMaterial({ color: 0xff8c69, size: .06, transparent: true, opacity: .56 })); root.add(ash);
  const interactions = THRONE_INTERACTIONS.map((spot) => ({ ...spot }));
  const bossSpot = interactions.find((spot) => spot.id === "throne-soberano");
  const bossCollider = { x: 0, z: -77, radius: 1.05 };
  const transmissionSpot = interactions.find((spot) => spot.id === "throne-transmission");
  let model = null, mixer = null, currentAction = null, disposed = false, currentAnimation = "fallback";
  const actions = {};
  function play(name, once = false) {
    const next = actions[name] || actions.idle;
    if (!next || next === currentAction) return;
    currentAction?.fadeOut(.18); next.reset().fadeIn(.18);
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once; next.play(); currentAction = next; currentAnimation = name;
  }
  async function loadAssets(loader, isAlive = () => true) {
    try {
      const gltf = await loader.loadAsync(MODEL_URL);
      if (disposed || !isAlive()) return false;
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const scale = 4.05 / Math.max(.1, bounds.max.y - bounds.min.y);
      model.scale.setScalar(scale);
      model.position.set(-bounds.getCenter(new THREE.Vector3()).x * scale, -bounds.min.y * scale, -bounds.getCenter(new THREE.Vector3()).z * scale);
      model.traverse((part) => { if (part.isMesh) { part.castShadow = false; part.receiveShadow = false; } });
      boss.add(model); fallback.visible = false;
      mixer = new THREE.AnimationMixer(model);
      actions.idle = mixer.clipAction(gltf.animations[0]);
      const clips = await Promise.allSettled(Object.entries(CLIPS).map(async ([name, url]) => [name, await loader.loadAsync(url)]));
      if (disposed || !isAlive()) return false;
      for (const clip of clips) if (clip.status === "fulfilled" && clip.value[1].animations[0])
        actions[clip.value[0]] = mixer.clipAction(clip.value[1].animations[0]);
      play("idle");
      return true;
    } catch { return false; }
  }
  let attackClock = 2.2, attack = null, attackIndex = 0, projectileVelocity = new THREE.Vector3();
  let encounterPending = false, lastPhase = 1, encounterAge = 0;
  let defeatAge = initialProgress?.bossDefeated ? 4 : 0;
  const getPhase = (p) => p.shieldActive ? 2 : p.bossHealth <= 4 ? 3 : 1;
  function registerImpact(target) {
    if (target.kind === "throne-reflector") { onEvent?.("reflector-hit"); return; }
    if (target.kind === "throne-boss") { onEvent?.("boss-hit"); return; }
    if (target.kind === "throne-shield-node") { onEvent?.("shield-node", target.id); }
  }
  function getTargets(progress) {
    if (progress?.hallOpen && !progress?.throneOpen && progress?.coreInspected?.length === 3)
      return [{ kind: "throne-reflector", id: "reflector", position: reflectorTarget, radius: .74, reflect: true, normal: new THREE.Vector3(0, 0, 1) }];
    if (!progress?.bossIntro || progress?.bossDefeated) return [];
    if (progress.shieldActive) return shieldNodes.filter((node) => !progress.shieldNodes.includes(node.id) && node.revealUntil > encounterAge)
      .map((node) => ({ kind: "throne-shield-node", id: node.id, position: new THREE.Vector3(node.x, 1.85, node.z), radius: .55 }));
    return [{ kind: "throne-boss", id: "soberano", position: new THREE.Vector3(boss.position.x, 2.1, boss.position.z), radius: 1.1, capsuleHalfHeight: 1.25 }];
  }
  function update(dt, elapsed, progress, player, paused, reducedMotion = false, fallen = false) {
    const p = progress || {};
    const step = paused ? 0 : Math.min(dt, .05);
    encounterAge += step;
    lavaMap.offset.x = (elapsed * .009) % 1;
    lavaMap.offset.y = (elapsed * .004) % 1;
    ash.position.y = reducedMotion ? 0 : Math.sin(elapsed * .45) * .11;
    hallGate.visible = !p.hallOpen; coreGate.visible = !p.throneOpen;
    for (let i = 0; i < statues.length; i++) {
      statues[i].rune.material = p.vows?.includes(statues[i].id) ? material.cyan : p.visionActive ? material.violet : material.red;
      oathGlyphs[i].visible = Boolean(p.visionActive || p.hallOpen);
    }
    reflector.rotation.y = p.reflectorIndex * Math.PI * 2 / 3 + elapsed * .2;
    for (let i = 0; i < conductors.length; i++) {
      const complete = p.conductors?.includes(conductors[i].id);
      conductors[i].crystal.material = complete ? material.cyan : p.visionActive ? material.violet : material.red;
      conductors[i].halo.visible = p.visionActive || complete;
      energyBeams[i].visible = complete;
    }
    transmissionSpot.reach = p.bossDefeated ? 3.5 : 0;
    temporalCore.visible = p.bossDefeated || p.completed;
    futureProjection.visible = p.bossDefeated || p.completed;
    temporalCore.rotation.y += step * .4;
    bossSpot.x = boss.position.x; bossSpot.z = boss.position.z;
    bossCollider.x = p.bossDefeated ? 999 : boss.position.x;
    bossCollider.z = boss.position.z;
    bossSpot.reach = p.throneOpen && !p.bossIntro && !p.bossDefeated ? 4.2 : 0;
    boss.visible = !p.bossDefeated || defeatAge < 3;
    shield.visible = Boolean(p.shieldActive);
    if (p.shieldActive && p.visionActive) for (const node of shieldNodes) node.revealUntil = encounterAge + 5.5;
    for (const node of shieldNodes) {
      const visible = Boolean(p.shieldActive && !p.shieldNodes?.includes(node.id) && node.revealUntil > encounterAge);
      node.core.visible = visible; node.halo.visible = visible;
      if (visible) node.halo.rotation.z += step * .55;
    }
    if (!p.bossIntro && p.throneOpen && !p.bossDefeated && player.z < -62 && !encounterPending && !paused) {
      encounterPending = true; onEvent?.("encounter");
    }
    if (p.bossIntro) encounterPending = false;
    if (p.bossDefeated) {
      attack = null; attackMark.visible = false; hazard.visible = false; projectile.visible = false;
      if (defeatAge < 3 && currentAnimation !== "muerte") play("muerte", true);
      defeatAge += step; boss.visible = defeatAge < 3;
      mixer?.update(step); return;
    }
    if (fallen) {
      attack = null; attackMark.visible = false; hazard.visible = false; projectile.visible = false;
      mixer?.update(0); return;
    }
    if (!p.bossIntro || paused || player.z > -53) { mixer?.update(step); return; }
    const phase = getPhase(p);
    if (phase !== lastPhase) { lastPhase = phase; attack = null; attackClock = 2.4; if (phase === 2) onEvent?.("shield-start"); else if (phase === 3) onEvent?.("fracture-start"); play("invoca", true); }
    const dx = player.x - boss.position.x, dz = player.z - boss.position.z;
    const distance = Math.hypot(dx, dz);
    if (!attack && distance > 2.65) {
      const speed = phase === 2 ? .45 : phase === 3 ? 1.9 : 1.35;
      const travel = Math.min(distance - 2.65, speed * step);
      const nx = boss.position.x + dx / distance * travel, nz = boss.position.z + dz / distance * travel;
      if (Math.hypot(nx, nz + 76) < 13.8 && nz > -89 && nz < -58) {
        boss.position.x = nx; boss.position.z = nz; play("camina");
      }
    } else if (!attack && currentAnimation !== "idle") play("idle");
    boss.rotation.y = Math.atan2(dx, dz);
    attackClock -= step;
    if (!attack && attackClock <= 0) {
      const types = phase === 2 ? ["wave", "bolt"] : phase === 3 ? ["hazard", "bolt", "melee", "wave"] : ["melee", "wave", "bolt"];
      const type = types[attackIndex++ % types.length];
      attack = { type, age: 0, x: player.x, z: player.z, hit: false };
      attackMark.visible = type !== "hazard";
      attackMark.position.set(type === "bolt" ? player.x : boss.position.x, .12, type === "bolt" ? player.z : boss.position.z);
      attackMark.scale.setScalar(type === "wave" ? 4.2 : type === "bolt" ? 1.5 : 1.8);
      hazard.visible = type === "hazard";
      hazard.position.set(player.x, .13, player.z);
      attackClock = phase === 2 ? 5 : phase === 3 ? 2.7 : 3.3;
    }
    if (attack) {
      attack.age += step;
      const warning = attack.type === "hazard" ? 1.25 : 1.05;
      if (attack.age >= warning && !attack.hit) {
        attack.hit = true; play(attack.type === "hazard" ? "invoca" : "ataque", true);
        const gap = Math.hypot(player.x - attack.x, player.z - attack.z);
        if (attack.type === "melee" && distance < 3.1 && gap < 3.2) onDamage?.(1);
        if (attack.type === "wave" && distance < 5.2 && distance > 1.1) onDamage?.(1);
        if (attack.type === "hazard" && gap < 2.7) onDamage?.(1);
        if (attack.type === "bolt") {
          projectile.visible = true; projectile.position.set(boss.position.x, 1.7, boss.position.z);
          projectileVelocity.set(attack.x - boss.position.x, 0, attack.z - boss.position.z).normalize().multiplyScalar(8);
        }
      }
      if (attack.age >= warning) { attackMark.visible = false; hazard.visible = false; }
      if (attack.age > warning + .42) { attack = null; if (currentAnimation !== "idle") play("idle"); }
    }
    if (projectile.visible) {
      projectile.position.addScaledVector(projectileVelocity, step);
      if (Math.hypot(projectile.position.x - player.x, projectile.position.z - player.z) < .75) {
        projectile.visible = false; onDamage?.(1);
      }
      if (Math.hypot(projectile.position.x, projectile.position.z + 76) > 18) projectile.visible = false;
    }
    mixer?.update(step);
  }
  return {
    interactions, obstacles: [...THRONE_OBSTACLES, bossCollider], colliders: [], canStand: canStandInThrone,
    getTargets, registerImpact, loadAssets, update,
    get modelLoaded() { return Boolean(model && Object.keys(actions).length === 5); },
    get animationState() { return currentAnimation; },
    dispose() {
      disposed = true; mixer?.stopAllAction();
      lavaMap.dispose(); floorMap.dispose(); futureMap.dispose(); futureMaterial.dispose(); lavaMaterial.dispose(); ashGeometry.dispose(); ash.material.dispose();
      shield.material.dispose();
      Object.values(material).forEach((item) => item.dispose());
      Object.values(geometry).forEach((item) => item.dispose());
      lava.geometry.dispose();
    },
  };
}
