import { DISCOGRAPHY_ALBUMS } from "./discographyCatalog.js";
import { INITIAL_STORE_PROGRESS, STORE_DIALOGUE_SAVE_KEY, loadStoreProgress } from "./recordStoreDialogue.js";
import { INITIAL_STUDIO_PROGRESS, STUDIO_PROGRESS_KEY, loadStudioProgress } from "./studioDialogue.js";
import { normalizeImpossibleRecording } from "./studioImpossibleRecording.js";
import { INITIAL_MASTER_TAPE_PROGRESS, MASTER_TAPE_SAVE_KEY, loadMasterTapeProgress } from "./masterTapeQuest.js";
import { CLUB_SHOW_SAVE_KEY, INITIAL_CLUB_SHOW_QUEST, loadClubShowQuest, normalizeClubShowQuest } from "./clubShowQuest.js";
import { INITIAL_RIKY_PROGRESS, RIKY_SAVE_KEY, canDiscoverRikyClue, loadRikyProgress, normalizeRikyProgress } from "./rockClubRiky.js";
import { FRIENDS_SAVE_KEY, INITIAL_FRIENDS_PROGRESS, loadFriendsProgress, normalizeFriendsProgress } from "./rockClubFriends.js";
import { STORE_LAYOUT } from "./recordStoreLayout.js";
import { STUDIO_LAYOUT } from "./studioLayout.js";
import { ROCK_CLUB_LAYOUT } from "./rockClubLayout.js";
import { ARCADE_LAYOUT } from "./arcadeLayout.js";
import { INITIAL_ARCADE_PROGRESS, normalizeArcadeProgress } from "./arcadeProgress.js";
import { ROOFTOP_LAYOUT } from "./rooftopLayout.js";
import { INITIAL_ROOFTOP_PROGRESS, normalizeRooftopProgress } from "./rooftopQuest.js";
import { LOST_SHIP_LAYOUT } from "./lostShipLayout.js";
import { INITIAL_LOST_SHIP_PROGRESS, normalizeLostShipProgress } from "./lostShipQuest.js";
import { PARTHENON_LAYOUT } from "./parthenonLayout.js";
import { PARTHENON_INITIAL, normalizeParthenonProgress } from "./parthenonQuest.js";
import {MATRIX_LAYOUT} from "./matrixLayout.js";
import {MATRIX_INITIAL,normalizeMatrixProgress} from "./matrixQuest.js";
import { STORE_INVASION_INITIAL, normalizeStoreInvasionProgress } from "./storeInvasionQuest.js";

export const UNIVERSE_SAVES_KEY = "neonboy.universe.saves.v1";
export const UNIVERSE_SAVE_SLOTS = ["autosave", "slot-1", "slot-2", "slot-3"];
const SCENES = ["store", "studio", "club", "arcade", "rooftop", "lost-ship", "parthenon", "matrix"];
const LAYOUTS = { store: STORE_LAYOUT, studio: STUDIO_LAYOUT, club: ROCK_CLUB_LAYOUT, arcade: ARCADE_LAYOUT, rooftop: ROOFTOP_LAYOUT, "lost-ship": LOST_SHIP_LAYOUT, parthenon: PARTHENON_LAYOUT, matrix: MATRIX_LAYOUT };
const ALBUM_IDS = new Set(DISCOGRAPHY_ALBUMS.map((album) => album.id));
const GROUPS = new Set(["instrumental", "band"]);
const UNLOCKS = new Set(["recording-studio", "rock-club", "arcade-1999", "neonboy-rooftop", "lost-ship", "parthenon", "matrix"]);

export function createNewUniverseGame() {
  return {
    scene: "store", credits: 0, selectedId: DISCOGRAPHY_ALBUMS[0].id,
    activeGroup: "instrumental", storyProgress: { ...INITIAL_STORE_PROGRESS },
    studioProgress: { ...INITIAL_STUDIO_PROGRESS },
    masterTape: { ...INITIAL_MASTER_TAPE_PROGRESS, reviewed: [] },
    clubQuest: { ...INITIAL_CLUB_SHOW_QUEST, inspected: [] },
    rikyProgress: { ...INITIAL_RIKY_PROGRESS, topics: [] },
    friendsProgress: { ...INITIAL_FRIENDS_PROGRESS, met: [], topics: [] },
    arcadeProgress: { ...INITIAL_ARCADE_PROGRESS, met: [] },
    rooftopProgress: { ...INITIAL_ROOFTOP_PROGRESS, switches: [] },
    lostShipProgress: { ...INITIAL_LOST_SHIP_PROGRESS },
    parthenonProgress: { ...PARTHENON_INITIAL }, matrixProgress: { ...MATRIX_INITIAL }, storeInvasionProgress: { ...STORE_INVASION_INITIAL }, combatHearts: 3,
    mapUnlocks: [], positions: { store: null, studio: null, club: null, arcade: null, rooftop: null, "lost-ship": null, parthenon: null, matrix: null },
  };
}

