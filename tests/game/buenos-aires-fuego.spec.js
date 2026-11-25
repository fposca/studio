import { test, expect } from "@playwright/test";
import { openCity } from "./citySession.js";
const defeated = { vigilanteEncountered:true, vigilanteStarted:true, vigilanteHealth:0, vigilanteDefeated:true };
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data);
async function finishDialogue(city, count) { for(let i=0;i<count;i++) await city.locator(".city-dialogue button").click(); }
async function reposition(page,x,z) {
  await page.evaluate(({x,z})=>{
    const saves=JSON.parse(localStorage.getItem("neonboy.universe.saves.v1"));
    saves.slots.autosave.data.positions["buenos-aires-2049"]={x,z,yaw:Math.PI,viewYaw:0};
    localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify(saves));location.reload();
  },{x,z});
  await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  await expect(page.locator(".neon-buenos-aires .record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});
}
async function flag(page,key,value=true) { await expect.poll(async()=> (await saved(page)).cityProgress[key]).toEqual(value); }

test("Fuego exploration, inventory, manual installation, ignition and reload preserve the complete adventure",async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const city=await openCity(page,defeated,3,{x:-6,z:27,yaw:Math.PI,viewYaw:0});
  await expect(city.locator("canvas")).toHaveAttribute("data-city-escape-ready","true",{timeout:45000});
  await expect(city.locator(".studio-examine-cue")).toContainText("Renault Fuego");
  await page.keyboard.press("e");await finishDialogue(city,6);await flag(page,"fuegoStarted");
  await reposition(page,-38,-4.8);
  await page.keyboard.press("c");
  await expect(city.locator(".city-notice")).toContainText("CHIP CIAN DETECTADO");
  await city.locator(".city-notice button").click();
  await expect(city.locator(".studio-examine-cue")).toContainText(/llave|confiter/);
  await page.keyboard.press("e");await finishDialogue(city,3);await flag(page,"fuegoKeyTaken");
  await reposition(page,-38.4,6.7);await page.keyboard.press("e");
  const panel=city.locator(".city-fuego-panel");await expect(panel).toContainText("ESTACI");
  await panel.getByRole("button",{name:/Presentar identificaci/}).click();await expect(panel).toContainText("IDENTIDAD NO REGISTRADA");
  await panel.getByRole("button",{name:/Pedir ayuda/}).click();await expect(panel).toContainText(/puerto local/);
  await panel.getByRole("button",{name:/Acceso local/}).click();
  await panel.getByRole("button",{name:/Recoger celda/}).click();await finishDialogue(city,3);await flag(page,"fuegoPowerCellTaken");
  const discovered=[];
  for(const [x,id] of [[-46,"calle"],[-57,"cielo"],[-69,"libertad"]]) {
    await reposition(page,x,-23.7);await page.keyboard.press("e");
    await expect(city.locator(".city-notice")).toContainText("Anotado en el diario");
    discovered.push(id);await flag(page,"fuegoNavigationClues",discovered);
    await city.locator(".city-notice button").click();
  }
  await flag(page,"fuegoNavigationClues",["calle","cielo","libertad"]);
  await reposition(page,15.2,18.8);await page.keyboard.press("e");
  await expect(panel).toContainText(/NAVEGACI/);
  await panel.getByRole("button",{name:"CIELO",exact:true}).click();await expect(panel.locator(".city-fuego-code")).not.toContainText("CIELO");
  for(const name of ["CALLE","CIELO","LIBERTAD"])await panel.getByRole("button",{name,exact:true}).click();
  await panel.getByRole("button",{name:/Recoger m/}).click();await finishDialogue(city,1);await flag(page,"fuegoNavigationModuleTaken");
  await expect(city.locator(".city-mission")).toContainText("COMPONENTES 3/3");
  await city.getByRole("button",{name:"INVENTARIO",exact:true}).click();
  const inventory=city.getByRole("dialog",{name:/Inventario/});
  for(const name of ["Llave del Fuego","Celda de energ","M\u00f3dulo de navegaci"])await expect(inventory.getByRole("button",{name:new RegExp(name)})).toHaveCount(1);
  await expect(inventory.locator(".universe-inventory-action")).toHaveCount(0);
  await inventory.getByRole("button",{name:"Cerrar inventario"}).click();
  await reposition(page,-6,27);await page.keyboard.press("e");
  await expect(panel.getByRole("button",{name:"Iniciar sistema de vuelo"})).toBeDisabled();
  await panel.locator('[data-component="fuego_key"] button').click();await flag(page,"fuegoKeyInstalled");
  await panel.getByRole("button",{name:"Abrir inventario"}).click();
  await inventory.getByRole("button",{name:/Celda de energ/}).click();await inventory.getByRole("button",{name:/Instalar/}).click();await flag(page,"fuegoPowerCellInstalled");
  await panel.locator('[data-component="fuego_navigation_module"] button').click();
  await expect(city.locator(".city-dialogue")).toContainText("ARCHIVO DE ORIGEN DETECTADO");
  await finishDialogue(city,4);await flag(page,"fuegoRecordShown");
  await page.screenshot({path:testInfo.outputPath("fuego-installed.png")});
  await panel.getByRole("button",{name:"Iniciar sistema de vuelo"}).click();
  await expect(city.locator(".city-dialogue")).toHaveAttribute("data-line-id","city-fuego-flight-briefing-0");
  await finishDialogue(city,4);await flag(page,"escapeBriefed");await flag(page,"escapeUnlocked");
  await expect(city.locator(".city-flight")).toHaveAttribute("data-status","playing");
  await page.screenshot({path:testInfo.outputPath("fuego-operational.png")});
  await city.getByRole("button",{name:"Volver al Fuego",exact:true}).click();
  await reposition(page,-6,27);await expect(city.locator(".city-dialogue")).toHaveCount(0);await expect(city.getByRole("progressbar")).toHaveCount(0);
  await expect(city.locator(".city-mission")).toContainText("ESCAP");
  const data=await saved(page);expect(data.cityProgress.completed).not.toBe(true);expect(data.cityProgress.fuegoNavigationModuleInstalled).toBe(true);
  expect(errors).toEqual([]);
});

test("touch repair panel fits a mobile viewport and keeps installation explicit",async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  const city=await openCity(page,{...defeated,fuegoStarted:true,fuegoKeyDiscovered:true,fuegoKeyTaken:true},3,{x:-6,z:27,yaw:Math.PI,viewYaw:0});
  await expect(city.locator(".studio-examine-cue")).toContainText("Renault Fuego");await city.locator(".studio-examine-cue").tap();
  const panel=city.locator(".city-fuego-panel");await expect(panel).toBeVisible();
  await expect(panel.getByRole("button",{name:"Iniciar sistema de vuelo"})).toBeDisabled();
  await panel.locator('[data-component="fuego_key"] button').tap();await flag(page,"fuegoKeyInstalled");
  const bounds=await panel.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(391);expect(bounds.height).toBeLessThanOrEqual(825);
  await page.screenshot({path:testInfo.outputPath("fuego-mobile-panel.png")});
  await panel.getByRole("button",{name:"Cerrar panel"}).tap();await expect(page.getByRole("button",{name:"Mover \u2191",exact:true})).toBeVisible();await context.close();
});
