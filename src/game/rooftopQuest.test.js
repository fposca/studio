import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_ROOFTOP_PROGRESS, advanceRooftopProgress, normalizeRooftopProgress, rooftopObjective } from "./rooftopQuest.js";
import { createNewUniverseGame, writeUniverseSave, readUniverseSaves } from "./neonUniverseSaves.js";
import { getUniverseInventory } from "./universeInventory.js";

const step=(progress,event,value)=>advanceRooftopProgress(progress,event,value);
test("the rooftop puzzle cannot skip power, bearing, frequency or the safe zone",()=>{
  let p=INITIAL_ROOFTOP_PROGRESS;
  p=step(p,"decode");
  assert.equal(p.frequencyDecoded,false);
  p=step(p,"intro");p=step(p,"explore");p=step(p,"panel");
  p=step(p,"switch","rayo");
  assert.deepEqual(p.switches,[]);
  for(const id of ["luna","rayo","antena"])p=step(p,"switch",id);
  assert.equal(p.powerRestored,true);
  assert.equal(rooftopObjective(p),"Orient\u00e1 la antena principal.");
  p=step(p,"bearing",-34);p=step(p,"align");
  assert.equal(p.antennaAligned,true);
  p=step(p,"frequency",9);p=step(p,"decode");
  assert.equal(p.frequencyDecoded,true);
  p=step(p,"anomaly");
  assert.equal(p.anomalySeen,false);
  p=step(p,"safe");p=step(p,"anomaly");p=step(p,"collect");
  assert.equal(p.missionCompleted,true);
  assert.equal(getUniverseInventory({rooftopProgress:p}).some(item=>item.id==="transmission-09"),true);
});

test("rooftop save unlock follows Hugo's actual clue and retains position and evidence",()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const game=createNewUniverseGame();
  game.scene="rooftop";
  game.mapUnlocks=["neonboy-rooftop"];
  game.rooftopProgress={...INITIAL_ROOFTOP_PROGRESS,introSeen:true,explored:true};
  game.positions.rooftop={x:4,z:-3,yaw:1,viewYaw:2};
  writeUniverseSave("slot-1",game,storage,100);
  let loaded=readUniverseSaves(storage)["slot-1"].data;
  assert.equal(loaded.mapUnlocks.includes("neonboy-rooftop"),false);
  assert.equal(loaded.rooftopProgress.introSeen,false);
  game.arcadeProgress.recordStoreFutureVisionSeen=true;
  game.arcadeProgress.recordStoreGhostSeen=true;
  Object.assign(game.studioProgress,{impossibleRecordingStarted:true,signalComputerExamined:true,signalAnalysisCompleted:true,reversedSignalDecoded:true,studioAnomalySeen:true,rooftopClueKnown:true});
  writeUniverseSave("slot-2",game,storage,200);
  loaded=readUniverseSaves(storage)["slot-2"].data;
  assert.equal(loaded.mapUnlocks.includes("neonboy-rooftop"),true);
  assert.equal(loaded.rooftopProgress.introSeen,true);
  assert.equal(loaded.positions.rooftop.z,-3);
  assert.equal(normalizeRooftopProgress({transmissionCollected:true}).transmissionCollected,false);
});
