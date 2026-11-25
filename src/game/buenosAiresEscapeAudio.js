import { createStudioSignalBuffer } from './studioSignalAudio.js';
import { ESCAPE_JUMP_START } from './buenosAiresEscapeLogic.js';

const DURATIONS = { pulse:1.1, drone:.42, barrier:1.05, hit:.55, jumpIn:2.6, jumpLoop:4, jumpOut:2.1 };
// Cached, layered sound design: short transients, filtered air and resonant body.
// No downloads, audio elements per shot, timers, or work in the render loop.
export function synthesizeFlightSound(kind, sampleRate=44100) {
  const duration=DURATIONS[kind]; if(!duration)return new Float32Array(0);
  const samples=new Float32Array(Math.ceil(sampleRate*duration));
  let seed=8137, low=0, deep=0, phase=0;
  const sine=(hz,t)=>Math.sin(2*Math.PI*hz*t);
  for(let i=0;i<samples.length;i++){
    const t=i/sampleRate, u=t/duration;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const noise=seed/2147483648-1;
    low+=(noise-low)*(1-Math.exp(-2*Math.PI*950/sampleRate));
    deep+=(noise-deep)*(1-Math.exp(-2*Math.PI*150/sampleRate));
    const air=noise-low;
    let sound=0;
    if(kind==='pulse'){
      phase+=2*Math.PI*(68+390*Math.exp(-t*15))/sampleRate;
      sound=Math.sin(phase)*.65*Math.exp(-t*4.5);
      sound+=(sine(238,t)+sine(359,t)*.35)*.16*Math.exp(-t*3.8);
      sound+=(low*.75+air*.13)*Math.exp(-t*4)*(.4+Math.sin(Math.PI*u)*.6);
    }else if(kind==='drone'){
      phase+=2*Math.PI*(210+2100*Math.exp(-t*17))/sampleRate;
      sound=(Math.sin(phase)*.45+Math.sin(phase*1.51)*.13)*Math.exp(-t*9);
      sound+=air*.25*Math.exp(-t*45)+low*.12*Math.exp(-t*12);
    }else if(kind==='barrier'||kind==='hit'){
      sound=(sine(57,t)*.7+deep*1.5)*Math.exp(-t*9);
      sound+=(sine(287,t)*.24+sine(631,t)*.14+sine(1223,t)*.06)*Math.exp(-t*7);
      sound+=air*.4*Math.exp(-t*27)+low*.35*Math.exp(-t*4)*(Math.sin(t*91)**6);
      if(kind==='hit')sound*=.7;
    }else if(kind==='jumpIn'){
      phase+=2*Math.PI*(52+u*u*430)/sampleRate;
      const swell=Math.sin(Math.PI*u)**1.2;
      sound=(low*.9+air*.12)*swell;
      sound+=(Math.sin(phase)*.2+sine(73,t)*.22+sine(110,t)*.1)*swell;
      sound+=sine(43,t)*.4*Math.exp(-t*2);
    }else if(kind==='jumpLoop'){
      // Integer cycles and a seam envelope keep the four-second bed click-free.
      const breathe=.72+.28*Math.cos(2*Math.PI*u);
      sound=(sine(48,t)*.26+sine(96,t)*.12+sine(144,t)*.04)*breathe;
      sound+=low*.38+deep*.3+air*.035;
      sound+=sine(240,t+Math.sin(2*Math.PI*u)*.0008)*.055;
    }else if(kind==='jumpOut'){
      phase+=2*Math.PI*(48+430*Math.exp(-t*3.2))/sampleRate;
      sound=Math.sin(phase)*.4*Math.exp(-t*1.9);
      sound+=(sine(146.83,t)*.13+sine(220,t)*.1+sine(293.66,t)*.07)*Math.sin(Math.PI*u);
      sound+=(deep*.5+low*.25)*Math.exp(-t*2);
    }
    const attack=Math.min(1,t/(kind==='jumpLoop'?.06:.006));
    const tail=Math.min(1,(duration-t)/(kind==='jumpLoop'?.06:.1));
    samples[i]=Math.tanh(sound)*.58*attack*tail;
  }
  return samples;
}

