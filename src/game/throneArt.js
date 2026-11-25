import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createOrbGlowTexture, createOrbHalo, createPlasmaOrb } from "./neonOrbVisuals.js";
import { createThroneAtmosphere } from "./throneAtmosphere.js";
import { createStoreInvasionVision } from "./storeInvasionVision.js";
import { THRONE_VOWS, THRONE_CONDUCTORS } from "./throneQuest.js";
import { THRONE_ARENA_COLUMNS } from "./throneLayout.js";

const TAU = Math.PI * 2;
const FLOOR_URL = new URL("../assets/environments/bridge-stone.chapter11.jpg", import.meta.url).href;
const STONE_URL = new URL("../assets/environments/basalt.chapter11.jpg", import.meta.url).href;
const METAL_URL = new URL("../assets/environments/ferry-iron.chapter11.jpg", import.meta.url).href;
const SHIELD_POSITIONS = [[-8, -67], [8, -67], [0, -60]];

// Art owns its materials; navigation and puzzle state remain in throneScenery.
export function createThroneArt(scene, root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const pending = [];
  let disposed = false, time = 0;
  const geo = (value) => { geometries.add(value); return value; };
  const mat = (value) => { materials.add(value); return value; };
  function load(url) {
    let finish;
    pending.push(new Promise((resolve) => { finish = resolve; }));
    const map = new THREE.TextureLoader().load(url, (loaded) => {
      if (disposed) loaded.dispose();
      finish();
    }, undefined, () => finish());
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
    map.colorSpace = THREE.SRGBColorSpace; textures.add(map);
    return map;
  }
  const floorMap = load(FLOOR_URL), stoneMap = load(STONE_URL), ironMap = load(METAL_URL);
  const glowMap = createOrbGlowTexture(); textures.add(glowMap);
  const material = {
    platform: mat(new THREE.MeshStandardMaterial({ map: floorMap, bumpMap: floorMap, bumpScale: .085, color: 0x85858c, roughness: .87, metalness: .04 })),
    stone: mat(new THREE.MeshStandardMaterial({ map: stoneMap, bumpMap: stoneMap, bumpScale: .055, color: 0x979aa6, roughness: .83, metalness: .08 })),
    obsidian: mat(new THREE.MeshStandardMaterial({ map: stoneMap, bumpMap: stoneMap, bumpScale: .025, color: 0x424550, roughness: .46, metalness: .34 })),
    gold: mat(new THREE.MeshStandardMaterial({ map: ironMap, bumpMap: ironMap, bumpScale: .008, color: 0xc8aa72, roughness: .38, metalness: .73 })),
    recess: mat(new THREE.MeshStandardMaterial({ color: 0x10131c, roughness: .91 })),
    red: mat(new THREE.MeshPhysicalMaterial({ color: 0x6c233d, emissive: 0xb82e51, emissiveIntensity: .48, roughness: .17, metalness: .22, clearcoat: 1, transparent: true, opacity: .58, depthWrite: false })),
    violet: mat(new THREE.MeshPhysicalMaterial({ color: 0x9c80c7, emissive: 0xaa7aef, emissiveIntensity: 1.2, roughness: .17, metalness: .22, clearcoat: 1, transparent: true, opacity: .8, depthWrite: false })),
    cyan: mat(new THREE.MeshPhysicalMaterial({ color: 0x799caa, emissive: 0x479eab, emissiveIntensity: .8, roughness: .14, metalness: .22, clearcoat: 1, transparent: true, opacity: .58, depthWrite: false })),
    darkGlass: mat(new THREE.MeshPhysicalMaterial({ color: 0x587483, metalness: .65, roughness: .15, clearcoat: 1 })),
  };
  const geometry = {
    box: geo(new THREE.BoxGeometry(1, 1, 1)),
    bevel: geo(new RoundedBoxGeometry(1, 1, 1, 2, .035)),
    cylinder: geo(new THREE.CylinderGeometry(1, 1, 1, 32)),
    sphere: geo(new THREE.SphereGeometry(1, 24, 16)),
    crystal: geo(new THREE.OctahedronGeometry(1)),
    torus: geo(new THREE.TorusGeometry(1, .018, 8, 64)),
    plane: geo(new THREE.PlaneGeometry(1, 1)),
  };
  function add(g, m, x, y, z, sx = 1, sy = 1, sz = 1, parent = root, dynamic = false) {
    const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.userData.throneStatic = !dynamic; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  const box = (m, x, y, z, sx, sy, sz, parent = root) => add(geometry.bevel, m, x, y, z, sx, sy, sz, parent);
  const cylinder = (m, x, y, z, radius, height, parent = root) => add(geometry.cylinder, m, x, y, z, radius, height, radius, parent);
  function ring(m, x, y, z, radius, parent = root, dynamic = false) {
    const mesh = add(geometry.torus, m, x, y, z, radius, radius, radius, parent, dynamic);
    mesh.rotation.x = Math.PI / 2; return mesh;
  }
  function canvasTexture(w, h, draw) {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d"), w, h);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    textures.add(map); return map;
  }
  function plaque(parent, text, x, y, z, width = 1.14) {
    const map = canvasTexture(512, 128, (ctx) => {
      ctx.fillStyle = "#191c24"; ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#aa936d"; ctx.lineWidth = 3; ctx.strokeRect(9, 9, 494, 110);
      ctx.fillStyle = "#e5d9c1"; ctx.textAlign = "center"; ctx.font = '600 33px "Segoe UI", Arial, sans-serif';
      ctx.fillText(text, 256, 77, 450);
      for (const px of [22, 490]) { ctx.beginPath(); ctx.arc(px, 64, 3, 0, TAU); ctx.fill(); }
    });
    box(material.gold, x, y, z, width + .07, width / 4 + .05, .05, parent);
    return add(geometry.plane, mat(new THREE.MeshStandardMaterial({ map, roughness: .6, metalness: .25 })),
      x, y, z + .031, width, width / 4, 1, parent);
  }
  const shadowMaterial = mat(new THREE.MeshBasicMaterial({ map: glowMap, color: 0x000000, transparent: true, opacity: .7, depthWrite: false }));
  function contact(x, z, size) {
    const shadow = add(geometry.plane, shadowMaterial, x, .066, z, size, size, 1);
    shadow.rotation.x = -Math.PI / 2; shadow.userData.throneStatic = false;
  }
  function stoneUV(g, x, z, size = 3.8) {
    const { position, normal, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) {
      const px = position.getX(i), py = position.getY(i), pz = position.getZ(i);
      if (Math.abs(normal.getY(i)) > .5) uv.setXY(i, (px + x) / size, (pz + z) / size);
      else if (Math.abs(normal.getX(i)) > .5) uv.setXY(i, (pz + z) / size, py / size);
      else uv.setXY(i, (px + x) / size, py / size);
    }
    return geo(g);
  }
  function slab(x, z, w, d, y = -.25, h = .6) {
    return add(stoneUV(new RoundedBoxGeometry(w, h, d, 1, .055), x, z), material.platform, x, y, z);
  }
  slab(0, -3, 18, 33); slab(0, -34, 16.4, 31); slab(0, -56, 8, 13);
  add(stoneUV(new THREE.CylinderGeometry(18.7, 18.7, .65, 96), 0, -76), material.platform, 0, -.32, -76);
  // Solid, stepped slab edges and restrained brass inlays establish real scale.
  for (const [z, w, d] of [[-3, 18, 33], [-34, 16.4, 31], [-56, 8, 13]]) {
    for (const side of [-1, 1]) {
      box(material.obsidian, side * (w / 2 - .12), -.1, z, .24, .3, d);
      box(material.gold, side * (w / 2 - .27), .058, z, .035, .024, d);
      for (const x of [2.7, 2.76]) box(material.gold, side * x, .059, z, .017, .012, d);
    }
  }
  for (const radius of [16.8, 17, 11.8]) {
    const inlay = add(geo(new THREE.RingGeometry(radius-.022, radius+.022, 128)), material.gold, 0, .016, -76);
    inlay.rotation.x = -Math.PI / 2;
  }
  const arenaMap = canvasTexture(1024, 1024, (ctx) => {
    ctx.translate(512, 512); ctx.strokeStyle = "rgba(186,158,108,.48)"; ctx.lineWidth = 2;
    for (const r of [280,302,408,430]) { ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke(); }
    for (let i=0;i<72;i++) { ctx.save();ctx.rotate(i*TAU/72);ctx.beginPath();ctx.moveTo(0,410);ctx.lineTo(0,i%6?421:430);ctx.stroke();ctx.restore(); }
    for (const offset of [0,Math.PI]) { ctx.beginPath();for(let i=0;i<=3;i++){const a=i*TAU/3+offset;const x=Math.sin(a)*280,y=Math.cos(a)*280;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke(); }
  });
  const arenaSeal = add(geometry.plane, mat(new THREE.MeshStandardMaterial({map:arenaMap,transparent:true,depthWrite:false,roughness:.67,metalness:.4})),0,.018,-76,16,16,1,root,true);
  arenaSeal.rotation.x = -Math.PI / 2;

  const plinthGeo = geo(new THREE.LatheGeometry([[0,0],[.9,0],[.98,.06],[.98,.15],[.85,.23],
    [.79,.28],[.77,.38],[.7,.43],[.67,1.04],[.83,1.1],[.86,1.19],[.8,1.25],[0,1.25]]
    .map(([r,y]) => new THREE.Vector2(r,y)), 40));
  function pedestal(x, z, label = "", scale = 1) {
    add(plinthGeo, material.obsidian, x, .05, z, scale, scale, scale);
    for (const y of [.24, .44, 1.12]) ring(material.gold, x, y * scale + .05, z, (y < .3 ? .88 : y < 1 ? .7 : .83) * scale);
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      cylinder(material.gold, x + Math.sin(a) * .7 * scale, .78 * scale, z + Math.cos(a) * .7 * scale, .015 * scale, .57 * scale);
    }
    if (label) plaque(root, label, x, .75 * scale, z + .72 * scale, 1.02 * scale);
    contact(x, z, 2.9 * scale);
  }
  function column(x, z, height = 7.6, radius = .63) {
    cylinder(material.stone, x, height / 2, z, radius, height);
    for (const [y, r, h] of [[.12, 1.15, .24],[.35, 1.02, .16],[height-.28, 1.13, .22],[height, 1.22, .22]])
      cylinder(material.obsidian, x, y, z, radius * r, h);
    for (const y of [.45, height - .48, height - .08]) ring(material.gold, x, y, z, radius * 1.04);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      cylinder(material.obsidian, x + Math.sin(a) * radius * .88, height / 2, z + Math.cos(a) * radius * .88, radius * .15, height - 1);
    }
    contact(x, z, radius * 4);
  }
  for (const [x,z] of [[-8,7],[8,7],[-8,-12],[8,-12],[-7.5,-24],[7.5,-24],[-7.5,-43],[7.5,-43]]) column(x,z);
  for (const { x, z, radius } of THRONE_ARENA_COLUMNS) column(x, z, 8.8, radius);
  // Distant basalt spires give the abyss depth without adding walkable obstacles.
  const cragGeo=geo(new THREE.CylinderGeometry(.48,1,1,7,3));
  const cragPositions=cragGeo.attributes.position;
  for(let i=0;i<cragPositions.count;i++) {
    const x=cragPositions.getX(i),y=cragPositions.getY(i),z=cragPositions.getZ(i);
    const grain=1+.12*Math.sin(x*8.1+z*6.3+y*11.7);
    cragPositions.setXYZ(i,x*grain,y+.06*Math.sin(x*7+z*5),z*grain);
  }
  cragGeo.computeVertexNormals();
  for(let i=0;i<36;i++) {
    const side=i%2?1:-1,z=19-Math.floor(i/2)*8.1,height=4+(i*7.73)%13;
    const rock=add(cragGeo,material.stone,side*(24+(i*3.17)%22),height/2-2.2,z,2+(i%3),height,2.4+(i%4));
    rock.rotation.y=i*2.39;rock.rotation.z=side*.05;
  }
  function pointedArch(z, width = 4.5, peak = 9.5) {
    for (const side of [-1, 1]) {
      box(material.stone, side * width, 4.15, z, .95, 8.3, 1.25);
      box(material.obsidian, side * width, .24, z, 1.3, .48, 1.55);
      for (const dx of [-.32, .32]) cylinder(material.gold, side * width + dx, 4.2, z + .67, .035, 8.1);
      const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(side*width,5.8,0),
        new THREE.Vector3(side*width,7.6,0),new THREE.Vector3(side*2.5,peak-.3,0),new THREE.Vector3(0,peak,0));
      add(geo(new THREE.TubeGeometry(curve, 32, .32, 8, false)), material.obsidian, 0, 0, z);
      add(geo(new THREE.TubeGeometry(curve, 32, .048, 6, false)), material.gold, 0, 0, z + .35);
    }
  }
  for (const z of [-16.7,-49,-93.5]) pointedArch(z);

  function seal(parent, x, y, z, radius, id) {
    const group = new THREE.Group(); group.position.set(x,y,z); parent.add(group);
    for (const r of [1,.8]) { const rim = ring(material.gold,0,0,0,radius*r,group); rim.rotation.x=0; }
    for (let i=0;i<32;i++) {
      const a=i*TAU/32, mark=box(material.gold,Math.sin(a)*radius*.91,Math.cos(a)*radius*.91,.02,.018,radius*.1,.025,group);
      mark.rotation.z=-a;
    }
    const glyphMap = canvasTexture(256,256,(ctx)=>{
      ctx.translate(128,128); ctx.strokeStyle="#d7c29c"; ctx.lineWidth=5;
      if(id==="memoria") for(const r of [61,37,14]) { ctx.beginPath(); ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.stroke(); }
      else if(id==="libertad") { ctx.beginPath();ctx.moveTo(0,65);ctx.lineTo(0,-58);ctx.moveTo(-64,-32);ctx.lineTo(0,13);ctx.lineTo(64,-32);ctx.moveTo(-64,-57);ctx.lineTo(0,-12);ctx.lineTo(64,-57);ctx.stroke(); }
      else { ctx.beginPath();ctx.moveTo(0,-66);ctx.lineTo(37,38);ctx.lineTo(0,16);ctx.lineTo(-37,38);ctx.closePath();ctx.stroke();ctx.strokeRect(-48,53,96,5); }
    });
    const glyph = add(geometry.plane,mat(new THREE.MeshBasicMaterial({map:glyphMap,transparent:true,depthWrite:false})),0,0,.035,radius*1.45,radius*1.45,1,group,true);
    return { group, glyph };
  }
  // Decoded marks use the original puzzle glyphs, enlarged and lit independently of the scene.
  const signalMaterial = mat(new THREE.MeshBasicMaterial({
    color: 0x92ffd0, transparent: true, opacity: .8, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  // A revealed focus can sit between the avatar and the camera; fade its rim before it fills the view.
  signalMaterial.onBeforeCompile = shader => {
    shader.vertexShader = "varying float vSignalDepth;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>",
      "#include <project_vertex>\nvSignalDepth = -mvPosition.z;");
    shader.fragmentShader = "varying float vSignalDepth;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>",
      "diffuseColor.a *= smoothstep(.8, 2.6, vSignalDepth);\n#include <opaque_fragment>");
  };
  signalMaterial.customProgramCacheKey = () => "throne-signal-near-fade-v1";
  const signalField = mat(new THREE.MeshBasicMaterial({
    color: 0x031810, transparent: true, opacity: .82, depthWrite: false, side: THREE.DoubleSide,
  }));
  const signalDisk = geo(new THREE.CircleGeometry(.59, 48));
  function decodedSigil(map, x, y, z, size) {
    const group = new THREE.Group();
    group.position.set(x, y, z); group.userData.throneDynamic = true; root.add(group);
    const glyphMaterial = mat(new THREE.MeshBasicMaterial({
      alphaMap: map, color: 0xecfff7, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false,
    }));
    add(signalDisk, signalField, 0, 0, -.025, size, size, 1, group, true);
    add(geometry.plane, glyphMaterial, 0, 0, .025, size, size, 1, group, true);
    const frame = ring(signalMaterial, 0, 0, 0, size * .6, group, true); frame.rotation.x = 0;
    const halo = createOrbHalo(glowMap, 0x65ffc3, size * 2.4, .22);
    mat(halo.material); group.add(halo);
    group.visible = false;
    return group;
  }
  const barrierMaterials = [];
  function gate(z, color) {
    const group=new THREE.Group();group.position.set(0,0,z);group.userData.throneDynamic=true;root.add(group);
    for(const side of [-1,1]) {
      box(material.obsidian,side*1.75,3.2,0,3.46,6.35,.34,group);
      box(material.gold,side*3.42,3.2,.21,.07,6.3,.08,group);
      for(const yy of [.4,1.1,5.6,6.1]) box(material.gold,side*1.76,yy,.21,3.28,.055,.06,group);
      for(const xx of [.27,1.4,2.7]) box(material.stone,side*xx,3.4,.21,.12,4.55,.16,group);
    }
    seal(group,0,3.25,.32,1.18,"memoria");
    const energy=mat(new THREE.ShaderMaterial({
      uniforms:{time:{value:0},tint:{value:new THREE.Color(color)}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){
        vec2 p=vUv-.5;float edge=pow(abs(p.x)*2.,8.);
        float ripple=pow(.5+.5*sin(p.y*72.+sin(p.x*18.+time*.4)*2.-time*.6),18.);
        float seam=exp(-abs(p.x)*95.);float a=(edge*.3+ripple*.045+seam*.44)*(1.-smoothstep(.44,.5,abs(p.y)));
        gl_FragColor=vec4(tint,a);}`,
    }));barrierMaterials.push(energy);
    add(geometry.plane,energy,0,3.2,.44,6.92,6.35,1,group,true);
    return group;
  }
  const hallGate=gate(-17.7,0xeaa08c),coreGate=gate(-49.5,0xa998ed);

  // Carved robes use actual folds, a hood and arms instead of scaled spheres.
  const robeGeo=geo(new THREE.LatheGeometry([[.65,0],[.67,.08],[.61,.23],[.53,.7],[.42,1.25],[.44,1.65],[.61,1.95],[.42,2.13],[.19,2.22]]
    .map(([r,y])=>new THREE.Vector2(r,y)),48));
  const pos=robeGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),a=Math.atan2(z,x);
    const fold=1+Math.sin(a*14+y*.9)*(.045+(2.2-y)*.019);
    pos.setXYZ(i,x*fold,y,z*fold);
  }robeGeo.computeVertexNormals();
  const statues=THRONE_VOWS.map((id)=>{
    const x=id==="memoria"?0:id==="libertad"?-5.8:5.8,z=id==="memoria"?-6.5:-4.7;
    pedestal(x,z,id.toUpperCase());
    const body=add(robeGeo,material.stone,x,1.29,z); body.castShadow = true;
    const hood=add(geometry.sphere,material.stone,x,3.6,z,.35,.45,.35); hood.castShadow = true;
    add(geometry.sphere,material.recess,x,3.57,z+.26,.235,.3,.12);
    add(geometry.sphere,material.stone,x,3.56,z+.31,.14,.22,.095);
    box(material.stone,x,3.52,z+.4,.055,.115,.08);
    for(const side of [-1,1]) {
      const arm=cylinder(material.stone,x+side*.42,2.92,z+.21,.16,.72);arm.rotation.z=side*.42;arm.castShadow=true;
      const forearm=cylinder(material.stone,x+side*.29,2.59,z+.36,.13,.54);forearm.rotation.z=side*-1.05;forearm.castShadow=true;
      add(geometry.sphere,material.stone,x+side*.12,2.55,z+.43,.14,.105,.1);
    }
    if(id==="memoria") { const book=box(material.gold,x,2.58,z+.52,.52,.34,.12);book.rotation.x=-.25;box(material.stone,x,2.58,z+.61,.44,.27,.05); }
    else if(id==="voluntad") {box(material.gold,x,2.15,z+.6,.075,1.12,.07);box(material.gold,x,2.65,z+.6,.48,.07,.1);}
    else {for(const side of [-1,1]) {const wing=box(material.gold,x+side*.2,2.62,z+.54,.37,.055,.085);wing.rotation.z=side*.45;}}
    const sign=seal(root,x,1.63,z+.69,.26,id);
    // The original puzzle colors are retained in a small cut gemstone.
    const rune=add(geometry.crystal,material.red,x,1.63,z+.76,.075,.075,.04,root,true);
    const decoded = decodedSigil(sign.glyph.material.map, x, 3.02, z + .82, 1.05);
    return {id,rune,body,hood,sign,decoded};
  });
  box(material.obsidian,0,.45,5.9,2.4,.9,1.2);
  box(material.gold,0,.94,5.9,2.32,.055,1.14);
  plaque(root,"LOS TRES JURAMENTOS",0,.54,6.52,2.12);
  const oathGlyphs=THRONE_VOWS.map((id,i)=>{
    return decodedSigil(statues.find(statue => statue.id === id).sign.glyph.material.map, (i-1)*.72, 1.52, 6.1, .5);
  });
  const plasma=[];
  function orb(x,y,z,r,color=0xb99ad8) {
    const fx=createPlasmaOrb({radius:r,texture:glowMap,phase:plasma.length*1.3});
    fx.setPalette({accent:color,deep:0x101527,glow:color,arc:0xe6d2ac});
    fx.root.position.set(x,y,z);root.add(fx.root);plasma.push(fx);return fx.root;
  }
  const conductors=THRONE_CONDUCTORS.map((id,i)=>{
    const [x,z]=[[-5.5,-31.5],[0,-36.5],[5.5,-31.5]][i];pedestal(x,z,id.toUpperCase());
    const crystal=add(geometry.crystal,material.red,x,2.15,z,.35,.65,.35,root,true);
    const nucleus=orb(x,2.15,z,.24,0xc57890);nucleus.scale.set(1,1.6,1);
    const energy=plasma[plasma.length-1];
    const etching=new THREE.LineSegments(geo(new THREE.EdgesGeometry(geometry.crystal)),mat(new THREE.LineBasicMaterial({color:0xc8b497,transparent:true,opacity:.45})));
    etching.position.set(x,2.15,z);etching.scale.set(.354,.654,.354);root.add(etching);
    const halo=ring(material.gold,x,2.15,z,.8,root,true);halo.rotation.set(.18,.2,0);
    const inner=ring(material.gold,x,2.15,z,.62);inner.rotation.set(.3,1.1,0);
    for(const side of [-1,1]) add(geometry.crystal,material.gold,x,2.15+side*.8,z,.13,.22,.13);
    contact(x,z,3);return {id,x,z,crystal,halo,energy,etching};
  });
  pedestal(0,-28,"REFLECTOR",.9);
  const reflector=new THREE.Group();reflector.position.set(0,1.8,-28);reflector.userData.throneDynamic=true;root.add(reflector);
  box(material.gold,0,0,0,1.29,1.52,.12,reflector);
  box(material.darkGlass,0,0,.08,1.14,1.35,.09,reflector);
  seal(reflector,0,0,.15,.46,"libertad");
  box(material.darkGlass,0,0,-.08,1.14,1.35,.09,reflector);
  const reverseSeal=seal(reflector,0,0,-.15,.46,"libertad").group;reverseSeal.rotation.y=Math.PI;
  const lensMap=canvasTexture(512,512,(ctx)=>{
    ctx.strokeStyle="rgba(139,215,231,.6)";ctx.lineWidth=2;ctx.translate(256,256);
    for(let i=0;i<17;i++){const yy=(i-8)*24;ctx.beginPath();ctx.moveTo(-210,yy);ctx.bezierCurveTo(-60,yy-35,60,yy+35,210,yy);ctx.stroke();}
    ctx.strokeStyle="rgba(222,235,231,.75)";ctx.strokeRect(-220,-230,440,460);
  });
  const lensMaterial=mat(new THREE.MeshBasicMaterial({map:lensMap,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));
  for(const side of [-1,1]){const lens=add(geometry.plane,lensMaterial,0,0,side*.14,1.1,1.3,1,reflector,true);lens.rotation.y=side<0?Math.PI:0;}
  const energyBeams=conductors.map(({x,z})=>{
    const start=new THREE.Vector3(0,1.7,-28),end=new THREE.Vector3(x,2.15,z);
    const beamMaterial=mat(new THREE.MeshBasicMaterial({
      color:0x91ffe0,transparent:true,opacity:.55,depthWrite:false,
      blending:THREE.AdditiveBlending,toneMapped:false,
    }));
    const beam=add(geometry.cylinder,beamMaterial,(x)/2,1.925,(-28+z)/2,.025,start.distanceTo(end),.025,root,true);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());beam.visible=false;return beam;
  });
  box(material.obsidian,-6.2,.7,-23.2,1.5,1.4,1.1);plaque(root,"NÚCLEO FRACTURADO",-6.2,1,-22.63,1.35);

  // Monumental chair: stepped foundation, seat, armrests and a fluted crown.
  for(let i=0;i<3;i++) box(material.obsidian,0,.2+i*.33,-92,8-i*.45,.38,4.3-i*.33);
  box(material.stone,0,1.42,-92,6.8,.8,3.15);
  box(material.obsidian,0,5,-93.2,6.7,7.7,.65);
  for(const x of [-2.8,2.8]) { box(material.obsidian,x,2.2,-91.65,.55,2.3,3.1);box(material.gold,x,3.38,-91.65,.59,.09,3.1); }
  for(let i=-3;i<=3;i++) {const h=7.3-Math.abs(i)*.5;box(material.stone,i*.82,2.2+h/2,-92.77,.42,h,.3);add(geometry.crystal,material.gold,i*.82,2.35+h,-92.77,.22,.55,.22);}
  seal(root,0,6.3,-92.35,1.5,"voluntad");
  const temporalCore=orb(0,4.2,-89,.85);
  const crown=seal(root,0,4.2,-89.2,1.35,"memoria").group;
  crown.userData.throneDynamic=true;
  const futureMap=canvasTexture(512,512,(ctx)=>{
    ctx.strokeStyle="#a5d8e3";ctx.lineWidth=3;ctx.translate(256,240);
    ctx.beginPath();ctx.moveTo(-22,140);ctx.lineTo(-22,-120);ctx.lineTo(0,-164);ctx.lineTo(22,-120);ctx.lineTo(22,140);ctx.closePath();ctx.stroke();
    for(let i=0;i<7;i++)ctx.strokeRect(-110+i*32,70-(i%3)*24,22,70+(i%3)*24);
    ctx.font='600 23px "Segoe UI", Arial, sans-serif';ctx.textAlign="center";ctx.fillStyle="#c8eff5";ctx.fillText("BUENOS AIRES / 2049",0,218);
  });
  const futureProjection=add(geometry.plane,mat(new THREE.MeshBasicMaterial({map:futureMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})),0,4,-87.6,4.2,4.2,1,root,true);
  futureProjection.visible=false;
  const shieldNodes=THRONE_CONDUCTORS.map((id,i)=>{
    const [x,z]=SHIELD_POSITIONS[i];pedestal(x,z,"",.68);
    const core=orb(x,1.85,z,.34,0x9fffe0);
    const halo=ring(signalMaterial,x,1.85,z,.78,root,true);halo.rotation.x=0;
    return{id,x,z,core,halo,revealUntil:0};
  });
  const projectiles=Array.from({length:5},(_,i)=>{
    const shot=orb(0,1.5,-77,.23,i%2?0xf19b69:0xe77853);
    shot.visible=false;
    return shot;
  });
  function warning(radius) {
    const map=canvasTexture(256,256,(ctx)=>{
      ctx.strokeStyle="#f4ac82";ctx.lineWidth=3;ctx.translate(128,128);
      for(const r of [88,110]){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();}
      for(let i=0;i<24;i++){ctx.rotate(TAU/24);ctx.fillStyle="#ec7d55";ctx.fillRect(-2,96,4,8);}
    });
    const mesh=add(geo(new THREE.PlaneGeometry(2.4,2.4)),mat(new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),0,.08,-76,radius,radius,1,root,true);
    mesh.rotation.x=-Math.PI/2;mesh.visible=false;return mesh;
  }
  const attackMark=warning(1.1),hazard=warning(2.5);
  const atmosphere=createThroneAtmosphere(scene,root);
  // Batch fixed carvings and fittings by material/geometry, preserving dynamic puzzle parts.
  root.updateMatrixWorld(true);
  const batches=new Map(), originals=[];
  root.traverse((object)=>{
    if(!object.isMesh||!object.userData.throneStatic)return;
    for(let p=object.parent;p&&p!==root;p=p.parent)if(p.userData.throneDynamic)return;
    const receiveShadow=object.material===material.platform||object.castShadow;
    const key=object.geometry.uuid+object.material.uuid+String(object.castShadow)+String(receiveShadow);
    if(!batches.has(key))batches.set(key,{g:object.geometry,m:object.material,castShadow:object.castShadow,receiveShadow,transforms:[]});
    batches.get(key).transforms.push(object.matrixWorld.clone());originals.push(object);
  });
  for(const {g,m,castShadow,receiveShadow,transforms} of batches.values()){
    const mesh=new THREE.InstancedMesh(g,m,transforms.length);mesh.name="Trono / arquitectura agrupada";
    mesh.castShadow=castShadow;mesh.receiveShadow=receiveShadow;
    transforms.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;root.add(mesh);
  }
  originals.forEach((object)=>object.removeFromParent());
  // Reuse the bridge's Matrix code on opaque architecture after instancing.
  // Brass, lettering, actors and puzzle effects retain their contrast.
  const codeVision = createStoreInvasionVision(scene);
  const codedMaterials = new Set([material.platform, material.stone, material.obsidian, material.recess]);
  root.traverse(object => {
    if (object.isMesh && codedMaterials.has(object.material))
      codeVision.register(object, object.material === material.platform ? "bridge" : "world");
  });
  return {
    material,geometry,add,box,cylinder,ring,hallGate,coreGate,statues,oathGlyphs,conductors,reflector,energyBeams,
    temporalCore,futureProjection,shieldNodes,projectiles,attackMark,hazard,
    makeShield(parent){
      const shader=mat(new THREE.ShaderMaterial({
        uniforms:{time:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
        vertexShader:`varying vec3 n;varying vec3 v;varying vec3 p;void main(){vec4 w=modelMatrix*vec4(position,1.);n=normalize(mat3(modelMatrix)*normal);v=cameraPosition-w.xyz;p=position;gl_Position=projectionMatrix*viewMatrix*w;}`,
        fragmentShader:`varying vec3 n;varying vec3 v;varying vec3 p;uniform float time;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),2.8);float bands=pow(.5+.5*sin(p.y*37.-time),24.);gl_FragColor=vec4(.45,.49,.85,rim*.42+bands*.04);}`,
      }));barrierMaterials.push(shader);
      return add(geometry.sphere,shader,0,2.1,0,2.5,2.5,2.5,parent,true);
    },
    loadAssets:()=>Promise.all(pending),
    update(dt,p,player,paused,reducedMotion){
      if(!paused&&!reducedMotion)time+=Math.min(dt,.05);
      barrierMaterials.forEach((m)=>{m.uniforms.time.value=time;});
      conductors.forEach((node)=>{
        const active=p.conductors?.includes(node.id),color=active?0x7ecad7:p.visionActive?0xddc4ff:0xc57890;
        node.energy.setPalette({accent:color,deep:0x101527,glow:color,arc:p.visionActive?0xf0e5ff:0xe6d2ac});
        node.etching.material.opacity=p.visionActive ? .9 : .45;
        node.etching.material.color.setHex(p.visionActive?0xe8d9ff:0xc8b497);
      });
      plasma.forEach((fx)=>{if(fx.root.visible)fx.update(time,.7);});
      crown.visible=Boolean(p.bossDefeated||p.completed);
      atmosphere.update(dt,paused,reducedMotion,player);
      codeVision.update(paused?0:Math.min(dt,.05),Boolean(p.visionActive),player,reducedMotion);
    },
    dispose(){disposed=true;codeVision.dispose();atmosphere.dispose();textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());},
  };
}
