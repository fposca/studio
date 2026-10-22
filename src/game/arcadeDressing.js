import * as THREE from "three";
import { arcadeCanvas, arcadePoster, arcadeWallMaterial, arcadeGlowTexture } from "./arcadeVisuals.js";

// Room-only details share the existing geometry/material pool and scene cleanup.
export function dressArcadeRoom(scene, { box, cylinder, sign, materials }) {
  const fixtures = [];
  const brick = arcadeWallMaterial(true);
  const warmTube = new THREE.MeshStandardMaterial({ color: 0xece0cc, emissive: 0xffd8ab, emissiveIntensity: 1.4, roughness: .4 });
  const coldTube = new THREE.MeshStandardMaterial({ color: 0xb9cdd9, emissive: 0xaccfe8, emissiveIntensity: 1.4, roughness: .4 });
  const defective = coldTube.clone();
  const grille = new THREE.MeshStandardMaterial({ color: 0x30313a, metalness: .7, roughness: .55 });
  for (const x of [-10.74, 10.74]) {
    const side = Math.sign(x);
    box(scene, "exposed brick dado", .045, 1.28, 30.7, x, .68, -6.2, brick);
    box(scene, "rubber bumper rail", .10, .10, 30.7, x - side * .06, 1.36, -6.2, materials.black);
    for (const z of [5, -2, -9, -16]) {
      box(scene, "steel wall pilaster", .18, 4.3, .19, x - side * .09, 2.2, z, materials.trim);
      box(scene, "wall conduit", .045, 2.7, .045, x - side * .20, 2.5, z + .28, materials.steel);
      box(scene, "junction box", .11, .23, .19, x - side * .23, 1.75, z + .28, grille);
    }
    for (let i = 0; i < 6; i++) {
      const panel = new THREE.Group(); panel.position.set(x - side * .14, 2.53, 4 - i * 4.55); panel.rotation.y = -side * Math.PI / 2;
      scene.add(panel);
      const titles = side < 0 ? ["PIXEL SPRINT", "ORBIT DUEL", "TORNEO 1999", "LUNA ELECTRICA", "ULTIMA FICHA", "SE BUSCA RECORD"]
        : ["BARRIO BRAWL", "JUNGLE PULSE", "RALLY FANTASMA", "SECTOR 7", "MEDIANOCHE 13", "NO DESENCHUFAR"];
      const themes = ["racing", "space", "fighting", "pinball", "horror", "shooter"];
      box(panel, "poster backing", 1.15, 1.52, .04, 0, 0, 0, materials.black);
      const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.44), new THREE.MeshStandardMaterial({ map: arcadePoster(titles[i], i === 2 ? "SABADO / GRAN FINAL" : "UNA FICHA MAS", themes[i]), roughness: .85 }));
      poster.position.z = .024; poster.rotation.z = (i % 3 - 1) * .025; panel.add(poster);
      for (const corner of [-1, 1]) box(panel, "poster tape", .15, .06, .008, corner * .49, .66, .031, materials.warm);
    }
    // Thin tube runs rather than a continuous modern LED strip.
    for (const [i, z] of [3, -3.5, -10].entries()) {
      const neon = i % 2 ? materials.pink : side < 0 ? materials.blue : materials.red;
      box(scene, "wall neon housing", .10, .15, 4.8, x - side * .10, 3.57, z, materials.black);
      box(scene, "wall neon tube", .055, .035, 4.45, x - side * .17, 3.57, z, neon);
    }
  }
  // Ceiling trusses, duct seams and cable trays give depth without more lights.
  for (const z of [5, -.7, -6.4, -12.1, -17.8]) {
    box(scene, "ceiling cross member", 21.4, .14, .12, 0, 4.47, z, materials.black);
    for (const x of [-6.8, 2.4, 6.8]) {
      const tube = z === -12.1 && x === 2.4 ? defective : x < 0 ? warmTube : coldTube;
      const group = new THREE.Group(); group.position.set(x, 4.25, z); scene.add(group);
      box(group, "fluorescent reflector", 1.72, .12, .43, 0, 0, 0, materials.steel);
      for (const offset of [-.13, .13]) {
        box(group, "fluorescent tube", 1.51, .045, .055, 0, -.077, offset, tube);
        for (const end of [-.77, .77]) box(group, "tube endcap", .06, .08, .08, end, -.056, offset, materials.black);
      }
      for (const x2 of [-.62, .62]) box(group, "ceiling suspension", .028, .34, .028, x2, .21, 0, materials.steel);
      if (tube === defective) fixtures.push(tube);
    }
  }
  for (const x of [-9.6, 9.6]) {
    box(scene, "galvanized ventilation duct", .52, .35, 29.8, x, 4.39, -6, grille);
    for (let i = 0; i < 14; i++) {
      box(scene, "duct seam", .56, .38, .035, x, 4.39, 7 - i * 2.1, materials.steel);
      if (i % 3 === 1) {
        box(scene, "vent housing", .70, .05, .81, x, 4.18, 7 - i * 2.1, materials.black);
        for (let j = 0; j < 7; j++) box(scene, "vent slat", .62, .025, .027, x, 4.145, 6.70 - i * 2.1 + j * .10, grille);
      }
    }
  }
  for (const x of [-1.1, -.98, -.86]) {
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 4.53, 8), new THREE.Vector3(x - .15, 4.13, 0), new THREE.Vector3(x + .1, 4.38, -10), new THREE.Vector3(x, 4.05, -21),
    ]), 24, .018, 4, false), materials.black);
    scene.add(cable);
  }
  // Hanging zone labels, kept well above the camera/player corridor.
  for (const [x, z, title, subtitle, color] of [
    [-6.2, -8.2, "ZONA DE CARRERAS", "RALLY FANTASMA / VOLANTES", "#efb17a"],
    [-6.5, -12.6, "PINBALL", "LUNA ELECTRICA / MULTIBALL", "#9ed3d8"],
    [6.2, -8.2, "DOS JUGADORES", "DESAFIA AL CAMPEON", "#f48cab"],
  ]) {
    // Original signage only; no licensed videogame artwork.
    const titleText = title;
    box(scene, "hanging sign enclosure", 3.0, .48, .10, x, 3.65, z, materials.black);
    sign(scene, "hanging zone sign", titleText, subtitle, 2.9, .40, x, 3.65, z + .056, color);
    for (const dx of [-1.18, 1.18]) box(scene, "sign chain", .018, .52, .018, x + dx, 4.08, z, materials.steel);
  }
  // Dark rear service corner, breaker panel and faded paint; the door stays accessible.
  box(scene, "rear stained brick", 21.7, 1.35, .05, 0, .71, -21.69, brick);
  const rearStain = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 4.6), new THREE.MeshBasicMaterial({ map: arcadeGlowTexture(), color: 0x03020b, transparent: true, opacity: .9, depthWrite: false }));
  rearStain.position.set(0, 2.3, -21.63); scene.add(rearStain);
  box(scene, "rear fuse cabinet", .63, 1.1, .17, -4.1, 1.65, -21.45, grille);
  for (let i = 0; i < 6; i++) box(scene, "fuse cabinet vents", .46, .023, .025, -4.1, 1.68 + i * .085, -21.35, materials.black);
  box(scene, "rear electric conduit", .07, 2.0, .07, -4.1, 3.0, -21.48, materials.steel);
  sign(scene, "rear warning", "ALTA TENSION", "NO ABRIR", .52, .23, -4.1, 1.39, -21.35, "#d8b568");
  sign(scene, "rear faded notice", "NO GOLPEAR", "LAS MAQUINAS", 1.2, .50, 3.5, 2.35, -21.61, "#b59a89");
  // The same entry wall faces inward (towards -Z).
  const clockFace = arcadeCanvas(256, 256, (ctx) => {
    ctx.fillStyle = "#dfd2b2"; ctx.fillRect(0, 0, 256, 256); ctx.strokeStyle = "#25242e";
    ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(128, 128, 113, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#282330"; ctx.font = "700 23px Arial"; ctx.textAlign = "center";
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; ctx.fillText(String(i), 128 + Math.sin(a) * 90, 136 - Math.cos(a) * 90); }
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(78, 97); ctx.moveTo(128, 128); ctx.lineTo(128, 49); ctx.stroke();
    ctx.fillStyle = "#b95454"; ctx.beginPath(); ctx.arc(128, 128, 6, 0, Math.PI * 2); ctx.fill();
  }).texture;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.40, 32), new THREE.MeshStandardMaterial({ map: clockFace, roughness: .55 }));
  clock.position.set(-9.4, 3.1, 9.04); clock.rotation.y = Math.PI; scene.add(clock);
  return { update(time, altered, reducedMotion) {
    const failing = altered && !reducedMotion && time % 17 > 15.6 && Math.sin(time * 29) > .3;
    defective.emissiveIntensity = failing ? .08 : 1.4;
    return failing;
  } };
}

