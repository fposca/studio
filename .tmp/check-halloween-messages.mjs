import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
try {
  const mobile = process.argv.includes("--mobile");
  const page = await browser.newPage({ viewport: mobile ? { width: 844, height: 390 } : { width: 960, height: 540 }, isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  // Test-only probe in the served module; no debug hooks added to shipped code.
  await page.route("**/HalloweenStoreScene.jsx*", async route => {
    const response = await route.fetch();
    let code = await response.text();
    code = code.replace('    function frame() {', '    window.__messagesHarness = { scene, camera, renderer, player, demon, matrixMessages, codeVision, shop };\n    function frame() {');
    code = code.replace('frameId = requestAnimationFrame(frame);', 'frameId = requestAnimationFrame(frame); if (window.__messagesHarness?.suspend) return;');
    if (!code.includes('window.__messagesHarness =')) throw new Error("Missing scene probe insertion");
    await route.fulfill({ response, body: code });
  });
  await page.goto("http://127.0.0.1:5175/discografia/");
  await page.getByRole("progressbar").waitFor({ state: "hidden", timeout: 60000 });
  if (mobile && !(await page.getByRole("button", { name: "Lanzar Orbe Neón", exact:true }).isVisible())) throw new Error("Mobile orb control not visible");
  const before = await page.evaluate(() => ({ count: window.__messagesHarness.matrixMessages.entries.length }));
  if (before.count !== 0) throw new Error("Messages allocated in normal vision");
  await page.keyboard.down("w");
  await page.locator(".halloween-prompt").filter({ hasText: /Recoger anteojos/ }).waitFor({ state: "visible", timeout: 15000 });
  await page.keyboard.up("w"); await page.keyboard.press("e"); await page.keyboard.press("c");
  await page.waitForFunction(() => document.querySelector("canvas.halloween-scene-canvas").dataset.frequencyVision === "active");
  await page.waitForFunction(() => window.__messagesHarness.matrixMessages.entries.some(e => e.material.opacity === 1));
  const active = await page.evaluate(() => {
    const h = window.__messagesHarness;
    return { count: h.matrixMessages.entries.length, faces: h.matrixMessages.entries.flatMap(e => e.faces).filter(m => m.visible).length, styles: [...new Set(h.matrixMessages.entries.map(e=>e.config.category))] };
  });
  if (active.count !== 15 || active.faces > 15 || active.styles.length !== 3) throw new Error("Missing or excessive signs " + JSON.stringify(active));
  await page.waitForFunction(() => document.querySelector("canvas.halloween-scene-canvas").dataset.frequencyVision === "inactive", { timeout: 15000 });
  const registered = await page.locator(".halloween-archive-list span").filter({ hasText:"Mensajes ocultos" }).textContent();
  if(!registered.includes("2/2")) throw new Error("Actual React discovery progress missing: "+registered);
  const hidden = await page.evaluate(() => window.__messagesHarness.matrixMessages.entries.every(e => e.faces.every(f => !f.visible)));
  if (!hidden) throw new Error("Messages remained after the actual ten-second vision");
  const shots = await page.evaluate(async () => {
    const h = window.__messagesHarness; h.suspend = true;
    const source = await (await fetch("/discografia/halloweenMatrixMessages.js")).text();
    const THREE = await import(source.match(/from "([^"\n]+three[^"\n]+)"/)[1]);
    h.renderer.setPixelRatio(1); h.renderer.setSize(640,360);
    h.camera.aspect = 640/360; h.camera.updateProjectionMatrix();
    h.codeVision.setActive(true); h.demon.setVision(true); h.matrixMessages.setActive(true);
    // Defeat uses the real encounter state, then checks the next-activation rule.
    h.demon.hit(); h.demon.hit(); h.demon.hit();
    h.matrixMessages.update(.4,h.camera,h.player);
    const finale = h.matrixMessages.entries.find(e=>e.config.id === "freedom");
    if (finale.faces[0].visible) throw new Error("Finale appeared during the defeat activation");
    h.matrixMessages.setActive(false); h.matrixMessages.setActive(true);
    h.matrixMessages.update(.4,h.camera,h.player);
    if (!finale.faces[0].visible) throw new Error("Finale missing after reactivation");
    const output = [];
    for (const e of h.matrixMessages.entries) {
      if (e.config.id === "demon") continue;
      const face = e.faces[0], center = new THREE.Vector3(); face.getWorldPosition(center);
      const normal = new THREE.Vector3(0,0,1).transformDirection(face.matrixWorld);
      const eye = center.clone().addScaledVector(normal, e.config.scale[0] > 4 ? 4.8 : 3.6);
      eye.y = Math.min(2.65, center.y + 1.0);
      h.camera.position.copy(eye); h.camera.lookAt(center); h.camera.updateMatrixWorld(true);
      h.player.x = eye.x; h.player.z = eye.z;
      h.matrixMessages.update(.4,h.camera,h.player, { reducedMotion:true });
      h.renderer.render(h.scene,h.camera);
      output.push({ id:e.config.id,text:e.config.text,image:h.renderer.domElement.toDataURL("image/png"),position:center.toArray() });
    }
    // Check each real mounting point from a nearby playable viewing direction.
    const { createHalloweenMatrixMessages } = await import("/discografia/halloweenMatrixMessages.js");
    const blockers = [];
    h.shop.root.traverse(object => { if(object.isMesh && ["BoxGeometry","RoundedBoxGeometry","ExtrudeGeometry","CylinderGeometry","CapsuleGeometry","SphereGeometry"].includes(object.geometry.type) && ![object.material].flat().some(m=>m.transparent && m.opacity<.9)) blockers.push(object); });
    const readableIds = [];
    for (const e of h.matrixMessages.entries) {
      if (e.config.visibility === "after-defeat") continue;
      const testDemon = {position:h.demon.position,defeated:false};
      const check = createHalloweenMatrixMessages(h.scene,{ configs:[e.config], demon:testDemon, getOccluders:()=>blockers, onDiscover:id=>readableIds.push(id) });
      check.setActive(true);
      if(e.config.id === "demon") {
        h.player.x=testDemon.position.x; h.player.z=testDemon.position.z+3.5;
        h.camera.position.set(h.player.x,2.2,h.player.z); h.camera.lookAt(testDemon.position.x,2.55,testDemon.position.z);
      } else {
        e.faces[0].getWorldPosition(h.camera.position);
        const at=h.camera.position.clone();
        const normal=new THREE.Vector3(0,0,1).transformDirection(e.faces[0].matrixWorld);
        h.camera.position.addScaledVector(normal,e.config.scale[0]>4?4.8:3.6);
        h.camera.position.y=Math.min(2.65,at.y+1);
        h.camera.lookAt(at);
        h.player.x=h.camera.position.x; h.player.z=h.camera.position.z;
      }
      for(let i=0;i<4;i++) check.update(.25,h.camera,h.player,{reducedMotion:true});
      check.dispose();
    }
    if(readableIds.length !== 14) throw new Error("Unreadable mounted signs: " + h.matrixMessages.entries.filter(e=>e.config.visibility!=="after-defeat" && !readableIds.includes("matrix-message:"+e.config.id)).map(e=>e.config.id));
    const allocated = h.renderer.info.memory.textures;
    for (let i=0;i<10;i++) {
      h.matrixMessages.setActive(false); h.codeVision.setActive(false); h.renderer.render(h.scene,h.camera);
      h.codeVision.setActive(true); h.matrixMessages.setActive(true); h.matrixMessages.update(.4,h.camera,h.player); h.renderer.render(h.scene,h.camera);
    }
    if (h.renderer.info.memory.textures !== allocated) throw new Error("Textures grew across vision cycles");
    return { output, readableIds, textures:allocated, matrixCount:document.querySelector(".halloween-archive-list")?.textContent, glError:h.renderer.getContext().getError() };
  });
  for(const shot of shots.output) if (["jukebox","archive","vhs","mask"].includes(shot.id)) await writeFile(".tmp/matrix-"+shot.id+".png",Buffer.from(shot.image.split(",")[1],"base64"));
  const contact = await browser.newPage({ viewport:{ width:1280,height:980 } });
  await contact.setContent('<html><body style="margin:0;background:#121019;color:#eee;font:12px Arial;display:grid;grid-template-columns:repeat(4,1fr);gap:5px">' + shots.output.map(s=>`<div><img style="width:100%;display:block" src="${s.image}"><p style="margin:5px">${s.id}: ${s.text.replaceAll("\n"," / ")}</p></div>`).join("") + '</body></html>');
  await contact.screenshot({ path: ".tmp/halloween-matrix-message-locations.jpg", fullPage:true, type:"jpeg",quality:70 });
  await writeFile(".tmp/halloween-matrix-message-check.json",JSON.stringify({ before,active,hidden,positions:shots.output.map(({image,...rest})=>rest), readableIds:shots.readableIds,textures:shots.textures,glError:shots.glError,errors },null,2));
  console.log(JSON.stringify({ before,active,hidden,readableIds:shots.readableIds,textures:shots.textures,glError:shots.glError,errors }));
  if(errors.length || shots.glError) throw new Error("Message browser check failed");
} finally { await browser.close(); }
