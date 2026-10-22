// Inventory entries are projections of the existing mission and resource state.
// There is deliberately no second mutable item ledger to desynchronise saves.
export const INVENTORY_CATEGORIES = Object.freeze([
  { id: "all", label: "TODOS" },
  { id: "mission", label: "OBJETOS DE MISIÓN" },
  { id: "access", label: "ACCESOS" },
  { id: "collectible", label: "COLECCIONABLES" },
]);

export const INVENTORY_DEFINITIONS = Object.freeze({
  "recording-tape": {
    id: "recording-tape", name: "Cinta de grabación de 1999", category: "mission", icon: "tape",
    description: "Una antigua grabación que Tito encontró en su tienda. Necesita pasar por el estudio de Hugo.",
    mission: "El máster perdido", stackable: false,
    use: { target: "hugo", event: "startReview", label: "Entregar a Hugo" },
  },
  "restored-master": {
    id: "restored-master", name: "Máster restaurado", category: "mission", icon: "master",
    description: "Una grabación restaurada en Neon Recording Studio. Ahora debe regresar a la tienda.",
    mission: "El máster perdido", stackable: false,
    use: { target: "tito", event: "deliverMaster", label: "Entregar a Tito" },
  },
  "club-credential": {
    id: "club-credential", name: "Credencial del Club de Rock", category: "access", icon: "badge",
    description: "Credencial para el Club de Rock 1999. Charly conoce a Tito y puede autorizar el acceso al escenario.",
    mission: "La credencial del show", stackable: false,
    use: { target: "charly", event: "charlyAuthorizes", label: "Presentar a Charly" },
  },
  "studio-tokens": {
    id: "studio-tokens", name: "Fichas de estudio", category: "collectible", icon: "studio-token",
    description: "Recompensa por restaurar la grabación con Hugo. Neon Sessions muestra el saldo real de estas fichas.",
    mission: "El máster perdido", stackable: true,
  },
  "jukebox-coins": {
    id: "jukebox-coins", name: "Monedas / fichas de rockola", category: "collectible", icon: "coin",
    description: "Las diez monedas de la mesa son las fichas de la rockola. Cada videoclip consume una; el saldo baja al usarla y podés volver a tomar las que falten.",
    mission: null, stackable: true, capacity: 10,
  },
  "forbidden-archive": {
    id: "forbidden-archive", name: "Acceso al Archivo Prohibido", category: "access", icon: "archive",
    description: "Tito habilitó el Archivo Prohibido tras conocer la contraseña. El disco físico todavía no es un objeto entregado.",
    mission: "El disco prohibido", stackable: false,
  },
});

const STATUS_LABELS = Object.freeze({
  available: "DISPONIBLE", delivered: "ENTREGADO", used: "UTILIZADO",
  presented: "PRESENTADA", unlocked: "DESBLOQUEADO",
});

function entry(id, status, quantity = 1, note = "") {
  return { ...INVENTORY_DEFINITIONS[id], status, statusLabel: STATUS_LABELS[status], quantity, note };
}

export function getUniverseInventory({ masterTape, clubQuest, storyProgress, credits } = {}) {
  const phase = masterTape?.phase || "new";
  const items = [];
  if (["tape", "review", "master", "complete"].includes(phase)) {
    const status = phase === "tape" ? "available" : phase === "review" ? "delivered" : "used";
    items.push(entry("recording-tape", status, 1,
      status === "available" ? "Podés entregarla a Hugo en el estudio." :
        status === "delivered" ? "Hugo la está usando para revisar la mezcla." : "Hugo la utilizó para crear el máster restaurado."));
  }
  if (phase === "master" || phase === "complete")
    items.push(entry("restored-master", phase === "master" ? "available" : "delivered", 1,
      phase === "master" ? "Lleváselo a Tito en la tienda." : "Ya fue entregado a Tito; no puede volver a entregarse."));
  if (clubQuest?.credentialGranted)
    items.push(entry("club-credential", clubQuest.backstageAuthorized ? "presented" : "available", 1,
      clubQuest.backstageAuthorized ? "Charly ya la vio y autorizó el backstage." : "Mostrásela a Charly en el club."));
  const studioTokens = Number.isInteger(masterTape?.studioTokens) ? Math.max(0, masterTape.studioTokens) : 0;
  if (studioTokens > 0) items.push(entry("studio-tokens", "available", studioTokens, "Saldo actual de Neon Sessions."));
  const coinBalance = Number.isInteger(credits) ? Math.max(0, Math.min(10, credits)) : 0;
  if (coinBalance > 0) items.push(entry("jukebox-coins", "available", coinBalance, `${coinBalance} / 10 disponibles para la rockola.`));
  if (storyProgress?.archiveUnlocked)
    items.push(entry("forbidden-archive", "unlocked", 1, "Podés abrir el archivo desde la tienda."));
  return items;
}

// Only offer actions already backed by a real dialogue or existing screen.
export function getUniverseInventoryAction(item, { scene, nearby, masterTape, clubQuest } = {}) {
  if (!item) return null;
  if (item.id === "recording-tape" && item.status === "available" && scene === "studio"
    && nearby?.kind === "hugo" && masterTape?.phase === "tape")
    return { id: "give-tape", label: "Entregar a Hugo" };
  if (item.id === "restored-master" && item.status === "available" && scene === "store"
    && nearby?.kind === "npc" && nearby.id === "tito" && masterTape?.phase === "master")
    return { id: "give-master", label: "Entregar a Tito" };
  if (item.id === "club-credential" && item.status === "available" && scene === "club"
    && nearby?.kind === "club-npc" && nearby.id === "charly" && clubQuest?.credentialGranted && !clubQuest.backstageAuthorized)
    return { id: "present-credential", label: "Presentar a Charly" };
  if (item.id === "jukebox-coins" && scene === "store") return { id: "open-jukebox", label: "Abrir rockola" };
  if (item.id === "forbidden-archive" && scene === "store") return { id: "open-archive", label: "Abrir archivo" };
  if (item.id === "studio-tokens" && scene === "store" && masterTape?.phase === "complete")
    return { id: "open-sessions", label: "Ver Neon Sessions" };
  return null;
}

export function newlyObtainedInventoryItems(previousIds, nextItems) {
  return nextItems.filter((item) => !previousIds.has(item.id) && ["available", "unlocked"].includes(item.status));
}
