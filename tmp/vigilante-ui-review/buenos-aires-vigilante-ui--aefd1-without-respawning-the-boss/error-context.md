# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buenos-aires-vigilante-ui.spec.js >> saved defeat restores the 1999 record, escape dialogue and original Fuego without respawning the boss
- Location: tests\game\buenos-aires-vigilante-ui.spec.js:63:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.neon-buenos-aires').locator('.studio-examine-cue')
Expected substring: "Renault Fuego"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('.neon-buenos-aires').locator('.studio-examine-cue') with timeout 10000ms
  - waiting for locator('.neon-buenos-aires').locator('.studio-examine-cue')

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
  - status "Misión ESCAPÁ DEL SECTOR DEL OBELISCO":
    - text: MISIÓN EN CURSO
    - heading "ESCAPÁ DEL SECTOR DEL OBELISCO" [level=3]
    - paragraph: ESCAPÁ DEL SECTOR DEL OBELISCO. Acercate al Renault Fuego frente al monumento.
    - text: CIUDADANOS / 3 DE 3 SEÑAL / DETECTADA OBELISCO / RECONOCIDO TRANSMISORES / 3 DE 3 RED / TE DETECTÓ
  - button "VISIÓN DE FRECUENCIA C · INACTIVA"
  - status "Salud 3 de 3": ♥♥♥
  - text: CAPÍTULO 14 / BUENOS AIRES TERCERA PERSONA 2049 / LA CIUDAD DE LOS AUSENTES
