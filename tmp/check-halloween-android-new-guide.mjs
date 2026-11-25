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
await evaluate(`document.querySelector('.halloween-start-actions .is-primary')?.click()`);
for(let i=0;i<45;i++){if(await evaluate(`!!document.querySelector('.halloween-objective') && !document.querySelector('.halloween-loading-card')`))break;await wait(1000);}
console.log('Native view:',await evaluate(`({viewport:[innerWidth,innerHeight],objective:document.querySelector('.halloween-objective strong')?.textContent,preview:document.querySelector('.halloween-chest-reveal')?.dataset.reveal})`));
await evaluate(`document.querySelector('.halloween-chest-reveal button')?.click()`);
await wait(350);
await evaluate(`document.querySelector('.halloween-guide-nav')?.click()`);
await wait(500);
console.log('Guide:',await evaluate(`({open:!!document.querySelector('.halloween-guide-panel'),people:document.querySelectorAll('.halloween-guide-people li').length,available:[...document.querySelectorAll('.halloween-guide-current button')].map(e=>e.textContent)})`));
const hasDemon=await evaluate(`!![...document.querySelectorAll('.halloween-guide-current button')].find(e=>e.textContent.includes('semidemonio'))`);
if(hasDemon){await evaluate(`[...document.querySelectorAll('.halloween-guide-current button')].find(e=>e.textContent.includes('semidemonio')).click()`);}
else {await evaluate(`document.querySelector('.halloween-guide-people summary')?.click();document.querySelector('.halloween-guide-people button')?.click()`);}
await wait(1900);
console.log('Native camera:',await evaluate(`({kind:document.querySelector('canvas.halloween-scene-canvas')?.dataset.guideCamera,copy:document.querySelector('.halloween-chest-reveal strong')?.textContent,controls:document.querySelectorAll('.halloween-touch-controls').length,cardBottom:document.querySelector('.halloween-chest-reveal')?.getBoundingClientRect().bottom,height:innerHeight})`));
const adb=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
execFileSync(adb,['-s','emulator-5554','shell','screencap','-p','/sdcard/neonboy-people-guide.png']);
execFileSync(adb,['-s','emulator-5554','pull','/sdcard/neonboy-people-guide.png','tmp/halloween-android-people-real.png']);
const screenshot=await send('Page.captureScreenshot',{format:'jpeg',quality:80,fromSurface:true});
writeFileSync('tmp/halloween-android-new-guide.jpg',Buffer.from(screenshot.data,'base64'));
await evaluate(`document.querySelector('.halloween-chest-reveal button')?.click()`);
await wait(450);
console.log('Return:',await evaluate(`({camera:document.querySelector('canvas.halloween-scene-canvas')?.dataset.guideCamera,controls:document.querySelectorAll('.halloween-touch-controls').length})`));
ws.close();
