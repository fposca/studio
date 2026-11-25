export const THRONE_VOWS = Object.freeze(["memoria", "voluntad", "libertad"]);
export const THRONE_CONDUCTORS = Object.freeze(["origen", "eco", "enlace"]);
export const THRONE_MAX_HEALTH = 12;

export const THRONE_INITIAL = Object.freeze({
  entered: false, visionActive: false, inscriptionRead: false, vows: [], hallOpen: false,
  coreInspected: [], reflectorIndex: -1, conductors: [], throneOpen: false,
  bossIntro: false, bossHealth: THRONE_MAX_HEALTH, shieldActive: false,
  shieldNodes: [], bossDefeated: false, transmissionExamined: false,
  completed: false, futureCoordinate: null,
});

const list = (value, allowed) => [...new Set(Array.isArray(value) ? value.filter((id) => allowed.includes(id)) : [])];
export function normalizeThroneProgress(value, cathedralCompleted = false) {
  const p = value && typeof value === "object" ? value : {};
  if (!cathedralCompleted) return { ...THRONE_INITIAL, vows: [], coreInspected: [], conductors: [], shieldNodes: [] };
  const vows = list(p.vows, THRONE_VOWS);
  const hallOpen = p.hallOpen === true && vows.length === 3;
  const coreInspected = list(p.coreInspected, THRONE_CONDUCTORS);
  const conductors = hallOpen ? list(p.conductors, THRONE_CONDUCTORS) : [];
  const throneOpen = p.throneOpen === true && conductors.length === 3;
  const bossDefeated = throneOpen && p.bossDefeated === true;
  const bossHealth = bossDefeated ? 0 : Number.isInteger(p.bossHealth) ? Math.max(1, Math.min(THRONE_MAX_HEALTH, p.bossHealth)) : THRONE_MAX_HEALTH;
  const shieldNodes = list(p.shieldNodes, THRONE_CONDUCTORS);
  const shieldActive = throneOpen && !bossDefeated && p.shieldActive === true && shieldNodes.length < 3;
  const transmissionExamined = bossDefeated && p.transmissionExamined === true;
  return {
    entered: p.entered === true, visionActive: p.visionActive === true,
    inscriptionRead: p.inscriptionRead === true, vows: hallOpen ? [...THRONE_VOWS] : vows,
    hallOpen, coreInspected, reflectorIndex: Number.isInteger(p.reflectorIndex) && p.reflectorIndex >= -1 && p.reflectorIndex <= 2 ? p.reflectorIndex : -1,
    conductors, throneOpen, bossIntro: throneOpen && (p.bossIntro === true || bossDefeated),
    bossHealth, shieldActive, shieldNodes, bossDefeated, transmissionExamined,
    completed: transmissionExamined && p.completed === true,
    futureCoordinate: transmissionExamined && p.completed === true ? "Buenos Aires, 2049" : null,
  };
}

export function advanceThrone(progress, event, value, cathedralCompleted = true) {
  const p = normalizeThroneProgress(progress, cathedralCompleted);
  if (!cathedralCompleted) return p;
  if (event === "enter") return { ...p, entered: true };
  if (event === "vision-toggle") return { ...p, visionActive: !p.visionActive };
  if (event === "inscription") return { ...p, inscriptionRead: true };
  if (event === "vow" && p.inscriptionRead && p.visionActive && !p.hallOpen && THRONE_VOWS.includes(value)) {
    const expected = THRONE_VOWS[p.vows.length];
    if (value !== expected) return { ...p, vows: [] };
    const vows = [...p.vows, value];
    return { ...p, vows, hallOpen: vows.length === 3 };
  }
  if (event === "inspect-core" && p.hallOpen && THRONE_CONDUCTORS.includes(value))
    return { ...p, coreInspected: list([...p.coreInspected, value], THRONE_CONDUCTORS) };
  if (event === "reflector-rotate" && p.hallOpen && !p.throneOpen)
    return { ...p, reflectorIndex: (p.reflectorIndex + 1) % 3 };
  if (event === "reflector-hit" && p.visionActive && p.coreInspected.length === 3 && !p.throneOpen) {
    if (p.reflectorIndex < 0) return p;
    const next = THRONE_CONDUCTORS[p.conductors.length];
    if (next !== THRONE_CONDUCTORS[p.reflectorIndex] || (value && value !== next)) return p;
    const conductors = [...p.conductors, next];
    return { ...p, conductors, throneOpen: conductors.length === 3 };
  }
  if (event === "boss-intro" && p.throneOpen) return { ...p, bossIntro: true };
  if (event === "boss-hit" && p.bossIntro && !p.bossDefeated && !p.shieldActive) {
    const bossHealth = Math.max(0, p.bossHealth - 1);
    return { ...p, bossHealth, bossDefeated: bossHealth === 0,
      shieldActive: p.bossHealth > 8 && bossHealth <= 8,
      shieldNodes: p.bossHealth > 8 && bossHealth <= 8 ? [] : p.shieldNodes };
  }
  if (event === "shield-node" && p.shieldActive && p.visionActive && THRONE_CONDUCTORS.includes(value)) {
    const shieldNodes = list([...p.shieldNodes, value], THRONE_CONDUCTORS);
    return { ...p, shieldNodes, shieldActive: shieldNodes.length < 3 };
  }
  if (event === "transmission" && p.bossDefeated) return { ...p, transmissionExamined: true };
  if (event === "complete" && p.transmissionExamined)
    return { ...p, completed: true, futureCoordinate: "Buenos Aires, 2049" };
  if (event === "retry" && p.throneOpen && !p.bossDefeated)
    return { ...p, bossIntro: false, bossHealth: THRONE_MAX_HEALTH, shieldActive: false, shieldNodes: [], visionActive: false };
  return p;
}

export function throneObjective(p) {
  if (!p.inscriptionRead) return "Examiná la inscripción del Salón de los Juramentos.";
  if (!p.hallOpen) return "Descifrá el orden de las tres estatuas (" + p.vows.length + "/3).";
  if (p.coreInspected.length < 3) return "Examiná con E o tocá con el Orbe los tres conductores (" + p.coreInspected.length + "/3).";
  if (!p.throneOpen) return "Con Visión C, orientá el reflector con E y lanzá al cristal iluminado (" + p.conductors.length + "/3).";
  if (!p.bossIntro) return "Entrá al Trono Negro y enfrentá al Soberano.";
  if (p.shieldActive) return "Revelá y destruí los tres focos del escudo (" + p.shieldNodes.length + "/3).";
  if (!p.bossDefeated) return p.bossHealth <= 4 ? "Sobreviví a la fractura y derrotá al Soberano." : "Derrotá al Soberano del Abismo.";
  if (!p.transmissionExamined) return "Investigá la transmisión temporal detrás del trono.";
  return "Coordenadas temporales registradas: Buenos Aires, 2049.";
}
