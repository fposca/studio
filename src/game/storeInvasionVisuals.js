import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Physical props keep their finish in frequency vision; only their status lights change.
const finish = (color, metalness = .65, roughness = .34) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const light = color => new THREE.MeshBasicMaterial({ color, toneMapped: false });
function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z); parent.add(object); return object;
}
function block(parent, material, w, h, d, x, y, z, radius = .025) {
  return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, radius), material, x, y, z);
}
function mapFromCanvas(w, h, draw) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  return map;
}
function preserve(root) { root.traverse(object => { object.userData.invasionVisionPreserve = true; }); }

// Texture aspect matches the panel: no stretched letters or enormous neon borders.
export function createInvasionPlaque(parent, text, w, h, x, y, z, accent = '#97d6d8') {
  const width = 1024, height = Math.max(128, Math.round(width * h / w));
  const map = mapFromCanvas(width, height, (c, cw, ch) => {
    const g = c.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#242936'); g.addColorStop(1, '#0c1019');
    c.fillStyle = g; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = '#727985'; c.lineWidth = 3; c.strokeRect(4, 4, cw-8, ch-8);
    c.fillStyle = accent; c.fillRect(23, ch*.24, 5, ch*.52);
    c.fillStyle = '#f0ece5'; c.textAlign = 'center'; c.textBaseline = 'middle';
    let size = ch * .43;
    c.font = '600 ' + size + 'px Arial';
    while (c.measureText(text).width > cw-110) { size -= 1; c.font = '600 ' + size + 'px Arial'; }
    c.fillText(text, cw/2, ch*.52);
    for (const xx of [12, cw-12]) {
      c.fillStyle = '#9098a2'; c.beginPath(); c.arc(xx, ch/2, 3, 0, Math.PI*2); c.fill();
    }
  });
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  block(group, finish(0x303440), w+.025, h+.025, .035, 0, 0, -.02, .012);
  // Separate front and back faces ensure typography reads correctly from either side.
  const material = new THREE.MeshBasicMaterial({ map, toneMapped: false });
  mesh(group, new THREE.PlaneGeometry(w, h), material, 0, 0, .002);
  const back = mesh(group, new THREE.PlaneGeometry(w, h), material, 0, 0, -.042);
  back.rotation.y = Math.PI;
  preserve(group); return group;
}

function vinylTexture() {
  return mapFromCanvas(1024, 1024, (c) => {
    c.fillStyle = '#11131b'; c.fillRect(0, 0, 1024, 1024);
    for (let r=164; r<509; r+=3) {
      c.strokeStyle = r%9 < 3 ? '#35333e' : '#1f202b'; c.lineWidth = .9;
      c.beginPath(); c.arc(512,512,r,0,Math.PI*2); c.stroke();
    }
    // Soft reflected streaks, baked once, give the grooves a pressed-vinyl finish.
    for (const angle of [-.8, 2.34]) {
      for(let i=0;i<22;i++){
        c.strokeStyle='rgba(168,170,190,'+(.004+(21-i)*.0009)+')';c.lineWidth=350;
        c.beginPath();c.arc(512,512,330,angle-i*.012,angle+i*.012);c.stroke();
      }
    }
    const g=c.createRadialGradient(476,465,10,512,512,158);
    g.addColorStop(0,'#a94a83');g.addColorStop(1,'#542846');
    c.fillStyle=g;c.beginPath();c.arc(512,512,158,0,Math.PI*2);c.fill();
    c.strokeStyle='#d4a4c0';c.lineWidth=2;c.beginPath();c.arc(512,512,144,0,Math.PI*2);c.stroke();
    c.textAlign='center';c.fillStyle='#fff0de';c.font='700 32px Arial';c.fillText('NEONBOY',512,468);
    c.fillStyle='#dab8ce';c.font='16px monospace';c.fillText('ARCHIVO ORIGINAL',512,495);
    c.fillStyle='#fff0de';c.font='bold 37px monospace';c.fillText('F / 09',512,575);
    c.font='13px monospace';c.fillText('LA SEÑAL PERMANECE',512,604);
    c.fillStyle='#bbb3bd';c.beginPath();c.arc(512,512,22,0,Math.PI*2);c.fill();
    c.fillStyle='#080b13';c.beginPath();c.arc(512,512,13,0,Math.PI*2);c.fill();
  });
}

