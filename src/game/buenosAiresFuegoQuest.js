import { canStartEscape } from "./buenosAiresEscapeLogic.js";
export const FUEGO_COMPONENTS = Object.freeze([
  { id: "fuego_key", name: "Llave del Fuego", takenFlag: "fuegoKeyTaken", installedFlag: "fuegoKeyInstalled" },
  { id: "fuego_power_cell", name: "Celda de energía", takenFlag: "fuegoPowerCellTaken", installedFlag: "fuegoPowerCellInstalled" },
  { id: "fuego_navigation_module", name: "Módulo de navegación", takenFlag: "fuegoNavigationModuleTaken", installedFlag: "fuegoNavigationModuleInstalled" },
]);
export const FUEGO_NAVIGATION_ORDER = Object.freeze(["calle", "cielo", "libertad"]);

export const FUEGO_INITIAL = Object.freeze({
  fuegoStarted: false, fuegoKeyDiscovered: false, fuegoKeyTaken: false,
  fuegoPowerTerminalExamined: false, fuegoPowerMaintenanceOpen: false, fuegoPowerCellTaken: false,
  fuegoNavigationClues: [], fuegoNavigationSequence: [], fuegoNavigationTerminalOpen: false,
  fuegoNavigationModuleTaken: false, fuegoKeyInstalled: false, fuegoPowerCellInstalled: false,
  fuegoNavigationModuleInstalled: false, fuegoRecordShown: false, fuegoPowered: false,
  fuegoFlightUnlocked: false, fuegoFlightStarted: false, fuegoChaseCompleted: false,
  originTransmissionRecovered: false, temporalJumpUnlocked: false, completed: false,
  nextDestination: null, disconnectedFuturePending: false,
});

export function fuegoComponentCount(progress, field = "taken") {
  return FUEGO_COMPONENTS.filter(component => progress?.[component[field + "Flag"]]).length;
}

export const countFuegoComponents = progress => fuegoComponentCount(progress, "taken");
export const countFuegoInstalled = progress => fuegoComponentCount(progress, "installed");

export function normalizeFuegoProgress(value, vigilanteDefeated = false) {
  const p = value && typeof value === "object" ? value : {};
  const fuegoStarted = vigilanteDefeated && p.fuegoStarted === true;
  const fuegoKeyDiscovered = fuegoStarted && p.fuegoKeyDiscovered === true;
  const fuegoKeyTaken = fuegoKeyDiscovered && p.fuegoKeyTaken === true;
  const fuegoPowerTerminalExamined = fuegoStarted && p.fuegoPowerTerminalExamined === true;
  const fuegoPowerMaintenanceOpen = fuegoPowerTerminalExamined && p.fuegoPowerMaintenanceOpen === true;
  const fuegoPowerCellTaken = fuegoPowerMaintenanceOpen && p.fuegoPowerCellTaken === true;
  const fuegoNavigationClues = fuegoStarted ? FUEGO_NAVIGATION_ORDER.filter(id =>
    Array.isArray(p.fuegoNavigationClues) && p.fuegoNavigationClues.includes(id)) : [];
  const sequence = Array.isArray(p.fuegoNavigationSequence) ? p.fuegoNavigationSequence : [];
  const fuegoNavigationSequence = fuegoNavigationClues.length === 3 &&
    sequence.every((id, index) => id === FUEGO_NAVIGATION_ORDER[index])
    ? sequence.slice(0, 3) : [];
  const fuegoNavigationTerminalOpen = fuegoNavigationSequence.length === 3;
  const fuegoNavigationModuleTaken = fuegoNavigationTerminalOpen && p.fuegoNavigationModuleTaken === true;
  const fuegoKeyInstalled = fuegoKeyTaken && p.fuegoKeyInstalled === true;
  const fuegoPowerCellInstalled = fuegoPowerCellTaken && p.fuegoPowerCellInstalled === true;
  const fuegoNavigationModuleInstalled = fuegoNavigationModuleTaken && p.fuegoNavigationModuleInstalled === true;
  const fuegoPowered = fuegoKeyInstalled && fuegoPowerCellInstalled && fuegoNavigationModuleInstalled && p.fuegoPowered === true;
  const fuegoFlightUnlocked = fuegoPowered && fuegoNavigationModuleInstalled && p.fuegoRecordShown === true;
  const fuegoFlightStarted = fuegoFlightUnlocked && p.fuegoFlightStarted === true;
  const originTransmissionRecovered = fuegoFlightStarted && p.originTransmissionRecovered === true;
  const fuegoChaseCompleted = originTransmissionRecovered && p.fuegoChaseCompleted === true;
  return {
    fuegoFlightUnlocked, fuegoFlightStarted, originTransmissionRecovered, fuegoChaseCompleted,
    temporalJumpUnlocked: fuegoChaseCompleted, completed: fuegoChaseCompleted,
    nextDestination: fuegoChaseCompleted ? "buenos-aires-1999" : null,
    disconnectedFuturePending: fuegoChaseCompleted,
    fuegoStarted, fuegoKeyDiscovered, fuegoKeyTaken,
    fuegoPowerTerminalExamined, fuegoPowerMaintenanceOpen, fuegoPowerCellTaken,
    fuegoNavigationClues, fuegoNavigationSequence, fuegoNavigationTerminalOpen,
    fuegoNavigationModuleTaken, fuegoKeyInstalled, fuegoPowerCellInstalled,
    fuegoNavigationModuleInstalled, fuegoRecordShown: fuegoNavigationModuleInstalled && p.fuegoRecordShown === true,
    fuegoPowered,
  };
}

