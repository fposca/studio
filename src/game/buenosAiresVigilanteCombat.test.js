import test from "node:test";
import assert from "node:assert/strict";
import { createVigilanteCombatState, stepVigilanteCombat, vigilanteAction, inVigilanteArena, vigilanteShielded, vigilanteProjectileHits } from "./buenosAiresVigilanteCombat.js";
import { normalizeBuenosAiresProgress, advanceBuenosAires } from "./buenosAiresQuest.js";
const completed = { entered:true,introSeen:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true };
function encounter() { return advanceBuenosAires(advanceBuenosAires(completed,"vigilante-encounter"),"vigilante-start"); }
test("Vigilante cannot start before all transmitters and synchronization",()=>{
  for(const p of [{},{...completed,synchronizationSeen:false},{...completed,trafficComplete:false}])
    assert.equal(advanceBuenosAires(advanceBuenosAires(p,"vigilante-encounter"),"vigilante-start").vigilanteStarted,false);
  assert.equal(encounter().vigilanteStarted,true);
});
test("eight valid hits require three unique visible nodes; defeat persists but escape awaits Fuego repair",()=>{
  let p=encounter();
  for(let i=0;i<4;i++)p=advanceBuenosAires(p,"vigilante-hit");
  assert.equal(p.vigilanteHealth,4);assert.ok(vigilanteShielded(p));
  p=advanceBuenosAires(p,"vigilante-hit");assert.equal(p.vigilanteHealth,4);
  p=advanceBuenosAires(p,"vigilante-node:oeste");assert.equal(p.vigilanteNodes.length,0);
  p=advanceBuenosAires(p,"vision-toggle");
  for(const id of ["oeste","oeste","fake","este","sur"])p=advanceBuenosAires(p,"vigilante-node:"+id);
  assert.equal(p.vigilanteNodes.length,3);assert.equal(vigilanteShielded(p),false);
  for(let i=0;i<4;i++)p=advanceBuenosAires(p,"vigilante-hit");
  assert.equal(p.vigilanteHealth,0);assert.equal(p.vigilanteDefeated,false);
  p=advanceBuenosAires(p,"vigilante-defeated");p=normalizeBuenosAiresProgress(JSON.parse(JSON.stringify(p)),true);
  assert.ok(p.vigilanteDefeated&&p.record1999Found);assert.equal(p.escapeUnlocked,false);assert.equal(p.completed,false);
});
test("retry restores the boss and nodes but keeps the completed city missions",()=>{
  const p=advanceBuenosAires({...encounter(),vigilanteHealth:2,vigilanteNodes:["oeste","este","sur"],vigilantePhaseSeen:true},"vigilante-retry");
  assert.equal(p.vigilanteHealth,8);assert.deepEqual(p.vigilanteNodes,[]);assert.equal(p.vigilantePhaseSeen,false);
  assert.ok(p.advertisingComplete&&p.trafficComplete&&p.coreComplete&&p.synchronizationSeen&&p.vigilanteStarted);
});
test("melee damage happens at the impact marker, can be dodged, and pause freezes windup",()=>{
  const s=createVigilanteCombatState();s.x=0;s.z=18;vigilanteAction(s,"melee");let damage=0;
  const ctx={player:{x:0,z:20},health:8,onDamage:()=>damage++};
  for(let i=0;i<10;i++)stepVigilanteCombat(s,.05,ctx);assert.equal(damage,0);
  stepVigilanteCombat(s,2,{...ctx,paused:true});assert.equal(damage,0);
  for(let i=0;i<3;i++)stepVigilanteCombat(s,.05,ctx);assert.equal(damage,1);
  for(let i=0;i<10;i++)stepVigilanteCombat(s,.05,ctx);assert.equal(damage,1);
  vigilanteAction(s,"idle");vigilanteAction(s,"melee");
  for(let i=0;i<14;i++)stepVigilanteCombat(s,.05,{...ctx,player:{x:0,z:24}});assert.equal(damage,1);
});
test("ranged shots hit a stationary NeonBoy, can be sidestepped, stop on death and stay bounded",()=>{
  const s=createVigilanteCombatState();s.x=0;s.z=16;s.cooldown=0;let damage=0;
  for(let i=0;i<120;i++)stepVigilanteCombat(s,.05,{player:{x:0,z:24},health:8,onDamage:()=>damage++});
  assert.ok(s.shots>0);assert.ok(damage>0);assert.ok(inVigilanteArena(s.x,s.z,.8));
  stepVigilanteCombat(s,.05,{player:{x:0,z:24},health:0});assert.ok(s.projectiles.every(p=>!p.active));
  assert.ok(vigilanteProjectileHits({x:0,y:1,z:0},{x:0,y:1,z:8},{x:0,z:4}));
  assert.equal(vigilanteProjectileHits({x:0,y:1,z:0},{x:0,y:1,z:8},{x:2,z:4}),false);
});
test("pursuit respects delta time and collision rejection",()=>{
  const run=dt=>{const s=createVigilanteCombatState();s.x=0;s.z=13;s.cooldown=100;
    for(let i=0;i<Math.round(2/dt);i++)stepVigilanteCombat(s,dt,{health:8,player:{x:0,z:25},canOccupy:(x,z)=>z<16});return s;};
  const a=run(1/30),b=run(1/60);assert.ok(Math.abs(a.z-b.z)<.15);assert.ok(a.z<16&&b.z<16);
});
