import {test,expect} from '@playwright/test';
import {openCity} from './citySession.js';
const repaired={vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:0,vigilanteDefeated:true,
 fuegoStarted:true,fuegoKeyDiscovered:true,fuegoKeyTaken:true,fuegoKeyInstalled:true,
 fuegoPowerTerminalExamined:true,fuegoPowerMaintenanceOpen:true,fuegoPowerCellTaken:true,fuegoPowerCellInstalled:true,
 fuegoNavigationClues:['calle','cielo','libertad'],fuegoNavigationSequence:['calle','cielo','libertad'],fuegoNavigationModuleTaken:true,fuegoNavigationModuleInstalled:true,fuegoRecordShown:true};
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('neonboy.universe.saves.v1')).slots.autosave.data);
async function launch(page){
 const city=await openCity(page,repaired,3,{x:-6,z:27,yaw:Math.PI,viewYaw:0});
 await expect(city.locator('canvas')).toHaveAttribute('data-city-escape-ready','true',{timeout:45000});
 await expect(city.locator('.studio-examine-cue')).toContainText('Iniciar sistema de vuelo');
 await city.locator('.studio-examine-cue').click();
 await expect(city.locator('.city-dialogue')).toContainText('Tenemos todo listo');
 for(let i=0;i<4;i++)await city.locator('.city-dialogue button').click();
 await expect(city.locator('.city-flight')).toHaveAttribute('data-status','playing',{timeout:15000});
 return city;
}
const telemetry=city=>city.locator('canvas').evaluate(el=>JSON.parse(el.dataset.cityFlight));
test('flight boarding, keyboard, pause, cancellation and safe reload',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.stack);});
 const city=await launch(page);
 await page.waitForTimeout(2500);await page.screenshot({path:info.outputPath('ignition.png')});
 await expect.poll(async()=>(await telemetry(city)).passengers).toBe(2);
 await expect.poll(async()=>(await telemetry(city)).time,{timeout:40000}).toBeGreaterThan(17);
 await page.keyboard.down('d');await page.waitForTimeout(750);await page.keyboard.up('d');
 expect((await telemetry(city)).lateral).toBeGreaterThan(1.5);
 await page.keyboard.press('f');await expect.poll(async()=>(await telemetry(city)).pulses).toBeGreaterThan(0);
 await page.keyboard.press('m');await expect(city.locator('.neon-universe-map')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('avenue.png')});
 await city.locator('.city-flight-toolbar').getByRole('button',{name:'Pausa',exact:true}).click();
 const before=(await telemetry(city)).time;await page.waitForTimeout(700);expect((await telemetry(city)).time-before).toBeLessThan(.1);
 await page.keyboard.press('Escape');
 await expect.poll(async()=>(await telemetry(city)).barriers.length,{timeout:30000}).toBeGreaterThan(0);
 const barrier=(await telemetry(city)).barriers[0],dodgeKey=barrier.side>0?'a':'d';
 await page.keyboard.down(dodgeKey);
 await expect.poll(async()=>-barrier.side*(await telemetry(city)).lateral).toBeGreaterThan(2.8);
 await page.keyboard.up(dodgeKey);
 await expect.poll(async()=>(await telemetry(city)).time,{timeout:15000}).toBeGreaterThan(barrier.due-.65);
 await page.screenshot({path:info.outputPath('barrier-screen-direction.png')});
 await expect.poll(async()=>(await telemetry(city)).time).toBeGreaterThan(barrier.due+.1);
 expect((await telemetry(city)).integrity).toBe(100);

 await city.getByRole('button',{name:'Volver al Fuego',exact:true}).click();
 await expect(city).toHaveAttribute('data-flight','inactive');
 const data=await saved(page);expect(data.cityProgress.fuegoFlightStarted).toBe(true);expect(data.cityProgress.completed).toBe(false);expect(data.combatHearts).toBe(3);
 expect(data.positions['buenos-aires-2049'].z).toBeCloseTo(27,0);
 await page.reload();await page.getByRole('button',{name:/comenzar/i}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(city.locator('.record-store-3d')).toHaveAttribute('data-ready','true',{timeout:90000});
 await expect(city).toHaveAttribute('data-flight','inactive');await expect(city.locator('.studio-examine-cue')).toContainText('Iniciar sistema de vuelo');
 expect(errors).toEqual([]);
});