- button "Pausar juego": PAUSA
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | async function openCity(page,extra={},hearts=3){
  4   |   await page.addInitScript(({extra,hearts})=>{
  5   |     if(sessionStorage.getItem("vigilante-test-seeded"))return;
  6   |     sessionStorage.setItem("vigilante-test-seeded","true");
  7   |     const data={scene:"buenos-aires-2049",combatHearts:hearts,      arcadeProgress: { recordStoreFutureVisionSeen: true, recordStoreGhostSeen: true },
  8   |       studioProgress: { impossibleRecordingStarted: true, signalComputerExamined: true,
  9   |         signalAnalysisCompleted: true, reversedSignalDecoded: true, studioAnomalySeen: true,
  10  |         rooftopClueKnown: true },
  11  |       rooftopProgress: { introSeen: true, explored: true, panelExamined: true,
  12  |         switches: ["luna", "rayo", "antena"], bearing: -34, antennaAligned: true,
  13  |         frequency: 9, frequencyDecoded: true, safeReached: true, anomalySeen: true,
  14  |         transmissionCollected: true },
  15  |       lostShipProgress: {
  16  |         hugoBriefed: true, signalSegments: [0, 1, 2], signalDecoded: true,
  17  |         linkActivated: true, accessLog: true, accessSymbols: ["pulse", "coil", "gate"],
  18  |         accessGranted: true, reactorExamined: true, moduleTaken: true, moduleInstalled: true,
  19  |         circuitPath: ["internal", "life", "bridge"], powerRestored: true,
  20  |         lockerClues: ["log", "sign", "monitor"], lockerSymbols: ["triangle", "moon", "wave"],
  21  |         lockerOpened: true, regulators: [2, 1, 2], lifeStable: true, bridgeCardUsed: true,
  22  |         navigationClues: ["reactor", "storage", "bridge"], navigationValues: ["09", "01", "temple"],
  23  |         navigationRestored: true, travelerMet: true, memoryTaken: true, memoryInstalled: true,
  24  |         archiveRecovered: true, orbAnnouncementSeen: true,
  25  |       },
  26  | 
  27  |       chapter10Progress:{coreAnalyzed:true,signalDetected:true,hugoConsulted:true,signalReconstructed:true,underworldUnlocked:true,chapterCompleted:true},
  28  |       underworldProgress:{bridgeCrossed:true,completed:true,combatVersion:1,enemies:[0,0],gargolaHealth:0,testigoHealth:0,testigoDefeatLineSeen:true},
  29  |       cathedralProgress:{completed:true},
  30  |       throneProgress:{entered:true,inscriptionRead:true,vows:["memoria","voluntad","libertad"],hallOpen:true,coreInspected:["origen","eco","enlace"],conductors:["origen","eco","enlace"],throneOpen:true,bossIntro:true,bossHealth:0,bossDefeated:true,transmissionExamined:true,completed:true},
  31  |       cityProgress:{entered:true,introSeen:true,obeliskExplored:true,yellowCarSeen:true,citizens:["ba-man-1","ba-woman-1","ba-executive-1"],signalFound:true,disconnectedMet:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true,...extra},
  32  |       positions:{"buenos-aires-2049":{x:0,z:22,yaw:Math.PI,viewYaw:0}}};
  33  |     localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify({version:1,slots:{autosave:{savedAt:Date.now(),data}}}));
  34  |   },{extra,hearts});
  35  |   await page.goto("/discografia/");await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  36  |   const city=page.locator(".neon-buenos-aires");
  37  |   await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});return city;
  38  | }
  39  | const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  40  | function recordErrors(page){const errors=[],missingAudio=[];page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(/(vigilante-14|neonboy-vigilante|desconectada-14-0[89]).*\.mp3/.test(r.url()))missingAudio.push(r.url());});return {errors,missingAudio};}
  41  | 
  42  | test("saved transmitters lead to the intro, real damage, checkpoint and preserved progress",async({page},testInfo)=>{
  43  |   const {errors,missingAudio}=recordErrors(page),city=await openCity(page);
  44  |   const dialogue=city.locator(".city-dialogue"),canvas=city.locator("canvas");
  45  |   await expect(canvas).toHaveAttribute("data-city-vigilante-ready","true",{timeout:30000});
  46  |   await expect(dialogue).toHaveAttribute("data-line-id","vigilante-14-01",{timeout:12000});
  47  |   await page.screenshot({path:testInfo.outputPath("vigilante-intro-ui.png")});
  48  |   for(let i=0;i<8;i++){await expect(dialogue).toBeVisible();await page.keyboard.press("e");}
  49  |   await expect(dialogue).toHaveCount(0);
  50  |   await expect(city.getByRole("progressbar",{name:"Vigilante de la Red"})).toHaveAttribute("aria-valuenow","8");
  51  |   await expect(city.getByRole("button",{name:/Lanzar/})).toBeEnabled();
  52  |   await page.keyboard.press("c");await expect(city).toHaveAttribute("data-frequency-vision","active");
  53  |   await page.keyboard.press("c");await expect(city).toHaveAttribute("data-frequency-vision","inactive");
  54  |   await expect(city.getByRole("button",{name:"Reintentar combate"})).toBeVisible({timeout:45000});
  55  |   await expect(city.getByRole("status",{name:"Salud 0 de 3"})).toBeVisible();
  56  |   await city.getByRole("button",{name:"Reintentar combate"}).click();
  57  |   await expect(city.getByRole("status",{name:"Salud 3 de 3"})).toBeVisible();
  58  |   await expect(canvas).toHaveAttribute("data-city-vigilante-ready","true",{timeout:30000});
  59  |   await expect(city.getByRole("progressbar")).toHaveAttribute("aria-valuenow","8");
  60  |   await expect.poll(async()=>{const d=await saved(page);return [d.cityProgress.vigilanteHealth,d.cityProgress.vigilanteNodes.length,d.cityProgress.coreComplete,d.cityProgress.trafficComplete,d.cityProgress.advertisingComplete,d.throneProgress.completed];}).toEqual([8,0,true,true,true,true]);
  61  |   expect(errors).toEqual([]);expect(missingAudio).toEqual([]);
  62  | });
  63  | 
  64  | test("mobile touch controls reveal Matrix nodes, launch and recall without blocking movement",async({browser},testInfo)=>{
  65  |   const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  66  |   const page=await context.newPage(),{errors,missingAudio}=recordErrors(page);
  67  |   const city=await openCity(page,{vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:4});
  68  |   const dialogue=city.locator(".city-dialogue");
  69  |   await expect(dialogue).toHaveAttribute("data-line-id","vigilante-14-05",{timeout:30000});
  70  |   await dialogue.getByRole("button").tap();await dialogue.getByRole("button").tap();
  71  |   const vision=city.locator(".underworld-vision-control button");await vision.tap();
  72  |   await expect(city).toHaveAttribute("data-frequency-vision","active");
  73  |   await expect(city.getByRole("progressbar")).toContainText("NODOS 0/3");
  74  |   await city.getByRole("button",{name:/Lanzar/}).tap();
  75  |   await expect(city.getByRole("button",{name:/Recuperar/})).toBeEnabled();
> 76  |   await city.getByRole("button",{name:/Recuperar/}).tap();
      |                                                                   ^ Error: expect(locator).toContainText(expected) failed
  77  |   await page.screenshot({path:testInfo.outputPath("vigilante-mobile-matrix.png")});
  78  |   expect(await page.locator(".record-store-mobile-move").count()).toBeGreaterThan(0);
  79  |   expect(errors).toEqual([]);expect(missingAudio).toEqual([]);await context.close();
  80  | });
  81  | 
  82  | test("saved defeat restores the 1999 record, escape dialogue and original Fuego without respawning the boss",async({page},testInfo)=>{
  83  |   const {errors,missingAudio}=recordErrors(page);
  84  |   const city=await openCity(page,{vigilanteEncountered:true,vigilanteStarted:true,vigilanteHealth:0,vigilanteDefeated:true});
  85  |   const dialogue=city.locator(".city-dialogue");await expect(dialogue).toHaveAttribute("data-line-id","desconectada-14-08",{timeout:20000});
  86  |   for(let i=0;i<4;i++)await dialogue.getByRole("button").click();
  87  |   await expect(city.getByRole("progressbar")).toHaveCount(0);
  88  |   await expect(city.locator(".city-mission")).toContainText("ESCAP");
  89  |   await city.getByRole("button",{name:"DIARIO",exact:true}).click();
  90  |   await expect(city.locator(".cathedral-diary-notes")).toContainText("Neon Recording Studio de 1999");
  91  |   await city.getByRole("button",{name:"DIARIO",exact:true}).click();
  92  |   await expect(city.locator("canvas")).toHaveAttribute("data-city-escape-ready","true",{timeout:30000});
  93  |   // Move out of the parked vehicle and approach the interaction from its south side.
  94  |   await page.keyboard.down("s");await page.waitForTimeout(850);await page.keyboard.up("s");
  95  |   const cue=city.locator(".studio-examine-cue");await expect(cue).toContainText("Renault Fuego",{timeout:10000});
  96  |   await cue.click();await expect(city.locator(".city-notice")).toContainText("RUTA DE FUGA PREPARADA");
  97  |   await city.locator(".city-notice button").click();
  98  |   await expect.poll(async()=>{const d=await saved(page);return [d.cityProgress.vigilanteDefeated,d.cityProgress.record1999Found,d.cityProgress.escapeUnlocked,d.cityProgress.escapeBriefed,d.cityProgress.completed===true];}).toEqual([true,true,true,true,false]);
  99  |   await page.screenshot({path:testInfo.outputPath("vigilante-escape-ui.png")});
  100 |   await page.reload();await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  101 |   await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});
  102 |   await expect(city.locator("canvas")).toHaveAttribute("data-city-vigilante-ready","false");
  103 |   await expect(city.getByRole("progressbar")).toHaveCount(0);await expect(dialogue).toHaveCount(0);
  104 |   expect(errors).toEqual([]);expect(missingAudio).toEqual([]);
  105 | });
  106 | 
```