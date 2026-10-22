import defaults from "./rockClubConcertTransforms.json" with { type: "json" };

export const CONCERT_TRANSFORMS_KEY = "neonboy-rock-club-concert-transforms-v1";
export const CONCERT_EDITABLES = [
  { id: "neonboy", label: "NeonBoy / guitarra", slot: "guitar", height: 1.3, bodyPivot: 0.28 },
  { id: "john-zool", label: "John Zool / guitarra", slot: "guitar", height: 1.5, bodyPivot: 0.28 },
  { id: "revenant", label: "Revenant / bajo", slot: "bass", height: 1.45, bodyPivot: 0.26 },
  { id: "lujan", label: "Luján / asiento" },
];
export function defaultConcertTransform(id) { return structuredClone(defaults[id]); }
export function normalizeConcertTransforms(saved = {}) {
  return Object.fromEntries(Object.entries(defaults).map(([id, base]) => {
    const item = saved?.[id] || {};
    const vector = (field, limit) => base[field].map((value, index) => Number.isFinite(item[field]?.[index])
      ? Math.max(-limit, Math.min(limit, item[field][index])) : value);
    return [id, { position: vector("position", 2), rotation: vector("rotation", 360),
      scale: Number.isFinite(item.scale) ? Math.max(0.4, Math.min(2, item.scale)) : base.scale,
      ...(base.anchor ? { anchor: ["hands", "waist"].includes(item.anchor) ? item.anchor : base.anchor } : {}),
      ...(base.fretHand ? { fretHand: ["left", "right"].includes(item.fretHand) ? item.fretHand : base.fretHand } : {}),
    }];
  }));
}
export function loadConcertTransforms() {
  try { return normalizeConcertTransforms(JSON.parse(localStorage.getItem(CONCERT_TRANSFORMS_KEY) || "{}")); }
  catch { return normalizeConcertTransforms(); }
}
export function saveConcertTransforms(value) {
  localStorage.setItem(CONCERT_TRANSFORMS_KEY, JSON.stringify(normalizeConcertTransforms(value)));
}
