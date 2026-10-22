import * as THREE from "three";
import { createRockClubMaterials } from "./rockClubMaterials.js";
import { createRockClubDetails } from "./rockClubDetails.js";
import { createRockClubLighting } from "./rockClubLighting.js";
import { ROCK_CLUB_EXAMINE, ROCK_CLUB_FRIENDS_TABLE, ROCK_CLUB_OBSTACLES, ROCK_CLUB_STAGE_HEIGHT } from "./rockClubLayout.js";
import { ROCK_CLUB_STAGE_MARKS } from "./rockClubBand.js";
import holyFireCover from "../assets/neonboy-animaciones/holy fire.jpg";
import gloomCover from "../assets/neonboy-animaciones/gloom.jpg";
import arcadeCover from "../assets/neonboy-animaciones/arcade.jpg";

function signTexture(title, subtitle, background = "#1d111b") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 768, 192);
  ctx.strokeStyle = "#9c3757";
  ctx.lineWidth = 6;
  ctx.strokeRect(13, 13, 742, 166);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5ddc5";
  ctx.font = "900 68px Arial, sans-serif";
  ctx.fillText(title, 384, 90);
  ctx.fillStyle = "#ec88b5";
  ctx.font = "700 25px Arial, sans-serif";
  ctx.fillText(subtitle, 384, 138);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildRockClub(scene) {
  const materials = createRockClubMaterials();
  const details = createRockClubDetails(scene, materials);
  const geometries = new Map();
  const colliders = [];
  const slots = new Map();
  function box(parent, name, width, height, depth, x, y, z, material, collision = false) {
    const key = `${width}/${height}/${depth}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(width, height, depth));
    const mesh = new THREE.Mesh(geometries.get(key), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = height > 0.35;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (collision) colliders.push(mesh);
    return mesh;
  }
  function cylinder(parent, name, radius, height, x, y, z, material, sides = 12) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = height > 0.35;
    parent.add(mesh);
    return mesh;
  }
  function modelSlot(id, x, y, z) {
    const anchor = new THREE.Group();
    anchor.name = `club-slot:${id}`;
    anchor.position.set(x, y, z);
    const placeholder = new THREE.Group();
    placeholder.name = `club-placeholder:${id}`;
    anchor.add(placeholder);
    scene.add(anchor);
    slots.set(id, { anchor, placeholder });
    return placeholder;
  }

  box(scene, "dark club floor", 20, 0.18, 28, 0, -0.1, -5, materials.floor);
  box(scene, "smoky ceiling", 20, 0.2, 28, 0, 5.5, -5, materials.black);
  box(scene, "entrance wall", 20, 5.5, 0.25, 0, 2.75, 8.9, materials.brick, true);
  box(scene, "stage back wall", 20, 5.5, 0.25, 0, 2.75, -18.95, materials.brick, true);
  for (const x of [-9.9, 9.9]) box(scene, "side brick wall", 0.24, 5.5, 28, x, 2.75, -5, materials.sideBrick, true);
  for (const x of [-9.72, 9.72]) box(scene, "wall skirting", 0.12, 0.4, 27.8, x, 0.2, -5, materials.stage);
  box(scene, "entrance wood skirting", 19.7, 0.4, 0.14, 0, 0.2, 8.72, materials.stage);

  details.walls();

  // The central ramp gives the shared controller a real route onto the stage.
  box(scene, "raised stage", 15.4, ROCK_CLUB_STAGE_HEIGHT, 7.0, 0, ROCK_CLUB_STAGE_HEIGHT / 2, -15, materials.stage, true);
  box(scene, "stage wood top", 15.4, 0.04, 7.0, 0, ROCK_CLUB_STAGE_HEIGHT + 0.015, -15, materials.stageFloor);
  const ramp = box(scene, "stage access ramp", 4.6, 0.1, 1.85, 0, 0.24, -10.58, materials.stage);
  ramp.rotation.x = 0.254;
  for (const x of [-5, 5]) {
    box(scene, "stage front fascia", 5.4, 0.5, 0.24, x, 0.25, -11.48, materials.black, true);
    for (let i = 0; i < 7; i++) box(scene, "stage edge lamp", 0.09, 0.06, 0.08, x - 2.25 + i * 0.75, 0.52, -11.34, i % 2 ? materials.red : materials.violet);
  }
  for (const x of [-7.7, 7.7]) box(scene, "stage side rail", 0.2, 0.65, 7, x, 0.35, -15, materials.black, true);
  const curtainGeometry = new THREE.PlaneGeometry(18.5, 4.45, 144, 1);
  const curtainVertices = curtainGeometry.attributes.position;
  for (let i = 0; i < curtainVertices.count; i++) {
    const x = curtainVertices.getX(i);
    curtainVertices.setZ(i, Math.sin(x * 7.8) * 0.14 + Math.sin(x * 15.6) * 0.035);
  }
  curtainGeometry.computeVertexNormals();
  const curtain = new THREE.Mesh(curtainGeometry, materials.burgundy);
  curtain.name = "folded velvet stage curtain";
  curtain.position.set(0, 3.1, -18.55); curtain.receiveShadow = true; scene.add(curtain);
  const showSign = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.55), new THREE.MeshBasicMaterial({ map: signTexture("NEONBOY LIVE", "CLUB DE ROCK  ·  1999"), transparent: true, toneMapped: false }));
  showSign.name = "club stage sign";
  showSign.position.set(0, 3.95, -18.28);
  scene.add(showSign);

  // Entrance hall and a low, unmistakable ticket counter.
  box(scene, "entry rug", 3.4, 0.025, 4.3, 0, 0.014, 4.8, materials.burgundy);
  box(scene, "entrance door", 2.35, 3.2, 0.1, 0, 1.6, 8.72, materials.black);
  box(scene, "entrance push bar", 1.42, 0.08, 0.12, 0, 1.13, 8.61, materials.metal);
  const entranceSign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), new THREE.MeshBasicMaterial({ map: signTexture("CLUB DE ROCK", "ENTRADA  ·  DESDE 1999"), toneMapped: false }));
  entranceSign.rotation.y = Math.PI;
  entranceSign.position.set(0, 3.95, 8.59);
  scene.add(entranceSign);
  box(scene, "ticket desk", 1.75, 0.95, 0.85, -7.65, 0.47, 5.2, materials.stage, true);
  box(scene, "ticket desk top", 1.95, 0.08, 1.05, -7.65, 0.97, 5.2, materials.brass);

  // Preserve the same collision footprints and interaction locations.
  details.tables();
  colliders.push(details.consoleDesk());
  cylinder(scene, "old barrel", 0.46, 0.88, -8.35, 0.44, -7.7, materials.stage);
  for (const y of [0.16, 0.7]) cylinder(scene, "barrel band", 0.47, 0.07, -8.35, y, -7.7, materials.metal);
  colliders.push(details.bar());
  const barSign = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.7), new THREE.MeshBasicMaterial({ map: signTexture("LA BARRA", "ABIERTO TODA LA NOCHE"), toneMapped: false }));
  barSign.rotation.y = -Math.PI / 2;
  barSign.position.set(9.69, 4.15, -3.5);
  scene.add(barSign);

  // Backstage is marked and blocked until a later story step.
  box(scene, "backstage door", 0.08, 2.75, 1.55, 9.72, 1.4, -15.9, materials.black, true);
  box(scene, "backstage door handle", 0.13, 0.13, 0.13, 9.62, 1.2, -16.35, materials.brass);
  const backstageSign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.45), new THREE.MeshBasicMaterial({ map: signTexture("BACKSTAGE", "ACCESO RESTRINGIDO"), toneMapped: false }));
  backstageSign.rotation.y = -Math.PI / 2;
  backstageSign.position.set(9.58, 3.25, -15.9);
  scene.add(backstageSign);

  // Framed album artwork doubles as late-90s gig posters.
  const posterLoader = new THREE.TextureLoader();
  for (const [x, z, image, title] of [[-9.74, 1.9, holyFireCover, "Holy Fire"], [-9.74, -4.4, gloomCover, "Gloom"], [9.74, 2.1, arcadeCover, "Arcade"]]) {
    const frame = box(scene, `${title} poster frame`, 0.12, 2.25, 1.55, x, 2.85, z, materials.brass);
    frame.castShadow = false;
    const texture = posterLoader.load(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.05), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.94, side: THREE.DoubleSide }));
    print.name = `${title} club poster`;
    print.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    print.position.set(x < 0 ? -9.65 : 9.65, 2.85, z);
    scene.add(print);
  }

  // Musical equipment stays in named slots so a GLB can replace only its prop.
  const mic = modelSlot("microphone", 0, ROCK_CLUB_STAGE_HEIGHT, -14.7);
  cylinder(mic, "vocal mic pole", 0.028, 1.34, 0, 0.67, 0, materials.metal);
  cylinder(mic, "vocal mic base", 0.25, 0.045, 0, 0.025, 0, materials.black);
  cylinder(mic, "vocal mic capsule", 0.072, 0.18, 0, 1.39, 0, materials.brass);
  const drums = modelSlot("drums", 0, ROCK_CLUB_STAGE_HEIGHT, -16.8);
  cylinder(drums, "bass drum", 0.74, 0.65, 0, 0.65, 0, materials.black, 16).rotation.x = Math.PI / 2;
  for (const x of [-0.72, 0.72]) {
    cylinder(drums, "drum tom", 0.34, 0.38, x, 1.0, -0.32, materials.burgundy);
    cylinder(drums, "cymbal pole", 0.025, 1.3, x * 1.6, 0.72, -0.55, materials.metal);
    cylinder(drums, "cymbal", 0.43, 0.035, x * 1.6, 1.39, -0.55, materials.brass);
  }
  const drumBench = modelSlot("drum-bench", 1.12, ROCK_CLUB_STAGE_HEIGHT, -17.62);
  cylinder(drumBench, "drummer stool", 0.32, 0.13, 0, 0.78, 0, materials.black);
  cylinder(drumBench, "drummer stool pole", 0.05, 0.72, 0, 0.37, 0, materials.metal);
  for (const [id, x] of [["amp-left", -5.25], ["amp-right", 5.25]]) {
    const amp = modelSlot(id, x, ROCK_CLUB_STAGE_HEIGHT, -16.2);
    box(amp, "stack amplifier", 1.25, 1.4, 0.8, 0, 0.7, 0, materials.black);
    box(amp, "amp grille", 1.12, 0.9, 0.03, 0, 0.82, 0.42, materials.metal);
    for (let i = 0; i < 5; i++) cylinder(amp, "amp dial", 0.045, 0.03, -0.46 + i * 0.23, 1.27, 0.43, materials.brass, 8).rotation.x = Math.PI / 2;
  }
  // Separate anchors make the instruments and their metal supports editable.
  for (const [id, x, z] of [["guitar", -4.95, -13.85], ["bass", 5.45, -14.15]]) {
    const stand = modelSlot(`${id}-stand`, x, ROCK_CLUB_STAGE_HEIGHT, z);
    details.stand(stand, id);
    modelSlot(id, x, ROCK_CLUB_STAGE_HEIGHT, z);
  }
  const playerMark = ROCK_CLUB_STAGE_MARKS.neonboy;
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.31, 24), materials.violet);
  mark.name = "NeonBoy future performance mark";
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(playerMark.x, playerMark.y + 0.025, playerMark.z);
  scene.add(mark);
  for (const x of [-2.9, 2.9]) colliders.push(details.monitor(x));
  for (const x of [-6.35, 6.35]) colliders.push(details.speaker(x));

  // Warm ambience, moving heads and stage haze; only the front spot casts shadows.
  const hallLight = new THREE.PointLight(0xffc49a, 28, 17, 2);
  hallLight.position.set(-4, 4.5, 2.8);
  scene.add(hallLight);
  const barLight = new THREE.PointLight(0xf09063, 28, 12, 2);
  barLight.position.set(7.1, 3.7, -3.5);
  scene.add(barLight);
  const danceFloorFill = new THREE.PointLight(0xb5709c, 50, 21, 2);
  danceFloorFill.position.set(0, 4.4, -6.5);
  scene.add(danceFloorFill);
  const stageFill = new THREE.PointLight(0xffaf8f, 75, 16, 2);
  stageFill.position.set(0, 4.5, -15.2);
  scene.add(stageFill);
  const atmosphere = createRockClubLighting(scene, materials);
  const frontSpot = new THREE.SpotLight(0xffd1aa, 40, 15, Math.PI / 5, 0.45, 1.5);
  frontSpot.position.set(0, 5.0, -10.8);
  frontSpot.target.position.set(0, 0.55, -14.2);
  frontSpot.castShadow = true;
  frontSpot.shadow.mapSize.set(1024, 1024);
  frontSpot.shadow.normalBias = 0.025;
  scene.add(frontSpot, frontSpot.target);
  for (const z of [3.8, -3.8]) {
    box(scene, "ceiling pendant", 0.5, 0.12, 0.5, -2.6, 4.9, z, materials.black);
    cylinder(scene, "warm pendant bulb", 0.13, 0.13, -2.6, 4.78, z, materials.screen);
  }

  return { slots, colliders, obstacles: ROCK_CLUB_OBSTACLES.map((entry) => ({ ...entry })),
    interactions: [...ROCK_CLUB_EXAMINE, ROCK_CLUB_FRIENDS_TABLE], mixers: [], atmosphere, showSign };
}
