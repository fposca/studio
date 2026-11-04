export const HALLOWEEN_SAVE_KEY = "neonboy-halloween-saves-v1";
export const HALLOWEEN_SAVE_SLOTS = 3;
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? Math.trunc(value) : min));
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const strings = (value, limit = 80) => [...new Set((Array.isArray(value) ? value : [])
  .filter((item) => typeof item === "string" && item.length > 0 && item.length <= limit))];

export function normalizeHalloweenProgress(value = {}) {
  const chest = value.chest || {};
  const collected = chest.collected === true;
  const keyOwned = chest.keyOwned === true || collected;
  const phoneCalls = clampInt(value.phoneCalls, 0, 4);
  const discovered = new Set(strings(value.discoveredSecrets));
  for (let index = 0; index < phoneCalls; index++) discovered.add(`phone:${index}`);
  const judgeDefeated = value.judgeDefeated === true;
  const player = value.player || {};
  return {
    chest: { keyOwned, open: keyOwned && chest.open === true, collected },
    demonHealth: clampInt(value.demonHealth ?? 3, 0, 3),
    judgeDefeated,
    hearts: clampInt(value.hearts ?? 3, 1, 3),
    credits: clampInt(value.credits, 0, 10),
    belfegorAttempts: clampInt(value.belfegorAttempts, 0, 4),
    discoveredSecrets: [...discovered],
    phoneCalls,
    vhsCollected: value.vhsCollected === true,
    songs: strings(value.songs, 160).slice(0, 50),
    player: {
      x: Math.min(9.7, Math.max(-9.7, finite(player.x, 0))),
      z: Math.min(14.1, Math.max(-12.15, finite(player.z, 11.1))),
      yaw: finite(player.yaw, Math.PI),
    },
    firstPerson: value.firstPerson === true,
    ambientEnabled: value.ambientEnabled !== false,
  };
}

export function readHalloweenSaves(storage = globalThis.localStorage) {
  try {
    const data = JSON.parse(storage.getItem(HALLOWEEN_SAVE_KEY) || "null");
    if (!data || data.version !== 1 || !Array.isArray(data.slots)) return Array(HALLOWEEN_SAVE_SLOTS).fill(null);
    return Array.from({ length: HALLOWEEN_SAVE_SLOTS }, (_, slot) => {
      const record = data.slots[slot];
      return record && record.slot === slot && Number.isFinite(record.savedAt) && record.progress
        ? { slot, savedAt: record.savedAt, progress: normalizeHalloweenProgress(record.progress) } : null;
    });
  } catch {
    return Array(HALLOWEEN_SAVE_SLOTS).fill(null);
  }
}

export function writeHalloweenSave(storage, slot, progress, now = Date.now()) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= HALLOWEEN_SAVE_SLOTS) throw new RangeError("Invalid save slot");
  const slots = readHalloweenSaves(storage);
  const record = { slot, savedAt: now, progress: normalizeHalloweenProgress(progress) };
  slots[slot] = record;
  storage.setItem(HALLOWEEN_SAVE_KEY, JSON.stringify({ version: 1, slots }));
  return record;
}

export function deleteHalloweenSave(storage, slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= HALLOWEEN_SAVE_SLOTS) throw new RangeError("Invalid save slot");
  const slots = readHalloweenSaves(storage);
  slots[slot] = null;
  storage.setItem(HALLOWEEN_SAVE_KEY, JSON.stringify({ version: 1, slots }));
  return slots;
}
