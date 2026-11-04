import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// All surface detail is generated locally. Small repeated parts are instanced once
// after construction; displays upload only when the mission state changes.
function canvasTexture(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function panelTexture(deck = false, relief = false) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = relief ? "#888888" : deck ? "#637281" : "#425567";
    ctx.fillRect(0, 0, w, h);
    let seed = deck ? 922 : 411;
    const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    // Fine machined grain, deliberately much subtler than the former grunge map.
    for (let i = 0; i < 6500; i++) {
      ctx.fillStyle = rand() > .5 ? "rgba(255,255,255,.026)" : "rgba(0,0,0,.027)";
      ctx.fillRect(rand() * w, rand() * h, deck ? 1 : 12 + rand() * 26, 1);
    }
    const rows = deck ? 2 : 1;
    for (let row = 0; row < rows; row++) {
      const y = row * h / rows, ph = h / rows;
      const inset = deck ? 8 : 12;
      ctx.fillStyle = relief ? "#424242" : "#182733";
      ctx.fillRect(0, y, w, 5);
      ctx.fillRect(0, y, 5, ph);
      ctx.strokeStyle = relief ? "#aaaaaa" : "#8495a24a";
      ctx.lineWidth = 2;
      ctx.strokeRect(inset, y + inset, w - inset * 2, ph - inset * 2);
      ctx.strokeStyle = relief ? "#555555" : "#263744";
      ctx.lineWidth = 4;
      ctx.strokeRect(inset + 5, y + inset + 5, w - inset * 2 - 10, ph - inset * 2 - 10);
      for (const sx of [26, w - 26]) for (const sy of [y + 26, y + ph - 26]) {
        ctx.fillStyle = relief ? "#555555" : "#1e2b38";
        ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = relief ? "#aaaaaa" : "#aebbc2";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx - 3, sy); ctx.lineTo(sx + 3, sy); ctx.stroke();
      }
      if (!deck) {
        ctx.fillStyle = relief ? "#777777" : "#2c3c49";
        ctx.fillRect(56, y + 358, 400, 69);
        for (let vent = 0; vent < 26; vent++) {
          ctx.fillStyle = relief ? "#333333" : "#17212b";
          ctx.fillRect(67 + vent * 14, y + 370, 6, 43);
        }
        if (!relief) {
          ctx.fillStyle = "#bac5c9";
          ctx.font = "14px monospace";
          ctx.fillText("NBU // PRESSURIZED HULL", 55, 65);
          ctx.fillStyle = "#d7ba80";
          ctx.fillRect(56, 79, 63, 4);
          ctx.font = "11px monospace";
          ctx.fillText("SERVICE / 01", 343, 330);
        }
      } else if (!relief) {
        ctx.fillStyle = "#aab9c058";
        ctx.font = "10px monospace";
        ctx.fillText("DECK / 01", 38, y + 42);
      }
    }
  });
}

export function applyShipSurfaceUV(geometry, width, height, depth, tileSize = 2) {
  const uv = geometry.attributes.uv, normals = geometry.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const faceX = Math.abs(normals.getX(i)) > .5;
    const faceY = Math.abs(normals.getY(i)) > .5;
    const u = faceX ? depth : width;
    const v = faceY ? depth : height;
    uv.setXY(i, uv.getX(i) * u / tileSize, uv.getY(i) * v / tileSize);
  }
  uv.needsUpdate = true;
}

