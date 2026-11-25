# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buenos-aires-vigilante.spec.js >> Vigilante low: real clips, orb, shield nodes, defeat and the original escape car
- Location: tests\game\buenos-aires-vigilante.spec.js:3:37

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

Expected: ArrayContaining ["walk", "ranged", "melee", "hurt"]
Received: ["walk", "idle", "melee", "hurt"]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | for (const tier of ["high", "low"]) test(`Vigilante ${tier}: real clips, orb, shield nodes, defeat and the original escape car`, async ({ page }, testInfo) => {
  4   |   const errors=[];
  5   |   page.on("pageerror",e=>errors.push(e.message));
  6   |   page.on("console",m=>{if(m.type()==="error"||/Vigilante:|PropertyBinding/.test(m.text()))errors.push(m.text());});
  7   |   await page.route("**/vigilante-harness",route=>route.fulfill({contentType:"text/html",body:'<html><body style="margin:0;background:#07111f"><canvas></canvas></body></html>'}));
  8   |   await page.goto("/vigilante-harness");
  9   |   const setup=await page.evaluate(async tier=>{
  10  |     const THREE=await import("/node_modules/three/build/three.module.js");
  11  |     const {buildBuenosAires}=await import("/src/game/buenosAiresScenery.js");
  12  |     const {normalizeBuenosAiresProgress,advanceBuenosAires}=await import("/src/game/buenosAiresQuest.js");
  13  |     const {createNeonOrbAbility}=await import("/src/game/neonOrbAbility.js");
  14  |     const {createBuenosAiresReflectionMap}=await import("/src/game/buenosAiresReflections.js");
  15  |     const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight());
  16  |     const renderer=new THREE.WebGLRenderer({canvas:document.querySelector("canvas"),antialias:true});renderer.setSize(1200,800);renderer.setPixelRatio(1);
  17  |     renderer.shadowMap.enabled=tier!=="low";renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  18  |     renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
  19  |     const source=createBuenosAiresReflectionMap(),pmrem=new THREE.PMREMGenerator(renderer);
  20  |     const environment=pmrem.fromEquirectangular(source);scene.environment=environment.texture;source.dispose();pmrem.dispose();
  21  |     let p=normalizeBuenosAiresProgress({entered:true,introSeen:true,disconnectedMet:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true},true);
  22  |     const player={x:0,y:0,z:22},events=[],animations=new Set();let elapsed=0,damage=0;
  23  |     const city=buildBuenosAires(scene,{tier,onEvent:event=>{events.push(event);p=advanceBuenosAires(p,event);},onDamage:()=>damage++});
  24  |     const camera=new THREE.PerspectiveCamera(54,1.5,.1,260);camera.position.set(2,3,26);camera.lookAt(-6,1.1,18);
  25  |     const orb=createNeonOrbAbility(scene,{getTargets:()=>city.getTargets(p),getColliders:()=>city.colliders,getMaxRange:()=>27,onHit:target=>city.registerImpact(target,p)});
  26  |     const tick=(n=1,paused=false)=>{for(let i=0;i<n;i++){elapsed+=.05;city.update(.05,elapsed,p,player,paused,camera);animations.add(city.vigilante.animation);}};
  27  |     const emit=event=>{p=advanceBuenosAires(p,event);};
  28  |     const render=()=>renderer.render(scene,camera);
  29  |     const fire=target=>{
  30  |       const start={x:player.x,y:0,z:player.z};
  31  |       if(!orb.fire(start,Math.atan2(target.x-start.x,target.z-start.z)))throw Error("Orb not ready");
  32  |       for(let i=0;i<130;i++)orb.update(.04,start,i*.04);
  33  |     };
  34  |     await Promise.all([city.vigilante.loadAssets(),city.flyingVehicles.ready]);
  35  |     const initialModelCount=city.vigilante.body.children.filter(o=>o.isGroup&&o.children.some(c=>c.name==="Vigilante / Meshy optimizado")).length;
  36  |     const car=city.flyingVehicles.vehicles.find(v=>v.route.id==="renault-fuego"),carId=car.modelPivot.children[0].uuid;
  37  |     tick(150);
  38  |     const appeared=events.includes("vigilante-encounter"),intro=events.includes("vigilante-intro-dialogue");
  39  |     emit("vigilante-start");tick(90);
  40  |     // Stationary player must actually be struck; movement remains free between attacks.
  41  |     tick(200);const liveDamage=damage;
  42  |     const before={x:city.vigilante.state.x,z:city.vigilante.state.z,age:city.vigilante.state.age};tick(20,true);
  43  |     const frozen=before.x===city.vigilante.state.x&&before.z===city.vigilante.state.z&&before.age===city.vigilante.state.age;
  44  |     // Exercise the melee clip at a real legal distance, then freeze pursuit for aimed orb checks.
  45  |     Object.assign(player,{x:city.vigilante.state.x+2,z:city.vigilante.state.z});tick(140);
  46  |     city.vigilante.state.cooldown=1000;
  47  |     Object.assign(player,{x:city.vigilante.state.x,z:Math.min(25,city.vigilante.state.z+5)});
  48  |     tick(60);
  49  |     for(let i=0;i<4;i++){fire({x:city.vigilante.state.x,z:city.vigilante.state.z});tick(20);}
  50  |     const shieldHealth=p.vigilanteHealth;
  51  |     fire({x:city.vigilante.state.x,z:city.vigilante.state.z});
  52  |     const blocked=p.vigilanteHealth===shieldHealth&&events.includes("vigilante-blocked");
  53  |     emit("vigilante-phase-seen");tick();render();
  54  |     window.vigilanteReview={THREE,scene,city,renderer,camera,environment,orb,player,events,animations,tick,fire,emit,render,carId,get progress(){return p;}};
  55  |     return {loaded:city.vigilante.loaded,ready:city.vigilante.ready,initialModelCount,appeared,intro,liveDamage,frozen,shieldHealth,blocked,animations:[...animations],nodeCount:city.getTargets(p).filter(t=>t.kind==="vigilante-node").length};
  56  |   },tier);
  57  |   await page.screenshot({path:testInfo.outputPath(`vigilante-shield-${tier}.png`)});
  58  |   expect(setup.ready&&setup.appeared&&setup.intro&&setup.frozen&&setup.blocked).toBe(true);
  59  |   expect(setup.loaded).toEqual(["respira","walk","ranged","melee","hurt","death"]);
  60  |   expect(setup.initialModelCount).toBe(1);expect(setup.liveDamage).toBeGreaterThan(0);
  61  |   expect(setup.shieldHealth).toBe(4);expect(setup.nodeCount).toBe(0);
> 62  |   expect(setup.animations).toEqual(expect.arrayContaining(["walk","ranged","melee","hurt"]));
      |                            ^ Error: expect(received).toEqual(expected) // deep equality
  63  |   const vision=await page.evaluate(()=>{
  64  |     const v=window.vigilanteReview;v.emit("vision-toggle");v.tick();
  65  |     v.camera.position.set(3,4,27);v.camera.lookAt(0,1,16);v.render();
  66  |     return v.city.getTargets(v.progress).filter(t=>t.kind==="vigilante-node").length;
  67  |   });
  68  |   expect(vision).toBe(3);await page.screenshot({path:testInfo.outputPath(`vigilante-matrix-${tier}.png`)});
  69  |   const defeated=await page.evaluate(()=>{
  70  |     const v=window.vigilanteReview;
  71  |     for(const node of v.city.vigilante.nodes){
  72  |       Object.assign(v.player,{x:node.x,z:node.z<20?node.z+3:node.z-3});v.tick();v.fire(node.position);v.tick();
  73  |     }
  74  |     const nodes=[...v.progress.vigilanteNodes],shieldVisible=v.city.vigilante.body.getObjectByName("Vigilante / escudo de la Red").visible;
  75  |     Object.assign(v.player,{x:v.city.vigilante.state.x,z:Math.min(25,v.city.vigilante.state.z+5)});
  76  |     for(let i=0;i<4;i++){v.fire({x:v.city.vigilante.state.x,z:v.city.vigilante.state.z});v.tick(20);}
  77  |     v.tick(20);v.camera.position.set(v.city.vigilante.state.x+3,2.7,v.city.vigilante.state.z+5);v.camera.lookAt(v.city.vigilante.state.x,1,v.city.vigilante.state.z);v.render();
  78  |     return {nodes,shieldVisible,health:v.progress.vigilanteHealth,animation:v.city.vigilante.animation,bullets:v.city.vigilante.state.projectiles.filter(p=>p.active).length};
  79  |   });
  80  |   await page.screenshot({path:testInfo.outputPath(`vigilante-death-${tier}.png`)});
  81  |   expect(defeated.nodes).toEqual(["oeste","este","sur"]);expect(defeated.shieldVisible).toBe(false);
  82  |   expect(defeated.health).toBe(0);expect(defeated.animation).toBe("death");expect(defeated.bullets).toBe(0);
  83  |   const escape=await page.evaluate(()=>{
  84  |     const v=window.vigilanteReview;v.tick(70);
  85  |     const defeatDialogue=v.events.includes("vigilante-defeat-dialogue");v.emit("vigilante-defeated");v.tick();
  86  |     const escapeDialogue=v.events.includes("escape-dialogue");v.emit("escape-briefed");v.tick(600);
  87  |     const car=v.city.flyingVehicles.vehicles.find(x=>x.route.id==="renault-fuego");
  88  |     v.camera.position.set(-1,3.6,29);v.camera.lookAt(v.city.flyingVehicles.escapeParking.x,1.4,23);v.render();
  89  |     return {defeatDialogue,escapeDialogue,progress:v.progress,ready:v.city.flyingVehicles.escapeReady,sameCar:car.modelPivot.children[0].uuid===v.carId,carPosition:car.group.position.toArray(),solid:!v.city.flyingVehicles.canStand(v.city.flyingVehicles.escapeParking.x,23),visibleBoss:v.city.vigilante.body.visible};
  90  |   });
  91  |   await page.screenshot({path:testInfo.outputPath(`vigilante-escape-${tier}.png`)});
  92  |   expect(escape.defeatDialogue&&escape.escapeDialogue&&escape.ready&&escape.sameCar&&escape.solid).toBe(true);
  93  |   expect(escape.visibleBoss).toBe(false);expect(escape.progress.record1999Found&&escape.progress.escapeUnlocked).toBe(true);
  94  |   expect(escape.progress.completed).not.toBe(true);
  95  |   const remaining=await page.evaluate(()=>{
  96  |     const v=window.vigilanteReview;v.orb.dispose();v.city.dispose();v.environment.dispose();v.scene.environment=null;v.render();const n=v.renderer.info.memory.geometries;v.renderer.dispose();return n;
  97  |   });
  98  |   expect(remaining).toBe(0);expect(errors).toEqual([]);
  99  |   await testInfo.attach("combat-results",{body:JSON.stringify({setup,defeated,escape}),contentType:"application/json"});
  100 | });
  101 | 
```