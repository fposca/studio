import { useEffect, useRef } from "react";
const screamUrl=new URL("../assets/neonboy-animaciones/club-de-rock/sonido-anomalia.mp3",import.meta.url).href;
export default function RooftopAtmosphere({phase,paused}){
  const gains=useRef(null);
  useEffect(()=>{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    let context;
    try{context=new AudioContext();}catch{return;}
    const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
    const wind=context.createBiquadFilter();wind.type="lowpass";wind.frequency.value=300;
    const rain=context.createBiquadFilter();rain.type="highpass";rain.frequency.value=1800;
    const windGain=context.createGain(),rainGain=context.createGain();
    windGain.gain.value=.055;rainGain.gain.value=.012;
    source.connect(wind);wind.connect(windGain);windGain.connect(context.destination);
    source.connect(rain);rain.connect(rainGain);rainGain.connect(context.destination);
    gains.current={context,windGain,rainGain};
    source.start();
    const resume=()=>{void context.resume().catch(()=>{});};
    window.addEventListener("pointerdown",resume,{once:true});
    return()=>{window.removeEventListener("pointerdown",resume);try{source.stop();}catch{}gains.current=null;void context.close();};
  },[]);
  useEffect(()=>{
    const g=gains.current;if(!g)return;
    const t=g.context.currentTime;
    g.windGain.gain.setTargetAtTime(paused?0:phase === "anomaly" ? 0.004 : 0.055,t,.8);
    g.rainGain.gain.setTargetAtTime(paused?0:phase === "anomaly" ? 0.001 : 0.012,t,.8);
  },[phase,paused]);
  useEffect(()=>{
    if(phase!=="anomaly"||paused)return;
    const audio=new Audio(screamUrl);audio.volume=.35;
    const timer=window.setTimeout(()=>{void audio.play().catch(()=>{});},4300);
    return()=>{window.clearTimeout(timer);audio.pause();audio.currentTime=0;};
  },[phase,paused]);
  return null;
}

