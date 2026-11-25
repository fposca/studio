import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { disposeObjects } from "./disposeGameObjects.js";
import { createOrbGlowTexture, createPlasmaOrb } from "./neonOrbVisuals.js";
import { VIGILANTE_ARENA, VIGILANTE_NODES, VIGILANTE_CHECKPOINT, inVigilanteArena,
  vigilanteShielded, createVigilanteCombatState, vigilanteAction, clearVigilanteProjectiles,
  moveVigilante, stepVigilanteCombat } from "./buenosAiresVigilanteCombat.js";

const MODEL = new URL("../assets/neonboy-animaciones/bsas/vigilante.mobile.glb", import.meta.url).href;
const CLIPS = {
  walk: new URL("../assets/neonboy-animaciones/bsas/vigilante-camina.anim.glb", import.meta.url).href,
  ranged: new URL("../assets/neonboy-animaciones/bsas/vigilante-ataca.anim.glb", import.meta.url).href,
  melee: new URL("../assets/neonboy-animaciones/bsas/vigilante-golpea.anim.glb", import.meta.url).href,
  hurt: new URL("../assets/neonboy-animaciones/bsas/vigilante-dano.anim.glb", import.meta.url).href,
  death: new URL("../assets/neonboy-animaciones/bsas/vigilante-muerte.anim.glb", import.meta.url).href,
};
export function createBuenosAiresVigilante(parent, { onEvent, onDamage, canOccupy = () => true, tier = "high", codeVision } = {}) {
  const root = new THREE.Group(); root.name = "Vigilante de la Red / encuentro unico"; parent.add(root);
  const body = new THREE.Group(); body.name = "Vigilante / cuerpo"; body.visible = false; root.add(body);
  const s = createVigilanteCombatState(), actions = {}, loaded = [], flashMaterials = [];
  let model, mixer, playing, loadPromise, disposed = false, currentTier = tier;
  let encounter = false, approachAge = 0, introSent = false, phaseSent = false, deathSent = false;
  let deathAge = 0, clock = 0, flash = 0, interference = false, engaged = false;
  const glow = createOrbGlowTexture(), projectileGeometry = new THREE.SphereGeometry(.18, 12, 8);
  const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff389f, toneMapped: false });
  const projectileHalo = new THREE.SpriteMaterial({ map: glow, color: 0xff258e, opacity: .42,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const projectiles = s.projectiles.map(() => {
    const group = new THREE.Group(); group.visible = false; root.add(group);
    group.add(new THREE.Mesh(projectileGeometry, projectileMaterial));
    const halo = new THREE.Sprite(projectileHalo); halo.scale.setScalar(.9); group.add(halo);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: 0xff77c5, transparent: true, opacity: .65 }));
    line.frustumCulled = false; line.visible = false; root.add(line);
    return { group, line };
  });
  const shader = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, hit: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    vertexShader: `varying vec3 n; varying vec3 v; varying vec3 p;
      void main(){vec4 w=modelMatrix*vec4(position,1.);n=normalize(mat3(modelMatrix)*normal);v=cameraPosition-w.xyz;p=position;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float time; uniform float hit; varying vec3 n; varying vec3 v; varying vec3 p;
      void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),2.);
        float scan=pow(.5+.5*sin(p.y*22.-time*3.),18.);
        gl_FragColor=vec4(.95,.06,.47,(rim*.45+scan*.07+hit*.15));}`,
  });
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), shader);
  shield.name = "Vigilante / escudo de la Red"; shield.position.y = 1.2; shield.scale.set(1.1,1.6,1.1); shield.visible = false; body.add(shield);
  const chest = createPlasmaOrb({ radius: .14, texture: glow, phase: 1 });
  chest.root.position.set(0,1.5,.33); chest.setPalette({ accent: 0xff559d, deep: 0x2b1230, glow: 0xff56a9, arc: 0xffbbdf }); body.add(chest.root);
  const visor = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff5caf,
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  visor.name = "Vigilante / destellos del visor"; visor.position.set(0,2.12,.22); visor.scale.set(.65,.20,1); body.add(visor);
  const nodes = VIGILANTE_NODES.map((node,i) => {
    const energy=createPlasmaOrb({radius:.36,texture:glow,phase:i*2});
    energy.setPalette({accent:0xe8b5ff,deep:0x201832,glow:0xe061f5,arc:0xffdbff});
    energy.root.name="Vigilante / nodo digital / "+node.id; energy.root.position.set(node.x,1.32,node.z);energy.root.visible=false;root.add(energy.root);
    return {...node,energy,position:energy.root.position,radius:.85};
  });
  const a=VIGILANTE_ARENA;
  const boundary=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(a.minX,.06,a.minZ),new THREE.Vector3(a.maxX,.06,a.minZ),
    new THREE.Vector3(a.maxX,.06,a.maxZ),new THREE.Vector3(a.minX,.06,a.maxZ)]),
    new THREE.LineBasicMaterial({color:0xf45ab7,transparent:true,opacity:.55}));
  boundary.name="Vigilante / perimetro de contencion";boundary.visible=false;root.add(boundary);
  const targetPosition=new THREE.Vector3();
  function play(name) {
    if(!mixer || playing===name || !actions[name])return;
    const previous=actions[playing],next=actions[name];
    next.reset().setEffectiveTimeScale(name==="ranged"?next.getClip().duration/2.4:name==="hurt"?next.getClip().duration/.55:1).play();
    if(previous)previous.crossFadeTo(next,.16,false);
    playing=name;
  }
  async function loadAssets() {
    if(loadPromise)return loadPromise;
    loadPromise=(async()=>{
      const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const base=await loader.loadAsync(MODEL);
      if(disposed){disposeObjects([base.scene]);return false;}
      model=base.scene; model.name="Vigilante / Meshy optimizado";
      const bounds=new THREE.Box3().setFromObject(model),scale=2.35/(bounds.max.y-bounds.min.y);
      const pivot=new THREE.Group();pivot.scale.setScalar(scale);model.position.y-=bounds.min.y;pivot.add(model);body.add(pivot);
      model.traverse(o=>{if(o.isMesh){o.castShadow=currentTier!=="low";o.receiveShadow=true;}});
      codeVision?.register(model,"dynamic");
      mixer=new THREE.AnimationMixer(model);
      const all={idle:base.animations[0]};loaded.push("respira");
      for(const [name,url] of Object.entries(CLIPS)){
        const asset=await loader.loadAsync(url);
        if(disposed){disposeObjects([asset.scene]);return false;}
        all[name]=asset.animations[0];disposeObjects([asset.scene]);loaded.push(name);
      }
      const names=new Set();model.traverse(o=>names.add(o.name));
      for(const [name,source] of Object.entries(all)){
        if(!source)throw new Error("Falta clip del Vigilante: "+name);
        const clip=source.clone();clip.name="Vigilante / "+name;
        for(const track of clip.tracks){
          if(!names.has(track.name.split(".")[0]))throw new Error("Hueso incompatible: "+track.name);
          if(name!=="death" && /Hips\.position$/.test(track.name))
            for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}
        }
        const action=mixer.clipAction(clip);actions[name]=action;
        if(!["idle","walk"].includes(name)){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
      }
      play("idle");mixer.update(0);body.updateMatrixWorld(true);
      // Keep the energy attached to the animated skeleton, including the fall.
      const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o);});
      bones.find(o=>/Spine2$/.test(o.name))?.attach(chest.root);
      bones.find(o=>/Head$/.test(o.name))?.attach(visor);
      const materials=new Set();model.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.emissive)materials.add(m);});
      materials.forEach(material=>flashMaterials.push({material,color:material.emissive.clone(),intensity:material.emissiveIntensity}));
      return true;
    })().catch(error=>{if(!disposed){console.warn("Vigilante:",error);onEvent?.("vigilante-load-error");}return false;});
    return loadPromise;
  }
  function getTargets(p) {
    if(!engaged || !p?.vigilanteStarted || p.vigilanteHealth<=0 || p.vigilanteDefeated)return [];
    targetPosition.set(s.x,1.2,s.z);
    const targets=[{id:"ba-vigilante",kind:"vigilante",position:targetPosition,radius:1.05}];
    if(vigilanteShielded(p)&&p.visionActive)for(const n of nodes)if(!p.vigilanteNodes.includes(n.id))
      targets.push({id:"ba-vigilante-node-"+n.id,kind:"vigilante-node",nodeId:n.id,position:n.position,radius:n.radius});
    return targets;
  }
  function registerImpact(target,p) {
    if(target.returning||!engaged||!p?.vigilanteStarted||p.vigilanteHealth<=0)return;
    if(target.kind==="vigilante-node"){
      if(vigilanteShielded(p)&&p.visionActive)onEvent?.("vigilante-node:"+target.nodeId);return;
    }
    if(target.kind!=="vigilante")return;
    flash=1;
    if(vigilanteShielded(p)){onEvent?.("vigilante-blocked");return;}
    if(s.invulnerable>0)return;
    s.invulnerable=.85;vigilanteAction(s,"hurt");onEvent?.("vigilante-hit");
  }
  function update(dt,p,player,paused,fallen,reducedMotion=false) {
    if(disposed)return;
    const step=paused||fallen?0:Math.min(Math.max(dt,0),.05);
    if(!reducedMotion)clock+=step;
    if(p?.coreComplete&&!p.vigilanteDefeated)void loadAssets();
    engaged=Boolean(p?.vigilanteEncountered&&!p.vigilanteDefeated);
    if(p?.vigilanteDefeated){
      body.visible=false;clearVigilanteProjectiles(s);
    } else if(p?.synchronizationSeen&&model&&actions.death) {
      if(!encounter && (p.vigilanteEncountered||inVigilanteArena(player.x,player.z,2)) && !paused&&!fallen){
        const spots=[{x:player.x>=0?-9:9,z:18},{x:player.x>=0?-9:9,z:22}];
        const spot=spots.find(v=>canOccupy(v.x,v.z)&&Math.hypot(v.x-player.x,v.z-player.z)>4);
        if(spot){s.x=spot.x;s.z=spot.z;encounter=true;introSent=Boolean(p.vigilanteStarted);onEvent?.("vigilante-encounter");}
      }
      body.visible=encounter;
      if(encounter&&!p.vigilanteStarted){
        if(step&&!introSent){approachAge+=step;const moved=moveVigilante(s,player,1.25,step,canOccupy);s.yaw=Math.atan2(player.x-s.x,player.z-s.z);play(moved?"walk":"idle");}
        if(approachAge>=3&&(Math.hypot(s.x-player.x,s.z-player.z)<4.2||approachAge>=8)&&!introSent&&!fallen){introSent=true;play("idle");onEvent?.("vigilante-intro-dialogue");}
      } else if(encounter&&p.vigilanteHealth<=0){
        clearVigilanteProjectiles(s);play("death");deathAge+=step;
        if(deathAge>actions.death.getClip().duration+.2&&!deathSent&&!fallen){deathSent=true;onEvent?.("vigilante-defeat-dialogue");}
      } else if(encounter&&p.vigilanteStarted){
        if(p.vigilanteHealth<=4&&!p.vigilantePhaseSeen&&!phaseSent&&!paused&&!fallen){
          phaseSent=true;clearVigilanteProjectiles(s);onEvent?.("vigilante-phase-dialogue");
        } else stepVigilanteCombat(s,step,{player,health:p.vigilanteHealth,canOccupy,onDamage,paused:paused||fallen});
        play(s.action);
      }
    }
    if(fallen)clearVigilanteProjectiles(s);
    body.position.set(s.x,0,s.z);body.rotation.y=s.yaw;
    if(mixer && body.visible)mixer.update(step);
    flash=Math.max(0,flash-step*3);shader.uniforms.time.value=clock;shader.uniforms.hit.value=flash;
    shield.visible=body.visible&&vigilanteShielded(p);chest.root.visible=body.visible&&p?.vigilanteStarted;
    chest.update(clock,deathAge>0?Math.max(0,1-deathAge/3):.7+flash);
    chest.halo.visible=currentTier!=="low";
    for(const {material,color,intensity} of flashMaterials){
      material.emissive.copy(color).lerp(projectileMaterial.color,flash*.6);
      material.emissiveIntensity=intensity+flash*.8;
    }
    visor.material.opacity=deathAge>0 ? Math.max(0,1-deathAge/3.5)*(.2+.65*Math.sin(deathAge*19)**8) : 0;
    boundary.visible=engaged;
    const nextInterference=Boolean(engaged&&p?.vigilanteHealth>0&&p.vigilanteHealth<=4&&s.elapsed%9>7.9&&!fallen);
    if(interference!==nextInterference){interference=nextInterference;onEvent?.("vigilante-interference:"+(interference?"on":"off"));}
    for(const n of nodes){n.energy.root.visible=Boolean(engaged&&vigilanteShielded(p)&&p.visionActive&&!p.vigilanteNodes.includes(n.id));
      if(n.energy.root.visible)n.energy.update(clock,.8);n.energy.halo.visible=currentTier!=="low";}
    projectiles.forEach((visual,i)=>{
      const b=s.projectiles[i];visual.group.visible=visual.line.visible=b.active;
      if(b.active){visual.group.position.set(b.x,b.y,b.z);const pos=visual.line.geometry.attributes.position;
        pos.setXYZ(0,b.x,b.y,b.z);pos.setXYZ(1,b.x-b.vx*.10,b.y-b.vy*.10,b.z-b.vz*.10);pos.needsUpdate=true;}
    });
  }
  return {root,body,state:s,nodes,loadAssets,update,getTargets,registerImpact,
    get loaded(){return loaded;},get ready(){return Boolean(actions.death);},get animation(){return playing||"loading";},
    get arriving(){return encounter&&!introSent;},get effectTime(){return clock;},get engaged(){return engaged;},
    constrainPlayer(player){if(engaged&&!inVigilanteArena(player.x,player.z))Object.assign(player,VIGILANTE_CHECKPOINT,{y:0});},
    canStand(x,z,fromX,fromZ){
      if(!engaged)return true;
      if(!inVigilanteArena(x,z,.45))return false;
      const d=Math.hypot(x-s.x,z-s.z),before=Math.hypot(fromX-s.x,fromZ-s.z);
      return d>=1.25 || d>before;
    },
    applyQuality(next){currentTier=next;model?.traverse(o=>{if(o.isMesh)o.castShadow=next!=="low";});},
    dispose(){disposed=true;codeVision?.unregister(body);clearVigilanteProjectiles(s);mixer?.stopAllAction();if(model)mixer?.uncacheRoot(model);disposeObjects([root]);root.removeFromParent();glow.dispose();},
  };
}
