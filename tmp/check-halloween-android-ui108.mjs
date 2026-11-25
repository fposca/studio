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


const adb=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
const capture=name=>{execFileSync(adb,['shell','screencap','-p',`/sdcard/${name}.png`]);execFileSync(adb,['pull',`/sdcard/${name}.png`,`tmp/${name}.png`]);};
for(let i=0;i<30;i++){if(await evaluate(`!!document.querySelector('.halloween-start-actions')`))break;await wait(500);}
const original=await evaluate(`localStorage.getItem('neonboy-halloween-save-v2')`);
const layout=await evaluate(`({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollHeight-innerHeight,actions:[...document.querySelectorAll('.halloween-start-actions button')].map(b=>({text:b.textContent,bottom:b.getBoundingClientRect().bottom}))})`);
if(layout.overflow>1||layout.actions.some(b=>b.bottom>layout.height))throw new Error('Start screen overflow');
await wait(2000);capture('halloween-android-start-108');
await evaluate(`[...document.querySelectorAll('.halloween-start-actions button')].find(b=>b.textContent.includes('NUEVA PARTIDA')).click()`);
await wait(350);
const modal=await evaluate(`({open:document.querySelector('dialog').open,scroll:scrollY,bottom:document.querySelector('dialog').getBoundingClientRect().bottom,height:innerHeight})`);
if(!modal.open||modal.scroll!==0||modal.bottom>modal.height)throw new Error('Confirmation out of viewport');
capture('halloween-android-confirm-108');
await evaluate(`document.querySelector('.halloween-start-confirm-actions button').click()`);
if(await evaluate(`localStorage.getItem('neonboy-halloween-save-v2')`)!==original)throw new Error('Cancel changed save');
console.log('Start screen verified:',JSON.stringify({layout,modal,savePreserved:true}));
await evaluate(`document.querySelector('.halloween-start-actions .is-primary').click()`);
for(let i=0;i<120;i++){
 if(await evaluate(`!!document.querySelector('.halloween-hero-subtitle')`))break;
 await wait(250);
}
const caption=await evaluate(`(()=>{const el=document.querySelector('.halloween-hero-subtitle');if(!el)return null;const box=el.getBoundingClientRect(),controls=document.querySelector('.halloween-touch-controls').getBoundingClientRect(),hearts=document.querySelector('.halloween-combat-hearts').getBoundingClientRect();return {text:el.textContent,x:box.x,width:box.width,top:box.top,bottom:box.bottom,controlsTop:controls.top,heartsBottom:hearts.bottom,viewport:innerWidth};})()`);
if(!caption||caption.x<caption.viewport*.6||caption.bottom>=caption.controlsTop||caption.top<caption.heartsBottom)throw new Error('Caption obstructs HUD '+JSON.stringify(caption));
capture('halloween-android-caption-108');console.log('Native side caption:',JSON.stringify(caption));
ws.close();
