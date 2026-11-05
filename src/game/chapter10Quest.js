export const CHAPTER10_ORDER = Object.freeze(["pulse", "memory", "frequency"]);

export const CHAPTER10_INITIAL = Object.freeze({
  coreAnalyzed: false,
  signalDetected: false,
  hugoConsulted: false,
  channelInput: [],
  signalReconstructed: false,
  underworldUnlocked: false,
  chapterCompleted: false,
});

export function chapter10FragmentsReady(lostShip, parthenon, matrix) {
  return Boolean(lostShip?.archiveRecovered && parthenon?.frequencyFragment02Analyzed && matrix?.archiveRead);
}

export function normalizeChapter10Progress(value, chapter9Complete = false) {
  const source = value && typeof value === "object" ? value : {};
  if (!chapter9Complete && source.coreAnalyzed !== true) return { ...CHAPTER10_INITIAL, channelInput: [] };
  const coreAnalyzed = source.coreAnalyzed === true;
  const signalDetected = coreAnalyzed && source.signalDetected === true;
  const hugoConsulted = signalDetected && source.hugoConsulted === true;
  const input = Array.isArray(source.channelInput) ? source.channelInput : [];
  const channelInput = hugoConsulted && CHAPTER10_ORDER.slice(0, input.length).every((entry, index) => entry === input[index]) ? input.slice(0, 2) : [];
  const signalReconstructed = hugoConsulted && source.signalReconstructed === true;
  const underworldUnlocked = signalReconstructed && source.underworldUnlocked === true;
  return {
    coreAnalyzed, signalDetected, hugoConsulted,
    channelInput: signalReconstructed ? [] : channelInput,
    signalReconstructed, underworldUnlocked,
    chapterCompleted: underworldUnlocked && source.chapterCompleted === true,
  };
}

export function advanceChapter10(progress, event, value, chapter9Complete = false, fragmentsReady = false) {
  const p = normalizeChapter10Progress(progress, chapter9Complete);
  if (!chapter9Complete && !p.coreAnalyzed) return p;
  if (event === "core-examine") return { ...p, coreAnalyzed: true };
  if (event === "signal-detect" && p.coreAnalyzed) return { ...p, signalDetected: true };
  if (event === "hugo-consult" && p.signalDetected) return { ...p, hugoConsulted: true };
  if (event === "channel" && p.hugoConsulted && !p.signalReconstructed && fragmentsReady && CHAPTER10_ORDER.includes(value)) {
    const expected = CHAPTER10_ORDER[p.channelInput.length];
    if (value !== expected) return { ...p, channelInput: [] };
    const channelInput = [...p.channelInput, value];
    return channelInput.length === 3
      ? { ...p, channelInput: [], signalReconstructed: true, underworldUnlocked: true }
      : { ...p, channelInput };
  }
  if (event === "complete" && p.underworldUnlocked) return { ...p, chapterCompleted: true };
  return p;
}

export function chapter10Objective(p) {
  if (!p.coreAnalyzed) return "Examiná el núcleo restante en la disquería.";
  if (!p.signalDetected) return "Descifrá la transmisión del núcleo.";
  if (!p.hugoConsulted) return "Consultá a Hugo sobre la señal desconocida.";
  if (!p.signalReconstructed) return "Reconstruí la señal en la consola del estudio.";
  if (!p.chapterCompleted) return "Escuchá la transmisión del Abismo.";
  return "Inframundo abierto. Entrá al Puente de las Almas desde el mapa.";
}
