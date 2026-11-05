import * as THREE from 'three';
import {loadRecordStoreGhost} from './recordStoreGhost.js';
import {createEnemyOrbVisual} from './enemyOrbVisuals.js';
import {createOrbGlowTexture} from './neonOrbVisuals.js';
import { invadedStoreObstacles, INVASION_STATIC_COUNT } from './recordStoreInvadedLayout.js';
import { createInvadedStoreDamage } from './recordStoreInvadedDamage.js';
import { createInvasionPlaque, createInvasionArtifact, createInvasionGenerator } from './storeInvasionVisuals.js';

const DEMON_URL=new URL('../assets/neonboy-animaciones/demonio-alado-2.glb',import.meta.url).href;
const DEMON_CLIP_URLS={
 walk:new URL('../assets/neonboy-animaciones/demonioFinal-walk.anim.mobile.glb',import.meta.url).href,
 attack:new URL('../assets/neonboy-animaciones/demonFinal-attack.anim.mobile.glb',import.meta.url).href,
 melee:new URL('../assets/neonboy-animaciones/demonioFinal-kick.anim.mobile.glb',import.meta.url).href,
 death:new URL('../assets/neonboy-animaciones/demonDieFinal.anim.mobile.glb',import.meta.url).href,
};
const CLUES=[[-8.72,5.2,'I / ONDA'],[-8.72,2.4,'II / SURCO'],[-8.72,-.4,'III / SILENCIO']];
const EMITTERS=[[-7.25,.82,-12.1],[0,1.55,-12.4],[7.25,2.23,-12.1]];
const tmp=new THREE.Vector3();
function box(parent,w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
const glyphSign=createInvasionPlaque;
function ring(parent,r,color,x,y,z,width=.012){const m=new THREE.Mesh(new THREE.TorusGeometry(r,width,6,48),new THREE.MeshBasicMaterial({color,toneMapped:false}));m.position.set(x,y,z);parent.add(m);return m;}
function archivePanelTexture(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;
 const c=canvas.getContext('2d');
 const bg=c.createLinearGradient(0,0,1024,640);
 bg.addColorStop(0,'#17202b');bg.addColorStop(.52,'#080d16');bg.addColorStop(1,'#21111f');
 c.fillStyle=bg;c.fillRect(0,0,1024,640);
 c.strokeStyle='#80dce01d';c.lineWidth=1;
 for(let x=24;x<1024;x+=32){c.beginPath();c.moveTo(x,22);c.lineTo(x,618);c.stroke();}
 for(let y=22;y<640;y+=32){c.beginPath();c.moveTo(24,y);c.lineTo(1000,y);c.stroke();}
 c.strokeStyle='#8ddde066';c.lineWidth=3;c.strokeRect(15,15,994,610);
 c.strokeStyle='#ef84bb77';c.lineWidth=1;c.strokeRect(24,24,976,592);
 c.fillStyle='#0a0d17';c.fillRect(38,38,948,88);c.fillRect(38,535,948,68);
 c.fillStyle='#f2e4d8';c.font='700 28px monospace';c.fillText('F / 09   ARCHIVO CENTRAL',58,78);
 c.fillStyle='#82dce0';c.font='18px monospace';c.fillText('MATRIZ DE CONDUCTORES',58,106);
 c.textAlign='right';c.fillStyle='#e3a6ca';c.fillText('NEONBOY  //  1999',962,91);c.textAlign='left';
 for(const [index,x] of [220,512,804].entries()){
  c.fillStyle='#111721';c.fillRect(x-125,150,250,355);
  c.strokeStyle='#8bdde066';c.lineWidth=2;c.strokeRect(x-125,150,250,355);
  c.strokeStyle='#e766b877';c.lineWidth=2;c.strokeRect(x-114,161,228,333);
  c.fillStyle='#dba2c6';c.font='700 17px monospace';c.textAlign='center';
  c.fillText('CANAL 0'+(index+1),x,189);
  c.fillStyle='#060b12';c.beginPath();c.arc(x,327,113,0,Math.PI*2);c.fill();
  c.strokeStyle='#42536a';c.lineWidth=5;c.beginPath();c.arc(x,327,110,0,Math.PI*2);c.stroke();
  c.strokeStyle='#e878b2';c.lineWidth=3;
  for(let tick=0;tick<24;tick++){
   const a=tick*Math.PI/12;
   c.beginPath();c.moveTo(x+Math.cos(a)*94,327+Math.sin(a)*94);
   c.lineTo(x+Math.cos(a)*(tick%3===0?108:101),327+Math.sin(a)*(tick%3===0?108:101));c.stroke();
  }
  c.strokeStyle='#aa6a9a66';c.lineWidth=2;c.beginPath();c.arc(x,327,75,0,Math.PI*2);c.stroke();
  c.fillStyle='#86dcdf';c.font='15px monospace';c.fillText(['PUERTO A','PUERTO B','PUERTO C'][index],x,474);
  c.fillStyle='#6b8792';c.fillRect(x-38,483,76,2);
 }
 c.textAlign='left';
 c.strokeStyle='#69d4daaa';c.lineWidth=3;
 c.beginPath();c.moveTo(45,557);c.lineTo(280,557);c.lineTo(305,580);c.lineTo(710,580);c.lineTo(735,557);c.lineTo(979,557);c.stroke();
 c.fillStyle='#d5bdd1';c.font='15px monospace';c.fillText('PULSO / SECUENCIA / RESPUESTA',58,588);
 c.textAlign='right';c.fillStyle='#85dadd';c.fillText('FRECUENCIA 09',966,588);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return map;
}
function clueSignTexture(index,clue,revealed){
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;
 const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,640,320);
 g.addColorStop(0,'#182032');g.addColorStop(.56,'#0a0d18');g.addColorStop(1,'#241124');
 c.fillStyle=g;c.fillRect(0,0,640,320);
 c.strokeStyle='#83dde156';c.lineWidth=2;c.strokeRect(8,8,624,304);
 c.strokeStyle='#e780b677';c.lineWidth=2;c.strokeRect(18,18,604,284);
 c.fillStyle='#e075b0';c.fillRect(25,26,7,268);
 c.fillStyle='#98dce0';c.font='700 21px monospace';
 c.fillText('ARCHIVO / FRECUENCIA 09',48,57);
 c.textAlign='right';c.fillStyle='#c78aaf';c.fillText('CANAL 0'+(index+1),601,57);
 c.fillStyle='#8ed8de33';c.fillRect(48,73,544,2);
 const [numeral,title]=clue.split(' / ');
 if(revealed){
  c.fillStyle='#e984bb';c.font='800 87px Arial';c.textAlign='left';c.fillText(numeral,50,195);
  c.fillStyle='#f8ece9';c.font='800 69px Arial';c.fillText(title,174,190,418);
  c.fillStyle='#8ce2e1';c.font='700 20px monospace';c.fillText('SEÑAL DECODIFICADA',49,246);
 }else{
  c.fillStyle='#f5e4e8';c.font='800 59px Arial';c.textAlign='left';
  c.fillText('PULSO 0'+(index+1),48,182);
  c.fillStyle='#a8bac6';c.font='700 20px monospace';c.fillText('LECTURA OCULTA',49,246);
 }
 c.strokeStyle=revealed?'#8ce2e1':'#e27db1';c.lineWidth=3;
 c.beginPath();c.moveTo(50,270);
 for(let x=55;x<590;x+=13){
  const signal=Math.sin(x*.075+index)*10+Math.sin(x*.18+index)*5;
  c.lineTo(x,270+signal*(revealed?1:.35));
 }
 c.stroke();
 for(let i=0;i<3;i++){
  c.fillStyle=i===index?'#e779b4':'#607181';
  c.fillRect(545+i*16,217,10,10);
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return map;
}
function emitterFaceTexture(){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;
 const c=canvas.getContext('2d'),g=c.createRadialGradient(192,192,30,192,192,255);
 g.addColorStop(0,'#263047');g.addColorStop(.55,'#0d1422');g.addColorStop(1,'#080b14');
 c.fillStyle=g;c.fillRect(0,0,384,384);
 c.strokeStyle='#73c9d72b';c.lineWidth=1;
 for(let x=20;x<384;x+=24){c.beginPath();c.moveTo(x,16);c.lineTo(x,368);c.stroke();}
 for(let y=16;y<384;y+=24){c.beginPath();c.moveTo(16,y);c.lineTo(368,y);c.stroke();}
 c.strokeStyle='#80e0e48c';c.lineWidth=3;c.strokeRect(12,12,360,360);
 c.strokeStyle='#e37fba99';c.lineWidth=2;c.strokeRect(21,21,342,342);
 c.strokeStyle='#cf8cb76b';c.lineWidth=4;
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16;
  c.beginPath();c.moveTo(192+Math.cos(a)*135,192+Math.sin(a)*135);
  c.lineTo(192+Math.cos(a)*(i%4===0?155:145),192+Math.sin(a)*(i%4===0?155:145));c.stroke();
 }
 c.strokeStyle='#9cb1c477';c.lineWidth=5;c.beginPath();c.arc(192,192,123,0,Math.PI*2);c.stroke();
 c.fillStyle='#a7dce2';c.font='700 19px monospace';c.textAlign='center';
 c.fillText('F / 09',192,61);c.fillText('NEONBOY',192,346);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return map;
}
function emitterLabelTexture(index,title){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,512,0);
 g.addColorStop(0,'#1c1a2b');g.addColorStop(1,'#0c111d');
 c.fillStyle=g;c.fillRect(0,0,512,128);
 c.strokeStyle='#b59ab6';c.lineWidth=5;c.strokeRect(3,3,506,122);
 c.fillStyle='#df75b1';c.fillRect(10,10,9,108);
 c.fillStyle='#9edfe3';c.font='700 18px monospace';c.fillText('RECEPTOR 0'+(index+1)+' / F09',36,38);
 c.fillStyle='#f6e8e3';c.font='800 47px Arial';c.fillText(title,35,96,310);
 c.strokeStyle='#75d4da';c.lineWidth=4;c.beginPath();c.moveTo(371,89);c.lineTo(472,89);c.stroke();
 for(let i=0;i<3;i++){c.fillStyle=i===index?'#e876b4':'#526b77';c.fillRect(377+i*32,49,20,12);}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return map;
}
function canEnemyStand(x,z,obstacles,self){
 if(x< -9.35||x>9.35||z< -12.2||z>13.6)return false;
 return !obstacles.some(o=>o!==self&&o.x!==999&&Math.abs(x-o.x)<(o.hx??o.radius??.35)+.53&&Math.abs(z-o.z)<(o.hz??o.radius??.35)+.53);
}
function nextStep(start,goal,obstacles,self){
 const cell=.75,minX=-9.1,minZ=-11.95,nx=25,nz=35;
 const index=(x,z)=>Math.max(0,Math.min(nx-1,Math.round((x-minX)/cell)))+nx*Math.max(0,Math.min(nz-1,Math.round((z-minZ)/cell)));
 const startId=index(start.x,start.z),goalId=index(goal.x,goal.z),prev=new Int32Array(nx*nz).fill(-1),queue=[startId];prev[startId]=startId;
 for(let head=0;head<queue.length;head++){
  const id=queue[head];if(id===goalId)break;
  const gx=id%nx,gz=Math.floor(id/nx);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=gx+dx,z=gz+dz,nid=x+nx*z;
   if(x<0||x>=nx||z<0||z>=nz||prev[nid]!==-1)continue;
   if(!canEnemyStand(minX+x*cell,minZ+z*cell,obstacles,self))continue;
   prev[nid]=id;queue.push(nid);
  }
 }
 if(prev[goalId]===-1)return goal;
 let id=goalId;while(prev[id]!==startId&&id!==startId)id=prev[id];
 return {x:minX+(id%nx)*cell,z:minZ+Math.floor(id/nx)*cell};
}
export function createStoreInvasionScene(shop,{onEvent,onDamage}={}){
 const root=new THREE.Group();root.name='Capitulo 9 / invasion de la tienda';shop.root.add(root);
 const pink=new THREE.MeshBasicMaterial({color:0xe85ab5,toneMapped:false});
 const cyan=new THREE.MeshBasicMaterial({color:0x79e6ed,toneMapped:false});
 const red=new THREE.MeshBasicMaterial({color:0xea395a,toneMapped:false});
 const metal=new THREE.MeshStandardMaterial({color:0x2a2734,metalness:.67,roughness:.41});
 const wood=new THREE.MeshStandardMaterial({color:0x594147,roughness:.78});
 const coverMaterial=new THREE.MeshBasicMaterial({color:0x140c19,transparent:true,opacity:0,depthWrite:false});
 const damage = createInvadedStoreDamage(shop);
 const obstacles = invadedStoreObstacles();
 const colliders=[];
 // World collision is independent of the decorative record sleeves and never touches the jukebox screen.
 for(const o of obstacles.slice(0,INVASION_STATIC_COUNT)){
  if(Math.abs(o.x+10.12)<.2&&Math.abs(o.z-8)<.2)continue;
  const height=o.height??2.1;
  const m=box(root,o.hx*2,height,o.hz*2,o.x,height/2,o.z,coverMaterial);m.name='invasion / orb cover';colliders.push(m);
 }
 for(const [w,h,d,x,y,z] of [[.2,4.6,29,-10.95,2.3,.7],[.2,4.6,29,10.95,2.3,.7],[22,4.6,.2,0,2.3,-13.9]])colliders.push(box(root,w,h,d,x,y,z,coverMaterial));
 const crateObstacle={id:'invasion crate',x:8.35,z:-7.2,hx:.56,hz:.51};obstacles.push(crateObstacle);
 const reflectorObstacle={id:'invasion reflector',x:4.65,z:-9.4,hx:.46,hz:.18};obstacles.push(reflectorObstacle);
 const ghostObstacle={id:'invasion ghost',x:999,z:-10.8,radius:.55};obstacles.push(ghostObstacle);
 const bossObstacle={id:'invasion entity',x:999,z:-10.7,radius:.75};obstacles.push(bossObstacle);
 const artifactVisual=createInvasionArtifact(root),artifact=artifactVisual.root;
 artifact.position.set(0,0,-10.9);
 const archiveLine=new THREE.Group();archiveLine.position.set(10.6,0,-7.4);root.add(archiveLine);
 const panel=box(archiveLine,.16,2.2,3.8,-.03,1.7,0,metal);
 panel.name='Invasion / panel de conductores';
 const displayMap=archivePanelTexture();
 const display=new THREE.Mesh(new THREE.PlaneGeometry(3.58,1.98),
  new THREE.MeshBasicMaterial({map:displayMap,toneMapped:false,side:THREE.DoubleSide}));
 display.rotation.y=-Math.PI/2;display.position.set(-.116,1.7,0);archiveLine.add(display);
 const rim=new THREE.MeshStandardMaterial({color:0x788294,metalness:.84,roughness:.25});
 const socketMetal=new THREE.MeshStandardMaterial({color:0x252936,metalness:.78,roughness:.3});
 const pinkCore=new THREE.MeshStandardMaterial({color:0xd76ba9,emissive:0xdb45a1,emissiveIntensity:1.25,metalness:.38,roughness:.22});
 const cyanCore=new THREE.MeshStandardMaterial({color:0x8ee5e8,emissive:0x57cbd2,emissiveIntensity:1.15,metalness:.38,roughness:.22});
 for(const z of [-1.88,1.88])box(archiveLine,.12,2.2,.055,-.15,1.7,z,rim);
 for(const y of [.62,2.78])box(archiveLine,.12,.055,3.82,-.15,y,0,rim);
 for(const y of [.72,2.68])for(const z of [-1.77,1.77]){
  const screw=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),socketMetal);
  screw.position.set(-.22,y,z);archiveLine.add(screw);
 }
 const conductors=[-1.05,0,1.05].map((z,i)=>{
  const holder=new THREE.Group();holder.position.set(-.18,1.72,z);archiveLine.add(holder);
  const socket=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.042,48),socketMetal);
  socket.rotation.z=Math.PI/2;socket.position.x=.034;holder.add(socket);
  const outer=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,8,48),rim);outer.position.x=-.004;outer.rotation.y=Math.PI/2;holder.add(outer);
  const halo=ring(holder,.27,0xe85ab5,-.035,0,0);halo.rotation.y=Math.PI/2;
  const scan=new THREE.Group();scan.rotation.y=Math.PI/2;scan.position.x=-.046;holder.add(scan);
  const arc=new THREE.Mesh(new THREE.TorusGeometry(.355,.008,5,48,Math.PI*1.55),pink);
  scan.add(arc);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.16,24,16),pinkCore);
  core.scale.x=.45;core.position.x=-.048;holder.add(core);
  const center=ring(holder,.11,0xf6c2df,-.1,0,0);center.rotation.y=Math.PI/2;
  const tag=glyphSign(holder,'0'+String(i+1),.37,.17,-.056,-.43,0,'#a6dce4');
  tag.rotation.y=-Math.PI/2;
  return {holder,halo,core,arc,center};
 });
 const archiveArrow=box(archiveLine,.025,.028,3.4,-.19,2.32,0,cyan);archiveArrow.visible=false;
 const panelLight=new THREE.PointLight(0xd776b5,0,3.8,2);
 panelLight.position.set(-.65,1.76,0);archiveLine.add(panelLight);
 const crate=new THREE.Group();crate.position.set(8.35,0,-7.2);root.add(crate);
 box(crate,1.05,.9,.95,0,.45,0,wood);
 for(const side of [-1,1]){box(crate,.08,.94,1.01,side*.46,.45,0,metal);box(crate,1.1,.07,1.02,0,side===1?.84:.08,0,metal);}
 glyphSign(crate,'F09 / ARCHIVO',.91,.25,0,.48,.486);
 const clueMaps=[];
 const clueSigns=CLUES.map(([x,z,text],i)=>{
  const g=new THREE.Group();g.position.set(x,1.75,z);g.rotation.y=Math.PI/2;root.add(g);
  box(g,1.28,.78,.09,0,0,0,metal);
  const bezel=new THREE.MeshStandardMaterial({color:0x777d89,metalness:.8,roughness:.29});
  for(const y of [-.374,.374])box(g,1.28,.025,.095,0,y,.01,bezel);
  for(const x of [-.625,.625])box(g,.025,.74,.095,x,0,.01,bezel);
  const screen=(revealed,depth)=>{
   const map=clueSignTexture(i,text,revealed);clueMaps.push(map);
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.19,.595),
    new THREE.MeshBasicMaterial({map,toneMapped:false}));
   mesh.position.z=depth;g.add(mesh);return mesh;
  };
  const sign=screen(false,.053),hidden=screen(true,.057);
  return {g,hidden,sign};
 });
 const jukeCore=new THREE.Group();jukeCore.position.set(0,2.5,.82);shop.jukebox.add(jukeCore);
 const jukeRing=ring(jukeCore,.3,0xe85ab5,0,0,0);
 const jukeBall=new THREE.Mesh(new THREE.IcosahedronGeometry(.16,1),pink);jukeCore.add(jukeBall);
 for(const [i,symbol] of ['ONDA','SURCO','SILENCIO'].entries())glyphSign(jukeCore,String(i+1)+' / '+symbol,.52,.17,(i-1)*.54,-.54,.04,'#e88abb');
 const emitterFaceMap=emitterFaceTexture(),emitterLabelMaps=[];
 const emitters=EMITTERS.map(([x,y,z],i)=>{
  const holder=new THREE.Group();holder.position.set(x,y,z);root.add(holder);
  box(holder,.72,.72,.13,0,0,-.08,metal);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.675,.675),
   new THREE.MeshBasicMaterial({map:emitterFaceMap,toneMapped:false}));
  face.position.z=-.012;holder.add(face);
  const well=new THREE.Mesh(new THREE.CircleGeometry(.225,40),socketMetal);
  well.position.z=.012;holder.add(well);
  const outer=new THREE.Mesh(new THREE.TorusGeometry(.338,.023,8,48),rim);
  outer.position.z=.02;holder.add(outer);
  const halo=ring(holder,.285,0xe85ab5,0,0,.038);
  const inner=ring(holder,.175,0xe85ab5,0,0,.048);
  const arc=new THREE.Mesh(new THREE.TorusGeometry(.318,.009,5,48,Math.PI*1.48),pink);
  arc.position.z=.063;holder.add(arc);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.17,1),pinkCore);
  core.scale.z=.72;core.position.z=.071;holder.add(core);
  for(const cx of [-.285,.285])for(const cy of [-.285,.285]){
   const screw=new THREE.Mesh(new THREE.SphereGeometry(.017,8,6),rim);
   screw.position.set(cx,cy,.025);holder.add(screw);
  }
  const status=box(holder,.15,.023,.018,0,-.367,.029,pink);
  const labelMap=emitterLabelTexture(i,['SUELO','VIDRIO','CIELO'][i]);
  emitterLabelMaps.push(labelMap);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.2875),
   new THREE.MeshBasicMaterial({map:labelMap,toneMapped:false,side:THREE.DoubleSide}));
  label.position.set(0,-.54,.038);holder.add(label);
  return {holder,halo,inner,arc,core,status};
 });
 const inscription=glyphSign(root,'SUELO  >  VIDRIO  >  CIELO',3.2,.42,0,2.95,-13.57,'#9ee6e9');
 const reflector=new THREE.Group();reflector.position.set(4.65,1.25,-9.4);root.add(reflector);
 const mirror=box(reflector,.9,1.1,.12,0,0,0,metal);mirror.rotation.y=-.35;
 const mirrorFace=new THREE.Mesh(new THREE.PlaneGeometry(.75,.93),new THREE.MeshBasicMaterial({color:0x8eeafa,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false}));mirrorFace.rotation.y=-.35;mirrorFace.position.z=.085;reflector.add(mirrorFace);
 for(const y of [-.53,.53])box(reflector,1.1,.045,.17,0,y,0,cyan);
 const reflectorRail=box(root,1.95,.03,.1,5.1,.02,-9.9,metal);reflectorRail.rotation.y=-.8;
 const circuit=new THREE.Group();root.add(circuit);
 const circuitMaterial=new THREE.MeshBasicMaterial({color:0xe460b5,toneMapped:false,transparent:true,opacity:.7});
 const circuitRestored=new THREE.MeshBasicMaterial({color:0x79e6ed,toneMapped:false,transparent:true,opacity:.85});
 for(const x of [-8,-4,0,4,8]){
  box(circuit,.05,1.1,.025,x,2.1,-13.53,circuitMaterial);
  box(circuit,2.25,.035,.025,x,1.56,-13.53,circuitMaterial);
  box(circuit,.3,.3,.05,x,2.65,-13.53,circuitMaterial);
 }
 const redArcs=new THREE.Group();root.add(redArcs);
 for(const x of [-9.5,9.5]){
  const m=box(redArcs,.035,2.8,.035,x,1.5,-8.2,new THREE.MeshBasicMaterial({color:0xea395a,toneMapped:false,transparent:true,opacity:.48}));
  m.rotation.z=x>0?.18:-.18;
 }
 const invasionLight=new THREE.PointLight(0xea395a,2.5,13,2);invasionLight.position.set(1,3,-9);root.add(invasionLight);
 const archiveLight=new THREE.PointLight(0x74e6ee,0,7,2);archiveLight.position.set(8.3,2.6,-7.4);root.add(archiveLight);
 const passingShadow=new THREE.Mesh(new THREE.PlaneGeometry(.88,2.4),new THREE.MeshBasicMaterial({color:0x030209,transparent:true,opacity:.87,depthWrite:false,side:THREE.DoubleSide}));
 passingShadow.position.set(-7,1.25,-13.2);root.add(passingShadow);passingShadow.visible=false;
 const ghostAnchor=new THREE.Group();ghostAnchor.position.set(2.25,0,-10.9);root.add(ghostAnchor);
 const ghostFallback=new THREE.Mesh(new THREE.SphereGeometry(.55,16,12),new THREE.MeshBasicMaterial({color:0xc49bdf,transparent:true,opacity:.4,depthWrite:false}));
 ghostFallback.position.y=1.35;ghostAnchor.add(ghostFallback);
 const ghostLight=new THREE.PointLight(0xa771d1,0,5,2);ghostLight.position.y=1.55;ghostAnchor.add(ghostLight);
 const bossAnchor=new THREE.Group();bossAnchor.position.set(0,0,-10.7);root.add(bossAnchor);
 const bossFallback=new THREE.Mesh(new THREE.IcosahedronGeometry(.95,1),new THREE.MeshStandardMaterial({color:0x6a153f,emissive:0xd82470,emissiveIntensity:.85,roughness:.25}));bossFallback.position.y=1.55;bossAnchor.add(bossFallback);
 const bossLight=new THREE.PointLight(0xf13473,0,7,2);bossLight.position.y=2;bossAnchor.add(bossLight);
 const bossPulse=ring(bossAnchor,1.25,0xf47bc9,0,1.52,.47,.025);
 bossPulse.material.transparent=true;bossPulse.material.depthWrite=false;
 const deathWave=ring(root,.9,0xf89bd8,0,1.5,-10.7);
 deathWave.material.transparent=true;deathWave.material.depthWrite=false;deathWave.visible=false;
 const generators=[-2.5,2.5].map((x,i)=>createInvasionGenerator(root,x,i));
 const generatorBursts=generators.map(({group})=>{
  const flash=ring(root,.52,0xa7f6ff,group.position.x,group.position.y,group.position.z+.42);
  flash.material.transparent=true;flash.material.depthWrite=false;flash.visible=false;
  return {flash,age:1};
 });
 const warning=ring(root,.62,0xea395a,0,.045,0,.035);warning.rotation.x=Math.PI/2;warning.visible=false;
 const shot=createEnemyOrbVisual(createOrbGlowTexture(),.3);root.add(shot.root);
 let ghost=null,demon=null,demonMixer=null,demonMode=null,demonActions={},
 modelStatus={ghost:false,demon:false},time=0,ghostMaterialized=false,bossVulnerable=false,
 ghostCooldown=1.6,bossCooldown=2.1,bossMeleeCooldown=1.4,ghostWindup=0,bossWindup=0,bossMeleeWindup=0,
 bossPathTimer=0,bossPathPoint=null,bossDeathRemaining=0,bossStateInitialized=false,bossWasDefeated=false,
 shotVelocity=new THREE.Vector3(),shotLife=0,damageCooldown=0,pathTimer=0,pathPoint=null;
 const ray=new THREE.Raycaster(),prev=new THREE.Vector3();
 const interactions=[
  {id:'invasion-jukebox',label:'señal de la rockola',x:-8.15,z:8.05,reach:1.65},
  ...CLUES.map(([x,z],i)=>({id:'invasion-clue-'+i,label:'pista del pulso '+(i+1),x:-8.7,z,reach:1.8})),
  {id:'invasion-crate',label:'caja de archivo',x:7.1,z:-7.2,reach:1.75},
  {id:'invasion-archive-panel',label:'panel oculto',x:7.8,z:-7.4,reach:2.5},
  {id:'invasion-inscription',label:'inscripción de la señal',x:0,z:-11.2,reach:2.5},
  {id:'invasion-reflector',label:'reflector de señal',x:4.65,z:-9.4,reach:2.1},
  {id:'invasion-core',label:'núcleo principal',x:0,z:-9.4,reach:2.6},
 ];
 async function loadAssets(loader,isAlive){
  const results=await Promise.allSettled([
   loadRecordStoreGhost(loader,ghostAnchor,isAlive,2.4).then(value=>{ghost=value;ghostFallback.visible=!value;modelStatus.ghost=Boolean(value);}),
   loader.loadAsync(DEMON_URL).then(async gltf=>{
    if(!isAlive())return;
    const model=gltf.scene,bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
    const group=new THREE.Group();group.scale.setScalar(2.6/Math.max(.01,size.y));
    model.position.set(-bounds.getCenter(tmp).x,-bounds.min.y,-bounds.getCenter(tmp).z);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    group.add(model);bossAnchor.add(group);demon=group;bossFallback.visible=false;modelStatus.demon=true;
    // The first authored clip crouches the hips by half a unit. Use the upright
    // rest clip as the root baseline so walking and attacks stay above the floor.
    const idleClip=gltf.animations[1]||gltf.animations[0];
    if(!idleClip)return;
    const knownNodes=new Set();model.traverse(o=>{if(o.name)knownNodes.add(o.name);});
    const idleHips=idleClip.tracks.find(track=>/Hips\.position$/.test(track.name));
    demonMixer=new THREE.AnimationMixer(model);
    demonActions.idle=demonMixer.clipAction(idleClip);
    demonActions.idle.play();demonMode='idle';
    const entries=Object.entries(DEMON_CLIP_URLS);
    const loaded=await Promise.allSettled(entries.map(([,url])=>loader.loadAsync(url)));
    if(!isAlive())return;
    loaded.forEach((result,i)=>{
     if(result.status!=='fulfilled'||!result.value.animations.length)return;
     const [mode]=entries[i],clip=result.value.animations[0].clone();
     clip.tracks=clip.tracks.filter(track=>knownNodes.has(track.name.split('.')[0]));
     const hips=clip.tracks.find(track=>/Hips\.position$/.test(track.name));
     if(hips&&idleHips){
      const startY=hips.values[1],baseX=idleHips.values[0],baseY=idleHips.values[1],baseZ=idleHips.values[2];
      for(let index=0;index<hips.values.length;index+=3){
       hips.values[index]=baseX;hips.values[index+1]=baseY+(hips.values[index+1]-startY)*.6;hips.values[index+2]=baseZ;
      }
     }
     if(!clip.tracks.length)return;
     demonActions[mode]=demonMixer.clipAction(clip);
     if(mode!=='walk'){demonActions[mode].setLoop(THREE.LoopOnce,1);demonActions[mode].clampWhenFinished=mode==='death';}
     if(mode==='attack')demonActions[mode].timeScale=2.7;
     if(mode==='melee')demonActions[mode].timeScale=3.2;
    });
   })]);
  return modelStatus;
 }
 function setDemonMode(mode){
  const selected=demonActions[mode]?mode:'idle';
  const next=demonActions[selected];
  if(!next||demonMode===selected)return;
  demonActions[demonMode]?.fadeOut(.16);
  next.reset().setEffectiveWeight(1).fadeIn(.16).play();
  demonMode=selected;
 }
 function getTargets(p){
  if(!p?.started||p.coreNeutralized)return [];
  const targets=[];
  if(p.visionActive&&p.jukeboxArmed&&!p.jukeboxOff){jukeCore.getWorldPosition(tmp);targets.push({kind:'invasion-jukebox-core',position:tmp.clone(),radius:.32});}
  if(p.visionActive&&p.archivePanelSeen&&!p.archiveOff)conductors.forEach(({holder},index)=>{
   if(p.conductors.includes(index))return;holder.getWorldPosition(tmp);targets.push({kind:'invasion-conductor',index,position:tmp.clone(),radius:.28});
  });
  if(p.archiveOff&&!p.ghostDefeated&&ghostMaterialized){targets.push({kind:'invasion-ghost',position:new THREE.Vector3(ghostAnchor.position.x,1.35,ghostAnchor.position.z),radius:.65,capsuleHalfHeight:.62,returnHit:true});}
  if(p.jukeboxOff&&p.archiveOff&&p.ghostDefeated&&!p.transmissionOff&&p.visionActive){
   emitters.forEach(({holder},index)=>{if(!p.emitters.includes(index))targets.push({kind:'invasion-emitter',index,position:holder.position.clone(),radius:.35});});
   if(p.emitters.length===2){targets.push({kind:'invasion-reflector',position:reflector.position.clone(),radius:.55,reflect:true,normal:new THREE.Vector3(1,0,0)});}
  }
  if(p.transmissionOff&&!p.bossDefeated){
   generators.forEach(({group},index)=>{if(!p.generators[index])targets.push({kind:'invasion-generator',index,position:group.position.clone().add(new THREE.Vector3(0,-.04,.32)),radius:.5,capsuleHalfHeight:.43});});
   targets.push({kind:'invasion-boss',position:new THREE.Vector3(bossAnchor.position.x,1.55,bossAnchor.position.z),radius:.85,capsuleHalfHeight:.72,returnHit:true});
  }
  return targets;
 }
 function registerImpact(target){
  const p=currentProgress;
  if(!p)return null;
  if(target.kind==='invasion-reflector'){
   if(p.reflectorSlot!==1){onEvent?.('feedback','Mové el reflector a la segunda marca.');return null;}
   const incoming=target.incoming?.clone().normalize();if(!incoming)return null;
   const outgoing=new THREE.Vector3(...EMITTERS[2]).sub(target.position).normalize();
   target.normal.copy(incoming.sub(outgoing).normalize());
   return {reflect:true};
  }
  if(target.kind==='invasion-jukebox-core')onEvent?.('juke-hit');
  else if(target.kind==='invasion-conductor')onEvent?.('archive-node',target.index);
  else if(target.kind==='invasion-ghost')onEvent?.('ghost-hit');
  else if(target.kind==='invasion-emitter')onEvent?.('emitter-hit',{index:target.index,reflected:target.ricochets>0});
  else if(target.kind==='invasion-generator'){
   if(p.transmissionOff&&!p.generators[target.index]){
    const burst=generatorBursts[target.index];burst.age=0;burst.flash.visible=true;
    onEvent?.('generator-hit',target.index);
   }
  }
  else if(target.kind==='invasion-boss')onEvent?.('boss-hit',{vulnerable:bossVulnerable});
  return null;
 }
 let currentProgress=null;
 function update(dt,p,player,paused=false,reducedMotion=false,introAge=0,camera=null){
  currentProgress=p;
  if(!p?.started)return;
  const step=paused?0:dt;time+=step;damageCooldown=Math.max(0,damageCooldown-step);
  const vision=p.visionActive,completed=p.coreNeutralized;
  circuit.visible=vision&&!completed;circuitMaterial.color.setHex(p.transmissionOff?0x79e6ed:0xe460b5);
  archiveLight.intensity=p.archiveOff?completed?1.2:2.8:0;
  redArcs.visible=!completed;redArcs.children.forEach((m,i)=>{m.material.opacity=.2+.23*(1+Math.sin(time*3.8+i*1.8))*.5;});
  invasionLight.intensity=completed?.4:introAge>0&&introAge<6.3?1+3.1*Math.abs(Math.sin(time*8.7)):2.4+.5*Math.sin(time*2.3);
  passingShadow.visible=introAge>1.55&&introAge<3.45&&!completed;
  if(passingShadow.visible)passingShadow.position.x=-8+((introAge-1.55)/1.9)*16;

  clueSigns.forEach(({hidden,sign})=>{hidden.visible=vision&&!completed;sign.visible=!hidden.visible;});
  jukeCore.visible=vision&&!p.jukeboxOff; jukeRing.material=p.jukeboxArmed?cyan:pink;
  crate.position.z=THREE.MathUtils.damp(crate.position.z,-7.2+p.crateSlot*1.1,9,step);
  crateObstacle.z=-7.2+p.crateSlot*1.1;
  interactions[4].z=crateObstacle.z; // crate follows its saved rail slot
  interactions[5].x=p.crateSlot===2?7.8:999;
  conductors.forEach(({holder,halo,core,arc,center},i)=>{
   const resolved=p.conductors.includes(i);
   holder.visible=vision&&p.crateSlot===2&&!p.archiveOff;
   halo.material=resolved?cyan:pink;
   core.material=resolved?cyanCore:pinkCore;
   arc.material=resolved?cyan:pink;
   center.material=resolved?cyan:pink;
   if(!paused&&!reducedMotion)arc.rotation.z+=step*(resolved?.35:.7);
   const pulse=reducedMotion?1:1+.075*Math.sin(time*3.8+i*2.1);
   core.scale.y=core.scale.z=pulse;
  });
  archiveArrow.visible=vision&&p.crateSlot===2&&!p.archiveOff;
  panelLight.intensity=archiveArrow.visible?(reducedMotion?1.2:1.1+.24*Math.sin(time*2.7)):0;
  emitters.forEach(({holder,halo,inner,arc,core,status},i)=>{
   const resolved=p.emitters.includes(i),signal=resolved?cyan:pink;
   holder.visible=vision&&!p.transmissionOff&&p.jukeboxOff&&p.archiveOff;
   halo.material=inner.material=arc.material=status.material=signal;
   core.material=resolved?cyanCore:pinkCore;
   if(!paused&&!reducedMotion)arc.rotation.z-=step*(resolved?.3:.68);
   core.rotation.y+=step*.35;
   core.scale.x=core.scale.y=reducedMotion?1:.94+.06*Math.sin(time*3.5+i*1.7);
  });
  inscription.visible=vision&&!completed;
  reflector.position.x=THREE.MathUtils.damp(reflector.position.x,p.reflectorSlot?5.65:4.65,8,step);
  reflector.position.z=THREE.MathUtils.damp(reflector.position.z,p.reflectorSlot?-10.25:-9.4,8,step);
  reflectorObstacle.x=reflector.visible?reflector.position.x:999;reflectorObstacle.z=reflector.position.z;
  interactions[7].x=reflector.position.x;interactions[7].z=reflector.position.z;
  reflector.visible=vision&&p.jukeboxOff&&p.archiveOff&&!p.transmissionOff;
  reflectorRail.visible=reflector.visible;
  const ghostActive=p.archiveOff&&!p.ghostDefeated;
  ghostAnchor.visible=ghostActive;
  ghostObstacle.x=ghostActive?ghostAnchor.position.x:999;ghostObstacle.z=ghostAnchor.position.z;
  ghostMaterialized=vision||Math.sin(time*2.2)>-.08;
  const opacity=ghostMaterialized?.78:.18;
  ghost?.update(step,time,ghostActive,opacity);
  ghostFallback.visible=ghostActive&&!ghost;
  ghostFallback.material.opacity=opacity*.6;
  ghostLight.intensity=ghostActive?(vision?3.4:ghostMaterialized?1.7:.3):0;
  if(!bossStateInitialized){bossStateInitialized=true;bossWasDefeated=p.bossDefeated;}
  else if(p.bossDefeated&&!bossWasDefeated){
   bossDeathRemaining=3.05;setDemonMode('death');shot.clear();shotLife=0;
   artifact.position.set(bossAnchor.position.x,0,bossAnchor.position.z);
   deathWave.position.set(bossAnchor.position.x,1.5,bossAnchor.position.z+.5);
   deathWave.visible=true;
  }
  bossWasDefeated=p.bossDefeated;
  bossDeathRemaining=Math.max(0,bossDeathRemaining-step);
  if(deathWave.visible){
   const progress=1-bossDeathRemaining/3.05;
   deathWave.scale.setScalar(1+progress*2.8);
   deathWave.material.opacity=(1-progress)*(1-progress)*.85;
   if(bossDeathRemaining===0)deathWave.visible=false;
  }
  const bossActive=p.transmissionOff&&!p.bossDefeated;
  bossAnchor.visible=bossActive||bossDeathRemaining>0;
  bossObstacle.x=bossActive?bossAnchor.position.x:999;
  bossObstacle.z=bossAnchor.position.z;
  generators.forEach((generator,i)=>generator.update(time,p.transmissionOff,p.generators[i],reducedMotion));
  const shieldUp=bossActive&&!p.generators.every(Boolean);
  bossVulnerable=bossActive&&!shieldUp&&Math.sin(time*1.35)>.05;
  bossPulse.visible=bossVulnerable;
  bossPulse.material.opacity=bossVulnerable?.58+.24*Math.sin(time*8):0;
  bossPulse.scale.setScalar(1+.05*Math.sin(time*8));
  generatorBursts.forEach(burst=>{
   const {flash}=burst;
   if(!flash.visible)return;
   burst.age=Math.min(1,burst.age+step*1.7);
   flash.scale.setScalar(1+burst.age*2.4);
   flash.material.opacity=(1-burst.age)*.9;
   if(burst.age>=1)flash.visible=false;
  });
  bossLight.intensity=bossActive?(bossVulnerable?5.5:2.3):bossDeathRemaining>0?2.5+1.8*bossDeathRemaining/3.05:0;
  bossFallback.rotation.y+=step*.35;
  artifact.visible=p.bossDefeated&&bossDeathRemaining===0;
  artifactVisual.update(time,reducedMotion,completed);
  interactions[8].x=artifact.visible?artifact.position.x:999;
  interactions[8].z=artifact.position.z+1.3;
  warning.visible=false;
  if(!paused&&ghostActive){
   const distance=Math.hypot(player.x-ghostAnchor.position.x,player.z-ghostAnchor.position.z);
   if(distance<10&&distance>1.25){
    pathTimer-=step;if(pathTimer<=0){pathTimer=.65;pathPoint=nextStep(ghostAnchor.position,player,obstacles,ghostObstacle);}
    const goal=pathPoint||player,dx=goal.x-ghostAnchor.position.x,dz=goal.z-ghostAnchor.position.z,len=Math.hypot(dx,dz);
    const move=Math.min(len,step*1.65);
    if(len>.05){const nx=ghostAnchor.position.x+dx/len*move,nz=ghostAnchor.position.z+dz/len*move;
     if(canEnemyStand(nx,nz,obstacles,ghostObstacle)){ghostAnchor.position.x=nx;ghostAnchor.position.z=nz;}}
   }
   ghostCooldown=Math.max(0,ghostCooldown-step);
   if(distance<2&&ghostCooldown===0&&ghostWindup===0){ghostWindup=.55;ghostCooldown=2.1;}
   if(ghostWindup>0){ghostWindup-=step;warning.position.set(ghostAnchor.position.x,.045,ghostAnchor.position.z);warning.visible=true;
    if(ghostWindup<=0&&distance<2.2&&damageCooldown===0){onDamage?.(1);damageCooldown=1.4;}}
  }
  if(!paused&&bossActive){
   const dx=player.x-bossAnchor.position.x,dz=player.z-bossAnchor.position.z;
   const distance=Math.hypot(dx,dz),facing=Math.atan2(dx,dz);
   const turn=Math.atan2(Math.sin(facing-bossAnchor.rotation.y),Math.cos(facing-bossAnchor.rotation.y));
   bossAnchor.rotation.y+=turn*Math.min(1,step*5);
   bossCooldown=Math.max(0,bossCooldown-step);
   bossMeleeCooldown=Math.max(0,bossMeleeCooldown-step);
   if(bossMeleeWindup>0){
    bossMeleeWindup-=step;setDemonMode('melee');
    warning.position.set(bossAnchor.position.x,.045,bossAnchor.position.z);
    warning.scale.setScalar(2.4);warning.visible=true;
    if(bossMeleeWindup<=0&&distance<2.35&&damageCooldown===0){onDamage?.(1);damageCooldown=1.4;}
   }else if(bossWindup>0){
    bossWindup-=step;setDemonMode('attack');
    warning.position.set(player.x,.045,player.z);warning.scale.setScalar(1);warning.visible=true;
    if(bossWindup<=0){
     const origin=new THREE.Vector3(bossAnchor.position.x,1.65,bossAnchor.position.z);
     const direction=new THREE.Vector3(player.x-origin.x,player.y+1.2-origin.y,player.z-origin.z).normalize();
     origin.addScaledVector(direction,1.05);
     shot.start(origin,direction,true);shotVelocity.copy(direction).multiplyScalar(7.8);shotLife=3;
    }
   }else if(distance<2.25&&bossMeleeCooldown===0){
    bossMeleeWindup=.58;bossMeleeCooldown=2.6;setDemonMode('melee');
   }else if(distance>=2.25&&distance<9.5&&bossCooldown===0&&shotLife<=0){
    bossWindup=.72;bossCooldown=3.15;setDemonMode('attack');
   }else{
    const engaged=distance<9.5&&player.z< -2.5;
    const goal=engaged
     ?{x:THREE.MathUtils.clamp(player.x,-5,5),z:THREE.MathUtils.clamp(player.z,-11.4,-4.7)}
     :{x:Math.sin(time*.37)*2.3,z:-10.45+Math.sin(time*.26)*.7};
    if(!engaged||distance>1.95){
     bossPathTimer-=step;
     if(bossPathTimer<=0){bossPathTimer=.42;bossPathPoint=nextStep(bossAnchor.position,goal,obstacles,bossObstacle);}
     const waypoint=bossPathPoint||goal;
     const vx=waypoint.x-bossAnchor.position.x,vz=waypoint.z-bossAnchor.position.z,len=Math.hypot(vx,vz);
     if(len>.08){
      const amount=Math.min(len,step*(p.generators.every(Boolean)?1.7:1.35));
      const nx=bossAnchor.position.x+vx/len*amount,nz=bossAnchor.position.z+vz/len*amount;
      if(nz< -4.5&&canEnemyStand(nx,nz,obstacles,bossObstacle)){
       bossAnchor.position.x=nx;bossAnchor.position.z=nz;setDemonMode('walk');
      }else setDemonMode('idle');
     }else setDemonMode('idle');
    }else setDemonMode('idle');
   }
  }
  if(shotLife>0){
   prev.copy(shot.body.position);shot.body.position.addScaledVector(shotVelocity,step);shotLife-=step;
   const dist=prev.distanceTo(shot.body.position);
   if(dist>0){ray.set(prev,shotVelocity.clone().normalize());ray.far=dist;
    if(ray.intersectObjects(colliders,false).length){shot.finish();shotLife=0;}}
   if(shotLife>0&&Math.hypot(shot.body.position.x-player.x,shot.body.position.z-player.z)<.6&&Math.abs(shot.body.position.y-player.y-1.2)<.75){
    if(damageCooldown===0){onDamage?.(1);damageCooldown=1.4;}shot.finish(true);shotLife=0;
   }
   if(shotLife<=0)shot.finish();
  }
  demonMixer?.update(step);
  if(demon){
   const floorLift=demonMode==='walk'?.1:demonMode==='attack'?.06:0;
   demon.position.y=floorLift+(bossDeathRemaining>0?0:Math.sin(time*2.2)*.008);
  }
  shot.update(step,time,reducedMotion);
  damage.update(step,p,reducedMotion,camera);
 }
 ghostAnchor.visible=false;bossAnchor.visible=false;jukeCore.visible=false;circuit.visible=false;redArcs.visible=false;reflector.visible=false;reflectorRail.visible=false;inscription.visible=false;archiveArrow.visible=false;passingShadow.visible=false;
 for(const item of clueSigns)item.hidden.visible=false;
 for(const item of emitters)item.holder.visible=false;
 for(const item of conductors)item.holder.visible=false;
 for(const item of generators)item.group.visible=false;
 function dispose(){generators.forEach(generator=>generator.dispose());ghost?.dispose();demonMixer?.stopAllAction();shot.clear();displayMap.dispose();clueMaps.forEach(map=>map.dispose());emitterFaceMap.dispose();emitterLabelMaps.forEach(map=>map.dispose());}
 return {root,obstacles,colliders,interactions,loadAssets,getTargets,registerImpact,update,dispose,getModelStatus:()=>modelStatus};
}
