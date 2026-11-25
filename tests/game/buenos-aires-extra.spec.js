import { test, expect } from '@playwright/test';

test('new Buenos Aires actors and street cars match scale, collide and keep flying', async ({ page }, testInfo) => {
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.route('**/city-extra-harness', route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><canvas></canvas></body></html>'}));
  await page.goto('/city-extra-harness');
  const result=await page.evaluate(async () => {
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const {MeshoptDecoder}=await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
    const {buildBuenosAires}=await import('/src/game/buenosAiresScenery.js');
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight());
    const city=buildBuenosAires(scene,{tier:'high'});
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    await Promise.all([city.actors.load(loader),city.groundVehicles.ready,city.flyingVehicles.ready]);
    const player={x:0,z:42},progress={introSeen:true,citizens:[]};
    const camera=new THREE.PerspectiveCamera(60,16/9,.1,230);
    const actors=[];
    for(const type of ['fatman','oldman','parrotman']) {
      const actor=city.actors.actors.find(a=>a.config.type===type);
      player.x=actor.root.position.x+2.5;player.z=actor.root.position.z+2.5;
      for(let i=0;i<5;i++) city.update(.1,i*.1,progress,player,false,camera);
      const size=actor.pivot?new THREE.Box3().setFromObject(actor.pivot).getSize(new THREE.Vector3()).y:0;
      actors.push({type,model:!!actor.model,height:size,blocked:!city.canStand(actor.root.position.x,actor.root.position.z,
        actor.root.position.x+2,actor.root.position.z+2)});
    }
    player.x=0;player.z=42;
    const ground=city.groundVehicles.cars.map(car=>({loaded:car.loaded,modelIndex:car.config.modelIndex,loop:car.config.loop,visible:car.group.visible,
      length:car.halfLength*2,solid:!city.canStand(car.group.position.x,car.group.position.z,
        car.group.position.x+4,car.group.position.z+4)}));
    const mover=city.groundVehicles.cars[3];
    const before=mover.group.position.clone();
    const next=mover.curve.getPointAt(((mover.distance+.1*mover.route.speed)%mover.length)/mover.length);
    player.x=next.x;player.z=next.z;
    city.groundVehicles.update(.1,player,false);
    const yields=mover.group.position.distanceTo(before)<.001;
    player.x=0;player.z=42;
    for(let i=0;i<500;i++) city.update(.1,i*.1,progress,player,false,camera);
    const flying=city.flyingVehicles.vehicles.map(v=>({id:v.route.id,loaded:v.loaded,visible:v.group.visible}));
    const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});
    renderer.setSize(1280,720);renderer.toneMapping=THREE.ACESFilmicToneMapping;
    scene.add(new THREE.DirectionalLight(0xe0ecff,1.4));
    camera.aspect=1280/720;camera.position.set(0,8,76);camera.lookAt(0,1,34);camera.updateProjectionMatrix();
    renderer.render(scene,camera);window.extraPreview={city,renderer,scene,camera};
    return {actors,ground,yields,flying};
  });
  await testInfo.attach('extra-actors-cars', {body:JSON.stringify(result),contentType:'application/json'});
  expect(result.actors).toHaveLength(3);
  for(const actor of result.actors) {
    expect(actor.model).toBe(true);expect(actor.height).toBeGreaterThan(1.45);
    expect(actor.height).toBeLessThan(2.15);expect(actor.blocked).toBe(true);
  }
  expect(result.ground).toHaveLength(16);
  expect([0,1,2,3].map(index=>result.ground.filter(car=>car.modelIndex===index).length)).toEqual([4,4,4,4]);
  expect(result.ground.every(car=>car.visible)).toBe(true);
  for(const car of result.ground) {
    expect(car.loaded).toBe(true);expect(car.length).toBeGreaterThan(4.5);
    expect(car.length).toBeLessThan(4.8);expect(car.solid).toBe(true);
  }
  expect(result.yields).toBe(true);
  expect(result.flying).toHaveLength(3);
  expect(result.flying.every(car=>car.loaded&&car.visible)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('new-street-cars-and-crowd.png')});
  await page.evaluate(()=>{const {city,renderer}=window.extraPreview;city.dispose();renderer.dispose();});
  expect(errors).toEqual([]);
});
