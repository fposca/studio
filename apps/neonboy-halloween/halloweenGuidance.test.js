import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { getHalloweenGuidance as guide, getHalloweenChecklist } from "./halloweenGuidance.js";
import { createChestRevealCamera, CHEST_REVEAL_SECONDS } from "./halloweenGuideCamera.js";
import { HALLOWEEN_NPC_IDS } from "./halloweenSecretsLogic.js";

test("key, chest and glasses guidance derives from saved progress, including a reopened chest", () => {
  assert.equal(guide().id, "key");
  assert.equal(guide({chest:{keyOwned:true}}).id, "chest");
  assert.equal(guide({chest:{keyOwned:true,open:true}}).id, "glasses");
  assert.equal(guide({chest:{keyOwned:true,open:true,collected:true}}).id, "demon");
});
test("pending calls interrupt exploration, then the next missing unique citizen is selected", () => {
  const state = {chest:{keyOwned:true,collected:true},demonHealth:0,vhsCollected:true,discovered:new Set(["vhs:inserted"])};
  assert.equal(guide({...state,phoneRinging:true}).id, "phone");
  assert.equal(guide(state).target.id, "tito");
  for (const id of HALLOWEEN_NPC_IDS) state.discovered.add(`npc-dialogue:${id}`);
  assert.equal(guide(state).id, "calls");
  for (let i=0;i<4;i++) state.discovered.add(`phone:${i}`);
  assert.equal(guide(state).id, "mirror");
  assert.equal(getHalloweenChecklist(state).filter(item=>item.done).length,5);
  state.discovered.delete("npc-dialogue:jason");
  assert.equal(guide(state).id, "npc:jason");
});
test("VHS, active combat and completed story get accurate next steps", () => {
  const state = {chest:{keyOwned:true,collected:true},demonHealth:0};
  assert.equal(guide(state).id,"vhs");
  assert.equal(guide({...state,vhsCollected:true}).id,"tv");
  assert.equal(guide({...state,judgePhase:"combat",phoneRinging:true}).id,"judge-combat");
  assert.equal(guide({...state,judgePhase:"gone"}).id,"anniversary");
  assert.equal(guide({...state,judgePhase:"gone",secretVinylUnlocked:true}).id,"complete");
});
test("chest reveal restores the exact camera pose at 30/60 FPS and can be skipped", () => {
  for (const fps of [30,60]) for (const reduced of [false,true]) {
    const camera=createChestRevealCamera(), original=new THREE.Vector3(0,3,14), originalLook=new THREE.Vector3(0,1,10);
    const position=original.clone(),look=originalLook.clone();
    camera.start(position,look,reduced);
    for(let i=0;i<fps*(CHEST_REVEAL_SECONDS+1);i++) camera.update(1/fps,position,look);
    assert.equal(camera.active,false);assert.ok(position.equals(original));assert.ok(look.equals(originalLook));
    camera.start(position,look,reduced);camera.update(2,position,look);
    assert.ok(!position.equals(original));
    camera.update(0,position,look,true);
    assert.ok(position.equals(original));assert.ok(look.equals(originalLook));
  }
});


