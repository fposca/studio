import { test, expect } from "@playwright/test";

test.afterEach(async ({ page }) => { await page.evaluate(() => window.unmountGame?.()); });

test("the shop groups the real albums and opens supplied songs at the listening station", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: /Omitir cinem/ }).click();
  const picker = page.getByRole("group", { name: "Elegir escenario" });
  const extra = picker.getByRole("button", { name: "Escenario extra: Tienda de discos" });
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(extra).toBeInViewport();
  await extra.click();
  await page.getByRole("button", { name: "Entrar a la tienda" }).click();

  const shop = page.getByRole("dialog", { name: "Tienda de discos Neonboy" });
  await expect(shop).toBeVisible();
  await expect(shop.locator(".record-store-album")).toHaveCount(7);
  await expect(shop.getByRole("button", { name: "Disco Glowshine", exact: true })).toBeVisible();
  await shop.getByRole("button", { name: "Reproducir Anubis Servant" }).click();
  await expect(shop.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/bjlfrB-15P4/);
  await expect(shop.getByRole("link", { name: "Abrir en YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=bjlfrB-15P4");

  await shop.getByRole("button", { name: "Disco Arcade" }).click();
  await expect(shop.getByRole("button", { name: "Reproducir Addams Freezer" })).toBeVisible();
  await expect(shop.getByRole("button", { name: "Reproducir Wonder Boy" })).toBeVisible();
  await expect(shop.getByRole("button", { name: "Reproducir Guille´s Theme" })).toBeVisible();
  await shop.getByRole("button", { name: "Reproducir Mortal Kombat" }).click();
  await expect(shop.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/n9ALyEvClf8/);
  await expect(shop.getByRole("link", { name: "Abrir en YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=n9ALyEvClf8");

  await shop.getByRole("group", { name: "Elegir discografía" }).getByRole("button", { name: /9th Revelation/ }).click();
  await expect(shop.locator(".record-store-album")).toHaveCount(6);
  await expect(shop.getByRole("button", { name: "Disco Krampus" })).toBeVisible();
  await expect(shop.getByRole("button", { name: "Disco Silent Moon" })).toBeVisible();
  await expect(shop.locator(".record-store-band-logo")).toBeVisible();

  await shop.getByRole("button", { name: "Disco Krampus" }).click();
  await shop.getByRole("button", { name: "Reproducir Krampus" }).click();
  await expect(shop.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/8adOpLeaVcE/);

  await shop.getByRole("button", { name: "Disco Unholy Fire, próximo lanzamiento" }).click();
  await expect(shop.locator(".incoming-message")).toContainText("INCOMING");
  await expect(shop.locator("iframe")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(shop).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the direct 3D store includes all 13 named records and lets the player select one", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/discografia/");
  expect(response?.status()).toBe(200);
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop).toBeVisible();
  await expect(shop.locator(".record-store-album")).toHaveCount(7);
  const scene = shop.locator(".record-store-3d");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(scene.locator(".record-store-loading")).toHaveCount(0);
  const canvas = scene.locator("canvas");
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((node) => node.width)).toBeGreaterThan(1000);
  await page.keyboard.down("Shift");
  await page.keyboard.down("w");
  await expect(shop.locator(".record-store-album-cue")).toContainText("Gloom", { timeout: 12_000 });
  await expect(shop.locator(".record-store-album-cue")).toContainText("Presioná E para escuchar");
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
  await page.keyboard.press("e");
  await expect(shop.getByRole("button", { name: "Disco Gloom" })).toHaveAttribute("aria-pressed", "true");
  await expect(shop.locator(".record-store-player iframe")).toHaveAttribute("src", /gLToLcxY3G0/);
  expect(errors).toEqual([]);
});

