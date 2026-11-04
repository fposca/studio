import * as THREE from "three";
import { PARTHENON_PROPS } from "./parthenonLayout.js";
import { HOPLITE_CONFIG } from "./parthenonCombatConfig.js";
import { createOrbGlowTexture, createPlasmaOrb } from "./neonOrbVisuals.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createTempleMaterials, templeBoxGeometry, buildTempleArchitecture, dressTempleMechanisms, createTempleLectern, createTempleUrn } from "./parthenonGraphics.js";
import { createParthenonAtmosphere } from "./parthenonAtmosphere.js";
import { createParthenonReturnPortal } from "./parthenonRelicVisuals.js";
import { createParthenonExpansion } from "./parthenonExpansion.js";

const STATUE_URL = new URL("../assets/neonboy-animaciones/estatua-reposo.glb", import.meta.url).href;
const WALK_URL = new URL("../assets/neonboy-animaciones/estatua-caminando.anim.glb", import.meta.url).href;
const ATTACK_URL = new URL("../assets/neonboy-animaciones/estatua-ataque.anim.glb", import.meta.url).href;
const MEDUSA_URL = new URL("../assets/neonboy-animaciones/medusa-estatica.glb", import.meta.url).href;
const MEDUSA_WALK_URL = new URL("../assets/neonboy-animaciones/medusa-camina.anim.glb", import.meta.url).href;
const MEDUSA_ATTACK_URL = new URL("../assets/neonboy-animaciones/medusa-ataque.anim.glb", import.meta.url).href;
const ALTAR_URL = new URL("../assets/neonboy-animaciones/altar.optimized.glb", import.meta.url).href;


