import * as THREE from 'three';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {MATRIX_ASSETS,MATRIX_SECTORS} from './matrixLayout.js';
import {canMatrixEnemyStand} from './matrixEnemyMovement.js';
import {firstMatrixProjectileImpact} from './matrixProjectileCollision.js';
import {createOrbGlowTexture,createOrbHalo,createPlasmaOrb} from './neonOrbVisuals.js';
import {disposeObjects} from './disposeGameObjects.js';
import {createEnemyOrbVisual} from './enemyOrbVisuals.js';
import {createHolographicGroundRing} from './holographicGroundRing.js';
import {BLOCK_ORDER,MATRIX_HEALTH,MATRIX_BOSS_PHASE} from './matrixQuest.js';
import {createMatrixEnergySystem} from './matrixEnergyArchitecture.js';
import {createMatrixMaterials,createMatrixSign,createMatrixBossNodeSign,matrixSurfaceGeometry,buildMatrixGraphics} from './matrixGraphics.js';

const URLS={
 'robot-bueno.glb':new URL('../assets/neonboy-animaciones/matrix/robot-bueno.glb',import.meta.url).href,
 'robot-zombie-walk.glb':new URL('../assets/neonboy-animaciones/matrix/robot-zombie-walk.glb',import.meta.url).href,
 'robot-zombie-patada.glb':new URL('../assets/neonboy-animaciones/matrix/robot-zombie-patada.glb',import.meta.url).href,
 'robot2-zombie-walk.glb':new URL('../assets/neonboy-animaciones/matrix/robot2-zombie-walk.glb',import.meta.url).href,
 'roboto2-zombie-ataque.glb':new URL('../assets/neonboy-animaciones/matrix/roboto2-zombie-ataque.glb',import.meta.url).href,
 'espectro-walk.glb':new URL('../assets/neonboy-animaciones/matrix/espectro-walk.glb',import.meta.url).href,
 'espectro-ataque.glb':new URL('../assets/neonboy-animaciones/matrix/espectro-ataque.glb',import.meta.url).href,
 'centinela-09.glb':new URL('../assets/neonboy-animaciones/matrix/centinela-09.glb',import.meta.url).href,
 'robot-maligno-fuxia-walk.glb':new URL('../assets/neonboy-animaciones/matrix/robot-maligno-fuxia-walk.glb',import.meta.url).href,
 'robot-maligno-fuxia-patada.glb':new URL('../assets/neonboy-animaciones/matrix/robot-maligno-fuxia-patada.glb',import.meta.url).href,
 'neon-maligno-walk.glb':new URL('../assets/neonboy-animaciones/matrix/neon-maligno-walk.glb',import.meta.url).href,
 'neon-maligno-atack.glb':new URL('../assets/neonboy-animaciones/matrix/neon-maligno-atack.glb',import.meta.url).href,
};
const TAU=Math.PI*2;
const phases={city:0,archive:1,workshop:2,security:3,mirror:4};
const gateConfig=[
 {id:'bridge',z:3.1,open:p=>p.bridgeOpen},
 {id:'memory',z:-25.8,open:p=>p.memoryOpen},
 {id:'blocks',z:-42.2,open:p=>p.blocksOpen},
 {id:'heavy',z:-51,open:p=>p.heavyDefeated},
 {id:'authorization',z:-68.8,open:p=>p.securityOpen},
 {id:'elite',z:-77,open:p=>p.eliteDefeated},
];
const enemyConfig={
 'zombie-city':{health:5,speed:2.7,detect:10,range:1.8,damage:1,cooldown:1.0,windup:.42},
 'zombie-workshop':{health:5,speed:2.7,detect:10,range:1.8,damage:1,cooldown:1.0,windup:.42},
 'spectre-archive':{health:4,speed:3.1,detect:11,range:1.8,damage:1,cooldown:1.05,windup:.4},
 heavy:{health:MATRIX_HEALTH.heavy,speed:1.95,detect:10.5,range:2.5,damage:1,cooldown:1.75,windup:.68},
 elite:{health:MATRIX_HEALTH.elite,speed:3.7,detect:14,range:2.2,damage:1,cooldown:1.0,windup:.42},
 'neon-evil':{health:MATRIX_HEALTH.boss,speed:3.3,detect:15,range:2.6,damage:1,cooldown:.98,windup:.5},
 'drone-workshop':{health:5,speed:3.1,detect:12,range:3.2,damage:1,cooldown:1.05,windup:.43},
 'drone-security':{health:5,speed:3.1,detect:12,range:3.2,damage:1,cooldown:1.05,windup:.43},
};
function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
function line(parent,a,b,color=0x5fdde7,opacity=.65){
 const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);
 const m=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity,toneMapped:false}));parent.add(m);return m;
}
function staticBox(root,colliders,obstacles,name,x,y,z,w,h,d,material,solid=false){
 const m=mesh(root,matrixSurfaceGeometry(w,h,d),material,x,y,z);m.name=name;m.receiveShadow=true;m.castShadow=h>.8;
 if(solid){
  colliders.push(m);
  const obstacle={id:name,x,z,hx:w/2,hz:d/2};
  if(name.startsWith('memory block ')||name==='energy container')obstacle.platformTop=y+h/2;
  obstacles.push(obstacle);
 }
 return m;
}
function strip(parent,x,y,z,w,d,material){const m=mesh(parent,new THREE.PlaneGeometry(w,d),material,x,y,z);m.rotation.x=-Math.PI/2;return m;}
function inPlace(clip){if(!clip)return null;const copy=clip.clone();for(const track of copy.tracks){
 if(/(?:Hips|Armature|Root)\.position$/i.test(track.name)){const x=track.values[0],y=track.values[1],z=track.values[2];
  for(let i=0;i<track.values.length;i+=3){track.values[i]=x;track.values[i+1]=y;track.values[i+2]=z;}}
}return copy;}
export function buildMatrixWorld(scene,{onEvent,onDamage,onStatus}={}){
 const root=new THREE.Group();root.name='PUERTA 03 / La realidad fracturada';scene.add(root);
 scene.background=new THREE.Color(0x0b1223);scene.fog=new THREE.FogExp2(0x101c30,.021);
 const obstacles=[],colliders=[],interactions=[],projectileSigns=[];
 const label=(parent,...args)=>{
  const sign=createMatrixSign(parent,...args);
  if(parent===root)projectileSigns.push(sign.children[0]);
  return sign;
 };
 const mat=createMatrixMaterials();
 const energySystem=createMatrixEnergySystem(root);
 const glow=createOrbGlowTexture();
 scene.add(new THREE.AmbientLight(0x566b9c,.28));
 const upper=new THREE.DirectionalLight(0x91c5ef,.6);upper.position.set(7,18,12);root.add(upper);
 // Solid islands are joined by a visible bridge and narrow central halls. Side rails stop shortcuts.
 for(const [z,length] of [[15,18],[-14.3,23],[-38.5,25],[-64,26],[-91,28]]){
  staticBox(root,colliders,obstacles,'island floor',0,-.32,z,31,.58,length,mat.floor);
  for(const x of [-15.4,15.4])staticBox(root,colliders,obstacles,'dimensional edge',x,.64,z,.35,1.25,length,mat.dark,true);
 }
 const bridgeDeck=staticBox(root,colliders,obstacles,'data bridge',0,-.18,3.4,6,.32,9,mat.dark);
 bridgeDeck.visible=false;
 for(const x of [-9,9])staticBox(root,colliders,obstacles,'bridge void guard',x,.6,3.4,12,1.2,9,mat.dark,true);
 for(let z=22;z>-104;z-=2.4){
  for(const x of [-14.9,14.9])strip(root,x,.012,z,.045,1.85,mat.cyan);
  for(const x of [-6,0,6])strip(root,x,.012,z,.025,1.5,mat.screen);
 }
 for(const s of MATRIX_SECTORS){
  label(root,s.label,0,5.7,s.z-8,8.6,s.id==='workshop'||s.id==='mirror'?'#ed76cf':'#8be8f1');
  for(const x of [-13,13]){
   const tower=staticBox(root,colliders,obstacles,'memory tower',x,2.8,s.z,2.1,5.6,2.1,mat.wall,true);
   energySystem.createTower(tower);
  }
 }
 for(const [x,z,h] of [[-11,17,8],[11,19,5],[-11,8,10],[11,6,7]]){
  const tower=staticBox(root,colliders,obstacles,'unfinished building',x,h/2,z,3,h,3,mat.wall,true);
  energySystem.createTower(tower);
 }
 for(const [x,z,h] of [[-11,-12,5],[11,-20,4],[-11,-36,7],[11,-44,6],[-11,-63,5],[11,-70,6]]){
  const core=staticBox(root,colliders,obstacles,'fragmented data column',x,h/2,z,2.3,h,2.3,mat.dark,true);
  energySystem.createTower(core);
 }
 energySystem.finishTowers();
 gateConfig.forEach(config=>{
  for(const x of [-10.5,10.5])staticBox(root,colliders,obstacles,'sector bulkhead',x,2,config.z,9,4,1.12,mat.wall,true);
  energySystem.createGate(config,colliders,obstacles);
  if(config.id!=='bridge')label(root,({bridge:'ENLACE / CIUDAD',memory:'ARCHIVO / MEMORIA',blocks:'TALLER / TRANSFERENCIA',heavy:'CONTROL / REFRIGERACION',authorization:'SEGURIDAD / ACCESO',elite:'ESPEJO / NUCLEO'})[config.id],0,4.45,config.z+.5,5.6);
 });
 const nodeSymbols=['ORIGEN','ECO','ENLACE'];
 label(root,'ORIGEN  >  ECO  >  ENLACE',0,4.75,3.9,6.2);
 const bridgeNodes=MATRIX_ASSETS.filter(a=>a.id.startsWith('bridge-node')).map((a,index)=>{
   const holder=new THREE.Group();holder.position.set(...a.position);root.add(holder);
   const plasma=createPlasmaOrb({radius:.29,texture:glow});holder.add(plasma.root);
   const ring=mesh(holder,new THREE.TorusGeometry(.53,.045,8,40),mat.pink);
   label(holder,nodeSymbols[index],0,-.93,.55,1.8);
   const hidden=mesh(holder,new THREE.TorusGeometry(.7,.013,6,40),mat.cyan);hidden.visible=false;
   return {holder,plasma,ring,hidden};
 });
 const bridgeLines=[];
 for(let z=-.7;z<7.8;z+=.9){const m=strip(root,0,.008,z,5.6,.022,mat.cyan);m.visible=false;bridgeLines.push(m);}
 const memoryScreens=[
  {id:'concert',label:'BURN LIES / LA PRIMERA ANOMAL\u00cdA',x:-6,z:-12},
  {id:'store',label:'LA TIENDA / UN FUTURO IMPOSIBLE',x:0,z:-12},
  {id:'ship',label:'AZOTEA / TRANSMISI\u00d3N PUERTA 01',x:6,z:-12},
 ];
 for(const screen of memoryScreens){
  staticBox(root,colliders,obstacles,'memory display',screen.x,2.1,screen.z,4,2.5,.18,mat.dark,true);
  mesh(root,new THREE.PlaneGeometry(3.55,1.85),mat.screen,screen.x,2.1,screen.z+.102);
  label(root,screen.label,screen.x,.68,screen.z+.2,3.9);
  interactions.push({id:'memory:'+screen.id,label:'recuerdo de '+screen.id,x:screen.x,z:screen.z+1.4,reach:2.3});
 }
 for(const [x,title] of [[-9,'ESTUDIO / CINTA IMPOSIBLE'],[9,'ARCADE / FREQUENCY 09']]){
  staticBox(root,colliders,obstacles,'memory echo',x,2,-19,3.4,2,.16,mat.dark,true);
  label(root,title,x,.78,-18.78,3.4);
 }
 label(root,'RECITAL  /  VISI\u00d3N  /  TRANSMISI\u00d3N',0,4.3,-21,8);
 const dataFragment=mesh(root,new THREE.OctahedronGeometry(.38,1),mat.cyan,0,1.55,-23);
 interactions.push({id:'memoryFragment',label:'fragmento de memoria',x:0,z:-23,reach:2});
 const blocks=[-4,0,4].map((x,i)=>{
  const m=staticBox(root,colliders,obstacles,'memory block '+i,x,.62,-38,1.1,1.24,1.1,mat.wall,true);
  const obstacle=obstacles.at(-1);m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:[0x83d7e9,0xeb7fcb,0xe8c78a][i]})));
  interactions.push({id:'block:'+i,label:'mover bloque '+['PULSO','ECO','ENLACE'][i],x,z:-38,reach:2});
  return {mesh:m,obstacle};
 });
 const plates=[-4,0,4].map((x,i)=>{
  const plate=staticBox(root,colliders,obstacles,'memory plate',x,.02,-40,.95,.04,.95,mat.dark);
  label(root,['I / ENTRADA','II / CENTRO','III / SALIDA'][i],x,.26,-40,2.2);
  return plate;
 });
 label(root,'EL ENLACE ABRE  /  EL PULSO SOSTIENE  /  EL ECO CIERRA',0,3.5,-34,9);
 const module=mesh(root,new THREE.DodecahedronGeometry(.36,0),mat.cyan,6,1.25,-41.4);
 interactions.push({id:'module',label:'m\u00f3dulo energ\u00e9tico',x:6,z:-41.4,reach:2});
 const container=staticBox(root,colliders,obstacles,'energy container',-8,.75,-45,1.45,1.5,1.45,mat.wall,true);
 const containerObstacle=obstacles.at(-1);
 line(root,[-8,1.55,-45],[-8,.05,-45],0xf683cf);
 const containerPlate=staticBox(root,colliders,obstacles,'container plate',-4,.025,-47,2,.05,2,mat.dark);
 interactions.push({id:'container',label:'mover contenedor energ\u00e9tico',x:-8,z:-45,reach:2.8});
 label(root,'CONTENEDOR  >  PLACA  >  REFRIGERACI\u00d3N',0,4.4,-44,8);
 const coolants=[-5,5].map((x,index)=>{
  const holder=new THREE.Group();holder.position.set(x,1.45,-48);root.add(holder);
  mesh(holder,new THREE.CylinderGeometry(.4,.4,.14,20),mat.wall).rotation.x=Math.PI/2;
  const ring=mesh(holder,new THREE.TorusGeometry(.36,.06,8,32),mat.cyan);
  label(root,'REFRIGERANTE '+(index+1),x,2.5,-48,2.8);
  return {holder,ring};
 });
 const evidence=mesh(root,new THREE.BoxGeometry(.55,.12,.36),mat.cyan,-6,1.25,-61);
 staticBox(root,colliders,obstacles,'evidence stand',-6,.55,-61,1.2,1.1,.9,mat.dark,true);
 interactions.push({id:'evidence',label:'registro de origen de la corrupci\u00f3n',x:-6,z:-61,reach:2});
 const energy=staticBox(root,colliders,obstacles,'energy terminal',7,1.2,-62,2.3,2.4,.65,mat.dark,true);
 label(root,'2 SISTEMAS  /  1 MEMORIA  /  2 GUARDIA',7,2.7,-61.62,4.8);
 interactions.push({id:'energy',label:'distribuci\u00f3n de energ\u00eda',x:7,z:-61.5,reach:2.7});
 const auth=staticBox(root,colliders,obstacles,'authorization terminal',0,1,-65,2.4,2,.75,mat.wall,true);
 label(root,'AUTORIZACI\u00d3N',0,2.5,-64.6,3.6);
 interactions.push({id:'authorization',label:'terminal de autorizaci\u00f3n',x:0,z:-63.5,reach:2.7});
 const floorTiles=[];
 for(let row=0;row<3;row++)for(let col=0;col<5;col++){
  const x=(col-2)*5.8,z=-81-row*6.5;
  const m=staticBox(root,colliders,obstacles,'mirror floor tile',x,-.005,z,5.7,.05,6.3,mat.floor);
  const glowLine=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0xea5cbf,transparent:true,opacity:.5}));glowLine.position.copy(m.position);root.add(glowLine);
  floorTiles.push({mesh:m,edge:glowLine,x,z,stable:(row+col)%3!==0});
 }
 const bossNodes=[-4.8,0,4.8].map((x,i)=>{
  const holder=new THREE.Group();holder.position.set(x,1.5,-94);root.add(holder);
  const orb=createPlasmaOrb({radius:.3,texture:glow});holder.add(orb.root);
  mesh(holder,new THREE.TorusGeometry(.47,.035,6,48),mat.pink);
  const sign=createMatrixBossNodeSign(root,i,x,.66,-92.95);
  const signObstacle={id:'boss node sign '+i,x:999,z:sign.position.z,hx:sign.userData.halfWidth,hz:sign.userData.halfDepth};
  obstacles.push(signObstacle);colliders.push(sign.children[0]);projectileSigns.push(sign.children[0]);
  sign.visible=false;sign.children[0].visible=false;
  return {holder,orb,sign,signObstacle};
 });
 const archive=staticBox(root,colliders,obstacles,'central archive',0,1.075,-102,2.8,2.15,.9,mat.dark,true);
 label(root,'ARCHIVO CENTRAL',0,2.54,-101.48,2.65);
 interactions.push({id:'centralArchive',label:'Archivo Central',x:0,z:-100.5,reach:2.9});
 const checkpointMarkers=new Map();
 for(const asset of MATRIX_ASSETS.filter(item=>item.id.startsWith('checkpoint-'))){
  const marker=createHolographicGroundRing({radius:.66,color:0x5addf0,secondary:0xc5ffff,variant:'checkpoint',seed:1.3});
  marker.mesh.position.set(...asset.position);root.add(marker.mesh);checkpointMarkers.set(asset.id,marker);
 }
 const returnPortal=new THREE.Group();returnPortal.position.set(-10,1.8,20);root.add(returnPortal);
 mesh(returnPortal,new THREE.TorusGeometry(1.2,.13,12,64),mat.cyan).scale.y=1.3;
 mesh(returnPortal,new THREE.CircleGeometry(1.1,48),mat.glass).scale.y=1.3;
 interactions.push({id:'returnPortal',label:'portal de regreso a la nave',x:-10,z:20,reach:2});
 const exitPortal=returnPortal.clone(true);exitPortal.position.set(10,1.8,-100);root.add(exitPortal);
 interactions.push({id:'exitPortal',label:'regresar a Buenos Aires',x:10,z:-100,reach:2});

 const mirrorAltarVisual=createHolographicGroundRing({radius:1.15,color:0xe56fc9,secondary:0x9aeffa,variant:'altar',opacity:.9});
 const mirrorAltar=mirrorAltarVisual.mesh;mirrorAltar.position.set(0,.04,-81);root.add(mirrorAltar);
 interactions.push({id:'mirrorAltar',label:'altar del Espejo Digital',x:0,z:-81,reach:3});
 const graphics=buildMatrixGraphics(root,mat,{bridgeDeck,bridgeNodes,blocks,plates,container,containerPlate,coolants,dataFragment,module,evidence,energy,auth,archive,bossNodes,returnPortal,exitPortal,floorTiles,obstacles,colliders},glow);
 const projectileColliders=[...new Set([...colliders,...projectileSigns])];
 const projectileSignBounds=projectileSigns.map(mesh=>({mesh,box:new THREE.Box3()}));
 const projectileRaycaster=new THREE.Raycaster();
 const projectileStart=new THREE.Vector3(),projectileEnd=new THREE.Vector3();
 const actors=new Map();const actorMeta=new Map();const loaderCache=new Map();const editorPositions=new Map();let loaderRef=null,aliveRef=()=>false;
 const actorIds=['nex9','zombie-city','zombie-workshop','spectre-archive','heavy','sentinel','drone-workshop','drone-security','elite','neon-evil'];
 for(const id of actorIds){
  const info=MATRIX_ASSETS.find(a=>a.id===id);
  const group=new THREE.Group();group.name='matrix actor / '+id;group.position.set(...info.position);group.rotation.y=(info.rotation[1]||0)*Math.PI/180;root.add(group);
  const fallback=mesh(group,new THREE.CapsuleGeometry(id==='heavy'||id==='neon-evil'?.58:.35,id==='heavy'||id==='neon-evil'?1.45:1.1,4,10),
    new THREE.MeshStandardMaterial({color:id==='nex9'?0xc0deea:id==='sentinel'?0x61778d:id.startsWith('drone')?0x527d93:0x753254,roughness:.55}),0,1.2,0);
  actorMeta.set(id,{fallback});
  const friendly=id==='nex9'||id==='sentinel';
  const ringVisual=createHolographicGroundRing({radius:id==='heavy'||id==='neon-evil'?.8:.55,color:friendly?0x67deef:0xe967bf,secondary:friendly?0xbdffff:0xffc3e7,seed:actorIds.indexOf(id)*.71});
  const ring=ringVisual.mesh;group.add(ring);
  const marker=id==='nex9'?label(group,'NEX-9',0,2.65,0,2.1):null;
  if(marker)marker.rotation.y=Math.PI;
  const obstacle={id:'matrix actor '+id,x:group.position.x,z:group.position.z,radius:id==='heavy'||id==='neon-evil'?.72:id.startsWith('drone')?.5:.44};
  obstacles.push(obstacle);
  actors.set(id,{id,info,group,ring,ringVisual,marker,obstacle,alive:true,health:enemyConfig[id]?.health||0,
    cooldown:0,windup:0,hitCooldown:0,attackStarted:false,alarmSent:false,phase:0,patrol:0,shotCooldown:1.2,shotWindup:0,model:null,mixer:null,walk:null,attack:null,loadPromise:null});
 }
 interactions.push({id:'nex9',label:'hablar con NEX-9',x:5,z:17,reach:2.5});
 interactions.push({id:'sentinel',label:'hablar con Centinela 09',x:0,z:-57,reach:2.5});
 const projectiles=[];
 for(let i=0;i<6;i++){
  const visual=createEnemyOrbVisual(glow,i*.73);root.add(visual.root);
  projectiles.push({mesh:visual.body,visual,velocity:new THREE.Vector3(),life:0});
 }
 async function asset(file){
  if(!loaderCache.has(file))loaderCache.set(file,loaderRef.loadAsync(URLS[file]).catch(error=>{
    loaderCache.delete(file);throw error;
  }));
  return loaderCache.get(file);
 }
 async function ensureActor(actor){
  if(!actor.info.file||actor.model||actor.loadPromise||!loaderRef)return;
  actor.loadPromise=(async()=>{
   const walkAsset=await asset(actor.info.file);
   if(!aliveRef())return;
   const model=actor.id==='nex9'?walkAsset.scene:cloneSkeleton(walkAsset.scene);
   model.updateMatrixWorld(true);model.traverse(object=>{if(object.isSkinnedMesh)object.skeleton.update();});
   const bounds=new THREE.Box3().makeEmpty(),vertex=new THREE.Vector3();
   model.traverse(object=>{
    if(!object.isMesh)return;
    const positions=object.geometry?.attributes?.position;if(!positions)return;
    for(let i=0;i<positions.count;i++){
     if(object.isSkinnedMesh)object.getVertexPosition(i,vertex);
     else vertex.fromBufferAttribute(positions,i);
     object.localToWorld(vertex);bounds.expandByPoint(vertex);
    }
   });
   const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   const scale=actor.info.height/Math.max(.01,size.y);
   model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
   model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.frustumCulled=false;}});
   actor.group.add(model);actor.model=model;
   if(actorMeta.get(actor.id)?.fallback)actorMeta.get(actor.id).fallback.visible=false;
   if(walkAsset.animations?.length && actor.id!=='nex9'){
    const mixer=new THREE.AnimationMixer(model),clip=inPlace(walkAsset.animations[0]);
    actor.mixer=mixer;actor.walk=mixer.clipAction(clip);actor.walk.play();actor.walk.paused=true;actor.walk.timeScale=THREE.MathUtils.clamp((enemyConfig[actor.id]?.speed||1.4)/1.4,.9,2.2);mixer.update(0);
   }
   // The skinned mesh can move when the hierarchy is scaled. Fit the rendered
   // pose after mounting, using the same bone transforms WebGL will draw.
   for(let pass=0;pass<2;pass++){
    model.updateMatrixWorld(true);
    model.traverse(object=>{if(object.isSkinnedMesh)object.skeleton.update();});
    const posed=new THREE.Box3().makeEmpty(),point=new THREE.Vector3();
    model.traverse(object=>{
     if(!object.isMesh)return;
     const position=object.geometry?.attributes?.position;if(!position)return;
     for(let i=0;i<position.count;i++){
      if(object.isSkinnedMesh)object.getVertexPosition(i,point);
      else point.fromBufferAttribute(position,i);
      object.localToWorld(point);posed.expandByPoint(point);
     }
    });
    if(!Number.isFinite(posed.min.y))break;
    const height=posed.max.y-posed.min.y;
    if(height>.001)model.scale.multiplyScalar(actor.info.height/height);
    model.updateMatrixWorld(true);
    model.traverse(object=>{if(object.isSkinnedMesh)object.skeleton.update();});
    posed.makeEmpty();
    model.traverse(object=>{
     if(!object.isMesh)return;
     const position=object.geometry?.attributes?.position;if(!position)return;
     for(let i=0;i<position.count;i++){
      if(object.isSkinnedMesh)object.getVertexPosition(i,point);
      else point.fromBufferAttribute(position,i);
      object.localToWorld(point);posed.expandByPoint(point);
     }
    });
    const foot=actor.group.worldToLocal(new THREE.Vector3((posed.min.x+posed.max.x)/2,posed.min.y,(posed.min.z+posed.max.z)/2));
    model.position.sub(foot);
   }
   if(actor.info.attack){
    try{
     const attackAsset=await asset(actor.info.attack);
     if(aliveRef()&&attackAsset.animations?.length&&actor.mixer){
      actor.attack=actor.mixer.clipAction(inPlace(attackAsset.animations[0]));
      actor.attack.setLoop(THREE.LoopOnce,1);actor.attack.clampWhenFinished=true;
     }
    }catch{/* Procedural attack remains available. */}
   }
  })().catch(()=>{});
  return actor.loadPromise;
 }
 function applyTransform(id,transform){
  const asset=MATRIX_ASSETS.find(a=>a.id===id);if(!asset)return;
  const actor=actors.get(id);
  editorPositions.set(id,[...transform.position]);
  if(actor){actor.group.position.set(...transform.position);actor.group.rotation.set(...transform.rotation.map(v=>v*Math.PI/180));actor.group.scale.setScalar(transform.scale);actor.home=[...transform.position];actor.tuning={detect:transform.detect,damage:transform.attackPower,patrolRadius:transform.patrolRadius};
   const spot=interactions.find(item=>item.id===id);if(spot){spot.x=transform.position[0];spot.z=transform.position[2];spot.reach=transform.reach||spot.reach;}return;}
  const place=object=>{if(!object)return;object.position.set(...transform.position);object.rotation.set(...transform.rotation.map(v=>v*Math.PI/180));object.scale.setScalar(transform.scale);};
  if(id.startsWith('bridge-node'))place(bridgeNodes[Number(id.slice(-1))-1]?.holder);
  if(id.startsWith('memory-block-')){const block=blocks[Number(id.slice(-1))];place(block?.mesh);if(block){block.obstacle.hx=.55*transform.scale;block.obstacle.hz=.55*transform.scale;block.obstacle.platformTop=block.mesh.position.y+.62*transform.scale;}}
  if(id==='container'){place(container);containerObstacle.hx=.725*transform.scale;containerObstacle.hz=.725*transform.scale;containerObstacle.platformTop=container.position.y+.75*transform.scale;}
  if(id.startsWith('memory-plate-'))place(plates[Number(id.slice(-1))]);
  if(id==='container-plate')place(containerPlate);
  if(id==='energy-terminal'){place(energy);const obstacle=obstacles.find(o=>o.id==='energy terminal');if(obstacle){obstacle.x=transform.position[0];obstacle.z=transform.position[2];obstacle.hx=1.15*transform.scale;obstacle.hz=.325*transform.scale;}const energySpot=interactions.find(item=>item.id==='energy');if(energySpot){energySpot.x=transform.position[0];energySpot.z=transform.position[2]+.5;}}
  if(id.startsWith('boss-node-')){
   const node=bossNodes[Number(id.slice(-1))-1];place(node?.holder);
   if(node){
    node.sign.position.set(transform.position[0],transform.position[1]-.84*transform.scale,transform.position[2]+1.05*transform.scale);
    node.sign.scale.setScalar(transform.scale);
    node.signObstacle.x=node.sign.visible?node.sign.position.x:999;node.signObstacle.z=node.sign.position.z;
    node.signObstacle.hx=node.sign.userData.halfWidth*transform.scale;node.signObstacle.hz=node.sign.userData.halfDepth*transform.scale;
   }
  }
  if(id==='mirror-altar'){place(mirrorAltar);const spot=interactions.find(item=>item.id==='mirrorAltar');if(spot){spot.x=transform.position[0];spot.z=transform.position[2];}}
  if(id.startsWith('coolant-'))place(coolants[Number(id.slice(-1))-1]?.holder);
  if(id==='authorization'){place(auth);const obstacle=obstacles.find(o=>o.id==='authorization terminal');if(obstacle){obstacle.x=transform.position[0];obstacle.z=transform.position[2];obstacle.hx=1.2*transform.scale;obstacle.hz=.375*transform.scale;}}
  const spot=interactions.find(item=>item.id===id);if(spot){spot.x=transform.position[0];spot.z=transform.position[2];spot.reach=transform.reach||spot.reach;}
  if(id.startsWith('checkpoint-'))place(checkpointMarkers.get(id)?.mesh);
  if(id==='portal-return')place(returnPortal);
  if(id==='portal-exit')place(exitPortal);
 }
 function launchProjectile(origin,player,speed=6.4,dark=false){
  const p=projectiles.find(item=>item.life<=0);if(!p)return;
  p.velocity.set(player.x-origin.x,1.18-origin.y,player.z-origin.z).normalize().multiplyScalar(speed);
  p.visual.start(origin,p.velocity,dark);p.life=2.6;
 }
 function getTargets(p){
  if(!p?.entered)return [];
  const targets=[];
  if(!p.bridgeOpen&&p.visionActive&&p.nexMet)bridgeNodes.forEach((n,i)=>targets.push({kind:'matrix-bridge-node',symbol:['origin','echo','link'][i],position:n.holder.position.clone(),radius:.4}));
  if(p.containerOnPlate&&!p.heavyDefeated)coolants.forEach((n,i)=>{if(!p.coolant[i])targets.push({kind:'matrix-coolant',index:i,position:n.holder.position.clone(),radius:.45});});
  if(p.bossStarted&&p.bossHealth<=MATRIX_BOSS_PHASE.nodes&&p.visionActive&&!p.bossNodes.every(Boolean))bossNodes.forEach((n,i)=>{if(!p.bossNodes[i])targets.push({kind:'matrix-boss-node',index:i,position:n.holder.position.clone(),radius:.48});});
  for(const actor of actors.values()){
   const id=actor.id;if(!enemyConfig[id]||!actor.alive||!actor.group.visible||actor.hitCooldown>0)continue;
   if((id==='heavy'&&!p.blocksOpen)||(id==='elite'&&!p.securityOpen)||(id==='neon-evil'&&!p.bossStarted))continue;
   if(id==='spectre-archive'&&!p.visionActive&&actor.phase!==1)continue;
   if(id==='elite'&&actor.phase!==1)continue;
   const y=id.startsWith('drone')?actor.group.position.y+.28:id==='heavy'||id==='neon-evil'?1.7:1.3;
   targets.push({kind:'matrix-enemy',id,position:new THREE.Vector3(actor.group.position.x,id==='neon-evil'?1.5:y,actor.group.position.z),radius:id==='neon-evil'?.82:id==='heavy'?.85:id.startsWith('drone')?.7:.65,returnHit:true,...(id==='neon-evil'?{capsuleHalfHeight:.9}:{})});
  }
  return targets;
 }
 function registerImpact(target){
  if(target.kind==='matrix-bridge-node'){onEvent?.('bridge-node',target.symbol);return;}
  if(target.kind==='matrix-coolant'){onEvent?.('coolant-hit',target.index);return;}
  if(target.kind==='matrix-boss-node'){onEvent?.('boss-node',target.index);return;}
  if(target.kind!=='matrix-enemy')return;
  const actor=actors.get(target.id);if(!actor||actor.hitCooldown>0)return;
  actor.hitCooldown=target.id==='neon-evil'?.08:.42;actor.windup=0;
  if(target.id==='heavy')onEvent?.('heavy-hit');
  else if(target.id==='elite')onEvent?.('elite-hit');
  else if(target.id==='neon-evil')onEvent?.('boss-hit',{shieldOpen:Boolean(actor.phase),returning:Boolean(target.returning)});
  else{
   actor.health=Math.max(0,actor.health-1);
   if(actor.health===0){actor.alive=false;onEvent?.('enemy-defeat',actor.id);}
   else onEvent?.('enemy-hurt',{id:actor.id,health:actor.health});
  }
 }
 let time=0,bossReported='',bossBurst=false,initialBossState=false,hazardCooldown=0;
 const defeatShards=[];const shardGeometry=new THREE.TetrahedronGeometry(.13,0);const shardMaterial=new THREE.MeshBasicMaterial({color:0xe745b8,transparent:true,opacity:.9,toneMapped:false});
 for(let i=0;i<32;i++){const shard=mesh(root,shardGeometry,shardMaterial);shard.visible=false;defeatShards.push({mesh:shard,v:new THREE.Vector3(),life:0});}
 function update(dt,elapsed,p,player,paused=false,camera=null,reducedMotion=false){
  const step=paused?0:Math.min(.05,dt);time+=reducedMotion?0:step;hazardCooldown=Math.max(0,hazardCooldown-step);
  if(!p)return;
  energySystem.update(step,time,p,reducedMotion);
  graphics.update(step,time,p,player,camera,reducedMotion);
  if(!initialBossState){initialBossState=true;bossBurst=Boolean(p.bossDefeated);}
  bridgeDeck.visible=Boolean(p.bridgeOpen);bridgeLines.forEach(m=>m.visible=Boolean(p.bridgeOpen));
  bridgeNodes.forEach((n,i)=>{const on=p.bridgeSequence?.includes(['origin','echo','link'][i])||p.bridgeOpen;
   n.plasma.setActive(on);n.plasma.update(time,on?1:.45);n.ring.material=on?mat.cyan:mat.pink;
   n.hidden.visible=Boolean(p.visionActive&&!p.bridgeOpen);n.hidden.rotation.z+=step*.36;});
  dataFragment.visible=Boolean(p.memoryOpen&&!p.memoryFragment);dataFragment.rotation.y+=step*.7;
  module.visible=Boolean(p.blocksOpen&&!p.moduleTaken);evidence.visible=!p.evidenceFound;
  blocks.forEach((block,i)=>{
   const slot=p.blockPlacements?.[i]??-1;
   const base=editorPositions.get('memory-block-'+i)||[[-4,.62,-38],[0,.62,-38],[4,.62,-38]][i];
   const tx=slot<0?base[0]:plates[slot].position.x,tz=slot<0?base[2]:plates[slot].position.z;
   block.mesh.position.x=THREE.MathUtils.damp(block.mesh.position.x,tx,9,step);
   block.mesh.position.z=THREE.MathUtils.damp(block.mesh.position.z,tz,9,step);
   block.obstacle.x=block.mesh.position.x;block.obstacle.z=block.mesh.position.z;
   const spot=interactions.find(item=>item.id==='block:'+i);if(spot){spot.x=block.mesh.position.x;spot.z=block.mesh.position.z;}
  });
  plates.forEach((plate,slot)=>{plate.material=p.blockPlacements?.some((value,index)=>value===slot&&BLOCK_ORDER[index]===slot)?mat.cyan:mat.dark;});
  const baseContainer=editorPositions.get('container')||[-8,.75,-45];
  const tx=p.containerOnPlate?containerPlate.position.x:baseContainer[0],tz=p.containerOnPlate?containerPlate.position.z:baseContainer[2];
  container.position.x=THREE.MathUtils.damp(container.position.x,tx,8,step);
  container.position.z=THREE.MathUtils.damp(container.position.z,tz,8,step);
  containerObstacle.x=container.position.x;containerObstacle.z=container.position.z;
  const containerSpot=interactions.find(item=>item.id==='container');if(containerSpot){containerSpot.x=container.position.x;containerSpot.z=container.position.z;}
  containerPlate.material=p.containerOnPlate?mat.cyan:mat.dark;
  coolants.forEach((c,i)=>c.ring.material=p.coolant?.[i]?mat.cyan:mat.red);
  exitPortal.visible=Boolean(p.archiveRead);
  checkpointMarkers.forEach((marker,id)=>{marker.mesh.visible=p.checkpoint===id.slice(11);if(marker.mesh.visible)marker.update(step,{reducedMotion});});
  mirrorAltarVisual.update(step,{opacity:p.bossDefeated?.48:.9,alert:p.bossStarted?1:0,reducedMotion});
  floorTiles.forEach((tile,index)=>{
   const unstable=p.bossStarted&&p.bossHealth<=MATRIX_BOSS_PHASE.unstable&&p.bossHealth>0&&!tile.stable;
   tile.mesh.material=unstable&&Math.sin(time*1.3+index*2)>-.15?mat.glass:mat.floor;
   tile.edge.material.color.setHex(p.visionActive?(tile.stable?0x65dfe9:0xff5a8b):0xba458d);
   if(step&&unstable&&hazardCooldown<=0&&Math.abs(player.x-tile.x)<2.6&&Math.abs(player.z-tile.z)<2.7&&Math.sin(time*1.3+index*2)>-.15){
     hazardCooldown=2.3;onDamage?.(1);player.x=0;player.z=-80;player.velocityY=0;
     onEvent?.('unstable-floor');
   }
  });
  bossNodes.forEach((n,i)=>{
   const phaseVisible=Boolean(p.bossStarted&&p.bossHealth<=MATRIX_BOSS_PHASE.nodes&&!p.bossDefeated);
   n.holder.visible=phaseVisible&&!p.bossNodes[i];
   n.sign.visible=phaseVisible;n.sign.children[0].visible=phaseVisible;
   n.signObstacle.x=phaseVisible?n.sign.position.x:999;
   n.sign.setActivated(Boolean(p.bossNodes[i]));n.orb.update(time,.9);
  });
  for(const actor of actors.values()){
   const id=actor.id;
   const alive=id==='heavy'?!p.heavyDefeated:id==='elite'?!p.eliteDefeated:id==='neon-evil'?!p.bossDefeated:!p.defeated?.includes(id);
   const active=id==='zombie-city'?p.nexMet:id==='heavy'?p.blocksOpen:id==='elite'?p.securityOpen:id==='neon-evil'?p.bossStarted:
     id==='zombie-workshop'?p.memoryOpen:id==='spectre-archive'?p.bridgeOpen:
     id==='sentinel'?p.heavyDefeated:true;
   actor.alive=alive;
   actor.group.visible=active&&alive;
   actor.obstacle.x=actor.group.visible?actor.group.position.x:999;actor.obstacle.z=actor.group.position.z;
   if(!actor.group.visible)continue;
   const friendly=id==='nex9'||id==='sentinel',cooled=id==='heavy'&&p.coolant.every(Boolean)&&p.containerOnPlate;
   const warning=actor.windup>0||actor.shotWindup>0;
   actor.ringVisual.update(step,{color:friendly||cooled?0x67deef:warning?0xff635b:0xe967bf,alert:warning?1:0,reducedMotion});
   const distance=Math.hypot(player.x-actor.group.position.x,player.z-actor.group.position.z);
   if(distance<25&&actor.info.file&&loaderRef&&!actor.loadPromise)void ensureActor(actor);
   if(!step)continue;
   actor.hitCooldown=Math.max(0,actor.hitCooldown-step);actor.cooldown=Math.max(0,actor.cooldown-step);
   if(id==='nex9'||id==='sentinel'){
    if(id==='sentinel')actor.group.position.y=(actor.home?.[1]??actor.info.position[1])+Math.sin(time*2.4)*.06;
    actor.mixer?.update(step);continue;
   }
   if(id.startsWith('drone')&&distance<(actor.tuning?.detect??enemyConfig[id].detect)&&!actor.alarmSent&&!p.droneAlarm){actor.alarmSent=true;onEvent?.('drone-alarm');}
   {
    const isSpectre=id==='spectre-archive';
    actor.phase=isSpectre?Math.sin(time*1.15)>-.25||p.visionActive?1:0:id==='elite'||id==='neon-evil'?Math.sin(time*1.45)>0?1:0:1;
    if(isSpectre){actor.model?.traverse(o=>{if(o.isMesh)o.visible=Boolean(actor.phase);});if(!actor.model)actorMeta.get(id).fallback.visible=Boolean(actor.phase);actor.ring.visible=Boolean(actor.phase);}
    if(distance<(actor.tuning?.detect??enemyConfig[id].detect)&&distance>enemyConfig[id].range-.2&&actor.windup<=0){
      const move=Math.min(enemyConfig[id].speed*step,Math.max(0,distance-(enemyConfig[id].range-.25)));
      const dx=(player.x-actor.group.position.x)/distance*move;
      const dz=(player.z-actor.group.position.z)/distance*move;
      const canStand=(x,z)=>canMatrixEnemyStand(x,z,obstacles,actor.obstacle,id!=='elite'&&id!=='neon-evil');
      const x=actor.group.position.x,z=actor.group.position.z;
      // Slide along cover when the direct route clips its edge.
      const sign=actor.dodgeSign||1;
      const sidesteps=Math.abs(dx)>Math.abs(dz)?[[x,z+move*sign,sign],[x,z-move*sign,-sign]]:
        [[x+move*sign,z,sign],[x-move*sign,z,-sign]];
      const canMove=([nextX,nextZ])=>Math.hypot(nextX-x,nextZ-z)>1e-4&&canStand(nextX,nextZ);
      const straight=[x+dx,z+dz,0];
      const axes=[[x+dx,z,0],[x,z+dz,0]].filter(canMove)
        .sort((a,b)=>Math.hypot(a[0]-player.x,a[1]-player.z)-Math.hypot(b[0]-player.x,b[1]-player.z));
      // Keep sidestepping until the direct route clears; choosing the nearer axis
      // every frame otherwise makes a pursuing enemy oscillate beside cover.
      const options=canMove(straight)?[straight]:[...sidesteps.filter(canMove),...axes];
      if(options.length){actor.group.position.x=options[0][0];actor.group.position.z=options[0][1];if(options[0][2])actor.dodgeSign=options[0][2];if(actor.walk)actor.walk.paused=false;}
      else if(actor.walk)actor.walk.paused=true;
      actor.group.rotation.y=Math.atan2(player.x-actor.group.position.x,player.z-actor.group.position.z)+(id.startsWith('drone')?Math.PI:0);
    }else if(actor.walk)actor.walk.paused=true;
    if(id.startsWith('drone'))actor.group.position.y=(actor.home?.[1]??actor.info.position[1])+Math.sin(time*3+actor.group.position.x)*.09;
   }
   actor.mixer?.update(step);
   if(!id.startsWith('drone')&&distance<enemyConfig[id].range&&actor.cooldown<=0&&actor.windup<=0){
    actor.windup=enemyConfig[id].windup;
    actor.attackStarted=false;
   }
   if(actor.windup>0){
    if(!actor.attackStarted&&actor.attack){actor.attack.reset().play();actor.attack.timeScale=Math.min(2.2,Math.max(1,actor.attack.getClip().duration/Math.max(.35,actor.windup)));actor.attackStarted=true;}
    actor.windup=Math.max(0,actor.windup-step);
    if(actor.windup===0){
      if(distance<enemyConfig[id].range+.3)onDamage?.(actor.tuning?.damage??enemyConfig[id].damage);
      actor.cooldown=enemyConfig[id].cooldown;
    }
   }
   if(['drone-workshop','drone-security','elite','neon-evil'].includes(id)&&distance<(actor.tuning?.detect??enemyConfig[id].detect)&&(id.startsWith('drone')||distance>2.3)){
    actor.shotCooldown-=step;
    if(actor.shotCooldown<=0){
      launchProjectile(new THREE.Vector3(actor.group.position.x,id.startsWith('drone')?actor.group.position.y+.3:1.55,actor.group.position.z),player,id==='neon-evil'?10:8.5,id==='neon-evil');
      actor.shotCooldown=id==='neon-evil'?1.35:id==='elite'?1.55:1.5;
    }
   }
  }
  if(p.bossDefeated){
    for(const shot of projectiles){shot.life=0;shot.visual.clear();}
    if(!bossBurst){bossBurst=true;const origin=actors.get('neon-evil')?.group.position||new THREE.Vector3(0,0,-95);
      defeatShards.forEach((shard,i)=>{const angle=i*2.399;shard.mesh.position.set(origin.x,1.4+(i%5)*.22,origin.z);shard.v.set(Math.cos(angle)*(1.7+i%4),.9+(i%5)*.36,Math.sin(angle)*(1.7+i%4));shard.life=1.45;shard.mesh.visible=true;});}
  }
  for(const shard of defeatShards){if(shard.life<=0)continue;shard.life=Math.max(0,shard.life-step);shard.mesh.position.addScaledVector(shard.v,step);shard.v.y-=step*2.4;shard.mesh.rotation.y+=step*5;shard.mesh.visible=shard.life>0;}
  const activeCover=step&&projectiles.some(shot=>shot.life>0)
    ? projectileColliders.filter(mesh=>{for(let node=mesh;node;node=node.parent)if(!node.visible)return false;return true;}) : [];
  for(const cover of activeCover)cover.updateWorldMatrix(true,false);
  const signBounds=activeCover.length?projectileSignBounds.filter(item=>activeCover.includes(item.mesh)).map(item=>item.box.setFromObject(item.mesh).expandByScalar(.68)):[];
  for(const shot of projectiles){
    if(shot.life>0&&step>0){
      projectileStart.copy(shot.mesh.position);
      projectileEnd.copy(projectileStart).addScaledVector(shot.velocity,step);
      const impact=firstMatrixProjectileImpact(projectileStart,projectileEnd,player,activeCover,projectileRaycaster,signBounds);
      shot.mesh.position.copy(impact?.point||projectileEnd);
      shot.life=impact?0:shot.life-step;
      if(impact?.kind==='player')onDamage?.(1);
      if(shot.life<=0)shot.visual.finish(Boolean(impact));
    }
    shot.visual.update(step,time,reducedMotion);
  }
  const checkpoint=player.z<-78?'mirror':player.z<-52?'security':player.z<-27?'workshop':'city';
  if(checkpoint!==p.checkpoint)onEvent?.('checkpoint',checkpoint);
  const boss=actors.get('neon-evil');
  const status=p.bossDefeated?'defeated':p.bossStarted?p.bossHealth<=MATRIX_BOSS_PHASE.nodes?'phase3':p.bossHealth<=MATRIX_BOSS_PHASE.unstable?'phase2':'phase1':'idle';
  const key=[status,p.bossHealth,p.bossNodes?.join(''),boss?.phase].join(':');
  if(key!==bossReported){bossReported=key;onStatus?.({phase:status,health:p.bossHealth,maxHealth:MATRIX_HEALTH.boss,nodes:p.bossNodes,shieldOpen:Boolean(boss?.phase)});}
 }
 function dispose(){energySystem.dispose();graphics.dispose();for(const actor of actors.values())actor.mixer?.stopAllAction();for(const promise of loaderCache.values())promise.then(gltf=>disposeObjects([gltf.scene])).catch(()=>{});}
 return {root,obstacles,colliders,interactions,actors,getTargets,registerImpact,update,dispose,
  loadAssets:(loader,alive)=>{loaderRef=loader;aliveRef=alive;return ensureActor(actors.get('nex9')).then(()=>['nex9']);},
  applyTransform};
}