export function createEscapeAudio({ contextFactory, visibilityTarget=globalThis.document }={}) {
  let context=null, master=null, compressor=null, disposed=false, paused=false, transition=false;
  let pulseCount=0, hitCount=0, boltId=-1, jumpStarted=false, jumpReleased=false, originPlayed=false, bed=null;
  const buffers=new Map(), voices=new Set();
  const stats={pulse:0,drone:0,barrier:0,hit:0,jumpIn:0,jumpLoop:0,jumpOut:0,origin:0};
  const blocked=()=>paused||!!visibilityTarget?.hidden;
  function reconcile(){
    if(!context||disposed||transition||context.state==='closed')return;
    const operation=blocked()&&context.state==='running'?'suspend':!blocked()&&context.state==='suspended'?'resume':null;
    if(!operation)return;
    transition=true;
    const current=context;
    Promise.resolve(context[operation]()).then(()=>{
      transition=false;
      if(context===current&&!disposed)reconcile();
    },()=>{transition=false;});
  }
  const onVisibility=()=>reconcile();
  visibilityTarget?.addEventListener('visibilitychange',onVisibility);
  function unlock(){
    if(disposed)return;
    try{
      if(!context){
        const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
        if(!contextFactory&&!Context)return;
        context=contextFactory?contextFactory():new Context();
        master=context.createGain();master.gain.value=.62;
        compressor=context.createDynamicsCompressor();compressor.threshold.value=-14;compressor.ratio.value=5;compressor.knee.value=18;
        master.connect(compressor).connect(context.destination);
        for(const kind of Object.keys(DURATIONS)){
          const samples=synthesizeFlightSound(kind,context.sampleRate), buffer=context.createBuffer(1,samples.length,context.sampleRate);
          buffer.copyToChannel(samples,0);buffers.set(kind,buffer);
        }
        buffers.set('origin',createStudioSignalBuffer(context,false,1));
      }
      paused=false;reconcile();
    }catch{ /* An unavailable audio device must never block the chapter. */ }
  }
  function finish(voice,stop=false){
    if(!voices.has(voice))return;
    voices.delete(voice);voice.source.onended=null;
    if(stop)try{voice.source.stop();}catch{}
    voice.source.disconnect();voice.gain.disconnect();voice.pan?.disconnect();if(bed===voice)bed=null;
  }
  function play(kind,{pan=0,volume=1,loop=false}={}){
    if(disposed||blocked()||!context||context.state!=='running'||!buffers.has(kind))return null;
    if(voices.size>=6){const oldest=[...voices].find(voice=>voice!==bed);if(oldest)finish(oldest,true);else return null;}
    const source=context.createBufferSource(),gain=context.createGain(),panner=context.createStereoPanner?.();
    source.buffer=buffers.get(kind);source.loop=loop;gain.gain.value=volume;
    if(kind==='origin'){
      const now=context.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.15);
      gain.gain.setValueAtTime(volume,now+2.6);gain.gain.linearRampToValueAtTime(0,now+3);
    }
    if(panner){panner.pan.value=Math.max(-.8,Math.min(.8,pan));source.connect(gain).connect(panner).connect(master);}else source.connect(gain).connect(master);
    const voice={source,gain,pan:panner};voices.add(voice);source.onended=()=>finish(voice);source.start();stats[kind]++;
    return voice;
  }
  function stop(){for(const voice of [...voices])finish(voice,true);}
  function reset(){stop();pulseCount=hitCount=0;boltId=-1;jumpStarted=jumpReleased=originPlayed=false;for(const key of Object.keys(stats))stats[key]=0;}
  function sync(state){
    if(disposed||blocked()||context?.state!=='running')return;
    if(state.pulses>pulseCount){pulseCount=state.pulses;play('pulse',{volume:.85});}
    if(state.hits>hitCount){hitCount=state.hits;play(state.lastDamage==='BARRERA DE LA RED'?'barrier':'hit',{volume:.8});}
    for(const bolt of state.bolts)if(bolt.id>boltId){
      boltId=bolt.id;play('drone',{volume:.56,pan:bolt.drone===0?-.65:bolt.drone===1?.65:0});
    }
    if(state.time>=132&&!originPlayed){originPlayed=true;play('origin',{volume:.16});}
    if(state.time>=ESCAPE_JUMP_START&&state.status==='playing'){
      if(!jumpStarted){jumpStarted=true;play('jumpIn',{volume:.78});bed=play('jumpLoop',{volume:0,loop:true});}
      if(bed){
        const age=state.time-ESCAPE_JUMP_START;
        const level=.53*Math.min(1,age/2)*Math.max(0,Math.min(1,(179.7-state.time)/2.7));
        bed.gain.gain.setTargetAtTime(level,context.currentTime,.12);
        bed.source.playbackRate.setTargetAtTime(1+Math.min(age,12)*.025,context.currentTime,.18);
      }
      if(state.time>=177&&!jumpReleased){jumpReleased=true;play('jumpOut',{volume:.72});}
    }
    if(state.status!=='playing'&&bed)finish(bed,true);
  }
  return {unlock,reset,stop,sync,setPaused(value){paused=!!value;reconcile();},get stats(){return {...stats,voices:voices.size,ready:context?.state==='running'};},
    dispose(){if(disposed)return;disposed=true;visibilityTarget?.removeEventListener('visibilitychange',onVisibility);stop();buffers.clear();master?.disconnect();compressor?.disconnect();context?.close().catch(()=>{});context=null;},
  };
}
