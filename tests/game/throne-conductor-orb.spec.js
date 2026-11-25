import { test, expect } from "@playwright/test";

async function enterCore(page, inspected, playerYaw = Math.PI) {
  await page.addInitScript(({ coreInspected, playerYaw }) => {
    const data = {
      scene: "abyss-throne",
      arcadeProgress: { recordStoreFutureVisionSeen: true, recordStoreGhostSeen: true },
      studioProgress: { impossibleRecordingStarted: true, signalComputerExamined: true,
        signalAnalysisCompleted: true, reversedSignalDecoded: true, studioAnomalySeen: true,
        rooftopClueKnown: true },
      rooftopProgress: { introSeen: true, explored: true, panelExamined: true,
        switches: ["luna", "rayo", "antena"], bearing: -34, antennaAligned: true,
        frequency: 9, frequencyDecoded: true, safeReached: true, anomalySeen: true,
        transmissionCollected: true },
      lostShipProgress: {
        hugoBriefed: true, signalSegments: [0, 1, 2], signalDecoded: true,
        linkActivated: true, accessLog: true, accessSymbols: ["pulse", "coil", "gate"],
        accessGranted: true, reactorExamined: true, moduleTaken: true, moduleInstalled: true,
        circuitPath: ["internal", "life", "bridge"], powerRestored: true,
        lockerClues: ["log", "sign", "monitor"], lockerSymbols: ["triangle", "moon", "wave"],
        lockerOpened: true, regulators: [2, 1, 2], lifeStable: true, bridgeCardUsed: true,
        navigationClues: ["reactor", "storage", "bridge"], navigationValues: ["09", "01", "temple"],
        navigationRestored: true, travelerMet: true, memoryTaken: true, memoryInstalled: true,
        archiveRecovered: true, orbAnnouncementSeen: true,
      },
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true,
        vows: ["memoria", "voluntad", "libertad"], hallOpen: true,
        coreInspected, visionActive: true, reflectorIndex: coreInspected.length === 3 ? 0 : -1,
        conductors: [] },
      positions: { "abyss-throne": { x: -5.5, z: -29, yaw: playerYaw, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  }, { coreInspected: inspected, playerYaw });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const level = page.locator(".neon-throne");
  await expect(level.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  return level;
}

test("Chapter 13 orb registers a conductor crystal", async ({ page }) => {
  const level = await enterCore(page, []);
  await expect(level.locator(".neon-orb-hud")).toBeVisible();
  await expect(level.locator(".neon-orb-hud button").first()).toBeEnabled();
  await page.keyboard.press("f");
  await expect(level.locator(".throne-mission")).toContainText("1/3");
});

test("Chapter 13 orb energizes the crystal selected by the reflector", async ({ page }) => {
  const level = await enterCore(page, ["origen", "eco", "enlace"]);
  await expect(level.locator(".neon-orb-hud")).toBeVisible();
  await expect(level.locator(".neon-orb-hud button").first()).toBeEnabled();
  await page.keyboard.press("f");
  await expect(level.locator(".throne-mission")).toContainText("1/3");
});

test("Chapter 13 click aims at a visible crystal even when the avatar faces away", async ({ page }) => {
  const level = await enterCore(page, [], 0);
  const canvas = level.locator("canvas");
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.284);
  await expect(level.locator(".throne-mission")).toContainText("1/3");
});
