import * as THREE from "three";
import { STORE_LAYOUT } from "./recordStoreLayout.js";
import { disposeObjects } from "./disposeGameObjects.js";

// These additions belong only to the intact chapter-15 shop. Anchor papers to
// real furniture surfaces; the music stand has its own floor contact/collider.
export function createChapter15StoreEvidence(base, interactions, obstacles) {
  const owned = [], anchors = [], marks = [];
  const paper = new THREE.MeshStandardMaterial({ color: 0xeadfbd, roughness: .91 });
  const cover = new THREE.MeshStandardMaterial({ color: 0x394b48, roughness: .8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x272e32, metalness: .73, roughness: .3 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xaab1b3, metalness: .85, roughness: .23 });
  const plastic = new THREE.MeshStandardMaterial({ color: 0x22202a, metalness: .08, roughness: .43 });
  function group(name, parent = base.root) {
    const g = new THREE.Group(); g.name = name; parent.add(g); owned.push(g); return g;
  }
  function box(parent, size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position); mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function rod(parent, from, to, radius, material) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), delta = b.clone().sub(a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 10), material);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function page(parent, name, w, d, y, paint, portrait = false) {
    const canvas = document.createElement("canvas");
    canvas.width = portrait ? 512 : 768; canvas.height = portrait ? 768 : 512;
    const c = canvas.getContext("2d"), width = canvas.width, height = canvas.height;
    const tint = c.createLinearGradient(0, 0, width, height);
    tint.addColorStop(0, "#f3e7c9"); tint.addColorStop(.65, "#e7d7b2"); tint.addColorStop(1, "#d6bf90");
    c.fillStyle = tint; c.fillRect(0, 0, width, height);
    // Fine paper grain is baked once, not generated during gameplay.
    for (let i = 0; i < 2200; i++) {
      c.fillStyle = i % 2 ? "#fff9df19" : "#705a3610";
      c.fillRect((i * 137.13) % width, (i * 59.71) % height, 1, 1);
    }
    paint(c, width, height);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 2;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map, roughness: .86 }));
    mesh.name = name; mesh.rotation.x = -Math.PI / 2; mesh.position.y = y;
    // Written evidence remains legible in Frequency Vision.
    mesh.userData.invasionVisionPreserve = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }
  function mark(parent, width, depth, y) {
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width/2,y,-depth/2), new THREE.Vector3(width/2,y,-depth/2),
      new THREE.Vector3(width/2,y,depth/2), new THREE.Vector3(-width/2,y,depth/2),
    ]), new THREE.LineBasicMaterial({ color: 0xc5a3ff, transparent: true, opacity: .68, depthWrite: false, toneMapped: false }));
    line.visible = false; line.name = "chapter15-evidence-frequency-edge";
    parent.add(line); marks.push(line);
  }
  function anchor(object, id, support) {
    object.userData.evidenceId = id;
    anchors.push({ object, target: interactions.find(item => item.id === id), support });
  }
  // The register faces the entrance. Its local +Z is the clear near edge of
  // the real countertop, in front of the paper bag and beside the CRT.
  const counter = base.root.children.find(object => object.isGroup
    && Math.abs(object.position.x - STORE_LAYOUT.counter.x) < .01
    && Math.abs(object.position.z - STORE_LAYOUT.counter.z) < .01);
  const ledger = group("chapter15-sales-register", counter || base.root);
  if (counter) ledger.position.set(.85, 1.242, .48);
  else ledger.position.set(-8.05, 1.242, 12.17);
  ledger.rotation.y = -.045;
  box(ledger, [.76,.012,.52], [0,.006,0], cover);
  box(ledger, [.72,.008,.48], [.006,.016,0], paper);
  page(ledger, "chapter15-sales-register-writing", .716, .476, .0205, c => {
    c.fillStyle = "#273e42"; c.fillRect(26, 28, 716, 78);
    c.fillStyle = "#f1e4c5"; c.font = "bold 30px Arial"; c.fillText("NEONBOY MUSIC", 48, 64);
    c.font = "15px Arial"; c.fillText("DISQUERÍA / BUENOS AIRES", 49, 88);
    c.textAlign = "right"; c.fillText("CAJA 01 · 1999", 720, 64); c.textAlign = "left";
    c.fillStyle = "#343b3b"; c.font = "bold 26px Arial"; c.fillText("REGISTRO DE VENTAS", 37, 146);
    c.font = "16px monospace"; c.fillText("FOLIO 0418 / CONTROL DE STOCK", 38, 173);
    c.strokeStyle = "#66766a80"; c.lineWidth = 1;
    for(let y=197; y<=351; y+=38) { c.beginPath(); c.moveTo(35,y); c.lineTo(733,y); c.stroke(); }
    c.font = "bold 16px Arial";
    c.fillText("DISCO / REFERENCIA", 43, 222); c.fillText("INGRESO", 413, 222); c.fillText("VENTA", 585, 222);
    c.font = "17px monospace";
    [["NB-99 / EDICIÓN LOCAL", "14/10/1999", "12/10/1999"], ["NR-04 / INSTRUMENTAL", "13/10/1999", "14/10/1999"]].forEach((row,i)=>{
      row.forEach((text,j)=>c.fillText(text,[43,397,565][j],261+i*38));
    });
    c.strokeStyle = "#9a3e40"; c.lineWidth = 3;
    c.beginPath(); c.ellipse(647,254,85,20,-.06,0,Math.PI*2); c.stroke();
    c.save(); c.translate(104,389); c.rotate(-.04);
    c.fillStyle = "#31577b"; c.font = "italic 24px Georgia";
    c.fillText("Llegó hoy. ¿Cómo se vendió antes?",0,0); c.fillText("Revisar la fecha. — Tito",24,37); c.restore();
    c.save(); c.translate(621,442); c.rotate(-.13); c.strokeStyle = c.fillStyle = "#9b4944";
    c.strokeRect(-88,-22,176,36); c.font = "bold 17px Arial"; c.textAlign = "center"; c.fillText("REVISAR ASIENTO",0,1); c.restore();
    c.fillStyle = "#89765b"; c.fillRect(27,473,714,1);
  });
  // A metal clip, layered page edges and a pencil make this a physical document.
  box(ledger, [.095,.007,.035], [-.23,.024,-.225], steel);
  rod(ledger, [.285,.027,-.18], [.285,.027,.17], .008, new THREE.MeshStandardMaterial({color:0xb68a48,roughness:.6}));
  mark(ledger,.78,.54,.023);
  anchor(ledger,"ch15-evidence-tito",counter || base.root);

  const stand = group("chapter15-roxy-music-stand"); stand.position.set(2.55,0,3.25);
  for(let i=0;i<3;i++) {
    const angle=i*Math.PI*2/3;
    const tip=[Math.cos(angle)*.28,.025,Math.sin(angle)*.28];
    rod(stand,[0,.22,0],tip,.018,metal);
    box(stand,[.065,.028,.065],[tip[0],.014,tip[2]],plastic);
  }
  rod(stand,[0,.08,0],[0,1.118,0],.016,steel);
  rod(stand,[0,.12,0],[0,.72,0],.025,metal);
  const lyrics = new THREE.Group(); lyrics.name = "chapter15-roxy-lyrics";
  lyrics.position.y=1.11; lyrics.rotation.x=.88; stand.add(lyrics);
  box(lyrics,[.57,.012,.67],[0,.006,0],metal);
  box(lyrics,[.51,.008,.61],[0,.016,0],paper);
  box(lyrics,[.57,.04,.018],[0,.021,.333],metal);
  page(lyrics,"chapter15-roxy-lyrics-writing",.505,.605,.0205,c=>{
    c.fillStyle="#9b6d7159"; c.fillRect(46,38,2,680);
    c.strokeStyle="#758b952b";
    for(let y=166;y<730;y+=43){c.beginPath();c.moveTo(25,y);c.lineTo(486,y);c.stroke();}
    c.fillStyle="#333f54";c.font="bold 26px Arial";c.fillText("ROXY / CUADERNO",66,83);
    c.font="16px monospace";c.fillText("ENSAYO · OCTUBRE 1999",66,113);
    c.font="italic 24px Georgia";
    ["La ciudad no se duerme,", "el vinilo vuelve a girar.", "Entre el ruido y el silencio", "hay algo que quiere entrar.", "", "No escribí estas marcas..."].forEach((text,i)=>c.fillText(text,68,199+i*43));
    c.strokeStyle="#855184";c.lineWidth=3;
    for(let i=0;i<3;i++){const x=116+i*105;c.beginPath();c.moveTo(x,528);c.lineTo(x+25,554);c.lineTo(x,581);c.lineTo(x-25,554);c.closePath();c.moveTo(x,518);c.lineTo(x,593);c.stroke();}
    c.fillStyle="#333f54";c.font="italic 29px Georgia";c.fillText("Roxy",337,685);
  },true);
  mark(lyrics,.59,.69,.024);
  anchor(lyrics,"ch15-evidence-roxy",stand);
  const collider={id:"ch15-roxy-stand",x:2.55,z:3.25,hx:.23,hz:.23}; obstacles.push(collider);

  // Free space between the turntable and stereo on the existing listening desk.
  const tape = group("chapter15-rulo-tape-sleeve"); tape.position.set(7.70,1.402,-2.95); tape.rotation.y=-.08;
  box(tape,[.46,.018,.31],[0,.009,0],cover);
  box(tape,[.425,.048,.275],[0,.042,0],plastic);
  page(tape,"chapter15-rulo-tape-label",.40,.25,.0665,c=>{
    c.fillStyle="#a23f42";c.fillRect(22,18,724,72);
    c.fillStyle="#f6e8cc";c.font="bold 35px Arial";c.fillText("NEON / ARCHIVO ANALÓGICO",40,65);
    c.fillStyle="#342d36";c.font="bold 28px monospace";c.fillText("A     C-60     REFERENCIA ?",38,139);
    c.fillStyle="#24232c";c.fillRect(72,181,624,188);
    for(const x of [223,545]) {c.fillStyle="#a99c82";c.beginPath();c.arc(x,275,72,0,Math.PI*2);c.fill();c.fillStyle="#272731";c.beginPath();c.arc(x,275,25,0,Math.PI*2);c.fill();}
    c.fillStyle="#365776";c.font="italic 27px Georgia";c.fillText("Prueba de frecuencia / sin catálogo",40,431);
    c.font="18px monospace";c.fillText("1999 · COPIA DE CONSULTA",40,474);
  });
  for(const x of [-.188,.188])for(const z of [-.112,.112])rod(tape,[x,.064,z],[x,.068,z],.007,steel);
  mark(tape,.48,.33,.07);
  anchor(tape,"ch15-evidence-rulo",base.root);

  const point=new THREE.Vector3(), ray=new THREE.Raycaster();
  function settle() {
    // Probe existing furniture only (exclude our additions), then place the
    // exact object bottom 2 mm above its surface. No assumed floating height.
    base.root.updateWorldMatrix(true,true);
    const additions=new Set();for(const item of owned)item.traverse(o=>additions.add(o));
    const supports=[];base.root.traverse(o=>{if(o.isMesh&&!additions.has(o)&&!o.material?.transparent)supports.push(o);});
    for(const entry of anchors) {
      const {object,target}=entry;
      if(object!==lyrics) {
        object.getWorldPosition(point);
        ray.set(new THREE.Vector3(point.x,2.3,point.z),new THREE.Vector3(0,-1,0));
        const hit=ray.intersectObjects(supports,false).find(hit=>hit.face.normal.y>.8&&hit.point.y>.8&&hit.point.y<1.8);
        if(hit){point.y=hit.point.y+.002;object.position.copy(object.parent.worldToLocal(point));}
      }
      object.getWorldPosition(point); if(target){target.x=point.x;target.z=point.z;}
    }
  }
  settle();
  return {
    anchors, settle,
    update(progress){for(let i=0;i<marks.length;i++)marks[i].visible=Boolean(progress?.visionActive)&&!progress?.evidence?.includes(["tito","roxy","rulo"][i]);},
    dispose(){disposeObjects(owned);for(const item of owned)item.removeFromParent();const index=obstacles.indexOf(collider);if(index>=0)obstacles.splice(index,1);},
  };
}
