import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("http://127.0.0.1:5175/discografia/");
  await page.locator("canvas.halloween-scene-canvas").waitFor({ state: "visible" });
  await page.getByRole("progressbar").waitFor({ state: "hidden", timeout: 60000 });
  const archive = page.locator(".halloween-archive-status");
  await archive.locator("summary").waitFor({ state: "visible" });
  if (!(await archive.locator("summary").textContent()).includes("0/20")) throw new Error("Premature anniversary progress");
  await archive.locator("summary").click();
  if (!(await archive.textContent()).includes("Llamadas del mostrador")) throw new Error("Missing progress checklist");
  await archive.locator("summary").click();
  await page.keyboard.down("w");
  await page.locator(".halloween-prompt").filter({ hasText: /Recoger anteojos/ }).waitFor({ state: "visible", timeout: 15000 });
  await page.keyboard.up("w");
  await page.keyboard.press("e");
  await page.keyboard.press("c");
  await page.waitForFunction(() => document.querySelector("canvas.halloween-scene-canvas")?.dataset.frequencyVision === "active");
  const audio = await page.evaluate(async () => {
    const { createHalloweenSfx } = await import("/discografia/halloweenSfx.js");
    const sfx = createHalloweenSfx();
    const durations = {};
    for (const id of ["demon-code-hit", "demon-taunt", "demon-shield"]) {
      const a = sfx.play(id);
      await new Promise((resolve, reject) => {
        if (a.readyState >= 2) return resolve();
        a.addEventListener("loadeddata", resolve, { once: true });
        a.addEventListener("error", () => reject(new Error(id + " failed to load")), { once: true });
        setTimeout(() => reject(new Error(id + " timed out")), 5000);
      });
      durations[id] = a.duration;
    }
    sfx.dispose();
    return durations;
  });
  console.log(JSON.stringify({ matrix: "active", audio, errors }));
  if (errors.length) throw new Error("Shop smoke test failed");
} finally { await browser.close(); }
