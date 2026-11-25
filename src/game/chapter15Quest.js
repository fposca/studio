export const CHAPTER15_INITIAL = Object.freeze({
  started: false, arrived: false, hugoConsulted: false,
  consoleExamined: false, noteRead: false, visionActive: false,
  hiddenChannelSeen: false, mixSequence: [], channelIsolated: false,
  tapeTaken: false, storeEntered: false, storeArrivalSeen: false,
  evidence: [], talked: [], compared: false, confrontationUnlocked: false,
});

export const CHAPTER15_MIX_ORDER = ["silence", "pulse", "hidden"];
export const CHAPTER15_SUSPECTS = ["tito", "roxy", "rulo"];
export const CHAPTER15_EVIDENCE = {
  tito: { name: "Registro de ventas imposible", clue: "Un disco figura vendido antes de haber ingresado a la tienda." },
  roxy: { name: "Letra manuscrita alterada", clue: "Los símbolos de la letra coinciden con marcas de la Anomalía." },
  rulo: { name: "Referencia a una cinta desconocida", clue: "Rulo recuerda una frecuencia analógica que no aparece en el catálogo." },
};

export function normalizeChapter15Progress(value, chapter14Completed = false) {
  const v = value && typeof value === "object" ? value : {};
  const started = chapter14Completed && Boolean(v.started || v.arrived || v.hugoConsulted || v.tapeTaken);
  const arrived = started && Boolean(v.arrived);
  const hugoConsulted = arrived && Boolean(v.hugoConsulted);
  const consoleExamined = hugoConsulted && Boolean(v.consoleExamined);
  const noteRead = consoleExamined && Boolean(v.noteRead);
  const hiddenChannelSeen = noteRead && Boolean(v.hiddenChannelSeen);
  const candidateSequence = Array.isArray(v.mixSequence) ? v.mixSequence.slice(0, 3) : [];
  const mixSequence = hiddenChannelSeen && candidateSequence.every((id, index) => id === CHAPTER15_MIX_ORDER[index])
    ? candidateSequence : [];
  const channelIsolated = hiddenChannelSeen && mixSequence.length === 3 && Boolean(v.channelIsolated);
  const tapeTaken = channelIsolated && Boolean(v.tapeTaken);
  const storeEntered = tapeTaken && Boolean(v.storeEntered);
  const evidence = storeEntered && Array.isArray(v.evidence)
    ? CHAPTER15_SUSPECTS.filter(id => v.evidence.includes(id)) : [];
  const talked = storeEntered && Array.isArray(v.talked)
    ? CHAPTER15_SUSPECTS.filter(id => v.talked.includes(id)) : [];
  const compared = evidence.length === 3 && talked.length === 3 && Boolean(v.compared);
  return {
    started, arrived, hugoConsulted, consoleExamined, noteRead,
    visionActive: started && Boolean(v.visionActive), hiddenChannelSeen, mixSequence, channelIsolated,
    tapeTaken, storeEntered, storeArrivalSeen: storeEntered && Boolean(v.storeArrivalSeen),
    evidence, talked, compared, confrontationUnlocked: compared,
  };
}

export function advanceChapter15(progress, event, chapter14Completed = false) {
  const p = normalizeChapter15Progress(progress, chapter14Completed);
  if (event === "arrive" && chapter14Completed) return { ...p, started: true, arrived: true };
  if (!p.started) return p;
  if (event === "hugo-talk" && p.arrived) return { ...p, hugoConsulted: true };
  if (event === "vision-toggle" && p.arrived) return { ...p, visionActive: !p.visionActive };
  if (!p.hugoConsulted) return p;
  if (event === "console-examine") return { ...p, consoleExamined: true };
  if (event === "note-read" && p.consoleExamined) return { ...p, noteRead: true };
  if (event === "channel-see" && p.noteRead && p.visionActive) return { ...p, hiddenChannelSeen: true };
  if (event.startsWith("mix:")) {
    const id = event.slice(4);
    if (!p.consoleExamined || !p.noteRead || !p.hiddenChannelSeen || !p.visionActive || p.channelIsolated) return p;
    if (id !== CHAPTER15_MIX_ORDER[p.mixSequence.length]) return { ...p, mixSequence: [] };
    const mixSequence = [...p.mixSequence, id];
    return { ...p, mixSequence, channelIsolated: mixSequence.length === 3 };
  }
  if (event === "tape-take" && p.channelIsolated) return { ...p, tapeTaken: true };
  if (!p.tapeTaken) return p;
  if (event === "store-enter") return { ...p, storeEntered: true };
  if (event === "store-arrival-seen" && p.storeEntered) return { ...p, storeArrivalSeen: true };
  if (event.startsWith("evidence:")) {
    const id = event.slice(9);
    return CHAPTER15_SUSPECTS.includes(id) && !p.evidence.includes(id)
      ? { ...p, evidence: [...p.evidence, id] } : p;
  }
  if (event.startsWith("talk:")) {
    const id = event.slice(5);
    return CHAPTER15_SUSPECTS.includes(id) && !p.talked.includes(id)
      ? { ...p, talked: [...p.talked, id] } : p;
  }
  if (event === "compare" && p.evidence.length === 3 && p.talked.length === 3)
    return { ...p, compared: true, confrontationUnlocked: true };
  return p;
}

export function chapter15Objective(progress) {
  const p = normalizeChapter15Progress(progress, true);
  if (!p.arrived) return "Llegá a Buenos Aires de 1999.";
  if (!p.hugoConsulted) return "Hablá con Hugo en Neon Recording Studio.";
  if (!p.consoleExamined) return "Examiná la consola de mezclas.";
  if (!p.noteRead) return "Encontrá y leé la nota técnica de Hugo.";
  if (!p.hiddenChannelSeen) return "Activá Visión de Frecuencia y examiná el canal desconocido.";
  if (!p.channelIsolated) return "Aislá la señal: silencio, pulso y canal oculto.";
  if (!p.tapeTaken) return "Recuperá la cinta alterada junto a la consola.";
  if (!p.storeEntered) return "Visitá la disquería de Tito en 1999.";
  if (p.evidence.length < 3 || p.talked.length < 3) return "Investigá a Tito, Roxy y Rulo: examiná sus pistas y hablá con ellos.";
  if (!p.compared) return "Compará las tres evidencias en el Diario.";
  return "Confrontación disponible: las pruebas están listas, pero aún falta decidir a quién enfrentar.";
}
