import defaults from "./rockClubConcertPose.json" with { type: "json" };

export const CONCERT_POSE_KEY = "neonboy-rock-club-pose-v1";
export const CONCERT_POSE_ACTORS = [
  { id: "neonboy", label: "NeonBoy" },
  { id: "john-zool", label: "John Zool" },
  { id: "revenant", label: "Revenant" },
  { id: "lilith-9", label: "Lilith" },
  { id: "lujan", label: "Luj\u00e1n" },
];
export const CONCERT_POSE_BONES = [
  { id: "LeftShoulder", label: "Hombro izquierdo" },
  { id: "LeftArm", label: "Brazo izquierdo" },
  { id: "LeftForeArm", label: "Antebrazo izquierdo" },
  { id: "LeftHand", label: "Mano izquierda" },
  { id: "RightShoulder", label: "Hombro derecho" },
  { id: "RightArm", label: "Brazo derecho" },
  { id: "RightForeArm", label: "Antebrazo derecho" },
  { id: "RightHand", label: "Mano derecha" },
];
const actorIds = new Set(CONCERT_POSE_ACTORS.map((actor) => actor.id));
const boneIds = new Set(CONCERT_POSE_BONES.map((bone) => bone.id));
const clamp = (value) => Math.max(-180, Math.min(180, value));

export function normalizeJointMap(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).filter(([id, values]) =>
    boneIds.has(id) && Array.isArray(values) && values.length === 3 &&
    values.every(Number.isFinite)).map(([id, values]) => [id, values.map(clamp)]));
}
export function normalizeConcertPose(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).filter(([id]) => actorIds.has(id))
    .map(([id, bones]) => [id, normalizeJointMap(bones)]));
}
export function loadConcertPose() {
  try { return normalizeConcertPose({ ...defaults, ...JSON.parse(localStorage.getItem(CONCERT_POSE_KEY) || "{}") }); }
  catch { return normalizeConcertPose(defaults); }
}
export function saveConcertPose(value) {
  localStorage.setItem(CONCERT_POSE_KEY, JSON.stringify(normalizeConcertPose(value)));
}
