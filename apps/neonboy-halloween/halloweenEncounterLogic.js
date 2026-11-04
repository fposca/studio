export const VISION_SECONDS = 10;
export const VISION_RECHARGE_SECONDS = 20;

export function advanceVisionClock(clock, dt, paused) {
  if (paused || clock.phase === "locked" || clock.phase === "ready") return clock;
  const remaining = Math.max(0, clock.remaining - dt);
  if (remaining > 0) return { ...clock, remaining };
  return clock.phase === "active"
    ? { phase: "cooldown", remaining: VISION_RECHARGE_SECONDS, activation: clock.activation }
    : { phase: "ready", remaining: 0, activation: clock.activation };
}

export function toggleVisionClock(clock) {
  if (clock.phase === "ready") return { phase: "active", remaining: VISION_SECONDS, activation: clock.activation + 1 };
  if (clock.phase === "active") return { phase: "cooldown", remaining: VISION_RECHARGE_SECONDS, activation: clock.activation };
  return clock;
}

export function selectHiddenMessageIndices(activation, count = 8) {
  const start = (activation * 3) % count;
  return [0, 2, 4, 6].map((offset) => (start + offset) % count);
}