function validatedProgress(loader, key, progress) {
  return loader({ getItem: (requested) => requested === key ? JSON.stringify({ version: 1, progress }) : null });
}

function safePosition(value, layout) {
  if (!value || typeof value !== "object" || !Number.isFinite(value.x) || !Number.isFinite(value.z)) return null;
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
  return {
    x: clamp(value.x, -layout.playerLimitX + 0.6, layout.playerLimitX - 0.6),
    z: clamp(value.z, layout.playerBackZ + 0.6, layout.playerFrontZ - 0.6),
    yaw: Number.isFinite(value.yaw) ? value.yaw : Math.PI,
    viewYaw: Number.isFinite(value.viewYaw) ? value.viewYaw : 0,
  };
}

export function normalizeUniverseGame(data) {
  if (!data || typeof data !== "object" || !SCENES.includes(data.scene)) return null;
  const defaults = createNewUniverseGame();
  const selectedId = ALBUM_IDS.has(data.selectedId) ? data.selectedId : defaults.selectedId;
  const album = DISCOGRAPHY_ALBUMS.find((entry) => entry.id === selectedId);
  const phase = validatedProgress(loadMasterTapeProgress, MASTER_TAPE_SAVE_KEY, data.masterTape);
  const clubQuest = normalizeClubShowQuest(data.clubQuest, phase);
  const rikyProgress = normalizeRikyProgress(data.rikyProgress);
  const arcadeProgress = normalizeArcadeProgress(data.arcadeProgress);
  const studioProgress = normalizeImpossibleRecording(
    validatedProgress(loadStudioProgress, STUDIO_PROGRESS_KEY, data.studioProgress),
    arcadeProgress.recordStoreGhostSeen,
  );
  const rooftopProgress = normalizeRooftopProgress(data.rooftopProgress, studioProgress.rooftopClueKnown);
  const lostShipProgress = normalizeLostShipProgress(data.lostShipProgress, rooftopProgress.missionCompleted);
  const parthenonProgress = normalizeParthenonProgress(data.parthenonProgress, lostShipProgress.orbReceiverActivated);
  const matrixProgress = normalizeMatrixProgress(data.matrixProgress, parthenonProgress.frequencyFragment02Analyzed);
  const storeInvasionProgress = normalizeStoreInvasionProgress(data.storeInvasionProgress, matrixProgress.archiveRead && (matrixProgress.returnedHome || data.scene === "store"));
  const narrativeUnlocks = [
    ...(phase.phase === "new" ? [] : ["recording-studio"]),
    ...(clubQuest.credentialGranted ? ["rock-club"] : []),
    ...(clubQuest.anomalySeen ? ["arcade-1999"] : []),
    ...(studioProgress.rooftopClueKnown ? ["neonboy-rooftop"] : []),
    ...(lostShipProgress.linkActivated ? ["lost-ship"] : []),
    ...(lostShipProgress.orbReceiverActivated ? ["parthenon"] : []),
    ...(parthenonProgress.frequencyFragment02Analyzed ? ["matrix"] : []),
  ];
  return {
    scene: data.scene === "matrix" && !parthenonProgress.frequencyFragment02Analyzed ? "lost-ship" : data.scene === "parthenon" && !lostShipProgress.orbReceiverActivated
      ? (lostShipProgress.linkActivated ? "lost-ship" : rooftopProgress.missionCompleted ? "rooftop" : "store")
      : data.scene === "lost-ship" && !lostShipProgress.linkActivated
        ? (rooftopProgress.missionCompleted ? "rooftop" : "store") : data.scene,
    credits: Number.isInteger(data.credits) ? Math.max(0, Math.min(10, data.credits)) : 0,
    selectedId,
    activeGroup: GROUPS.has(data.activeGroup) ? data.activeGroup : album.group,
    storyProgress: validatedProgress(loadStoreProgress, STORE_DIALOGUE_SAVE_KEY, data.storyProgress),
    studioProgress,
    rooftopProgress,
    lostShipProgress, parthenonProgress, matrixProgress, storeInvasionProgress,
    combatHearts: Number.isInteger(data.combatHearts) ? Math.max(0, Math.min(3, data.combatHearts)) : 3,
    masterTape: phase,
    clubQuest,
    friendsProgress: normalizeFriendsProgress(data.friendsProgress),
    arcadeProgress,
    rikyProgress: {
      ...rikyProgress,
      signalKnown: phase.phase === "complete" && rikyProgress.topics.includes("paranormal") && rikyProgress.signalKnown,
      rikyFrequencyClueKnown: canDiscoverRikyClue(rikyProgress, phase) && rikyProgress.rikyFrequencyClueKnown,
      postShowSeen: clubQuest.anomalySeen && rikyProgress.postShowSeen,
    },
    mapUnlocks: [...new Set([...(Array.isArray(data.mapUnlocks) ? data.mapUnlocks.filter((id) => UNLOCKS.has(id) && (id !== "rock-club" || clubQuest.credentialGranted) && (id !== "arcade-1999" || clubQuest.anomalySeen) && (id !== "neonboy-rooftop" || studioProgress.rooftopClueKnown) && (id !== "lost-ship" || lostShipProgress.linkActivated) && (id !== "parthenon" || lostShipProgress.orbReceiverActivated) && (id !== "matrix" || parthenonProgress.frequencyFragment02Analyzed)) : []), ...narrativeUnlocks])],
    positions: Object.fromEntries(SCENES.map((scene) => [scene, safePosition(data.positions?.[scene], LAYOUTS[scene])])),
  };
}

