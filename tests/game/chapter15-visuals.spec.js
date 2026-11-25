import { test, expect } from "@playwright/test";

async function fixture(page, mode) {
  await page.route("**/__chapter15-visuals", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0;background:#101018"></body></html>' }));
  await page.goto("/__chapter15-visuals");
  return page.evaluate(async mode => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { createChapter15Visuals } = await import("/src/game/chapter15Visuals.js");
    const { disposeObjects } = await import("/src/game/disposeGameObjects.js");
    const { RoomEnvironment } = await import("/node_modules/three/examples/jsm/environments/RoomEnvironment.js");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x17121d); scene.fog = new THREE.Fog(0x201724, 20, 48);
    scene.add(new THREE.HemisphereLight(0xd7cfe3, 0x554234, .88));
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1280, 800); renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06;
    document.body.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04); scene.environment = environment.texture;
    pmrem.dispose(); room.dispose();
    let base;
    if (mode === "studio") {
      const { buildRecordingStudio } = await import("/src/game/recordingStudioScenery.js");
      base = buildRecordingStudio(scene);
    } else {
      const { buildRecordStore } = await import("/src/game/recordStoreScenery.js");
      const { STORE_ALBUM_POSITIONS, STORE_OBSTACLES } = await import("/src/game/recordStoreLayout.js");
      // Use real catalog covers and real playable album targets.
      const { DISCOGRAPHY_ALBUMS: albums } = await import("/src/game/discographyCatalog.js");
      base = buildRecordStore(scene, albums, STORE_ALBUM_POSITIONS, STORE_OBSTACLES);
      await base.ready;
    }
    const original = [];
    scene.traverse(o => { if (o.isMesh) original.push({ o, geometry: o.geometry, material: o.material, position: o.position.clone(), scale: o.scale.clone() }); });
    const visual = createChapter15Visuals(scene, mode, base, "high");
    let evidence = null;
    if (mode === "studio") {
      const { createChapter15Evidence } = await import("/src/game/chapter15Evidence.js");
      evidence = createChapter15Evidence(base, [{id: "ch15-note"}, {id: "ch15-tape"}]);
      const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
      const { loadStudioAssets, loadStudioAssetTransforms } = await import("/src/game/studioAssets.js");
      const transforms = loadStudioAssetTransforms();
      await loadStudioAssets(base, new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), () => transforms, () => true);
      visual.onStudioAssetsLoaded(); evidence.settle();
    } else {
      const { createChapter15StoreEvidence } = await import("/src/game/chapter15StoreEvidence.js");
      evidence = createChapter15StoreEvidence(base, ["tito","roxy","rulo"].map(id=>({id:"ch15-evidence-"+id})), []);
    }
    const camera = new THREE.PerspectiveCamera(57, 1280 / 800, .05, 75);
    const render = (position, target) => { camera.position.set(...position); camera.lookAt(...target); renderer.render(scene, camera); };
    const progress = { arrived: true, hugoConsulted: true };
    visual.update(.05, progress, false, false);
    render(mode === "studio" ? [7.5, 4.6, 6.8] : [-5.3, 3.1, 12.4], mode === "studio" ? [0, 1.1, -5.6] : [-8, 1.8, 4]);
    const pixels = () => {
      renderer.render(scene, camera);
      const copy = document.createElement("canvas"); copy.width = 320; copy.height = 200;
      const ctx = copy.getContext("2d"); ctx.drawImage(renderer.domElement, 0, 0, 320, 200);
      const data = ctx.getImageData(0, 0, 320, 200).data;
      let green = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i+1] > 30 && data[i+1] > data[i] * 1.3 && data[i+1] > data[i+2] * 1.1) green++;
      return green / (320 * 200);
    };
    const normalPixels = pixels();
    window.ch15Fixture = { evidence, pixels, normalPixels, scene, base, visual, progress, renderer, render, camera, original, disposeObjects, environment };
    return visual.snapshot;
  }, mode);
}

