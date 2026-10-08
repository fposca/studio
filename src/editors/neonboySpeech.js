export const DEFAULT_NEONBOY_SPEECH = Object.freeze({
  enabled: false,
  start: 0,
  end: 3,
  speed: 3.4,
  intensity: 0.8
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeNeonboySpeech(settings = {}, duration = 300) {
  const source = { ...DEFAULT_NEONBOY_SPEECH, ...settings };
  const limit = Number.isFinite(Number(duration)) ? clamp(Number(duration), 0.2, 300) : 300;
  const start = clamp(Number(source.start) || 0, 0, limit - 0.1);
  return {
    enabled: Boolean(source.enabled),
    start,
    end: clamp(Number(source.end) || 0, start + 0.1, limit),
    speed: clamp(Number(source.speed) || DEFAULT_NEONBOY_SPEECH.speed, 0.5, 8),
    intensity: clamp(Number(source.intensity) || 0, 0, 1.5)
  };
}

const REST_POSE = Object.freeze({ open: 0, round: 0, wide: 0, press: 0 });
const smoothstep = (start, end, value) => {
  const t = clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};
const variation = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

export function neonboySpeechPoseAt(settings, time) {
  if (!settings?.enabled || !Number.isFinite(time) || time <= settings.start || time >= settings.end || !settings.intensity) return REST_POSE;
  const elapsed = time - settings.start;
  const beat = elapsed * settings.speed;
  const phrase = Math.floor(beat / 8);
  const localBeat = beat - phrase * 8;
  const count = 6 + Math.floor(variation(phrase + 4) * 2);
  let onset = 0;

  // Derive each syllable from scene time so seeking, preview and export agree.
  for (let syllable = 0; syllable < count; syllable += 1) {
    const seed = phrase * 31 + syllable * 5;
    const duration = 0.72 + variation(seed + 1) * 0.4;
    if (localBeat < onset + duration) {
      const phase = (localBeat - onset) / duration;
      const vowel = Math.floor(variation(seed + 2) * 3);
      const hold = 0.5 + variation(seed + 3) * 0.2;
      const jaw = smoothstep(0.06, 0.25, phase) * (1 - smoothstep(hold, 0.97, phase));
      const lips = smoothstep(0.01, 0.18, phase) * (1 - smoothstep(0.74, 1, phase));
      const consonant = smoothstep(0, 0.05, phase) * (1 - smoothstep(0.08, 0.22, phase));
      const edge = smoothstep(0, 0.16, elapsed) * smoothstep(0, 0.2, settings.end - time);
      const strength = edge * settings.intensity;
      return {
        open: jaw * (0.58 + variation(seed + 4) * 0.42) * (vowel === 2 ? 0.75 : 1) * strength,
        round: lips * (vowel === 2 ? 0.9 : 0.06) * strength,
        wide: lips * (vowel === 1 ? 0.8 : vowel === 0 ? 0.24 : 0) * strength,
        press: consonant * 0.6 * strength
      };
    }
    onset += duration;
  }
  return REST_POSE;
}

export function neonboySpeechAmountAt(settings, time) {
  return neonboySpeechPoseAt(settings, time).open;
}
