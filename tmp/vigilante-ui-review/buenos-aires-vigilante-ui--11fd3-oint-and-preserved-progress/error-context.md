# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buenos-aires-vigilante-ui.spec.js >> saved transmitters lead to the intro, real damage, checkpoint and preserved progress
- Location: tests\game\buenos-aires-vigilante-ui.spec.js:23:1

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: locator('.neon-buenos-aires').getByRole('button', { name: /Lanzar/ })
Expected: enabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" locator('.neon-buenos-aires').getByRole('button', { name: /Lanzar/ }) with timeout 5000ms
  - waiting for locator('.neon-buenos-aires').getByRole('button', { name: /Lanzar/ })

```

```yaml
- region "Capitulo 14, Buenos Aires 2049":
  - text: NEONBOY UNIVERSE / CAPÍTULO 14
  - heading "BUENOS AIRES 2049" [level=2]
  - paragraph: LA CIUDAD DE LOS AUSENTES
  - button "INVENTARIO"
  - button "DIARIO"
  - button "MAPA"
  - text: "WASD: caminar | Arrastrar: mirar | V: vista | C: visión | E: examinar | F/Click: Orbe Neón | R: recuperar | M: mapa"
  - status "Misión VIGILANTE DE LA RED":
    - text: MISIÓN EN CURSO
    - heading "VIGILANTE DE LA RED" [level=3]
    - paragraph: Derrotá al Vigilante de la Red. Esquivá sus ataques y acertá el Orbe.
    - text: CIUDADANOS / 3 DE 3 SEÑAL / DETECTADA OBELISCO / RECONOCIDO TRANSMISORES / 3 DE 3 RED / TE DETECTÓ
  - button "VISIÓN DE FRECUENCIA C · INACTIVA"
  - status "Salud 2 de 3": ♥♥♡
  - progressbar "Vigilante de la Red":
    - strong: VIGILANTE DE LA RED
    - text: PROTOCOLO DE CONTENCIÓN
  - text: CAPÍTULO 14 / BUENOS AIRES TERCERA PERSONA 2049 / LA CIUDAD DE LOS AUSENTES
