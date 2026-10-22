import defaultTransforms from "./arcadeTransforms.json" with { type: "json" };

// Coordinates are shared by the procedural room, explorer, interactions and saves.
export const ARCADE_LAYOUT = {
  playerLimitX: 10.2,
  playerBackZ: -20.65,
  playerFrontZ: 8.65,
  spawnZ: 6.65,
  cameraLimitX: 11,
  cameraBackZ: -20.9,
  cameraFrontZ: 8.9,
};

export const ARCADE_PROPS = [
  { id: "cabinet-left-1", label: "Pixel Sprint", kind: "cabinet", theme: "racing", position: [-9.0, 0, 3.6], rotation: [0, 90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Un juego de carreras de los 90. El volante está bastante gastado." },
  { id: "cabinet-left-2", label: "Orbit Duel", kind: "cabinet", theme: "space", position: [-9.0, 0, 0.8], rotation: [0, 90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Los botones de esta máquina parecen haber sobrevivido a miles de partidas." },
  { id: "cabinet-left-3", label: "Jungle Pulse", kind: "cabinet", theme: "jungle", position: [-9.0, 0, -2.0], rotation: [0, 90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Una pantalla CRT emite un zumbido constante." },
  { id: "cabinet-left-4", label: "Turbo Nova", kind: "cabinet", theme: "space", position: [-3.2, 0, -0.8], rotation: [0, 90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "El marcador conserva iniciales de jugadores que ya no vienen." },
  { id: "cabinet-right-1", label: "Cosmic Rally", kind: "cabinet", theme: "racing", position: [9.0, 0, 3.4], rotation: [0, -90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Un juego de carreras de los 90. El volante está bastante gastado." },
  { id: "cabinet-right-2", label: "Vector Knight", kind: "cabinet", theme: "fighting", position: [9.0, 0, 0.6], rotation: [0, -90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Los botones de esta máquina parecen haber sobrevivido a miles de partidas." },
  { id: "cabinet-right-3", label: "Night Circuit", kind: "cabinet", theme: "space", position: [9.0, 0, -2.2], rotation: [0, -90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Una pantalla CRT emite un zumbido constante." },
  { id: "cabinet-right-4", label: "Ghost Channel", kind: "cabinet", theme: "horror", position: [3.2, 0, -0.8], rotation: [0, -90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Hay una figura en la pantalla que desaparece cuando intento mirarla." },
  { id: "racing-seat", label: "Rally Fantasma", kind: "racer", theme: "racing", position: [-6.5, 0, -7.0], rotation: [0, 0, 0], size: [1.4, 2.3], offset: [0, 0.55], text: "Un juego de carreras de los 90. El volante está bastante gastado." },
  { id: "fight-cabinet", label: "Barrio Brawl", kind: "cabinet", theme: "fighting", position: [6.4, 0, -7.0], rotation: [0, 0, 0], size: [1.60, 1.36], offset: [0, 0.16], text: "Los botones de esta máquina parecen haber sobrevivido a miles de partidas." },
  { id: "pinball", label: "Luna Eléctrica", kind: "pinball", theme: "pinball", position: [-7.2, 0, -12.3], rotation: [0, 0, 0], size: [1.2, 2.25], text: "Las bolas metálicas descansan debajo de un vidrio rayado." },
  { id: "horror-cabinet", label: "Medianoche 13", kind: "cabinet", theme: "horror", position: [8.5, 0, -10.8], rotation: [0, 0, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "La imagen da saltos. Esta máquina parece reaccionar al ruido del local." },
  { id: "broken-cabinet", label: "Máquina fuera de servicio", kind: "cabinet", theme: "broken", position: [-8.7, 0, -17.2], rotation: [0, 90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "Esta máquina está fuera de servicio." },
  { id: "frequency09Cabinet", label: "FREQUENCY 09", kind: "cabinet", theme: "frequency", position: [0, 0, -18.25], rotation: [0, 0, 0], size: [1.28, 1.36], offset: [0, 0.16], reach: 2.25 },
  { id: "counter", label: "Mostrador de fichas", kind: "counter", position: [-7.0, 0, 6.7], rotation: [0, 180, 0], size: [3.3, 1.15], text: "Pixel atiende detr\u00e1s del mostrador, rodeado de fichas y recuerdos del sal\u00f3n." },
  { id: "island-vector", label: "Vector Rush", kind: "cabinet", theme: "space", position: [-3.2, 0, -3.5], rotation: [0, 90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "El ranking sigue esperando un nuevo campeon." },
  { id: "island-jungle", label: "Jungle Relay", kind: "cabinet", theme: "jungle", position: [3.2, 0, -3.5], rotation: [0, -90, 0], size: [1.28, 1.36], offset: [0, 0.16], text: "El boton de salto esta gastado de tantas partidas." },
  { id: "light-gun-cabinet", label: "Sector 7", kind: "shooter", theme: "shooter", position: [6.4, 0, -15.4], rotation: [0, -18, 0], size: [1.60, 1.36], offset: [0, 0.16], text: "Dos pistolas de luz. Solo funcionan apuntando a esta vieja pantalla CRT." },
  { id: "social-seats", label: "Rincon de descanso", kind: "lounge", position: [7.1, 0, 6.9], rotation: [0, 180, 0], size: [3.3, 1.2], text: "Unas banquetas para esperar el turno. Alguien dejo su vaso aca." },
  { id: "staff-door", label: "Puerta SOLO PERSONAL", kind: "door", position: [7.4, 0, -21.65], rotation: [0, 0, 0], size: [1.7, 0.3], text: "Está cerrada. Parece que detrás hay una sala de mantenimiento." },
  { id: "pixel", label: "Pixel", kind: "npc", position: [-7.95, 0, 7.8], rotation: [0, 180, 0], size: [.68, .68], reach: 3.0 },
  { id: "nico", label: "Nico", kind: "npc", position: [-5.8, 0, 1.0], rotation: [0, -90, 0], size: [.68, .68], reach: 2.15 },
  { id: "vicky", label: "Vicky", kind: "npc", position: [7.2, 0, -12.8], rotation: [0, 55, 0], size: [.68, .68], reach: 2.3 },
];

export const ARCADE_ASSETS = ARCADE_PROPS.map(({ id, label }) => ({ id, label }));
const STORAGE_KEY = "neonboy-arcade-1999-transforms-v1";

export function defaultArcadeTransform(id) {
  const prop = ARCADE_PROPS.find((entry) => entry.id === id);
  if (!prop) return null;
  const base = defaultTransforms[id] || { position: prop.position, rotation: prop.rotation, scale: 1, reach: prop.reach ?? 2.2 };
  return { position: [...base.position], rotation: [...base.rotation], scale: base.scale, reach: base.reach };
}

export function loadArcadeTransforms() {
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { /* Defaults remain. */ }
  return Object.fromEntries(ARCADE_PROPS.map(({ id }) => {
    const base = defaultArcadeTransform(id);
    const value = stored?.[id];
    if (!value) return [id, base];
    const axes = (key) => base[key].map((part, index) => Number.isFinite(value[key]?.[index]) ? value[key][index] : part);
    return [id, { position: axes("position"), rotation: axes("rotation"), scale: Number.isFinite(value.scale) ? Math.max(0.05, Math.min(value.scale, 5)) : base.scale,
      reach: Number.isFinite(value.reach) ? Math.max(1, Math.min(value.reach, 4)) : base.reach }];
  }));
}

export function saveArcadeTransforms(transforms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transforms));
}

export function arcadeObstacleFor(prop, transform) {
  const yaw = transform.rotation[1] * Math.PI / 180;
  const halfX = prop.size[0] * transform.scale / 2;
  const halfZ = prop.size[1] * transform.scale / 2;
  const [offsetX, offsetZ] = (prop.offset || [0, 0]).map((value) => value * transform.scale);
  return { id: prop.id, x: transform.position[0] + Math.cos(yaw) * offsetX + Math.sin(yaw) * offsetZ,
    z: transform.position[2] - Math.sin(yaw) * offsetX + Math.cos(yaw) * offsetZ,
    hx: Math.abs(Math.cos(yaw)) * halfX + Math.abs(Math.sin(yaw)) * halfZ,
    hz: Math.abs(Math.sin(yaw)) * halfX + Math.abs(Math.cos(yaw)) * halfZ };
}
