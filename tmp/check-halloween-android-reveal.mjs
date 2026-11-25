const targets=await (await fetch('http://127.0.0.1:9224/json')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0;const waits=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){waits.get(m.id)(m.result);waits.delete(m.id);}};
const evaluate=expression=>new Promise(resolve=>{const next=++id;waits.set(next,r=>resolve(r.result?.value));ws.send(JSON.stringify({id:next,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));});
await evaluate(`document.querySelector('.halloween-guide-current button')?.click()`);
await new Promise(r=>setTimeout(r,1700));
console.log('Android reveal:',await evaluate(`document.querySelector('canvas.halloween-scene-canvas')?.dataset.guideCamera`));
for(let i=0;i<25;i++){if(!(await evaluate(`!!document.querySelector('.halloween-chest-reveal')`)))break;await new Promise(r=>setTimeout(r,500));}
console.log('Camera after reveal:',await evaluate(`document.querySelector('canvas.halloween-scene-canvas')?.dataset.guideCamera`));
await evaluate(`document.querySelector('.halloween-objective')?.click()`);
console.log('Ready for user:',await evaluate(`!!document.querySelector('.halloween-guide-panel')`));ws.close();
