import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-webgl", "--ignore-gpu-blocklist"] });
const errors = [];
for (const mode of ["archive"]) {
 const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
 const page = await context.newPage();
 page.on("pageerror", e => errors.push(e.message));
 page.on("console", m => { if (m.type() === "error" && !m.location().url.endsWith("favicon.ico")) errors.push(m.text()); });
 await page.addInitScript(mode => {
  const data = {
   scene: "cathedral",
   chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true, signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
   underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1, enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
   cathedralProgress: { entered: true, inscriptionRead: true, seals: ["memoria","tiempo","verdad"],
    memories: mode === "altar" ? ["nave","partenon","fracturada"] : [], altarActivated: mode === "altar", recordingHeard: mode === "altar", completed: mode === "altar" },
   positions: { cathedral: { x: 0, z: mode === "altar" ? -48.7 : -21, yaw: Math.PI, viewYaw: 0 } },
  };
  localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify({version:1,slots:{autosave:{savedAt:Date.now(),data}}}));
 }, mode);
 await page.goto("http://127.0.0.1:4174/");
 await page.getByRole("button", { name: /comenzar/i }).click();
 await page.getByRole("button", { name: "Continuar", exact: true }).click();
 await page.locator(".neon-cathedral .record-store-3d[data-ready=true]").waitFor({timeout:90000});
 await page.waitForTimeout(1200);
 await page.screenshot({ path: ".tmp/cathedral-energy/production-" + mode + ".jpg", quality: 85 });
 if(mode === "archive") {
  await page.getByRole("button", {name:/VISI.N DE FRECUENCIA/}).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: ".tmp/cathedral-energy/production-vision.jpg", quality:85 });
 }
 await context.close();
}
console.log(JSON.stringify({errors}));
await browser.close();
