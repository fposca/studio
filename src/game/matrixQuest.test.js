import assert from 'node:assert/strict';
import test from 'node:test';
import {loadMatrixTransforms} from './matrixLayout.js';
import {MATRIX_INITIAL,advanceMatrixProgress as advance,normalizeMatrixProgress,matrixSafeCheckpoint,matrixSafePlayerSnapshot,BRIDGE_ORDER,MEMORY_ORDER,BLOCK_ORDER,ENERGY_ORDER,MATRIX_HEALTH,MATRIX_BOSS_PHASE} from './matrixQuest.js';
const step=(p,event,value)=>advance(p,event,value,true);
test('Puerta 03 needs an analyzed fragment and preserves old completed Puerta 02 saves',()=>{
 assert.equal(normalizeMatrixProgress({entered:true},false).entered,false);
 assert.equal(step(MATRIX_INITIAL,'enter').entered,true);
});
test('five sector puzzles require clues, ordered nodes, movable blocks and authorization evidence',()=>{
 let p=step(MATRIX_INITIAL,'nex-meet');p=step(p,'vision-toggle');
 p=step(p,'bridge-node',BRIDGE_ORDER[1]);assert.deepEqual(p.bridgeSequence,[]);
 for(const symbol of BRIDGE_ORDER)p=step(p,'bridge-node',symbol);assert.equal(p.bridgeOpen,true);
 for(const symbol of MEMORY_ORDER)p=step(p,'memory-select',symbol);assert.equal(p.memoryOpen,true);
 p=step(p,'memory-take');
 for(let i=0;i<3;i++)p=step(p,'block-move',{index:i,slot:BLOCK_ORDER[i]});assert.equal(p.blocksOpen,true);
 p=step(p,'module-take');p=step(p,'container-move');p=step(p,'coolant-hit',0);p=step(p,'coolant-hit',1);
 p=step(p,'heavy-hit');assert.equal(p.heavyHealth,MATRIX_HEALTH.heavy-2);assert.deepEqual(p.coolant,[false,false]);
 for(let hit=1;hit<Math.ceil(MATRIX_HEALTH.heavy/2);hit++){p=step(p,'coolant-hit',0);p=step(p,'coolant-hit',1);p=step(p,'heavy-hit');}assert.equal(p.heavyDefeated,true);
 p=step(p,'sentinel-meet');p=step(p,'evidence');for(let i=0;i<3;i++)p=step(p,'energy-set',{index:i,amount:ENERGY_ORDER[i]});
 p=step(p,'sentinel-trust');assert.equal(p.sentinelAllied,true);p=step(p,'security-open');assert.equal(p.securityOpen,true);
});

test('the workshop heavy takes ordinary orb hits and charged hits deal double damage',()=>{
 let p=normalizeMatrixProgress({entered:true,heavyHealth:MATRIX_HEALTH.heavy,combatBalance:2},true);
 assert.equal(step(p,'heavy-hit').heavyHealth,MATRIX_HEALTH.heavy);
 p=normalizeMatrixProgress({...p,blocksOpen:true},true);
 p=step(p,'heavy-hit');assert.equal(p.heavyHealth,MATRIX_HEALTH.heavy-1);
 p=step(p,'container-move');p=step(p,'coolant-hit',0);p=step(p,'coolant-hit',1);
 p=step(p,'heavy-hit');assert.equal(p.heavyHealth,MATRIX_HEALTH.heavy-3);
 assert.deepEqual(p.coolant,[false,false]);
 p=step(p,'heavy-hit');assert.equal(p.heavyDefeated,true);
});

test('Neon Evil takes damage from direct hits and final nodes, then awards the archive once',()=>{
 let p=step(MATRIX_INITIAL,'nex-meet');p=step(p,'vision-toggle');
 for(const symbol of BRIDGE_ORDER)p=step(p,'bridge-node',symbol);
 for(const symbol of MEMORY_ORDER)p=step(p,'memory-select',symbol);
 p=step(p,'memory-take');
 p=step(p,'block-move',{index:0,slot:0});p=step(p,'block-reset');
 assert.deepEqual(p.blockPlacements,[-1,-1,-1]);
 for(let i=0;i<3;i++)p=step(p,'block-move',{index:i,slot:BLOCK_ORDER[i]});
 p=step(p,'module-take');p=step(p,'container-move');
 for(let i=0;i<Math.ceil(MATRIX_HEALTH.heavy/2);i++){p=step(p,'coolant-hit',0);p=step(p,'coolant-hit',1);p=step(p,'heavy-hit');}
 p=step(p,'evidence');for(let i=0;i<3;i++)p=step(p,'energy-set',{index:i,amount:ENERGY_ORDER[i]});
 p=step(p,'sentinel-trust');p=step(p,'security-open');
 assert.equal(p.checkpoint,'security');
 p=step(p,'checkpoint','city');assert.equal(p.checkpoint,'security');
 p=step(p,'checkpoint','mirror');assert.equal(p.checkpoint,'security');
 for(let i=0;i<MATRIX_HEALTH.elite;i++)p=step(p,'elite-hit');
 assert.equal(p.eliteDefeated,true);assert.equal(p.checkpoint,'mirror');
 p=step(p,'boss-start');assert.equal(p.bossStarted,true);
 for(let i=0;i<MATRIX_HEALTH.boss-MATRIX_BOSS_PHASE.nodes;i++)p=step(p,'boss-hit');
 assert.equal(p.bossHealth,MATRIX_BOSS_PHASE.nodes);
 p=step(p,'boss-hit');assert.equal(p.bossHealth,MATRIX_BOSS_PHASE.nodes-1);
 for(let i=0;i<3;i++)p=step(p,'boss-node',i);
 assert.equal(p.bossDefeated,true);
 p=step(p,'boss-hit');assert.equal(p.bossHealth,0);
 p=step(p,'archive-read');p=step(p,'return-home');
 const restored=normalizeMatrixProgress(JSON.parse(JSON.stringify(p)),true);
 assert.equal(restored.archiveRead,true);assert.equal(restored.returnedHome,true);
 assert.equal(restored.checkpoint,'mirror');
});

