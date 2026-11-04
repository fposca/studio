import assert from 'node:assert/strict';
import test from 'node:test';
import {STORE_INVASION_INITIAL,advanceStoreInvasion as advance,normalizeStoreInvasionProgress,storeInvasionObjective} from './storeInvasionQuest.js';
const step=(p,event,value)=>advance(p,event,value,true);
function throughGhost(){
 let p=step(STORE_INVASION_INITIAL,'enter');p=step(p,'intro');p=step(p,'tito');p=step(p,'vision-toggle');
 for(let i=0;i<3;i++)p=step(p,'juke-clue',i);
 for(const symbol of ['onda','surco','silencio'])p=step(p,'juke-input',symbol);
 p=step(p,'juke-hit');p=step(p,'crate-step',1);p=step(p,'crate-step',1);p=step(p,'archive-inspect');
 for(let i=0;i<3;i++)p=step(p,'archive-node',i);
 for(let i=0;i<3;i++)p=step(p,'ghost-hit');
 return p;
}
test('invasion remains locked before the Puerta 03 return and the normal store stays unchanged',()=>{
 const p=advance(STORE_INVASION_INITIAL,'enter',null,false);
 assert.equal(p.started,false);
 assert.equal(normalizeStoreInvasionProgress({...p,jukeboxOff:true,coreNeutralized:true},false).coreNeutralized,false);
});
test('rockola requires clues, frequency vision, ordered input, and a separate orb hit',()=>{
 let p=step(STORE_INVASION_INITIAL,'enter');
 p=step(p,'juke-input','onda');assert.deepEqual(p.jukeboxInput,[]);
 p=step(p,'vision-toggle');for(let i=0;i<3;i++)p=step(p,'juke-clue',i);
 p=step(p,'juke-input','surco');assert.deepEqual(p.jukeboxInput,[]);
 for(const symbol of ['onda','surco','silencio'])p=step(p,'juke-input',symbol);
 assert.equal(p.jukeboxArmed,true);assert.equal(p.jukeboxOff,false);
 p=step(p,'juke-hit');assert.equal(p.jukeboxOff,true);
});
test('rockola objective reports each clue and the next action',()=>{
 let p=step(STORE_INVASION_INITIAL,'enter');p=step(p,'intro');p=step(p,'tito');p=step(p,'vision-toggle');
 assert.match(storeInvasionObjective(p),/0\/3/);
 p=step(p,'juke-clue',2);assert.match(storeInvasionObjective(p),/1\/3/);
 p=step(p,'juke-clue',0);p=step(p,'juke-clue',1);
 assert.match(storeInvasionObjective(p),/ONDA.*SURCO.*SILENCIO/);
 for(const symbol of ['onda','surco','silencio'])p=step(p,'juke-input',symbol);
 assert.match(storeInvasionObjective(p),/Orbe Neon/);
});
test('archive requires controlled crate movement and sequential orb conductors',()=>{
 let p=step(STORE_INVASION_INITIAL,'enter');p=step(p,'vision-toggle');
 p=step(p,'archive-inspect');assert.equal(p.archivePanelSeen,false);
 p=step(p,'crate-step',1);p=step(p,'crate-step',1);assert.equal(p.crateSlot,2);
 p=step(p,'archive-inspect');p=step(p,'archive-node',1);assert.deepEqual(p.conductors,[]);
 for(let i=0;i<3;i++)p=step(p,'archive-node',i);
 assert.equal(p.archiveOff,true);
 p=step(p,'retry');assert.equal(p.archiveOff,true);assert.equal(p.ghostHealth,3);
});
test('third focus needs a reflected final hit and combat checkpoints preserve completed focos',()=>{
 let p=throughGhost();assert.equal(p.ghostDefeated,true);
 p=step(p,'emitter-clue');p=step(p,'emitter-hit',{index:0,reflected:false});p=step(p,'emitter-hit',{index:1,reflected:false});
 p=step(p,'emitter-hit',{index:2,reflected:false});assert.deepEqual(p.emitters,[]);
 for(const index of [0,1])p=step(p,'emitter-hit',{index,reflected:false});
 p=step(p,'reflector-set',1);p=step(p,'emitter-hit',{index:2,reflected:true});assert.equal(p.transmissionOff,true);
 p=step(p,'boss-hit',{vulnerable:true});assert.equal(p.bossHealth,5);
 p=step(p,'generator-hit',0);p=step(p,'generator-hit',1);
 p=step(p,'boss-hit',{vulnerable:true});assert.equal(p.bossHealth,4);
 p=step(p,'retry');assert.deepEqual(p.generators,[false,false]);assert.equal(p.bossHealth,5);assert.equal(p.transmissionOff,true);
 p=step(p,'generator-hit',0);p=step(p,'generator-hit',1);
 for(let i=0;i<5;i++)p=step(p,'boss-hit',{vulnerable:true});
 assert.equal(p.bossDefeated,true);p=step(p,'core-read');assert.equal(p.coreNeutralized,true);
 assert.match(storeInvasionObjective(p),/Buenos Aires/);
 assert.deepEqual(normalizeStoreInvasionProgress(p,true).jukeboxClues,[true,true,true]);
});
