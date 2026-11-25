import { test, expect } from "@playwright/test";

import { openCity } from "./citySession.js";

const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
function recordErrors(page){const errors=[],missingAudio=[];page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(/(vigilante-14|neonboy-vigilante|desconectada-14-0[89]).*\.mp3/.test(r.url()))missingAudio.push(r.url());});return {errors,missingAudio};}

test("saved transmitters lead to the intro, real damage, checkpoint and preserved progress",async({page},testInfo)=>{
  const {errors,missingAudio}=recordErrors(page),city=await openCity(page);
  const dialogue=city.locator(".city-dialogue"),canvas=city.locator("canvas");
  await expect(canvas).toHaveAttribute("data-city-vigilante-ready","true",{timeout:30000});
  await expect(dialogue).toHaveAttribute("data-line-id","vigilante-14-01",{timeout:12000});
  await page.screenshot({path:testInfo.outputPath("vigilante-intro-ui.png")});
  for(let i=0;i<8;i++){await expect(dialogue).toBeVisible();await page.keyboard.press("e");}
  await expect(dialogue).toHaveCount(0);
  await expect(city.getByRole("progressbar",{name:"Vigilante de la Red"})).toHaveAttribute("aria-valuenow","8");
  await expect(city.getByRole("button",{name:/Lanzar/})).toBeEnabled();
  await page.keyboard.press("c");await expect(city).toHaveAttribute("data-frequency-vision","active");
  await page.keyboard.press("c");await expect(city).toHaveAttribute("data-frequency-vision","inactive");
  await expect(city.getByRole("button",{name:"Reintentar combate"})).toBeVisible({timeout:45000});
  await expect(city.getByRole("status",{name:"Salud 0 de 3"})).toBeVisible();
  await city.getByRole("button",{name:"Reintentar combate"}).click();
  await expect(city.getByRole("status",{name:"Salud 3 de 3"})).toBeVisible();
  await expect(canvas).toHaveAttribute("data-city-vigilante-ready","true",{timeout:30000});
  await expect(city.getByRole("progressbar")).toHaveAttribute("aria-valuenow","8");
  await expect.poll(async()=>{const d=await saved(page);return [d.cityProgress.vigilanteHealth,d.cityProgress.vigilanteNodes.length,d.cityProgress.coreComplete,d.cityProgress.trafficComplete,d.cityProgress.advertisingComplete,d.throneProgress.completed];}).toEqual([8,0,true,true,true,true]);
  expect(errors).toEqual([]);expect(missingAudio).toEqual([]);
});

test("mobile touch controls reveal Matrix nodes, launch and recall without blocking movement",async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),{errors,missingAudio}=recordErrors(page);
  const city=await openCity(page,{vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:4});
  const dialogue=city.locator(".city-dialogue");
  await expect(dialogue).toHaveAttribute("data-line-id","vigilante-14-05",{timeout:30000});
  await dialogue.getByRole("button").tap();await dialogue.getByRole("button").tap();
  const vision=city.locator(".underworld-vision-control button");await vision.tap();
  await expect(city).toHaveAttribute("data-frequency-vision","active");
  await expect(city.getByRole("progressbar")).toContainText("NODOS 0/3");
  await city.getByRole("button",{name:/Lanzar/}).tap();
  await expect(city.getByRole("button",{name:/Recuperar/})).toBeEnabled();
  await city.getByRole("button",{name:/Recuperar/}).tap();
  const before=Number(await city.locator("canvas").getAttribute("data-city-player-z"));
  const up=page.getByRole("button",{name:"Mover \u2191",exact:true});
  const rect=await up.boundingBox(),cdp=await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});
  await page.waitForTimeout(400);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  expect(Number(await city.locator("canvas").getAttribute("data-city-player-z"))).toBeLessThan(before-.3);
  await page.screenshot({path:testInfo.outputPath("vigilante-mobile-matrix.png")});
  await page.setViewportSize({width:390,height:844});
  await vision.tap();await expect(city).toHaveAttribute("data-frequency-vision","inactive");
  await page.screenshot({path:testInfo.outputPath("vigilante-mobile-portrait.png")});
  await expect(page.getByRole("button",{name:"Mover \u2191",exact:true})).toBeVisible();
  expect(errors).toEqual([]);expect(missingAudio).toEqual([]);await context.close();
});

test("saved defeat preserves the boss victory and opens Fuego repair instead of granting escape",async({page},testInfo)=>{
  const {errors,missingAudio}=recordErrors(page);
  const city=await openCity(page,{vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:0,vigilanteDefeated:true,escapeBriefed:true},3,{x:-6,z:27,yaw:Math.PI,viewYaw:0});
  await expect(city.locator(".city-dialogue")).toHaveCount(0);
  await expect(city.getByRole("progressbar")).toHaveCount(0);
  await expect(city.locator(".city-mission")).toContainText("FUEGO");
  await expect(city.locator("canvas")).toHaveAttribute("data-city-escape-ready","true",{timeout:45000});
  const cue=city.locator(".studio-examine-cue");await expect(cue).toContainText("Renault Fuego");
  await cue.click();
  const dialogue=city.locator(".city-dialogue");await expect(dialogue).toHaveAttribute("data-line-id","city-fuego-intro-0");
  for(let i=0;i<6;i++)await dialogue.getByRole("button").click();
  await expect(city.locator(".city-mission")).toContainText("COMPONENTES 0/3");
  await expect.poll(async()=>{const d=await saved(page);return [d.cityProgress.vigilanteDefeated,d.cityProgress.record1999Found,d.cityProgress.fuegoStarted,d.cityProgress.escapeUnlocked,d.cityProgress.escapeBriefed];}).toEqual([true,true,true,false,false]);
  await page.screenshot({path:testInfo.outputPath("fuego-repair-legacy-save.png")});
  expect(errors).toEqual([]);expect(missingAudio).toEqual([]);
});
