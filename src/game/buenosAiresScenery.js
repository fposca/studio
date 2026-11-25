import * as THREE from "three";
import { disposeObjects } from "./disposeGameObjects.js";
import { citySurface, cityGlowTexture, citySignTexture, batchCityDetails } from "./buenosAiresArt.js";
import { createCityWindowTexture } from "./buenosAiresWindows.js";
import { addObeliskForceField } from "./buenosAiresForceField.js";
import { addBuenosAiresGarden } from "./buenosAiresGarden.js";
import { addBuenosAiresVehicles } from "./buenosAiresVehicles.js";
import { createBuenosAiresGroundVehicles } from "./buenosAiresGroundVehicles.js";
import { createBuenosAiresActors } from "./buenosAiresActors.js";
import { createBuenosAiresFuegoScene } from "./buenosAiresFuegoScene.js";
import { createBuenosAiresVigilante } from "./buenosAiresVigilante.js";
import { VIGILANTE_ARENA } from "./buenosAiresVigilanteCombat.js";
import { createStoreInvasionVision } from "./storeInvasionVision.js";
import { createBuenosAiresTransmitters } from "./buenosAiresTransmitters.js";
import { createCityLighting, cityLightPath } from "./buenosAiresLighting.js";
import {
  BUENOS_AIRES_BUILDINGS, BUENOS_AIRES_OBSTACLES,
  BUENOS_AIRES_PEDESTRIAN_ROUTES, OBELISK, OBELISK_FIELD, OBELISK_APPROACH, canStandInBuenosAires,
} from "./buenosAiresLayout.js";

