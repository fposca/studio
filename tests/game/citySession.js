import { expect } from "@playwright/test";
export async function openCity(page,extra={},hearts=3,position={x:0,z:22,yaw:Math.PI,viewYaw:0}){
  page.setDefaultTimeout(12000);
  await page.addInitScript(({extra,hearts,position})=>{
    if(sessionStorage.getItem("vigilante-test-seeded"))return;
    sessionStorage.setItem("vigilante-test-seeded","true");
    const data={scene:"buenos-aires-2049",combatHearts:hearts,      arcadeProgress: { recordStoreFutureVisionSeen: true, recordStoreGhostSeen: true },
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

      chapter10Progress:{coreAnalyzed:true,signalDetected:true,hugoConsulted:true,signalReconstructed:true,underworldUnlocked:true,chapterCompleted:true},
      underworldProgress:{bridgeCrossed:true,completed:true,combatVersion:1,enemies:[0,0],gargolaHealth:0,testigoHealth:0,testigoDefeatLineSeen:true},
      cathedralProgress:{completed:true},
      throneProgress:{entered:true,inscriptionRead:true,vows:["memoria","voluntad","libertad"],hallOpen:true,coreInspected:["origen","eco","enlace"],conductors:["origen","eco","enlace"],throneOpen:true,bossIntro:true,bossHealth:0,bossDefeated:true,transmissionExamined:true,completed:true},
      cityProgress:{entered:true,introSeen:true,obeliskExplored:true,yellowCarSeen:true,citizens:["ba-man-1","ba-woman-1","ba-executive-1"],signalFound:true,disconnectedMet:true,advertisingComplete:true,trafficComplete:true,coreComplete:true,synchronizationSeen:true,...extra},
      positions:{"buenos-aires-2049":position}};
    localStorage.setItem("neonboy.universe.saves.v1",JSON.stringify({version:1,slots:{autosave:{savedAt:Date.now(),data}}}));
  },{extra,hearts,position});
  await page.goto("/discografia/");await page.getByRole("button",{name:/comenzar/i}).click();await page.getByRole("button",{name:"Continuar",exact:true}).click();
  const city=page.locator(".neon-buenos-aires");
  await expect(city.locator(".record-store-3d")).toHaveAttribute("data-ready","true",{timeout:90000});return city;
}
