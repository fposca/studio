export const LOST_SHIP_LAYOUT = {
  playerLimitX: 15.8, playerBackZ: -22.8, playerFrontZ: 14.8, spawnZ: 11.7,
  cameraLimitX: 16.1, cameraBackZ: -23, cameraFrontZ: 15,
};

export const LOST_SHIP_PROPS = [
  { id: "arrivalLog", label: "registro de mantenimiento", position: [-2.8, 0, 11.5], reach: 2 },
  { id: "arrivalConsole", label: "consola dañada", position: [3, 0, 11.5], reach: 2.1 },
  { id: "accessPanel", label: "panel de acceso", position: [2.3, 0, 7.8], reach: 2.2 },
  { id: "returnPortal", label: "enlace de regreso", position: [0, 0, 13.8], reach: 1.9 },
  { id: "corridorSign", label: "cartel del pasillo", position: [-2.9, 0, -2.1], reach: 2.1 },
  { id: "corridorWindow", label: "ventana dimensional", position: [3.1, 0, 1.1], reach: 2.1 },
  { id: "corridorMonitor", label: "monitor de símbolos", position: [-2.9, 0, -8.4], reach: 2.1 },
  { id: "reactor", label: "reactor", position: [-11.3, 0, -5.6], reach: 3 },
  { id: "circuit", label: "distribución de energía", position: [-14.2, 0, -3.1], reach: 2.3 },
  { id: "reactorLog", label: "registro del reactor", position: [-7.1, 0, -2.2], reach: 2.2 },
  { id: "moduleCrate", label: "contenedor de mantenimiento", position: [7.7, 0, -7.5], reach: 2.1 },
  { id: "locker", label: "armario de seguridad", position: [13.5, 0, -7.3], reach: 2.3 },
  { id: "lifeSupport", label: "sistema de soporte vital", position: [9.2, 0, -2.5], reach: 2.4 },
  { id: "storageLog", label: "registro del almacén", position: [13.4, 0, -2.4], reach: 2.1 },
  { id: "bridgeDoor", label: "puerta del puente", position: [2.4, 0, -10.6], reach: 2.2 },
  { id: "navigation", label: "consola de navegación", position: [0, 0, -19.5], reach: 2.6 },
  { id: "memory", label: "fragmento de memoria", position: [3.7, 0, -16.7], reach: 2 },
  { id: "archive", label: "archivo principal", position: [-5.7, 0, -20], reach: 2.7 },
  { id: "orbReceiver", label: "receptor de PUERTA 02", position: [12.5, 0, -22.1], reach: 1.9 },
  { id: "traveler", label: "el Viajero", position: [6.1, 0, -18.4], reach: 2.4 },
];

export const LOST_SHIP_ASSETS = [
  { id: "shipComputer", label: "Computadora de la nave", position: [0, 0.96, -19.5], rotation: [0, 180, 0], scale: 1 },
  { id: "shipChair", label: "Sillón de mando", position: [2.4, 0, -21.2], rotation: [0, 0, 0], scale: 1 },
  { id: "hologramPlatform", label: "Plataforma holográfica", position: [-5.7, 0, -19.4], rotation: [0, 0, 0], scale: 1 },
  { id: "traveler", label: "El Viajero", position: [6.1, 0, -18.4], rotation: [0, 185, 0], scale: 1, reach: 2.4 },
];
const KEY = "neonboy-lost-ship-transforms-v1";
export function defaultLostShipTransform(id) {
  const asset = LOST_SHIP_ASSETS.find(item => item.id === id);
  return asset && { position: [...asset.position], rotation: [...asset.rotation], scale: asset.scale, ...(asset.reach ? { reach: asset.reach } : {}) };
}
export function loadLostShipTransforms() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  return Object.fromEntries(LOST_SHIP_ASSETS.map(asset => {
    const base = defaultLostShipTransform(asset.id), value = saved[asset.id] || {};
    return [asset.id, {
      position: base.position.map((number, index) => Number.isFinite(value.position?.[index]) ? value.position[index] : number),
      rotation: base.rotation.map((number, index) => Number.isFinite(value.rotation?.[index]) ? value.rotation[index] : number),
      scale: Number.isFinite(value.scale) ? Math.max(.2, Math.min(3, value.scale)) : base.scale,
      ...(asset.reach ? { reach: Number.isFinite(value.reach) ? Math.max(1, Math.min(5, value.reach)) : base.reach } : {}),
    }];
  }));
}
export function saveLostShipTransforms(value) { localStorage.setItem(KEY, JSON.stringify(value)); }
