import { test, expect } from "@playwright/test";
import { openCity } from "./citySession.js";

const repaired = {
  vigilanteEncountered: true, vigilanteStarted: true, vigilanteHealth: 0, vigilanteDefeated: true,
  fuegoStarted: true, fuegoKeyDiscovered: true, fuegoKeyTaken: true, fuegoKeyInstalled: true,
  fuegoPowerTerminalExamined: true, fuegoPowerMaintenanceOpen: true, fuegoPowerCellTaken: true, fuegoPowerCellInstalled: true,
  fuegoNavigationClues: ["calle", "cielo", "libertad"], fuegoNavigationSequence: ["calle", "cielo", "libertad"],
  fuegoNavigationModuleTaken: true, fuegoNavigationModuleInstalled: true, fuegoRecordShown: true,
  fuegoPowered: true, fuegoFlightUnlocked: true, fuegoFlightStarted: true,
  originTransmissionRecovered: true, fuegoChaseCompleted: true,
};

test("the completed escape unlocks an isolated 1999 studio with arrival, Hugo and the fourth channel", async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const city = await openCity(page, repaired, 3);
  await city.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: /CAPÍTULO 15 · EL ESTUDIO ALTERADO/ }).click();
  await map.getByRole("button", { name: /Entrar a Capítulo 15 · Neon Recording Studio/ }).click();
  const chapter = page.getByRole("region", { name: "Capítulo 15, El origen de la señal" });
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  await expect(chapter.locator("canvas")).toHaveAttribute("data-studio-models", /hugo/, { timeout: 90000 });
  const arrival = chapter.getByRole("dialog", { name: "Llegada a 1999" });
  await expect(arrival).toContainText("CAPÍTULO 15");
  for (let i = 0; i < 5; i++) await arrival.getByRole("button", { name: /Siguiente|Continuar/ }).click();
  await expect(chapter.getByLabel("Objetivo del capítulo 15")).toContainText("Hugo");
  await expect(chapter.getByRole("button", { name: /VISIÓN DE FRECUENCIA/ })).toBeVisible();
  await expect.poll(async () => JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals")).studioReady).toBe(true);
  await page.screenshot({ path: info.outputPath("chapter15-studio.png") });
  await page.keyboard.press("c");
  await expect.poll(async () => JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals")).vision).toBe(true);
  const visual = JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals"));
  expect(visual.matrixMeshes).toBeGreaterThan(100);
  expect(visual.matrixActors).toBeGreaterThan(0);
  expect(visual.apparition).toBe(true);
  await page.waitForTimeout(800);
  await page.screenshot({ path: info.outputPath("chapter15-gameplay-matrix.png") });
  await page.keyboard.press("c");
  await chapter.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: /CAPÍTULO 15 · LA DISQUERÍA ALTERADA/ }).click();
  await expect(map.getByText("BLOQUEADO")).toBeVisible();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  expect(save.scene).toBe("chapter15-studio");
  expect(save.chapter15Progress.arrived).toBe(true);
  expect(save.studioProgress.hugoMet).toBe(false);
  expect(errors).toEqual([]);
});


