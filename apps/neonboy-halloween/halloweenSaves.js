export const HALLOWEEN_SAVE_KEY = "neonboy-halloween-save-v2";
export const HALLOWEEN_LEGACY_SAVE_KEY = "neonboy-halloween-saves-v1";
export const HALLOWEEN_SAVE_SLOTS = 1;
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

const validSave = (record, slot = 0) => record && record.slot === slot
  && Number.isFinite(record.savedAt) && record.progress && typeof record.progress === "object";

export function readHalloweenSaves(storage = globalThis.localStorage) {
  try {
    const data = JSON.parse(storage.getItem(HALLOWEEN_SAVE_KEY) || "null");
    // A new, empty save must not revive an older legacy slot.
    if (data?.version === 2) {
      const record = data.record;
      return [validSave(record) ? { slot: 0, savedAt: record.savedAt, progress: normalizeHalloweenProgress(record.progress) } : null];
    }
    const legacy = JSON.parse(storage.getItem(HALLOWEEN_LEGACY_SAVE_KEY) || "null");
    if (legacy?.version !== 1 || !Array.isArray(legacy.slots)) return [null];
    const latest = legacy.slots
      .filter((record, slot) => validSave(record, slot))
      .sort((a, b) => b.savedAt - a.savedAt)[0];
    // Reading leaves the original three saves untouched. The next save uses v2.
    return [latest ? { slot: 0, savedAt: latest.savedAt, progress: normalizeHalloweenProgress(latest.progress) } : null];
  } catch {
    return [null];
  }
}

export function writeHalloweenSave(storage, slot, progress, now = Date.now()) {
  if (slot !== 0) throw new RangeError("Invalid save slot");
  const record = { slot: 0, savedAt: now, progress: normalizeHalloweenProgress(progress) };
  storage.setItem(HALLOWEEN_SAVE_KEY, JSON.stringify({ version: 2, record }));
  return record;
}

export function deleteHalloweenSave(storage, slot) {
  if (slot !== 0) throw new RangeError("Invalid save slot");
  storage.removeItem(HALLOWEEN_SAVE_KEY);
  storage.removeItem(HALLOWEEN_LEGACY_SAVE_KEY);
  return [null];
}