test("remastered studio preserves geometry, renders CRT states and releases all added visuals", async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (/Shader Error|VALIDATE_STATUS|GL_INVALID/.test(message.text())) errors.push(message.text()); });
  const initial = await fixture(page, "studio");
  expect(initial.studioReady).toBe(true); expect(initial.crt).toBe("1999");
  await page.screenshot({ path: info.outputPath("studio-warm.png") });
  const active = await page.evaluate(() => {
    const f = window.ch15Fixture;
    for (let i = 0; i < 12; i++) f.visual.update(.1, { ...f.progress, visionActive: true }, false, false);
    f.render([7.5, 4.6, 6.8], [0, 1.1, -5.6]);
    return { greenPixels: f.pixels(), normalPixels: f.normalPixels, state: f.visual.snapshot, fixedGeometry: f.original.every(({o, geometry, position, scale}) => o.geometry === geometry && o.position.equals(position) && o.scale.equals(scale)), hiddenConnection: f.scene.getObjectByName("chapter15-frequency-only").visible };
  });
  expect(active.state.matrixMeshes).toBeGreaterThan(100);
  expect(active.greenPixels - active.normalPixels).toBeGreaterThan(.15);
  expect(active.state.apparition).toBe(true);
  expect(active.fixedGeometry).toBe(true); expect(active.hiddenConnection).toBe(true);
  expect(active.state.crt).toBe("2049"); expect(active.state.console).toBe("hidden-channel");
  await page.screenshot({ path: info.outputPath("studio-frequency.png") });
  await page.evaluate(() => window.ch15Fixture.render([5.9, 2.3, -2.7], [5, 1.7, -4.1]));
  await page.screenshot({ path: info.outputPath("studio-crt.png") });
  const surfaces = await page.evaluate(() => {
    const f = window.ch15Fixture;
    const note = f.scene.getObjectByName("chapter15-hugo-note");
    const tape = f.scene.getObjectByName("chapter15-altered-tape");
    const meter = f.scene.getObjectByName("chapter15-VU-meters");
    const version = meter.material.map.version;
    f.visual.update(.1, f.progress, false, false);
    for (let i = 0; i < 88; i++) f.visual.update(.1, f.progress, false, false);
    const interference = f.visual.snapshot.interference;
    f.render([4.4, 3, -.1], [3.8, 1.2, -2.7]);
    return { noteParent: note.parent.name, tapeParent: tape.parent.name,
      tapeY: tape.position.y, noteY: note.position.y,
      metersAnimated: meter.material.map.version > version, interference };
  });
  expect(surfaces.noteParent).toBe("studio-assembly:pc-table");
  expect(surfaces.tapeParent).toBe("studio-assembly:console");
  await page.screenshot({ path: info.outputPath("studio-evidence.png") });
  const contact = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const f = window.ch15Fixture, ray = new THREE.Raycaster();
    const gaps = (name, support, samples) => {
      const object = f.scene.getObjectByName(name);
      return samples.map(z => {
        const bottom = object.localToWorld(new THREE.Vector3(0, 0, z));
        ray.set(bottom.clone().add(new THREE.Vector3(0, .3, 0)), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObject(support, true)[0];
        return hit ? bottom.y - hit.point.y : null;
      });
    };
    return {
      tape: gaps("chapter15-altered-tape", f.base.slots.get("console").modelRoot, [-.12, .12]),
      note: gaps("chapter15-hugo-note", f.base.slots.get("pc-table").placeholder, [0]),
    };
  });
  for (const gap of [...contact.tape, ...contact.note]) {
    expect(gap).not.toBeNull(); expect(Math.abs(gap)).toBeLessThan(.035);
  }
  expect(surfaces.noteY).toBeCloseTo(1.092);
  expect(surfaces.metersAnimated).toBe(true); expect(surfaces.interference).toBe(true);
  const cleanup = await page.evaluate(() => {
    const f = window.ch15Fixture;
    f.visual.update(.1, f.progress, false, false);
    const hidden = !f.scene.getObjectByName("chapter15-frequency-only").visible;
    f.visual.applyQuality("low");
    const budget = { ...f.visual.snapshot };
    f.visual.dispose(); f.evidence?.dispose();
    const restored = f.original.every(({o, material}) => o.material === material);
    let extra = 0; f.scene.traverse(o => { if (o.name.startsWith("chapter15-")) extra++; });
    f.disposeObjects([f.scene]); f.environment.dispose(); f.renderer.dispose();
    return { hidden, restored, extra, budget };
  });
  expect(cleanup.hidden).toBe(true); expect(cleanup.restored).toBe(true); expect(cleanup.extra).toBe(0);
  expect(cleanup.budget.dust).toBe(18); expect(cleanup.budget.shadowLights).toBe(0); expect(cleanup.budget.pointLights).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});

