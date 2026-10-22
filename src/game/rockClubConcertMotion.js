import defaults from "./rockClubConcertMotion.json" with { type: "json" };
import { normalizeConcertTransforms } from "./rockClubConcertSettings.js";
import { normalizeJointMap } from "./rockClubConcertPose.js";

export const CONCERT_MOTION_KEY = "neonboy-rock-club-motion-v1";
export const CONCERT_MOTION_IDS = ["neonboy", "john-zool", "revenant"];
const LIMIT = 240;
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
export function motionFrame(time, transform, bones = {}) {
  const safe = normalizeConcertTransforms({ neonboy: transform }).neonboy;
  return { time: +time.toFixed(3), position: [...safe.position], rotation: [...safe.rotation],
    scale: safe.scale, bones: normalizeJointMap(bones) };
}
export function normalizeConcertMotion(input = {}) {
  return Object.fromEntries(CONCERT_MOTION_IDS.flatMap((id) => {
    const track = input?.[id];
    if (!track || !Array.isArray(track.keyframes)) return [];
    const duration = clamp(Number.isFinite(track.duration) ? track.duration : 8, 2, 30);
    const keyframes = track.keyframes.slice(0, LIMIT).filter((item) => Number.isFinite(item?.time))
      .map((item) => { const base = normalizeConcertTransforms({ [id]: item })[id]; return motionFrame(clamp(item.time, 0, duration), base, item.bones); })
      .sort((a, b) => a.time - b.time);
    return [[id, { duration, keyframes, enabled: track.enabled !== false }]];
  }));
}
export function loadConcertMotion() {
  try { return normalizeConcertMotion({ ...defaults, ...JSON.parse(localStorage.getItem(CONCERT_MOTION_KEY) || "{}") }); }
  catch { return normalizeConcertMotion(defaults); }
}
export function saveConcertMotion(motion) { localStorage.setItem(CONCERT_MOTION_KEY, JSON.stringify(normalizeConcertMotion(motion))); }
export function insertConcertMotionFrame(track, time, transform, bones = {}) {
  const duration = track?.duration || 8;
  const frame = motionFrame(clamp(time, 0, duration), transform, bones);
  const keyframes = [...(track?.keyframes || [])].filter((item) => Math.abs(item.time - frame.time) > 0.075);
  keyframes.push(frame);
  keyframes.sort((a, b) => a.time - b.time);
  return { duration, enabled: true, keyframes: keyframes.slice(-LIMIT) };
}
export function sampleConcertMotion(track, time) {
  const frames = track?.keyframes;
  if (!frames?.length) return null;
  if (frames.length === 1) return frames[0];
  const duration = track.duration || 8;
  const cursor = ((time % duration) + duration) % duration;
  let before = frames[frames.length - 1], after = frames[0];
  for (let i = 0; i < frames.length - 1; i++) {
    if (cursor >= frames[i].time && cursor < frames[i + 1].time) { before = frames[i]; after = frames[i + 1]; break; }
  }
  const wrapped = after.time <= before.time;
  const span = (wrapped ? after.time + duration : after.time) - before.time;
  const position = wrapped && cursor < before.time ? cursor + duration : cursor;
  const alpha = clamp(span > 0 ? (position - before.time) / span : 0, 0, 1);
  const mix = (a, b) => a + (b - a) * alpha;
  const angle = (a, b) => a + (((b - a + 540) % 360) - 180) * alpha;
  const boneIds = new Set([...Object.keys(before.bones || {}), ...Object.keys(after.bones || {})]);
  return { position: before.position.map((value, i) => mix(value, after.position[i])),
    rotation: before.rotation.map((value, i) => angle(value, after.rotation[i])),
    scale: mix(before.scale, after.scale),
    bones: Object.fromEntries([...boneIds].map((id) => [id, [0, 1, 2].map((axis) =>
      angle(before.bones?.[id]?.[axis] || 0, after.bones?.[id]?.[axis] || 0))])),
  };
}
