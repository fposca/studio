// Inventory entries are projections of the existing mission and resource state.
// There is deliberately no second mutable item ledger to desynchronise saves.
export const INVENTORY_CATEGORIES = Object.freeze([
  { id: "all", label: "TODOS" },
  { id: "mission", label: "OBJETOS DE MISIÓN" },
  { id: "access", label: "ACCESOS" },
  { id: "ability", label: "HABILIDADES" },
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
  "transmission-09": {
    id: "transmission-09", name: "Registro de la transmisi\u00f3n 09", category: "mission", icon: "tape",
    description: "Una cinta de datos de 1999 con la se\u00f1al y la referencia PUERTA 01. Hugo debe analizarla.",
    mission: "La transmisi\u00f3n del abismo", stackable: false,
  },
  "ship-module": {
    id: "ship-module", name: "Módulo energético", category: "mission", icon: "studio-token",
    description: "Fusible compatible con el reactor de La Nave Perdida. No se descarta hasta instalarlo.",
    mission: "PUERTA 01", stackable: false,
  },
  "ship-maintenance-log": {
    id: "ship-maintenance-log", name: "Registro de mantenimiento", category: "mission", icon: "tape",
    description: "La corriente nace en el pulso, se almacena en la bobina y libera la compuerta.",
    mission: "PUERTA 01", stackable: false,
  },
  "ship-bridge-card": {
    id: "ship-bridge-card", name: "Tarjeta de acceso del puente", category: "access", icon: "badge",
    description: "La credencial recuperada del armario de seguridad. Abre el puente cuando energía y presión son estables.",
    mission: "PUERTA 01", stackable: false,
  },
  "ship-memory": {
    id: "ship-memory", name: "Fragmento de memoria dimensional", category: "mission", icon: "archive",
    description: "Fragmento de datos del puente. La consola del archivo puede leerlo tras recuperar la navegación.",
    mission: "PUERTA 01", stackable: false,
  },
  "ship-navigation-log": {
    id: "ship-navigation-log", name: "Registro 01 de navegación", category: "mission", icon: "tape",
    description: "Destino anterior desconocido. Contiene una referencia a PUERTA 02.",
    mission: "PUERTA 01", stackable: false,
  },
  "neon-orb": {
    id: "neon-orb", name: "Orbe Neon", category: "ability", icon: "orb",
    description: "La frecuencia responde a tu voluntad. Lanzalo con click izquierdo o F; recuperalo con R.",
    mission: "PUERTA 02", stackable: false,
  },
  "frequency-fragment-02": {
    id: "frequency-fragment-02", name: "Fragmento de Frecuencia 02", category: "mission", icon: "orb",
    description: "Una esquirla dimensional recuperada en el altar de Medusa. La consola de navegacion puede leerla.",
    mission: "PUERTA 02", stackable: false,
  },
  "matrix-memory-fragment": {id:"matrix-memory-fragment",name:"Fragmento del Archivo",category:"mission",icon:"archive",description:"Recuerdo recuperado de la simulación fracturada.",mission:"PUERTA 03",stackable:false},
  "matrix-energy-module": {id:"matrix-energy-module",name:"Módulo del Taller",category:"mission",icon:"studio-token",description:"Pieza energética necesaria para la autorización del Núcleo.",mission:"PUERTA 03",stackable:false},
  "matrix-corruption-record": {id:"matrix-corruption-record",name:"Registro del Archivista",category:"mission",icon:"tape",description:"Prueba del origen de la corrupción digital.",mission:"PUERTA 03",stackable:false},
  "matrix-archive-warning": {id:"matrix-archive-warning",name:"Advertencia del Archivo Central",category:"mission",icon:"archive",description:"El patrón de corrupción ya alcanzó Buenos Aires.",mission:"PUERTA 03",stackable:false},
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

export function getUniverseInventory({ masterTape, clubQuest, storyProgress, credits, rooftopProgress, lostShipProgress, parthenonProgress, matrixProgress } = {}) {
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
  if (rooftopProgress?.transmissionCollected)
    items.push(entry("transmission-09", "available", 1, "Llev\u00e1 el registro al estudio de Hugo."));
  if (lostShipProgress?.accessLog) items.push(entry("ship-maintenance-log", "available", 1, "La pista queda disponible aunque salgas de la nave."));
  if (lostShipProgress?.moduleTaken) items.push(entry("ship-module", lostShipProgress.moduleInstalled ? "used" : "available", 1,
    lostShipProgress.moduleInstalled ? "Instalado en el reactor." : "Acercate al reactor y usalo desde el inventario."));
  if (lostShipProgress?.lockerOpened) items.push(entry("ship-bridge-card", lostShipProgress.bridgeCardUsed ? "used" : "available", 1,
    lostShipProgress.bridgeCardUsed ? "La puerta del puente quedó abierta." : "Usala junto a la puerta del puente."));
  if (lostShipProgress?.memoryTaken) items.push(entry("ship-memory", lostShipProgress.memoryInstalled ? "used" : "available", 1,
    lostShipProgress.memoryInstalled ? "Instalado en el archivo principal." : "Acercate al archivo principal y usalo desde el inventario."));
  if (lostShipProgress?.navigationRestored) items.push(entry("ship-navigation-log", "available", 1, "El registro permanece en el diario de la nave."));
  if (lostShipProgress?.orbUnlocked) items.push(entry("neon-orb", "unlocked", 1, "Habilidad permanente. No consume munición."));
  if (parthenonProgress?.frequencyFragment02Collected) items.push(entry("frequency-fragment-02", parthenonProgress.frequencyFragment02Analyzed ? "used" : "available", 1,
    parthenonProgress.frequencyFragment02Analyzed ? "Analizado en la nave. La pista hacia PUERTA 03 queda en el diario." : "Llevalo a la consola de navegacion de la nave."));
  if(matrixProgress?.memoryFragment)items.push(entry("matrix-memory-fragment","available",1,"Evidencia del Archivo de los Recuerdos."));
  if(matrixProgress?.moduleTaken)items.push(entry("matrix-energy-module",matrixProgress.securityOpen?"used":"available",1,"Recuperado del Taller de Corrupción."));
  if(matrixProgress?.evidenceFound)items.push(entry("matrix-corruption-record","available",1,"El Centinela puede verificar este registro."));
  if(matrixProgress?.archiveRead)items.push(entry("matrix-archive-warning","available",1,"Nueva pista hacia el origen del Archivista."));
  if (storyProgress?.archiveUnlocked)
    items.push(entry("forbidden-archive", "unlocked", 1, "Podés abrir el archivo desde la tienda."));
  return items;
}

// Only offer actions already backed by a real dialogue or existing screen.
export function getUniverseInventoryAction(item, { scene, nearby, masterTape, clubQuest, lostShipProgress } = {}) {
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
  if (item.id === "ship-module" && item.status === "available" && scene === "lost-ship"
    && nearby?.kind === "examine" && nearby.id === "reactor" && lostShipProgress?.reactorExamined)
    return { id: "ship-module-use", label: "Instalar en reactor" };
  if (item.id === "ship-bridge-card" && item.status === "available" && scene === "lost-ship"
    && nearby?.kind === "examine" && nearby.id === "bridgeDoor" && lostShipProgress?.powerRestored && lostShipProgress?.lifeStable)
    return { id: "ship-card-use", label: "Abrir puente" };
  if (item.id === "ship-memory" && item.status === "available" && scene === "lost-ship"
    && nearby?.kind === "examine" && nearby.id === "archive" && lostShipProgress?.navigationRestored)
    return { id: "ship-memory-use", label: "Usar en archivo" };
  if (item.id === "jukebox-coins" && scene === "store") return { id: "open-jukebox", label: "Abrir rockola" };
  if (item.id === "forbidden-archive" && scene === "store") return { id: "open-archive", label: "Abrir archivo" };
  if (item.id === "studio-tokens" && scene === "store" && masterTape?.phase === "complete")
    return { id: "open-sessions", label: "Ver Neon Sessions" };
  return null;
}

export function newlyObtainedInventoryItems(previousIds, nextItems) {
  return nextItems.filter((item) => !previousIds.has(item.id) && ["available", "unlocked"].includes(item.status));
}