test("the album tray and listening station fold independently", async ({ page }) => {
  await page.goto("/discografia/");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  const tray = shop.locator(".record-store-wall");
  const listener = shop.locator(".record-store-listener");
  await expect(tray.locator(".record-store-album")).toHaveCount(7);

  await shop.getByRole("button", { name: "Minimizar discos" }).click();
  await expect(tray).toHaveClass(/is-minimized/);
  await expect(tray.locator(".record-store-wall-body")).toBeHidden();
  await expect(listener.locator(".record-store-listener-body")).toBeVisible();

  await shop.getByRole("button", { name: /Minimizar discograf/ }).click();
  await expect(listener).toHaveClass(/is-minimized/);
  await expect(listener.locator(".record-store-listener-body")).toBeHidden();
  await expect(shop.getByRole("button", { name: "Maximizar discos" })).toHaveAttribute("aria-expanded", "false");
  await expect(shop.getByRole("button", { name: /Maximizar discograf/ })).toHaveAttribute("aria-expanded", "false");

  await page.setViewportSize({ width: 390, height: 700 });
  const trayBox = await tray.boundingBox();
  const listenerBox = await listener.boundingBox();
  expect(listenerBox.y + listenerBox.height).toBeLessThan(trayBox.y);

  await shop.getByRole("button", { name: "Maximizar discos" }).click();
  await expect(tray.locator(".record-store-wall-body")).toBeVisible();
  await shop.getByRole("button", { name: "Disco Gloom" }).click();
  await expect(listener).not.toHaveClass(/is-minimized/);
  await expect(listener.locator(".record-store-listener-body")).toBeVisible();
});
test("the listening station plays, pauses, stops and restarts the selected song", async ({ page }) => {
  await page.addInitScript(() => {
    window.albumPlayerCommands = [];
    window.YT = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3 },
      Player: class {
        constructor(frame, options) {
          this.frame = frame;
          this.events = options.events;
          queueMicrotask(() => this.events.onReady());
        }
        playVideo() { window.albumPlayerCommands.push("play"); this.events.onStateChange({ data: 1 }); }
        pauseVideo() { window.albumPlayerCommands.push("pause"); this.events.onStateChange({ data: 2 }); }
        stopVideo() { window.albumPlayerCommands.push("stop"); this.events.onStateChange({ data: 2 }); }
        seekTo(seconds) { window.albumPlayerCommands.push(`seek:${seconds}`); }
        destroy() { window.albumPlayerCommands.push("destroy"); }
      }
    };
  });
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Video simulado</title>" }));
  await page.goto("/tests/fixtures/album-player.html");
  const controls = page.getByRole("group", { name: /Controles de la canci/ });
  await expect(controls.getByRole("button", { name: /Pausar canci/ })).toBeEnabled();
  await expect(page.getByTestId("playback")).toHaveText("playing");
  const controlBox = await controls.boundingBox();
  const screenBox = await page.locator(".record-store-player iframe").boundingBox();
  expect(controlBox.y + controlBox.height).toBeLessThan(screenBox.y);

  await controls.getByRole("button", { name: /Pausar canci/ }).click();
  await expect(page.getByTestId("playback")).toHaveText("paused");
  await controls.getByRole("button", { name: /Reproducir canci/ }).click();
  await expect(page.getByTestId("playback")).toHaveText("playing");
  await controls.getByRole("button", { name: /Detener canci/ }).click();
  await expect(page.getByTestId("playback")).toHaveText("stopped");
  await controls.getByRole("button", { name: /Reproducir canci/ }).click();
  await expect(page.getByTestId("playback")).toHaveText("playing");
  expect(await page.evaluate(() => window.albumPlayerCommands)).toEqual(["play", "pause", "play", "stop", "seek:0", "play"]);

  await page.getByRole("button", { name: "Elegir Udjat" }).click();
  await expect(page.locator(".record-store-player iframe")).toHaveAttribute("src", /gkcQWmWGUSY/);
  await expect.poll(() => page.evaluate(() => window.albumPlayerCommands.filter((command) => command === "destroy").length)).toBe(1);
});
