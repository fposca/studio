import test from 'node:test';
import * as THREE from 'three';
import { createEscapeEffects } from './buenosAiresEscapeEffects.js';
import assert from 'node:assert/strict';
import { createEscapeState, stepEscape, escapeRoute, escapeDroneRoute, pulseEscape, damageEscape, canStartEscape, ESCAPE_DURATION, ESCAPE_PROFILES, ESCAPE_BARRIER } from './buenosAiresEscapeLogic.js';
import { normalizeBuenosAiresProgress, advanceBuenosAires } from './buenosAiresQuest.js';
import { BUENOS_AIRES_BUILDINGS, OBELISK } from './buenosAiresLayout.js';
const ready={vigilanteDefeated:true,fuegoKeyInstalled:true,fuegoPowerCellInstalled:true,fuegoNavigationModuleInstalled:true,fuegoRecordShown:true};
function fly(s,dt=1/60,avoid=true){
  while(s.status==='playing'){
    const b=s.barriers.find(b=>b.due>s.time), next=b?-b.side*3:Math.sin(s.time*.9)*2.7;
    if(avoid&&s.bolts.some(b=>b.due-s.time<1.3))pulseEscape(s);
    stepEscape(s,dt,{horizontal:avoid?Math.sign(next-s.lateral):0,vertical:avoid?Math.cos(s.time)*.5:0});
  }return s;
}
test('flight requires all repairs, the archive and actual boss victory',()=>{
 assert.ok(canStartEscape(ready));for(const key of Object.keys(ready))assert.equal(canStartEscape({...ready,[key]:false}),false,key);
});
test('a passive pilot is intercepted; evasion and defense can finish all three profiles',()=>{
 const passive=fly(createEscapeState());assert.equal(passive.status,'complete');
 for(const tier of Object.keys(ESCAPE_PROFILES)){
  const lost=fly(createEscapeState(tier),1/60,false);assert.equal(lost.status,'failed');assert.equal(lost.integrity,0);
  const won=fly(createEscapeState(tier));assert.equal(won.status,'complete');assert.equal(won.time,ESCAPE_DURATION);assert.ok(won.integrity>0);
 }
});
test('flight is stable at 30, 60 and 120 fps; oversized and invalid delta cannot teleport',()=>{
 const results=[30,60,120].map(fps=>fly(createEscapeState(),1/fps));
 for(const s of results){assert.equal(s.status,'complete');assert.ok(s.integrity>=60);}
 const s=createEscapeState();stepEscape(s,100);assert.equal(s.time,.05);stepEscape(s,NaN);assert.equal(s.time,.05);
});
test('route and all lateral/vertical extremes clear buildings and the broadened Obelisk continuously',()=>{
 let previous=escapeRoute(0);
 for(let t=0;t<180;t+=.025){
  const center=escapeRoute(t);assert.ok(Math.hypot(center.x-previous.x,center.y-previous.y,center.z-previous.z)<.5,'continuous route');previous=center;
  for(const lateral of [-3.3,0,3.3])for(const vertical of [-2,2]){
   const p=escapeRoute(t,lateral,vertical);
   assert.ok(Math.abs(p.x)<35&&p.z>-76&&p.z<76,'inside city');
   assert.ok(Math.abs(p.x-OBELISK.x)>12.3+1.7 || Math.abs(p.z-OBELISK.z)>12.3+1.7,'Obelisk clearance');
   for(const b of BUENOS_AIRES_BUILDINGS) assert.ok(Math.abs(p.x-b.x)>b.hx+1.8 || Math.abs(p.z-b.z)>b.hz+1.8 || p.y>b.height+1,'building clearance');
   if(t>=16)assert.ok(p.y>=20.1,'above friendly ambient cars');
  }
 }
});
test('pulse has cooldown, bounded reach and cannot erase distant hazards; damage has invulnerability',()=>{
 const s=createEscapeState('low',true);s.bolts=[{due:17},{due:20}];assert.ok(pulseEscape(s));assert.equal(s.bolts.length,1);assert.equal(s.bolts[0].due,20);assert.equal(pulseEscape(s),false);
 assert.ok(damageEscape(s,20,'barrier'));assert.equal(damageEscape(s,10,'bolt'),false);assert.equal(s.integrity,80);
 for(let i=0;i<300;i++)stepEscape(s,1/60);assert.ok(pulseEscape(s));assert.ok(damageEscape(s,10,'bolt'));assert.equal(s.integrity,70);
});
test('pausing simulation preserves timing, steering and integrity',()=>{
 const s=createEscapeState('high',true);s.bolts=[{due:16.1,born:13.3,lateral:0,vertical:0}];const before=JSON.stringify(s);
 for(let i=0;i<300;i++)stepEscape(s,0,{horizontal:1});assert.equal(JSON.stringify(s),before);
});
test('completion persists only after the chase and origin transmission; retry preserves repairs',()=>{
 const initial={...ready,entered:true,introSeen:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true,vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:0,
 fuegoStarted:true,fuegoKeyDiscovered:true,fuegoKeyTaken:true,fuegoPowerTerminalExamined:true,fuegoPowerMaintenanceOpen:true,fuegoPowerCellTaken:true,
 fuegoNavigationClues:['calle','cielo','libertad'],fuegoNavigationSequence:['calle','cielo','libertad'],fuegoNavigationModuleTaken:true};
 let p=normalizeBuenosAiresProgress(initial,true);assert.equal(p.completed,false);
 assert.equal(advanceBuenosAires(p,'fuego-flight-complete').completed,false);
 p=advanceBuenosAires(p,'fuego-flight-start');assert.equal(p.fuegoFlightUnlocked,true);assert.equal(p.completed,false);
 p=advanceBuenosAires(p,'fuego-origin-recovered');assert.equal(p.originTransmissionRecovered,true);
 p=advanceBuenosAires(p,'fuego-flight-complete');p=normalizeBuenosAiresProgress(JSON.parse(JSON.stringify(p)),true);
 assert.equal(p.completed,true);assert.equal(p.nextDestination,'buenos-aires-1999');assert.equal(p.disconnectedFuturePending,true);assert.equal(p.temporalJumpUnlocked,true);
 const retry=advanceBuenosAires(p,'fuego-flight-start');assert.equal(retry.completed,true);assert.equal(retry.coreComplete,true);assert.equal(retry.fuegoKeyInstalled,true);
 assert.equal(normalizeBuenosAiresProgress({...p,fuegoRecordShown:false},true).completed,false);
 const flight=createEscapeState('low',true);assert.equal(flight.integrity,100);assert.equal(flight.time,16);
});