test("remastered store preserves album targets and playable jukebox, with bounded effects", async ({ page }, info) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await fixture(page, "store");
  await page.screenshot({ path: info.outputPath("store-warm.png") });
  const physical = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const f=window.ch15Fixture, ray=new THREE.Raycaster(), downward=new THREE.Vector3(0,-1,0);
    f.scene.updateMatrixWorld(true);
    const contacts=[];
    for(const {object,target} of f.evidence.anchors){
      const body=object.children.find(o=>o.isMesh && o.geometry.type==="BoxGeometry");
      const {width,height,depth}=body.geometry.parameters;
      const points=object.name.includes("roxy") ? [[0,0]] : [[-.48,-.48],[.48,-.48],[-.48,.48],[.48,.48]];
      const candidates=f.original.map(item=>item.o);
      if(object.name.includes("roxy")){
        object.parent.traverse(o=>{if(o.isMesh&&!object.getObjectById(o.id))candidates.push(o);});
      }
      for(const [x,z] of points){
        const bottom=body.localToWorld(new THREE.Vector3(x*width,-height/2,z*depth));
        ray.set(bottom.clone().add(new THREE.Vector3(0,.05,0)),downward);
        const hit=ray.intersectObjects(candidates,false)[0];
        contacts.push({name:object.name,gap:hit?bottom.y-hit.point.y:99});
      }
      const world=object.getWorldPosition(new THREE.Vector3());
      if(Math.hypot(world.x-target.x,world.z-target.z)>.001)throw new Error("Interaction detached from evidence");
    }
    const clock=f.scene.getObjectByName("chapter15-clock");
    return {contacts,clockX:clock.position.x,clockFacing:clock.rotation.y};
  });
  for(const contact of physical.contacts){expect(contact.gap,contact.name).toBeGreaterThan(-.012);expect(contact.gap,contact.name).toBeLessThan(.012);}
  expect(physical.clockX).toBeLessThan(-10.8); expect(physical.clockFacing).toBeCloseTo(Math.PI/2);
  await page.evaluate(()=>window.ch15Fixture.render([-8.1,2.55,10.95],[-8.05,1.24,12.17]));
  await page.screenshot({path:info.outputPath("store-sales-register-on-counter.png")});
  await page.evaluate(()=>window.ch15Fixture.render([2.7,2.05,4.65],[2.55,1.16,3.25]));
  await page.screenshot({path:info.outputPath("store-roxy-lyrics-stand.png")});
  await page.evaluate(()=>window.ch15Fixture.render([7.5,2.3,-1.5],[7.7,1.4,-2.95]));
  await page.screenshot({path:info.outputPath("store-rulo-tape-on-desk.png")});
  await page.evaluate(()=>window.ch15Fixture.render([-5.3,3.1,12.4],[-8,1.8,4]));
  const matrix = await page.evaluate(() => {
    const f = window.ch15Fixture;
    const hidden = !f.scene.getObjectByName("chapter15-future-echoes").visible;
    let lamp;
    f.base.jukebox.traverse(o => { for (const m of [o.material].flat()) if (m?.emissive?.getHex() && m.emissiveIntensity > .6) lamp ??= m; });
    const warmColor = lamp.emissive.clone();
    for (let i=0; i<15; i++) f.visual.update(.1, { ...f.progress, visionActive: true }, false, false);
    return { hidden, lampsRespond: !lamp.emissive.equals(warmColor), green: f.pixels(), normal: f.normalPixels, snapshot: { ...f.visual.snapshot },
      unchanged: f.original.every(({o, geometry, position, scale}) => o.geometry === geometry && o.position.equals(position) && o.scale.equals(scale)) };
  });
  expect(matrix.hidden).toBe(true); expect(matrix.lampsRespond).toBe(true); expect(matrix.snapshot.futureEchoes).toBe(true);
  expect(matrix.snapshot.matrixMeshes).toBeGreaterThan(100);
  expect(matrix.green - matrix.normal).toBeGreaterThan(.15); expect(matrix.unchanged).toBe(true);
  await page.evaluate(() => window.ch15Fixture.render([0, 2.8, 11.1], [1, 1, 1]));
  await page.screenshot({ path: info.outputPath("store-matrix-future-echoes.png") });
  await page.evaluate(() => window.ch15Fixture.render([7.8, 2.4, 9], [6.3, .3, 4.8]));
  await page.screenshot({ path: info.outputPath("store-destruction-echo.png") });

  const result = await page.evaluate(() => {
    const f = window.ch15Fixture, hitTargets = [...f.base.clickable];
    const originalScreen = f.base.standbyLabel;
    f.visual.update(.1, { ...f.progress, visionActive: true, compared: true }, false, false);
    f.render([-6.6, 2.6, 10], [-9.9, 2, 8]);
    const resonant = f.visual.snapshot.jukebox;
    const unchanged = hitTargets.every((o, i) => o === f.base.clickable[i]);
    f.visual.update(.1, { ...f.progress, visionActive: true }, false, false, true);
    return { resonant, unchanged, albumTargets: f.base.albumTargets.length, screenPreserved: originalScreen === f.base.standbyLabel,
      playbackClear: !f.scene.getObjectByName("chapter15-jukebox-frequency").visible };
  });
  expect(result.resonant).toBe("resonance"); expect(result.unchanged).toBe(true);
  expect(result.albumTargets).toBeGreaterThan(0); expect(result.screenPreserved).toBe(true); expect(result.playbackClear).toBe(true);
  await page.screenshot({ path: info.outputPath("store-jukebox.png") });
  const restored = await page.evaluate(() => {
    const f = window.ch15Fixture;
    for (let i=0; i<15; i++) f.visual.update(.1, f.progress, false, true);
    const hidden = !f.scene.getObjectByName("chapter15-future-echoes").visible && !f.visual.snapshot.futureEchoes;
    f.evidence.dispose(); f.visual.dispose();
    return { hidden, materials: f.original.every(({o, material}) => o.material === material),
      echoesRemoved: !f.scene.getObjectByName("chapter15-future-echoes") };
  });
  expect(restored).toEqual({hidden:true, materials:true, echoesRemoved:true});
  expect(errors).toEqual([]);
});
