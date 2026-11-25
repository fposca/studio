export const OFFICE_AVATAR_STORAGE_KEY = "nexora.office.avatar.v1";

export const CUSTOM_AVATAR_DEFAULTS = Object.freeze({
  name: "Alex",
  hairStyle: "none",
  hairColor: "#33251f",
  beardStyle: "none",
  beardColor: "#33251f",
  glasses: "none",
  shirtColor: "#eef4f7",
  pantsColor: "#253d5b",
  shoesColor: "#f4f5f2",
});

export const HAIR_STYLES = Object.freeze([
  { value: "none", label: "Sin pelo" },
  { value: "short", label: "Corto" },
  { value: "medium", label: "Medio" },
  { value: "long", label: "Largo" },
]);
export const BEARD_STYLES = Object.freeze([
  { value: "none", label: "Sin barba" },
  { value: "stubble", label: "Sombra" },
  { value: "short", label: "Corta" },
  { value: "full", label: "Completa" },
]);
export const GLASSES_STYLES = Object.freeze([
  { value: "none", label: "Sin gafas" },
  { value: "round", label: "Redondas" },
  { value: "square", label: "Rectangulares" },
]);

const choices = {
  hairStyle: HAIR_STYLES,
  beardStyle: BEARD_STYLES,
  glasses: GLASSES_STYLES,
};
const colorFields = ["hairColor", "beardColor", "shirtColor", "pantsColor", "shoesColor"];

export function normalizeAvatarCustomization(value) {
  const input = value && typeof value === "object" ? value : {};
  const normalized = { ...CUSTOM_AVATAR_DEFAULTS };
  if (typeof input.name === "string") {
    const name = input.name.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 24);
    if (name) normalized.name = name;
  }
  for (const [field, options] of Object.entries(choices)) {
    if (options.some(option => option.value === input[field])) normalized[field] = input[field];
  }
  for (const field of colorFields) {
    if (typeof input[field] === "string" && /^#[\da-f]{6}$/i.test(input[field]))
      normalized[field] = input[field].toLowerCase();
  }
  return normalized;
}

export function readOfficeAvatarPreferences(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    const stored = JSON.parse(target?.getItem(OFFICE_AVATAR_STORAGE_KEY) || "null");
    return {
      selectedAvatar: ["fernando", "victoria", "custom"].includes(stored?.selectedAvatar)
        ? stored.selectedAvatar : "fernando",
      customization: normalizeAvatarCustomization(stored?.customization),
    };
  } catch {
    return { selectedAvatar: "fernando", customization: normalizeAvatarCustomization(null) };
  }
}

export function saveOfficeAvatarPreferences(preferences, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(OFFICE_AVATAR_STORAGE_KEY, JSON.stringify({
      selectedAvatar: ["fernando", "victoria", "custom"].includes(preferences.selectedAvatar)
        ? preferences.selectedAvatar : "fernando",
      customization: normalizeAvatarCustomization(preferences.customization),
    }));
    return true;
  } catch {
    return false;
  }
}