- button "Pausar juego": PAUSA
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | async function openCity(page,extra={},hearts=3){
  4  |   await page.addInitScript(({extra,hearts})=>{
  5  |     if(sessionStorage.getItem("vigilante-test-seeded"))return;
  6  |     sessionStorage.setItem("vigilante-test-seeded","true");
  7  |     const data={scene:"buenos-aires-2049",combatHearts:hearts,lostShipProgress:{orbUnlocked:true},
  8  |       chapter10Progress:{coreAnalyzed:true,signalDetected:true,hugoConsulted:true,signalReconstructed:true,underworldUnlocked:true,chapterCompleted:true},
  9  |       underworldProgress:{bridgeCrossed:true,completed:true,combatVersion:1,enemies:[0,0],gargolaHealth:0,testigoHealth:0,testigoDefeatLineSeen:true},
  10 |       cathedralProgress:{completed:true},
  11 |       throneProgress:{entered:true,inscriptionRead:true,vows:["memoria","voluntad","libertad"],hallOpen:true,coreInspected:["origen","eco","enlace"],conductors:["origen","eco","enlace"],throneOpen:true,bossIntro:true,bossHealth:0,bossDefeated:true,transmissionExamined:true,completed:true},
  12 |       cityProgress:{entered:true,introSeen:true,obeliskExplored:true,yellowCarSeen:true,citizens:["ba-man-1","ba-woman-1","ba-executive-1"],signalFound:true,disconnectedMet:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true,...extra},
  13 |       positions:{"buenos-aires-2049":{x:0,z:22,yaw:Math.PI,viewYaw:0}}};
  14 |     localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify({version:1,slots:{autosave:{savedAt:Date.now(),data}}}));
  15 |   },{extra,hearts});
  16 |   await page.goto("/discografia/");await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  17 |   const city=page.locator(".neon-buenos-aires");
  18 |   await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});return city;
  19 | }
  20 | const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  21 | function recordErrors(page){const errors=[],missingAudio=[];page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(/(vigilante-14|neonboy-vigilante|desconectada-14-0[89]).*\.mp3/.test(r.url()))missingAudio.push(r.url());});return {errors,missingAudio};}
  22 | 
  23 | test("saved transmitters lead to the intro, real damage, checkpoint and preserved progress",async({page},testInfo)=>{
  24 |   const {errors,missingAudio}=recordErrors(page),city=await openCity(page);
  25 |   const dialogue=city.locator(".city-dialogue"),canvas=city.locator("canvas");
  26 |   await expect(canvas).toHaveAttribute("data-city-vigilante-ready","true",{timeout:30000});
  27 |   await expect(dialogue).toHaveAttribute("data-line-id","vigilante-14-01",{timeout:12000});
  28 |   await page.screenshot({path:testInfo.outputPath("vigilante-intro-ui.png")});
  29 |   for(let i=0;i<8;i++){await expect(dialogue).toBeVisible();await page.keyboard.press("e");}
  30 |   await expect(dialogue).toHaveCount(0);
  31 |   await expect(city.getByRole("progressbar",{name:"Vigilante de la Red"})).toHaveAttribute("aria-valuenow","8");
> 32 |   await expect(city.getByRole("button",{name:/Lanzar/})).toBeEnabled();
     |                                                          ^ Error: expect(locator).toBeEnabled() failed
  33 |   await page.keyboard.press("c");await expect(city).toHaveAttribute("data-frequency-vision","active");
  34 |   await page.keyboard.press("c");await expect(city).toHaveAttribute("data-frequency-vision","inactive");
  35 |   await expect(city.getByRole("button",{name:"Reintentar combate"})).toBeVisible({timeout:45000});
  36 |   await expect(city.getByRole("status",{name:"Salud 0 de 3"})).toBeVisible();
  37 |   await city.getByRole("button",{name:"Reintentar combate"}).click();
  38 |   await expect(city.getByRole("status",{name:"Salud 3 de 3"})).toBeVisible();
  39 |   await expect(canvas).toHaveAttribute("data-city-vigilante-ready","true",{timeout:30000});
  40 |   await expect(city.getByRole("progressbar")).toHaveAttribute("aria-valuenow","8");
  41 |   await expect.poll(async()=>{const d=await saved(page);return [d.cityProgress.vigilanteHealth,d.cityProgress.vigilanteNodes.length,d.cityProgress.coreComplete,d.cityProgress.trafficComplete,d.cityProgress.advertisingComplete,d.throneProgress.completed];}).toEqual([8,0,true,true,true,true]);
  42 |   expect(errors).toEqual([]);expect(missingAudio).toEqual([]);
  43 | });
  44 | 
  45 | test("mobile touch controls reveal Matrix nodes, launch and recall without blocking movement",async({browser},testInfo)=>{
  46 |   const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  47 |   const page=await context.newPage(),{errors,missingAudio}=recordErrors(page);
  48 |   const city=await openCity(page,{vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:4});
  49 |   const dialogue=city.locator(".city-dialogue");
  50 |   await expect(dialogue).toHaveAttribute("data-line-id","vigilante-14-05",{timeout:30000});
  51 |   await dialogue.getByRole("button").tap();await dialogue.getByRole("button").tap();
  52 |   const vision=city.locator(".underworld-vision-control button");await vision.tap();
  53 |   await expect(city).toHaveAttribute("data-frequency-vision","active");
  54 |   await expect(city.getByRole("progressbar")).toContainText("NODOS 0/3");
  55 |   await city.getByRole("button",{name:/Lanzar/}).tap();
  56 |   await expect(city.getByRole("button",{name:/Recuperar/})).toBeEnabled();
  57 |   await city.getByRole("button",{name:/Recuperar/}).tap();
  58 |   await page.screenshot({path:testInfo.outputPath("vigilante-mobile-matrix.png")});
  59 |   expect(await page.locator(".record-store-touch").count()).toBeGreaterThan(0);
  60 |   expect(errors).toEqual([]);expect(missingAudio).toEqual([]);await context.close();
  61 | });
  62 | 
  63 | test("saved defeat restores the 1999 record, escape dialogue and original Fuego without respawning the boss",async({page},testInfo)=>{
  64 |   const {errors,missingAudio}=recordErrors(page);
  65 |   const city=await openCity(page,{vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:0,vigilanteDefeated:true});
  66 |   const dialogue=city.locator(".city-dialogue");await expect(dialogue).toHaveAttribute("data-line-id","desconectada-14-08",{timeout:20000});
  67 |   for(let i=0;i<4;i++)await dialogue.getByRole("button").click();
  68 |   await expect(city.getByRole("progressbar")).toHaveCount(0);
  69 |   await expect(city.locator(".city-mission")).toContainText("ESCAP");
  70 |   await city.getByRole("button",{name:"DIARIO",exact:true}).click();
  71 |   await expect(city.locator(".cathedral-diary-notes")).toContainText("Neon Recording Studio de 1999");
  72 |   await city.getByRole("button",{name:"DIARIO",exact:true}).click();
  73 |   await expect(city.locator("canvas")).toHaveAttribute("data-city-escape-ready","true",{timeout:30000});
  74 |   // Move out of the parked vehicle and approach the interaction from its south side.
  75 |   await page.keyboard.down("s");await page.waitForTimeout(850);await page.keyboard.up("s");
  76 |   const cue=city.locator(".studio-examine-cue");await expect(cue).toContainText("Renault Fuego",{timeout:10000});
  77 |   await cue.click();await expect(city.locator(".city-notice")).toContainText("RUTA DE FUGA PREPARADA");
  78 |   await city.locator(".city-notice button").click();
  79 |   await expect.poll(async()=>{const d=await saved(page);return [d.cityProgress.vigilanteDefeated,d.cityProgress.record1999Found,d.cityProgress.escapeUnlocked,d.cityProgress.escapeBriefed,d.cityProgress.completed===true];}).toEqual([true,true,true,true,false]);
  80 |   await page.screenshot({path:testInfo.outputPath("vigilante-escape-ui.png")});
  81 |   await page.reload();await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  82 |   await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});
  83 |   await expect(city.locator("canvas")).toHaveAttribute("data-city-vigilante-ready","false");
  84 |   await expect(city.getByRole("progressbar")).toHaveCount(0);await expect(dialogue).toHaveCount(0);
  85 |   expect(errors).toEqual([]);expect(missingAudio).toEqual([]);
  86 | });
  87 | 
```