export function buildBuenosAires(scene, { onEvent, onDamage, tier = "high" } = {}) {
  const root = new THREE.Group(); root.name = "Buenos Aires 2049 / 9 de Julio nocturna"; scene.add(root);
  scene.background = new THREE.Color(0x040b19);
  scene.fog = new THREE.Fog(0x101e31, 80, 205);
  const lighting = createCityLighting();
  const glowMap = cityGlowTexture();
  const windowMap = createCityWindowTexture();
  const mats = {
    asphalt: new THREE.MeshStandardMaterial({ name: "Asfalto húmedo / áridos y reparaciones", color: 0x8d9aaa, ...citySurface("asphalt", 26), roughness: .98, metalness: .12 }),
    sidewalk: new THREE.MeshStandardMaterial({ name: "Baldosas porteñas", color: 0xc8c9c8, ...citySurface("paving", 26), roughness: .94 }),
    plaza: new THREE.MeshStandardMaterial({ name: "Losas de granito", color: 0xc3c8cc, ...citySurface("paving", 2), roughness: .86 }),
    curb: new THREE.MeshStandardMaterial({ color: 0xaaa9a0, roughness: .88 }),
    line: new THREE.MeshStandardMaterial({ color: 0xc6c8c7, roughness: .78 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xd4b861, roughness: .8 }),
    stone: new THREE.MeshStandardMaterial({ name: "Piedra clara / juntas de revestimiento", color: 0xf1e8d4, ...citySurface("stone", OBELISK.widthScale, 15), emissive: 0x93adc4, emissiveIntensity: .1, roughness: .8 }),
    dark: new THREE.MeshStandardMaterial({ name: "Metal urbano", color: 0x18232e, roughness: .48, metalness: .68 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xb9ac91, roughness: .5, metalness: .45 }),
    glass: new THREE.MeshStandardMaterial({ name: "Vidrio reflectante", color: 0x19354a, roughness: .22, metalness: .55 }),
    windowWarm: new THREE.MeshStandardMaterial({ color: 0xc6a878, emissive: 0xffc778, map: windowMap, emissiveMap: windowMap, emissiveIntensity: .9, roughness: .4 }),
    windowCool: new THREE.MeshStandardMaterial({ color: 0x557d95, emissive: 0x7bb6d7, map: windowMap, emissiveMap: windowMap, emissiveIntensity: .58, roughness: .32 }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x81d9ee, toneMapped: false }),
    warm: new THREE.MeshBasicMaterial({ color: 0xffcb86, toneMapped: false }),
    red: new THREE.MeshBasicMaterial({ color: 0xf95649, toneMapped: false }),
    grass: new THREE.MeshStandardMaterial({ color: 0x73966a, ...citySurface("grass", 2, 5), roughness: 1 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x212c25, roughness: 1 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x3b352e, roughness: 1 }),
    leaves: new THREE.MeshStandardMaterial({ color: 0x244b40, roughness: .92, flatShading: true }),
  };
  const box = new THREE.BoxGeometry(1, 1, 1), plane = new THREE.PlaneGeometry(1, 1);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const foliage = new THREE.IcosahedronGeometry(1, 1);
  const colliders = [], signs = [], optionalDetails = [], lamps = [], trafficLights = [];
  const part = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, cast = true) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = cast; mesh.receiveShadow = !material.isMeshBasicMaterial; root.add(mesh); return mesh;
  };
  const addBox = (w, h, d, x, y, z, material, cast = true) => part(box, material, x, y, z, w, h, d, cast);
  const ground = (w, d, x, z, y, material) => {
    const m = part(plane, material, x, y, z, w, d, 1, false); m.rotation.x = -Math.PI / 2; return m;
  };
  const glowMaterial = (color, opacity, additive = true) => new THREE.MeshBasicMaterial({ map: glowMap, color, transparent: true, opacity,
    depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false });
  const warmPool = glowMaterial(0xf7ba78, .19), coolPool = glowMaterial(0x69cbee, .13), shadow = glowMaterial(0x02060b, .72, false);
  const lampHalo = new THREE.SpriteMaterial({ map: glowMap, color: 0xffc990, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending });
  const holoMetal = new THREE.MeshStandardMaterial({ name: "Proyectores / titanio cepillado",
    color: 0x78909c, roughness: .29, metalness: .85 });
  // Shared light volume: narrow at the emitter, wide at the floating glass.
  // Reusing this geometry lets the normal city batching combine every projector.
  const projectionGeo = new THREE.BufferGeometry();
  projectionGeo.setAttribute("position", new THREE.Float32BufferAttribute([
    -.12, -.5, 0, .12, -.5, 0, .5, .5, .24, -.5, .5, .24,
  ], 3));
  projectionGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  projectionGeo.setIndex([0, 1, 2, 0, 2, 3]); projectionGeo.computeVertexNormals();
  const orientation = side => side === "east" ? Math.PI / 2 : side === "west" ? -Math.PI / 2 : side === "north" ? Math.PI : 0;
  const sign = (label, x, y, z, width, side = "south", accent = "#8bd9ed", billboard = false, textureScale = 2) => {
    const height = width / (billboard ? 2 : 4), angle = orientation(side);
    const warm = new THREE.Color(accent).r > .7 && new THREE.Color(accent).b < .8;
    const colorMaterial = warm ? mats.warm : mats.cyan;
    const ribbonNormal = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const at = (u, v, depth) => [x + Math.cos(angle) * u + Math.sin(angle) * depth, y + v, z - Math.sin(angle) * u + Math.cos(angle) * depth];
    const panelPart = (u, v, depth, w, h, d, material) => {
      const [px, py, pz] = at(u, v, depth), mesh = addBox(w, h, d, px, py, pz, material, false); mesh.rotation.y = angle; return mesh;
    };
    // The physical support is below the image: open sides and a visible gap
    // make this read as a projected surface, not an ordinary framed poster.
    const baseY = -height * .76, baseWidth = width * .46, thickness = Math.min(.18, height * .12);
    panelPart(0, baseY, .1, baseWidth, thickness, .42, mats.dark);
    panelPart(0, baseY - thickness * .6, .13, baseWidth * .8, thickness * .32, .34, holoMetal);
    panelPart(0, baseY + thickness * .5, .2, baseWidth * .72, .028, .18, colorMaterial);
    for (const u of [-1, 1]) {
      panelPart(u * baseWidth * .43, baseY, .16, Math.max(.055, width * .014), thickness * 1.15, .47, holoMetal);
      panelPart(u * width * .17, baseY + thickness * .72, .21, width * .055, .028, .09, colorMaterial);
    }
    const beam = part(projectionGeo, lighting.projectionMaterial(warm), ...at(0, -height * .2, .14), width * .96, height * 1.08, 1, false);
    beam.rotation.y = angle; beam.name = "Proyeccion / " + label;
    const material = lighting.screenMaterial(citySignTexture(label, accent, billboard ? "billboard" : "sign", textureScale), { accent, phase: signs.length * .61 });
    const mesh = part(plane, material, ...at(0, 0, .44), width, height, 1, false);
    mesh.name = "Holograma urbano / " + label;
    mesh.rotation.y = angle; mesh.userData.cityKeep = true; signs.push(mesh);
    // Segmented light brackets at two different depths give the display a
    // volumetric silhouette. Every circuit is merged into shared LED draws.
    const edge = Math.min(.22, height * .14), radius = Math.min(.036, height * .018);
    for (const u of [-1, 1]) {
      lighting.strip(root, cityLightPath([
        at(u * width * .2, height / 2 + edge, .40), at(u * (width / 2 - edge), height / 2 + edge, .40),
        at(u * (width / 2 + edge), height / 2 - edge, .40), at(u * (width / 2 + edge), height * .10, .40),
      ]), { radius, style: warm ? "amber" : "ice", phase: x + y, segments: 9, halo: true, ribbonNormal });
      lighting.strip(root, cityLightPath([
        at(u * (width / 2 + edge), -height * .16, .49), at(u * (width / 2 + edge), -height / 2 + edge, .49),
        at(u * (width / 2 - edge), -height / 2 - edge, .49), at(u * width * .28, -height / 2 - edge, .49),
      ]), { radius: radius * .8, style: warm ? "amber" : "ice", phase: y + u, segments: 9, halo: true, ribbonNormal });
      panelPart(u * (width / 2 + edge * 1.2), height * .16, .38, .05, height * .23, .10, holoMetal);
      for (let i = 0; i < 3; i++) panelPart(u * (width / 2 + edge * 1.2), -height * .03 - i * height * .06,
        .49, .06, height * .025, .06, colorMaterial);
    }
    return mesh;
  };

  // The broad avenue is a single PBR road surface. Raised walks stop at crossings.
  ground(156, 158, 0, 0, -.055, mats.sidewalk);
  const road = ground(61, 158, 0, 0, -.025, mats.asphalt); road.name = "9 de Julio / calzadas y asfalto PBR";
  const corrientesMat = mats.asphalt.clone();
  for (const name of ["map", "bumpMap", "roughnessMap"]) { corrientesMat[name] = mats.asphalt[name].clone(); corrientesMat[name].repeat.set(26, 2.34); }
  ground(156, 14, 0, -34, -.018, corrientesMat);
  for (const side of [-1, 1]) {
    for (const [z, depth] of [[-60, 38], [26, 106]]) {
      // The top uses the same world-scale tiled ground, so slab sizes stay consistent.
      addBox(8, .14, depth, side * 34.6, -.05, z, mats.curb);
      const paving = mats.sidewalk.clone();
      for (const name of ["map", "bumpMap", "roughnessMap"]) {
        paving[name] = mats.sidewalk[name].clone(); paving[name].repeat.set(8 / 6, depth / 6);
      }
      ground(8, depth, side * 34.6, z, .023, paving);
      addBox(.2, .2, depth, side * 30.55, -.01, z, mats.curb);
    }
    for (const [z, depth] of [[-60, 35], [25, 102]]) {
      ground(.13, depth, side * 14.3, z, -.011, mats.line);
      ground(.16, depth, side * 28.1, z, -.01, mats.yellow);
    }
    for (let z = -70; z < 72; z += 9) {
      if (z > -43 && z < -24) continue;
      for (const x of [7.15, 21.3]) {
        if (x === 7.15 && z > -46 && z < 55) continue;
        ground(.15, 3.5, side * x, z, -.008, mats.line);
      }
    }
  }
  for (const z of [21, -25]) for (let x = -29; x < 30; x += 2.7)
    ground(1.25, 4.2, x, z, -.004, mats.line);
  for (const x of [-40, 40]) for (let z = -40; z < -27; z += 2)
    ground(4.5, 1, x, z, -.003, mats.line);
  // Lane arrows and storm-water grates anchor the material scale near the player.
  const arrowShape = new THREE.Shape(); arrowShape.moveTo(-.15, -1.2); arrowShape.lineTo(.15, -1.2);
  arrowShape.lineTo(.15, .4); arrowShape.lineTo(.6, .4); arrowShape.lineTo(0, 1.2); arrowShape.lineTo(-.6, .4); arrowShape.lineTo(-.15, .4); arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  for (const x of [-10.7, 10.7, -24.8, 24.8]) for (const z of [43, -49]) {
    // The southern inner lanes are now occupied by the curved garden island.
    if (z === 43 && Math.abs(x) < 15) continue;
    const arrow = part(arrowGeo, mats.line, x, -.004, z, 1, 1.5, 1, false); arrow.rotation.set(-Math.PI / 2, 0, x > 0 ? Math.PI : 0);
  }
  for (const x of [-29.7, 29.7]) for (const z of [-48, -12, 18, 48]) {
    ground(.7, 1.4, x, z, -.002, mats.dark);
    for (let i = 0; i < 7; i++) ground(.64, .035, x, z - .58 + i * .19, 0, mats.trim);
  }
  // Planted median islands, leaving the spawn and the marked crossings clear.
  for (const [z, depth] of [[64, 12], [-60, 21]]) {
    addBox(4.7, .13, depth, 0, .01, z, mats.curb);
    ground(4.25, depth - .5, 0, z, .083, mats.grass);
  }
  for (const z of [-68, -53, 62]) {
    colliders.push(part(cylinder, mats.bark, 0, 1.4, z, .15, 2.8, .15));
    for (const [dx, dy, dz, s] of [[0, 3.6, 0, 1.65], [-.7, 3, .3, 1.05], [.6, 3.2, -.2, 1.2]])
      part(foliage, mats.leaves, dx, dy, z + dz, s, s * .9, s);
  }

  // Obelisco: tapered square shaft, stone courses, four apertures and pyramid crown.
  const monumentScale = OBELISK.widthScale;
  ground(24, 24, 0, OBELISK.z, .035, mats.plaza);
  addBox(7.3 * monumentScale, .34, 7.3 * monumentScale, 0, .17, OBELISK.z, mats.curb);
  const shaftGeo = new THREE.CylinderGeometry(2.55 * monumentScale, 4.525 * monumentScale, 59.8, 4, 1);
  const shaft = part(shaftGeo, mats.stone, 0, 30.4, OBELISK.z); shaft.rotation.y = Math.PI / 4; shaft.name = "Obelisco / piedra de cuatro caras";
  const crownGeo = new THREE.ConeGeometry(2.55 * monumentScale, 7.2, 4);
  const crown = part(crownGeo, mats.stone, 0, 63.9, OBELISK.z); crown.rotation.y = Math.PI / 4;
  colliders.push(shaft, crown);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const opening = addBox(.58 * monumentScale, 1.2, .035, Math.sin(a) * 1.86 * monumentScale, 58.8, OBELISK.z + Math.cos(a) * 1.86 * monumentScale, mats.dark, false); opening.rotation.y = a;
    const rim = addBox(.72 * monumentScale, .075, .11, Math.sin(a) * 1.91 * monumentScale, 58.14, OBELISK.z + Math.cos(a) * 1.91 * monumentScale, mats.trim); rim.rotation.y = a;
    const uplight = addBox(.55, .12, .32, Math.sin(a) * 11.4, .12, OBELISK.z + Math.cos(a) * 11.4, mats.dark); uplight.rotation.y = a;
    const lens = addBox(.43, .025, .2, Math.sin(a) * 11.4, .195, OBELISK.z + Math.cos(a) * 11.4, mats.warm, false); lens.rotation.y = a;
  }
  sign("BUENOS AIRES", 0, 1.4, OBELISK.z + 3.22 * monumentScale, 2.8, "south", "#e1cda4");
  // A thin violet anomaly pulse stays at ground level, below the civic lighting.
  const anomalyMaterial = glowMaterial(0x9672ce, .14);
  ground(24, 24, 0, OBELISK.z, .045, anomalyMaterial);
  const monumentLights = [];
  for (const [x, z, color, intensity] of [[-11.8, 5, 0x8ed7ff, 2000], [11.8, 5, 0xffd79b, 2400]]) {
    const light = new THREE.SpotLight(color, intensity, 100, .35, .8, 1.35);
    light.position.set(x, .65, OBELISK.z + z); light.target.position.set(0, 32, OBELISK.z);
    root.add(light, light.target); monumentLights.push(light);
  }

  // Architectural LED channels follow the four stone arrises up to the crown.
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    lighting.strip(root, cityLightPath([[x * 3.25 * monumentScale, .55, OBELISK.z + z * 3.25 * monumentScale],
      [x * 1.85 * monumentScale, 60.3, OBELISK.z + z * 1.85 * monumentScale], [0, 67.53, OBELISK.z]]),
      { radius: .09, style: "monument", phase: (x + z) * 6, halo: true, segments: 70 });
  }
  for (const [size, y] of [[3.65 * monumentScale, .36], [3.25 * monumentScale, .6]]) {
    lighting.strip(root, cityLightPath([[-size, y, OBELISK.z - size], [size, y, OBELISK.z - size],
      [size, y, OBELISK.z + size], [-size, y, OBELISK.z + size], [-size, y, OBELISK.z - size]]),
      { radius: .055, style: "monument", halo: true, segments: 40 });
  }
  const forceField = addObeliskForceField(root, { lighting, glowMap });
  colliders.push(forceField.surface);
  addBuenosAiresGarden(root, { colliders, glowMap, lighting });

  // Varied cornices, shopfronts, window reveals, balconies and roof equipment.
  const facadeSurface = citySurface("facade", 2, 4);
  const facades = [0x9b9385, 0x59758a, 0x3e586b, 0xa7947c].map(color => new THREE.MeshStandardMaterial({ ...facadeSurface, color, roughness: .84 }));
  for (const [i, b] of BUENOS_AIRES_BUILDINGS.entries()) {
    const classic = b.style === "classic" || b.style === "theatre";
    const mat = facades[classic ? i % 2 ? 3 : 0 : b.style === "modern" ? 1 : 2];
    const body = addBox(b.hx * 2, b.height, b.hz * 2, b.x, b.height / 2, b.z, mat); colliders.push(body);
    addBox(b.hx * 2 + .65, .45, b.hz * 2 + .65, b.x, b.height, b.z, mats.curb);
    addBox(b.hx * 1.2, 2.1, b.hz * .85, b.x, b.height + 1, b.z, mats.dark);
    // Local façade coordinates: u along a wall, v along its outward normal.
    const face = (axis, direction) => {
      const length = axis === "x" ? b.hz * 2 : b.hx * 2;
      const normal = axis === "x" ? b.hx : b.hz;
      const facePart = (u, y, v, width, height, depth, material, cast = false) => axis === "x"
        ? addBox(depth, height, width, b.x + direction * (normal + v), y, b.z + u, material, cast)
        : addBox(width, height, depth, b.x + u, y, b.z + direction * (normal + v), material, cast);
      const floors = Math.floor((b.height - 4.5) / 3.2), cols = Math.floor((length - 1.4) / 2.7);
      for (let f = 0; f < floors; f++) for (let col = 0; col < cols; col++) {
        const u = -length / 2 + 1.65 + col * ((length - 3.3) / Math.max(1, cols - 1)), y = 5.6 + f * 3.2;
        facePart(u, y, .035, 1.6, 2.12, .1, mats.dark);
        const lit = (f * 13 + col * 7 + i * 3 + (axis === "x" ? 0 : 2)) % 9;
        facePart(u, y, .095, 1.27, 1.85, .035, lit < 3 ? mats.windowWarm : lit < 5 ? mats.windowCool : mats.glass);
        facePart(u, y, .12, .045, 1.85, .025, mats.dark);
        if (classic) facePart(u, y - 1.14, .17, 1.85, .12, .38, mats.curb);
      }
      for (let y = 3.6; y < b.height; y += classic ? 6.4 : 9.6)
        facePart(0, y, .1, length + .28, classic ? .24 : .1, .32, classic ? mats.curb : mats.dark, true);
      for (const u of [-length * .28, length * .28]) {
        facePart(u, 1.6, .04, 3.4, 2.8, .13, mats.dark);
        facePart(u, 1.65, .13, 3, 2.4, .045, mats.glass);
        facePart(u, 1.65, .18, .06, 2.4, .03, mats.trim);
        facePart(u, 2.9, .2, 3.1, .055, .06, mats.warm);
      }
      if (!classic) facePart(0, b.height - .8, .13, length - .5, .07, .1, mats.cyan);
    };
    face("x", b.x < 0 ? 1 : -1); face("z", 1); face("z", -1);
    const direction = b.x < 0 ? 1 : -1, faceX = b.x + direction * b.hx;
    const side = direction > 0 ? "east" : "west";
    sign(b.name, faceX + direction * .25, 3.8, b.z, Math.min(9.1, b.hz * 1.3), side, classic ? "#f4c48e" : "#7ed8ef");
    if (classic) {
      for (const y of [8.7, 15.1]) for (const offset of [-b.hz * .5, b.hz * .5]) {
        addBox(1, .14, 2.7, faceX + direction * .45, y, b.z + offset, mats.curb);
        addBox(.045, .06, 2.7, faceX + direction * .95, y + .8, b.z + offset, mats.dark);
        for (let j = -1.2; j <= 1.2; j += .4) addBox(.035, .75, .035, faceX + direction * .95, y + .4, b.z + offset + j, mats.dark, false);
      }
      addBox(1.8, .19, 7.7, faceX + direction * .8, 3.15, b.z, mats.trim);
      ground(6, 12, faceX + direction * 2.3, b.z, .035, warmPool);
    }
    if (b.style === "future") {
      for (const offset of [-b.hz + .5, b.hz - .5])
        addBox(.08, b.height - 5, .1, faceX + direction * .16, (b.height + 3) / 2, b.z + offset, mats.cyan, false);
    }
    if (b.style === "theatre") {
      sign(b.name, b.x, 5.2, b.z + b.hz + .15, 12, "south", "#ffd394");
      addBox(13, .09, .08, b.x, 6.9, b.z + b.hz + .2, mats.warm, false);
      addBox(13, .09, .08, b.x, 3.5, b.z + b.hz + .2, mats.warm, false);
      addBox(13.2, .28, 2.6, b.x, 3.35, b.z + b.hz + .8, mats.dark);
      for (let n = -6; n <= 6; n += .8) addBox(.13, .1, .13, b.x + n, 3.2, b.z + b.hz + 2, mats.warm, false);
      sign("ESTRENO / 2049", b.x, 8.8, b.z + b.hz + .16, 7.6, "south", "#ffd394");
    }
    ground(b.hx * 2 + 6, b.hz * 2 + 6, b.x, b.z, -.002, shadow);
  }
  // Distinctive media walls and vertical parking signs along the cultural axis.
  sign("SEGUÍ CONECTADO", -40.5, 19.2, 23, 13, "east", "#82d9fa", true);
  sign("UNA SOLA RED", 40.5, 22, -6, 14, "west", "#83c3ef", true);
  const signalBillboards = [
    { label: "SEGUÍ MIRANDO", x: -39.97, y: 19.2, z: 23, width: 13, yaw: Math.PI / 2 },
    { label: "OBELISCO / ORIGEN", x: 39.97, y: 22, z: -6, width: 14, yaw: -Math.PI / 2 },
  ].map(({ label, x, y, z, width, yaw }) => {
    const mesh = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({
      map: citySignTexture(label, "#c9a7ff", "billboard"), transparent: true, opacity: .88,
      side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
    }));
    mesh.name = "Visión de frecuencia / " + label;
    mesh.position.set(x, y, z); mesh.rotation.y = yaw; mesh.scale.set(width, width / 2, 1);
    mesh.userData.cityKeep = true; mesh.visible = false; root.add(mesh);
    return mesh;
  });
  sign("LA NOCHE ES TUYA", 49, 15, -42.8, 11, "south", "#fac98d", true);
  sign("AV. CORRIENTES", -49, 15.2, -42.8, 11, "south", "#f2d0a4", true);
  for (const x of [-40.2, 40.2]) {
    sign("E", x, 8.2, 49, 2.8, x < 0 ? "east" : "west", "#8ad8ff", true);
    ground(12, 18, x < 0 ? x + 5 : x - 5, 23, .005, coolPool);
  }

  const codeVision = createStoreInvasionVision(scene);
  const flyingVehicles = addBuenosAiresVehicles(root, { glowMap, colliders, lighting, onEvent, tier, codeVision });
  const groundVehicles = createBuenosAiresGroundVehicles(root, { tier, glowMap, codeVision });

  // Warm bent-arm luminaires; light pools are soft textures, never opaque rectangles.
  const lampCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(.2, .4, 0), new THREE.Vector3(1.25, .65, 0), new THREE.Vector3(2.2, .4, 0)]);
  const armGeo = new THREE.TubeGeometry(lampCurve, 12, .06, 6, false);
  for (const x of [-32.4, 32.4]) for (const z of [-66, -46, -16, 8, 34, 62]) {
    part(cylinder, mats.dark, x, 3.8, z, .09, 7.6, .09);
    part(cylinder, mats.dark, x, .32, z, .2, .64, .2);
    const arm = part(armGeo, mats.dark, x, 7.45, z); if (x > 0) arm.rotation.y = Math.PI;
    const lx = x + (x < 0 ? 2.1 : -2.1);
    addBox(1, .1, .38, lx, 7.82, z, mats.dark);
    addBox(.85, .025, .3, lx, 7.76, z, mats.warm, false);
    const halo = new THREE.Sprite(lampHalo); halo.position.set(lx, 7.73, z); halo.scale.set(1.7, 1.7, 1); root.add(halo); optionalDetails.push(halo);
    ground(13, 17, lx, z, .036, warmPool); lamps.push({ x: lx, y: 7.4, z });
  }
  for (const x of [-31, 31]) for (const z of [-28, 23]) {
    addBox(.13, 4.8, .13, x, 2.4, z, mats.dark);
    addBox(.54, 1.4, .38, x, 4.4, z, mats.dark);
    for (let i = 0; i < 3; i++) {
      const bulb = part(cylinder, i === (x < 0 ? 2 : 0) ? (x < 0 ? mats.cyan : mats.red) : mats.glass, x, 4.85 - i * .44, z + .23, .15, .04, .15, false);
      bulb.rotation.x = Math.PI / 2; bulb.userData.cityKeep = true; trafficLights.push({ bulb, index: i });
    }
  }
  sign("9 DE JULIO", -30.9, 3.8, 31, 3.8, "south");
  sign("CORRIENTES", 30.9, 3.8, -28, 4, "south", "#e6cc9b");
  // Construction closures communicate the playable limits.
  for (const z of [-76, 76]) for (let x = -28; x <= 28; x += 5.5) {
    addBox(4.5, .75, .65, x, .375, z, mats.curb);
    addBox(4.4, .1, .68, x, .69, z, mats.yellow);
    for (const dx of [-1.6, 0, 1.6]) addBox(.6, .11, .7, x + dx, .69, z, mats.dark);
  }
  for (const x of [-76, 76]) for (let z = -66; z <= 66; z += 6) addBox(.6, 1.1, 4.4, x, .55, z, mats.curb);
  sign("OBRAS / DESVÍO", 0, 2.2, 75.8, 5.2, "north", "#e8c77c");
  // A distant city silhouette fills the horizon without adding accessible blocks.
  for (let i = 0; i < 22; i++) {
    const x = (i - 10.5) * 9, h = 16 + (i * 17 % 31), z = -113 - (i % 4) * 9;
    addBox(6.2, h, 8, x, h / 2, z, mats.dark, false);
    for (let y = 5; y < h; y += 3.2) for (let col = -2; col <= 2; col += 1.35)
      addBox(.68, 1.15, .04, x + col, y, z + 4.025, (i + Math.floor(y) + Math.floor(col)) % 3 ? mats.windowCool : mats.windowWarm, false);
  }

  const ambient = scene.children.find(object => object.isHemisphereLight);
  if (ambient) { ambient.color.setHex(0x9cbbd6); ambient.groundColor.setHex(0x333640); ambient.intensity = .6; }
  scene.environmentIntensity = .5;
  // One local shadow map follows the player, preserving detail over this broad avenue.
  const moon = new THREE.DirectionalLight(0xa6c9f3, 1.1); moon.position.set(-15, 25, 15); root.add(moon, moon.target);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 100 });
  moon.shadow.camera.updateProjectionMatrix(); moon.shadow.normalBias = .035; moon.shadow.bias = -.0002; moon.shadow.radius = 2;
  const streetLights = Array.from({ length: 2 }, () => { const light = new THREE.PointLight(0xffcc96, 65, 27, 2); root.add(light); return light; });
  const normalMoonColor = new THREE.Color(0xa6c9f3), anomalyMoonColor = new THREE.Color(0xc7a2f3);
  const normalStreetColor = new THREE.Color(0xffcc96), anomalyStreetColor = new THREE.Color(0xdab2fb);
  const interactions = [
    { id: "ba-obelisk", label: "Obelisco de Buenos Aires", ...OBELISK_APPROACH, reach: 3.8 },
    { id: "ba-corrientes", label: "Avenida Corrientes", x: 0, z: -34, reach: 7 },
  ];
  const transmitters = createBuenosAiresTransmitters(root, { sign, onEvent, forceField, signalBillboards });
  interactions.push(...transmitters.interactions);
  const playerContact = ground(1.8, 1.45, 0, 42, .001, shadow);
  playerContact.name = "NeonBoy / sombra de contacto"; playerContact.userData.cityKeep = true;
  lighting.finalize(root);
  batchCityDetails(root, colliders);
  // Register static batches once. Dynamic managers register each loaded model
  // and LOD acquisition with this same shader, clock and transition uniforms.
  root.traverse(object => {
    if (!object.isMesh || object.userData.invasionVisionPreserve) return;
    const paving = /Baldosas|Losas|Asfalto/.test(object.material?.name || "");
    codeVision.register(object, paving ? "bridge" : "world");
  });
  let fuego = null;
  const actors = createBuenosAiresActors(root, { glowMap, tier, codeVision, canAvoid: (x, z) => groundVehicles.canStand(x, z) && (!fuego || fuego.canStand(x, z)) });
  interactions.push(...actors.interactions, flyingVehicles.escapeInteraction);
  fuego = createBuenosAiresFuegoScene(root, { actors, flyingVehicles, signalBillboards, onEvent });
  interactions.push(...fuego.interactions);
  const vigilante = createBuenosAiresVigilante(root, { onEvent, onDamage, tier, codeVision,
    canOccupy: (x,z) => canStandInBuenosAires(x,z,true) && actors.canStand(x,z) && groundVehicles.canStand(x,z) });
  let vigilanteArrivalSeen = false;
  let flightAttempt = 0;
  let explored = false, currentTier, lightsTick = 1, pedestrianGreen;
  const syncLineTimes = [0, 2.2, 4.25, 5.45], syncDuration = 7.8;
  let syncElapsed = -1, syncLine = -1, syncTriggered = false, fieldOpen = false, trafficWasComplete = null, trafficGlitch = 0;
  const applyQuality = next => {
    if (next === currentTier) return; currentTier = next;
    moon.castShadow = next !== "low";
    const size = next === "medium" ? 512 : 1024;
    if (moon.shadow.mapSize.x !== size) { moon.shadow.map?.dispose(); moon.shadow.map = null; moon.shadow.mapSize.set(size, size); }
    optionalDetails.forEach(object => { object.visible = next !== "low"; });
    flyingVehicles.applyQuality(next);
    groundVehicles.applyQuality(next);
    actors.applyQuality(next);
    transmitters.applyQuality(next); vigilante.applyQuality(next);
  };
  applyQuality(tier);
  return {
    get qualityTier() { return currentTier; },
    setFlightActive(active) { fuego.setFlightState(active); playerContact.visible = !active; },
    triggerFlightAlert() { trafficGlitch = 2.8; fuego.setFlightState(true, true); flyingVehicles.triggerTrafficPulse();
      actors.triggerCollectiveSynchronization({id:"fuego-takeoff-"+(++flightAttempt),player:{x:-6,z:23},radius:35,duration:3}); },
    root, signs, interactions, obstacles: BUENOS_AIRES_OBSTACLES, colliders, applyQuality, flyingVehicles, groundVehicles, actors, forceField, vigilante, fuego,
    getTargets: progress => [...transmitters.getTargets(progress), ...vigilante.getTargets(progress)],
    registerImpact: (target, progress) => target.kind?.startsWith("vigilante") ? vigilante.registerImpact(target,progress) : transmitters.registerImpact(target,progress), flashTransmitters: transmitters.flash,
    pedestrianRoutes: BUENOS_AIRES_PEDESTRIAN_ROUTES,
    canStand: (x, z, fromX = x, fromZ = z) => canStandInBuenosAires(x, z, fieldOpen) &&
      actors.canStand(x, z, fromX, fromZ) && groundVehicles.canStand(x, z, fromX, fromZ) && vigilante.canStand(x,z,fromX,fromZ) && flyingVehicles.canStand(x,z,fromX,fromZ) && fuego.canStand(x,z,fromX,fromZ),
    triggerCollectiveSynchronization: actors.triggerCollectiveSynchronization,
    update(dt, elapsed, progress, player, paused, camera, reducedMotion = false, fallen = false) {
      if (!paused && progress?.coreComplete && !progress?.synchronizationSeen && !syncTriggered && syncElapsed < 0) {
        syncElapsed = 0; syncLine = -1; syncTriggered = true;
        actors.triggerCollectiveSynchronization({ id: "ba-network-reaction", player, radius: 70, duration: syncDuration });
        flyingVehicles.setSynchronization(true);
        onEvent?.("synchronization-start");
      }
      if (!paused && syncElapsed >= 0) {
        syncElapsed += Math.min(Math.max(dt, 0), .1);
        const line = syncLineTimes.reduce((index, time, i) => syncElapsed >= time ? i : index, 0);
        if (line !== syncLine) { syncLine = line; onEvent?.("synchronization-line:" + line); }
        if (syncElapsed >= syncDuration) {
          syncElapsed = -1; flyingVehicles.setSynchronization(false); onEvent?.("synchronization-seen");
        }
      }
      fieldOpen = Boolean(progress?.coreComplete);
      if (trafficWasComplete === false && progress?.trafficComplete) {
        trafficGlitch = 1.4; flyingVehicles.triggerTrafficPulse();
      }
      trafficWasComplete = Boolean(progress?.trafficComplete);
      const trafficGlitchBefore = trafficGlitch;
      if (!paused) trafficGlitch = Math.max(0, trafficGlitch - Math.min(Math.max(dt, 0), .1));
      vigilante.update(dt,progress,player,paused,fallen,reducedMotion);
      vigilante.constrainPlayer(player);
      actors.setCombatArea(vigilante.engaged ? VIGILANTE_ARENA : null);
      if(vigilante.arriving && !vigilanteArrivalSeen){
        vigilanteArrivalSeen=true;
        actors.triggerCollectiveSynchronization({id:"ba-vigilante-arrival",player,radius:70,duration:5});
      }
      const alert = syncElapsed >= 0 || vigilante.arriving;
      flyingVehicles.setSynchronization(alert);
      flyingVehicles.prepareEscape(progress?.vigilanteDefeated);
      transmitters.update(paused || reducedMotion ? 0 : dt, elapsed, progress, alert, player);
      if(vigilante.arriving){
        forceField.root.visible=forceField.surface.visible=true;
        forceField.surface.material.uniforms.uStrength.value=.2+.16*Math.sin(vigilante.effectTime*3)**2;
      }
      codeVision.update(paused ? 0 : Math.min(Math.max(dt, 0), .05), Boolean(progress?.visionActive), player, reducedMotion);
      const lightBlend = Math.min(1, (paused ? 0 : Math.max(0, dt)) * 1.7);
      moon.color.lerp(syncElapsed >= 0 ? anomalyMoonColor : normalMoonColor, lightBlend);
      moon.intensity = THREE.MathUtils.lerp(moon.intensity, syncElapsed >= 0 ? 1.24 : 1.1, lightBlend);
      for (const light of streetLights) light.color.lerp(syncElapsed >= 0 ? anomalyStreetColor : normalStreetColor, lightBlend);
      lighting.update(dt, paused);
      flyingVehicles.update(dt, player, camera, progress, paused);
      groundVehicles.update(dt, player, paused, actors.actors);
      fuego.update(dt, progress, player, paused);
      const actorEvent = actors.update(dt, player, progress, paused, camera);
      if (actorEvent) onEvent?.(actorEvent);
      if (pedestrianGreen !== actors.pedestrianGreen || trafficGlitchBefore > 0) {
        pedestrianGreen = actors.pedestrianGreen;
        for (const { bulb, index } of trafficLights)
          bulb.material = trafficGlitch > 0 && Math.sin(elapsed * 4.5 + index) > .55
            ? mats.cyan : index === (pedestrianGreen ? 0 : 2) ? (pedestrianGreen ? mats.red : mats.cyan) : mats.glass;
      }
      if (!paused && !progress?.obeliskExplored && !explored && Math.max(Math.abs(player.x - OBELISK.x), Math.abs(player.z - OBELISK.z)) < OBELISK_FIELD.halfExtent + 3) {
        explored = true; onEvent?.("obelisk-explored");
      }
      if (progress?.obeliskExplored) explored = true;
      // Snap the light origin to reduce shadow shimmer while moving.
      playerContact.position.set(player.x, .001, player.z);
      const px = Math.round(player.x * 8) / 8, pz = Math.round(player.z * 8) / 8;
      moon.position.set(px - 15, 28, pz + 18); moon.target.position.set(px, 0, pz - 2);
      lightsTick += dt;
      if (lightsTick > .5) {
        lightsTick = 0;
        const nearest = lamps.map(lamp => ({ ...lamp, d: (lamp.x - player.x) ** 2 + (lamp.z - player.z) ** 2 })).sort((a, b) => a.d - b.d);
        streetLights.forEach((light, i) => light.position.set(nearest[i].x, nearest[i].y, nearest[i].z));
      }
      anomalyMaterial.opacity = syncElapsed >= 0 ? .42 : progress?.visionActive ? .27 : .14;
      for (const mesh of signalBillboards) mesh.visible = Boolean(progress?.visionActive && progress?.citizens?.length >= 3);
    },
    dispose() { fuego.dispose(); vigilante.dispose(); codeVision.dispose(); transmitters.dispose(); actors.dispose(); flyingVehicles.dispose(); groundVehicles.dispose(); moon.shadow.map?.dispose(); root.removeFromParent(); disposeObjects([root]); lampHalo.dispose(); glowMap.dispose(); },
  };
}

