export const UNDERWORLD_INITIAL = Object.freeze({
  arrivalRead: false, visionActive: false, bridgeCrossed: false,
  enemies: [2, 2], completed: false,
});

export function normalizeUnderworldProgress(value, chapter10Complete = false) {
  if (!chapter10Complete) return { ...UNDERWORLD_INITIAL, enemies: [2, 2] };
  const p = value && typeof value === "object" ? value : {};
  const enemies = [0, 1].map((index) => Number.isInteger(p.enemies?.[index])
    ? Math.max(0, Math.min(2, p.enemies[index])) : 2);
  const bridgeCrossed = p.bridgeCrossed === true;
  return {
    arrivalRead: p.arrivalRead === true,
    visionActive: p.visionActive === true,
    bridgeCrossed,
    enemies: bridgeCrossed ? enemies : [2, 2],
    completed: bridgeCrossed && enemies.every((health) => health === 0) && p.completed === true,
  };
}

export function advanceUnderworld(progress, event, value, chapter10Complete = false) {
  const p = normalizeUnderworldProgress(progress, chapter10Complete);
  if (!chapter10Complete) return p;
  if (event === "arrival") return { ...p, arrivalRead: true };
  if (event === "vision-toggle") return { ...p, visionActive: !p.visionActive };
  if (event === "bridge-crossed" && p.visionActive) return { ...p, bridgeCrossed: true };
  if (event === "enemy-hit" && p.bridgeCrossed && (value === 0 || value === 1) && p.enemies[value] > 0) {
    const enemies = [...p.enemies]; enemies[value] -= 1;
    return { ...p, enemies };
  }
  if (event === "altar" && p.enemies.every((health) => health === 0) && p.bridgeCrossed) return { ...p, completed: true };
  return p;
}

export function underworldObjective(p) {
  if (p.completed) return "El umbral respondió. Podés volver a explorar la ciudadela.";
  if (!p.arrivalRead) return "Examiná la inscripción en la zona de llegada.";
  if (!p.bridgeCrossed) return "Usá la Visión de Frecuencia para revelar el puente verdadero.";
  if (p.enemies.some((health) => health > 0)) return "Derrotá a los dos centinelas con el Orbe Neón.";
  return "Activá el altar del umbral al fondo de la ciudadela.";
}
