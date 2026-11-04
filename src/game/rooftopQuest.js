export const ROOFTOP_SWITCH_ORDER = ["luna", "rayo", "antena"];
export const ROOFTOP_BEARING = -34;
export const ROOFTOP_FREQUENCY = 9;

export const INITIAL_ROOFTOP_PROGRESS = Object.freeze({
  introSeen: false, explored: false, panelExamined: false, switches: [],
  powerRestored: false, bearing: 0, antennaAligned: false, frequency: 0,
  frequencyDecoded: false, safeReached: false, anomalySeen: false,
  transmissionCollected: false, missionCompleted: false,
});

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export function normalizeRooftopProgress(value, unlocked = true) {
  const source = unlocked && value && typeof value === "object" ? value : {};
  const introSeen = source.introSeen === true;
  const explored = introSeen && source.explored === true;
  const panelExamined = explored && source.panelExamined === true;
  const switches = panelExamined && Array.isArray(source.switches)
    ? ROOFTOP_SWITCH_ORDER.slice(0, 3).filter((id, index) => source.switches[index] === id && source.switches.slice(0, index).every((prior, n) => prior === ROOFTOP_SWITCH_ORDER[n]))
    : [];
  const powerRestored = switches.length === 3;
  const bearing = Number.isFinite(source.bearing) ? clamp(source.bearing, -90, 90) : 0;
  const antennaAligned = powerRestored && source.antennaAligned === true && Math.abs(bearing - ROOFTOP_BEARING) <= 8;
  const frequency = Number.isFinite(source.frequency) ? clamp(Math.round(source.frequency), 0, 99) : 0;
  const frequencyDecoded = antennaAligned && source.frequencyDecoded === true && Math.abs(frequency - ROOFTOP_FREQUENCY) <= 1;
  const safeReached = frequencyDecoded && source.safeReached === true;
  const anomalySeen = safeReached && source.anomalySeen === true;
  const transmissionCollected = anomalySeen && source.transmissionCollected === true;
  return { introSeen, explored, panelExamined, switches, powerRestored, bearing, antennaAligned,
    frequency, frequencyDecoded, safeReached, anomalySeen, transmissionCollected,
    missionCompleted: transmissionCollected };
}

export function advanceRooftopProgress(value, event, payload) {
  const current = normalizeRooftopProgress(value);
  const next = { ...current };
  if (event === "intro") next.introSeen = true;
  if (event === "explore" && current.introSeen) next.explored = true;
  if (event === "panel" && current.explored) next.panelExamined = true;
  if (event === "switch" && current.panelExamined && !current.powerRestored) {
    next.switches = payload === ROOFTOP_SWITCH_ORDER[current.switches.length] ? [...current.switches, payload] : [];
  }
  if (event === "bearing" && current.powerRestored && !current.antennaAligned && Number.isFinite(payload)) next.bearing = clamp(payload, -90, 90);
  if (event === "align" && current.powerRestored && Math.abs(current.bearing - ROOFTOP_BEARING) <= 8) next.antennaAligned = true;
  if (event === "frequency" && current.antennaAligned && !current.frequencyDecoded && Number.isFinite(payload)) next.frequency = clamp(Math.round(payload), 0, 99);
  if (event === "decode" && current.antennaAligned && Math.abs(current.frequency - ROOFTOP_FREQUENCY) <= 1) next.frequencyDecoded = true;
  if (event === "safe" && current.frequencyDecoded) next.safeReached = true;
  if (event === "anomaly" && current.safeReached) next.anomalySeen = true;
  if (event === "collect" && current.anomalySeen) next.transmissionCollected = true;
  return normalizeRooftopProgress(next);
}

export function rooftopObjective(progress, unlocked = true) {
  if (!unlocked) return null;
  const p = normalizeRooftopProgress(progress);
  if (!p.introSeen) return "Lleg\u00e1 a la Azotea 1999.";
  if (!p.explored) return "Explor\u00e1 la azotea.";
  if (!p.panelExamined) return "Revis\u00e1 el tablero el\u00e9ctrico.";
  if (!p.powerRestored) return "Restablec\u00e9 la alimentaci\u00f3n de la antena.";
  if (!p.antennaAligned) return "Orient\u00e1 la antena principal.";
  if (!p.frequencyDecoded) return "Sintoniz\u00e1 la frecuencia desconocida.";
  if (!p.safeReached) return "Alejate de la antena y lleg\u00e1 a la zona segura.";
  if (!p.anomalySeen) return "Sobreviv\u00ed al incidente sobrenatural.";
  if (!p.transmissionCollected) return "Investig\u00e1 la se\u00f1al recibida.";
  return "Descubr\u00ed qu\u00e9 significa PUERTA 01.";
}
