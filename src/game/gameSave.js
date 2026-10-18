import { BOUNDS, JUMP_SPEED, MAX_HEALTH } from "./gameRules.js";
import { getLevel, LEVELS } from "./gameLevels.js";

export const GAME_SAVE_KEY = "neonboy.game.save.v1";
const invalid = () => { throw new Error("La partida guardada esta danada o no es compatible."); };
const number = (value, min, max) => {
  if (!Number.isFinite(value) || value < min || value > max) invalid();
  return value;
};
const weapon = (id, legacy) => legacy && id === "hammer" ? "axe" : id;
const inventory = (value, legacy) => {
  if (!Array.isArray(value) || value.length > 5 || !value.includes("unarmed") ||
    value.some((id) => !["unarmed", "sword", "axe", "hammer", "crossbow"].includes(id))) invalid();
  const normalized = value.map((id) => weapon(id, legacy));
  if (new Set(normalized).size !== normalized.length) invalid();
  return normalized;
};
const levelSkyHeight = 25;
const actor = (value, maxHealth, isPlayer = false, bounds = BOUNDS) => {
  if (!value || typeof value.grounded !== "boolean") invalid();
  return { x: number(value.x, bounds.left, bounds.right), y: number(value.y, -0.2, levelSkyHeight),
    z: number(value.z, bounds.back, bounds.front), yaw: number(value.yaw, -1e7, 1e7),
    health: number(value.health, isPlayer ? 1 : 0, maxHealth),
    velocityY: number(value.velocityY, -18, JUMP_SPEED), grounded: value.grounded };
};