test("Tito's physical evidence and testimony persist separately from the original store", async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await openCity(page, repaired, 3);
  await page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    const data = storage.slots.autosave.data;
    data.scene = "chapter15-store";
    data.chapter15Progress = {
      started: true, arrived: true, hugoConsulted: true, consoleExamined: true, noteRead: true,
      hiddenChannelSeen: true, mixSequence: ["silence", "pulse", "hidden"], channelIsolated: true,
      tapeTaken: true, storeEntered: true, evidence: [], talked: [], compared: false,
    };
    data.positions["chapter15-store"] = { x: -8.9, z: 10.9, yaw: Math.PI, viewYaw: 0 };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const chapter = page.getByRole("region", { name: "Cap\u00edtulo 15, El origen de la se\u00f1al" });
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  const arrival = chapter.getByRole("dialog", { name: /Regreso a la disquer/ });
  const lines = [
    "Pará... Esta tienda estaba completamente destruida.",
    "Entonces no regresamos exactamente al momento del que te fuiste.",
    "¿Me estás diciendo que llegamos antes de que todo pasara?",
    "Eso parece. Y quizás todavía estemos a tiempo de descubrir quién lo provocó.",
  ];
  for (const line of lines) {
    await expect(arrival.locator("p")).toHaveText(line);
    await expect(chapter).toHaveAttribute("data-frequency-vision", "inactive");
    await arrival.getByRole("button", { name: /Siguiente|Continuar/ }).click();
  }
  await expect.poll(async () => JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals")).matrixNpcs).toEqual(expect.arrayContaining(["tito", "roxy", "rulo"]));
  await page.keyboard.press("c");
  await expect.poll(async () => JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals")).futureEchoes).toBe(true);
  const visual = JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals"));
  expect(visual.matrixMeshes).toBeGreaterThan(100); expect(visual.matrixActors).toBeGreaterThan(3);
  await page.waitForTimeout(900);
  await page.screenshot({ path: info.outputPath("chapter15-store-matrix.png") });
  await page.keyboard.press("c");
  await expect(chapter.locator(".chapter15-cue")).toContainText("registro de ventas", { timeout: 30000 });
  await chapter.locator(".chapter15-cue").click();
  await expect(chapter.getByLabel("Objetivo del cap\u00edtulo 15")).toContainText("1/3 EVIDENCIAS");
  await chapter.getByRole("button", { name: "Cerrar aviso" }).click();
  await page.keyboard.down("d");
  await page.waitForTimeout(1350);
  await page.keyboard.up("d");
  await expect(chapter.locator(".chapter15-cue")).toContainText("TITO", { timeout: 15000 });
  await chapter.locator(".chapter15-cue").click();
  const dialogue = chapter.getByRole("dialog", { name: "Conversaci\u00f3n con tito" });
  for (let i = 0; i < 4; i++) await dialogue.getByRole("button", { name: /Siguiente|Continuar/ }).click();
  await expect(chapter.getByLabel("Objetivo del cap\u00edtulo 15")).toContainText("1/3 CONVERSACIONES");
  await page.screenshot({ path: info.outputPath("chapter15-store.png") });
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.chapter15Progress.talked.length)).toBe(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  expect(saved.chapter15Progress.evidence).toEqual(["tito"]);
  expect(saved.storyProgress.vendorMet).toBeFalsy();
  expect(saved.chapter15Progress.storeArrivalSeen).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  await expect(arrival).toHaveCount(0);
  await expect(chapter.getByLabel(/Objetivo del cap.*15/)).toContainText("1/3 CONVERSACIONES");
  expect(errors).toEqual([]);
});


