import { test, expect } from "@playwright/test";

test("the rockola uses collected coins and controls the ten music videos", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__youtubeCalls = [];
    window.YT = {
      PlayerState: { PLAYING: 1 },
      Player: class {
        constructor(_frame, options) {
          window.setTimeout(() => options.events.onReady(), 0);
        }
        playVideo() { window.__youtubeCalls.push("play"); }
        pauseVideo() { window.__youtubeCalls.push("pause"); }
        stopVideo() { window.__youtubeCalls.push("stop"); }
        getCurrentTime() { return 42; }
        seekTo(time) { window.__youtubeCalls.push(["seek", time]); }
        destroy() { window.__youtubeCalls.push("destroy"); }
      }
    };
  });
  await page.route("https://www.youtube.com/embed/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Mock YouTube</title>" }));
  await page.goto("/discografia/");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop).toBeVisible();

  await page.keyboard.press("v");
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-view", "primera");
  await page.keyboard.press("Space");
  await expect(shop.locator(".record-store-view-status")).toContainText("SALTANDO");

  await shop.getByRole("button", { name: "Abrir rockola" }).click();
  const jukebox = page.getByRole("dialog", { name: "Rockola de Neonboy" });
  await expect(jukebox).toBeVisible();
  await expect(jukebox.getByRole("button", { name: /^Elegir video / })).toHaveCount(10);
  await jukebox.getByRole("button", { name: "Elegir video New Born" }).click();
  await expect(jukebox.getByRole("status")).toContainText("Faltan monedas");
  await expect(jukebox.locator("iframe")).toHaveCount(0);
  await jukebox.getByRole("button", { name: "Cerrar rockola" }).click();

  await page.keyboard.down("w");
  await page.waitForTimeout(550);
  await page.keyboard.up("w");
  await page.keyboard.down("d");
  await expect(shop.locator(".record-store-nearby")).toContainText("Tomar monedas", { timeout: 8_000 });
  await page.keyboard.up("d");
  await page.keyboard.press("e");
  await expect(shop.locator(".record-store-arcade-hud")).toContainText("10/10 monedas");

  await shop.getByRole("button", { name: "Abrir rockola" }).click();
  await jukebox.getByRole("button", { name: "Elegir video New Born" }).click();
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("9 / 10");
  await expect(jukebox.locator("iframe")).toHaveAttribute("src", /youtube\.com\/embed\/bPp4YoSrbmo/);
  await expect(jukebox.getByRole("button", { name: "Pausar video" })).toBeEnabled();
  await jukebox.getByRole("button", { name: "Pausar video" }).click();
  await jukebox.getByRole("button", { name: "Retroceder 10 segundos" }).click();
  await jukebox.getByRole("button", { name: "Adelantar 10 segundos" }).click();
  await jukebox.getByRole("button", { name: "Detener video" }).click();
  await jukebox.getByRole("button", { name: "Reproducir video" }).click();
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("9 / 10");
  expect(await page.evaluate(() => window.__youtubeCalls)).toEqual(["pause", ["seek", 32], ["seek", 52], "stop", "play"]);

  await jukebox.getByRole("button", { name: "Cerrar rockola" }).click();
  const outsideScreen = shop.locator(".record-store-video-layer iframe");
  await expect(outsideScreen).toHaveAttribute("src", /youtube\.com\/embed\/bPp4YoSrbmo/);
  await expect(outsideScreen).toHaveCount(1);
  await shop.getByRole("button", { name: "Abrir rockola" }).click();
  await expect(outsideScreen).toHaveCount(0);
  await expect(jukebox.locator("iframe")).toHaveAttribute("src", /bPp4YoSrbmo.*start=42/);
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("9 / 10");

  await jukebox.getByRole("button", { name: "Elegir video Krampus" }).click();
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("8 / 10");
  await expect(jukebox.locator("iframe")).toHaveAttribute("src", /youtube\.com\/embed\/8adOpLeaVcE/);
  for (const title of ["Jesus is King", "Burn Lies", "Streets of Sleep", "Faster", "Secrets", "Lost Ones", "Rainbow", "Oh Evil"]) {
    await jukebox.getByRole("button", { name: "Elegir video " + title }).click();
  }
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("0 / 10");
  await jukebox.getByRole("button", { name: "Elegir video Krampus" }).click();
  await expect(jukebox.getByRole("status")).toContainText("Faltan monedas");
  await expect(jukebox.locator("iframe")).toHaveAttribute("src", /youtube\.com\/embed\/3yUhiSBNfJA/);
  await jukebox.getByRole("button", { name: "Tomar monedas de la mesa" }).click();
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("10 / 10");
  await page.keyboard.press("Escape");
  await expect(jukebox).toHaveCount(0);
  await expect(shop).toBeVisible();
  expect(errors).toEqual([]);
});
