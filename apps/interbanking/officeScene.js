import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { createOfficeMaterials, createCityTexture } from "./officeMaterials.js";
import { createOfficeGeometry } from "./officeGeometry.js";

import { DEMO_COMPANY } from "./branding/brand.js";

function wallSignTexture({ safety = false } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = safety ? "#f7fafc" : "#14283c";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = safety ? "#c93232" : "#67c8f6";
  ctx.fillRect(36, 38, 12, 436);
  if (safety) {
    ctx.fillStyle = "#18354b";
    ctx.font = "bold 43px Arial, sans-serif";
    ctx.fillText("SEGURIDAD", 84, 116);
    ctx.fillStyle = "#c93232";
    ctx.font = "bold 74px Arial, sans-serif";
    ctx.fillText("MATAFUEGOS", 84, 225);
    ctx.fillStyle = "#314d61";
    ctx.font = "35px Arial, sans-serif";
    ctx.fillText("Ante una emergencia, avis\u00e1 a Seguridad.", 84, 321);
    ctx.fillText("Segu\u00ed las indicaciones de evacuaci\u00f3n.", 84, 371);
  } else {
    ctx.strokeStyle = "#80d8ff"; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.arc(160, 250, 98, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#9cdefb";
    ctx.font = "bold 148px Arial, sans-serif";
    ctx.fillText("N", 106, 304);
    ctx.fillStyle = "#f4faff";
    ctx.font = "bold 112px Arial, sans-serif";
    ctx.fillText(DEMO_COMPANY.name, 300, 261);
    ctx.fillStyle = "#a9d6ed";
    ctx.font = "33px Arial, sans-serif";
    ctx.fillText("CORPORATE EXPERIENCE", 306, 327);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function buildOffice(scene) {
  const world = new THREE.Group();
  world.name = `Oficina ${DEMO_COMPANY.name}`;
  scene.add(world);
  const colors = createOfficeMaterials();
  const h = createOfficeGeometry(world, colors);
  const { box, cylinder, mesh, cached, shadow, tube } = h;

  scene.background = new THREE.Color(0xc4d0d5);
  scene.fog = new THREE.Fog(0xd5dadd, 42, 90);
  scene.add(new THREE.HemisphereLight(0xdceaf5, 0x62594d, .52));
  const daylight = new THREE.DirectionalLight(0xfff4df, 2.3);
  daylight.position.set(-8, 8, -16);
  daylight.target.position.set(2, 0, 2);
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(2048, 2048);
  daylight.shadow.camera.left = -20; daylight.shadow.camera.right = 20;
  daylight.shadow.camera.top = 20; daylight.shadow.camera.bottom = -20;
  daylight.shadow.camera.near = .5; daylight.shadow.camera.far = 65;
  daylight.shadow.normalBias = .012; daylight.shadow.bias = -.0001;
  daylight.shadow.radius = 3;
  scene.add(daylight, daylight.target);
  RectAreaLightUniformsLib.init();
  for (const z of [-8.5, .3, 8]) {
    const ceilingLight = new THREE.RectAreaLight(0xfff7e9, 2.4, 17, 2.2);
    ceilingLight.position.set(0, 3.25, z); ceilingLight.lookAt(0, 0, z);
    scene.add(ceilingLight);
  }
  const windowLight = new THREE.RectAreaLight(0xd1e4f2, 1.8, 22, 2.3);
  windowLight.position.set(0, 1.85, -13.85); windowLight.lookAt(0, 1.4, 0);
  scene.add(windowLight);

  const carpet = mesh(world, new THREE.PlaneGeometry(26, 29), colors.carpet, 0, .008, -1, false);
  carpet.rotation.x = -Math.PI / 2;
  box(world, 0, -.1, -1, 26, .18, 29, colors.black);
  box(world, 0, 3.43, -1, 26, .15, 29, colors.ceiling);
  for (let x = -12.8; x <= 12.8; x += 1.7) box(world, x, 3.345, -1, .015, .012, 29, colors.trim);
  for (let z = -15.3; z <= 13.3; z += 1.7) box(world, 0, 3.345, z, 26, .012, .015, colors.trim);
  for (const x of [-10, -5, 0, 5, 10]) for (const z of [-11.85, -6.75, -1.65, 3.45, 8.55]) {
    box(world, x, 3.324, z, 1.48, .03, .72, colors.trim);
    box(world, x, 3.305, z, 1.40, .018, .64, colors.lamp);
  }
  // Slim ventilation grilles, recessed into the suspended ceiling.
  for (const x of [-7.5, 7.5]) for (const z of [-4.2, 6]) {
    box(world, x, 3.322, z, .66, .022, .36, colors.frame);
    for (let i = -4; i <= 4; i++) box(world, x, 3.308, z + i * .033, .59, .009, .012, colors.black);
  }
  for (const z of [-9, 4]) cylinder(world, 1.65, 3.30, z, .07, .06, .045, colors.frame);

  box(world, 0, 1.68, 13.24, 26, 3.36, .22, colors.wall);
  box(world, 12.95, 1.68, -1, .2, 3.36, 28.5, colors.wall);
  box(world, -12.95, 1.68, -1, .2, 3.36, 28.5, colors.wall);
  for (const x of [-12.81, 12.81]) box(world, x, .055, -1, .045, .11, 28.3, colors.trim);
  box(world, 0, .055, 13.10, 25.8, .11, .045, colors.trim);
  box(world, 0, .23, -14.16, 26, .46, .16, colors.wall);
  box(world, 0, 3.14, -14.16, 26, .42, .16, colors.wall);
  box(world, 0, 1.83, -14.13, 4.3, 2.42, .19, colors.wall);
  box(world, 0, .49, -13.99, 25.8, .09, .25, colors.cabinet);
  const skyline = mesh(world, new THREE.PlaneGeometry(28, 9),
    new THREE.MeshBasicMaterial({ map: createCityTexture(), toneMapped: false }), 0, 2.35, -16.4, false);
  skyline.receiveShadow = false;
  for (const x of [-10.35, -7.25, -4.15, 4.15, 7.25, 10.35]) {
    box(world, x, 1.8, -14.07, 3.08, 2.46, .018, colors.glass).castShadow = false;
    for (const y of [.62, 2.99]) box(world, x, y, -13.95, 3.08, .035, .065, colors.trim);
    // Rolled blinds and window hardware bring the facade down to human scale.
    cylinder(world, x, 2.91, -13.84, .042, .042, 2.96, colors.cabinet).rotation.z = Math.PI / 2;
    box(world, x + 1.28, 1.38, -13.90, .025, .23, .045, colors.chrome);
  }
  for (const x of [-11.9, -8.8, -5.7, -2.15, 2.15, 5.7, 8.8, 11.9])
    box(world, x, 1.7, -13.91, .055, 2.95, .075, colors.trim);

  const logoPanel = box(world, 0, 1.88, -13.98, 3.58, 2.37, .09, colors.desk, .025);
  logoPanel.castShadow = true;
  box(world, 0, 1.88, -14.045, 3.25, 2.10, .04, colors.black);
  const logoTexture = wallSignTexture();
  const logo = mesh(world, new THREE.PlaneGeometry(3.18, 1.59),
    new THREE.MeshBasicMaterial({ map: logoTexture, toneMapped: false }),
    0, 1.91, -13.928, false);
  logo.name = `Logo ${DEMO_COMPANY.name} / inspeccionar`;
  // A second sign is visible from the entry before reaching the far wall.
  box(world, 12.77, 2.12, 6.55, .13, 1.95, 4.05, colors.black, .035);
  const entryLogo = mesh(world, new THREE.PlaneGeometry(3.8, 1.9), logo.material, 12.685, 2.12, 6.55, false);
  entryLogo.rotation.y = -Math.PI / 2;
  entryLogo.name = `Cartel ${DEMO_COMPANY.name}`;

  for (const x of [-8.65, -2.35, 3.95, 10.25]) for (const z of [-7.5, 2.6]) {
    box(world, x, 1.68, z, .27, 3.35, .27, colors.wall, .008);
    box(world, x, .055, z, .30, .11, .30, colors.trim);
    box(world, x, 3.37, z, .36, .12, .36, colors.ceiling);
    shadow(x, z, .65, .65);
  }
  for (const z of [-12.1, -8.1, -4.1, -.1, 3.9, 7.9])
    box(world, -8.75, 1.64, z, .055, 3.25, .06, colors.chrome);
  for (const z of [-10.1, -6.1, -2.1, 1.9, 5.9]) {
    box(world, -8.75, 1.66, z, .018, 2.93, 3.94, colors.glass).castShadow = false;
    box(world, -8.73, 1.19, z, .005, .22, 3.90, colors.frost).castShadow = false;
    for (let i = 0; i < 3; i++) box(world, -8.718, 1.19, z - .14 + i * .14, .008, .045, .045, colors.frame);
  }
  box(world, -8.75, 3.25, -1, .07, .07, 22, colors.chrome);
  box(world, -8.75, .08, -1, .07, .07, 22, colors.chrome);
  for (const z of [3.63, 4.17]) box(world, -8.66, 1.16, z, .055, .43, .035, colors.chrome, .012);
  // Fabric acoustic panels along the long wall keep the large room from feeling empty.
  for (let i = 0; i < 7; i++) {
    box(world, 12.78, 1.73, -7.6 + i * 1.05, .08, 1.44, .78, i % 3 === 0 ? colors.wood : colors.chair, .018);
  }

  function backPoint(u, v) {
    return [( .235 + Math.sin(v * Math.PI) * .025) * u, .61 + v * .59,
      .21 + .095 * v + .04 * u * u - .035 * Math.sin(v * Math.PI)];
  }
  const backGeometry = cached("chair-back", () => {
    const geometry = new THREE.BufferGeometry(), vertices = [], uv = [], indices = [];
    for (let row = 0; row <= 10; row++) for (let col = 0; col <= 8; col++) {
      vertices.push(...backPoint(col / 4 - 1, row / 10)); uv.push(col / 8, row / 10);
    }
    for (let row = 0; row < 10; row++) for (let col = 0; col < 8; col++) {
      const a = row * 9 + col; indices.push(a, a + 9, a + 1, a + 1, a + 9, a + 10);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  });
  function chair(x, z) {
    const group = new THREE.Group(); group.position.set(x, 0, z); world.add(group);
    shadow(x, z, .94, .88);
    cylinder(group, 0, .26, 0, .025, .032, .34, colors.chrome);
    cylinder(group, 0, .18, 0, .049, .052, .20, colors.black);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const leg = box(group, Math.sin(angle) * .16, .115, Math.cos(angle) * .16, .047, .035, .32, colors.chrome, .012);
      leg.rotation.y = angle;
      const caster = new THREE.Group(); caster.position.set(Math.sin(angle) * .315, .055, Math.cos(angle) * .315); caster.rotation.y = angle;
      group.add(caster);
      for (const side of [-1, 1]) cylinder(caster, side * .024, 0, 0, .045, .045, .025, colors.black, 12).rotation.z = Math.PI / 2;
    }
    box(group, 0, .435, 0, .32, .045, .32, colors.black, .018);
    box(group, 0, .49, -.015, .54, .09, .51, colors.chair, .035);
    mesh(group, backGeometry, colors.chairMesh);
    for (const side of [-1, 1]) {
      tube(group, `chair-side:${side}`, [backPoint(side, 0), backPoint(side, .33), backPoint(side, .66), backPoint(side, 1)], .016, colors.frame);
      box(group, side * .31, .65, .025, .025, .24, .04, colors.frame, .008);
      box(group, side * .31, .775, -.03, .065, .036, .31, colors.black, .015);
    }
    tube(group, "chair-top", [backPoint(-1, 1), backPoint(0, 1), backPoint(1, 1)], .017, colors.frame, 10);
    tube(group, "chair-bottom", [backPoint(-1, 0), backPoint(0, 0), backPoint(1, 0)], .017, colors.frame, 10);
    tube(group, "chair-support", [[0, .43, .12], [0, .52, .32], [0, .79, .33]], .024, colors.frame);
    box(group, 0, .785, .287, .40, .055, .035, colors.black, .018);
    box(group, .22, .428, -.04, .18, .018, .035, colors.black, .008);
  }

  function monitor(parent, x, z, variant) {
    const group = new THREE.Group(); group.position.set(x, 0, z); parent.add(group);
    box(group, 0, 1.10, 0, .72, .435, .04, colors.black, .016);
    box(group, 0, 1.105, .024, .675, .376, .004, colors.screens[variant]);
    box(group, 0, .86, -.025, .045, .20, .045, colors.chrome, .009);
    box(group, 0, .765, -.01, .25, .025, .18, colors.chrome, .01);
    box(group, .30, .904, .026, .012, .004, .002, colors.blue);
    for (let i = -3; i <= 3; i++) box(group, i * .055, 1.04, -.023, .032, .09, .003, colors.keyboard);
    tube(group, "monitor-cable", [[0, .96, -.03], [.04, .82, -.09], [.08, .758, -.13]], .004, colors.black, 8);
    cylinder(group, .08, .754, -.13, .026, .026, .004, colors.black);
    box(group, 0, .774, .36, .61, .038, .235, colors.keyboard, .012).name = "Teclado";
    const keys = mesh(group, cached("keyboard-top", () => new THREE.PlaneGeometry(.57, .207)), colors.keyboardKeys, 0, .794, .36, false);
    keys.rotation.x = -Math.PI / 2;
    box(group, .53, .757, .36, .24, .009, .24, colors.mousepad, .009);
    box(group, .53, .784, .36, .094, .043, .15, colors.black, .018).name = "Mouse";
    box(group, .53, .807, .332, .01, .003, .029, colors.chrome, .001);
  }
  function mug(parent, x, z) {
    cylinder(parent, x, .807, z, .048, .039, .105, colors.ceramic, 20);
    cylinder(parent, x, .859, z, .04, .04, .002, colors.coffee, 20);
    const handle = mesh(parent, cached("mug-handle", () => new THREE.TorusGeometry(.034, .009, 6, 14)), colors.ceramic, x + .049, .809, z);
    handle.rotation.y = 0;
  }
  function workstation(x, z, index) {
    const group = new THREE.Group(); group.position.set(x, 0, z); world.add(group);
    shadow(x, z, 3.7, 2.3);
    box(group, 0, .72, 0, 3.25, .065, 1.42, colors.desk, .012);
    box(group, 0, .679, 0, 3.14, .018, 1.32, colors.cabinet, .007);
    for (const side of [-1, 1]) {
      box(group, side * 1.48, .37, 0, .054, .69, .065, colors.frame, .008);
      box(group, side * 1.48, .045, 0, .075, .035, 1.16, colors.frame, .012);
      for (const front of [-1, 1]) cylinder(group, side * 1.48, .022, front * .51, .032, .032, .027, colors.black, 12);
    }
    box(group, 0, .63, -.56, 3.01, .08, .05, colors.frame);
    box(group, 0, .46, -.69, 3.05, .35, .025, colors.cabinet);
    box(group, 0, .87, -.66, 3.06, .28, .035, colors.chair, .012);
    box(group, 0, 1.012, -.66, 3.07, .012, .038, colors.trim);
    monitor(group, -.82, -.29, index % 3); monitor(group, .82, -.29, (index + 1) % 3);
    chair(x - .82, z + 1.14); chair(x + .82, z + 1.14);
    if (index % 2 === 0) {
      box(group, -1.34, .762, .28, .29, .013, .37, colors.blue, .004);
      box(group, -1.34, .773, .28, .278, .012, .355, colors.paper, .002);
      box(group, -1.46, .783, .29, .009, .009, .24, colors.chrome, .004);
      mug(group, -.05, -.20);
    } else {
      box(group, -1.34, .759, .30, .27, .007, .35, colors.paper);
      box(group, -1.34, .764, .30, .27, .003, .35, colors.paper).rotation.y = .12;
    }
  }
  let deskIndex = 0;
  for (const z of [-7.25, -1.9, 3.45]) for (const x of [-4.45, 4.3, 8.65]) workstation(x, z, deskIndex++);

  // Low storage island, with inset doors, drawer gaps and a timber top.
  box(world, -3.75, .56, 7.6, 3.45, 1.1, 1.27, colors.cabinet, .012);
  box(world, -3.75, 1.13, 7.6, 3.50, .045, 1.31, colors.wood, .012);
  box(world, -3.75, .065, 7.6, 3.25, .12, 1.06, colors.black);
  shadow(-3.75, 7.6, 3.9, 1.75);
  for (const x of [-4.58, -2.92]) {
    box(world, x, .43, 8.244, 1.53, .66, .024, colors.desk, .004);
    box(world, x, .93, 8.244, 1.53, .29, .024, colors.desk, .004);
    for (const y of [.70, .98]) box(world, x, y, 8.28, .28, .015, .035, colors.chrome, .006);
  }
  // A compact printer and paper tray on the existing island.
  box(world, -4.56, 1.32, 7.54, .57, .33, .43, colors.frame, .025);
  box(world, -4.56, 1.50, 7.54, .56, .034, .41, colors.black, .014);
  box(world, -4.56, 1.29, 7.77, .43, .06, .025, colors.black, .008);
  box(world, -4.56, 1.265, 7.82, .30, .008, .17, colors.paper);

  // Place the whole kitchen inside the glass wall at x = -8.75.
  const kitchen = new THREE.Group(); kitchen.position.x = 1.5; world.add(kitchen);
  box(kitchen, -8.1, .45, -10.75, 3.25, .88, .75, colors.wood, .015);
  box(kitchen, -8.1, .91, -10.75, 3.4, .06, .85, colors.desk, .012);
  box(kitchen, -8.1, 1.28, -11.16, 3.4, .68, .035, colors.cabinet);
  box(kitchen, -8.1, 1.95, -11.05, 3.25, .67, .31, colors.wood, .012);
  box(kitchen, -8.1, 1.607, -10.95, 3.1, .012, .09, colors.lamp);
  for (const x of [-9.15, -8.1, -7.05]) {
    box(kitchen, x, .46, -10.36, 1.01, .78, .025, colors.wood, .004);
    box(kitchen, x, .73, -10.33, .28, .018, .032, colors.chrome, .006);
    box(kitchen, x, 1.95, -10.88, 1.01, .64, .025, colors.wood, .004);
    box(kitchen, x, 1.69, -10.85, .28, .018, .032, colors.chrome, .006);
  }
  shadow(-6.6, -10.75, 3.7, 1.2);
  box(kitchen, -8.63, 1.16, -10.75, .48, .45, .4, colors.black, .035);
  box(kitchen, -8.63, 1.25, -10.54, .35, .12, .012, colors.chrome, .012);
  box(kitchen, -8.63, 1.255, -10.529, .12, .06, .008, colors.screens[2]);
  box(kitchen, -8.63, .97, -10.47, .37, .035, .17, colors.chrome, .009);
  for (const x of [-8.70, -8.56]) cylinder(kitchen, x, 1.15, -10.50, .012, .012, .06, colors.chrome, 10);
  for (let i = 0; i < 3; i++) {
    cylinder(kitchen, -7.68 + i * .25, 1.065, -10.8, .075, .068, .25, colors.ceramic, 16);
    cylinder(kitchen, -7.68 + i * .25, 1.197, -10.8, .078, .078, .022, colors.wood, 16);
  }
  box(kitchen, -9.65, 1.7, -11.75, .06, 1.8, 1.5, colors.wall);

  // Wall mounted extinguisher and clear evacuation guidance.
  const red = new THREE.MeshStandardMaterial({ color: 0xbd2525, metalness: .34, roughness: .38 });
  const darkRed = new THREE.MeshStandardMaterial({ color: 0x8c1919, metalness: .38, roughness: .42 });
  box(world, 12.73, 1.08, 3.03, .17, 1.38, .62, colors.frame, .025);
  cylinder(world, 12.52, .99, 3.03, .155, .135, .73, red, 24).name = "Matafuegos";
  cylinder(world, 12.52, 1.37, 3.03, .09, .12, .10, darkRed, 16);
  box(world, 12.52, 1.47, 3.03, .32, .045, .10, colors.black, .012);
  cylinder(world, 12.52, 1.50, 3.03, .025, .025, .12, colors.chrome, 12);
  tube(world, "extinguisher-hose", [[12.5, 1.39, 3.10], [12.33, 1.30, 3.28], [12.35, 1.05, 3.29]], .018, colors.black);
  box(world, 12.357, 1.02, 3.29, .05, .13, .05, colors.black, .008);
  const safetyMaterial = new THREE.MeshBasicMaterial({ map: wallSignTexture({ safety: true }), toneMapped: false });
  const safetySign = mesh(world, new THREE.PlaneGeometry(1.75, .875), safetyMaterial, 12.72, 2.25, 3.03, false);
  safetySign.rotation.y = -Math.PI / 2;
  safetySign.name = "Seguridad y matafuegos";

  const leafGeometry = cached("office-leaf", () => {
    const vertices = [], uv = [], indices = [], geometry = new THREE.BufferGeometry();
    for (let row = 0; row <= 8; row++) for (let col = 0; col <= 4; col++) {
      const v = row / 8, u = col / 2 - 1;
      vertices.push(u * Math.sin(v * Math.PI) * .105, v * .42, v * v * .12 - Math.abs(u) * .028 * Math.sin(v * Math.PI));
      uv.push(col / 4, v);
    }
    for (let row = 0; row < 8; row++) for (let col = 0; col < 4; col++) {
      const a = row * 5 + col; indices.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  });
  for (const x of [-5.55, 5.55, 9.45]) {
    box(world, x, .43, -11.65, 2, .53, .54, colors.wood, .018);
    box(world, x, .15, -11.65, 1.86, .12, .42, colors.black);
    box(world, x, .71, -11.65, 1.88, .04, .43, colors.soil);
    shadow(x, -11.65, 2.4, .95);
    for (let i = -2; i <= 2; i++) {
      const stemX = x + i * .35, tall = .31 + (i % 2 === 0 ? .14 : 0);
      cylinder(world, stemX, .72 + tall / 2, -11.65, .007, .009, tall, colors.stem, 6);
      for (let j = 0; j < 5; j++) {
        const leaf = mesh(world, leafGeometry, j % 2 ? colors.leaf : colors.leafLight,
          stemX, .76 + tall * (j < 3 ? .46 : .80), -11.65);
        leaf.rotation.set(.25 + j * .08, j * 2.4 + i * .72, (j % 2 ? 1 : -1) * .60);
        leaf.scale.setScalar(.78 + (j % 3) * .12);
      }
    }
  }

  // Share repeated geometry on the GPU: chairs, desks and small fittings.
  h.batch();
  return { world, createContactShadow: (x, z) => shadow(x, z, .75, .65), logoPosition: new THREE.Vector3(0, 1.9, -14),
    roxyPosition: new THREE.Vector3(-1.8, 0, -5.2),
    alfredoPosition: new THREE.Vector3(2.7, 0, -5.2),
    coffeePosition: new THREE.Vector3(-6.6, 0, -10.45) };
}