test("the fourth channel puzzle isolates the signal and the altered tape enters inventory", async ({ page }, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await openCity(page, repaired, 3);
  await page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    const data = storage.slots.autosave.data;
    data.scene = "chapter15-studio";
    data.chapter15Progress = { started: true, arrived: true, hugoConsulted: true,
      consoleExamined: true, noteRead: true, visionActive: true, hiddenChannelSeen: true,
      mixSequence: [], channelIsolated: false, tapeTaken: false, storeEntered: false,
      evidence: [], talked: [], compared: false };
    data.positions["chapter15-studio"] = { x: .6, z: 1.47, yaw: Math.PI, viewYaw: 0 };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const chapter = page.getByRole("region", { name: "Cap\u00edtulo 15, El origen de la se\u00f1al" });
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  await expect(chapter.locator(".chapter15-cue")).toContainText("Consola", { timeout: 30000 });
  await chapter.locator(".chapter15-cue").click();
  const consolePanel = chapter.getByRole("dialog", { name: "Consola del cuarto canal" });
  await expect(consolePanel).toContainText("CANAL DESCONOCIDO");
  await consolePanel.getByRole("button", { name: "Recuperar pulso" }).click();
  await expect(consolePanel.locator(".chapter15-console-sequence .is-done")).toHaveCount(0);
  await consolePanel.getByRole("button", { name: "Apagar ruido" }).click();
  await consolePanel.getByRole("button", { name: "Recuperar pulso" }).click();
  await consolePanel.getByRole("button", { name: "Abrir canal oculto" }).click();
  await expect(consolePanel).toContainText("ARCHIVO NO IDENTIFICADO");
  await expect.poll(async () => JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals")).console).toBe("stable");
  await page.screenshot({ path: info.outputPath("chapter15-fourth-channel.png") });
  await consolePanel.getByRole("button", { name: "Buscar la cinta alterada" }).click();
  await page.keyboard.down("d");
  await page.waitForTimeout(650);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await page.waitForTimeout(600);
  await page.keyboard.up("w");
  await expect(chapter.locator(".chapter15-cue")).toContainText("cinta alterada", { timeout: 15000 });
  await chapter.locator(".chapter15-cue").click();
  await expect(chapter.getByRole("button", { name: /Ir a la disquer/ })).toBeVisible();
  await chapter.getByRole("button", { name: "INVENTARIO" }).click();
  await expect(chapter).toContainText("CINTA ALTERADA");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  expect(saved.chapter15Progress.channelIsolated).toBe(true);
  expect(saved.chapter15Progress.tapeTaken).toBe(true);
  expect(saved.masterTape.phase).toBe("new");
  await page.keyboard.press("Escape");
  await chapter.getByRole("button", { name: /Ir a la disquer/ }).click();
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  const arrival = chapter.getByRole("dialog", { name: /Regreso a la disquer/ });
  await expect(arrival).toContainText("Esta tienda estaba completamente destruida.");
  await arrival.getByRole("button", { name: /Cerrar/ }).click();
  expect(errors).toEqual([]);
});


test("chapter 15 keeps touch movement and actions usable on Android landscape", async ({ browser }, info) => {
  test.setTimeout(180000);
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36" });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  const city = await openCity(page, repaired, 3);
  await city.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: /CAP.*15.*ESTUDIO ALTERADO/ }).click();
  await map.getByRole("button", { name: /Entrar a Cap.*15.*Neon Recording Studio/ }).click();
  const chapter = page.getByRole("region", { name: /Cap.*15, El origen de la se.al/ });
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90000 });
  const arrival = chapter.getByRole("dialog", { name: "Llegada a 1999" });
  for (let i = 0; i < 5; i++) await arrival.getByRole("button", { name: /Siguiente|Continuar/ }).click();
  await expect(chapter.locator(".record-store-mobile-move button").first()).toBeVisible();
  await expect(chapter.locator(".record-store-mobile-actions button").first()).toBeVisible();
  const selectors = [".record-store-mobile-move", ".record-store-mobile-actions", ".chapter15-mission", ".chapter15-vision", ".studio-header-actions", ".chapter15-audio"];
  const boxes = await Promise.all(selectors.map(async selector => ({ selector, box: await chapter.locator(selector).boundingBox() })));
  for (const { box } of boxes) { expect(box).not.toBeNull(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(844); expect(box.y + box.height).toBeLessThanOrEqual(390); }
  const overlaps = (a,b) => a.x < b.x+b.width && b.x < a.x+a.width && a.y < b.y+b.height && b.y < a.y+a.height;
  const movement = boxes[0].box, actions = boxes[1].box, mission = boxes[2].box;
  expect(overlaps(movement,mission)).toBe(false);
  expect(overlaps(actions,mission)).toBe(false);
  await chapter.getByRole("button", { name: /VISI.*N DE FRECUENCIA/ }).click();
  await expect(chapter).toHaveAttribute("data-frequency-vision", "active");
  const visualBudget = JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals"));
  expect(visualBudget.pointLights).toBeLessThanOrEqual(5);
  expect(visualBudget.dust).toBeLessThanOrEqual(42);
  await page.screenshot({ path: info.outputPath("chapter15-android-landscape.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(chapter.locator(".record-store-mobile-move button").first()).toBeVisible();
  await expect(chapter.locator(".record-store-mobile-actions button").first()).toBeVisible();
  const portrait = await Promise.all([".record-store-mobile-move", ".record-store-mobile-actions", ".chapter15-mission", ".chapter15-vision"].map(selector => chapter.locator(selector).boundingBox()));
  for (const box of portrait) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390); expect(box.y + box.height).toBeLessThanOrEqual(844); }
  expect(overlaps(portrait[0], portrait[2])).toBe(false);
  expect(overlaps(portrait[1], portrait[2])).toBe(false);
  expect(overlaps(portrait[2], portrait[3])).toBe(false);
  await page.screenshot({ path: info.outputPath("chapter15-android-portrait.png") });
  await page.evaluate(() => {
    const storage = JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    storage.slots.autosave.data.scene = "chapter15-store";
    storage.slots.autosave.data.chapter15Progress = { started:true, arrived:true, hugoConsulted:true,
      consoleExamined:true, noteRead:true, hiddenChannelSeen:true, mixSequence:["silence","pulse","hidden"],
      channelIsolated:true, tapeTaken:true, storeEntered:true };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar", exact:true }).click();
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout:90000 });
  const temporal = chapter.getByRole("dialog", { name:/Regreso a la disquer/ });
  await expect(temporal).toBeVisible();
  for (const viewport of [{width:390,height:844}, {width:844,height:390}]) {
    await page.setViewportSize(viewport);
    const box = await temporal.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
    for (const selector of [".record-store-mobile-move", ".record-store-mobile-actions"]) {
      expect(overlaps(box, await chapter.locator(selector).boundingBox())).toBe(false);
    }
    await page.screenshot({ path:info.outputPath(`store-arrival-android-${viewport.width}.png`) });
  }
  for(let i=0;i<4;i++) await temporal.getByRole("button", {name:/Siguiente|Continuar/}).click();
  await chapter.getByRole("button", { name:/VISI.*N DE FRECUENCIA/ }).click();
  await expect.poll(async () => JSON.parse(await chapter.locator("canvas").getAttribute("data-chapter15-visuals")).futureEchoes).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});


