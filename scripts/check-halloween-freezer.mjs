import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--use-gl=angle", "--use-angle=swiftshader"]
});

try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => console.error("PAGE ERROR:", error.message));
  await page.addInitScript(() => {
    window.__testAudio = [];
    window.Audio = class extends EventTarget {
      constructor(src) {
        super();
        this.src = src;
        this.paused = true;
        this.volume = 1;
        this.currentTime = 0;
        window.__testAudio.push(this);
      }
      play() {
        this.paused = false;
        this.dispatchEvent(new Event("playing"));
        return Promise.resolve();
      }
      pause() {
        if (this.paused) return;
        this.paused = true;
        this.dispatchEvent(new Event("pause"));
      }
    };
    window.__testPlayers = [];
    window.YT = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3, CUED: 5 },
      Player: class {
        constructor(iframe, options) {
          this.iframe = iframe;
          this.events = options.events;
          window.__testPlayers.push(this);
          queueMicrotask(() => this.events.onReady({ target: { getPlayerState: () => -1 } }));
        }
        destroy() {}
      }
    };
  });
  await page.route("**/youtube-nocookie.com/**", (route) => route.abort());
  await page.goto("http://127.0.0.1:5175/dicografia/");
  const freezer = () => page.evaluate(() => {
    const audio = window.__testAudio.find((item) => item.src.includes("freezer"));
    return audio && { paused: audio.paused, volume: audio.volume, loop: audio.loop };
  });
  await page.waitForFunction(() => !document.querySelector(".halloween-loading-screen"), { timeout: 30000 });
  await page.waitForTimeout(650);
  assert.deepEqual(await freezer(), { paused: false, volume: 0.12, loop: true });

  await page.getByRole("button", { name: "PERSONAJES" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Tito/ }).click();
  await page.waitForTimeout(650);
  assert.equal((await freezer()).volume, 0.025);
  await page.evaluate(() => window.__testAudio.at(-1).dispatchEvent(new Event("ended")));
  await page.waitForTimeout(200);
  assert.equal((await freezer()).volume, 0.12);
  await page.getByRole("dialog").getByRole("button", { name: /Repetir sonido/ }).click();
  await page.waitForTimeout(200);
  assert.equal((await freezer()).volume, 0.025);
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
  await page.waitForTimeout(650);
  assert.equal((await freezer()).volume, 0.12);

  await page.getByRole("button", { name: "DISCOS" }).click();
  await page.locator(".halloween-track-list button").first().click();
  await page.waitForTimeout(450);
  assert.equal((await freezer()).paused, true);
  await page.evaluate(() => window.__testPlayers.at(-1).events.onStateChange({ data: 2 }));
  await page.waitForTimeout(650);
  assert.deepEqual(await freezer(), { paused: false, volume: 0.12, loop: true });
  await page.evaluate(() => window.__testPlayers.at(-1).events.onStateChange({ data: 1 }));
  await page.waitForTimeout(450);
  assert.equal((await freezer()).paused, true);
  await page.evaluate(() => window.__testPlayers.at(-1).events.onStateChange({ data: 0 }));
  await page.waitForTimeout(650);
  assert.equal((await freezer()).paused, false);
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();

  await page.getByRole("button", { name: "ROCKOLA" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Tomar fichas" }).click();
  await page.locator(".halloween-jukebox-list button").first().click();
  await page.waitForTimeout(450);
  assert.equal((await freezer()).paused, true);
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
  await page.waitForTimeout(650);
  assert.equal((await freezer()).paused, false);

  await page.getByRole("button", { name: "Silenciar música ambiental Freezer" }).click();
  await page.waitForTimeout(450);
  assert.equal((await freezer()).paused, true);
  await page.getByRole("button", { name: "Activar música ambiental Freezer" }).click();
  await page.waitForTimeout(650);
  assert.equal((await freezer()).paused, false);
  for (const width of [844, 667]) {
    await page.setViewportSize({ width, height: 375 });
    const box = await page.locator(".halloween-ambient-toggle").boundingBox();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= 375,
      `El control de ambiente debe verse en paisaje ${width}x375`);
  }
  console.log("Freezer: fondo, voz, YouTube (pausa/fin), rockola, silencio manual y paisaje OK");
} finally {
  await browser.close();
}