export function createLostShipGraphics(root) {
  const details = new THREE.Group();
  details.name = "ship architecture and instruments";
  root.add(details);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const rounded = new RoundedBoxGeometry(1, 1, 1, 2, .045);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  const floorMap = panelTexture(true), floorBump = panelTexture(true, true);
  const wallMap = panelTexture(false), wallBump = panelTexture(false, true);
  for (const texture of [floorMap, floorBump, wallMap, wallBump]) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  floorBump.colorSpace = wallBump.colorSpace = THREE.NoColorSpace;
  const grateMap = canvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = "#33404a"; ctx.fillRect(0, 0, 128, 128);
    for (let y = 6; y < 128; y += 12) {
      ctx.fillStyle = "#0b1420"; ctx.fillRect(8, y, 112, 7);
      ctx.fillStyle = "#87939c"; ctx.fillRect(8, y + 7, 112, 1);
    }
  });
  const mat = {
    floor: new THREE.MeshStandardMaterial({ map: floorMap, bumpMap: floorBump, bumpScale: .027, color: 0xb3bdc6, roughness: .56, metalness: .48 }),
    wall: new THREE.MeshStandardMaterial({ map: wallMap, bumpMap: wallBump, bumpScale: .019, color: 0xa7b7ca, roughness: .61, metalness: .36 }),
    shell: new THREE.MeshStandardMaterial({ color: 0x354959, roughness: .39, metalness: .58 }),
    edge: new THREE.MeshStandardMaterial({ color: 0x788995, roughness: .3, metalness: .72 }),
    black: new THREE.MeshStandardMaterial({ color: 0x101a24, roughness: .67, metalness: .25 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x080e17, roughness: .91, metalness: .05 }),
    porcelain: new THREE.MeshStandardMaterial({ color: 0xb8b7ac, roughness: .48, metalness: .13 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xc7a363, roughness: .56, metalness: .25 }),
    cyan: new THREE.MeshBasicMaterial({ color: 0x7cc5d2, toneMapped: false }),
    amber: new THREE.MeshBasicMaterial({ color: 0xdca15c, toneMapped: false }),
    pink: new THREE.MeshBasicMaterial({ color: 0xb56fae, toneMapped: false }),
    white: new THREE.MeshBasicMaterial({ color: 0xb9d9df, toneMapped: false }),
    grate: new THREE.MeshStandardMaterial({ map: grateMap, color: 0x8c9daa, roughness: .68, metalness: .5 }),
  };
  const displays = [];
  function part(parent, geometry, material, x, y, z, sx, sy, sz, batch = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.userData.shipBatch = batch;
    mesh.receiveShadow = true;
    mesh.castShadow = geometry === rounded && sy > .35;
    parent.add(mesh);
    return mesh;
  }
  const box = (parent, material, x, y, z, w, h, d, round = false, batch = true) =>
    part(parent, round ? rounded : unitBox, material, x, y, z, w, h, d, batch);
  const tube = (parent, material, x, y, z, radius, h) => part(parent, cylinder, material, x, y, z, radius, h, radius);
  function label(parent, text, x, y, z, width, height, color = "#b5ccd3") {
    const map = canvasTexture(512, 96, (ctx, w, h) => {
      ctx.fillStyle = "#13212d"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = color; ctx.fillRect(14, 14, 7, h - 28);
      ctx.font = "600 25px Bahnschrift, Segoe UI, sans-serif";
      ctx.fillText(text, 39, 59, w - 58);
      ctx.fillStyle = "#617788"; ctx.fillRect(39, h - 17, w - 58, 2);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
    mesh.position.set(x, y, z); parent.add(mesh);
    return mesh;
  }
  function groupAt(x, y, z, rotation = 0, parent = details) {
    const group = new THREE.Group();
    group.position.set(x, y, z); group.rotation.y = rotation;
    parent.add(group); return group;
  }

  function wall(x, z, width, depth) {
    const horizontal = width > depth;
    const length = horizontal ? width : depth;
    const count = Math.max(1, Math.floor(length / 2));
    for (let i = 0; i <= count; i++) {
      const at = -length / 2 + .1 + i * (length - .2) / count;
      for (const side of [-1, 1]) {
        const px = horizontal ? x + at : x + side * (width / 2 + .036);
        const pz = horizontal ? z + side * (depth / 2 + .036) : z + at;
        box(details, mat.black, px, 1.93, pz, horizontal ? .17 : .1, 3.65, horizontal ? .1 : .17);
        box(details, mat.edge, px, 1.93, pz, horizontal ? .055 : .115, 3.55, horizontal ? .115 : .055);
        box(details, mat.yellow, px, .52, pz, horizontal ? .08 : .12, .14, horizontal ? .12 : .08);
      }
    }
    for (const side of [-1, 1]) {
      box(details, mat.shell, x + (horizontal ? 0 : side * (width / 2 + .025)), .67,
        z + (horizontal ? side * (depth / 2 + .025) : 0), horizontal ? width : .085, .065, horizontal ? .085 : depth);
    }
  }
  function deck(x, z, width, depth) {
    for (const edge of [-1, 1]) {
      const px = x + edge * (width / 2 - .34);
      box(details, mat.grate, px, .008, z, .38, .014, depth - .38);
      box(details, mat.edge, px + edge * .22, .016, z, .032, .022, depth - .38);
      for (let offset = -depth / 2 + .75; offset < depth / 2; offset += 2.4) {
        box(details, mat.black, x + edge * (width / 2 - .68), .025, z + offset, .1, .025, .64);
        box(details, mat.cyan, x + edge * (width / 2 - .68), .04, z + offset, .045, .018, .4);
      }
    }
    for (let offset = -depth / 2 + 1.35; offset < depth / 2 - .6; offset += 3.1) {
      const g = groupAt(x, 3.93, z + offset);
      box(g, mat.black, 0, 0, 0, Math.min(width - 1.3, 5.4), .16, .42);
      box(g, mat.edge, 0, -.085, 0, 2.1, .025, .32);
      box(g, mat.white, 0, -.106, 0, 1.92, .022, .19);
      for (const edge of [-1, 1]) box(g, mat.shell, edge * 1.06, -.03, 0, .08, .2, .45);
    }
  }
  function door(mesh, x, z, width, id) {
    const frame = groupAt(x, 0, z);
    for (const side of [-1, 1]) {
      box(frame, mat.black, side * (width / 2 + .12), 1.78, 0, .32, 3.65, .55);
      box(frame, mat.edge, side * (width / 2 + .12), 1.78, .3, .14, 3.63, .08);
      box(frame, mat.amber, side * (width / 2 + .12), 2.54, .35, .048, .55, .018);
    }
    box(frame, mat.shell, 0, 3.59, 0, width + .54, .22, .58);
    box(frame, mat.grate, 0, .018, 0, width, .025, .62);
    for (const face of [-1, 1]) {
      const moving = groupAt(0, 0, face * .15, face === 1 ? 0 : Math.PI, mesh);
      for (const side of [-1, 1]) {
        box(moving, mat.shell, side * width * .245, 0, 0, width * .47, 3.2, .045, true, false);
        box(moving, mat.edge, side * .08, 0, .05, .035, 2.95, .04, false, false);
        for (let i = 0; i < 4; i++) {
          const hazard = box(moving, mat.yellow, side * .71 + (i - 1.5) * .15, -.77, .05, .07, .24, .018, false, false);
          hazard.rotation.z = -.5;
        }
        box(moving, mat.black, side * .91, .15, .04, .48, .08, .03, false, false);
      }
      label(moving, id === "arrival" ? "01 / TRANSIT LOCK" : "05 / BRIDGE ACCESS", 0, .88, .08, 2.1, .35, "#c4d6d9");
    }
  }
  function drawDisplay(entry, state) {
    const ctx = entry.canvas.getContext("2d"), w = 512, h = 256;
    const color = entry.damaged ? "#efb078" : "#83d2da";
    ctx.fillStyle = "#07121c"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#122a38"; ctx.fillRect(0, 0, w, 44);
    ctx.fillStyle = color; ctx.font = "600 20px monospace";
    ctx.fillText(entry.title, 20, 29);
    ctx.fillStyle = "#829aa8"; ctx.font = "12px monospace";
    ctx.fillText("NBU SYSTEMS  /  PUERTA 01", 20, 63);
    ctx.strokeStyle = "#234251"; ctx.lineWidth = 1;
    for (let y = 80; y < 204; y += 24) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(329, y); ctx.stroke(); }
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 21; x < 328; x++) {
      const y = 130 + Math.sin(x * .038) * 22 + Math.sin(x * .14) * (state.power ? 7 : 18);
      if (x === 21) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = "#213b48"; ctx.fillRect(355 + i * 27, 84, 15, 105);
      ctx.fillStyle = i === 4 ? "#d4a271" : color;
      const bar = (state.power ? 62 : 17) + ((i * 19) % 43);
      ctx.fillRect(355 + i * 27, 189 - bar, 15, bar);
    }
    const status = entry.kind === "access" ? (state.access ? "ACCESO CONCEDIDO" : "COMPUERTA BLOQUEADA")
      : entry.kind === "life" ? (state.life ? "PRESION ESTABLE" : "PRESION DESAJUSTADA")
      : entry.kind === "nav" ? (state.navigation ? "COORDENADA RESTAURADA" : "NAVEGACION OFFLINE")
      : state.power ? "ENERGIA PRINCIPAL / ONLINE" : "ENERGIA DE EMERGENCIA";
    ctx.fillStyle = "#152c37"; ctx.fillRect(0, 212, w, 44);
    ctx.fillStyle = color; ctx.font = "600 16px monospace"; ctx.fillText(status, 19, 239);
    if (entry.damaged) {
      ctx.strokeStyle = "#73c2d94b"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(417, 0); ctx.lineTo(366, 57); ctx.lineTo(393, 77);
      ctx.lineTo(331, 146); ctx.lineTo(305, 256); ctx.moveTo(366, 57); ctx.lineTo(310, 24); ctx.stroke();
    }
    ctx.fillStyle = "#00000022";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    entry.map.needsUpdate = true;
  }
  function screen(parent, title, kind, damaged = false, width = 1.15, height = .57) {
    const map = canvasTexture(512, 256, () => {});
    const material = new THREE.MeshBasicMaterial({ map, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    parent.add(mesh);
    const entry = { canvas: map.image, map, material, title, kind, damaged };
    displays.push(entry);
    return mesh;
  }
  function terminal(name, x, z, turn, title, kind = "system", damaged = false, deskOnly = false) {
    const group = groupAt(x, 0, z, turn);
    group.name = "detailed " + name;
    box(group, mat.black, 0, .045, 0, 1.19, .09, .7, true);
    box(group, mat.shell, 0, .49, -.06, 1.3, .82, .66, true);
    box(group, mat.edge, -.66, .5, -.06, .045, .8, .68);
    box(group, mat.edge, .66, .5, -.06, .045, .8, .68);
    const deck = groupAt(0, .98, .03, 0, group);
    deck.rotation.x = .13;
    box(deck, mat.edge, 0, 0, 0, 1.53, .12, .92, true);
    box(deck, mat.black, 0, .069, .08, 1.36, .026, .55, true);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++)
      box(deck, row === 2 && col > 5 ? mat.yellow : mat.porcelain, -.51 + col * .105, .098, .02 + row * .095, .077, .023, .057, true);
    for (let i = 0; i < 3; i++) {
      tube(deck, mat.rubber, .54, .104, -.03 + i * .14, .049, .05);
      box(deck, mat.cyan, .54, .133, -.03 + i * .14, .009, .004, .026);
    }
    for (let i = 0; i < 7; i++) box(group, mat.rubber, -.31 + i * .105, .31, .282, .045, .2, .015);
    label(group, "NBU / " + kind.toUpperCase() + " / 01", 0, .67, .286, 1.03, .17);
    if (!deskOnly) {
      const head = groupAt(0, 1.4, -.23, 0, group);
      head.rotation.x = -.1;
      box(head, mat.shell, 0, 0, 0, 1.43, .84, .21, true);
      box(head, mat.rubber, 0, .02, .113, 1.28, .68, .028, true);
      const display = screen(head, title, kind, damaged);
      display.position.set(0, .04, .131);
      for (const side of [-1, 1]) for (const y of [-.34, .34]) {
        const screw = tube(head, mat.edge, side * .65, y, .116, .02, .014);
        screw.rotation.x = Math.PI / 2;
      }
      for (let i = 0; i < 3; i++) box(head, i === 2 && damaged ? mat.amber : mat.cyan, -.49 + i * .09, -.34, .12, .045, .018, .017);
    }
    const cable = new THREE.CatmullRomCurve3([
      new THREE.Vector3(.49, .64, -.38), new THREE.Vector3(.71, .26, -.48),
      new THREE.Vector3(.81, .045, -.68), new THREE.Vector3(.75, .035, -.96),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 12, .022, 5, false), mat.rubber));
    return group;
  }
  function bridgeRack(x, z, side) {
    const group = groupAt(x, 0, z);
    group.name = "bridge auxiliary instruments";
    box(group, mat.shell, 0, .34, 0, 1.86, .66, 1.26, true);
    box(group, mat.black, 0, .05, 0, 1.72, .1, 1.12, true);
    for (const edge of [-1, 1]) box(group, mat.edge, edge * .9, .37, .65, .045, .52, .04);
    box(group, mat.grate, 0, .27, .65, 1.48, .23, .018);
    label(group, side < 0 ? "TELEMETRY / 01" : "COMMUNICATIONS / 09", 0, .52, .653, 1.46, .15);
    const head = groupAt(0, .74, -.1, 0, group);
    head.rotation.x = -.85;
    box(head, mat.edge, 0, 0, 0, 1.7, .78, .09, true);
    box(head, mat.rubber, 0, 0, .055, 1.57, .67, .03, true);
    const display = screen(head, side < 0 ? "TELEMETRIA" : "COMUNICACIONES", "nav", false, 1.1, .54);
    display.position.set(-.17, .015, .073);
    for (let i = 0; i < 4; i++) {
      box(head, mat.porcelain, .58, .22 - i * .13, .078, .18, .075, .025, true);
      box(head, i === 3 ? mat.amber : mat.cyan, .58, .22 - i * .13, .093, .09, .012, .006);
    }
  }
  function windowFrame(parent, width, height) {
    for (const side of [-1, 1]) {
      box(parent, mat.black, side * (width / 2 + .07), 0, .2, .18, height + .32, .23);
      box(parent, mat.edge, side * (width / 2 + .03), 0, .32, .045, height + .18, .04);
      box(parent, mat.shell, 0, side * (height / 2 + .08), .2, width + .32, .16, .26);
    }
    box(parent, mat.cyan, 0, -height / 2 - .08, .34, width - .2, .018, .015);
    if (width > 4) for (const x of [-width / 4, width / 4]) box(parent, mat.edge, x, 0, .31, .06, height, .06);
  }
  let moduleMarker;
  function cabinet(x, z, containsModule = false) {
    const group = groupAt(x, 0, z);
    box(group, mat.edge, 0, .13, .46, 1.18, .06, .08);
    for (const side of [-1, 1]) {
      box(group, mat.shell, side * .3, .96, .46, .55, 1.55, .035, true);
      box(group, mat.black, side * .08, 1.04, .49, .04, .24, .04);
    }
    box(group, mat.grate, 0, .39, .487, .97, .19, .025);
    if (containsModule) {
      label(group, "MÓDULO ENERGÉTICO", 0, 1.61, .51, 1.16, .21, "#f6db9a");
      for (const side of [-1, 1]) box(group, mat.amber, side * .55, 1.57, .535, .025, .26, .02);
      moduleMarker = groupAt(0, 2.04, .1, 0, group);
      box(moduleMarker, mat.black, 0, 0, 0, 1.33, .34, .09, true, false);
      box(moduleMarker, mat.amber, 0, -.15, .05, 1.21, .025, .02, false, false);
      label(moduleMarker, "MÓDULO / ENERGÍA", 0, .01, .054, 1.23, .25, "#ffe3a3");
    } else {
      label(group, "MAINTENANCE / AUTHORIZED", 0, 1.61, .49, 1.02, .16, "#dcc694");
    }
  }
  function tablet(x, z, turn, title) {
    const group = groupAt(x, 0, z, turn);
    box(group, mat.black, 0, .035, 0, .55, .06, .45, true);
    box(group, mat.edge, 0, .49, -.08, .1, .9, .12);
    const head = groupAt(0, 1.04, 0, 0, group);
    head.rotation.x = -.7;
    box(head, mat.shell, 0, 0, 0, .72, .46, .055, true);
    const display = screen(head, title, "log", false, .64, .34);
    display.position.z = .031;
  }
  function arrivalPad() {
    const group = groupAt(0, 0, 13.4);
    tube(group, mat.black, 0, -.01, 0, 1.25, .06);
    const padMap = canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#172330"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#456175"; ctx.lineWidth = 2;
      for (const radius of [65, 115, 185, 225]) {
        ctx.beginPath(); ctx.arc(256, 256, radius, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = "#96aab8"; ctx.lineWidth = 3;
      for (let i = 0; i < 36; i++) {
        const a = i * Math.PI / 18;
        ctx.beginPath();
        ctx.moveTo(256 + Math.cos(a) * 204, 256 + Math.sin(a) * 204);
        ctx.lineTo(256 + Math.cos(a) * (i % 3 ? 212 : 221), 256 + Math.sin(a) * (i % 3 ? 212 : 221));
        ctx.stroke();
      }
      ctx.fillStyle = "#aebac3"; ctx.textAlign = "center";
      ctx.font = "bold 28px monospace"; ctx.fillText("PUERTA 01", 256, 252);
      ctx.fillStyle = "#82b6c3"; ctx.font = "12px monospace"; ctx.fillText("DIMENSIONAL TRANSIT", 256, 276);
    });
    const pad = new THREE.Mesh(new THREE.CircleGeometry(1.01, 48),
      new THREE.MeshStandardMaterial({ map: padMap, roughness: .53, metalness: .4 }));
    pad.rotation.x = -Math.PI / 2; pad.position.y = .024; group.add(pad);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.19, .025, 6, 48), mat.edge);
    rim.rotation.x = Math.PI / 2; rim.position.y = .03; group.add(rim);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const slot = box(group, mat.shell, Math.sin(a) * 1.13, .052, Math.cos(a) * 1.13, .11, .065, .23, true);
      slot.rotation.y = a;
      const light = box(group, i % 3 === 0 ? mat.pink : mat.cyan, Math.sin(a) * 1.13, .09, Math.cos(a) * 1.13, .03, .012, .1);
      light.rotation.y = a;
    }
  }
  function reactor() {
    const group = groupAt(-11.3, 0, -5.6);
    for (const y of [.48, 2.7]) {
      tube(group, mat.edge, 0, y, 0, 1.21, .11);
      tube(group, mat.black, 0, y + .08, 0, 1.14, .06);
    }
    tube(group, mat.cyan, 0, 1.62, 0, .23, 1.93);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      tube(group, mat.edge, Math.sin(a) * 1.06, 1.58, Math.cos(a) * 1.06, .045, 2.09);
    }
  }

  function finish() {
    details.updateMatrixWorld(true);
    const inverse = details.matrixWorld.clone().invert();
    const batches = new Map(), remove = [];
    details.traverse(mesh => {
      if (!mesh.isMesh || !mesh.userData.shipBatch) return;
      const key = mesh.geometry.uuid + "/" + mesh.material.uuid + "/" + mesh.castShadow;
      if (!batches.has(key)) batches.set(key, { geometry: mesh.geometry, material: mesh.material, castShadow: mesh.castShadow, matrices: [] });
      batches.get(key).matrices.push(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
      remove.push(mesh);
    });
    for (const mesh of remove) mesh.removeFromParent();
    for (const { geometry, material, castShadow, matrices } of batches.values()) {
      const instances = new THREE.InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((matrix, i) => instances.setMatrixAt(i, matrix));
      instances.instanceMatrix.needsUpdate = true;
      instances.receiveShadow = true;
      instances.castShadow = castShadow;
      instances.computeBoundingSphere();
      details.add(instances);
    }
  }
  let previousState = "";
  function update(progress, elapsed) {
    const state = { power: Boolean(progress?.powerRestored), access: Boolean(progress?.accessGranted),
      life: Boolean(progress?.lifeStable), navigation: Boolean(progress?.navigationRestored) };
    const key = JSON.stringify(state);
    if (key !== previousState) {
      displays.forEach(entry => drawDisplay(entry, state));
      previousState = key;
    }
    if (moduleMarker) moduleMarker.visible = !progress?.moduleTaken;
    const power = state.power ? 1 : .6;
    mat.white.color.setRGB(.66 * power, .8 * power, .86 * power);
    mat.cyan.color.setRGB(.30 * power, .65 * power, .72 * power);
  }
  return { materials: mat, wall, deck, door, terminal, bridgeRack, windowFrame, cabinet, tablet, arrivalPad, reactor, finish, update };
}
