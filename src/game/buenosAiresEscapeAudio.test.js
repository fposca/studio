import test from 'node:test';
import assert from 'node:assert/strict';
import { createEscapeAudio, synthesizeFlightSound } from './buenosAiresEscapeAudio.js';
import { createEscapeState } from './buenosAiresEscapeLogic.js';

function fakeContext(){
 const nodes=[],sources=[];
 const param=()=>({value:0,setValueAtTime(value){this.value=value;},linearRampToValueAtTime(value){this.value=value;},setTargetAtTime(value){this.value=value;}});
 const node=props=>{const n={connect(){return arguments[0];},disconnect(){this.disconnected=true;},...props};nodes.push(n);return n;};
 return {sampleRate:8000,currentTime:0,state:'running',nodes,sources,destination:{},
  createGain:()=>node({gain:param()}),createDynamicsCompressor:()=>node({threshold:param(),ratio:param(),knee:param()}),createStereoPanner:()=>node({pan:param()}),
  createBuffer(channels,length,rate){const samples=new Float32Array(length);return{length,sampleRate:rate,getChannelData:()=>samples,copyToChannel(data){samples.set(data);}};},
  createBufferSource(){const s=node({playbackRate:param(),start(){this.started=true;},stop(){this.stopped=true;}});sources.push(s);return s;},
  suspend(){this.state='suspended';return Promise.resolve();},resume(){this.state='running';return Promise.resolve();},close(){this.state='closed';return Promise.resolve();},
 };
}

test('flight sounds contain finite audible audio, bounded peaks, and soft endpoints',()=>{
 for(const rate of [8000,44100])for(const kind of ['pulse','drone','barrier','hit','jumpIn','jumpLoop','jumpOut']){
  const a=synthesizeFlightSound(kind,rate);let peak=0,energy=0;
  for(const value of a){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));energy+=value*value;}
  assert.ok(peak>.08&&peak<.59,kind+' peak');assert.ok(Math.sqrt(energy/a.length)>.015,kind+' rms');
  assert.equal(Math.abs(a[0]),0);assert.ok(Math.abs(a.at(-1))<.002,kind+' clean endpoint');
 }
 assert.equal(synthesizeFlightSound('missing').length,0);
});

test('actual events sound once, pan drones, and rejected or paused actions stay silent',async()=>{
 const context=fakeContext(),audio=createEscapeAudio({contextFactory:()=>context}),s=createEscapeState('high',true);
 audio.sync(s);assert.equal(context.sources.length,0);audio.unlock();
 s.pulses=1;audio.sync(s);audio.sync(s);assert.equal(audio.stats.pulse,1);
 s.bolts=[{id:3,drone:0},{id:5,drone:1}];audio.sync(s);audio.sync(s);assert.equal(audio.stats.drone,2);
 assert.deepEqual(context.nodes.filter(n=>n.pan).map(n=>n.pan.value),[0,-.65,.65]);
 s.hits=1;s.lastDamage='BARRERA DE LA RED';audio.sync(s);audio.sync(s);assert.equal(audio.stats.barrier,1);
 audio.setPaused(true);s.pulses++;audio.sync(s);assert.equal(audio.stats.pulse,1);assert.equal(context.state,'suspended');
 await new Promise(resolve=>setImmediate(resolve));audio.setPaused(false);await new Promise(resolve=>setImmediate(resolve));audio.sync(s);assert.equal(audio.stats.pulse,2);
 audio.dispose();assert.equal(context.state,'closed');assert.ok(context.sources.every(source=>source.stopped&&source.disconnected));
});

test('temporal entry, continuous bed and exit play once, stop on completion and reset on retry',()=>{
 const context=fakeContext(),audio=createEscapeAudio({contextFactory:()=>context}),s=createEscapeState();audio.unlock();
 for(let i=0;i<1000;i++){s.time=164+i*.016;audio.sync(s);}
 assert.equal(audio.stats.jumpIn,1);assert.equal(audio.stats.jumpLoop,1);assert.equal(audio.stats.jumpOut,1);assert.ok(audio.stats.voices<=6);
 const bed=context.sources.find(source=>source.loop);assert.ok(bed.started&&!bed.stopped);
 s.status='complete';audio.sync(s);assert.ok(bed.stopped&&bed.disconnected);
 audio.reset();assert.equal(audio.stats.voices,0);s.status='playing';s.time=164;audio.sync(s);assert.equal(audio.stats.jumpIn,1);
 audio.dispose();audio.unlock();audio.sync(s);assert.equal(audio.stats.voices,0);
});

test('voice cap and natural endings disconnect nodes; no audio device is harmless',()=>{
 const context=fakeContext(),audio=createEscapeAudio({contextFactory:()=>context}),s=createEscapeState('high',true);audio.unlock();
 for(let i=0;i<25;i++){s.pulses++;audio.sync(s);}assert.equal(audio.stats.voices,6);
 for(const source of context.sources)source.onended?.();assert.equal(audio.stats.voices,0);
 assert.ok(context.nodes.filter(n=>n.gain||n.pan).slice(1).every(n=>n.disconnected));audio.dispose();
 const unavailable=createEscapeAudio({contextFactory:()=>{throw new Error('unavailable');}});
 assert.doesNotThrow(()=>{unavailable.unlock();unavailable.sync(s);unavailable.setPaused(true);unavailable.dispose();});
});


test('visibility changes suspend audio without waiting for a render frame and preserve manual pause',async()=>{
 const doc=new EventTarget();doc.hidden=false;const context=fakeContext(),audio=createEscapeAudio({contextFactory:()=>context,visibilityTarget:doc});audio.unlock();
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(context.state,'suspended');
 await new Promise(resolve=>setImmediate(resolve));audio.setPaused(true);doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(context.state,'suspended');
 audio.setPaused(false);await new Promise(resolve=>setImmediate(resolve));assert.equal(context.state,'running');
 audio.dispose();doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(context.state,'closed');
});
