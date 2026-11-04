export const IMPOSSIBLE_RECORDING_FLAGS = Object.freeze({
  talk: "impossibleRecordingStarted",
  computer: "signalComputerExamined",
  analyze: "signalAnalysisCompleted",
  reverse: "reversedSignalDecoded",
  anomaly: "studioAnomalySeen",
  rooftop: "rooftopClueKnown",
});

export const SIGNAL_TARGET = Object.freeze({ low: 25, mid: 70, high: 35 });
export const SIGNAL_TOLERANCE = 9;

export function signalInterference(bands) {
  const distance = Object.keys(SIGNAL_TARGET).reduce((total, key) =>
    total + Math.abs(Number(bands[key]) - SIGNAL_TARGET[key]), 0);
  return Math.min(100, Math.round(distance * .53));
}

export function isSignalClean(bands) {
  return Object.keys(SIGNAL_TARGET).every((key) =>
    Number.isFinite(Number(bands[key])) &&
    Math.abs(Number(bands[key]) - SIGNAL_TARGET[key]) <= SIGNAL_TOLERANCE);
}

export function advanceImpossibleRecording(progress, event, ghostSeen) {
  const field = IMPOSSIBLE_RECORDING_FLAGS[event];
  if (!ghostSeen || !field || progress[field]) return progress;
  const prior = { talk: null, computer: "talk", analyze: "computer", reverse: "analyze",
    anomaly: "reverse", rooftop: "anomaly" }[event];
  if (prior && !progress[IMPOSSIBLE_RECORDING_FLAGS[prior]]) return progress;
  return { ...progress, [field]: true };
}

export function normalizeImpossibleRecording(progress, ghostSeen) {
  const next = { ...progress };
  let prior = Boolean(ghostSeen);
  for (const field of Object.values(IMPOSSIBLE_RECORDING_FLAGS)) {
    next[field] = prior && progress[field] === true;
    prior = next[field];
  }
  return next;
}

export function impossibleRecordingObjective(ghostSeen, progress) {
  if (!ghostSeen) return null;
  if (!progress.impossibleRecordingStarted) return "Hablá con Hugo sobre la señal de la tienda.";
  if (!progress.signalComputerExamined) return "Examiná la computadora del estudio.";
  if (!progress.signalAnalysisCompleted) return "Aislá la frecuencia con el ecualizador.";
  if (!progress.reversedSignalDecoded) return "Reproducí la señal al revés.";
  if (!progress.studioAnomalySeen) return "Contale a Hugo lo que apareció en la señal.";
  if (!progress.rooftopClueKnown) return "Investigá la nueva anomalía con Hugo.";
  return "Investigá el origen de la señal desde un punto elevado de la ciudad.";
}