test("tutorials appear only at the relevant stage and seen tutorials do not repeat", async () => {
  const { pendingGuideReveal } = await import("./halloweenGuidance.js");
  const state = {chest:{keyOwned:true,collected:true},demonHealth:3,discovered:new Set()};
  assert.deepEqual(pendingGuideReveal(state),{kind:"demon"});
  assert.equal(pendingGuideReveal(state,["demon"]),null);
  state.demonHealth=0;
  assert.equal(pendingGuideReveal(state),null);
  state.vhsCollected=true;state.discovered.add("vhs:inserted");
  assert.deepEqual(pendingGuideReveal(state),{kind:"people",npcId:"tito"});
  assert.equal(pendingGuideReveal(state,["people"]),null);
  for(const id of HALLOWEEN_NPC_IDS)state.discovered.add(`npc-dialogue:${id}`);
  for(let i=0;i<3;i++)state.discovered.add(`phone:${i}`);
  assert.equal(pendingGuideReveal(state),null);
  state.discovered.add("phone:3");
  assert.deepEqual(pendingGuideReveal(state),{kind:"mirror"});
  assert.equal(pendingGuideReveal(state,["mirror"]),null);
  assert.equal(pendingGuideReveal({...state,judgePhase:"combat"}),null);
});
test("actor close-ups avoid blocked views and restore both first/third-person poses", async () => {
  const { actorGuideShot,createGuideRevealCamera } = await import("./halloweenGuideCamera.js");
  const layout={sideWallX:11,backWallZ:-14,frontWallZ:15};
  const shot=actorGuideShot({x:8,z:-7},Math.PI/2,[],layout);
  assert.ok(shot.position.x < 10.35);assert.ok(shot.position.z > -13.35);
  for(const reduced of [false,true]) {
    const camera=createGuideRevealCamera(),position=new THREE.Vector3(1,1.68,12),look=new THREE.Vector3(1,1.68,11);
    const before=position.clone(),beforeLook=look.clone();
    camera.start(position,look,reduced,shot);camera.update(3,position,look);
    assert.ok(look.equals(shot.focus));assert.ok(position.distanceTo(shot.position)<1e-9);
    camera.update(5,position,look);
    assert.ok(!camera.active);assert.ok(position.equals(before));assert.ok(look.equals(beforeLook));
  }
});


test("welcome camera visits all stops, pauses on zero delta and returns exactly at 30/60 FPS", async () => {
  const {createGuideRevealCamera}=await import("./halloweenGuideCamera.js");
  const {welcomeTourShots}=await import("./halloweenWelcomeTour.js");
  const player={x:0,z:11.1,yaw:Math.PI};
  const shot=welcomeTourShots({player,albums:[{id:"gloom",group:"instrumental"},{id:"holy-fire",group:"band"}],
    positions:[{x:0,z:-13.35,yaw:0},{x:-10.72,z:-.9,yaw:Math.PI/2}],
    actors:new Map([["roxy",{root:{position:{x:1.25,z:3.2},rotation:{y:Math.PI}}}],["rulo",{root:{position:{x:6.65,z:.55},rotation:{y:-Math.PI/2}}}]]),
    obstacles:[],layout:{sideWallX:11.05,backWallZ:-14,frontWallZ:15.35}});
  assert.equal(shot.stops.filter(s=>s.step===3).length,2);
  for(const fps of [30,60]) for(const reduced of [false,true]) {
    const camera=createGuideRevealCamera(),position=new THREE.Vector3(0,3,14),look=new THREE.Vector3(0,1.2,11.1);
    const start=position.clone(),startLook=look.clone(),steps=new Set();
    camera.start(position,look,reduced,shot);
    for(let i=0;i<fps*40;i++) {if(camera.active)steps.add(camera.step);camera.update(1/fps,position,look);}
    assert.deepEqual([...steps],[0,1,2,3,4]);assert.equal(camera.active,false);
    assert.ok(position.equals(start));assert.ok(look.equals(startLook));
    camera.start(position,look,reduced,shot);camera.update(7,position,look);
    const paused=position.clone();camera.update(0,position,look);assert.ok(position.equals(paused));
    camera.update(0,position,look,true);
    for(let i=0;i<fps;i++) camera.update(1/fps,position,look);
    assert.ok(!camera.active);assert.ok(position.equals(start));assert.ok(look.equals(startLook));
  }
});

test("next stop advances smoothly and skips duplicate character shots", async()=>{
  const {createGuideRevealCamera}=await import("./halloweenGuideCamera.js");
  const camera=createGuideRevealCamera(),position=new THREE.Vector3(0,3,12),look=new THREE.Vector3(0,1,10);
  const original=position.clone();
  const stop=step=>({step,position:{x:step,y:3,z:2},focus:{x:step,y:1,z:0},duration:5,travel:2});
  camera.start(position,look,false,{stops:[stop(0),stop(1),stop(1),{...stop(2),return:true}]});
  camera.update(3,position,look);const current=position.clone();camera.next();camera.update(0,position,look);
  assert.ok(position.equals(current));assert.equal(camera.step,1);
  camera.next();camera.update(0,position,look);assert.equal(camera.step,2);
  camera.next();camera.update(0,position,look);camera.update(1,position,look);
  assert.equal(camera.active,false);assert.ok(position.equals(original));
});