export function buildParthenon(scene, { onEvent, onDamage, onStatus } = {}) {
  const root = new THREE.Group(); root.name = "PUERTA 02 / El Partenón Maldito"; scene.add(root);
  const interactions = PARTHENON_PROPS.map(p => ({id:p.id,label:p.label,x:p.position[0],z:p.position[2],reach:p.reach}));
  const obstacles = [], colliders = [];
  const materials = createTempleMaterials();
  const { stone, dark, bronze } = materials;
  const magenta = new THREE.MeshBasicMaterial({color:0xc543ac,toneMapped:false});
  const cyan = new THREE.MeshBasicMaterial({color:0x8debf4,toneMapped:false});
  const glow = createOrbGlowTexture();
  function plaque(label, x, y, z, width = 1.8) {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0,0,0,128);
    gradient.addColorStop(0,"#30373a"); gradient.addColorStop(1,"#121a20");
    ctx.fillStyle=gradient; ctx.fillRect(0,0,512,128);
    ctx.strokeStyle="#9c865a";ctx.lineWidth=2;ctx.strokeRect(8,8,496,112);
    ctx.strokeStyle="#554c3c";ctx.lineWidth=1;ctx.strokeRect(15,15,482,98);
    for(let x=35;x<490;x+=24){ctx.fillStyle="#887552";ctx.fillRect(x,20,8,2);ctx.fillRect(x,106,8,2);}
    ctx.fillStyle="#ede1c2";ctx.font="bold 36px Georgia";
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,256,66,458);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const plate=new THREE.Group();plate.position.set(x,y,z);
    const backing=new THREE.Mesh(new THREE.BoxGeometry(width+.05,width/4+.05,.055),bronze);
    const faceMaterial=new THREE.MeshBasicMaterial({map:texture});
    for(const side of [-1,1]){
      const face=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),faceMaterial);
      face.position.z=side*.029;face.rotation.y=side<0?Math.PI:0;plate.add(face);
    }
    plate.add(backing);root.add(plate);
    return plate;
  }
  function box(name,w,h,d,x,y,z,mat=stone,collision=false) {
    const mesh = new THREE.Mesh(templeBoxGeometry(w,h,d,.02),mat);
    mesh.name=name; mesh.position.set(x,y,z);
    mesh.castShadow = h > .45; mesh.receiveShadow = true; root.add(mesh);
    if (collision) { obstacles.push({id:name,x,z,hx:w/2,hz:d/2}); colliders.push(mesh); }
    return mesh;
  }
  const { gates } = buildTempleArchitecture(root, materials, obstacles, colliders, magenta);
  function relief(label,x,z,color=magenta) {
    const base=box(label+" pedestal",1.2,.48,1.2,x,.24,z,stone,true);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.44,.5,1.25,10),stone);
    plinth.position.set(x,1.05,z); root.add(plinth);
    const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),stone);
    head.position.set(x,1.9,z); root.add(head);
    const orb=createPlasmaOrb({radius:.23,texture:glow});
    orb.root.position.set(x,2.45,z+.2); root.add(orb.root);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.38,.025,6,48),color);
    ring.position.copy(orb.root.position); root.add(ring);
    return {base,plinth,head,orb,ring,position:orb.root.position.clone(),active:false,flash:0};
  }
  const guardians=[[-5,-8.4,"owl"],[0,-8.4,"serpent"],[5,-8.4,"sun"]].map(([x,z,id])=>({id,...relief("guardián "+id,x,z)}));
  guardians.forEach(g => plaque(({owl:"LECHUZA",serpent:"SERPIENTE",sun:"SOL"})[g.id], g.position.x, 1.27, g.position.z + .68, 1.6));
  const seals=[[-5,-34,"time"],[0,-34,"gate"],[5,-34,"witness"]].map(([x,z,id])=>({id,...relief("sello "+id,x,z)}));
  seals.forEach(g => plaque(({time:"TIEMPO",gate:"PUERTA",witness:"TESTIGO"})[g.id], g.position.x, 1.27, g.position.z + .68, 1.6));
  const mirrors=[[-5,-18],[5,-18]].map(([x,z],index)=>{
    const mount=box("reflector "+(index+1),1.35,2.4,.32,x,1.35,z,dark,true);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(.5,48),materials.mirror);
    disc.position.set(x,1.45,z+.19); root.add(disc);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.52,.035,8,48),cyan);
    rim.position.copy(disc.position); root.add(rim);
    const beam=new THREE.Mesh(new THREE.TorusGeometry(.29,.014,6,40),magenta);
    beam.position.set(x,1.45,z+.21); root.add(beam);
    return {mount,disc,rim,beam,position:new THREE.Vector3(x,1.45,z),active:false};
  });
  const crystalMaterial=new THREE.MeshPhysicalMaterial({
    color:0x85d3dd,metalness:.25,roughness:.18,clearcoat:1,clearcoatRoughness:.1,
    emissive:0x276171,emissiveIntensity:.7,transparent:true,opacity:.67,depthWrite:false,flatShading:true,
  });
  const prism=new THREE.Mesh(new THREE.OctahedronGeometry(.47,1),crystalMaterial);
  const prismCore=createPlasmaOrb({radius:.16,texture:glow});prism.add(prismCore.root);
  const crystalEdges=new THREE.LineSegments(new THREE.EdgesGeometry(prism.geometry),
    new THREE.LineBasicMaterial({color:0xa3ebee,transparent:true,opacity:.42}));
  prism.add(crystalEdges);
  prism.position.set(5,1.45,-22); root.add(prism);
  const prismStand=box("receptor de reflejos",1.2,1.1,1.2,5,.55,-22,stone,true);
  const altarFallback=box("altar dimensional",2.3,1.1,1.65,0,.55,-36,stone,true);
  const altarSlot=new THREE.Group(); altarSlot.position.set(0,0,-36); root.add(altarSlot);
  const portalVisual = createParthenonReturnPortal(materials, glow);
  const portalInteraction = interactions.find(prop => prop.id === "returnPortal");
  const portal = portalVisual.root; portal.position.set(portalInteraction.x, 1.85, portalInteraction.z); root.add(portal);
  for(const side of [-1,1])obstacles.push({id:"portal frame",x:portal.position.x+side*1.15,z:portal.position.z,radius:.26});
  plaque("PUERTA 01 · REGRESO", portal.position.x, 3.94, portal.position.z, 2.3);
  for (const [label, x, z] of [
    ["INSCRIPCIÓN", 7, -3], ["REGISTRO", 8, -8],
    ["REFLECTORES", -8, -16], ["REGISTRO", -7, -23],
    ["SANTUARIO", 7, -30], ["ALTAR", 0, -36]
  ]) {
    const lectern=createTempleLectern(root, materials, x, z);
    obstacles.push({id:"lectern "+label,x,z:z-.25,hx:.83,hz:.43});
    lectern.traverse(object=>{if(object.isMesh)colliders.push(object);});
    plaque(label, x, 1.02, z + .16, 1.5);
  }
  const medusaSlot=new THREE.Group(); medusaSlot.position.set(8,0,-37.4); medusaSlot.rotation.y=0; root.add(medusaSlot);
  const medusaObstacle={id:"medusa",x:999,z:medusaSlot.position.z,radius:.55};obstacles.push(medusaObstacle);
  const medusaShadow=new THREE.Mesh(new THREE.ConeGeometry(.8,2.5,7),new THREE.MeshBasicMaterial({color:0x190c23,transparent:true,opacity:.7}));
  medusaShadow.position.y=1.3; medusaSlot.add(medusaShadow);
  const expansion = createParthenonExpansion(root, obstacles, colliders, medusaSlot, medusaObstacle, { onEvent, onDamage, onStatus });
  interactions.unshift(expansion.fragmentInteraction);
  const urn = createTempleUrn(root, materials);
  const urnObstacle={id:"urn",x:-7,z:5,radius:.43};obstacles.push(urnObstacle);
  const fighter=new THREE.Group();fighter.name="guardián petrificado";fighter.position.set(0,0,-3);root.add(fighter);
  const fighterObstacle={id:"guardian statue",x:0,z:-3,radius:.4};obstacles.push(fighterObstacle);
  const fighterVisual=new THREE.Group();fighter.add(fighterVisual);
  const fighterPlaceholder=new THREE.Group();fighterVisual.add(fighterPlaceholder);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.37,.44,1.15,12),stone);torso.position.y=1.08;fighterPlaceholder.add(torso);
  const helm=new THREE.Mesh(new THREE.SphereGeometry(.35,16,10),bronze);helm.position.y=1.94;fighterPlaceholder.add(helm);
  const shield=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,.13,32),bronze);shield.rotation.x=Math.PI/2;shield.position.set(-.53,1.15,.22);fighterPlaceholder.add(shield);
  const eyes=new THREE.Mesh(new THREE.BoxGeometry(.38,.055,.065),magenta);eyes.position.set(0,1.93,.32);fighterPlaceholder.add(eyes);
  const fighterLight=new THREE.PointLight(0xf044a8,2.3,3,2);fighterLight.position.y=1.8;fighter.add(fighterLight);
  const pedestal=box("pedestal de la estatua",1.55,.4,1.55,0,.2,-3,stone,true);
  dressTempleMechanisms(root, materials, { guardians, seals, mirrors, prismStand, pedestal, altarSlot });
  const atmosphere = createParthenonAtmosphere(scene, root, materials, glow);
  obstacles.push(...atmosphere.obstacles);
  let loaderRef=null,aliveRef=()=>false,medusaLoading=false,mixer=null,medusaMixer=null,medusaIdleAction=null,medusaWalkAction=null,medusaAttackAction=null,idleAction=null,walkAction=null,attackAction=null,walkBlend=0,hurtAge=0,attackClock=0,attackCooldown=0,enemyState="idle",wakeSent=false,medusaSent=false,medusaWalkBlend=0;
  const medusaStoneMaterial=new THREE.MeshStandardMaterial({color:0x918d91,roughness:.96,metalness:.02,side:THREE.DoubleSide});
  const medusaSurfaces=[];
  let medusaAwake=false;
  function setMedusaAwake(awake) {
    if(medusaAwake===awake)return;
    medusaAwake=awake;
    if(!awake){
      medusaWalkBlend=0;
      medusaIdleAction?.setEffectiveWeight(1);
      medusaWalkAction?.setEffectiveWeight(0);
      medusaAttackAction?.setEffectiveWeight(0);
    }
    medusaMixer?.setTime(0);
    for(const {mesh,material} of medusaSurfaces)mesh.material=awake?material:medusaStoneMaterial;
  }
  async function fitModel(loader,url,slot,height) {
    const gltf=await loader.loadAsync(url);
    if(!aliveRef()) {disposeObjects([gltf.scene]);return null;}
    const model=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(model);
    const size=bounds.getSize(new THREE.Vector3());
    const scale=height/Math.max(.001,size.y);
    model.scale.setScalar(scale);
    model.position.set(-bounds.getCenter(new THREE.Vector3()).x*scale,-bounds.min.y*scale,-bounds.getCenter(new THREE.Vector3()).z*scale);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    slot.add(model);
    return {gltf,model};
  }
  async function loadAssets(loader,isAlive,p) {
    loaderRef=loader;aliveRef=isAlive;expansion.setLoader(loader,fitModel,isAlive);
    const hopliteReady = p?.altarRead && p.cursedHopliteHealth > 0 ? expansion.ensureHoplite(loader,fitModel,isAlive) : Promise.resolve();
    const medusaReady = p?.reflectionPuzzleCompleted && !p.medusaBossDefeated ? ensureMedusa() : Promise.resolve();
    const loaded=[];
    try {
      const asset=await fitModel(loader,STATUE_URL,fighterVisual,2.25);
      if(asset){
        fighterPlaceholder.visible=false;loaded.push("estatua-reposo");
        if(asset.gltf.animations.length) {
          mixer=new THREE.AnimationMixer(asset.model);
          const idleClip=asset.gltf.animations[0];
          idleAction=mixer.clipAction(idleClip).play();
          const [walking,attacking]=await Promise.all([
            loader.loadAsync(WALK_URL).catch(()=>null),
            loader.loadAsync(ATTACK_URL).catch(()=>null),
          ]);
          if(aliveRef()){
            if(walking?.animations?.length){
              const walkClip=walking.animations[0].clone();
              const walkHips=walkClip.tracks.find(track=>/Hips\.position$/.test(track.name));
              const idleHips=idleClip.tracks.find(track=>/Hips\.position$/.test(track.name));
              if(walkHips&&idleHips){
                const heightOffset=idleHips.values[1]-walkHips.values[1];
                for(let index=1;index<walkHips.values.length;index+=3)walkHips.values[index]+=heightOffset;
              }
              walkAction=mixer.clipAction(walkClip).play();
              walkAction.setEffectiveWeight(0);
              loaded.push("estatua-caminando");
            }
            if(attacking?.animations?.length){
              const attackClip=attacking.animations[0];
              attackAction=mixer.clipAction(attackClip);
              attackAction.setLoop(THREE.LoopOnce,1);
              attackAction.clampWhenFinished=false;
              attackAction.setEffectiveWeight(0);
              attackAction.setEffectiveTimeScale(attackClip.duration/HOPLITE_CONFIG.windup);
            }
          }
          disposeObjects([walking?.scene,attacking?.scene].filter(Boolean));
        }
      }
    } catch {}
    try {
      const asset=await fitModel(loader,ALTAR_URL,altarSlot,1.55);
      if(asset){altarFallback.visible=false;loaded.push("altar");}
    } catch {}
    await Promise.all([hopliteReady,medusaReady]);
    return loaded;
  }
  async function ensureMedusa() {
    if(medusaLoading||!loaderRef)return;
    medusaLoading=true;
    try {
      const asset=await fitModel(loaderRef,MEDUSA_URL,medusaSlot,2.35);
      if(asset){
        medusaShadow.visible=false;
        asset.model.traverse(mesh=>{
          if(!mesh.isMesh)return;
          medusaSurfaces.push({mesh,material:mesh.material});
          mesh.material=medusaAwake?mesh.material:medusaStoneMaterial;
        });
        const idleClip=asset.gltf.animations.find(clip=>clip.name==="Long_Breathe_and_Look_Around")||asset.gltf.animations[0];
        if(idleClip){
          medusaMixer=new THREE.AnimationMixer(asset.model);
          medusaIdleAction=medusaMixer.clipAction(idleClip).play();
          medusaMixer.update(0);
          const baseHips=idleClip.tracks.find(track=>/Hips\.position$/.test(track.name));
          const [walkAsset,attackAsset]=await Promise.all([loaderRef.loadAsync(MEDUSA_WALK_URL).catch(()=>null),loaderRef.loadAsync(MEDUSA_ATTACK_URL).catch(()=>null)]);
          const prepare=(source,name)=>{
            const clip=source?.animations?.[0]?.clone();if(!clip)return null;clip.name=name;
            for(const track of clip.tracks)if(/Hips\.position$/.test(track.name)){
              const y=(baseHips?.values?.[1]??track.values[1]);
              for(let i=0;i<track.values.length;i+=3){track.values[i]=0;track.values[i+1]=y;track.values[i+2]=0;}
            }
            return clip;
          };
          if(aliveRef()){
            const walk=prepare(walkAsset,"Medusa camina");
            const attack=prepare(attackAsset,"Medusa ataca");
            if(walk){medusaWalkAction=medusaMixer.clipAction(walk).play();medusaWalkAction.setEffectiveWeight(0);}
            if(attack){medusaAttackAction=medusaMixer.clipAction(attack).play();medusaAttackAction.setEffectiveWeight(0);}
          }
          disposeObjects([walkAsset?.scene,attackAsset?.scene].filter(Boolean));
        }
      } else medusaLoading=false;
    } catch {medusaLoading=false;}
  }
  const targetNormal=new THREE.Vector3(Math.SQRT1_2,0,Math.SQRT1_2);
  function getTargets(p) {
    if(!p?.entered)return [];
    const targets=[];
    if(!p.urnBroken)targets.push({kind:"parthenon-destructible",position:new THREE.Vector3(-7,.65,5),radius:.48});
    if(p.hopliteAwake&&p.hopliteHealth>0&&hurtAge<=0)targets.push({kind:"parthenon-enemy",position:new THREE.Vector3(fighter.position.x,1.3,fighter.position.z),radius:.75});
    if(p.hopliteHealth===0&&p.guardianClueSeen&&!p.guardianPuzzleCompleted)
      for(const g of guardians)targets.push({kind:"parthenon-guardian",id:g.id,position:g.position,radius:.45});
    if(p.guardianPuzzleCompleted&&!p.reflectionPuzzleCompleted){
      mirrors.forEach((mirror,index)=>targets.push({kind:"parthenon-mirror",index,position:mirror.position,radius:.62,reflect:p.mirrors.every(Boolean),normal:targetNormal}));
      if(p.mirrors.every(Boolean))targets.push({kind:"parthenon-reflection",position:prism.position,radius:.56});
    }
    if(p.reflectionPuzzleCompleted&&p.sealClues.length===3&&!p.templeSealsCompleted)
      for(const seal of seals)targets.push({kind:"parthenon-seal",id:seal.id,position:seal.position,radius:.46});
    targets.push(...expansion.getTargets(p));
    return targets;
  }
  function registerImpact(target) {
    expansion.registerImpact(target);
    if(target.kind==="parthenon-enemy"){hurtAge=HOPLITE_CONFIG.hurtTime;enemyState="hurt";fighterLight.intensity=7;}
    if(target.kind==="parthenon-guardian")guardians.find(g=>g.id===target.id).flash=.65;
    if(target.kind==="parthenon-seal")seals.find(g=>g.id===target.id).flash=.65;
    if(target.kind==="parthenon-mirror")mirrors[target.index].beam.scale.setScalar(1.25);
  }
  function update(dt,elapsed,p,player,paused=false,camera=null,reducedMotion=false) {
    const activeDt=paused?0:Math.min(dt,.05);
    atmosphere.update(activeDt,reducedMotion,paused,camera,player);
    portalVisual.update(activeDt,reducedMotion);
    const gateStates=[p?.guardianPuzzleCompleted,p?.reflectionPuzzleCompleted];
    gates.forEach((gate,index)=>{const open=Boolean(gateStates[index]);gate.slab.visible=!open;gate.bars.forEach(bar=>bar.visible=!open);gate.obstacle.x=open?999:0;const at=colliders.indexOf(gate.slab);if(open&&at>=0)colliders.splice(at,1);else if(!open&&at<0)colliders.push(gate.slab);});
    guardians.forEach((g,index)=>{
      const activated=Boolean(p?.guardianSequence.includes(g.id)||p?.guardianPuzzleCompleted);
      g.orb.setActive(activated);g.orb.update(elapsed,activated?1:.6);
      g.ring.material=activated?cyan:magenta;
      g.flash=Math.max(0,g.flash-activeDt);g.ring.scale.setScalar(1+g.flash*.7);
    });
    seals.forEach(g=>{
      const activated=Boolean(p?.sealSequence.includes(g.id)||p?.templeSealsCompleted);
      g.orb.setActive(activated);g.orb.update(elapsed,activated?1:.5);
      g.ring.material=activated?cyan:magenta;
      g.flash=Math.max(0,g.flash-activeDt);g.ring.scale.setScalar(1+g.flash*.7);
    });
    mirrors.forEach((mirror,i)=>{
      mirror.active=Boolean(p?.mirrors?.[i]);
      mirror.beam.material=mirror.active?cyan:magenta;
      mirror.beam.rotation.z+=activeDt*.45;
      mirror.beam.scale.lerp(new THREE.Vector3(1,1,1),Math.min(1,activeDt*5));
    });
    prism.visible=Boolean(p?.guardianPuzzleCompleted);
    prism.rotation.y+=activeDt*.6;
    prismCore.setActive(Boolean(p?.reflectionPuzzleCompleted));
    prismCore.update(elapsed,.8);
    urn.visible=Boolean(p?.entered)&&!p.urnBroken;
    urnObstacle.x=urn.visible?-7:999;
    fighter.visible=Boolean(p?.entered)&&p.hopliteHealth>0;
    fighterLight.color.set(hurtAge>0?0x8ef5ff:0xf044a8);
    fighterLight.intensity=hurtAge>0?6:2.3;
    hurtAge=Math.max(0,hurtAge-activeDt);
    if(fighter.visible&&!paused){
      const distance=Math.hypot(player.x-fighter.position.x,player.z-fighter.position.z);
      if(!p.hopliteAwake&&distance<6&&!wakeSent){wakeSent=true;onEvent?.("wake");}
      if(p.hopliteAwake){
        if(hurtAge>0){enemyState="hurt";fighterVisual.rotation.x=0;fighter.position.x-=Math.sin(fighter.rotation.y)*activeDt*.6;fighter.position.z-=Math.cos(fighter.rotation.y)*activeDt*.6;}
        else {
          attackCooldown=Math.max(0,attackCooldown-activeDt);
          if(attackClock>0){
            attackClock-=activeDt;enemyState="attack";
            fighterVisual.rotation.x=-Math.sin((1-attackClock/HOPLITE_CONFIG.windup)*Math.PI)*.15;
            if(attackClock<=0){
              if(distance<HOPLITE_CONFIG.attackRange+.28)onDamage?.(HOPLITE_CONFIG.attackDamage);
              attackCooldown=HOPLITE_CONFIG.recovery;
              fighterVisual.rotation.x=0;
            }
          } else if(distance<HOPLITE_CONFIG.attackRange&&attackCooldown<=0){
            enemyState="attack";attackClock=HOPLITE_CONFIG.windup;
            attackAction?.reset().play();
          } else if(distance<HOPLITE_CONFIG.detectRange&&distance>HOPLITE_CONFIG.attackRange){
            enemyState="chase";
            const dx=(player.x-fighter.position.x)/distance,dz=(player.z-fighter.position.z)/distance;
            const nx=fighter.position.x+dx*HOPLITE_CONFIG.speed*activeDt,nz=fighter.position.z+dz*HOPLITE_CONFIG.speed*activeDt;
            if(Math.abs(nx)<9&&nz>-9.5&&nz<2.5&&!obstacles.some(o=>o.id==="columna"&&Math.hypot(o.x-nx,o.z-nz)<1.05)){fighter.position.x=nx;fighter.position.z=nz;}
          } else enemyState=distance<HOPLITE_CONFIG.detectRange?"alert":"idle";
        }
        fighter.rotation.y=Math.atan2(player.x-fighter.position.x,player.z-fighter.position.z);
      }
    } else if(!fighter.visible) enemyState="defeated";
    fighterObstacle.x=fighter.visible?fighter.position.x:999;
    fighterObstacle.z=fighter.position.z;
    if(mixer&&fighter.visible){
      walkBlend=THREE.MathUtils.damp(walkBlend,enemyState==="chase"?1:0,9,activeDt);
      const attacking=enemyState==="attack"&&attackClock>0&&Boolean(attackAction);
      const walkWeight=walkAction?walkBlend:0;
      idleAction?.setEffectiveWeight(attacking?0:1-walkWeight);
      walkAction?.setEffectiveWeight(attacking?0:walkWeight);
      attackAction?.setEffectiveWeight(attacking?1:0);
      mixer.update(activeDt);
    }
    medusaSlot.visible=Boolean(p?.reflectionPuzzleCompleted);
    medusaObstacle.x=medusaSlot.visible?medusaSlot.position.x:999;
    if(medusaSlot.visible&&!p.medusaBossDefeated&&player.z<-18)void ensureMedusa();
    if(medusaSlot.visible&&player.z<-31&&!p.medusaFirstEncounterSeen&&!medusaSent){medusaSent=true;onEvent?.("medusa-seen");}
    expansion.update(dt,elapsed,p,player,paused,camera,reducedMotion);
    const bossState=expansion.getStatus();
    // The first camera shot presents her as a statue; she wakes when it cuts to Medusa.
    const medusaShouldWake=bossState.phase==="active"||bossState.phase==="victory"||
      (bossState.phase==="intro"&&bossState.introAge>=2.7);
    setMedusaAwake(medusaShouldWake);
    if(medusaAwake&&medusaSlot.visible){
      const medusaWalkTarget=medusaWalkAction&&bossState.phase==="active"&&bossState.moving ? .92 : 0;
      medusaWalkBlend=THREE.MathUtils.damp(medusaWalkBlend,medusaWalkTarget,8,activeDt);
      const medusaAttackWeight=medusaAttackAction&&bossState.phase==="active"&&bossState.cycle==="gaze" ? .85 : 0;
      const medusaWalkWeight=Math.min(medusaWalkBlend,1-medusaAttackWeight);
      medusaIdleAction?.setEffectiveWeight(Math.max(0,1-medusaWalkWeight-medusaAttackWeight));
      medusaWalkAction?.setEffectiveWeight(medusaWalkWeight);
      medusaAttackAction?.setEffectiveWeight(medusaAttackWeight);
      medusaMixer?.update(activeDt);
    }
    atmosphere.setBossMood(bossState.phase === "intro" ? Math.min(.7,bossState.introAge/6) : bossState.phase === "active" ? bossState.phaseNumber === 3 ? 1 : .55 : bossState.phase === "victory" ? Math.max(0,1-bossState.victoryAge/3.4) : 0);
  }
  return {root,obstacles,colliders,interactions,getTargets,registerImpact,update,loadAssets,
    getEnemyState:()=>enemyState,getBossStatus:expansion.getStatus,startBoss:expansion.startBoss,resetBoss:expansion.resetBoss,locksPlayer:expansion.locksPlayer,applyTransform:expansion.applyTransform,
    stopAnimations:()=>{mixer?.stopAllAction();medusaMixer?.stopAllAction();expansion.stopAnimations();},dispose:()=>{
      for(const {mesh,material} of medusaSurfaces)mesh.material=material;
      medusaStoneMaterial.dispose();
      expansion.dispose();atmosphere.dispose();
    }};
}



