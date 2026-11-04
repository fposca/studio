import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createLowDriftingFog } from "./lowDriftingFog.js";

function randomSequence(seed = 9409) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function box(parent, material, size, position, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.rotation.set(...rotation);
  mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function cable(parent, material, points, radius = .022) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, radius, 5, false), material);
  parent.add(mesh); return mesh;
}
function polygon(parent, material, points, position, rotation = [0, 0, 0]) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.position.set(...position); mesh.rotation.set(...rotation); parent.add(mesh); return mesh;
}
function batchStatic(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), batches = new Map(), originals = new Set();
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const part = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    part.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
    if (!batches.has(mesh.material)) batches.set(mesh.material, []);
    batches.get(mesh.material).push(part); originals.add(mesh.geometry);
  });
  root.clear();
  for (const [material, parts] of batches) {
    const mesh = new THREE.Mesh(mergeGeometries(parts), material);
    mesh.castShadow = !material.transparent; mesh.receiveShadow = true; root.add(mesh);
    parts.forEach(part => part.dispose());
  }
  originals.forEach(geometry => geometry.dispose());
}
function crackTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const c = canvas.getContext("2d"), random = randomSequence(810);
  c.clearRect(0, 0, 512, 512);
  const branch = (x, y, angle, steps, width) => {
    c.beginPath(); c.moveTo(x, y);
    const forks = [];
    for (let i = 0; i < steps; i++) {
      angle += (random() - .5) * .8;
      x += Math.cos(angle) * (13 + random() * 19); y += Math.sin(angle) * (13 + random() * 19);
      c.lineTo(x, y); if (i === 3 || i === 6) forks.push([x, y, angle + (random() > .5 ? 1 : -1)]);
    }
    c.strokeStyle = "#08070b"; c.lineWidth = width; c.stroke();
    c.strokeStyle = "#b6a5ad70"; c.lineWidth = .9; c.stroke();
    if (width > 2) for (const fork of forks) branch(...fork, 4, 1.4);
  };
  for (let i = 0; i < 6; i++) branch(248, 248, i * 1.06, 9, 3.8);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

