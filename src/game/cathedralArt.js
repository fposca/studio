import * as THREE from "three";
import { createLowDriftingFog } from "./lowDriftingFog.js";

const TAU = Math.PI * 2;

// Dimensions are in world metres: long walls and small plinths share the same stone scale.
export function cathedralStoneBox(width, height, depth, tileSize = 2.8) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const uv = geometry.attributes.uv;
  const faces = [[depth, height], [depth, height], [width, depth], [width, depth], [width, height], [width, height]];
  faces.forEach(([u, v], face) => {
    for (let n = 0; n < 4; n++) {
      const i = face * 4 + n;
      uv.setXY(i, uv.getX(i) * u / tileSize, uv.getY(i) * v / tileSize);
    }
  });
  return geometry;
}

/** Decorative objects only; the quest's positions, collisions and activation order stay in cathedralScenery. */
export function createCathedralArt(parent, stoneMaterials) {
  const root = new THREE.Group(); root.name = "Catedral / arquitectura y reliquias"; parent.add(root);
  const geometries = new Set(), materials = new Set(), textures = new Set(), batches = new Map();
  const geo = (g) => { geometries.add(g); return g; };
  const mat = (m) => { materials.add(m); return m; };
  const texture = (width, height, draw) => {
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    draw(canvas.getContext("2d"), width, height);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4; textures.add(map); return map;
  };
  const bronze = stoneMaterials.bronze;
  const paleStone = mat(new THREE.MeshStandardMaterial({ color: 0x77747e, roughness: .87, metalness: .06 }));
  const brass = mat(new THREE.MeshStandardMaterial({ color: 0xb99666, roughness: .38, metalness: .65 }));
  const box = geo(new THREE.BoxGeometry(1, 1, 1));
  const octagon = geo(new THREE.CylinderGeometry(1, 1, 1, 8));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const scratch = new THREE.Object3D();
  function staticMesh(g, m, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const key = g.uuid + m.uuid;
    if (!batches.has(key)) batches.set(key, { g, m, transforms: [] });
    scratch.position.set(x, y, z); scratch.scale.set(sx, sy, sz); scratch.rotation.set(rx, ry, rz);
    scratch.updateMatrix(); batches.get(key).transforms.push(scratch.matrix.clone());
  }
  function mesh(g, m, group, name) {
    const object = new THREE.Mesh(g, m); object.name = name; group.add(object); return object;
  }
  const glowMap = texture(128, 128, (ctx) => {
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "rgba(255,255,255,.8)");
    glow.addColorStop(.25, "rgba(255,255,255,.3)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 128, 128);
  });
  const shadow = mat(new THREE.MeshBasicMaterial({ map: glowMap, color: 0x000000, transparent: true, opacity: .55, depthWrite: false }));
  const windowGlow = mat(new THREE.MeshBasicMaterial({ map: glowMap, color: 0xd28caa, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false }));
  const candleMaterial = mat(new THREE.MeshBasicMaterial({ color: 0xffd49a }));
  const candleGlow = mat(new THREE.SpriteMaterial({ map: glowMap, color: 0xffba6b, transparent: true, opacity: .42, blending: THREE.AdditiveBlending, depthWrite: false }));
  const flameGeo = geo(new THREE.SphereGeometry(1, 8, 6));
  const flames = [];
  function flame(x, y, z) {
    staticMesh(octagon, bronze, x, y - .11, z, .17, .15, .17);
    staticMesh(flameGeo, candleMaterial, x, y + .07, z, .045, .14, .045);
    const glow = new THREE.Sprite(candleGlow); glow.position.set(x, y + .09, z); glow.scale.set(.68, .9, 1);
    glow.name = "Luz cálida de velas"; root.add(glow); flames.push(glow);
  }

  function arch(x, z, halfWidth, springY, peakY, material = paleStone, thickness = .12, rotation = 0) {
    // Two curved lancets meet at a pointed apex; local X/Y coordinates are rotated for side windows.
    for (const side of [-1, 1]) {
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(side * halfWidth, .25, 0),
        new THREE.Vector3(side * halfWidth, springY, 0),
        new THREE.Vector3(side * halfWidth, peakY - .6, 0),
        new THREE.Vector3(0, peakY, 0));
      staticMesh(geo(new THREE.TubeGeometry(curve, 26, thickness, 6, false)), material, x, 0, z, 1, 1, 1, 0, rotation);
    }
  }

  const vitralMap = texture(256, 512, (ctx) => {
    ctx.fillStyle = "#19152b"; ctx.fillRect(0, 0, 256, 512);
    const colors = ["#875d8d", "#c48e8d", "#527b8b", "#998267", "#614e78", "#a45876"];
    for (let row = -1; row < 9; row++) for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 64;
      ctx.beginPath(); ctx.moveTo(x, y - 38); ctx.lineTo(x + 33, y);
      ctx.lineTo(x, y + 38); ctx.lineTo(x - 33, y); ctx.closePath();
      ctx.fillStyle = colors[((row + 2) * 3 + col + 6) % colors.length]; ctx.fill();
      ctx.strokeStyle = "#211c28"; ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.strokeStyle = "#dfbc91"; ctx.lineWidth = 6;
    ctx.strokeRect(7, 7, 242, 498);
    ctx.beginPath(); ctx.moveTo(128, 8); ctx.lineTo(128, 504); ctx.moveTo(8, 320); ctx.lineTo(248, 320); ctx.stroke();
    for (const r of [55, 70]) { ctx.beginPath(); ctx.arc(128, 155, r, 0, TAU); ctx.stroke(); }
  });
  const vitralMaterial = mat(new THREE.MeshBasicMaterial({ map: vitralMap, color: 0xccb7d0, side: THREE.DoubleSide }));
  const windowShape = new THREE.Shape();
  windowShape.moveTo(-.85, 0); windowShape.lineTo(.85, 0); windowShape.lineTo(.85, 2.6);
  windowShape.bezierCurveTo(.85, 3.4, .4, 3.85, 0, 4.15);
  windowShape.bezierCurveTo(-.4, 3.85, -.85, 3.4, -.85, 2.6); windowShape.closePath();
  const windowGeo = geo(new THREE.ShapeGeometry(windowShape, 16));
  const windowUV = windowGeo.attributes.uv, windowPos = windowGeo.attributes.position;
  for (let i = 0; i < windowUV.count; i++) windowUV.setXY(i, (windowPos.getX(i) + .85) / 1.7, windowPos.getY(i) / 4.15);

  for (const side of [-1, 1]) {
    // Raised skirting and cornices keep the long walls from reading as featureless black planes.
    for (const [y, h, depth] of [[.2, .4, .36], [1.1, .12, .18], [7.9, .18, .28], [8.85, .3, .42]]) {
      staticMesh(box, y === 1.1 ? bronze : paleStone, side * 8.24, y, -23.3, depth, h, 72);
    }
    for (const z of [9, 0, -10, -22, -32, -47, -56]) {
      staticMesh(octagon, paleStone, side * 7.75, .2, z, .87, .4, .87);
      staticMesh(octagon, bronze, side * 7.75, .45, z, .74, .1, .74);
      staticMesh(octagon, paleStone, side * 7.75, 7.85, z, .73, .25, .73);
      for (const off of [-.3, .3]) staticMesh(octagon, paleStone, side * 7.75 + off, 4.1, z + .23, .1, 7.4, .1);
      staticMesh(plane, shadow, side * 7.75, .025, z, 2.5, 2.5, 1, -Math.PI / 2);
      const wz = z - 3.4;
      staticMesh(windowGeo, vitralMaterial, side * 8.32, 3.1, wz, 1, 1, 1, 0, -side * Math.PI / 2);
      // Smaller pointed surround starts at the sill.
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-.91, 0, 0), new THREE.Vector3(-.91, 2.6, 0),
        new THREE.Vector3(0, 4.25, 0), new THREE.Vector3(.91, 2.6, 0), new THREE.Vector3(.91, 0, 0),
      ]);
      staticMesh(geo(new THREE.TubeGeometry(curve, 30, .065, 6, false)), brass,
        side * 8.26, 3.1, wz, 1, 1, 1, 0, -side * Math.PI / 2);
      staticMesh(plane, windowGlow, side * 5.5, .035, wz - .4, 5, 4.2, 1, -Math.PI / 2, 0, side * .27);
      flame(side * 7.07, 2.65, z + .07);
      staticMesh(box, bronze, side * 7.43, 2.48, z, .75, .09, .12);
    }
    // Narrow aisle inlays, not bright lines cutting across the entire floor.
    for (const x of [2.3, 2.42]) staticMesh(box, bronze, side * x, .018, -23.3, .024, .018, 72);
  }
  for (const z of [9, 0, -10, -22, -32, -47, -56]) {
    arch(0, z, 7.65, 6.5, 9.2, paleStone, .16);
    arch(0, z - .18, 7.62, 6.5, 9.12, bronze, .045);
  }

  function pedestal(x, z, label, index = 0) {
    // Base stays inside the existing collision radius.
    staticMesh(octagon, paleStone, x, .1, z, .67, .2, .67);
    staticMesh(octagon, bronze, x, .24, z, .59, .07, .59);
    staticMesh(octagon, stoneMaterials.dark, x, .72, z, .5, .93, .5);
    for (let i = 0; i < 8; i++) {
      const angle = (i + .5) * TAU / 8;
      staticMesh(box, bronze, x + Math.sin(angle) * .465, .73, z + Math.cos(angle) * .465, .025, .72, .025);
    }
    staticMesh(octagon, paleStone, x, 1.22, z, .65, .14, .65);
    staticMesh(octagon, brass, x, 1.3, z, .59, .035, .59);
    staticMesh(plane, shadow, x, .026, z, 2.45, 2.45, 1, -Math.PI / 2);
    if (label) {
      const map = texture(512, 128, (ctx) => {
        ctx.fillStyle = "#15151e"; ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = "#968365"; ctx.lineWidth = 3; ctx.strokeRect(8, 8, 496, 112);
        ctx.fillStyle = "#bba586"; ctx.textAlign = "center"; ctx.font = "19px Georgia";
        ctx.fillText(["I", "II", "III"][index] ?? "✦", 256, 36);
        ctx.fillStyle = "#eee1cb"; ctx.font = "600 35px Georgia"; ctx.fillText(label.toUpperCase(), 256, 88);
      });
      staticMesh(plane, mat(new THREE.MeshBasicMaterial({ map })), x, .87, z + .505, .81, .203, 1);
    }
  }

  const sigils = [];
  function sigil(id, x, y, z, scale = 1, target = root, progressKind = "seals") {
    const group = new THREE.Group(); group.name = "Relicario / " + id; group.position.set(x, y, z);
    group.scale.setScalar(scale); target.add(group);
    const light = mat(new THREE.MeshBasicMaterial({ color: 0xdbac79, transparent: true, opacity: .9, side: THREE.DoubleSide }));
    const disk = mesh(geo(new THREE.RingGeometry(.47, .64, 64)), stoneMaterials.dark, group, "Disco de piedra tallada");
    disk.material = mat(stoneMaterials.dark.clone()); disk.material.side = THREE.DoubleSide;
    mesh(geo(new THREE.TorusGeometry(.645, .028, 8, 64)), brass, group, "Borde de latón");
    mesh(geo(new THREE.TorusGeometry(.472, .013, 6, 64)), bronze, group, "Borde interior");
    const orbit = new THREE.Group(); orbit.name = "Filamentos de frecuencia"; group.add(orbit);
    const arcGeo = geo(new THREE.TorusGeometry(.705, .012, 6, 32, TAU * .265));
    for (let n = 0; n < 3; n++) {
      const arc = mesh(arcGeo, light, orbit, "Arco segmentado"); arc.rotation.z = n * TAU / 3;
    }
    const ticks = [];
    for (let n = 0; n < 48; n++) {
      const a = n * TAU / 48, r = n % 4 ? .585 : .555;
      ticks.push(Math.cos(a) * r, Math.sin(a) * r, .022, Math.cos(a) * .61, Math.sin(a) * .61, .022);
    }
    const tickGeo = geo(new THREE.BufferGeometry()); tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(ticks, 3));
    group.add(new THREE.LineSegments(tickGeo, mat(new THREE.LineBasicMaterial({ color: 0xc4ab7e }))));
    const symbol = texture(256, 256, (ctx) => {
      ctx.strokeStyle = "#ffffff"; ctx.fillStyle = "#ffffff"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.translate(128, 128);
      if (id === "memoria") {
        for (const size of [88, 57, 23]) { ctx.save(); ctx.rotate(Math.PI / 4); ctx.strokeRect(-size / 2, -size / 2, size, size); ctx.restore(); }
        ctx.beginPath(); ctx.moveTo(0, -96); ctx.lineTo(0, -70); ctx.moveTo(0, 70); ctx.lineTo(0, 96); ctx.stroke();
      } else if (id === "tiempo") {
        ctx.beginPath(); ctx.moveTo(-58, -74); ctx.lineTo(58, -74); ctx.lineTo(-58, 74); ctx.lineTo(58, 74); ctx.closePath(); ctx.stroke();
        ctx.fillRect(-68, -87, 136, 5); ctx.fillRect(-68, 82, 136, 5);
        for (const y of [-27, -11, 9, 25]) { ctx.beginPath(); ctx.arc(0, y, 3, 0, TAU); ctx.fill(); }
      } else {
        ctx.beginPath(); ctx.moveTo(-93, 0); ctx.quadraticCurveTo(0, -99, 93, 0); ctx.quadraticCurveTo(0, 99, -93, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -85); ctx.lineTo(0, -61); ctx.moveTo(0, 61); ctx.lineTo(0, 85); ctx.stroke();
      }
    });
    const symbolMaterial = mat(new THREE.MeshBasicMaterial({ map: symbol, transparent: true, color: light.color, depthWrite: false, side: THREE.DoubleSide }));
    const icon = mesh(plane, symbolMaterial, group, "Glifo / " + id); icon.scale.set(1, 1, 1); icon.position.z = .025;
    const haloMaterial = mat(new THREE.SpriteMaterial({ map: glowMap, color: light.color, transparent: true, opacity: .13, depthWrite: false, blending: THREE.AdditiveBlending }));
    const halo = new THREE.Sprite(haloMaterial); halo.scale.set(1.65, 1.65, 1); group.add(halo);
    const heartMaterial = mat(new THREE.MeshStandardMaterial({ color: 0xdec5a5, emissive: 0x8f4839, emissiveIntensity: .45, roughness: .25, metalness: .7 }));
    const heart = mesh(geo(new THREE.OctahedronGeometry(.075)), heartMaterial, group, "Fragmento suspendido");
    heart.position.z = .08;
    const record = { id, group, orbit, light, symbolMaterial, haloMaterial, heart, heartMaterial, y, phase: sigils.length * 1.7, progressKind };
    sigils.push(record);
    return group;
  }

  function gateFrame(z, title) {
    arch(0, z + .69, 2.3, 4.7, 6.8, paleStone, .19);
    arch(0, z + .89, 2.48, 4.7, 7.05, brass, .047);
    for (const side of [-1, 1]) {
      staticMesh(octagon, paleStone, side * 2.4, .14, z + .6, .42, .28, .42);
      flame(side * 3.1, 2.3, z + .8);
      staticMesh(octagon, bronze, side * 3.1, 1.15, z + .8, .12, 2.2, .12);
    }
    const map = texture(1024, 128, (ctx) => {
      ctx.fillStyle = "#15131b"; ctx.fillRect(0, 0, 1024, 128);
      ctx.strokeStyle = "#a99370"; ctx.lineWidth = 2; ctx.strokeRect(8, 8, 1008, 112);
      ctx.fillStyle = "#deceb0"; ctx.textAlign = "center"; ctx.font = "32px Georgia"; ctx.fillText(title.toUpperCase(), 512, 76);
    });
    staticMesh(plane, mat(new THREE.MeshBasicMaterial({ map })), 0, 7.5, z + .61, 3.9, .488, 1);
  }

  const fog = createLowDriftingFog(root, [-4, -14, -25, -38, -51].flatMap((z, i) =>
    [-1, 1].map((side) => ({ x: side * 5.6, z, y: .32, width: 6.3, height: 1.2, opacity: .11, color: i % 2 ? 0x888caa : 0x967d91, driftX: .22 }))),
  { name: "Bruma baja de la catedral" });
  const motePositions = new Float32Array(100 * 3);
  for (let i = 0; i < 100; i++) {
    motePositions[i * 3] = Math.sin(i * 19.31) * 7;
    motePositions[i * 3 + 1] = .7 + ((i * .618033) % 1) * 6.5;
    motePositions[i * 3 + 2] = 10 - ((i * .381966) % 1) * 68;
  }
  const motes = new THREE.Group(); motes.name = "Polvo y cenizas de la catedral";
  const dustLayers = [0, 1, 2].map(i => {
    const geometry = geo(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(motePositions.slice(i * 33 * 3, (i + 1) * 33 * 3), 3));
    const material = mat(new THREE.PointsMaterial({ map: glowMap, color: i === 2 ? 0xe5d5b7 : 0xa8a4bb,
      size: [.035, .055, .075][i], transparent: true, opacity: [.3, .4, .55][i], depthWrite: false, blending: THREE.AdditiveBlending }));
    const points = new THREE.Points(geometry, material); motes.add(points); return points;
  });
  root.add(motes);
  let time = 0;
  return {
    pedestal, sigil, gateFrame,
    finish() {
      // Repeated architectural pieces are instanced to keep draw calls modest.
      for (const { g, m, transforms } of batches.values()) {
        const instance = new THREE.InstancedMesh(g, m, transforms.length);
        instance.name = "Catedral / detalles agrupados";
        transforms.forEach((matrix, i) => instance.setMatrixAt(i, matrix));
        instance.instanceMatrix.needsUpdate = true; instance.computeBoundingSphere(); root.add(instance);
      }
      batches.clear();
    },
    setQuality(profile) {
      dustLayers.forEach(points => points.geometry.setDrawRange(0, Math.floor(33 * profile.particleScale)));
      fog.root.children.forEach((cloud, i) => { cloud.visible = i < profile.fogBanks; });
    },
    setStoneTexture(map, bump) { paleStone.map = map; paleStone.bumpMap = bump; paleStone.bumpScale = .045; paleStone.needsUpdate = true; },
    update(dt, progress, paused, reducedMotion, camera) {
      if (!paused && !reducedMotion) time += dt;
      const vision = Boolean(progress?.visionActive);
      for (const s of sigils) {
        const active = s.progressKind === "memories" ? progress?.altarOpen : progress?.seals?.includes(s.id) ?? false;
        const color = active ? 0x91e8c7 : vision ? 0xb6b8ed : 0xe4ae82;
        s.light.color.setHex(color); s.symbolMaterial.color.setHex(color); s.haloMaterial.color.setHex(color);
        s.haloMaterial.opacity = active ? .2 : .1;
        s.light.opacity = active ? 1 : s.progressKind === "memories" ? .2 + (progress?.memories?.length || 0) * .15 : .78;
        s.heartMaterial.emissive.setHex(color); s.heartMaterial.emissiveIntensity = active ? .65 : .25;
        s.orbit.rotation.z = time * .11 + s.phase;
        s.group.position.y = s.y + Math.sin(time * .9 + s.phase) * .035;
        s.heart.rotation.y = time * .4;
      }
      flames.forEach((f, i) => f.scale.setScalar(.72 + .035 * Math.sin(time * 3 + i)));
      dustLayers.forEach((points, i) => {
        points.position.y = Math.sin(time * (.11 + i * .03) + i) * .16;
        points.position.x = Math.sin(time * .07 + i * 2) * .12;
        points.material.color.setHex(vision ? 0x89d9c8 : i === 2 ? 0xe5d5b7 : 0xa8a4bb);
      });
      fog.update(dt, reducedMotion, paused, camera);
    },
    dispose() {
      geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); textures.forEach((t) => t.dispose());
      const fogMaps = new Set();
      fog.root.children.forEach((cloud) => { if (cloud.material?.map) fogMaps.add(cloud.material.map); cloud.material?.dispose(); });
      fogMaps.forEach((t) => t.dispose()); root.removeFromParent();
    },
  };
}
