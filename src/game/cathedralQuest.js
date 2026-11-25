export const CATHEDRAL_SEALS = Object.freeze(["memoria", "tiempo", "verdad"]);
export const CATHEDRAL_MEMORIES = Object.freeze(["nave", "partenon", "fracturada"]);
export const CATHEDRAL_TONES = Object.freeze(["pulso", "eco", "origen"]);

export const CATHEDRAL_INITIAL = Object.freeze({
  entered: false, inscriptionRead: false, visionActive: false,
  seals: [], archiveOpen: false, memories: [], altarOpen: false,
  altarTuning: false, altarSequence: [],
  custodianMet: false, anomalyHeard: false, altarHintHeard: false,
  altarActivated: false, recordingHeard: false, completed: false,
});

export function normalizeCathedralProgress(value, chapter11Complete = false) {
  if (!chapter11Complete) return { ...CATHEDRAL_INITIAL, seals: [], memories: [], altarSequence: [] };
  const p = value && typeof value === "object" ? value : {};
  const prefix = (stored, order) => {
    const result = [];
    if (!Array.isArray(stored)) return result;
    for (const id of order) {
      if (stored[result.length] !== id) break;
      result.push(id);
    }
    return result;
  };
  // Finished legacy saves must not be forced through a newly added ritual.
  const wasCompleted = p.completed === true;
  const seals = wasCompleted ? [...CATHEDRAL_SEALS] : prefix(p.seals, CATHEDRAL_SEALS);
  const archiveOpen = seals.length === 3;
  const memories = wasCompleted ? [...CATHEDRAL_MEMORIES] : archiveOpen ? prefix(p.memories, CATHEDRAL_MEMORIES) : [];
  const altarOpen = memories.length === 3;
  const altarActivated = altarOpen && (p.altarActivated === true || p.recordingHeard === true || wasCompleted);
  const altarTuning = altarOpen && (p.altarTuning === true || altarActivated);
  const altarSequence = altarActivated ? [...CATHEDRAL_TONES] : altarTuning ? prefix(p.altarSequence, CATHEDRAL_TONES) : [];
  const completed = altarActivated && wasCompleted;
  return {
    entered: p.entered === true || completed, inscriptionRead: p.inscriptionRead === true || seals.length > 0,
    visionActive: p.visionActive === true, seals, archiveOpen, memories, altarOpen,
    altarTuning, altarSequence,
    custodianMet: p.custodianMet === true || completed,
    anomalyHeard: p.anomalyHeard === true || completed,
    altarHintHeard: altarOpen && (p.altarHintHeard === true || completed),
    altarActivated, recordingHeard: altarActivated && (p.recordingHeard === true || completed),
    completed,
  };
}

export function advanceCathedral(progress, event, value, chapter11Complete = false) {
  const p = normalizeCathedralProgress(progress, chapter11Complete);
  if (!chapter11Complete) return p;
  if (event === "enter") return { ...p, entered: true };
  if (event === "inscription") return { ...p, inscriptionRead: true };
  if (event === "vision-toggle") return { ...p, visionActive: !p.visionActive };
  if (event === "custodian" || event === "custodian-first") return { ...p, custodianMet: true };
  if (event === "custodian-anomaly" && p.custodianMet) return { ...p, anomalyHeard: true };
  if (event === "custodian-hint" && p.altarOpen) return { ...p, altarHintHeard: true };
  if (event === "seal" && p.inscriptionRead && !p.archiveOpen && CATHEDRAL_SEALS.includes(value)) {
    if (value !== CATHEDRAL_SEALS[p.seals.length]) return { ...p, seals: [] };
    const seals = [...p.seals, value];
    return { ...p, seals, archiveOpen: seals.length === 3 };
  }
  if (event === "memory" && p.archiveOpen && p.visionActive && !p.altarOpen && CATHEDRAL_MEMORIES.includes(value)) {
    if (p.memories.includes(value)) return p; // A recovered pedestal cannot count twice or reset the sequence.
    if (value !== CATHEDRAL_MEMORIES[p.memories.length]) return { ...p, memories: [] };
    const memories = [...p.memories, value];
    return { ...p, memories, altarOpen: memories.length === 3 };
  }
  if (event === "altar" && p.altarOpen && !p.altarActivated) return { ...p, altarTuning: true };
  if (event === "altar-node" && p.altarTuning && p.visionActive && !p.altarActivated && CATHEDRAL_TONES.includes(value)) {
    if (p.altarSequence.includes(value)) return p;
    if (value !== CATHEDRAL_TONES[p.altarSequence.length]) return { ...p, altarSequence: [] };
    const altarSequence = [...p.altarSequence, value];
    return { ...p, altarSequence, altarActivated: altarSequence.length === 3 };
  }
  if (event === "recording" && p.altarActivated) return { ...p, recordingHeard: true };
  if (event === "complete" && p.recordingHeard) return { ...p, completed: true };
  return p;
}

export function cathedralObjective(p) {
  if (p.completed) return "Transmisión original localizada. Atravesá el portal hacia el Trono del Abismo.";
  if (!p.inscriptionRead) return "Examiná la inscripción de la Nave de los Ecos.";
  if (!p.archiveOpen) return "Descifr\u00e1 los tres sellos de la Nave de los Ecos.";
  if (!p.altarOpen) return "Reconstru\u00ed los recuerdos del Archivo con la Visi\u00f3n de Frecuencia.";
  if (!p.altarTuning) return "Examin\u00e1 el Altar de la Primera Voz.";
  if (!p.altarActivated) return "Sintoniz\u00e1 los tres resonadores con la Visi\u00f3n de Frecuencia.";
  if (!p.recordingHeard) return "Escuchá el registro imposible.";
  return "Escuchá la despedida del Custodio.";
}