export function createInvadedStoreDamage(shop) {
  const root = new THREE.Group(); root.name = "Tienda INVADIDA / derrumbe y corrupcion"; shop.root.add(root);
  const solids = new THREE.Group(); root.add(solids);
  const reveal = new THREE.Group(); reveal.name = "Circuitos ocultos en los danos"; root.add(reveal); reveal.visible = false;
  const m = shop.materials, random = randomSequence();
  const brokenWood = m.wood.clone(); brokenWood.color.setHex(0x87634f); brokenWood.roughness = .97;
  const plaster = new THREE.MeshStandardMaterial({ color: 0x867b82, roughness: .99 });
  const soot = new THREE.MeshStandardMaterial({ color: 0x15101b, roughness: 1, side: THREE.DoubleSide });
  const voidMaterial = new THREE.MeshBasicMaterial({ color: 0x040309, side: THREE.DoubleSide });
  const cardboard = new THREE.MeshStandardMaterial({ color: 0x7a5b48, roughness: .98, side: THREE.DoubleSide });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8fa9b5, metalness: .65, roughness: .17, transparent: true, opacity: .58, side: THREE.DoubleSide });
  const red = new THREE.MeshBasicMaterial({ color: 0xe32752, transparent: true, opacity: .72, toneMapped: false });
  const trace = new THREE.MeshBasicMaterial({ color: 0xf55dc5, transparent: true, opacity: .88, toneMapped: false });
  const traceCore = new THREE.MeshBasicMaterial({ color: 0xffbce4, toneMapped: false });
  const deadTube = new THREE.MeshBasicMaterial({ color: 0x292431 });
  const coolTube = new THREE.MeshBasicMaterial({ color: 0xa5d4e4, toneMapped: false });
  const glows = new THREE.Group(); root.add(glows);
  const damagedShelves = [];

  // The two rear bins become fallen shelving inside their existing footprints.
  // Every original album gets a new pickable sleeve and a matching proximity target.
  for (const data of shop.displayBins.slice(0, 2)) {
    data.group.visible = false;
    for (const mesh of data.clickables) { const i = shop.clickable.indexOf(mesh); if (i >= 0) shop.clickable.splice(i, 1); }
    for (const target of data.targets) { const i = shop.albumTargets.indexOf(target); if (i >= 0) shop.albumTargets.splice(i, 1); }
    const side = data.index ? 1 : -1;
    const fallen = new THREE.Group(); fallen.name = "Estanteria volcada " + (data.index + 1);
    fallen.position.copy(data.group.position); fallen.position.y = .36;
    fallen.rotation.set(-Math.PI / 2, 0, side * .065); solids.add(fallen); damagedShelves.push(fallen);
    box(fallen, m.wood, [2.58, 2.24, .075], [0, 0, -.25]);
    for (const x of [-1.27, 1.27]) box(fallen, brokenWood, [.1, 2.28, .58], [x, 0, 0]);
    for (const y of [-1.1, -.37, .37, 1.1]) box(fallen, m.wood, [2.64, .085, .57], [0, y, 0], [0, 0, y === .37 ? side * .07 : 0]);
    for (const x of [-.44, .44]) box(fallen, m.brass, [.025, 2.17, .028], [x, 0, .29]);
    box(fallen, brokenWood, [.26, 1.18, .055], [side * .95, .35, .34], [0, 0, side * .22]);
    data.clickables.forEach((original, index) => {
      const sleeve = original.clone(); sleeve.geometry = original.geometry.clone();
      sleeve.position.set(data.group.position.x + (index % 5 - 2) * .48, .7 + (index % 3) * .018,
        data.group.position.z + (Math.floor(index / 5) - 2) * .43);
      sleeve.rotation.set(-Math.PI / 2 + (index % 4) * .035, 0, (random() - .5) * .8);
      root.add(sleeve); shop.clickable.push(sleeve);
      shop.albumTargets.push({ id: original.userData.albumId, x: sleeve.position.x, z: sleeve.position.z, reach: 2.1, object: sleeve });
    });
    // Ripped fascia, loose shelf boards and broken fasteners stay on the same footprint.
    for (let i = 0; i < 7; i++) box(solids, i % 2 ? brokenWood : m.charcoal,
      [.07 + random() * .1, .07, .45 + random() * .65],
      [data.group.position.x + (random() - .5) * 2.5, .1, data.group.position.z + (random() - .5) * 2.3], [0, random() * Math.PI, .06]);
  }
  for (const data of shop.displayBins.slice(2, 4)) {
    data.contact.visible = false;
    data.group.rotation.z = data.index % 2 ? -.095 : .095;
    data.group.position.y = .135;
    data.group.updateMatrixWorld(true);
    for (const target of data.targets) { const p = target.object.getWorldPosition(new THREE.Vector3()); target.x = p.x; target.z = p.z; }
  }
  shop.wallDisplays.forEach((display, index) => {
    if (index === 1 || index === 3 || index === 5 || index === 9) display.rotation.z = (index % 3 - 1.5) * .07;
  });

  // Substantial debris belongs to furniture footprints; loose floor fragments stay below boot height.
  const patches = [[-3.8,-6.2,45,2.1],[3.8,-6.2,45,2.1],[-6.7,-11.8,24,1.15],[6.7,-11.8,24,1.15],[-8.9,-.1,13,.75],[8.9,6.8,12,.8],[-6.8,6.5,15,1.25],[6.6,2.3,12,1.2]];
  for (const [cx, cz, count, spread] of patches) for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2, distance = Math.sqrt(random()) * spread;
    const x = cx + Math.cos(angle) * distance, z = cz + Math.sin(angle) * distance;
    // Preserve the central combat route, focus sightlines and archive crate rail.
    if (Math.abs(x) < 1.75 || (x > 7.1 && z < -4.5 && z > -9.5)) continue;
    const wood = i % 3 === 0, height = .025 + random() * .065;
    const geometry = wood ? new THREE.BoxGeometry(.07 + random() * .11, height, .25 + random() * .7) : new THREE.DodecahedronGeometry(.1, 0);
    const chunk = new THREE.Mesh(geometry, wood ? brokenWood : i % 4 ? plaster : soot);
    chunk.position.set(x, height * .65, z); chunk.rotation.y = random() * 6.28;
    if (!wood) chunk.scale.set(.6 + random() * 2, height * 7, .6 + random() * 2.3);
    solids.add(chunk);
  }
  const looseCoverMaterials = shop.covers.map(map => new THREE.MeshStandardMaterial({ map, roughness: .86, side: THREE.DoubleSide }));
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? -1 : 1, x = side * (2.4 + random() * 6.7), z = -11.9 + random() * 17;
    if (x > 7 && z > -9.5 && z < -4.5) continue;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(.65, .65), looseCoverMaterials[i % looseCoverMaterials.length]);
    face.position.set(x, .045 + (i % 3) * .007, z); face.rotation.set(-Math.PI / 2, 0, random() * 6.28); solids.add(face);
  }
  const vinylMaterials = shop.vinylMaps.slice(0, 4).map(map => new THREE.MeshStandardMaterial({ map, roughness: .3, metalness: .25, side: THREE.DoubleSide }));
  for (let i = 0; i < 75; i++) {
    const disc = new THREE.Mesh(new THREE.RingGeometry(.012, .28 + random() * .06, 28), vinylMaterials[i % 4]);
    const side = i % 2 ? -1 : 1; disc.position.set(side * (2.3 + random() * 6.8), .06 + (i % 4) * .006, -12 + random() * 18);
    disc.rotation.set(-Math.PI / 2, 0, random() * 6.28); solids.add(disc);
  }
  for (const [x,z,yaw] of [[-4.6,-6.8,.4],[4.4,-5.5,-.5],[-3.4,-6.4,1.2],[3.6,-6.7,-.1]]) {
    const carton = new THREE.Group(); carton.position.set(x,.12,z); carton.rotation.set(.12,yaw,.18); solids.add(carton);
    box(carton,cardboard,[.65,.22,.55],[0,.11,0]);
    box(carton,cardboard,[.7,.025,.3],[0,.25,-.32],[.55,0,0]);
    box(carton,cardboard,[.7,.025,.25],[0,.23,.32],[-.7,0,0]);
  }

  // Missing ceiling tiles: recessed darkness, exposed joists, torn panels and hanging wiring.
  const breaches = [[-3.9,-6.7,3.6,3.3],[4.4,-7.4,3.1,3.6],[1.8,-11.5,4,2.8],[-6.8,1.7,2.2,2.1]];
  const hanging = [];
  for (const [index,[x,z,w,d]] of breaches.entries()) {
    polygon(solids,voidMaterial,[[-w/2,-d/2],[-.3,-d/2-.14],[w/2,-d/2+.2],[w/2+.12,.3],[w/2-.18,d/2],[-w/2,d/2-.15]], [x,4.725,z], [Math.PI/2,0,0]);
    for (const offset of [-.38,.38]) box(solids,m.charcoal,[w,.075,.1],[x,4.64,z+offset*d]);
    for (let j=0;j<4;j++) box(solids,m.chrome,[.045,.07,d],[x-w*.4+j*w*.27,4.6,z]);
    const panel = box(solids,plaster,[w*.52,.065,d*.55],[x+w*.26,4.24,z+d*.35],[.34,0,index%2?.38:-.31]);
    box(solids,soot,[w*.48,.018,d*.5],[x+w*.26,4.29,z+d*.35],[.34,0,index%2?.38:-.31]);
    for(let k=0;k<4;k++){
      const xx=x-w*.35+k*w*.23, zz=z+(k%2?.25:-.25), drop=index<3?1.25+random()*.75:.7;
      cable(solids,k%2?m.rubber:m.charcoal,[[xx,4.69,zz],[xx+.18,4.2,zz+.1],[xx-.22,4.69-drop*.7,zz+.18],[xx+.08,4.69-drop,zz+.1]],.017+(k%2)*.012);
      if(k===1){const tip=box(glows,coolTube,[.035,.085,.035],[xx+.08,4.69-drop,zz+.1]);hanging.push(tip);}
    }
    for(let k=0;k<5;k++) box(solids,brokenWood,[.035,.15+random()*.28,.025],[x-w*.5+k*w*.24,4.5,z+d*.5],[0,0,(random()-.5)*.7]);
  }
  // A detached fluorescent remains above head height and cannot obstruct combat.
  const lamp = new THREE.Group(); lamp.position.set(-2.1,3.55,-9.7); lamp.rotation.set(.1,0,-.28); solids.add(lamp);
  box(lamp,m.charcoal,[1.75,.1,.44],[0,0,0]);
  for(const zz of [-.12,.12])box(lamp,deadTube,[1.6,.035,.04],[0,-.07,zz]);
  cable(solids,m.rubber,[[-2.9,4.7,-9.7],[-2.7,4.1,-9.7],[-2.86,3.77,-9.7]],.014);
  cable(solids,m.rubber,[[-1.4,4.7,-9.7],[-1.2,4.05,-9.7],[-1.31,3.34,-9.7]],.014);

  const cracksMap = crackTexture(), cracksMaterial = new THREE.MeshStandardMaterial({ map: cracksMap, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  for(const [x,z,size] of [[-1.7,-6.8,3.4],[2,-10.7,4.4],[-7.4,-7.3,2.5],[7.2,-.4,2.2],[.2,3.3,2.3],[-6.5,10.1,2.2]]){
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(size,size),cracksMaterial);decal.position.set(x,.018,z);decal.rotation.set(-Math.PI/2,0,random()*6);solids.add(decal);
  }
  // Broken storefront panes, with jagged edges and glass fragments beyond the entrance route.
  shop.storefrontGlass.forEach(mesh=>mesh.visible=false);
  for(const side of [-1,1]){
    polygon(solids,glass,[[0,0],[4.7,0],[4.7,-1.5],[4.3,-.8],[3.8,-1.9],[3.4,-.6],[2.6,-1.4],[2.1,-.8],[1.3,-1.8],[.8,-.5],[0,-1.4]], [side*5.65,4.5,15.29], [0,side<0?Math.PI:0,0]);
    for(let i=0;i<24;i++)polygon(solids,glass,[[0,0],[.12+random()*.22,.04],[.06,.18+random()*.28]], [side*(6+random()*4.2),.035,13.5+random()*1.1],[-Math.PI/2,0,random()*6]);
  }

  // Organic red fractures remain visible normally; frequency mode reveals their digital skeleton.
  for(const side of [-1,1]) {
    const points=[];for(let i=0;i<10;i++)points.push([side*(2.5+i*.23),.035,-8.7-i*.45]);
    cable(solids,soot,points,.07);cable(glows,red,points,.018);
    for(let i=1;i<8;i+=2){const a=points[i];cable(glows,red,[a,[a[0]+side*.55,.035,a[2]-.1],[a[0]+side*.8,.035,a[2]-.55]],.012);}
    const wall=[ [side*5.8,.2,-13.52],[side*5.62,1,-13.52],[side*5.95,1.55,-13.52],[side*5.7,2.3,-13.52],[side*6.12,3,-13.52],[side*5.95,4.6,-13.52] ];
    cable(solids,soot,wall,.075);cable(glows,red,wall,.021);
  }
  for(const [x,z] of [[-3.8,-6.2],[3.8,-6.2],[-3.8,-.3],[3.8,-.3]]){
    const y=z< -2?.87:2.03;
    for(const side of [-1,1]){
      box(reveal,trace,[.025,.018,1.55],[x+side*.94,y,z]);
      box(reveal,trace,[.67,.018,.025],[x+side*.61,y,z-.77]);
      box(reveal,traceCore,[.1,.025,.1],[x+side*.94,y,z+.77]);
      const loop=new THREE.Mesh(new THREE.RingGeometry(.1,.14,4),trace);loop.rotation.x=-Math.PI/2;loop.position.set(x+side*.94,y,z-.77);reveal.add(loop);
    }
  }
  for(const [x,z,w,d] of breaches){
    const line=box(reveal,trace,[w*.8,.022,.035],[x,4.55,z-d*.34]);
    for(const side of [-1,1])box(reveal,trace,[.035,.022,d*.7],[x+side*w*.4,4.55,z]);
  }
  const dustGeometry=new THREE.BufferGeometry(), dustPositions=[];
  for(let i=0;i<90;i++)dustPositions.push((random()-.5)*17,.4+random()*3.8,-12+random()*14);
  dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xa190a2,size:.018,transparent:true,opacity:.36,depthWrite:false}));root.add(dust);
  const fog=createLowDriftingFog(root,[
    {x:-4,z:-8,y:.22,width:5,height:.5,color:0x4a3c52,opacity:.2},
    {x:4,z:-8,y:.22,width:5,height:.6,color:0x4a3c52,opacity:.2},
    {x:0,z:-11.6,y:.38,width:8,height:1,color:0x453544,opacity:.17},
  ],{name:'Polvo oscuro del derrumbe'});
  const rim=new THREE.SpotLight(0x9fb5d2,21,17,.63,.8,1.7);rim.position.set(4.5,4.1,-8.8);rim.target.position.set(-2,0,-5);root.add(rim,rim.target);
  const shelter=new THREE.PointLight(0xffc695,12,9,2);shelter.position.set(-5.5,3.1,11);root.add(shelter);
  batchStatic(solids);
  let time=0;
  return {root,update(dt,progress,reducedMotion,camera){
    time+=dt;const settled=progress?.coreNeutralized;
    reveal.visible=Boolean(progress?.visionActive&&!settled);
    trace.opacity=reducedMotion?.82:.65+Math.sin(time*2.4)*.17;
    glows.visible=!settled;red.opacity=reducedMotion?.6:.52+Math.sin(time*1.7)*.18;
    hanging.forEach((tip,i)=>tip.visible=!settled&&(reducedMotion||Math.sin(time*3.1+i*2)>.45));
    dust.rotation.y=reducedMotion?0:Math.sin(time*.08)*.018;
    fog.update(dt,reducedMotion,dt===0,camera,bank=>bank.opacity*(settled?.5:1));
    shop.keyLight.color.setHex(settled?0xffb6aa:0xc4afc4);shop.keyLight.intensity=settled?1.05:.67;
    for(const [i,fixture] of shop.ceilingFixtures.entries()){
      const burned=(fixture.z===-9&&fixture.x!==0)||(fixture.z===-2&&fixture.x===6);
      let level=settled?.65:.28;
      if(!burned&&!settled&&!reducedMotion){const phase=(time+i*.87)%6.4;level=phase<.15||phase>.42&&phase<.58?.06:.38;}
      fixture.material.color.setHex(burned?0x15101b:fixture.z>5?0xc9a2af:0xd95c76).multiplyScalar(burned?1:level);
      if(fixture.light){fixture.light.intensity=burned?0:(fixture.z>5?20:13)*level;fixture.light.color.setHex(fixture.z>5?0xe6b3ab:0xdc506b);}
    }
    rim.intensity=settled?14:21;
  }};
}