test('pursuing drones remain clear of the chase camera across the whole route',()=>{
 for(let t=52;t<164;t+=.05)for(const lateral of [-3.3,0,3.3])for(const vertical of [-2,2]){
  const car=escapeRoute(t,lateral,vertical);
  const camera={x:car.x-Math.sin(car.yaw)*9.5,y:car.y+3.2,z:car.z-Math.cos(car.yaw)*9.5};
  for(let i=0;i<3;i++){const d=escapeDroneRoute(t,i);assert.ok(Math.hypot(d.x-camera.x,d.y-camera.y,d.z-camera.z)>3.5,'camera clearance');}
 }
});


test('releasing either control stops drift immediately and reversing has no input lag',()=>{
 for(const fps of [30,60,120]){
  const s=createEscapeState('low',true);
  for(let i=0;i<fps/2;i++)stepEscape(s,1/fps,{horizontal:1,vertical:1});
  assert.ok(s.lateral>2&&s.vertical>1,'a short press is enough to dodge');
  const {lateral,vertical}=s;
  for(let i=0;i<fps;i++)stepEscape(s,1/fps);
  assert.equal(s.lateral,lateral,'release brakes the lateral control');assert.equal(s.vertical,vertical,'release brakes altitude');
  stepEscape(s,1/fps,{horizontal:-1,vertical:-1});assert.ok(s.lateral<lateral&&s.vertical<vertical,'reverses on first frame');
 }
});

