import { test, expect } from "@playwright/test";

for (const tier of ["high", "low"]) test(`Vigilante ${tier}: real clips, orb, shield nodes, defeat and the original escape car`, async ({ page }, testInfo) => {
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error"||/Vigilante:|PropertyBinding/.test(m.text()))errors.push(m.text());});
  await page.route("**/vigilante-harness",route=>route.fulfill({contentType:"text/html",body:'<html><body style="margin:0;background:#07111f"><canvas></canvas></body></html>'}));
  await page.goto("/vigilante-harness");
  const setup=await page.evaluate(async tier=>{
    const THREE=await import("/node_modules/three/build/three.module.js");
    const {buildBuenosAires}=await import("/src/game/buenosAiresScenery.js");
    const {normalizeBuenosAiresProgress,advanceBuenosAires}=await import("/src/game/buenosAiresQuest.js");
    const {createNeonOrbAbility}=await import("/src/game/neonOrbAbility.js");
    const {createBuenosAiresReflectionMap}=await import("/src/game/buenosAiresReflections.js");
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight());
    const renderer=new THREE.WebGLRenderer({canvas:document.querySelector("canvas"),antialias:true});renderer.setSize(1200,800);renderer.setPixelRatio(1);
    renderer.shadowMap.enabled=tier!=="low";renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
    const source=createBuenosAiresReflectionMap(),pmrem=new THREE.PMREMGenerator(renderer);
    const environment=pmrem.fromEquirectangular(source);scene.environment=environment.texture;source.dispose();pmrem.dispose();
    let p=normalizeBuenosAiresProgress({entered:true,introSeen:true,disconnectedMet:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true},true);
    const player={x:0,y:0,z:22},events=[],animations=new Set();let elapsed=0,damage=0;
    const city=buildBuenosAires(scene,{tier,onEvent:event=>{events.push(event);p=advanceBuenosAires(p,event);},onDamage:()=>damage++});
    const camera=new THREE.PerspectiveCamera(54,1.5,.1,260);camera.position.set(2,3,26);camera.lookAt(-6,1.1,18);
    const orb=createNeonOrbAbility(scene,{getTargets:()=>city.getTargets(p),getColliders:()=>city.colliders,getMaxRange:()=>27,onHit:target=>city.registerImpact(target,p)});
    const tick=(n=1,paused=false)=>{for(let i=0;i<n;i++){elapsed+=.05;city.update(.05,elapsed,p,player,paused,camera);animations.add(city.vigilante.animation);}};
    const emit=event=>{p=advanceBuenosAires(p,event);};
    const render=()=>renderer.render(scene,camera);
    const fire=target=>{
      const start={x:player.x,y:0,z:player.z};
      if(!orb.fire(start,Math.atan2(target.x-start.x,target.z-start.z)))throw Error("Orb not ready");
      for(let i=0;i<130;i++)orb.update(.04,start,i*.04);
    };
    await Promise.all([city.vigilante.loadAssets(),city.flyingVehicles.ready]);
    const initialModelCount=city.vigilante.body.children.filter(o=>o.isGroup&&o.children.some(c=>c.name==="Vigilante / Meshy optimizado")).length;
    const car=city.flyingVehicles.vehicles.find(v=>v.route.id==="renault-fuego"),carId=car.modelPivot.children[0].uuid;
    tick(150);
    const appeared=events.includes("vigilante-encounter"),intro=events.includes("vigilante-intro-dialogue");
    Object.assign(player,{x:8,z:25});emit("vigilante-start");tick(90);
    // Stationary player must actually be struck; movement remains free between attacks.
    tick(200);const liveDamage=damage;
    const before={x:city.vigilante.state.x,z:city.vigilante.state.z,age:city.vigilante.state.age};tick(20,true);
    const frozen=before.x===city.vigilante.state.x&&before.z===city.vigilante.state.z&&before.age===city.vigilante.state.age;
    // Exercise the melee clip at a real legal distance, then freeze pursuit for aimed orb checks.
    Object.assign(player,{x:city.vigilante.state.x+2,z:city.vigilante.state.z});tick(140);
    city.vigilante.state.cooldown=1000;
    Object.assign(player,{x:city.vigilante.state.x,z:Math.min(25,city.vigilante.state.z+5)});
    tick(60);
    for(let i=0;i<4;i++){fire({x:city.vigilante.state.x,z:city.vigilante.state.z});tick(20);}
    const shieldHealth=p.vigilanteHealth;
    fire({x:city.vigilante.state.x,z:city.vigilante.state.z});
    const blocked=p.vigilanteHealth===shieldHealth&&events.includes("vigilante-blocked");
    emit("vigilante-phase-seen");tick();render();
    window.vigilanteReview={THREE,scene,city,renderer,camera,environment,orb,player,events,animations,tick,fire,emit,render,carId,get progress(){return p;}};
    return {loaded:city.vigilante.loaded,ready:city.vigilante.ready,initialModelCount,appeared,intro,liveDamage,frozen,shieldHealth,blocked,animations:[...animations],nodeCount:city.getTargets(p).filter(t=>t.kind==="vigilante-node").length};
  },tier);
  await page.screenshot({path:testInfo.outputPath(`vigilante-shield-${tier}.png`)});
  expect(setup.ready&&setup.appeared&&setup.intro&&setup.frozen&&setup.blocked).toBe(true);
  expect(setup.loaded).toEqual(["respira","walk","ranged","melee","hurt","death"]);
  expect(setup.initialModelCount).toBe(1);expect(setup.liveDamage).toBeGreaterThan(0);
  expect(setup.shieldHealth).toBe(4);expect(setup.nodeCount).toBe(0);
  expect(setup.animations).toEqual(expect.arrayContaining(["walk","ranged","melee","hurt"]));
  const vision=await page.evaluate(()=>{
    const v=window.vigilanteReview;v.emit("vision-toggle");v.tick();
    v.camera.position.set(3,4,27);v.camera.lookAt(0,1,16);v.render();
    return v.city.getTargets(v.progress).filter(t=>t.kind==="vigilante-node").length;
  });
  expect(vision).toBe(3);await page.screenshot({path:testInfo.outputPath(`vigilante-matrix-${tier}.png`)});
  const defeated=await page.evaluate(()=>{
    const v=window.vigilanteReview;
    for(const node of v.city.vigilante.nodes){
      Object.assign(v.player,{x:node.x,z:node.z<20?node.z+3:node.z-3});v.tick();v.fire(node.position);v.tick();
    }
    const nodes=[...v.progress.vigilanteNodes],shieldVisible=v.city.vigilante.body.getObjectByName("Vigilante / escudo de la Red").visible;
    Object.assign(v.player,{x:v.city.vigilante.state.x,z:Math.min(25,v.city.vigilante.state.z+5)});
    for(let i=0;i<4;i++){v.fire({x:v.city.vigilante.state.x,z:v.city.vigilante.state.z});v.tick(20);}
    v.tick(20);v.camera.position.set(v.city.vigilante.state.x+3,2.7,v.city.vigilante.state.z+5);v.camera.lookAt(v.city.vigilante.state.x,1,v.city.vigilante.state.z);v.render();
    return {nodes,shieldVisible,health:v.progress.vigilanteHealth,animation:v.city.vigilante.animation,bullets:v.city.vigilante.state.projectiles.filter(p=>p.active).length};
  });
  await page.screenshot({path:testInfo.outputPath(`vigilante-death-${tier}.png`)});
  expect(defeated.nodes).toEqual(["oeste","este","sur"]);expect(defeated.shieldVisible).toBe(false);
  expect(defeated.health).toBe(0);expect(defeated.animation).toBe("death");expect(defeated.bullets).toBe(0);
  const escape=await page.evaluate(()=>{
    const v=window.vigilanteReview;v.tick(70);
    const defeatDialogue=v.events.includes("vigilante-defeat-dialogue");v.emit("vigilante-defeated");v.tick();
    const escapeDialogue=v.events.includes("escape-dialogue");v.emit("escape-briefed");v.tick(600);
    const car=v.city.flyingVehicles.vehicles.find(x=>x.route.id==="renault-fuego");
    v.camera.position.set(-1,3.6,29);v.camera.lookAt(v.city.flyingVehicles.escapeParking.x,1.4,23);v.render();
    return {defeatDialogue,escapeDialogue,progress:v.progress,ready:v.city.flyingVehicles.escapeReady,sameCar:car.modelPivot.children[0].uuid===v.carId,carPosition:car.group.position.toArray(),solid:!v.city.flyingVehicles.canStand(v.city.flyingVehicles.escapeParking.x,23),visibleBoss:v.city.vigilante.body.visible};
  });
  await page.screenshot({path:testInfo.outputPath(`vigilante-escape-${tier}.png`)});
  expect(escape.defeatDialogue&&escape.ready&&escape.sameCar&&escape.solid).toBe(true);
  expect(escape.escapeDialogue).toBe(false);
  expect(escape.visibleBoss).toBe(false);expect(escape.progress.record1999Found).toBe(true);
  expect(escape.progress.escapeUnlocked).toBe(false);expect(escape.progress.escapeBriefed).toBe(false);
  expect(escape.progress.completed).not.toBe(true);
  const remaining=await page.evaluate(()=>{
    const v=window.vigilanteReview;v.orb.dispose();v.city.dispose();v.environment.dispose();v.scene.environment=null;v.render();const n=v.renderer.info.memory.geometries;v.renderer.dispose();return n;
  });
  expect(remaining).toBe(0);expect(errors).toEqual([]);
  await testInfo.attach("combat-results",{body:JSON.stringify({setup,defeated,escape}),contentType:"application/json"});
});