export function readUniverseSaves(storage = globalThis.localStorage) {
  const empty = { autosave: null, "slot-1": null, "slot-2": null, "slot-3": null };
  try {
    const saved = JSON.parse(storage.getItem(UNIVERSE_SAVES_KEY) || "null");
    if (saved?.version !== 1 || !saved.slots || typeof saved.slots !== "object") return empty;
    for (const id of UNIVERSE_SAVE_SLOTS) {
      const entry = saved.slots[id];
      const data = normalizeUniverseGame(entry?.data);
      if (data && Number.isFinite(entry.savedAt) && entry.savedAt > 0)
        empty[id] = { savedAt: entry.savedAt, data };
    }
    return empty;
  } catch { return empty; }
}

export function writeUniverseSave(id, data, storage = globalThis.localStorage, now = Date.now()) {
  if (!UNIVERSE_SAVE_SLOTS.includes(id)) return { ok: false, slots: readUniverseSaves(storage) };
  const normalized = normalizeUniverseGame(data);
  if (!normalized) return { ok: false, slots: readUniverseSaves(storage) };
  const slots = readUniverseSaves(storage);
  slots[id] = { savedAt: now, data: normalized };
  try {
    storage.setItem(UNIVERSE_SAVES_KEY, JSON.stringify({ version: 1, slots }));
    return { ok: true, slots };
  } catch { return { ok: false, slots: readUniverseSaves(storage) }; }
}

export function latestUniverseSave(slots) {
  return UNIVERSE_SAVE_SLOTS.map((id) => ({ id, ...slots[id] }))
    .filter((entry) => entry.data)
    .sort((a, b) => b.savedAt - a.savedAt)[0] || null;
}

// Older versions stored only dialogue and mission state. Import it once as an autosave.
export function readUniverseSavesWithLegacy(storage = globalThis.localStorage) {
  const slots = readUniverseSaves(storage);
  if (latestUniverseSave(slots)) return slots;
  try {
    if (![STORE_DIALOGUE_SAVE_KEY, STUDIO_PROGRESS_KEY, MASTER_TAPE_SAVE_KEY, CLUB_SHOW_SAVE_KEY, RIKY_SAVE_KEY, FRIENDS_SAVE_KEY].some((key) => storage.getItem(key) !== null)) return slots;
    const legacy = createNewUniverseGame();
    legacy.storyProgress = loadStoreProgress(storage);
    legacy.studioProgress = loadStudioProgress(storage);
    legacy.masterTape = loadMasterTapeProgress(storage);
    legacy.clubQuest = loadClubShowQuest(storage, legacy.masterTape);
    legacy.rikyProgress = loadRikyProgress(storage);
    legacy.friendsProgress = loadFriendsProgress(storage);
    return writeUniverseSave("autosave", legacy, storage).slots;
  } catch { return slots; }
}