test('a full chase can fail, retry and finish without losing repairs or hearts',async({page},info)=>{
 test.setTimeout(540000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.stack);});
 const city=await launch(page);
 await expect(city.locator('.city-flight')).toHaveAttribute('data-status','failed',{timeout:170000});
 await expect(city.getByRole('dialog',{name:'Veh\u00edculo interceptado'})).toBeVisible();
 expect((await telemetry(city)).sound.barrier).toBeGreaterThan(0);
 const before=await saved(page);expect(before.cityProgress.fuegoKeyInstalled).toBe(true);expect(before.combatHearts).toBe(3);
 await page.screenshot({path:info.outputPath('intercepted.png')});
 await city.getByRole('button',{name:'Reintentar persecuci\u00f3n'}).click();
 await expect.poll(async()=>(await telemetry(city)).integrity).toBe(100);
 let held='',shots=new Set(),start=Date.now();
 while(Date.now()-start<310000){
  const s=await page.evaluate(()=>{const canvas=document.querySelector('.neon-buenos-aires canvas');return canvas?.dataset.cityFlight?JSON.parse(canvas.dataset.cityFlight):null;});if(!s||s.status!=='playing')break;
  const barrier=s.barriers.find(b=>b.due>s.time);
  const target=barrier?-barrier.side*3:Math.sin(s.time*.9)*2.7;
  const key=Math.abs(target-s.lateral)<.3?'':target>s.lateral?'d':'a';
  if(key!==held){if(held)await page.keyboard.up(held);if(key)await page.keyboard.down(key);held=key;}
  if(s.bolts.some(b=>b.due-s.time<1.3)){
    await page.keyboard.press('f');
    if(!shots.has('pulse')){shots.add('pulse');await page.waitForTimeout(220);await page.screenshot({path:info.outputPath('defensive-pulse.png')});}
  }
  if(barrier&&barrier.due-s.time<.8&&!shots.has('barrier')){shots.add('barrier');await page.screenshot({path:info.outputPath('energy-barrier.png')});}
  if(s.bolts.length&&s.bolts[0].due-s.time>1.4&&s.bolts[0].due-s.time<1.8&&!shots.has('bolt')){shots.add('bolt');await page.screenshot({path:info.outputPath('drone-plasma.png')});}
  for(const [at,name] of [[60,'interception'],[140,'origin'],[170,'temporal']])if(s.time>=at&&!shots.has(at)){
    shots.add(at);await page.screenshot({path:info.outputPath(name+'.png')});
    if(at===170){expect(s.tunnel.visible).toBe(true);expect(s.tunnel.cityHidden).toBe(true);expect(s.tunnel.opacity).toBe(1);expect(s.sound.jumpIn).toBe(1);expect(s.sound.jumpLoop).toBe(1);}
  }
  await page.waitForTimeout(90);
 }
 if(held)await page.keyboard.up(held);
 const chapter=page.getByRole('region',{name:'Cap\u00edtulo 15, El origen de la se\u00f1al'});
 await expect(chapter).toBeVisible({timeout:20000});
 await expect(chapter.getByRole('dialog',{name:'Llegada a 1999'})).toBeVisible();
 const data=await saved(page);expect(data.cityProgress.completed).toBe(true);expect(data.cityProgress.originTransmissionRecovered).toBe(true);expect(data.cityProgress.temporalJumpUnlocked).toBe(true);expect(data.cityProgress.nextDestination).toBe('buenos-aires-1999');expect(data.chapter15Progress.arrived).toBe(true);expect(data.combatHearts).toBe(3);
 await page.screenshot({path:info.outputPath('completed.png')});expect(errors).toEqual([]);
 await page.reload();await page.getByRole('button',{name:/comenzar/i}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(chapter.locator('.record-store-3d')).toHaveAttribute('data-ready','true',{timeout:90000});
 await expect(chapter.getByLabel('Objetivo del cap\u00edtulo 15')).toContainText('Hugo');
});

test('Android-sized touch controls steer the flight and stay clear of captions',async({browser},info)=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 12; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'});const page=await context.newPage();
 await page.addInitScript(()=>{Object.defineProperty(navigator,'deviceMemory',{get:()=>4});Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4});});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.stack);});const city=await launch(page);
 await expect.poll(async()=>(await telemetry(city)).time,{timeout:40000}).toBeGreaterThan(18);
 const right=city.getByRole('button',{name:'Volar a la derecha'}),box=await right.boundingBox(),cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:7}]});await page.waitForTimeout(850);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect((await telemetry(city)).lateral).toBeGreaterThan(1.5);
 await city.locator('.city-flight-pulse').tap();await expect.poll(async()=>(await telemetry(city)).pulses).toBeGreaterThan(0);
 await expect.poll(async()=>(await telemetry(city)).sound.pulse).toBeGreaterThan(0);
 await city.locator('.city-flight-toolbar').getByRole('button',{name:'Pausa',exact:true}).tap();
 await expect.poll(async()=>(await telemetry(city)).sound.ready).toBe(false);
 await page.keyboard.press('Escape');await expect.poll(async()=>(await telemetry(city)).sound.ready).toBe(true);
 const boxes=await city.locator('.city-flight-controls button').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
 for(const b of boxes){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(844);expect(b.bottom).toBeLessThanOrEqual(390);}
 const caption=await city.locator('.city-flight-caption').boundingBox(), controls=await city.locator('.city-flight-controls').boundingBox();if(caption)expect(caption.y+caption.height).toBeLessThan(controls.y);
 await page.screenshot({path:info.outputPath('flight-mobile.png')});
 expect(await page.evaluate(async()=> (await import('/src/game/cathedralQuality.js')).initialCathedralTier())).toBe('low');
 const tier=await city.locator('canvas').getAttribute('data-city-quality');
 const timing=await page.evaluate(()=>new Promise(resolve=>{let times=[];function sample(t){times.push(t);if(times.length===91)resolve({frames:90,ms:times.at(-1)-times[0],fps:90000/(times.at(-1)-times[0])});else requestAnimationFrame(sample);}requestAnimationFrame(sample);}));console.log('ANDROID UA / DESKTOP TOUCH EMULATION',JSON.stringify({tier,...timing}));
 const c=await context.newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:7}]});await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 for(const size of [{width:640,height:360},{width:390,height:844}]){await page.setViewportSize(size);await page.waitForTimeout(300);const b=await city.locator('.city-flight-controls').boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(size.width);expect(b.y+b.height).toBeLessThanOrEqual(size.height);}
 expect(errors).toEqual([]);await context.close();
});