export function createInvasionArtifact(parent) {
  const root = new THREE.Group(); root.name='F09 / vinilo del Archivista'; parent.add(root);
  const shell=finish(0x252632,.8,.3), trim=finish(0x77838d,.85,.26), dark=finish(0x080c13,.3,.55);
  const accent=light(0x75d8d8);
  block(root,shell,1.24,.18,.86,0,.12,0,.07);
  block(root,dark,1.12,.055,.75,0,.235,0,.025);
  block(root,trim,.8,.06,.54,0,.29,0,.025);
  for(const side of [-1,1]){
    block(root,shell,.1,.68,.19,side*.53,.6,0,.03).rotation.z=-side*.15;
    block(root,trim,.13,.13,.25,side*.48,.91,0,.03);
    block(root,accent,.035,.34,.025,side*.55,.52,.102,.006);
    block(root,dark,.2,.07,.18,side*.43,.035,.23,.02);
  }
  const vinyl=new THREE.Group();vinyl.position.set(0,1.49,0);root.add(vinyl);
  const discMaterial=finish(0xffffff,.32,.42);discMaterial.map=vinylTexture();
  // A real edge and distinct faces instead of a single flat target.
  const body=mesh(vinyl,new THREE.CylinderGeometry(.56,.56,.028,64),shell);
  body.rotation.x=Math.PI/2;
  mesh(vinyl,new THREE.CircleGeometry(.557,64),discMaterial,0,0,.016);
  const reverse=mesh(vinyl,new THREE.CircleGeometry(.557,64),discMaterial,0,0,-.016);
  reverse.rotation.y=Math.PI;
  const arcs=new THREE.Group();arcs.position.y=1.49;root.add(arcs);
  const arcMaterial=new THREE.MeshBasicMaterial({color:0xb476b4,transparent:true,opacity:.48,depthWrite:false,toneMapped:false});
  for(let i=0;i<3;i++){
    const arc=mesh(arcs,new THREE.TorusGeometry(.67,.006,4,36,Math.PI*.43),arcMaterial);
    arc.rotation.z=i*Math.PI*2/3;
  }
  createInvasionPlaque(root,'NÚCLEO NEON  /  F09',1.05,.18,0,.37,.37);
  const glow=new THREE.PointLight(0xe997d0,1.5,2.8,2);glow.position.set(.55,1.75,.4);root.add(glow);
  const points=[];
  for(let i=0;i<22;i++){
    const a=i*2.39996;points.push(Math.cos(a)*(.28+(i%5)*.06),.48+i*.067,Math.sin(a)*.25);
  }
  const dustGeometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  const motes=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xd9accf,size:.012,transparent:true,opacity:.58,depthWrite:false}));
  root.add(motes);
  preserve(root); root.visible=false;
  return {root,update(time,reducedMotion,settled){
    vinyl.position.y=1.49+(reducedMotion?0:Math.sin(time*1.6)*.035);
    vinyl.rotation.y=reducedMotion?-.12:Math.sin(time*.52)*.24;
    vinyl.rotation.z=reducedMotion?0:Math.sin(time*.35)*.045;
    arcs.rotation.z=reducedMotion?0:time*.13;
    arcMaterial.opacity=settled?.2:.38+(reducedMotion?0:Math.sin(time*1.6)*.08);
    motes.visible=!settled;
    motes.rotation.y=reducedMotion?0:time*.14;
    glow.intensity=root.visible?(settled?.3:.9):0;
  }};
}

export function createInvasionGenerator(parent,x,index) {
  const group=new THREE.Group();group.name='Generador de escudo '+(index+1);
  group.position.set(x,1.15,-10.25);parent.add(group);
  const shell=finish(0x30303b,.72,.36), trim=finish(0x7d727b,.8,.31), dark=finish(0x0b0e16,.42,.49);
  const energy=new THREE.MeshStandardMaterial({color:0xf29c99,emissive:0xf52f53,emissiveIntensity:1.7,metalness:.35,roughness:.27});
  const led=light(0xf34b70), dead=light(0x36434d);
  block(group,shell,1.02,.12,.75,0,-1.07,0,.04);
  block(group,dark,.72,.43,.43,0,-.8,-.035,.035);
  block(group,shell,.89,1.15,.46,0,-.01,-.01,.065);
  block(group,dark,.75,.97,.055,0,.015,.238,.03);
  for(const side of [-1,1]){
    block(group,trim,.115,1.03,.55,side*.45,.015,0,.028);
    block(group,led,.027,.56,.024,side*.454,.07,.285,.006);
    for(let j=0;j<5;j++)block(group,dark,.13,.025,.065,side*.42,-.33+j*.063,.3,.005);
    for(const y of [-.45,.46])mesh(group,new THREE.SphereGeometry(.022,8,6),trim,side*.44,y,.296);
  }
  const housing=mesh(group,new THREE.TorusGeometry(.315,.064,6,8),trim,0,.06,.295);housing.rotation.z=Math.PI/8;
  mesh(group,new THREE.CircleGeometry(.29,32),dark,0,.06,.29);
  const core=mesh(group,new THREE.OctahedronGeometry(.21,1),energy,0,.06,.38);core.scale.set(.85,1.15,.66);
  const cage=new THREE.Group();cage.position.set(0,.06,.38);group.add(cage);
  const bands=new THREE.MeshBasicMaterial({color:0xff94ad,transparent:true,opacity:.7,toneMapped:false});
  for(let i=0;i<3;i++){
    const arc=mesh(cage,new THREE.TorusGeometry(.26,.008,4,24,Math.PI*.4),bands);
    arc.rotation.z=i*2*Math.PI/3;
  }
  const status=createInvasionPlaque(group,'ESCUDO 0'+(index+1),.83,.17,0,.68,.14,'#ed809b');
  const offline=createInvasionPlaque(group,'DESCONECTADO',.83,.17,0,.68,.14,'#94a8b2');offline.visible=false;
  const charge=block(group,led,.39,.026,.02,0,-.43,.275,.006);
  const fixture=new THREE.PointLight(0xf33f68,1.4,2.6,2);fixture.position.set(0,.13,.62);group.add(fixture);
  preserve(group);
  const liveParts=[];group.traverse(o=>{if(o.material===led)liveParts.push(o);});
  return {group,core,dispose(){led.dispose();dead.dispose();},update(time,active,resolved,reducedMotion){
    group.visible=active;
    status.visible=!resolved;offline.visible=resolved;
    core.visible=cage.visible=!resolved;
    liveParts.forEach(o=>{o.material=resolved?dead:led;});
    charge.scale.x=resolved?1:.78+(reducedMotion?0:Math.sin(time*2+index)*.18);
    core.rotation.y=reducedMotion?0:time*.6;
    cage.rotation.z=reducedMotion?0:-time*.38;
    energy.emissiveIntensity=reducedMotion?1.5:1.5+Math.sin(time*2.3+index)*.25;
    fixture.intensity=active&&!resolved?1.2:0;
  }};
}
