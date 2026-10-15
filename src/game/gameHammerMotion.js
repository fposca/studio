import { ATTACKS } from "./gameRules.js";

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

// One readable windup, a fast overhead blow and a short, damped recovery.
// The damaging frame in GameWorld is the same impact used by this pose.
export function hammerMotion(elapsed) {
  const { impact, duration } = ATTACKS.hammer;
  const lift = smooth(elapsed / 0.38);
  const downward = Math.pow(clamp01((elapsed - 0.40) / (impact - 0.40)), 2);
  const recover = smooth((elapsed - impact) / (duration - impact));
  const slam = downward * (1 - recover);
  const windup = lift * (1 - downward) * (1 - recover);
  const sinceImpact = elapsed - impact;
  const jolt = sinceImpact < 0 ? 0 : Math.exp(-sinceImpact * 20) * Math.sin(Math.min(1, sinceImpact / 0.035) * Math.PI / 2);
  return { windup, slam, jolt };
}
