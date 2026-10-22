import * as THREE from "three";
import { createInteractionPromptSprite } from "./recordStoreInteractionPrompt.js";
import { createStudioSurfaceMaterials } from "./studioSurfaceMaterials.js";
import { createStudioFurnishings } from "./studioFurnishings.js";
import { STUDIO_EXAMINE, STUDIO_OBSTACLES } from "./studioLayout.js";
import { HUGO_ALBUMS } from "./studioHugoCatalog.js";
import gloomCover from "../assets/neonboy-animaciones/gloom.jpg";
import holyFireCover from "../assets/neonboy-animaciones/holy fire.jpg";
import arcadeCover from "../assets/neonboy-animaciones/arcade.jpg";

// Each prop lives in a named slot. A future GLB can replace only that slot's
// placeholder without changing the room, interactions or collisions.
export function buildRecordingStudio(scene) {
  const mats = {
    dark: new THREE.MeshStandardMaterial({ color: 0x14141b, roughness: 0.71, metalness: 0.12 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x29252b, roughness: 0.92 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xd4bd9e, roughness: 0.88 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xbf8d54, roughness: 0.32, metalness: 0.72 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x777780, roughness: 0.34, metalness: 0.65 }),
    led: new THREE.MeshBasicMaterial({ color: 0xe678c7 }),
    greenLed: new THREE.MeshBasicMaterial({ color: 0x94e9ad }),
    screen: new THREE.MeshBasicMaterial({ color: 0x395a57 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x9183b5, transmission: 0.52, opacity: 0.27, transparent: true, roughness: 0.08, metalness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
  };
  Object.assign(mats, createStudioSurfaceMaterials());
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
    const assembly = new THREE.Group();
    assembly.name = `studio-assembly:${id}`;
    const placeholder = new THREE.Group();
    placeholder.name = `studio-placeholder:${id}`;
    assembly.add(placeholder);
    anchor.add(assembly);
    scene.add(anchor);
    slots.set(id, { anchor, assembly, placeholder });
    return placeholder;
  }
  function cable(points, material = mats.dark, radius = 0.014) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, radius, 5, false), material);
    scene.add(mesh);
  }

  const furnishings = createStudioFurnishings({ mats, box, cylinder, colliders });

  // Wood grain, relief and satin finish share a single floor surface.
  box(scene, "floor structure", 20, 0.16, 28, 0, -0.1, -5, mats.walnut);
  const parquet = new THREE.Mesh(new THREE.PlaneGeometry(20, 28), mats.floor);
  parquet.name = "studio parquet";
  parquet.rotation.x = -Math.PI / 2;
  parquet.position.set(0, -0.012, -5);
  parquet.receiveShadow = true;
  scene.add(parquet);
  furnishings.rug(scene, "control room woven rug", 8.9, 7.05, 0, 0.018, -0.3);
  furnishings.rug(scene, "booth woven rug", 5.8, 4.5, 0, 0.02, -14.7);
  box(scene, "ceiling", 20, 0.2, 28, 0, 5.4, -5, mats.charcoal);
  box(scene, "front wall", 20, 5.4, 0.25, 0, 2.7, 8.95, mats.charcoal, true);
  box(scene, "rear wall", 20, 5.4, 0.25, 0, 2.7, -18.95, mats.charcoal, true);
  for (const x of [-10, 10]) box(scene, "side wall", 0.25, 5.4, 28, x, 2.7, -5, mats.charcoal, true);
  for (const z of [-18.8, 8.8]) box(scene, "baseboard", 19.8, 0.24, 0.12, 0, 0.12, z, mats.walnut);
  for (const x of [-9.85, 9.85]) box(scene, "baseboard", 0.12, 0.24, 27.5, x, 0.12, -5, mats.walnut);

  for (const [x, cover, title] of [[-3.7, gloomCover, "Gloom"], [0, holyFireCover, "Holy Fire"], [3.7, arcadeCover, "Arcade"]]) {
    box(scene, title + " album frame", 1.62, 1.74, 0.08, x, 2.86, 8.72, mats.brass);
    box(scene, title + " album mat", 1.46, 1.58, 0.015, x, 2.86, 8.665, mats.dark);
    const texture = new THREE.TextureLoader().load(cover);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.48), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.93, metalness: 0 }));
    print.name = title + " album cover";
    print.rotation.y = Math.PI;
    print.position.set(x, 2.86, 8.64);
    scene.add(print);
  }

  // Alternating acoustic absorbers and oak diffusers keep the room legible.
  const hugoGalleryZ = [-6.8, -4.2, -1.6];
  for (const wallX of [-9.79, 9.79]) {
    for (let z = -17.2; z < 7.5; z += 2.6) {
      if (wallX > 0 && hugoGalleryZ.some((galleryZ) => Math.abs(galleryZ - z) < 0.15)) continue;
      const variant = Math.round((z + 17.2) / 2.6);
      furnishings.acousticPanel(scene, wallX, 2.95, z, wallX > 0 ? -Math.PI / 2 : Math.PI / 2, variant);
    }
  }
  // Three shallow framed sleeves on the control room's right wall. The acoustic
  // panels in these bays are omitted so the artwork stays readable.
  HUGO_ALBUMS.forEach((album, index) => {
    const z = hugoGalleryZ[index];
    box(scene, album.name + " frame", 0.09, 2.3, 1.65, 9.62, 2.85, z, mats.brass);
    box(scene, album.name + " mat", 0.018, 2.18, 1.54, 9.565, 2.85, z, mats.dark);
    const cover = new THREE.TextureLoader().load(album.cover);
    cover.colorSpace = THREE.SRGBColorSpace;
    cover.anisotropy = 4;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 1.34),
      new THREE.MeshStandardMaterial({ map: cover, roughness: 0.94, side: THREE.DoubleSide }));
    print.name = album.name + " cover";
    print.rotation.y = -Math.PI / 2;
    print.position.set(9.548, 3.13, z);
    scene.add(print);
    const card = document.createElement("canvas");
    card.width = 512;
    card.height = 144;
    const ink = card.getContext("2d");
    ink.fillStyle = "#1b1521";
    ink.fillRect(0, 0, 512, 144);
    ink.fillStyle = "#f1dfc5";
    ink.font = "bold 25px Arial";
    ink.fillText(album.name.length > 26 ? album.name.slice(0, 24) + "..." : album.name, 16, 43);
    ink.fillStyle = "#df8fc1";
    ink.font = "20px Arial";
    ink.fillText(album.artist, 16, 78);
    ink.fillStyle = "#d7bca5";
    ink.font = "17px Arial";
    ink.fillText(album.totalTracks ? album.totalTracks + " temas" : "Temas pendientes", 16, 112);
    const cardTexture = new THREE.CanvasTexture(card);
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.39),
      new THREE.MeshBasicMaterial({ map: cardTexture, side: THREE.DoubleSide }));
    plaque.name = album.name + " credits";
    plaque.rotation.y = -Math.PI / 2;
    plaque.position.set(9.545, 2.14, z);
    scene.add(plaque);
  });

  for (let x = -8.5; x < 9; x += 2.4) {
    furnishings.acousticPanel(scene, x, 2.8, -18.74, 0, 0);
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

  // Full-height monitor stands place both speakers at seated ear height.
  for (const x of [-3.0, 3.0]) {
    const id = x < 0 ? "monitor-left" : "monitor-right";
    const monitor = slot(id, x, 1.83, -4.45);
    const stand = slots.get(id).assembly;
    box(stand, "monitor stand foot", 0.82, 0.08, 0.72, 0, -1.52, 0, mats.steel);
    box(stand, "monitor stand column", 0.12, 1.38, 0.12, 0, -0.83, 0, mats.dark);
    box(stand, "monitor stand top plate", 0.86, 0.08, 0.75, 0, -0.04, 0, mats.steel);
    box(monitor, "studio monitor cabinet", 0.82, 1.28, 0.72, 0, 0.38, 0, mats.dark);
    const woofer = cylinder(monitor, "woofer", 0.24, 0.035, 0, 0.19, 0.37, mats.charcoal, 20);
    woofer.rotation.x = Math.PI / 2;
    const tweeter = cylinder(monitor, "tweeter", 0.09, 0.039, 0, 0.64, 0.37, mats.brass, 18);
    tweeter.rotation.x = Math.PI / 2;
  }
  const pcTable = slot("pc-table", 5.2, 0, -4.35);
  furnishings.desk(pcTable);
  const crt = slot("crt", 5.0, 1.09, -4.44);
  box(crt, "CRT body", 0.98, 0.8, 0.85, 0, 0.33, 0, mats.cream);
  box(crt, "CRT bezel", 0.85, 0.58, 0.08, 0, 0.38, 0.45, mats.dark);
  box(crt, "CRT glass", 0.72, 0.45, 0.013, 0, 0.39, 0.50, mats.screen);
  for (let y = 0.23; y < 0.58; y += 0.055) box(crt, "DAW track", 0.53, 0.012, 0.014, -0.04, y, 0.514, y > 0.4 ? mats.led : mats.greenLed);
  box(crt, "keyboard", 0.75, 0.05, 0.26, 0, -0.03, 0.64, mats.cream);
  const rack = slot("rack", -8.16, 0, -3.55);
  furnishings.rack(rack);
  const sofa = slot("sofa", -9.1, 0, 3.82);
  furnishings.sofa(sofa);
  const chair = slot("chair", 0, 0, 0.55);
  const hugo = slot("hugo", -1.5, 0, 0.65);
  const hugoPrompt = createInteractionPromptSprite();
  hugoPrompt.name = "Hugo talk prompt";
  slots.get("hugo").assembly.add(hugoPrompt);
  cylinder(chair, "engineer stool", 0.67, 0.2, 0, 0.72, 0, mats.charcoal, 16);
  cylinder(chair, "stool shaft", 0.065, 0.58, 0, 0.37, 0, mats.steel);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    box(chair, "stool base", 0.11, 0.06, 0.65, Math.sin(a) * 0.25, 0.06, Math.cos(a) * 0.25, mats.dark).rotation.y = a;
  }

  // Three library guitars on separate floor stands along the control-room wall.
  for (const [id, z] of [["guitar", 1.0], ["guitar-2", 3.1], ["guitar-3", 5.2]]) {
    slot(id, 8.65, 0, z);
    furnishings.guitarStand(slots.get(id).assembly, id === "guitar-3" ? { cradleHeight: 0.34, backZ: -0.16 } : undefined);
  }
  const amp = slot("amplifier", -7.35, 0, -13.1);
  box(amp, "amp lower cabinet", 1.45, 1.04, 0.8, 0, 0.58, 0, mats.dark, true);
  box(amp, "amp grill", 1.3, 0.73, 0.025, 0, 0.53, 0.42, mats.charcoal);
  box(amp, "amp head", 1.35, 0.38, 0.64, 0, 1.27, 0, mats.walnut);
  for (let n = 0; n < 7; n++) cylinder(amp, "amp knob", 0.035, 0.045, -0.5 + n * 0.16, 1.34, 0.34, mats.brass, 8).rotation.x = Math.PI / 2;

  // Live booth: a dedicated vocal area beside the drum rug.
  const mic = slot("microphone", 2.55, 0, -14.15);
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
  const drum = slot("drumkit", -2.0, 0, -16.25);
  furnishings.rug(slots.get("drumkit").assembly, "drum isolation rug", 3.65, 3.0, 0, 0.02, 0);
  slot("drum-bench", -2.0, 0, -18.0);
  // Physical cables end at a wall outlet or connected equipment, not in open space.
  box(scene, "vocal cable wall socket", 0.055, 0.22, 0.2, 9.74, 0.55, -14.5, mats.steel);
  box(scene, "amplifier cable wall socket", 0.055, 0.22, 0.2, -9.74, 0.55, -13.25, mats.steel);
  cable([[2.55, 1.48, -14.15], [2.68, 0.18, -14.25], [3.0, 0.055, -14.5], [9.55, 0.055, -14.5], [9.72, 0.55, -14.5]], mats.dark, 0.01);
  cable([[-7.35, 0.82, -13.1], [-7.95, 0.08, -13.25], [-9.55, 0.055, -13.25], [-9.72, 0.55, -13.25]], mats.dark, 0.012);
  cable([[-3.45, 0.52, -2.8], [-4.0, 0.05, -3.15], [-6.7, 0.04, -3.45], [-7.55, 0.8, -3.55]], mats.dark, 0.01);

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
  const boothAccent = new THREE.PointLight(0x9d53ff, 3.5, 7, 2);
  boothAccent.position.set(-7.9, 3.0, -16.1);
  scene.add(boothAccent);
  const boothWarm = new THREE.PointLight(0xffba91, 2.5, 5, 2);
  boothWarm.position.set(3.0, 3.3, -15.6);
  scene.add(boothWarm);

  return {
    slots, colliders, mixers: [], hugoPrompt,
    hugoInteraction: { x: -1.5, z: 0.65, reach: 1.5, enabled: false },
    obstacles: STUDIO_OBSTACLES.map((item) => ({ ...item, baseHx: item.hx, baseHz: item.hz })),
    interactions: STUDIO_EXAMINE
  };
}

export function replaceRecordingStudioAsset(studio, slotId, gltfScene) {
  const entry = studio.slots.get(slotId);
  if (!entry) return false;
  entry.placeholder.visible = false;
  entry.anchor.add(gltfScene);
  return true;
}
