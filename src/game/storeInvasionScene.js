import * as THREE from 'three';
import {loadRecordStoreGhost} from './recordStoreGhost.js';
import {createEnemyOrbVisual} from './enemyOrbVisuals.js';
import {createOrbGlowTexture} from './neonOrbVisuals.js';
import { invadedStoreObstacles, INVASION_STATIC_COUNT } from './recordStoreInvadedLayout.js';
import { createInvadedStoreDamage } from './recordStoreInvadedDamage.js';

const DEMON_URL=new URL('../assets/neonboy-animaciones/demonio-alado-2.glb',import.meta.url).href;
const CLUES=[[-8.72,5.2,'I / ONDA'],[-8.72,2.4,'II / SURCO'],[-8.72,-.4,'III / SILENCIO']];
const EMITTERS=[[-7.25,.82,-12.1],[0,1.55,-12.4],[7.25,2.23,-12.1]];
const tmp=new THREE.Vector3();
function box(parent,w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
function glyphSign(parent,text,w,h,x,y,z,accent='#e88abb'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
 const c=canvas.getContext('2d');c.fillStyle='#0a101b';c.fillRect(0,0,512,160);
 c.strokeStyle=accent;c.lineWidth=5;c.strokeRect(7,7,498,146);
 c.fillStyle=accent;c.fillRect(20,18,7,122);
 c.fillStyle='#f4e9e7';c.textAlign='center';c.textBaseline='middle';c.font='800 43px Arial';c.fillText(text,260,80,455);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,toneMapped:false}));
 mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function ring(parent,r,color,x,y,z){const m=new THREE.Mesh(new THREE.TorusGeometry(r,.035,8,48),new THREE.MeshBasicMaterial({color,toneMapped:false}));m.position.set(x,y,z);parent.add(m);return m;}
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
 const artifact=new THREE.Group();artifact.position.set(0,1.8,-10.9);root.add(artifact);
 const artifactBase=box(artifact,1.5,.12,.9,0,-1.34,0,metal);
 const artifactOrb=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),new THREE.MeshStandardMaterial({color:0xb857a7,emissive:0xa22c77,emissiveIntensity:.65,metalness:.42,roughness:.25}));artifact.add(artifactOrb);
 const artifactWire=new THREE.LineSegments(new THREE.EdgesGeometry(artifactOrb.geometry),new THREE.LineBasicMaterial({color:0xf8abd9}));artifactOrb.add(artifactWire);
 for(const y of [-.24,.24])ring(artifact,.58,0xee7bc9,0,y,0);
 artifact.visible=false;
 const archiveLine=new THREE.Group();archiveLine.position.set(10.6,0,-7.4);root.add(archiveLine);
 const panel=box(archiveLine,.16,2.2,3.8,-.03,1.7,0,metal);
 panel.name='Invasion / panel de conductores';
 const conductors=[-1.05,0,1.05].map((z,i)=>{
  const holder=new THREE.Group();holder.position.set(-.18,1.72,z);archiveLine.add(holder);
  const halo=ring(holder,.27,0xe85ab5,0,0,0);halo.rotation.y=Math.PI/2;
  const core=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),pink);core.scale.x=.45;holder.add(core);
  const tag=glyphSign(holder,String(i+1),.3,.18,-.03,-.42,0,'#a6dce4');tag.rotation.y=Math.PI/2;
  return {holder,halo,core};
 });
 const archiveArrow=box(archiveLine,.025,.028,3.4,-.19,2.32,0,cyan);archiveArrow.visible=false;
 const crate=new THREE.Group();crate.position.set(8.35,0,-7.2);root.add(crate);
 box(crate,1.05,.9,.95,0,.45,0,wood);
 for(const side of [-1,1]){box(crate,.08,.94,1.01,side*.46,.45,0,metal);box(crate,1.1,.07,1.02,0,side===1?.84:.08,0,metal);}
 glyphSign(crate,'F09 / ARCHIVO',.91,.25,0,.48,.486);
 const clueSigns=CLUES.map(([x,z,text],i)=>{
  const g=new THREE.Group();g.position.set(x,1.75,z);g.rotation.y=Math.PI/2;root.add(g);
  box(g,1.24,.74,.08,0,0,0,metal);
  const sign=glyphSign(g,'PULSO '+String(i+1),1.15,.58,0,0,.052);
  const hidden=glyphSign(g,text,1.15,.58,0,0,.055);
  return {g,hidden,sign};
 });
 const jukeCore=new THREE.Group();jukeCore.position.set(0,2.5,.82);shop.jukebox.add(jukeCore);
 const jukeRing=ring(jukeCore,.3,0xe85ab5,0,0,0);
 const jukeBall=new THREE.Mesh(new THREE.IcosahedronGeometry(.16,1),pink);jukeCore.add(jukeBall);
 for(const [i,symbol] of ['ONDA','SURCO','SILENCIO'].entries())glyphSign(jukeCore,String(i+1)+' / '+symbol,.52,.17,(i-1)*.54,-.54,.04,'#e88abb');
 const emitters=EMITTERS.map(([x,y,z],i)=>{
  const holder=new THREE.Group();holder.position.set(x,y,z);root.add(holder);
  box(holder,.72,.72,.13,0,0,-.08,metal);
  const halo=ring(holder,.31,0xe85ab5,0,0,0);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),pink);holder.add(core);
  glyphSign(holder,['01 / SUELO','02 / VIDRIO','03 / CIELO'][i],1.12,.22,0,-.53,.03,'#e18fc6');
  return {holder,halo,core};
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
 const generators=[-1.8,1.8].map((x,i)=>{
  const group=new THREE.Group();group.position.set(x,1.15,-10.35);root.add(group);
  box(group,.6,.78,.55,0,0,0,metal);
  const halo=ring(group,.35,0xea395a,0,.13,.32);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.18,16,12),red);core.position.set(0,.13,.33);group.add(core);
  glyphSign(group,'ESCUDO '+String(i+1),.82,.2,0,-.44,.33,'#e782a4');
  return {group,halo,core};
 });
 const warning=ring(root,.62,0xea395a,0,.045,0);warning.rotation.x=Math.PI/2;warning.visible=false;
 const shot=createEnemyOrbVisual(createOrbGlowTexture(),.3);root.add(shot.root);
 let ghost=null,demon=null,modelStatus={ghost:false,demon:false},time=0,ghostMaterialized=false,bossVulnerable=false,ghostCooldown=1.6,bossCooldown=2.1,ghostWindup=0,bossWindup=0,shotVelocity=new THREE.Vector3(),shotLife=0,damageCooldown=0,pathTimer=0,pathPoint=null;
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
   loader.loadAsync(DEMON_URL).then(gltf=>{
    if(!isAlive())return;
    const model=gltf.scene,bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
    const group=new THREE.Group();group.scale.setScalar(2.6/Math.max(.01,size.y));
    model.position.set(-bounds.getCenter(tmp).x,-bounds.min.y,-bounds.getCenter(tmp).z);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    group.add(model);bossAnchor.add(group);demon=group;bossFallback.visible=false;modelStatus.demon=true;
   })]);
  return modelStatus;
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
   generators.forEach(({group},index)=>{if(!p.generators[index])targets.push({kind:'invasion-generator',index,position:group.position.clone().add(new THREE.Vector3(0,.13,.3)),radius:.35});});
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
  else if(target.kind==='invasion-generator')onEvent?.('generator-hit',target.index);
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

  clueSigns.forEach(({hidden},i)=>hidden.visible=vision&&!completed);
  jukeCore.visible=vision&&!p.jukeboxOff; jukeRing.material=p.jukeboxArmed?cyan:pink;
  crate.position.z=THREE.MathUtils.damp(crate.position.z,-7.2+p.crateSlot*1.1,9,step);
  crateObstacle.z=-7.2+p.crateSlot*1.1;
  interactions[4].z=crateObstacle.z; // crate follows its saved rail slot
  interactions[5].x=p.crateSlot===2?7.8:999;
  conductors.forEach(({holder,halo},i)=>{holder.visible=vision&&p.crateSlot===2&&!p.archiveOff;halo.material=p.conductors.includes(i)?cyan:pink;});
  archiveArrow.visible=vision&&p.crateSlot===2&&!p.archiveOff;
  emitters.forEach(({holder,halo},i)=>{holder.visible=vision&&!p.transmissionOff&&p.jukeboxOff&&p.archiveOff;halo.material=p.emitters.includes(i)?cyan:pink;});
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
  const bossActive=p.transmissionOff&&!p.bossDefeated;
  bossAnchor.visible=bossActive;
  bossObstacle.x=bossActive?bossAnchor.position.x:999;
  generators.forEach(({group,halo},i)=>{group.visible=bossActive&&!p.generators[i];halo.rotation.z+=step*.9;});
  bossVulnerable=bossActive&&p.generators.every(Boolean)&&Math.sin(time*1.35)>.05;
  bossLight.intensity=bossActive?(bossVulnerable?5.5:2.3):0;
  bossFallback.rotation.y+=step*.35;
  artifact.visible=p.bossDefeated;artifactOrb.rotation.y+=step*.6;
  interactions[8].x=p.bossDefeated&&!completed?0:999;
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
   bossCooldown=Math.max(0,bossCooldown-step);
   if(bossCooldown===0&&bossWindup===0&&shotLife<=0){bossWindup=.9;bossCooldown=3.7;}
   if(bossWindup>0){bossWindup-=step;warning.position.set(player.x,.045,player.z);warning.visible=true;
    if(bossWindup<=0){const origin=new THREE.Vector3(bossAnchor.position.x,1.65,bossAnchor.position.z+1),direction=new THREE.Vector3(player.x-origin.x,player.y+1.2-origin.y,player.z-origin.z).normalize();
     shot.start(origin,direction,true);shotVelocity.copy(direction).multiplyScalar(6.8);shotLife=3;}}
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
  shot.update(step,time,reducedMotion);
  damage.update(step,p,reducedMotion,camera);
 }
 ghostAnchor.visible=false;bossAnchor.visible=false;jukeCore.visible=false;circuit.visible=false;redArcs.visible=false;reflector.visible=false;reflectorRail.visible=false;inscription.visible=false;archiveArrow.visible=false;passingShadow.visible=false;
 for(const item of clueSigns)item.hidden.visible=false;
 for(const item of emitters)item.holder.visible=false;
 for(const item of conductors)item.holder.visible=false;
 for(const item of generators)item.group.visible=false;
 function dispose(){ghost?.dispose();shot.clear();}
 return {root,obstacles,colliders,interactions,loadAssets,getTargets,registerImpact,update,dispose,getModelStatus:()=>modelStatus};
}