export function validateGameSave(value) {
  if (!value || value.version !== 1 || !value.world) invalid();
  const source = value.world;
  const layoutVersion = source.layoutVersion ?? 1;
  if (![1, 2, 3].includes(layoutVersion)) invalid();
  const legacy = layoutVersion < 3;
  if (!Number.isInteger(source.level)) invalid();
  let level;
  try { level = getLevel(legacy && source.level === 2 ? 3 : source.level); } catch { invalid(); }
  const owned = inventory(source.inventory, legacy), checkpoint = inventory(source.checkpoint, legacy);
  if (level.id < 4 && (owned.includes("crossbow") || checkpoint.includes("crossbow"))) invalid();
  const equipped = weapon(source.equipped, legacy), checkpointWeapon = weapon(source.checkpointWeapon, legacy);
  if (!owned.includes(equipped) || !checkpoint.includes(checkpointWeapon) || checkpoint.some((id) => !owned.includes(id))) invalid();
  if (!Array.isArray(source.coins) || source.coins.length > level.coins.length ||
    source.coins.some((id) => !Number.isInteger(id) || id < 0 || id >= level.coins.length) ||
    new Set(source.coins).size !== source.coins.length) invalid();
  const hearts = source.hearts === undefined ? [] : source.hearts;
  if (!Array.isArray(hearts) || hearts.length > level.hearts.length ||
    hearts.some((id) => !level.hearts.some((heart) => heart.id === id)) || new Set(hearts).size !== hearts.length) invalid();
  const artifacts = source.artifacts === undefined ? [] : source.artifacts;
  if (!Array.isArray(artifacts) || artifacts.length > level.artifacts.length ||
    artifacts.some((id) => !level.artifacts.some((artifact) => artifact.id === id)) || new Set(artifacts).size !== artifacts.length) invalid();
  const previousMaximum = LEVELS.filter((entry) => entry.id < level.id).reduce((sum, entry) =>
    sum + entry.artifacts.reduce((points, artifact) => points + artifact.points, 0) + (entry.quest?.reward || 0), 0);
  const scoreBase = number(source.scoreBase === undefined ? 0 : source.scoreBase, 0, previousMaximum);
  if (!Number.isInteger(scoreBase)) invalid();
  if (!Array.isArray(source.enemies)) invalid();
  const legacyTemple = level.id === 1 && [4, 5].includes(source.enemies.length) && level.enemies.length > 5;
  const legacySanctuary = level.id === 2 && source.enemies.length === 7 && level.enemies.length > 7;
  const legacyCemetery = level.id === 3 && [5, 12].includes(source.enemies.length);
  const legacyCatacombs = level.id === 4 && source.enemies.length === 9;
  if (source.enemies.length !== level.enemies.length && !legacyTemple && !legacySanctuary &&
    !legacyCemetery && !legacyCatacombs) invalid();
  const bossSpawn = level.enemies.at(-1);
  const freshEnemy = (spawn) => ({ ...spawn, yaw: Math.PI,
    health: spawn.maxHealth || level.enemyHealth, velocityY: 0, grounded: true });
  const savedEnemies = legacyTemple ? [
    ...source.enemies.slice(0, 4), ...level.enemies.slice(4, -1).map(freshEnemy),
    source.enemies.length === 5 ? { ...source.enemies[4], x: bossSpawn.x, z: bossSpawn.z } : freshEnemy(bossSpawn)
  ] : legacySanctuary ? [
    ...source.enemies.slice(0, 6), ...level.enemies.slice(6, -1).map(freshEnemy),
    { ...source.enemies[6], x: bossSpawn.x, z: bossSpawn.z }
  ] : legacyCemetery || legacyCatacombs ? [
    ...source.enemies.slice(0, -1),
    ...level.enemies.slice(source.enemies.length - 1, -1).map(freshEnemy),
    { ...source.enemies.at(-1), x: bossSpawn.x, z: bossSpawn.z }
  ] : source.enemies;
  const bounds = level.bounds || BOUNDS;
  const enemies = savedEnemies.map((enemy, index) => actor(enemy, level.enemies[index].maxHealth || level.enemyHealth, false, bounds));
  const bossIndex = level.enemies.findIndex((enemy) => enemy.boss);
  const secretDoors = source.secretDoors ?? [];
  if (!Array.isArray(secretDoors) || new Set(secretDoors).size !== secretDoors.length ||
    secretDoors.some((id) => !level.secretDoors?.some((door) => door.id === id))) invalid();
  if (level.artifacts.some((artifact) => artifact.secret && artifacts.includes(artifact.id) && !secretDoors.includes(artifact.secret))) invalid();
  const questStage = source.questStage ?? (level.quest ? "unstarted" : null);
  const savedBossActive = source.bossActive ?? (source.coins.length === level.coins.length);
  if (typeof savedBossActive !== "boolean") invalid();
  const guardsDefeated = enemies.every((enemy, index) => level.enemies[index].boss || enemy.health <= 0);
  const bossActive = savedBossActive && guardsDefeated;
  if (level.quest) {
    if (!["unstarted", "searching", "returning"].includes(questStage)) invalid();
    const seal = artifacts.includes(level.quest.artifact);
    if (seal !== (questStage === "returning") || (seal && enemies[bossIndex].health > 0) ||
      (questStage === "unstarted" && savedBossActive)) invalid();
  } else {
    if (questStage !== null) invalid();
    if (source.coins.length === level.coins.length && (bossIndex < 0 || enemies[bossIndex].health <= 0)) invalid();
  }
  const ammo = number(source.ammo ?? (level.id === 4 ? 10 : 0), 0, 10);
  if (!Number.isInteger(ammo) || (level.id !== 4 && ammo !== 0)) invalid();
  const adviceIndex = number(source.adviceIndex ?? 0, 0, level.advisor?.tips.length || 0);
  const dragonMet = source.dragonMet ?? false;
  if (typeof dragonMet !== "boolean") invalid();
  const dragonDepartureTime = source.dragonDepartureTime ?? (dragonMet ? 0 : null);
  if (dragonMet) number(dragonDepartureTime, 0, number(source.time, 0, 1e9));
  else if (dragonDepartureTime !== null) invalid();
  if (!Number.isInteger(adviceIndex)) invalid();
  const ammoPickups = source.ammoPickups ?? [];
  if (!Array.isArray(ammoPickups) || ammoPickups.length > (level.ammoPickups?.length || 0) ||
    ammoPickups.some((entry) => !level.ammoPickups?.some((pickup) => pickup.id === entry.id) ||
      !Number.isFinite(entry.readyAt) || entry.readyAt < 0 || entry.readyAt > 1e9) ||
    new Set(ammoPickups.map((entry) => entry.id)).size !== ammoPickups.length) invalid();
  if (!["day", "sunset", "night"].includes(value.period) || !value.camera) invalid();
  const view = {};
  if (value.camera.firstPerson !== undefined) {
    if (typeof value.camera.firstPerson !== "boolean") invalid();
    view.firstPerson = value.camera.firstPerson;
  }
  if (value.camera.lookPitch !== undefined) view.lookPitch = number(value.camera.lookPitch, -1.25, 1.25);
  return { version: 1, savedAt: number(value.savedAt, 0, 8640000000000000), period: value.period,
    camera: { ...view, yaw: number(value.camera.yaw, -1e7, 1e7), pitch: number(value.camera.pitch, 0.12, 1.15), distance: number(value.camera.distance, 3.5, 12) },
    world: { level: level.id, layoutVersion: 3, inventory: owned, equipped, checkpoint, checkpointWeapon, questStage, adviceIndex, dragonMet, dragonDepartureTime, ammo, ammoPickups, bossActive, secretDoors: [...secretDoors],
      time: number(source.time, 0, 1e9), coins: [...source.coins], hearts: [...hearts], artifacts: [...artifacts], scoreBase,
      player: actor(source.player, MAX_HEALTH, true, bounds),
      enemies } };
}

export function readGameSave(storage) {
  try {
    storage ??= globalThis.localStorage;
    const raw = storage.getItem(GAME_SAVE_KEY);
    if (!raw) return { save: null, error: "" };
    if (raw.length > 50000) invalid();
    return { save: validateGameSave(JSON.parse(raw)), error: "" };
  } catch {
    return { save: null, error: "No se pudo leer la partida local. Puede estar danada o el almacenamiento bloqueado." };
  }
}

export function writeGameSave(value, storage) {
  const save = validateGameSave(value);
  try { (storage ?? globalThis.localStorage).setItem(GAME_SAVE_KEY, JSON.stringify(save)); }
  catch { throw new Error("No se pudo guardar. Revisa el espacio y los permisos de almacenamiento del navegador."); }
  return save;
}
