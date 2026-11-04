export const STORE_INVESTIGATION_EVENTS = Object.freeze({
  intro: "recordStoreAlteredIntroSeen",
  tito: "recordStoreTitoInterviewed",
  jukebox: "recordStoreJukeboxAnomalySeen",
  record: "recordStoreStrangeRecordSeen",
  clue: "recordStoreReverseClueKnown",
  ghost: "recordStoreGhostSeen",
});

export function advanceStoreInvestigation(progress, event) {
  const field = STORE_INVESTIGATION_EVENTS[event];
  if (!field || !progress.recordStoreFutureVisionSeen || progress[field]) return progress;
  const prior = { intro: null, tito: "intro", jukebox: "tito", record: "jukebox", clue: "record", ghost: "clue" }[event];
  if (prior && !progress[STORE_INVESTIGATION_EVENTS[prior]]) return progress;
  return { ...progress, [field]: true };
}

export function storeInvestigationObjective(progress) {
  if (!progress.recordStoreFutureVisionSeen) return null;
  if (!progress.recordStoreRevisitedAfterVision) return "Regresá a la Tienda de los Discos.";
  if (!progress.recordStoreAlteredIntroSeen) return "Algo cambió en la tienda...";
  if (!progress.recordStoreTitoInterviewed) return "Hablá con Tito sobre lo que pasó.";
  if (!progress.recordStoreJukeboxAnomalySeen) return "Investigá la rockola.";
  if (!progress.recordStoreStrangeRecordSeen) return "Examiná el disco extraño.";
  if (!progress.recordStoreReverseClueKnown) return "Volvé a examinar el disco extraño.";
  if (!progress.recordStoreGhostSeen) return "Investigá la aparición al fondo del local.";
  return "Volvé al estudio y hablá con Hugo Mendez sobre la señal.";
}