test('every boss hit drains energy in phase three, with open shield doubling damage',()=>{
 let p=normalizeMatrixProgress({...MATRIX_INITIAL,entered:true,bossStarted:true,bossHealth:4,bossNodes:[false,false,false]},true);
 p=step(p,'boss-hit',{shieldOpen:false});assert.equal(p.bossHealth,3);
 p=step(p,'boss-node',0);assert.equal(p.bossHealth,2);
 p=step(p,'boss-node',0);assert.equal(p.bossHealth,2);
 p=step(p,'boss-hit',{shieldOpen:true,returning:true});
 assert.equal(p.bossDefeated,true);assert.equal(p.bossHealth,0);
});

test('a legacy mirror checkpoint behind the locked elite gate respawns in Security',()=>{
 const broken={...MATRIX_INITIAL,entered:true,heavyDefeated:true,securityOpen:true,checkpoint:'mirror',eliteHealth:2};
 assert.equal(matrixSafeCheckpoint(broken),'security');
 const restored=normalizeMatrixProgress(JSON.parse(JSON.stringify(broken)),true);
 assert.equal(restored.checkpoint,'security');
 assert.equal(restored.eliteHealth,2);
 assert.equal(restored.securityOpen,true);
 const trapped={x:1,z:-80,yaw:0,viewYaw:1};
 assert.deepEqual(matrixSafePlayerSnapshot(trapped,restored,[2,0,-54]),{x:2,z:-54,yaw:Math.PI,viewYaw:0});
 assert.equal(matrixSafePlayerSnapshot(trapped,{...restored,eliteDefeated:true}),trapped);
});

test('retry restores active robot and Neon Evil health without undoing completed sectors',()=>{
 const eliteFight=normalizeMatrixProgress({entered:true,heavyDefeated:true,securityOpen:true,
   checkpoint:'security',eliteHealth:1,eliteDefeated:false,memoryFragment:true},true);
 const eliteRetry=step(eliteFight,'retry');
 assert.equal(eliteRetry.eliteHealth,MATRIX_HEALTH.elite);
 assert.equal(eliteRetry.checkpoint,'security');
 assert.equal(eliteRetry.memoryFragment,true);

 const bossFight=normalizeMatrixProgress({...eliteRetry,eliteDefeated:true,eliteHealth:0,
   checkpoint:'mirror',bossStarted:true,bossHealth:1,bossNodes:[true,true,false]},true);
 const bossRetry=step(bossFight,'retry');
 assert.equal(bossRetry.eliteDefeated,true);
 assert.equal(bossRetry.eliteHealth,0);
 assert.equal(bossRetry.bossStarted,false);
 assert.equal(bossRetry.bossHealth,MATRIX_HEALTH.boss);
 assert.deepEqual(bossRetry.bossNodes,[false,false,false]);
 assert.equal(bossRetry.checkpoint,'mirror');
});

test('legacy combat saves retain their damage percentage after health increases',()=>{
 const p=normalizeMatrixProgress({entered:true,heavyHealth:2,eliteHealth:2,bossHealth:3},true);
 assert.equal(p.heavyHealth,3);
 assert.equal(p.eliteHealth,3);
 assert.equal(p.bossHealth,MATRIX_BOSS_PHASE.nodes);
 assert.equal(p.combatBalance,2);
 assert.deepEqual(normalizeMatrixProgress(p,true),p);
 const defeated=normalizeMatrixProgress({heavyHealth:0,heavyDefeated:true,eliteHealth:0,eliteDefeated:true,bossHealth:0,bossDefeated:true},true);
 assert.equal(defeated.heavyHealth,0);
 assert.equal(defeated.eliteHealth,0);
 assert.equal(defeated.bossHealth,0);
});

test('old Centinela editor positions become correctly sized flying placements',()=>{
 const oldStorage=globalThis.localStorage;
 globalThis.localStorage={getItem:()=>JSON.stringify({'drone-workshop':{position:[8,2.8,-38],rotation:[0,0,0],detect:11},sentinel:{position:[0,0,-57]}})};
 try{
  const transform=loadMatrixTransforms()['drone-workshop'];
  assert.deepEqual(transform.position,[8,1.6,-38]);
  assert.deepEqual(transform.rotation,[0,180,0]);
  assert.equal(transform.detect,12);
  assert.deepEqual(loadMatrixTransforms().sentinel.position,[0,1.6,-57]);
 }finally{globalThis.localStorage=oldStorage;}
});
