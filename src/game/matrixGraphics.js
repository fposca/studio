import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createLowDriftingFog} from './lowDriftingFog.js';
import {createOrbHalo} from './neonOrbVisuals.js';
import {MATRIX_SECTORS} from './matrixLayout.js';
import {createMatrixFrequencyVision} from './matrixFrequencyVision.js';

const TAU=Math.PI*2;
function randomSource(seed=903){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function canvasTexture(w,h,paint){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'),w,h);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function panelTexture(floor=false){
 return canvasTexture(1024,1024,c=>{
  const rand=randomSource(floor?17:29);
  c.fillStyle=floor?'#677581':'#485c6b';c.fillRect(0,0,1024,1024);
  for(let i=0;i<22000;i++){const shade=Math.floor(80+rand()*130);c.fillStyle=`rgba(${shade},${shade},${shade},.045)`;c.fillRect(rand()*1024,rand()*1024,rand()*8+1,1);}
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
   const x=col*512,y=row*512;
   c.fillStyle=`rgba(12,23,31,${.025+(col+row)*.018})`;c.fillRect(x,y,512,512);
   c.fillStyle='#253541';c.fillRect(x,y,512,5);c.fillRect(x,y,5,512);
   c.strokeStyle='#89979f';c.lineWidth=2;c.strokeRect(x+9,y+9,494,494);
   c.strokeStyle='#394c59';c.lineWidth=4;c.strokeRect(x+18,y+18,476,476);
   for(const dx of [29,483])for(const dy of [29,483]){c.fillStyle='#182b37';c.beginPath();c.arc(x+dx,y+dy,5,0,TAU);c.fill();c.strokeStyle='#9ba8ae';c.lineWidth=1;c.beginPath();c.moveTo(x+dx-3,y+dy);c.lineTo(x+dx+3,y+dy);c.stroke();}
   c.fillStyle='#9caaaf';c.font='12px monospace';c.fillText(floor?'F09 / DECK 03':'NEX SYSTEMS // 09',x+44,y+52);
   if(!floor){c.fillStyle='#223743';c.fillRect(x+46,y+92,420,76);for(let i=0;i<26;i++){c.fillStyle='#637886';c.fillRect(x+53+i*15,y+98,4,64);}c.fillStyle='#273e4c';c.fillRect(x+46,y+395,420,30);}
   else{c.fillStyle='#7b9099';c.fillRect(x+47,y+457,37,4);c.fillRect(x+90,y+457,12,4);}
   for(let i=0;i<70;i++){const px=x+rand()*490,py=y+rand()*490;c.strokeStyle=`rgba(16,32,43,${rand()*.12})`;c.lineWidth=rand()*2;c.beginPath();c.moveTo(px,py);c.lineTo(px+rand()*24,py+rand()*3);c.stroke();}
  }
 });
}
export function matrixSurfaceGeometry(w,h,d,scale=4){
 const g=new THREE.BoxGeometry(w,h,d),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/scale,(Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))/scale);
 return g;
}
export function createMatrixMaterials(){
 const floorMap=panelTexture(true),wallMap=panelTexture();
 for(const t of [floorMap,wallMap])t.wrapS=t.wrapT=THREE.RepeatWrapping;
 return {
  floor:new THREE.MeshStandardMaterial({map:floorMap,color:0x9a9ea2,metalness:.5,roughness:.57,bumpMap:floorMap,bumpScale:.022,emissive:0x142332,emissiveIntensity:.18}),
  wall:new THREE.MeshStandardMaterial({map:wallMap,color:0x8594a4,metalness:.55,roughness:.5,bumpMap:wallMap,bumpScale:.028}),
  dark:new THREE.MeshStandardMaterial({color:0x182b3b,metalness:.58,roughness:.43}),
  screen:new THREE.MeshBasicMaterial({color:0x142d3c,toneMapped:false}),
  cyan:new THREE.MeshBasicMaterial({color:0x7de6ee,toneMapped:false}),
  pink:new THREE.MeshBasicMaterial({color:0xd25ba9,toneMapped:false}),
  red:new THREE.MeshBasicMaterial({color:0xf26679,toneMapped:false}),
  white:new THREE.MeshBasicMaterial({color:0xd5efff,toneMapped:false}),
  glass:new THREE.MeshBasicMaterial({color:0x49c6e1,transparent:true,opacity:.23,side:THREE.DoubleSide,depthWrite:false}),
 };
}
export function createMatrixSign(parent,text,x,y,z,width=3.6,color='#98ecf4'){
 const height=Math.max(.5,Math.min(.85,width*.145));
 const map=canvasTexture(1024,192,c=>{
  const bg=c.createLinearGradient(0,0,0,192);bg.addColorStop(0,'#1b2e3c');bg.addColorStop(.6,'#0c1723');bg.addColorStop(1,'#101b28');
  c.fillStyle=bg;c.fillRect(0,0,1024,192);c.strokeStyle='#54717e';c.lineWidth=2;c.strokeRect(10,10,1004,172);
  c.fillStyle=color;c.fillRect(20,23,4,144);c.fillRect(972,164,30,4);c.fillRect(937,164,25,4);
  c.globalAlpha=.64;c.font='bold 17px monospace';c.textAlign='left';c.fillText('F09  /  NEURAL NETWORK',40,43);c.textAlign='right';c.fillText('03',978,43);c.globalAlpha=1;
  c.textAlign='center';c.textBaseline='middle';c.font='700 50px Arial';c.fillStyle='#e1f2f1';c.fillText(text,512,107,925);
  c.strokeStyle=color;c.globalAlpha=.38;c.beginPath();c.moveTo(40,158);c.lineTo(900,158);c.stroke();
 });
 const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);
 const frame=new THREE.Mesh(new RoundedBoxGeometry(width+.075,height+.06,.09,1,.02),new THREE.MeshStandardMaterial({color:0x263d4b,metalness:.7,roughness:.4}));group.add(frame);
 const material=new THREE.MeshBasicMaterial({map,toneMapped:false});
 for(const side of [1,-1]){const face=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);face.position.z=.049*side;face.rotation.y=side===1?0:Math.PI;group.add(face);}
 return group;
}
export function createMatrixBossNodeSign(parent,index,x,y,z){
 const width=2.78,height=.78;
 const texture=activated=>canvasTexture(1024,288,c=>{
  const accent=activated?'#7de6ee':'#fa76d5';
  const bg=c.createLinearGradient(0,0,1024,288);
  bg.addColorStop(0,'#132636');bg.addColorStop(.55,'#101b2b');bg.addColorStop(1,'#091522');
  c.fillStyle=bg;c.fillRect(0,0,1024,288);
  c.strokeStyle=accent;c.lineWidth=8;c.strokeRect(12,12,1000,264);
  c.strokeStyle='#6b92a2';c.lineWidth=2;c.strokeRect(24,24,976,240);
  c.fillStyle=accent;c.fillRect(26,26,190,176);
  c.fillStyle='#071723';c.font='900 113px Arial';c.textAlign='center';c.textBaseline='middle';
  c.fillText(String(index+1).padStart(2,'0'),121,116);
  c.fillStyle='#96b9c7';c.font='700 25px Arial';c.textAlign='left';c.fillText('PROTOCOLO / ESPEJO',248,63);
  c.fillStyle='#f3f8ff';c.font='900 91px Arial';c.fillText('N\u00daCLEO',244,146,545);
  c.fillStyle=accent;c.fillRect(804,91,176,65);
  c.fillStyle='#091522';c.font='900 30px Arial';c.textAlign='center';c.fillText(activated?'HECHO':'EXTRA',892,124);
  c.fillStyle=activated?'#174853':'#38213e';c.fillRect(25,207,973,56);
  c.fillStyle=activated?'#b9fcff':'#ffe6f7';c.font='800 43px Arial';c.textAlign='left';
  c.fillText(activated?'ACTIVADO  /  -1 VIDA':'C: VISI\u00d3N  +  ORBE  =  -1 VIDA',43,239,935);
 });
 const maps=[texture(false),texture(true)];
 const faces=maps.map(map=>new THREE.MeshBasicMaterial({map,toneMapped:false,side:THREE.FrontSide}));
 const frameMaterial=new THREE.MeshStandardMaterial({color:0x1d3545,metalness:.72,roughness:.36,emissive:0x2e1530,emissiveIntensity:.42});
 const group=new THREE.Group();group.position.set(x,y,z);group.name='Boss node '+(index+1)+' / instruction panel';parent.add(group);
 const frame=new THREE.Mesh(new RoundedBoxGeometry(width+.09,height+.09,.13,3,.035),frameMaterial);frame.name='boss node sign collider';group.add(frame);
 const panels=[];
 for(const side of [1,-1]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),faces[0]);panel.position.z=.069*side;panel.rotation.y=side===1?0:Math.PI;group.add(panel);panels.push(panel);}
 const edgeMaterial=new THREE.MeshBasicMaterial({color:0xfa76d5,toneMapped:false});
 const edge=new THREE.Mesh(new THREE.BoxGeometry(width+.11,.025,.145),edgeMaterial);edge.position.y=-height/2-.05;group.add(edge);
 const footMaterial=new THREE.MeshStandardMaterial({color:0x587586,metalness:.78,roughness:.32});
 for(const footX of [-.98,.98]){const foot=new THREE.Mesh(new THREE.BoxGeometry(.075,.29,.12),footMaterial);foot.position.set(footX,-.57,0);group.add(foot);}
 group.userData.halfWidth=(width+.09)/2;group.userData.halfDepth=.07;
 let current=false;
 group.setActivated=activated=>{if(current===activated)return;current=activated;for(const panel of panels)panel.material=faces[activated?1:0];edgeMaterial.color.setHex(activated?0x7de6ee:0xfa76d5);frameMaterial.emissive.setHex(activated?0x123b47:0x2e1530);};
 return group;
}
function addMesh(parent,g,m,x=0,y=0,z=0){const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
// Every group of fixed trim is instanced by material, including local trim on moving puzzle pieces.
function boxBatch(parent){
 const batches=new Map();
 const add=(mat,x,y,z,w,h,d,ry=0,rz=0)=>{if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push([x,y,z,w,h,d,ry,rz]);};
 add.flush=()=>{const g=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();for(const [material,items] of batches){
  const mesh=new THREE.InstancedMesh(g,material,items.length);mesh.name='matrix / instanced architectural detail';
  items.forEach(([x,y,z,w,h,d,ry,rz],i)=>{dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.receiveShadow=true;mesh.computeBoundingSphere();parent.add(mesh);
 }batches.clear();};return add;
}
function screenMap(kind,index=0){
 const titles={concert:'BURN LIES',store:'UN FUTURO IMPOSIBLE',ship:'TRANSMISION 01',echo:'MEMORIA RESIDUAL',energy:'RED DE ENERGIA',auth:'CONTROL DE ACCESO',archive:'EL ARCHIVISTA'};
 return canvasTexture(768,432,c=>{
  const rand=randomSource(50+index),color=kind==='concert'||kind==='archive'?'#e080c2':'#69dce0';
  c.fillStyle='#091820';c.fillRect(0,0,768,432);
  const gradient=c.createRadialGradient(380,200,10,380,200,370);gradient.addColorStop(0,kind==='concert'?'#482044':'#12394a');gradient.addColorStop(1,'#07131d');c.fillStyle=gradient;c.fillRect(16,56,736,328);
  c.fillStyle=color;c.font='bold 15px monospace';c.fillText('NEURAL MEMORY / '+String(index+1).padStart(2,'0'),28,30);c.textAlign='right';c.fillText('FREQUENCY 09',740,30);c.textAlign='left';
  c.globalAlpha=.18;c.strokeStyle=color;c.lineWidth=1;for(let x=32;x<760;x+=32){c.beginPath();c.moveTo(x,58);c.lineTo(x,370);c.stroke();}for(let y=58;y<380;y+=32){c.beginPath();c.moveTo(16,y);c.lineTo(752,y);c.stroke();}c.globalAlpha=1;
  if(['concert','store','ship','echo'].includes(kind)){
   if(kind==='concert'){
    for(let i=0;i<5;i++){c.fillStyle=i%2?'#802b70':'#254b63';c.beginPath();c.moveTo(160+i*110,80);c.lineTo(80+i*105,280);c.lineTo(280+i*110,280);c.fill();}
    c.fillStyle='#080f1b';c.fillRect(110,266,550,15);for(let i=0;i<5;i++){c.beginPath();c.arc(190+i*100,218,11,0,TAU);c.fill();c.fillRect(181+i*100,229,18,37);}
    for(let i=0;i<43;i++){c.beginPath();c.arc(72+i*15,302+rand()*12,7,0,TAU);c.fill();}
   }else if(kind==='store'){
    for(let row=0;row<2;row++)for(let col=0;col<7;col++){const x=80+col*89,y=100+row*110;c.fillStyle=['#244f62','#58354d','#746951'][col%3];c.fillRect(x,y,70,85);c.fillStyle='#091925';c.beginPath();c.arc(x+35,y+40,28,0,TAU);c.fill();c.strokeStyle=color;c.beginPath();c.arc(x+35,y+40,9,0,TAU);c.stroke();}
   }else{
    c.strokeStyle=color;c.lineWidth=2;for(let i=0;i<5;i++){c.strokeRect(170+i*28,80+i*20,430-i*56,235-i*35);}
    c.beginPath();c.moveTo(180,300);c.lineTo(380,180);c.lineTo(590,300);c.moveTo(380,180);c.lineTo(380,75);c.stroke();
   }
  }else{
   c.strokeStyle=color;c.lineWidth=3;for(let i=0;i<3;i++){const x=147+i*237;c.beginPath();c.arc(x,192,60,0,TAU*.84);c.stroke();c.fillStyle=color;c.font='bold 40px monospace';c.textAlign='center';c.fillText(kind==='energy'?['02','01','02'][i]:['09','03','01'][i],x,206);c.textAlign='left';}
   for(let i=0;i<34;i++){c.fillStyle=i%6===0?'#e294b9':color;c.globalAlpha=.4+rand()*.6;c.fillRect(45+i*20,323-rand()*36,12,20+rand()*20);}c.globalAlpha=1;
  }
  c.fillStyle='#0a1825';c.fillRect(16,358,736,56);c.fillStyle='#d9efee';c.font='bold 25px monospace';c.fillText(titles[kind]||titles.echo,30,389);
  c.fillStyle=color;c.fillRect(17,423,580,3);c.font='12px monospace';c.fillText('DATA STREAM  //  009.003  //  RECOVERING',30,348);
  c.fillStyle='rgba(3,12,22,.19)';for(let y=0;y<432;y+=4)c.fillRect(0,y,768,1);
 });
}
function archiveScreenMap(){
 return canvasTexture(768,384,c=>{
  const gradient=c.createLinearGradient(0,0,768,384);
  gradient.addColorStop(0,'#071722');gradient.addColorStop(.55,'#102c3a');gradient.addColorStop(1,'#0b1727');
  c.fillStyle=gradient;c.fillRect(0,0,768,384);
  c.strokeStyle='#315f6d';c.lineWidth=2;c.strokeRect(12,12,744,360);
  c.fillStyle='#84deeb';c.font='700 18px monospace';c.fillText('F09 / ARCHIVO CENTRAL',32,43);
  c.textAlign='right';c.fillStyle='#e68ac7';c.fillText('SISTEMA 03',734,43);c.textAlign='left';
  c.fillStyle='#3d7180';c.fillRect(30,58,708,2);
  c.save();c.translate(160,198);
  for(let i=0;i<3;i++){c.strokeStyle=i===1?'#e26bb8':'#6bd0e4';c.globalAlpha=.7-i*.15;c.lineWidth=i===1?6:2;c.beginPath();c.arc(0,0,64+i*23,-Math.PI*.8,Math.PI*.78);c.stroke();}
  c.globalAlpha=1;c.strokeStyle='#8debf1';c.lineWidth=2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*36,Math.sin(a)*36);c.lineTo(Math.cos(a)*52,Math.sin(a)*52);c.stroke();}
  c.fillStyle='#16485a';c.beginPath();c.arc(0,0,33,0,Math.PI*2);c.fill();
  c.strokeStyle='#9af4f3';c.lineWidth=3;c.beginPath();c.arc(0,0,33,0,Math.PI*2);c.stroke();
  c.fillStyle='#dffeff';c.font='800 20px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('03',0,1);c.restore();
  c.fillStyle='#edf9f9';c.font='800 42px Arial';c.fillText('EL ARCHIVISTA',290,122,430);
  c.fillStyle='#9bced3';c.font='600 19px monospace';c.fillText('REGISTRO DIMENSIONAL',294,156);
  c.strokeStyle='#5697a3';c.lineWidth=2;c.beginPath();c.moveTo(293,177);c.lineTo(721,177);c.stroke();
  for(let row=0;row<4;row++){
   const y=197+row*32;c.fillStyle=row===1?'#e17dbf':'#6dbcc7';c.fillRect(295,y,7,12);
   c.fillStyle='#b5dce1';c.font='16px monospace';c.fillText(['MEMORIA / 09','SECUENCIA / 03','ORIGEN / NEX','ENLACE / ACTIVO'][row],316,y+12);
   c.fillStyle='#2f6573';c.fillRect(563,y+2,142,7);c.fillStyle=row===1?'#d778b4':'#6eb6c3';c.fillRect(563,y+2,45+row*21,7);
  }
  c.fillStyle='#173744';c.fillRect(28,326,712,35);
  c.fillStyle='#97e8ec';c.font='700 17px monospace';c.fillText('ACCESO / CONSULTAR REGISTRO',43,349);
  c.textAlign='right';c.fillStyle='#d787bb';c.fillText('E / INTERACTUAR',725,349);
  c.fillStyle='rgba(3,12,22,.16)';for(let y=0;y<384;y+=5)c.fillRect(0,y,768,1);
 });
}
export function buildMatrixGraphics(root,mat,props,glow){
 const {bridgeDeck,bridgeNodes,blocks,plates,container,containerPlate,coolants,dataFragment,module,evidence,energy,auth,archive,bossNodes,returnPortal,exitPortal,floorTiles,obstacles,colliders}=props;
 const detail=new THREE.Group();detail.name='Puerta 03 / architecture and atmosphere';root.add(detail);
 const trim=new THREE.MeshStandardMaterial({color:0x66818b,metalness:.75,roughness:.36});
 const metal=new THREE.MeshStandardMaterial({color:0x283e4c,metalness:.65,roughness:.46});
 const recess=new THREE.MeshStandardMaterial({color:0x07131e,metalness:.35,roughness:.7});
 const brass=new THREE.MeshStandardMaterial({color:0x9b8867,metalness:.65,roughness:.42});
 const dimCyan=new THREE.MeshBasicMaterial({color:0x265b70,toneMapped:false});
 const dimPink=new THREE.MeshBasicMaterial({color:0x6e345c,toneMapped:false});
 const batch=boxBatch(detail),rand=randomSource(309);
 const initial=root.children.filter(o=>o.isMesh);
 // Cladding follows the existing solid meshes, so visual detail and collision never drift apart.
 for(const object of initial){
  const name=object.name,{width:w,height:h,depth:d}=object.geometry.parameters||{};
  if(!w||!h||!d)continue;
  if(name==='sector bulkhead'||name==='bridge void guard'){
   const b=boxBatch(object);
   for(const side of [-1,1]){
    for(let x=-w/2+.8;x<w/2;x+=1.8){b(metal,x,0,side*(d/2+.04),1.65,h-.18,.08);b(trim,x-.76,0,side*(d/2+.1),.055,h-.25,.08);
     for(let k=0;k<5;k++)b(recess,x-.45+k*.2,-h*.22,side*(d/2+.09),.07,h*.3,.04);
     b(dimCyan,x,h*.28,side*(d/2+.09),.75,.045,.03);
    }
    b(trim,0,h/2-.06,side*(d/2+.08),w,.11,.14);
   }
   b(metal,0,h/2+.04,0,w+.05,.08,d+.06);b.flush();
  }
 }
 // Deep skyline: suspended city fragments outside the playable collision perimeter.
 for(let i=0;i<58;i++){
  const side=i%2?-1:1,x=side*(21+rand()*26),z=27-rand()*145,h=6+rand()*26,w=2.6+rand()*5,d=3+rand()*5,y=h/2-4;
  batch(metal,x,y,z,w,h,d);batch(recess,x+w*.22,y,z+d/2+.02,w*.36,h*.85,.05);
  for(let f=0;f<Math.min(24,h);f++){
   const yy=-3+f*1.15;
   for(let c=0;c<3;c++)if(rand()>.32)batch(i%7===0?dimPink:dimCyan,x-w*.3+c*w*.3,yy,z+d/2+.04,w*.14,.13,.035);
  }
  batch(dimCyan,x-w/2,y,z+d/2,.025,h,.025);
  if(i%4===0){batch(metal,x,y+h/2+1.5,z,w*.75,1.6,d*.75,.12);batch(dimPink,x,y+h/2+.45,z,w*.7,.04,d*.7);}
 }
 // Walkway rails, drainage channels and embedded light strips establish human scale.
 for(let z=22;z>-104;z-=2){
  for(const x of [-14.8,14.8]){
   batch(metal,x,.04,z,.55,.08,1.9);for(let k=0;k<5;k++)batch(recess,x,.086,z-.7+k*.34,.42,.012,.11);
   batch(trim,x,.75,z,.07,1.5,.08);batch(dimCyan,x,1.12,z,.06,.035,1.95);
  }
  if(!(z<7&&z>-2))for(const x of [-3.15,3.15])batch(z<-77?dimPink:dimCyan,x,.006,z,.035,.014,1.5);
 }
 for(const sector of MATRIX_SECTORS){
  const warm=sector.id==='workshop'||sector.id==='mirror',accent=warm?mat.pink:mat.cyan;
  for(const side of [-1,1]){
   // Suspended service gantries stay above the movement corridor.
   batch(metal,side*12,6.4,sector.z-4,5.8,.3,1.5);batch(trim,side*13.8,3.4,sector.z-4,.15,6,.17);
   batch(accent,side*12,6.22,sector.z-3.5,4.5,.035,.11);
   const lamp=createOrbHalo(glow,warm?0xd364bb:0x84dbf4,2.4,.22);lamp.position.set(side*12,6.15,sector.z-3.5);detail.add(lamp);
   for(let k=0;k<3;k++)batch(metal,side*(13.7-k*.2),.19,sector.z+2,.11,.12,10);
  }
  batch(metal,0,6.55,sector.z-7,25,.22,.5);
  for(let x=-11;x<=11;x+=1.2){batch(trim,x,6.75,sector.z-7,.07,.35,.12,0,.45);}
  for(const x of [-3.8,3.8])batch(trim,x,5.85,sector.z-8,.026,1.3,.026);
  // Inlaid sector number and route markings, drawn flush to the floor.
  const routeMap=canvasTexture(1024,256,c=>{
   c.fillStyle=warm?'#b78da7':'#94b1b5';c.globalAlpha=.62;c.font='700 94px Arial';c.fillText('0'+(MATRIX_SECTORS.indexOf(sector)+1),38,151);
   c.font='700 28px monospace';c.fillText(sector.label,200,104,780);c.font='18px monospace';c.fillText('RUTA DE ENLACE / FREQUENCY 09',200,143);
   c.fillRect(200,174,600,3);c.beginPath();c.moveTo(920,188);c.lineTo(958,155);c.lineTo(996,188);c.lineWidth=7;c.strokeStyle=c.fillStyle;c.stroke();
  });
  const floorSign=addMesh(detail,new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:routeMap,transparent:true,depthWrite:false,toneMapped:false,opacity:.6}),0,.009,sector.z+7);floorSign.rotation.x=-Math.PI/2;
 }
 // Node pedestals retain their solid collision footprint as edited positions change.
 const baseObstacles=[];
 function solidNodeBase(holder){
  const base=addMesh(holder,new THREE.BoxGeometry(1.05,.12,.8),trim,0,-1.35,0);
  const obstacle={id:'matrix node pedestal '+baseObstacles.length,x:holder.position.x,z:holder.position.z,radius:.46};
  obstacles.push(obstacle);colliders.push(base);baseObstacles.push({holder,base,obstacle,position:new THREE.Vector3()});
 }

 const bridge=boxBatch(bridgeDeck);
 for(const x of [-2.8,2.8]){bridge(trim,x,.18,0,.14,.1,8.8);bridge(mat.cyan,x,.24,0,.045,.02,8.7);}
 for(let z=-4;z<4.3;z+=.7){bridge(metal,0,.185,z,5.5,.03,.12);bridge(dimCyan,0,.205,z,1.2,.01,.04);}bridge.flush();
 function nodeHousing(holder,r=.53){
  const b=boxBatch(holder);
  solidNodeBase(holder);b(metal,0,-.77,0,.32,1.12,.34);b(recess,0,-1.23,0,.72,.18,.6);
  b(dimCyan,0,-.85,.18,.07,.62,.035);b.flush();
  addMesh(holder,new THREE.TorusGeometry(r+.1,.055,8,64),trim,0,0,-.025);
  addMesh(holder,new THREE.TorusGeometry(r+.18,.014,6,64),dimCyan);
  for(let i=0;i<8;i++){const a=i*TAU/8;addMesh(holder,new THREE.BoxGeometry(.09,.13,.12),metal,Math.cos(a)*(r+.11),Math.sin(a)*(r+.11),0).rotation.z=a;}
 }
 bridgeNodes.forEach(n=>nodeHousing(n.holder));bossNodes.forEach(n=>nodeHousing(n.holder,.47));
 // Memory displays become physical archival workstations with illustrated recordings.
 const scanScreens=[];
 const screens=root.children.filter(o=>o.name==='memory display'||o.name==='memory echo');
 screens.forEach((object,index)=>{
  const {width:w,height:h}=object.geometry.parameters,b=boxBatch(object);
  for(const side of [-1,1])b(trim,side*(w/2-.025),0,.1,.1,h+.1,.12);
  for(const y of [-h/2,h/2])b(metal,0,y,.1,w,.14,.2);
  b(metal,0,-h*.7,0,.28,h*.55,.16);b(recess,0,-object.position.y+.09,0,w*.65,.18,.18);
  b(mat.cyan,-w*.39,h*.4,.2,.22,.04,.02);b.flush();
  const kind=['concert','store','ship','echo','echo'][index];
  const display=addMesh(object,new THREE.PlaneGeometry(w-.3,h-.3),new THREE.MeshBasicMaterial({map:screenMap(kind,index),toneMapped:false}),0,0,.16);
  const scan=addMesh(object,new THREE.PlaneGeometry(w-.3,.014),new THREE.MeshBasicMaterial({color:0x87e8e5,transparent:true,opacity:.14,depthWrite:false,toneMapped:false}),0,0,.17);scanScreens.push({scan,h:h-.3,phase:index});
 });
 function terminal(object,kind){
  const {width:w,height:h,depth:d}=object.geometry.parameters,b=boxBatch(object);
  for(const face of [-1,1]){b(trim,face*(w/2-.035),0,d/2+.04,.07,h,.11);}
  b(trim,0,h/2,0,w+.08,.08,d+.06);b(recess,0,-h*.36,d/2+.03,w*.8,h*.2,.04);
  for(let x=-w*.36;x<w*.4;x+=w/12)b(metal,x,-h*.36,d/2+.06,w*.025,h*.17,.04);
  b(metal,0,-h*.02,d/2+.06,w*.86,.12,.06);
  for(let i=0;i<8;i++)b(i%3?trim:brass,-w*.32+i*w*.09,-h*.035,d/2+.12,w*.055,.04,.04);
  b(mat.cyan,-w*.32,h*.43,d/2+.07,w*.15,.025,.025);b.flush();
  addMesh(object,new THREE.PlaneGeometry(w*.82,h*.42),new THREE.MeshBasicMaterial({map:screenMap(kind),toneMapped:false}),0,h*.23,d/2+.075);
 }
 terminal(energy,'energy');terminal(auth,'auth');
 // Compact archive console: the title sits above the cabinet, leaving the display unobstructed.
 {
  const {width:w,height:h,depth:d}=archive.geometry.parameters,front=d/2,b=boxBatch(archive);
  archive.material=new THREE.MeshStandardMaterial({color:0x182d3b,metalness:.68,roughness:.39});
  b(metal,0,-h/2+.1,0,w,.2,d);
  b(trim,0,h/2-.08,0,w,.14,d);
  for(const side of [-1,1]){
   b(metal,side*(w/2-.09),0,front+.026,.16,h-.2,.045);
   b(mat.cyan,side*(w/2-.2),.18,front+.059,.018,.98,.015);
   b(brass,side*(w/2-.1),-h/2+.19,front+.06,.13,.055,.045);
  }
  b(recess,0,.24,front+.032,w-.37,1.03,.055);
  b(trim,0,.77,front+.06,w-.28,.045,.055);
  b(trim,0,-.29,front+.06,w-.28,.045,.055);
  b(mat.pink,0,.805,front+.08,w-.34,.016,.019);
  b(recess,0,-.57,front+.04,w-.4,.35,.045);
  for(let i=0;i<8;i++){
   const x=-.92+i*.26;
   b(i===6?mat.pink:i===7?mat.cyan:trim,x,-.56,front+.076,.17,.065,.025);
  }
  for(let i=0;i<6;i++)b(metal,-.72+i*.29,-.88,front+.043,.065,.15,.026);
  b(mat.cyan,0,-.86,front+.064,.3,.025,.02);
  b.flush();
  const screen=addMesh(archive,new THREE.PlaneGeometry(w-.43,.95),new THREE.MeshBasicMaterial({map:archiveScreenMap(),toneMapped:false}),0,.24,front+.065);
  screen.name='Archivo Central / interactive display';
  const lens=addMesh(archive,new THREE.TorusGeometry(.105,.018,8,32),mat.cyan,-1.08,-.56,front+.087);
  lens.name='Archivo Central / access reader';
  addMesh(archive,new THREE.CircleGeometry(.055,24),mat.pink,-1.08,-.56,front+.088);
  const mounts=boxBatch(detail);
  for(const x of [-1.02,1.02])mounts(metal,x,2.32,-101.8,.07,.36,.09);
  mounts.flush();
 }
 // Mechanical puzzle objects retain their original dimensions and transforms.
 for(const [index,object] of [...blocks.map(b=>b.mesh),container].entries()){
  const {width:w,height:h,depth:d}=object.geometry.parameters,b=boxBatch(object),accent=[mat.cyan,mat.pink,brass,mat.cyan][index];
  for(const x of [-1,1])for(const z of [-1,1])b(trim,x*(w/2-.07),0,z*(d/2-.03),.13,h,.09);
  for(const y of [-h/2+.08,h/2-.08]){b(metal,0,y,0,w+.035,.14,d+.035);}
  for(const z of [-1,1]){b(recess,0,0,z*(d/2+.025),w*.7,h*.6,.05);b(accent,0,0,z*(d/2+.055),w*.52,.035,.025);
   for(let j=0;j<4;j++)b(trim,-w*.22+j*w*.15,-h*.18,z*(d/2+.055),w*.07,.05,.025);
  }b.flush();
 }
 for(const plate of [...plates,containerPlate]){const w=plate.geometry.parameters.width,b=boxBatch(plate);for(const x of [-1,1])for(const z of [-1,1]){b(trim,x*w*.4,.045,z*w*.4,w*.22,.04,.06);b(trim,x*w*.4,.045,z*w*.4,.06,.04,w*.22);}b.flush();}
 coolants.forEach(({holder})=>{
  solidNodeBase(holder);const b=boxBatch(holder);b(metal,0,-.7,-.15,.44,1.35,.36);b.flush();
  addMesh(holder,new THREE.TorusGeometry(.49,.09,8,48),trim,0,0,-.06);
  for(let i=0;i<6;i++){const a=i*TAU/6;addMesh(holder,new THREE.BoxGeometry(.1,.18,.15),brass,Math.cos(a)*.45,Math.sin(a)*.45,.07).rotation.z=a;}
 });
 // Small readable collectible cores instead of featureless luminous solids.
 for(const [index,object] of [dataFragment,module,evidence].entries()){
  object.material=new THREE.MeshStandardMaterial({color:0x67b5bf,emissive:0x1d7d9e,emissiveIntensity:.6,metalness:.8,roughness:.23});
  const ring=addMesh(object,new THREE.TorusGeometry(index===2?.33:.49,.018,6,48),mat.cyan);ring.rotation.x=Math.PI/2;
  object.add(createOrbHalo(glow,0x68e9ed,1.8,.27));
  const wire=new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry),new THREE.LineBasicMaterial({color:0xbaf9f2}));object.add(wire);
 }
 // Portal membranes use flowing, layered rings; no full-screen postprocessing required.
 const portalUniforms=[];
 for(const portal of [returnPortal,exitPortal]){
  // Replace the old flat disk while preserving the interaction group.
  const disk=portal.children.find(o=>o.geometry?.type==='CircleGeometry');if(disk)disk.visible=false;
  const uniforms={time:{value:0}};portalUniforms.push(uniforms);
  const membrane=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
   vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec2 vUv; uniform float time; void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float swirl=sin(a*6.-r*19.+time*.65);float ring=pow(.5+.5*sin(r*35.-time*1.4+swirl*.5),9.);float edge=smoothstep(.72,1.,r);float fade=1.-smoothstep(.92,1.,r);vec3 col=mix(vec3(.015,.055,.1),vec3(.18,.7,.8),ring*.35+edge*.7);col+=vec3(.25,.08,.3)*(.5+.5*swirl)*r*.35;gl_FragColor=vec4(col,(.8+edge*.2)*fade);#include <colorspace_fragment>}`.replace(';#include',';\n#include').replace('<colorspace_fragment>}', '<colorspace_fragment>\n}')});
  const field=addMesh(portal,new THREE.CircleGeometry(1.16,64),membrane,0,0,.02);field.scale.y=1.3;
  for(const r of [1.33,1.39])addMesh(portal,new THREE.TorusGeometry(r,.045,8,80),trim).scale.y=1.3;
  const b=boxBatch(portal);
  for(let i=0;i<16;i++){const a=i*TAU/16;b(i%4?metal:mat.white,Math.cos(a)*1.35,Math.sin(a)*1.35*1.3,.04,.12,.08,.12,0,a);}
  b(metal,0,-1.68,0,2.6,.15,.55);b.flush();portal.add(createOrbHalo(glow,0x3597d5,4.5,.12));
 }
 // Overhead rings and suspended machinery give the final arena its own silhouette.
 for(const [i,r] of [5.6,6.1,6.4].entries()){
  const ring=addMesh(detail,new THREE.TorusGeometry(r,i===1?.12:.035,8,96),i===1?metal:dimPink,0,6.7,-91);ring.rotation.x=Math.PI/2;
 }
 for(let i=0;i<8;i++){const a=i*TAU/8;batch(metal,Math.cos(a)*6.2,7,-91+Math.sin(a)*6.2,.18,1.2,.18);}
 for(const t of floorTiles){const b=boxBatch(t.mesh);for(const x of [-2.7,2.7])b(metal,x,.034,0,.065,.025,6.1);for(const z of [-3,3])b(metal,0,.034,z,5.5,.025,.065);b.flush();}

 // The workshop has powered ventilation and overhead coolant manifolds.
 const turbines=[];
 for(const object of initial.filter(o=>o.name==='fragmented data column'&&o.position.z<-26&&o.position.z>-51)){
  const assembly=new THREE.Group();assembly.position.set(0,1,1.18);object.add(assembly);
  addMesh(assembly,new THREE.CylinderGeometry(.71,.71,.14,48),metal).rotation.x=Math.PI/2;
  addMesh(assembly,new THREE.TorusGeometry(.69,.045,8,48),trim,0,0,.1);
  const rotor=new THREE.Group();rotor.position.z=.12;assembly.add(rotor);turbines.push(rotor);
  const fan=boxBatch(rotor);for(let i=0;i<8;i++){const a=i*TAU/8;fan(trim,Math.cos(a)*.37,Math.sin(a)*.37,0,.38,.12,.035,0,a+.65);}fan.flush();
  addMesh(assembly,new THREE.CylinderGeometry(.16,.16,.13,24),brass,0,0,.16).rotation.x=Math.PI/2;
  const cage=boxBatch(assembly);for(const x of [-.45,-.15,.15,.45])cage(recess,x,0,.24,.022,1.1,.03);cage.flush();
 }
 for(const side of [-1,1]){
  for(let k=0;k<3;k++){
   const pipe=addMesh(detail,new THREE.CylinderGeometry(.08,.08,13,12),metal,side*(9+k*.3),5.1,-39);pipe.rotation.x=Math.PI/2;
   for(const z of [-33,-39,-45])addMesh(detail,new THREE.TorusGeometry(.1,.028,6,16),brass,side*(9+k*.3),5.1,z);
  }
  for(const z of [-33,-39,-45])batch(metal,side*9.3,5.4,z,1.1,.08,.13);
 }
 // Security cameras sit above the walkable area and turn gently toward the player.
 const securityCameras=[];
 for(const side of [-1,1]){
  const mount=new THREE.Group();mount.position.set(side*12.5,4.5,-60);detail.add(mount);
  const arm=boxBatch(mount);arm(trim,side*.6,.25,0,1.4,.12,.18);arm(metal,side*1.3,.5,0,.16,.65,.4);arm.flush();
  const cameraHead=new THREE.Group();mount.add(cameraHead);cameraHead.rotation.x=.28;
  const body=boxBatch(cameraHead);body(metal,0,0,0,.55,.4,.95);body(trim,0,.22,0,.64,.06,1.04);body(recess,0,0,.5,.43,.3,.025);body.flush();
  addMesh(cameraHead,new THREE.CylinderGeometry(.09,.09,.08,24),mat.red,0,0,.55).rotation.x=Math.PI/2;
  cameraHead.add(createOrbHalo(glow,0xf275a9,.6,.2));securityCameras.push(cameraHead);
 }
 for(const z of [-60,-66]){
  batch(metal,0,5.8,z,27,.25,.45);batch(trim,0,5.98,z,27.3,.055,.5);
  batch(mat.cyan,0,5.65,z,5,.035,.13);
 }
 const visionStreams=[];
 // Tall memory streams dissolve into the background beyond the collision railing.
 const codeMap=canvasTexture(512,1024,c=>{
  const r=randomSource(911),glyphs='01<>/:{}09';c.font='14px monospace';
  for(let x=12;x<510;x+=23)for(let y=18;y<1024;y+=22){c.fillStyle=`rgba(174,235,232,${r()>.84?.65:.08+r()*.25})`;c.fillText(glyphs[Math.floor(r()*glyphs.length)],x,y);}
 });codeMap.wrapT=THREE.RepeatWrapping;
 for(const sector of MATRIX_SECTORS)for(const side of [-1,1]){
  const codes=addMesh(detail,new THREE.PlaneGeometry(9,15),new THREE.MeshBasicMaterial({map:codeMap,color:sector.id==='mirror'||sector.id==='workshop'?0xb881ac:0x6fbac9,transparent:true,opacity:.23,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}),side*17.5,6,sector.z);
  codes.rotation.y=side*Math.PI/2;visionStreams.push(codes.material);
 }
 // An immense broken mirror closes the final arena. It is entirely outside the walkable bounds.
 const mirrorBackdrop=new THREE.Group();mirrorBackdrop.position.set(0,5.4,-107.2);detail.add(mirrorBackdrop);
 const back=boxBatch(mirrorBackdrop);
 back(recess,0,0,-.8,25,11,1.3);
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const x=side*(5.4+i*2.1),h=8-i*.7;
  back(metal,x,.2,-.1,1.8,h,.38,side*.08);back(trim,x-side*.85,.2,.13,.045,h,.06);back(i%2?dimPink:dimCyan,x+side*.65,.2,.13,.06,h*.84,.03);
  for(let y=-3;y<3;y+=.4)back(recess,x,y,.13,1.4,.08,.03);
 }
 back(metal,0,5.5,0,26,.4,1);back(dimPink,0,5.25,.5,24,.055,.05);back.flush();
 const mirrorTime={value:0};
 const mirrorMaterial=new THREE.ShaderMaterial({uniforms:{time:mirrorTime},toneMapped:false,side:THREE.FrontSide,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`
   varying vec2 vUv;uniform float time;
   void main(){
    vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);
    float segment=floor((a+3.14159)*7.);float split=abs(sin(a*7.));
    float wave=pow(.5+.5*sin(r*26.-time*.6+segment*.9),16.);
    float rays=pow(1.-split,36.)*smoothstep(.25,.9,r);
    vec3 base=mix(vec3(.018,.035,.065),vec3(.08,.026,.09),smoothstep(-1.,1.,p.x));
    vec3 c=base+vec3(.1,.44,.53)*wave*.4+vec3(.55,.1,.39)*rays*.6;
    float grid=step(.95,fract(p.x*18.))*step(.95,fract(p.y*18.));c+=vec3(.2,.45,.5)*grid*.3;
    gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
   }`});
 addMesh(mirrorBackdrop,new THREE.CircleGeometry(4.6,96),mirrorMaterial,0,0,.08);
 for(const [r,m] of [[4.7,metal],[4.61,dimPink],[4.95,trim],[5.06,dimCyan]])addMesh(mirrorBackdrop,new THREE.TorusGeometry(r,r===4.7?.16:.035,8,128),m,0,0,.15);
 const iris=new THREE.Group();mirrorBackdrop.add(iris);
 for(let i=0;i<12;i++){const a=i*TAU/12;const plate=addMesh(iris,new THREE.BoxGeometry(.18,.55,.08),i%3===0?mat.pink:metal,Math.cos(a)*4.75,Math.sin(a)*4.75,.3);plate.rotation.z=a-Math.PI/2;}
 const pupil=addMesh(mirrorBackdrop,new THREE.IcosahedronGeometry(.68,1),new THREE.MeshStandardMaterial({color:0x81546f,emissive:0x611646,emissiveIntensity:.5,metalness:.8,roughness:.2}),0,0,.2);
 pupil.add(new THREE.LineSegments(new THREE.EdgesGeometry(pupil.geometry),new THREE.LineBasicMaterial({color:0xd58bb7})));
 mirrorBackdrop.add(createOrbHalo(glow,0x88459d,8,.16));
 // Broken fragments float beyond the railing; they never obstruct combat or puzzle routes.
 const fragments=[];for(let i=0;i<25;i++){
  const fragment=addMesh(detail,new THREE.BoxGeometry(.35+rand(),.25+rand()*.5,.4+rand()),metal,(i%2?1:-1)*(16.9+rand()*2.6),.2+rand()*4,20-rand()*122);
  fragment.rotation.set(rand(),rand(),rand());fragments.push({mesh:fragment,y:fragment.position.y,phase:rand()*TAU});
 }
 batch.flush();
 const banks=MATRIX_SECTORS.flatMap((s,i)=>[-1,1].map((side,j)=>({x:side*6,z:s.z+(j?3:-3),y:.48,width:15,height:1.55,color:i===2||i===4?0x967795:0x769eaf,opacity:.43,phase:i*2+j,driftX:.8,driftZ:.6})));
 const fog=createLowDriftingFog(detail,banks,{name:'Puerta 03 / low data mist'});
 const shaftMap=canvasTexture(128,512,c=>{
  const image=c.createImageData(128,512);
  for(let y=0;y<512;y++)for(let x=0;x<128;x++){
   const t=y/511,width=.05+t*.45,r=Math.abs(x/127-.5)/width;
   const alpha=Math.pow(Math.max(0,1-r),2)*(1-t)*Math.min(1,t*15)*.15;
   image.data.set([190,231,255,Math.round(alpha*255)],(y*128+x)*4);
  }c.putImageData(image,0,0);
 });
 for(const sector of MATRIX_SECTORS)for(const side of [-1,1]){
  const beam=new THREE.Sprite(new THREE.SpriteMaterial({map:shaftMap,color:sector.id==='mirror'?0xc78dc4:0x83bcdb,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  beam.position.set(side*12,3.5,sector.z-3.5);beam.scale.set(4.8,6,1);beam.raycast=()=>{};detail.add(beam);
 }
 const count=430,coords=new Float32Array(count*3),seeds=[];
 for(let i=0;i<count;i++){const x=(rand()-.5)*32,y=rand()*8,z=24-rand()*130;coords.set([x,y,z],i*3);seeds.push([x,y,z,rand()*TAU]);}
 const particlesGeometry=new THREE.BufferGeometry();particlesGeometry.setAttribute('position',new THREE.BufferAttribute(coords,3));
 const particles=new THREE.Points(particlesGeometry,new THREE.PointsMaterial({map:glow,color:0x87c9de,size:.075,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));particles.name='Suspended memory particles';detail.add(particles);
 const fill=new THREE.HemisphereLight(0x88bad6,0x2c1836,.48);detail.add(fill);
 // Only two nearby area accents are active lights. Distant fixtures are emissive geometry.
 const accents=[new THREE.PointLight(0x68cced,32,21,2),new THREE.PointLight(0xd46cb5,26,20,2)];detail.add(...accents);
 const key=new THREE.DirectionalLight(0xd7e4ec,1.7);key.position.set(-8,13,10);key.castShadow=true;
 key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-16;key.shadow.camera.right=16;key.shadow.camera.top=16;key.shadow.camera.bottom=-16;key.shadow.camera.near=.5;key.shadow.camera.far=50;key.shadow.bias=-.0005;key.shadow.normalBias=.035;detail.add(key,key.target);
 const frequencyVision=createMatrixFrequencyVision(root,{key,fill,accents,streams:visionStreams,particles});
 let previousSector=-1;
 function update(dt,time,p,player,camera,reducedMotion){
  fog.update(dt,reducedMotion,dt===0,camera);
  frequencyVision.update(dt,p,player,reducedMotion);
  for(const {holder,base,obstacle,position} of baseObstacles){
   holder.getWorldPosition(position);base.visible=holder.visible;
   obstacle.x=holder.visible?position.x:999;obstacle.z=position.z;obstacle.radius=.46*Math.max(holder.scale.x,holder.scale.z);
  }
  const current=MATRIX_SECTORS.findIndex(s=>player.z<=s.from&&player.z>=s.to),index=Math.max(0,current);
  if(index!==previousSector){previousSector=index;const z=MATRIX_SECTORS[index].z;accents[0].position.set(-7,4,z+3);accents[1].position.set(7,4,z-4);}
  key.position.set(player.x-8,13,player.z+10);key.target.position.set(player.x,0,player.z);
  portalUniforms.forEach(u=>u.time.value=time);
  mirrorTime.value=time;iris.rotation.z=time*.015;pupil.rotation.y=time*.16;codeMap.offset.y=-time*.025;
  turbines.forEach((fan,i)=>fan.rotation.z=time*(i?-.7:.7));
  securityCameras.forEach((head,i)=>{const dx=player.x-(i?12.5:-12.5),dz=player.z+60;head.rotation.y=Math.atan2(dx,dz);});
  scanScreens.forEach(({scan,h,phase})=>scan.position.y=Math.sin(time*.4+phase)*h*.46);
  fragments.forEach(f=>{f.mesh.position.y=f.y+Math.sin(time*.35+f.phase)*.16;});
  if(dt&&!reducedMotion){for(let i=0;i<count;i++){const [x,y,z,phase]=seeds[i];coords[i*3]=x+Math.sin(time*.12+phase)*.2;coords[i*3+1]=(y+time*.08)%8;coords[i*3+2]=z;}particlesGeometry.attributes.position.needsUpdate=true;}
 }
 return {update,dispose:()=>{frequencyVision.dispose();key.shadow.dispose();}};
}
