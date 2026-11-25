import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const targets=await (await fetch('http://127.0.0.1:9224/json')).json();
const target=targets.find(t=>t.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}};
const send=(method,params)=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw r.exceptionDetails;return r.result.value;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

const before=await evaluate(`JSON.parse(localStorage.getItem('neonboy-halloween-save-v2'))?.record?.progress`);
await evaluate(`document.querySelector('.halloween-start-actions .is-primary')?.click()`);
for(let i=0;i<90;i++){
 if(await evaluate(`!!document.querySelector('.halloween-welcome-tour')`))break;
 await wait(1000);
}
const steps=new Set();let captured=false;
for(let i=0;i<100;i++){
 const state=await evaluate(`({step:document.querySelector('.halloween-welcome-tour')?.dataset.step,controls:document.querySelectorAll('.halloween-touch-controls').length,viewport:[innerWidth,innerHeight]})`);
 if(!state.step)break;
 if(state.controls)throw new Error('Controls active during tour');
 if(!steps.has(state.step)){steps.add(state.step);console.log('Tour step:',JSON.stringify(state));}
 if(state.step==='instrumental'&&!captured){
  captured=true;await wait(2900);
  const adb=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
  execFileSync(adb,['-s','emulator-5554','shell','screencap','-p','/sdcard/neonboy-welcome-tour.png']);
  execFileSync(adb,['-s','emulator-5554','pull','/sdcard/neonboy-welcome-tour.png','tmp/halloween-android-welcome.png']);
 }
 await wait(500);
}
const result=await evaluate(`({camera:document.querySelector('canvas.halloween-scene-canvas')?.dataset.guideCamera,controls:document.querySelectorAll('.halloween-touch-controls').length,seen:JSON.parse(localStorage.getItem('neonboy-halloween-save-v2'))?.record?.progress?.guideSeen,progress:JSON.parse(localStorage.getItem('neonboy-halloween-save-v2'))?.record?.progress})`);
if(steps.size!==5||result.camera!=='player'||result.controls!==1||!result.seen.includes('welcome'))throw new Error('Native tour incomplete '+JSON.stringify({steps:[...steps],...result}));
for(const key of ['hearts','demonHealth','vhsCollected','phoneCalls','songs','discoveredSecrets','chest'])if(before&&JSON.stringify(before[key])!==JSON.stringify(result.progress[key]))throw new Error('Progress changed: '+key);
console.log('Native result:',JSON.stringify({steps:[...steps],camera:result.camera,controls:result.controls,seen:result.seen,progressPreserved:true}));
await evaluate(`document.querySelector('.halloween-guide-nav')?.click()`);
ws.close();