export function decorateArcadeCounter(anchor, { box, cylinder, sign, materials }) {
  const clear = new THREE.MeshPhysicalMaterial({ color: 0xbfded8, transparent: true, opacity: .17, roughness: .18, metalness: .1, depthWrite: false });
  // Acrylic token display, with a wood base and visible piles.
  box(anchor, "counter display plinth", .95, .06, .51, .23, 1.16, -.20, materials.trim);
  box(anchor, "counter display glass", .94, .33, .50, .23, 1.35, -.20, clear);
  for (let i = 0; i < 12; i++) cylinder(anchor, "display token stack", .052, .025 + (i % 4) * .025, -.10 + (i % 4) * .19, 1.23, -.33 + Math.floor(i / 4) * .13, [materials.tokenBlue, materials.brass, materials.tokenPink][i % 3]);
  box(anchor, "register customer display", .45, .17, .13, -.95, 1.72, -.25, materials.black);
  sign(anchor, "register digits", "0000", "FICHAS", .38, .13, -.95, 1.72, -.177, "#91d7b3");
  box(anchor, "register receipt", .12, .008, .30, -.68, 1.54, .17, materials.paper);
  for (let i = 0; i < 5; i++) box(anchor, "receipt print", .08, .004, .008, -.68, 1.545, .10 + i * .035, materials.trim);
  // Cups and a compact late-90s radio/cassette behind the change tray.
  for (const x of [1.35, 1.12]) {
    cylinder(anchor, "paper cup", .065, .17, x, 1.20, .32, materials.paper);
    cylinder(anchor, "cup contents", .055, .008, x, 1.29, .32, materials.wood);
  }
  box(anchor, "cassette radio", .58, .29, .18, 1.2, 1.31, -.35, materials.black);
  box(anchor, "cassette window", .23, .13, .012, 1.2, 1.31, -.25, materials.glass);
  for (const x of [1.00, 1.40]) for (let i = 0; i < 4; i++) box(anchor, "radio speaker slat", .08, .015, .015, x, 1.23 + i * .04, -.25, materials.steel);
  box(anchor, "price card support", .035, .37, .035, -.1, 1.33, .43, materials.steel);
  sign(anchor, "price card", "FICHAS", "PRECIO EN CAJA / PEDI TU PROMO", .94, .28, -.1, 1.59, .46, "#e7c087");
}
