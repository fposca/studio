export const PARTHENON_LAYOUT = {
  playerLimitX: 15.7, playerBackZ: -39.5, playerFrontZ: 16.4, spawnZ: 13.4,
  cameraLimitX: 15.9, cameraBackZ: -39.7, cameraFrontZ: 16.6,
};
export const PARTHENON_PROPS = [
  {id:"returnPortal",label:"portal de regreso",position:[-8.8,0,13.5],reach:2},
  {id:"guardianInscription",label:"inscripción de los guardianes",position:[7,0,-3],reach:2.2},
  {id:"courtRecord",label:"registro del patio",position:[8,0,-8],reach:2},
  {id:"mirrorTablet",label:"placa de los reflectores",position:[-8,0,-16],reach:2},
  {id:"reflectorRecord",label:"registro de los reflejos",position:[-7,0,-23],reach:2},
  {id:"sanctuaryRecord",label:"registro del santuario",position:[7,0,-30],reach:2},
  {id:"medusaShadow",label:"sombra entre columnas",position:[8,0,-34],reach:2.6},
  {id:"sanctuaryAltar",label:"altar dimensional",position:[0,0,-36],reach:2.8},
];

export const PARTHENON_ASSETS = [
  { id: "cursedHoplite", label: "Hoplita maldito", position: [0, 0, -20.5], rotation: [0, 0, 0], scale: 1 },
];
const TRANSFORM_KEY = "neonboy-parthenon-transforms-v1";
export function defaultParthenonTransform(id) {
  const asset = PARTHENON_ASSETS.find(item => item.id === id);
  return asset && { position: [...asset.position], rotation: [...asset.rotation], scale: asset.scale };
}
export function loadParthenonTransforms() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(TRANSFORM_KEY) || "{}"); } catch {}
  return Object.fromEntries(PARTHENON_ASSETS.map(asset => {
    const base = defaultParthenonTransform(asset.id), value = saved[asset.id] || {};
    return [asset.id, {
      position: base.position.map((n, i) => Number.isFinite(value.position?.[i]) ? value.position[i] : n),
      rotation: base.rotation.map((n, i) => Number.isFinite(value.rotation?.[i]) ? value.rotation[i] : n),
      scale: Number.isFinite(value.scale) ? Math.max(.2, Math.min(3, value.scale)) : base.scale,
    }];
  }));
}
export function saveParthenonTransforms(value) { localStorage.setItem(TRANSFORM_KEY, JSON.stringify(value)); }
