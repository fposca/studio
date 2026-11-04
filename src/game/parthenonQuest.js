import { HOPLITE_CONFIG } from "./parthenonCombatConfig.js";
import { CURSED_HOPLITE } from "./parthenonExpansionLogic.js";
// PUERTA 02 progression. Every puzzle transition is checked here before it can be saved.
export const GUARDIAN_ORDER = ["owl", "serpent", "sun"];
export const SEAL_ORDER = ["time", "gate", "witness"];
export const PARTHENON_INITIAL = Object.freeze({
  entered: false, urnBroken: false, hopliteAwake: false, hopliteHealth: HOPLITE_CONFIG.health,
  guardianClueSeen: false, guardianSequence: [], guardianPuzzleCompleted: false,
  mirrors: [false, false], reflectionPuzzleCompleted: false,
  sealClues: [], sealSequence: [], templeSealsCompleted: false,
  medusaFirstEncounterSeen: false, altarRead: false,
  cursedHopliteAwake: false, cursedHopliteHealth: CURSED_HOPLITE.health,
  medusaEncounterSeen: false, medusaBossDefeated: false,
  frequencyFragment02Collected: false, frequencyFragment02Analyzed: false,
});
const same = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
const sequence = (input, valid) => (Array.isArray(input) ? input : []).filter(value => valid.includes(value)).slice(0, 3);
export function normalizeParthenonProgress(value, door02Unlocked = false) {
  const src = door02Unlocked && value && typeof value === "object" ? value : {};
  const p = { ...PARTHENON_INITIAL };
  p.entered = door02Unlocked && src.entered === true;
  p.urnBroken = p.entered && src.urnBroken === true;
  p.hopliteAwake = p.entered && src.hopliteAwake === true;
  p.hopliteHealth = p.hopliteAwake && Number.isInteger(src.hopliteHealth) ? Math.max(0, Math.min(HOPLITE_CONFIG.health, src.hopliteHealth)) : HOPLITE_CONFIG.health;
  p.guardianClueSeen = p.entered && src.guardianClueSeen === true;
  p.guardianSequence = p.guardianClueSeen ? sequence(src.guardianSequence, GUARDIAN_ORDER) : [];
  p.guardianPuzzleCompleted = p.guardianClueSeen && same(p.guardianSequence, GUARDIAN_ORDER);
  p.mirrors = [0, 1].map(i => p.guardianPuzzleCompleted && src.mirrors?.[i] === true);
  p.reflectionPuzzleCompleted = p.guardianPuzzleCompleted && p.mirrors.every(Boolean) && src.reflectionPuzzleCompleted === true;
  p.sealClues = p.entered ? [...new Set((Array.isArray(src.sealClues) ? src.sealClues : []).filter(v => ["court", "reflector", "sanctuary"].includes(v)))] : [];
  p.sealSequence = p.reflectionPuzzleCompleted && p.sealClues.length === 3 ? sequence(src.sealSequence, SEAL_ORDER) : [];
  p.templeSealsCompleted = p.reflectionPuzzleCompleted && p.sealClues.length === 3 && same(p.sealSequence, SEAL_ORDER);
  p.medusaFirstEncounterSeen = p.reflectionPuzzleCompleted && src.medusaFirstEncounterSeen === true;
  p.altarRead = p.templeSealsCompleted && p.medusaFirstEncounterSeen && src.altarRead === true;
  p.cursedHopliteAwake = p.altarRead && src.cursedHopliteAwake === true;
  p.cursedHopliteHealth = p.altarRead && Number.isInteger(src.cursedHopliteHealth)
    ? Math.max(0, Math.min(CURSED_HOPLITE.health, src.cursedHopliteHealth)) : CURSED_HOPLITE.health;
  p.medusaEncounterSeen = p.altarRead && p.cursedHopliteHealth === 0 && src.medusaEncounterSeen === true;
  p.medusaBossDefeated = p.medusaEncounterSeen && src.medusaBossDefeated === true;
  p.frequencyFragment02Collected = p.medusaBossDefeated && src.frequencyFragment02Collected === true;
  p.frequencyFragment02Analyzed = p.frequencyFragment02Collected && src.frequencyFragment02Analyzed === true;
  return p;
}
export function advanceParthenonProgress(current, event, payload, door02Unlocked = true) {
  const p = normalizeParthenonProgress(current, door02Unlocked);
  const next = { ...p, guardianSequence: [...p.guardianSequence], mirrors: [...p.mirrors], sealClues: [...p.sealClues], sealSequence: [...p.sealSequence] };
  if (event === "enter" && door02Unlocked) next.entered = true;
  if (event === "wake" && p.entered) next.hopliteAwake = true;
  if (event === "urn-hit" && p.entered) next.urnBroken = true;
  if (event === "hoplite-hit" && p.hopliteAwake && p.hopliteHealth > 0) next.hopliteHealth -= 1;
  if (event === "retry" && p.hopliteAwake && p.hopliteHealth > 0) next.hopliteHealth = HOPLITE_CONFIG.health;
  if (event === "dev-health" && p.hopliteAwake && p.hopliteHealth > 0 && Number.isInteger(payload)) next.hopliteHealth = Math.max(1, Math.min(HOPLITE_CONFIG.health, payload));
  if (event === "guardian-clue" && p.entered) next.guardianClueSeen = true;
  if (event === "guardian-hit" && p.guardianClueSeen && p.hopliteHealth === 0 && !p.guardianPuzzleCompleted && GUARDIAN_ORDER.includes(payload)) {
    const expected = GUARDIAN_ORDER[p.guardianSequence.length];
    next.guardianSequence = payload === expected ? [...p.guardianSequence, payload] : [];
  }
  if (event === "mirror-hit" && p.guardianPuzzleCompleted && !p.reflectionPuzzleCompleted && [0, 1].includes(payload)) next.mirrors[payload] = true;
  if (event === "reflection-hit" && p.mirrors.every(Boolean)) next.reflectionPuzzleCompleted = true;
  if (event === "seal-clue" && p.entered && ["court", "reflector", "sanctuary"].includes(payload)) next.sealClues = [...new Set([...p.sealClues, payload])];
  if (event === "seal-hit" && p.reflectionPuzzleCompleted && p.sealClues.length === 3 && !p.templeSealsCompleted && SEAL_ORDER.includes(payload)) {
    const expected = SEAL_ORDER[p.sealSequence.length];
    next.sealSequence = payload === expected ? [...p.sealSequence, payload] : [];
  }
  if (event === "medusa-seen" && p.reflectionPuzzleCompleted) next.medusaFirstEncounterSeen = true;
  if (event === "altar-read" && p.templeSealsCompleted && p.medusaFirstEncounterSeen) next.altarRead = true;
  if (event === "cursed-hoplite-wake" && p.altarRead) next.cursedHopliteAwake = true;
  if (event === "cursed-hoplite-hit" && p.altarRead && p.cursedHopliteHealth > 0) { next.cursedHopliteAwake = true; next.cursedHopliteHealth -= 1; }
  if (event === "medusa-start" && p.cursedHopliteHealth === 0) next.medusaEncounterSeen = true;
  if (event === "medusa-defeat" && p.medusaEncounterSeen) next.medusaBossDefeated = true;
  if (event === "fragment-collect" && p.medusaBossDefeated) next.frequencyFragment02Collected = true;
  if (event === "fragment-analyze" && p.frequencyFragment02Collected) next.frequencyFragment02Analyzed = true;
  return normalizeParthenonProgress(next, door02Unlocked);
}
export function parthenonObjective(p) {
  if (!p.entered) return "Entrá al templo desde el enlace de la nave.";
  if (p.hopliteHealth > 0) return p.hopliteAwake ? "Defendete de la estatua guardiana con el Orbe Neón." : "Explorá el exterior y acercate al patio.";
  if (!p.guardianClueSeen) return "Buscá la inscripción de los tres guardianes.";
  if (!p.guardianPuzzleCompleted) return "Activá los receptores de los guardianes en el orden de la inscripción.";
  if (!p.reflectionPuzzleCompleted) return "Activá ambos reflectores y hacé rebotar el Orbe hasta el mecanismo.";
  if (p.sealClues.length < 3) return "Investigá las pistas del patio, los reflectores y el santuario.";
  if (!p.templeSealsCompleted) return "Activá los tres sellos con el Orbe siguiendo las pistas.";
  if (!p.medusaFirstEncounterSeen) return "Explorá el santuario y seguí el sonido entre las columnas.";
  if (!p.altarRead) return "Examiná el altar para recuperar el registro dimensional.";
  return "REGISTRO DIMENSIONAL RECUPERADO. La presencia de Medusa sigue en el santuario.";
}

export function medusaQuestObjective(p) {
  if (!p.altarRead) return null;
  if (p.cursedHopliteHealth > 0) return "Derrotá al hoplita maldito en el corredor del santuario.";
  if (!p.medusaBossDefeated) return "Acercate al altar del santuario y enfrentá a Medusa.";
  if (!p.frequencyFragment02Collected) return "Recogé el Fragmento de Frecuencia 02 del altar.";
  if (!p.frequencyFragment02Analyzed) return "Regresá a La Nave Perdida y analizá el fragmento en la consola de navegación.";
  return "Fragmento analizado. La señal apunta hacia PUERTA 03.";
}
