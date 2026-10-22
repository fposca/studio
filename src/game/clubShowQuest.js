import { loadMasterTapeProgress } from "./masterTapeQuest.js";

export const CLUB_SHOW_SAVE_KEY = "neonboy.universe.club-show.v1";
export const SOUND_CHECK_EQUIPMENT = ["mixer", "amplifier", "microphone"];

export const INITIAL_CLUB_SHOW_QUEST = Object.freeze({
  hugoSuggestedShow: false,
  credentialGranted: false,
  charlyMet: false,
  backstageAuthorized: false,
  soundcheckStarted: false,
  inspected: [],
  soundcheckComplete: false,
  clubShowReady: false,
  recitalCompleted: false,
  anomalySeen: false,
  anomalyInvestigated: false,
  arcadeClueKnown: false,
});

export function normalizeClubShowQuest(value, masterTape) {
  const completedMaster = masterTape?.phase === "complete";
  const hugoSuggestedShow = completedMaster && value?.hugoSuggestedShow === true;
  const credentialGranted = hugoSuggestedShow && value?.credentialGranted === true;
  const backstageAuthorized = credentialGranted && value?.backstageAuthorized === true;
  const soundcheckStarted = backstageAuthorized && value?.soundcheckStarted === true;
  const inspected = soundcheckStarted && Array.isArray(value?.inspected)
    ? SOUND_CHECK_EQUIPMENT.filter((id) => value.inspected.includes(id)) : [];
  const soundcheckComplete = soundcheckStarted && inspected.length === SOUND_CHECK_EQUIPMENT.length
    && value?.soundcheckComplete === true;
  const recitalCompleted = soundcheckComplete && value?.recitalCompleted === true;
  const anomalySeen = recitalCompleted && value?.anomalySeen === true;
  const anomalyInvestigated = anomalySeen && value?.anomalyInvestigated === true;
  return {
    hugoSuggestedShow,
    credentialGranted,
    charlyMet: value?.charlyMet === true,
    backstageAuthorized,
    soundcheckStarted,
    inspected,
    soundcheckComplete,
    clubShowReady: soundcheckComplete,
    recitalCompleted,
    anomalySeen,
    anomalyInvestigated,
    arcadeClueKnown: anomalyInvestigated && value?.arcadeClueKnown === true,
  };
}

export function advanceClubShowQuest(value, event, masterTape) {
  const current = normalizeClubShowQuest(value, masterTape);
  let next = current;
  if (event === "meetCharly") next = { ...current, charlyMet: true };
  if (event === "hugoSuggestsShow" && masterTape?.phase === "complete")
    next = { ...current, hugoSuggestedShow: true };
  if (event === "titoGrantsCredential" && current.hugoSuggestedShow)
    next = { ...current, credentialGranted: true };
  if (event === "charlyAuthorizes" && current.credentialGranted)
    next = { ...current, backstageAuthorized: true, soundcheckStarted: true };
  if (event.startsWith("inspect:") && current.soundcheckStarted) {
    const id = event.slice("inspect:".length);
    if (SOUND_CHECK_EQUIPMENT.includes(id) && !current.inspected.includes(id))
      next = { ...current, inspected: [...current.inspected, id] };
  }
  if (event === "completeRecital" && current.clubShowReady)
    next = { ...current, recitalCompleted: true };
  if (event === "seeAnomaly" && current.recitalCompleted)
    next = { ...current, anomalySeen: true };
  if (event === "inspectAnomaly" && current.anomalySeen)
    next = { ...current, anomalyInvestigated: true, arcadeClueKnown: true };
  if (event === "completeSoundcheck" && current.soundcheckStarted
    && current.inspected.length === SOUND_CHECK_EQUIPMENT.length)
    next = { ...current, soundcheckComplete: true, clubShowReady: true };
  return normalizeClubShowQuest(next, masterTape);
}

export function loadClubShowQuest(storage = globalThis.localStorage, masterTape = loadMasterTapeProgress(storage)) {
  try {
    const saved = JSON.parse(storage.getItem(CLUB_SHOW_SAVE_KEY) || "null");
    return normalizeClubShowQuest(saved?.version === 1 ? saved.progress : null, masterTape);
  } catch { return normalizeClubShowQuest(null, masterTape); }
}

export function saveClubShowQuest(progress, storage = globalThis.localStorage) {
  try { storage.setItem(CLUB_SHOW_SAVE_KEY, JSON.stringify({ version: 1, progress })); return true; }
  catch { return false; }
}

export function clubShowObjective(progress, masterTape, rikyProgress = {}) {
  if (masterTape?.phase !== "complete") return null;
  if (!progress.hugoSuggestedShow) return "Hablá con Hugo sobre tocar el máster en vivo.";
  if (!progress.credentialGranted) return "Pedile a Tito un lugar donde tocar.";
  if (!progress.backstageAuthorized) return "Mostrale la credencial a Charly en el Club de Rock.";
  if (progress.anomalySeen && !rikyProgress.postShowSeen) return "Hablá con Riky sobre el final del recital.";
  if (progress.anomalySeen && !progress.anomalyInvestigated) return "Examiná otra vez la mesa de sonido del Club.";
  if (progress.arcadeClueKnown) return "Pista guardada: un patrón digital apunta al Arcade 1999.";
  if (progress.recitalCompleted) return "Primer recital completado. Burn Lies sonó en el club.";
  if (progress.clubShowReady) return "Prueba de sonido completa. El escenario está listo.";
  if (progress.inspected.length === SOUND_CHECK_EQUIPMENT.length) return "Volvé con Charly para cerrar la prueba de sonido.";
  return `Revisá mesa, amplificador y micrófono (${progress.inspected.length}/3).`;
}
