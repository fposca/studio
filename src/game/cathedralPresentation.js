export const CATHEDRAL_RECALLS = Object.freeze([
  { id: "nave", title: "LA NAVE PERDIDA", heading: "PRIMER RECUERDO RECUPERADO", color: "#79dbef",
    line: "Esa nave... Ahí empezó todo este desastre dimensional." },
  { id: "partenon", title: "EL PARTENÓN MALDITO", heading: "SEGUNDO RECUERDO RECUPERADO", color: "#e8c480",
    line: "Templos, monstruos y estatuas asesinas... Cómo olvidarlo." },
  { id: "fracturada", title: "LA REALIDAD FRACTURADA", heading: "TERCER RECUERDO RECUPERADO", color: "#ec78b0",
    line: "Una ciudad falsa y una versión malvada de mí... Todavía me debe una explicación." },
]);
export const CATHEDRAL_FX_DURATION = Object.freeze({ memory: 2.6, seal: 3, altar: 3.4, final: 2.8, hint: 3 });

// Transient presentation only. Saved quest flags remain the single source of truth.
// The initial snapshot establishes a baseline: loading an old save never replays events.
export function createCathedralPresentation(initialProgress, emit = () => {}) {
  let previous = initialProgress ? snapshot(initialProgress) : null;
  let lastCue = null, skipSerial = 0, cinema = null;
  const fx = { memoryAges: [Infinity, Infinity, Infinity], sealAge: Infinity,
    altarAge: Infinity, finalAge: Infinity, hintAge: Infinity, narrativeAge: 0, narrative: false };
  function snapshot(p) {
    return { memories: [...(p?.memories || [])], altarOpen: !!p?.altarOpen,
      altarActivated: !!p?.altarActivated, recordingHeard: !!p?.recordingHeard };
  }
  function finishCinema() {
    if (!cinema) return;
    const kind = cinema; cinema = null;
    emit({ type: kind === "final" ? "final-ready" : "cinema-end", kind });
  }
  return {
    fx,
    get cinema() { return cinema; },
    update(dt, progress, { suspended = false, cue = null, skip = 0 } = {}) {
      const next = snapshot(progress);
      if (previous) {
        CATHEDRAL_RECALLS.forEach((memory, i) => {
          if (next.memories.includes(memory.id) && !previous.memories.includes(memory.id)) {
            fx.memoryAges[i] = 0; emit({ type: "memory", memory: memory.id, index: i });
          } else if (!next.memories.includes(memory.id)) fx.memoryAges[i] = Infinity;
        });
        if (next.altarOpen && !previous.altarOpen) { fx.sealAge = 0; emit({ type: "seal-open" }); }
        if (next.altarActivated && !previous.altarActivated) {
          fx.altarAge = 0; cinema = "altar"; emit({ type: "cinema-start", kind: "altar" });
        }
        if (next.recordingHeard && !previous.recordingHeard) {
          fx.finalAge = 0; cinema = "final"; emit({ type: "cinema-start", kind: "final" });
        }
      }
      previous = next;
      if (cue?.id === "custodio-12" && lastCue !== cue.id) fx.hintAge = 0;
      if (cue?.id !== lastCue && cue?.id) fx.narrativeAge = 0;
      lastCue = cue?.id || null;
      fx.narrative = Boolean(cue && /^(registro-primera-voz|neonboy-altar-|custodio-altar-)/.test(cue.id));
      if (skip !== skipSerial) {
        skipSerial = skip; fx.altarAge = fx.finalAge = Infinity; finishCinema();
      }
      if (!suspended) {
        const step = Math.min(.05, Math.max(0, dt));
        for (let i = 0; i < 3; i++) fx.memoryAges[i] += step;
        for (const key of ["sealAge", "altarAge", "finalAge", "hintAge", "narrativeAge"]) fx[key] += step;
        if ((cinema === "altar" && fx.altarAge >= CATHEDRAL_FX_DURATION.altar) ||
            (cinema === "final" && fx.finalAge >= CATHEDRAL_FX_DURATION.final)) finishCinema();
      }
      return fx;
    },
  };
}