test('barrier warning gives time to cross from the blocked edge; the marked escape lane is safe',()=>{
 const s=createEscapeState('high',true);s.time=31;stepEscape(s,1/60);
 const b=s.barriers[0];assert.ok(b.due-s.time>=5.4);
 s.lateral=s.targetLateral=b.side*3.3;
 // React with only 1.5 seconds remaining, from the most difficult starting point.
 while(s.time<b.due-1.5)stepEscape(s,1/60);
 while(!b.checked)stepEscape(s,1/60,{horizontal:-b.side});
 assert.equal(s.integrity,100);assert.ok(b.side*s.lateral < -ESCAPE_BARRIER.clearance);
 const hit=createEscapeState('high',true);hit.time=35;hit.barriers=[{due:35.01,side:1,checked:false}];
 stepEscape(hit,1/60);assert.equal(hit.integrity,80);assert.equal(hit.barriers[0].hit,true,'impact drives the local ripple');
});


test('flight effects reuse bounded geometry and materials, then dispose their resources exactly once',()=>{
 const parent=new THREE.Group(), fx=createEscapeEffects(parent), car=new THREE.Group(), s=createEscapeState();
 const resources=new Set(), collect=()=>fx.root.traverse(o=>{if(o.geometry&&!o.isSprite)resources.add(o.geometry);if(o.material){resources.add(o.material);if(o.material.map)resources.add(o.material.map);}});
 collect();const count=resources.size, children=fx.root.children.length;
 for(let i=0;i<300;i++){
  s.time=60+i/60;s.pulse=(i%60)/60;s.bolts=[{born:s.time-1,due:s.time+2.2,lateral:0,vertical:0,drone:0}];
  s.barriers=[{due:s.time+.5,side:1}];fx.update(s,car);
 }
 collect();assert.equal(resources.size,count);assert.equal(fx.root.children.length,children);
 const disposed=new Map();for(const resource of resources)resource.addEventListener('dispose',()=>disposed.set(resource,(disposed.get(resource)||0)+1));
 fx.dispose();fx.dispose();assert.equal(parent.children.length,0);
 for(const resource of resources)assert.equal(disposed.get(resource),1);
});


test('right steering and the barrier safe side agree with the chase camera around the entire route',()=>{
 const camera=new THREE.PerspectiveCamera(66,16/9,.1,500);
 for(let time=16;time<164;time+=.25){
  const center=escapeRoute(time), right=escapeRoute(time,1), left=escapeRoute(time,-1);
  camera.position.set(center.x-Math.sin(center.yaw)*9.5,center.y+3.2,center.z-Math.cos(center.yaw)*9.5);
  camera.lookAt(center.x+Math.sin(center.yaw)*8,center.y+.7,center.z+Math.cos(center.yaw)*8);camera.updateMatrixWorld();
  const project=p=>new THREE.Vector3(p.x,p.y,p.z).project(camera).x;
  assert.ok(project(right)>project(center)&&project(center)>project(left),'screen space steering');
  for(const side of [-1,1]){
   const pose=escapeRoute(time,side*ESCAPE_BARRIER.offset), gate=new THREE.Group();gate.position.set(pose.x,pose.y,pose.z);gate.rotation.y=pose.yaw+Math.PI;gate.updateMatrixWorld();
   const marker=gate.localToWorld(new THREE.Vector3(-side*(ESCAPE_BARRIER.offset+2.35),-.6,0));
   assert.ok(Math.sign(project(marker)-project(center))===-side,'safe marker matches the HUD direction');
  }
 }
});
