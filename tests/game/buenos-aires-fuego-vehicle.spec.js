import { test, expect } from "@playwright/test";
import { openCity } from "./citySession.js";

const prepared = {
  vigilanteEncountered: true,
  vigilanteStarted: true,
  vigilanteHealth: 0,
  vigilanteDefeated: true,
  fuegoStarted: true,
  fuegoKeyDiscovered: true,
  fuegoKeyTaken: true,
  fuegoPowerTerminalExamined: true,
  fuegoPowerMaintenanceOpen: true,
  fuegoPowerCellTaken: true,
  fuegoNavigationClues: ["calle", "cielo", "libertad"],
  fuegoNavigationSequence: ["calle", "cielo", "libertad"],
  fuegoNavigationModuleTaken: true,
  fuegoKeyInstalled: true,
  fuegoPowerCellInstalled: true,
  fuegoNavigationModuleInstalled: true,
  fuegoRecordShown: true,
};

test("parked Fuego systems align with the GLB with frequency vision off", async ({ page }, testInfo) => {
  const city = await openCity(page, {
    ...prepared, fuegoPowered: true, escapeBriefed: true, escapeUnlocked: true,
  }, 3, { x: -14, z: 29, yaw: Math.PI, viewYaw: 0 });
  await expect(city.locator("canvas")).toHaveAttribute("data-city-escape-ready", "true", { timeout: 45000 });
  await expect(city.locator("canvas")).toHaveAttribute("data-city-fuego-operational", "true", { timeout: 10000 });
  await page.screenshot({ path: testInfo.outputPath("fuego-calibrated.png") });
});

test("Fuego rises 0.25 m, pauses in place, and other cars keep flying", async ({ page }) => {
  await page.goto("/discografia/");
  const measured = await page.evaluate(async () => {
    const { createBuenosAiresFlyingVehicles } = await import("/src/game/buenosAiresFlyingVehicles.js");
    const fleet = createBuenosAiresFlyingVehicles({ add() {} });
    await fleet.ready;
    const player = { x: -10, z: 29 };
    const progress = { introSeen: true, fuegoStarted: true, fuegoPowerCellInstalled: true, escapeBriefed: true };
    const fuego = fleet.vehicles.find(vehicle => vehicle.route.id === "renault-fuego");
    const ambient = fleet.vehicles.filter(vehicle => vehicle.route.id !== "renault-fuego");
    fleet.prepareEscape(true);
    fleet.update(0, player, null, progress, true);
    const parkedY = fuego.group.position.y;
    progress.fuegoPowered = true;
    for (let i = 0; i < 26; i++) fleet.update(.1, player, null, progress, false);
    const raisedY = fuego.group.position.y;
    const startupBeforePause = fleet.fuegoStartupAge;
    fleet.update(1, player, null, progress, true);
    const pauseHeld = fuego.group.position.y === raisedY && fleet.fuegoStartupAge === startupBeforePause;
    for (let i = 0; i < 100; i++) fleet.update(.1, player, null, progress, false);
    const before = ambient.map(vehicle => vehicle.group.position.clone());
    fleet.update(.1, player, null, progress, false);
    const ambientMovement = ambient.map((vehicle, i) => vehicle.group.position.distanceTo(before[i]));
    const parkedXZ = Math.hypot(fuego.group.position.x + 6, fuego.group.position.z - 23);
    fleet.dispose();
    return { parkedY, raisedY, pauseHeld, ambientMovement, parkedXZ };
  });
  expect(measured.raisedY - measured.parkedY).toBeGreaterThan(.22);
  expect(measured.raisedY - measured.parkedY).toBeLessThan(.28);
  expect(measured.pauseHeld).toBe(true);
  expect(measured.parkedXZ).toBeLessThan(.01);
  expect(measured.ambientMovement.every(distance => distance > .05)).toBe(true);
});
