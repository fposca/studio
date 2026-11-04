export const ROOFTOP_LAYOUT = {
  playerLimitX: 11.1, playerBackZ: -10.7, playerFrontZ: 10.8, spawnZ: 8.1,
  cameraLimitX: 11.6, cameraBackZ: -11.1, cameraFrontZ: 11.2,
};
export const ROOFTOP_PROPS = [
  { id: "stairDoor", label: "Puerta de acceso", position: [0, 0, 10.1], rotation: [0, 0, 0], scale: 1, reach: 2.1 },
  { id: "powerPanel", label: "Tablero electrico", position: [-6.9, 0, 3.7], rotation: [0, 90, 0], scale: 1, reach: 2.7 },
  { id: "mainAntenna", label: "Antena principal", position: [5.1, 0, -5.1], rotation: [0, 0, 0], scale: 1, reach: 3.1 },
  { id: "receiver", label: "Receptor de radio", position: [4.4, 0, 0.6], rotation: [0, 0, 0], scale: 1, reach: 2.6 },
  { id: "waterTank", label: "Tanque de agua", position: [-7.7, 0, -7.5], rotation: [0, 0, 0], scale: 1, reach: 2.6 },
  { id: "serviceBox", label: "Caja tecnica", position: [-5.8, 0, 7.3], rotation: [0, 0, 0], scale: 1, reach: 2 },
  { id: "safeZone", label: "Zona segura", position: [-7.4, 0, 0.1], rotation: [0, 0, 0], scale: 1, reach: 2.4 },
];
export const ROOFTOP_ASSETS = ROOFTOP_PROPS.map(({id,label})=>({id,label}));
const KEY = "neonboy-rooftop-transforms-v1";
export const defaultRooftopTransform = (id) => {
  const prop = ROOFTOP_PROPS.find((entry)=>entry.id===id);
  return prop && {position:[...prop.position],rotation:[...prop.rotation],scale:prop.scale,reach:prop.reach};
};
export function loadRooftopTransforms() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  return Object.fromEntries(ROOFTOP_PROPS.map(({id})=>{
    const base=defaultRooftopTransform(id), candidate=saved?.[id] || {};
    const vector=(name)=>base[name].map((part,i)=>Number.isFinite(candidate[name]?.[i]) ? candidate[name][i] : part);
    return [id,{position:vector("position"),rotation:vector("rotation"),
      scale:Number.isFinite(candidate.scale)?Math.max(.2,Math.min(3,candidate.scale)):base.scale,
      reach:Number.isFinite(candidate.reach)?Math.max(1,Math.min(5,candidate.reach)):base.reach}];
  }));
}
export function saveRooftopTransforms(transforms) { localStorage.setItem(KEY,JSON.stringify(transforms)); }
