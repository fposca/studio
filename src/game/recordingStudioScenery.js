import * as THREE from "three";
import { STUDIO_EXAMINE } from "./studioLayout.js";

function makeParquetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  context.fillStyle = "#403437";
  context.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 16; row++) for (let column = 0; column < 5; column++) {
    const x = column * 128 + (row % 2 ? -64 : 0), y = row * 32;
    const tint = (row * 29 + column * 37) % 5;
    const gradient = context.createLinearGradient(x, y, x, y + 32);
    gradient.addColorStop(0, ["#64524d", "#70584f", "#796057", "#695451", "#80645a"][tint]);
    gradient.addColorStop(0.5, ["#584845", "#624c46", "#6d554d", "#5e4a48", "#735a52"][tint]);
    gradient.addColorStop(1, ["#554541", "#604940", "#695047", "#594541", "#6d534b"][tint]);
    context.fillStyle = gradient;
    context.fillRect(x + 1, y + 1, 126, 30);
    context.fillStyle = "rgba(255,226,191,.08)";
    context.fillRect(x + 3, y + 2, 122, 1);
    context.fillStyle = "rgba(26,16,21,.13)";
    for (let line = 0; line < 5; line++) {
      const offset = (row * 13 + column * 17 + line * 19) % 25;
      context.fillRect(x + 5, y + 4 + offset, 118, 0.5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 7);
  texture.anisotropy = 4;
  return texture;
}

// Each prop lives in a named slot. A future GLB can replace only that slot's
// placeholder without changing the room, interactions or collisions.
export function buildRecordingStudio(scene) {
  const mats = {
    walnut: new THREE.MeshStandardMaterial({ color: 0x5a3027, roughness: 0.76 }),
    timber: new THREE.MeshStandardMaterial({ color: 0x8a5940, roughness: 0.7 }),
    timberLight: new THREE.MeshStandardMaterial({ color: 0xad7853, roughness: 0.68 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14141b, roughness: 0.71, metalness: 0.12 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x29252b, roughness: 0.92 }),
    felt: new THREE.MeshStandardMaterial({ color: 0x492b44, roughness: 1 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xd4bd9e, roughness: 0.88 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xbf8d54, roughness: 0.32, metalness: 0.72 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x777780, roughness: 0.34, metalness: 0.65 }),
    led: new THREE.MeshBasicMaterial({ color: 0xe678c7 }),
    greenLed: new THREE.MeshBasicMaterial({ color: 0x94e9ad }),
    screen: new THREE.MeshBasicMaterial({ color: 0x395a57 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x9183b5, transmission: 0.52, opacity: 0.27, transparent: true, roughness: 0.08, metalness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
  };
  const slots = new Map();
  const colliders = [];
  const boxGeometry = new Map();
  function box(parent, name, w, h, d, x, y, z, material, collision = false) {
    const key = `${w}/${h}/${d}`;
    if (!boxGeometry.has(key)) boxGeometry.set(key, new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(boxGeometry.get(key), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = h > 0.08;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (collision) colliders.push(mesh);
    return mesh;
  }
  function cylinder(parent, name, radius, height, x, y, z, material, sides = 12) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function slot(id, x, y, z) {
    const anchor = new THREE.Group();
    anchor.name = `studio-slot:${id}`;
    anchor.position.set(x, y, z);
    const placeholder = new THREE.Group();
    placeholder.name = `studio-placeholder:${id}`;
    anchor.add(placeholder);
    scene.add(anchor);
    slots.set(id, { anchor, placeholder });
    return placeholder;
  }
  function cable(points, material = mats.dark, radius = 0.014) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 5, false), material);
    scene.add(mesh);
  }

  // Smoked plum/oak parquet: one textured surface instead of 35 seam meshes.
  box(scene, "floor structure", 20, 0.16, 28, 0, -0.1, -5, mats.walnut);
  const parquet = new THREE.Mesh(new THREE.PlaneGeometry(20, 28), new THREE.MeshStandardMaterial({ map: makeParquetTexture(), roughness: 0.69, metalness: 0.04 }));
  parquet.name = "studio parquet";
  parquet.rotation.x = -Math.PI / 2;
  parquet.position.set(0, -0.012, -5);
  parquet.receiveShadow = true;
  scene.add(parquet);
  box(scene, "control rug", 8.6, 0.025, 6.8, 0, 0.018, -0.3, mats.felt);
  box(scene, "control rug border", 8.9, 0.016, 7.05, 0, 0.012, -0.3, mats.brass);
  box(scene, "control rug top", 8.55, 0.027, 6.65, 0, 0.025, -0.3, mats.felt);
  box(scene, "booth rug", 5.8, 0.03, 4.5, 0, 0.02, -14.7, mats.felt);
  box(scene, "ceiling", 20, 0.2, 28, 0, 5.4, -5, mats.charcoal);
  box(scene, "front wall", 20, 5.4, 0.25, 0, 2.7, 8.95, mats.charcoal, true);
  box(scene, "rear wall", 20, 5.4, 0.25, 0, 2.7, -18.95, mats.charcoal, true);
  for (const x of [-10, 10]) box(scene, "side wall", 0.25, 5.4, 28, x, 2.7, -5, mats.charcoal, true);
  for (const z of [-18.8, 8.8]) box(scene, "baseboard", 19.8, 0.24, 0.12, 0, 0.12, z, mats.walnut);
  for (const x of [-9.85, 9.85]) box(scene, "baseboard", 0.12, 0.24, 27.5, x, 0.12, -5, mats.walnut);

  // Alternating acoustic absorbers and oak diffusers keep the room legible.
  for (const wallX of [-9.79, 9.79]) {
    for (let z = -17.2; z < 7.5; z += 2.6) {
      box(scene, "acoustic panel", 0.17, 2.6, 1.68, wallX, 2.95, z, z < -10 ? mats.felt : mats.walnut);
      for (let n = -3; n <= 3; n++) box(scene, "acoustic battens", 0.08, 2.35, 0.075, wallX + (wallX > 0 ? -0.12 : 0.12), 2.95, z + n * 0.22, mats.timberLight);
    }
  }
  for (let x = -8.5; x < 9; x += 2.4) {
    box(scene, "rear diffuser", 1.65, 2.85, 0.13, x, 2.8, -18.74, mats.walnut);
    for (let i = -3; i <= 3; i++) box(scene, "diffuser slat", 0.12, 2.48, 0.23 + (i % 3) * 0.05, x + i * 0.22, 2.8, -18.58, mats.timberLight);
  }

  // Isolation window: the right-hand opening is a walkable door between rooms.
  box(scene, "isolation lower wall", 15.5, 0.92, 0.24, -1.65, 0.46, -10.12, mats.walnut, true);
  box(scene, "isolation upper wall", 15.5, 1.02, 0.24, -1.65, 4.9, -10.12, mats.charcoal, true);
  box(scene, "isolation glass", 15.3, 3.45, 0.035, -1.65, 2.72, -10.12, mats.glass, true);
  for (const x of [-9.25, -6.1, -2.95, 0.2, 3.35, 6.1]) box(scene, "window mullion", 0.12, 3.6, 0.24, x, 2.7, -10.12, mats.brass, true);
  box(scene, "door frame", 0.23, 5.2, 0.28, 8.72, 2.6, -10.12, mats.walnut, true);
  box(scene, "door lintel", 2.35, 0.28, 0.28, 7.52, 5.13, -10.12, mats.walnut, true);
  box(scene, "control room nameplate", 2.45, 0.34, 0.05, -7.4, 4.72, -9.92, mats.brass);

  // The console has 20 channel strips with individually lit meter lanes.
  const consoleBody = slot("console", 0, 0, -2.1);
  box(consoleBody, "console chassis", 7.35, 0.8, 2.05, 0, 0.84, 0, mats.dark, true);
  const deck = box(consoleBody, "sloped mixing surface", 7.25, 0.11, 1.83, 0, 1.30, -0.04, mats.steel);
  deck.rotation.x = -0.12;
  for (let c = 0; c < 20; c++) {
    const x = -3.42 + c * 0.36;
    box(consoleBody, "channel lane", 0.26, 0.018, 1.43, x, 1.39, -0.02, mats.charcoal);
    box(consoleBody, "fader track", 0.025, 0.019, 0.44, x, 1.404, 0.39, mats.steel);
    box(consoleBody, "fader", 0.14, 0.05, 0.075, x, 1.44, 0.23 + (c % 5) * 0.065, mats.cream);
    for (let row = 0; row < 3; row++) cylinder(consoleBody, "knob", 0.048, 0.05, x, 1.43, -0.67 + row * 0.19, row === 0 ? mats.brass : mats.steel, 8);
    box(consoleBody, "meter", 0.1, 0.016, 0.12, x, 1.405, -0.83, c % 7 === 0 ? mats.led : mats.greenLed);
  }
  for (const x of [-3.15, 3.15]) box(consoleBody, "console leg", 0.23, 0.75, 1.7, x, 0.38, 0, mats.walnut);

  // Near-field monitors, CRT workstation, patch bays and outboard racks.
  for (const x of [-3.0, 3.0]) {
    box(scene, "monitor pedestal", 0.85, 0.6, 0.75, x, 1.3, -4.45, mats.walnut);
    const monitor = slot(x < 0 ? "monitor-left" : "monitor-right", x, 1.83, -4.45);
    box(monitor, "studio monitor cabinet", 0.82, 1.28, 0.72, 0, 0.38, 0, mats.dark);
    const woofer = cylinder(monitor, "woofer", 0.24, 0.035, 0, 0.19, 0.37, mats.charcoal, 20);
    woofer.rotation.x = Math.PI / 2;
    const tweeter = cylinder(monitor, "tweeter", 0.09, 0.039, 0, 0.64, 0.37, mats.brass, 18);
    tweeter.rotation.x = Math.PI / 2;
  }
  const crt = slot("crt", 1.42, 1.48, -4.28);
  box(crt, "CRT body", 0.98, 0.8, 0.85, 0, 0.33, 0, mats.cream);
  box(crt, "CRT bezel", 0.85, 0.58, 0.08, 0, 0.38, 0.45, mats.dark);
  box(crt, "CRT glass", 0.72, 0.45, 0.013, 0, 0.39, 0.50, mats.screen);
  for (let y = 0.23; y < 0.58; y += 0.055) box(crt, "DAW track", 0.53, 0.012, 0.014, -0.04, y, 0.514, y > 0.4 ? mats.led : mats.greenLed);
  box(crt, "keyboard", 0.75, 0.05, 0.26, 0, -0.03, 0.64, mats.cream);
  const rack = slot("rack", -8.16, 0, -3.55);
  box(rack, "rack cabinet", 1.28, 2.45, 3.9, 0, 1.22, 0, mats.dark, true);
  const rackModuleColors = [mats.charcoal, mats.steel, mats.charcoal, mats.walnut];
  for (let n = 0; n < 10; n++) {
    const y = 0.24 + n * 0.22;
    box(rack, "outboard module face", 0.034, 0.18, 3.62, 0.663, y, 0, rackModuleColors[n % 4]);
    box(rack, "module trim", 0.038, 0.018, 3.7, 0.685, y + 0.09, 0, mats.brass);
    for (const z of [-1.78, 1.78]) box(rack, "rack screw", 0.023, 0.025, 0.04, 0.7, y, z, mats.brass);
    for (let control = 0; control < 5; control++) {
      const z = -1.5 + control * 0.36;
      const knob = cylinder(rack, n % 3 ? "compressor knob" : "EQ knob", 0.048, 0.045, 0.71, y, z, control % 2 ? mats.brass : mats.steel, 10);
      knob.rotation.z = Math.PI / 2;
      box(rack, "module control tick", 0.012, 0.015, 0.024, 0.738, y + 0.03, z, mats.cream);
    }
    for (let z = 0.55; z < 1.47; z += 0.14) box(rack, n % 2 ? "compressor LED meter" : "EQ LED meter", 0.029, 0.045, 0.07, 0.7, y, z, z > 1.25 ? mats.led : mats.greenLed);
    box(rack, "module digital display", 0.035, 0.09, 0.34, 0.7, y, -0.5, mats.screen);
    for (let button = 0; button < 3; button++) box(rack, "outboard button", 0.04, 0.055, 0.09, 0.715, y, -0.15 + button * 0.16, button === 2 ? mats.led : mats.cream);
  }
  box(scene, "listening sofa", 2.75, 0.65, 1.3, -7.55, 0.36, 3.82, mats.felt, true);
  box(scene, "sofa back", 2.75, 1.1, 0.23, -7.55, 0.85, 4.4, mats.felt);
  for (const x of [-8.75, -6.35]) box(scene, "sofa arm", 0.28, 0.78, 1.33, x, 0.52, 3.82, mats.walnut);
  const chair = slot("chair", -1.8, 0, 1.15);
  cylinder(chair, "engineer stool", 0.67, 0.2, 0, 0.72, 0, mats.charcoal, 16);
  cylinder(chair, "stool shaft", 0.065, 0.58, 0, 0.37, 0, mats.steel);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    box(chair, "stool base", 0.11, 0.06, 0.65, Math.sin(a) * 0.25, 0.06, Math.cos(a) * 0.25, mats.dark).rotation.y = a;
  }

  // Guitar corner with proportioned instruments and a two-stack amplifier.
  for (const [x, z, name] of [[7.55, 3.5, "guitar"], [8.7, 4.1, "spare-guitar"]]) {
    const guitar = slot(name, x, 0, z);
    box(guitar, "guitar stand", 0.46, 0.06, 0.48, 0, 0.05, 0, mats.dark);
    cylinder(guitar, "stand post", 0.035, 0.92, 0, 0.5, 0, mats.steel);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), name === "guitar" ? mats.walnut : mats.brass);
    body.name = "electric guitar body";
    body.scale.set(0.9, 1.27, 0.31);
    body.position.set(0, 0.58, 0.06);
    guitar.add(body);
    box(guitar, "guitar neck", 0.1, 0.88, 0.1, 0, 1.24, 0.04, mats.timberLight);
    box(guitar, "guitar headstock", 0.18, 0.27, 0.1, 0, 1.77, 0.04, mats.timberLight);
    for (let i = 0; i < 5; i++) box(guitar, "fret", 0.105, 0.012, 0.012, 0, 1.04 + i * 0.12, 0.1, mats.brass);
  }
  const amp = slot("amplifier", 8, 0, -2.55);
  box(amp, "amp lower cabinet", 1.45, 1.04, 0.8, 0, 0.58, 0, mats.dark, true);
  box(amp, "amp grill", 1.3, 0.73, 0.025, 0, 0.53, 0.42, mats.charcoal);
  box(amp, "amp head", 1.35, 0.38, 0.64, 0, 1.27, 0, mats.walnut);
  for (let n = 0; n < 7; n++) cylinder(amp, "amp knob", 0.035, 0.045, -0.5 + n * 0.16, 1.34, 0.34, mats.brass, 8).rotation.x = Math.PI / 2;

  // Live booth: microphone, pop shield, headphones and a second amplifier.
  const mic = slot("microphone", 0.5, 0, -14.3);
  cylinder(mic, "mic stand base", 0.26, 0.06, 0, 0.04, 0, mats.dark, 14);
  cylinder(mic, "mic stand", 0.025, 1.7, 0, 0.9, 0, mats.steel);
  const boom = box(mic, "mic boom", 0.035, 0.035, 0.9, 0, 1.68, -0.35, mats.steel);
  boom.rotation.x = -0.18;
  cylinder(mic, "condenser microphone", 0.083, 0.27, 0, 1.56, -0.77, mats.brass, 16);
  const pop = cylinder(mic, "pop shield", 0.19, 0.012, 0, 1.57, -0.39, mats.charcoal, 20);
  pop.rotation.x = Math.PI / 2;
  box(scene, "booth headphones hook", 0.1, 0.24, 0.1, 3.2, 1.8, -18.65, mats.brass);
  const headphones = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 6, 16, Math.PI), mats.dark);
  headphones.name = "headphones";
  headphones.position.set(3.2, 1.58, -18.49);
  scene.add(headphones);
  box(scene, "booth amplifier", 1.35, 1.3, 0.7, -7.5, 0.7, -15.65, mats.dark, true);
  box(scene, "booth amp grille", 1.19, 0.85, 0.03, -7.5, 0.65, -15.25, mats.charcoal);
  cable([[0, 1.5, -14.3], [0.6, 1.1, -14.8], [1, 0.06, -15.5], [2.2, 0.035, -16.3], [3.9, 0.02, -17.2]]);
  cable([[8.1, 1.0, 3.5], [7.8, 0.05, 3.2], [6.2, 0.035, 2.6], [5.4, 0.03, -1.2]]);

  for (const [x, z, color] of [[-5.6, 1.8, 0xffd2aa], [5.4, -1.9, 0xf780d8], [0, -14.6, 0xffc89e]]) {
    box(scene, "ceiling light", 2.4, 0.08, 0.42, x, 5.18, z, mats.cream);
    const light = new THREE.PointLight(color, 15, 12, 2);
    light.position.set(x, 4.8, z);
    scene.add(light);
  }
  const key = new THREE.SpotLight(0xffd8b8, 28, 15, Math.PI / 3, 0.65, 2);
  key.position.set(3, 5, 3);
  key.target.position.set(0, 0, -1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key, key.target);
  const violet = new THREE.PointLight(0x9d53ff, 8, 7, 2);
  violet.position.set(-8, 3.7, -7);
  scene.add(violet);

  return { slots, colliders, interactions: STUDIO_EXAMINE };
}

export function replaceRecordingStudioAsset(studio, slotId, gltfScene) {
  const entry = studio.slots.get(slotId);
  if (!entry) return false;
  entry.placeholder.visible = false;
  entry.anchor.add(gltfScene);
  return true;
}
