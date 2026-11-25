const targets=await (await fetch('http://127.0.0.1:9224/json')).json();
const page=targets.find(t=>t.type==='page');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}};
const send=(method,params)=>new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw r.exceptionDetails;return r.result.value;};
console.log('Android WebView:',page.url);
await evaluate(`document.querySelector('.halloween-start-actions .is-primary')?.click()`);
for(let i=0;i<45;i++) {if(await evaluate(`!!document.querySelector('.halloween-objective')`))break;await new Promise(r=>setTimeout(r,1000));}
console.log(await evaluate(`JSON.stringify({objective:document.querySelector('.halloween-objective strong')?.textContent,viewport:[innerWidth,innerHeight],loading:document.querySelector('.halloween-loading-card p')?.textContent})`));
await evaluate(`document.querySelector('.halloween-objective')?.click()`);
console.log('Guide open:',await evaluate(`!!document.querySelector('.halloween-guide-panel')`));
ws.close();