export function advanceFuegoProgress(progress, event) {
  const p = progress;
  if (event === "fuego-start" && p.vigilanteDefeated) return { ...p, fuegoStarted: true };
  if (!p.fuegoStarted) return p;
  if (event === "fuego-key-discover" && p.visionActive) return { ...p, fuegoKeyDiscovered: true };
  if (event === "fuego-key-take" && p.fuegoKeyDiscovered) return { ...p, fuegoKeyTaken: true };
  if (event === "fuego-power-examine") return { ...p, fuegoPowerTerminalExamined: true };
  if (event === "fuego-power-maintenance" && p.fuegoPowerTerminalExamined)
    return { ...p, fuegoPowerMaintenanceOpen: true };
  if (event === "fuego-power-take" && p.fuegoPowerMaintenanceOpen)
    return { ...p, fuegoPowerCellTaken: true };
  if (event.startsWith("fuego-navigation-clue:")) {
    const id = event.slice("fuego-navigation-clue:".length);
    if (FUEGO_NAVIGATION_ORDER.includes(id) && !p.fuegoNavigationClues.includes(id))
      return { ...p, fuegoNavigationClues: [...p.fuegoNavigationClues, id] };
  }
  if (event.startsWith("fuego-navigation-symbol:") && p.fuegoNavigationClues.length === 3 && !p.fuegoNavigationTerminalOpen) {
    const id = event.slice("fuego-navigation-symbol:".length);
    if (!FUEGO_NAVIGATION_ORDER.includes(id)) return p;
    const next = id === FUEGO_NAVIGATION_ORDER[p.fuegoNavigationSequence.length]
      ? [...p.fuegoNavigationSequence, id] : [];
    return { ...p, fuegoNavigationSequence: next, fuegoNavigationTerminalOpen: next.length === 3 };
  }
  if (event === "fuego-navigation-take" && p.fuegoNavigationTerminalOpen)
    return { ...p, fuegoNavigationModuleTaken: true };
  if (event.startsWith("fuego-install:")) {
    const component = FUEGO_COMPONENTS.find(item => item.id === event.slice("fuego-install:".length));
    if (component && p[component.takenFlag] && !p[component.installedFlag])
      return { ...p, [component.installedFlag]: true };
  }
  if (event === "fuego-record-shown" && p.fuegoNavigationModuleInstalled)
    return { ...p, fuegoRecordShown: true };
  if (event === "fuego-power-on" && canStartEscape(p))
    return { ...p, fuegoPowered: true, escapeUnlocked: true, fuegoFlightUnlocked: true };
  if (event === "fuego-flight-start" && canStartEscape(p))
    return { ...p, fuegoPowered: true, escapeUnlocked: true, fuegoFlightUnlocked: true, fuegoFlightStarted: true, escapeBriefed: true, visionActive: false };
  if (event === "fuego-origin-recovered" && p.fuegoFlightStarted && canStartEscape(p))
    return { ...p, originTransmissionRecovered: true };
  if (event === "fuego-flight-complete" && p.fuegoFlightStarted && p.originTransmissionRecovered && canStartEscape(p))
    return { ...p, fuegoChaseCompleted: true, completed: true, temporalJumpUnlocked: true,
      nextDestination: "buenos-aires-1999", disconnectedFuturePending: true };
  return p;
}

