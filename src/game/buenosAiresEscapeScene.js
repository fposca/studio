import { createEscapeAudio } from "./buenosAiresEscapeAudio.js";
import { createTimeTunnel, createTunnelBackdrop } from "./buenosAiresTimeTunnel.js";
import * as THREE from 'three';
import { createEscapeEffects } from './buenosAiresEscapeEffects.js';
import { canStartEscape, createEscapeState, stepEscape, pulseEscape, escapeRoute, escapeStage,
  escapeCaption, ESCAPE_DURATION, ESCAPE_JUMP_START } from './buenosAiresEscapeLogic.js';

// Called by RecordStoreScene's existing animation loop. Borrows the actual Fuego
// and actual actors; the Meshy car has no usable seated interior, so passengers
// are occluded inside its shell, with exterior cameras only.
export function createBuenosAiresEscape({ city, camera, player, getCharacter, getProgress, onEvent, onState, reducedMotion = false }) {
  const audio = createEscapeAudio();
  const root = new THREE.Group(); root.name = 'Fuga de la Red / efectos'; city.root.add(root); root.visible = false;
  const resources = new Set(), own = r => (resources.add(r), r);
  const material = (color, opacity = 1) => own(new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity,
    depthWrite: opacity === 1, toneMapped: false, side: THREE.DoubleSide }));
  const cyan = material(0x73efff);
  const ring = own(new THREE.TorusGeometry(1, .025, 4, 48));
  function mesh(geometry, mat, parent, x=0,y=0,z=0,sx=1,sy=1,sz=1) {
    const m = new THREE.Mesh(geometry, mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.userData.cityKeep = true;
    m.castShadow = false; parent.add(m); return m;
  }
  const effects = createEscapeEffects(root, { reducedMotion });
  const obeliskMat = material(0x64edff,.5), obeliskRing = mesh(ring,obeliskMat,root,0,1,-5,15,15,15); obeliskRing.rotation.x = Math.PI/2;
  const filaments = new THREE.Group(); root.add(filaments);
  const lineMat = own(new THREE.LineBasicMaterial({color:0x8e6eff, transparent:true, opacity:.28, depthWrite:false}));
  for (const x of [-38,38]) for (const z of [-50,-25,5,35]) {
    const geo = own(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,12,z),new THREE.Vector3(x*.55,19,z*.5),new THREE.Vector3(0,28,-5)]));
    filaments.add(new THREE.Line(geo,lineMat));
  }
  const tunnel = createTimeTunnel(root, { reducedMotion });
  const backdrop = createTunnelBackdrop(city.root, [root, city.flyingVehicles.fuego]);
  let pendingRetry = false, boardingAge = 0, ownsVehicle = false;
  let state = null, disposed=false, snapshotAge=0, alertSent=false, originSent=false, completeSent=false, lastSnapshot='', suspended=false;
  const touch = {horizontal:0,vertical:0}, passengers = [], cameraPosition = new THREE.Vector3(), aim = new THREE.Vector3(), cameraAim = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const savedCamera = {position:new THREE.Vector3(),quaternion:new THREE.Quaternion(),fov:63};
  const hold = new THREE.Group(); hold.name='Pasajeros / interior ocluido';
  function board() {
    const car=city.flyingVehicles.fuego;
    car.add(hold);
    const actors=[getCharacter()?.root,city.actors.actors.find(a=>a.config.id==='ba-disconnected')?.root].filter(Boolean);
    actors.forEach((actor,i)=>{
      passengers.push({actor,parent:actor.parent,position:actor.position.clone(),quaternion:actor.quaternion.clone(),visible:actor.visible});
      hold.add(actor); actor.position.set(i? .4:-.4,-.65,.05); actor.visible=false;
    });
    city.actors.setBoarded('ba-disconnected',true);
  }
  function restore() {
    backdrop.restore();
    city.actors.preparePassenger("ba-disconnected", false);
    if (!ownsVehicle) return;
    ownsVehicle = false;
    for(const p of passengers){p.parent.add(p.actor);p.actor.position.copy(p.position);p.actor.quaternion.copy(p.quaternion);p.actor.visible=p.visible;}
    passengers.length=0; hold.removeFromParent(); city.actors.setBoarded('ba-disconnected',false);
    city.flyingVehicles.releaseFlight(); city.setFlightActive(false);
    camera.position.copy(savedCamera.position);camera.quaternion.copy(savedCamera.quaternion);camera.fov=savedCamera.fov;camera.updateProjectionMatrix();
  }
  function publish(force=false) {
    if(!state) { onState?.(null); return; }
    const caption=escapeCaption(state.time), barrier=state.barriers.find(b=>b.due>state.time);
    const snapshot={status:state.status,stage:escapeStage(state.time),integrity:state.integrity,
      progress:Math.floor(state.time/ESCAPE_DURATION*100),cooldown:Math.ceil(state.cooldown),
      caption, warning:barrier? (barrier.side>0?'IZQUIERDA':'DERECHA'):'',
      archive:state.time>=132&&state.time<164, timeJump:state.time>=164,
      fade:Math.round(THREE.MathUtils.smoothstep(state.time,177,180)*10)/10,
      hit:state.invulnerable>.9,lastDamage:state.lastDamage, passengers:passengers.length};
    const value=JSON.stringify(snapshot);if(force||value!==lastSnapshot){lastSnapshot=value;onState?.(snapshot);}
  }
  function begin(retry=false) {
    if(disposed || Math.hypot(player.x-city.flyingVehicles.escapeParking.x,player.z-city.flyingVehicles.escapeParking.z)>6 || !canStartEscape(getProgress()) || !city.flyingVehicles.escapeReady || !getCharacter()?.root || !city.actors.actors.find(a=>a.config.id==='ba-disconnected')?.model) return false;
    if(state){restore();state=null;}
    savedCamera.position.copy(camera.position);savedCamera.quaternion.copy(camera.quaternion);savedCamera.fov=camera.fov;
    if(!city.flyingVehicles.claimFlight())return false;
    ownsVehicle = true; board(); city.setFlightActive(true); state=createEscapeState(city.qualityTier,retry);
    effects.reset(); audio.reset(); root.visible=true; alertSent=false;originSent=false;completeSent=false;snapshotAge=0;lastSnapshot='';
    cameraAim.copy(city.flyingVehicles.fuego.position);touch.horizontal=touch.vertical=0;
    onEvent?.('fuego-flight-start');publish(true);return true;
  }
  function start(retry=false) {
    if (disposed || !canStartEscape(getProgress()) || Math.hypot(player.x-city.flyingVehicles.escapeParking.x,player.z-city.flyingVehicles.escapeParking.z)>6) return false;
    if (state) cancel();
    audio.unlock();
    if (city.actors.preparePassenger('ba-disconnected') && city.flyingVehicles.escapeReady && getCharacter()?.root) return begin(retry);
    pendingRetry=retry;boardingAge=0;state=createEscapeState(city.qualityTier);state.status='boarding';publish(true);return true;
  }
  function cancel() {
    if(!state)return;audio.stop();restore();state=null;root.visible=false;touch.horizontal=touch.vertical=0;publish(true);
  }
  function pulse() {
    if(!state||suspended||!pulseEscape(state))return false;
    effects.triggerPulse(city.flyingVehicles.fuego.position);audio.sync(state);publish(true);return true;
  }
  function update(dt, keys, paused) {
    if(!state||disposed)return;
    suspended=paused||document.hidden; audio.setPaused(suspended);
    if (state.status === 'boarding') {
      if (!suspended) boardingAge += Math.min(Math.max(dt, 0), .05);
      if (city.actors.preparePassenger('ba-disconnected') && city.flyingVehicles.escapeReady && getCharacter()?.root) { begin(pendingRetry); return; }
      if (boardingAge > 45) { state.status='load-error'; publish(true); }
      return;
    }
    if (state.status === 'load-error') return;
    const step=suspended?0:Math.min(Math.max(dt,0),.05);
    state.tier=city.qualityTier;
    const horizontal=touch.horizontal+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const vertical=touch.vertical+Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    stepEscape(state,step,{horizontal,vertical});
    audio.sync(state);
    const pose=escapeRoute(state.time,state.lateral,state.vertical), car=city.flyingVehicles.fuego;
    car.position.set(pose.x,pose.y,pose.z); car.rotation.order='YXZ';
    const yawDelta = Math.atan2(Math.sin(pose.yaw-car.rotation.y),Math.cos(pose.yaw-car.rotation.y));
    car.rotation.y += yawDelta * (1-Math.exp(-9*step)); car.rotation.x=0;
    car.rotation.z=THREE.MathUtils.damp(car.rotation.z,reducedMotion?0:THREE.MathUtils.clamp(horizontal,-1,1)*.14,8,step);
    if(state.time<3&&!reducedMotion)car.position.y+=Math.sin(state.time*36)*.012;
    car.visible=true;
    passengers.forEach(({actor},i)=>{actor.visible=false;actor.position.set(i ? .4 : -.4,-.65,.05);actor.quaternion.identity();});
    forward.set(Math.sin(pose.yaw),0,Math.cos(pose.yaw));
    if(state.time<9){cameraPosition.set(-14+state.time*.32,4.8+state.time*.2,31);aim.set(-3,4,-1);}
    else {cameraPosition.copy(car.position).addScaledVector(forward,-9.5);cameraPosition.y+=3.2;aim.copy(car.position).addScaledVector(forward,8);aim.y+=.7;}
    // Exponential damping; no fixed-step teleport or competing ground camera.
    const blend=1-Math.exp(-(state.time<9?1.2:5)*step);
    camera.position.lerp(cameraPosition,blend);cameraAim.lerp(aim,blend);camera.lookAt(cameraAim);
    effects.update(state,car);
    const alert=state.time>=9&&state.time<33;
    obeliskRing.visible=alert||(state.time>=132&&state.time<ESCAPE_JUMP_START);obeliskRing.position.y=2+(state.time*.7%1)*50;obeliskMat.opacity=reducedMotion?.2:.25+.15*Math.sin(state.time*1.2)**2;
    filaments.visible=alert||(state.time>=132&&state.time<ESCAPE_JUMP_START);
    tunnel.update(state,camera);
    if(state.time>=ESCAPE_JUMP_START+2.1)backdrop.hide();
    if(!alertSent&&state.time>=9){alertSent=true;city.flyingVehicles.triggerTrafficPulse();city.triggerFlightAlert();}
    if(!originSent&&state.time>=132){originSent=true;onEvent?.('fuego-origin-recovered');}
    if(!completeSent&&state.status==='complete'){completeSent=true;onEvent?.('fuego-flight-complete');}
    snapshotAge+=step;if(snapshotAge>=.2||state.status!=='playing'){snapshotAge=0;publish();}
  }
  return {start,retry:()=>start(true),cancel,pulse,update,input(axis,value){touch[axis]=value;},
    clearInput(){touch.horizontal=touch.vertical=0;},get active(){return !!state;},get state(){return state;},get audioStats(){return audio.stats;},get tunnelStats(){return {...tunnel.stats,cityHidden:backdrop.active};},
    dispose(){if(disposed)return;cancel();audio.dispose();effects.dispose();tunnel.dispose();disposed=true;root.removeFromParent();resources.forEach(r=>r.dispose());},
  };
}