test("Roxy and Rulo require physical clues before testimony and diary comparison stops before revelation", async ({ page }) => {
  test.setTimeout(180000);
  const errors=[]; page.on("pageerror", error => errors.push(error.message));
  await openCity(page, repaired, 3);
  await page.evaluate(() => {
    const storage=JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    const data=storage.slots.autosave.data;
    data.scene="chapter15-store";
    data.chapter15Progress={ started:true, arrived:true, hugoConsulted:true, consoleExamined:true, noteRead:true,
      hiddenChannelSeen:true, mixSequence:["silence","pulse","hidden"], channelIsolated:true, tapeTaken:true,
      storeEntered:true, storeArrivalSeen:true, evidence:["tito"], talked:["tito"], compared:false };
    data.positions["chapter15-store"]={x:2.55,z:3.25,yaw:Math.PI,viewYaw:0};
    localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole("button",{name:/comenzar/i}).click();
  await page.getByRole("button",{name:"Continuar",exact:true}).click();
  const chapter=page.getByRole("region",{name:/Cap.*15, El origen de la se.al/});
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});
  await expect(chapter.locator(".chapter15-cue")).toContainText("letra manuscrita",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  await chapter.getByRole("button",{name:"Cerrar aviso"}).click();
  await expect(chapter.locator(".chapter15-cue")).toContainText("ROXY",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  const roxy=chapter.getByRole("dialog",{name:/Conversaci.*n con roxy/});
  for(let i=0;i<4;i++)await roxy.getByRole("button",{name:/Siguiente|Continuar/}).click();
  await page.evaluate(() => {
    const storage=JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    storage.slots.autosave.data.positions["chapter15-store"]={x:7.55,z:-1.7,yaw:Math.PI,viewYaw:0};
    localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify(storage));
  });
  await page.reload();
  await page.getByRole("button",{name:/comenzar/i}).click();
  await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});
  await expect(chapter.locator(".chapter15-cue")).toContainText("funda de cinta",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  await chapter.getByRole("button",{name:"Cerrar aviso"}).click();
  await expect(chapter.locator(".chapter15-cue")).toContainText("RULO",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  const rulo=chapter.getByRole("dialog",{name:/Conversaci.*n con rulo/});
  for(let i=0;i<4;i++)await rulo.getByRole("button",{name:/Siguiente|Continuar/}).click();
  await chapter.getByRole("button",{name:"DIARIO"}).click();
  const diary=chapter.getByRole("dialog",{name:/Diario del cap.*15/});
  await diary.getByRole("button",{name:"Comparar con el registro de 2049"}).click();
  const comparison=chapter.getByRole("dialog",{name:/Conversaci.*n con compare/});
  for(let i=0;i<3;i++)await comparison.getByRole("button",{name:/Siguiente|Continuar/}).click();
  await expect(chapter.getByLabel(/Objetivo del cap.*15/)).toContainText(/Confrontaci/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  expect(saved.chapter15Progress.evidence).toEqual(["tito","roxy","rulo"]);
  expect(saved.chapter15Progress.talked).toEqual(["tito","roxy","rulo"]);
  expect(saved.chapter15Progress.confrontationUnlocked).toBe(true);
  expect(saved.chapter15Progress.completed).toBeUndefined();
  expect(saved.storyProgress.roxyMet).toBeFalsy();
  expect(saved.storyProgress.metalheadMet).toBeFalsy();
  expect(errors).toEqual([]);
});


test("the physical note and Frequency Vision reveal the hidden studio channel", async ({ page }) => {
  test.setTimeout(180000);
  const errors=[]; page.on("pageerror", error => errors.push(error.message));
  await openCity(page,repaired,3);
  await page.evaluate(() => {
    const storage=JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    const data=storage.slots.autosave.data;
    data.scene="chapter15-studio";
    data.chapter15Progress={started:true,arrived:true,hugoConsulted:true,consoleExamined:false,noteRead:false,
      visionActive:false,hiddenChannelSeen:false,mixSequence:[],channelIsolated:false,tapeTaken:false,
      storeEntered:false,evidence:[],talked:[],compared:false};
    data.positions["chapter15-studio"]={x:.6,z:1.47,yaw:Math.PI,viewYaw:0};
    localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify(storage));
  });
  const load=async()=>{await page.reload();await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
    const chapter=page.getByRole("region",{name:/Cap.*15, El origen de la se.al/});
    await expect(chapter.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});return chapter;};
  const place=async(x,z)=>page.evaluate(({x,z})=>{const storage=JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    storage.slots.autosave.data.positions["chapter15-studio"]={x,z,yaw:Math.PI,viewYaw:0};
    localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify(storage));},{x,z});
  let chapter=await load();
  await expect(chapter.locator(".chapter15-cue")).toContainText("Consola",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  const panel=chapter.getByRole("dialog",{name:"Consola del cuarto canal"});
  await expect(panel).toContainText("La nota de Hugo");
  await expect(panel).not.toContainText("primero apag");
  await panel.getByRole("button",{name:"Cerrar"}).click();
  await place(5.95,-2.7); chapter=await load();
  await expect(chapter.locator(".chapter15-cue")).toContainText("nota",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  await expect(chapter.locator(".studio-examine-message")).toContainText("NOTA DE HUGO");
  await chapter.getByRole("button",{name:"Cerrar aviso"}).click();
  await chapter.getByRole("button",{name:/VISI.*N DE FRECUENCIA/}).click();
  await expect(chapter).toHaveAttribute("data-frequency-vision","active");
  await place(-4.3,.2); chapter=await load();
  await expect(chapter.locator(".chapter15-cue")).toContainText("canal desconocido",{timeout:30000});
  await chapter.locator(".chapter15-cue").click();
  await expect(chapter.getByLabel(/Objetivo del cap.*15/)).toContainText("Aisl");
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
  expect(saved.chapter15Progress.consoleExamined).toBe(true);
  expect(saved.chapter15Progress.noteRead).toBe(true);
  expect(saved.chapter15Progress.hiddenChannelSeen).toBe(true);
  expect(saved.chapter15Progress.channelIsolated).toBe(false);
  expect(errors).toEqual([]);
});
