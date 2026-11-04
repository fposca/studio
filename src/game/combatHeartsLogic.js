export const COMBAT_MAX_HEARTS = 3;
export const COMBAT_INVULNERABILITY_MS = 1400;

export function receiveCombatDamage(hearts, invulnerableUntil, now, amount = 1) {
  if (hearts <= 0 || now < invulnerableUntil) return null;
  return {
    hearts: Math.max(0, hearts - Math.max(1, Math.floor(amount))),
    invulnerableUntil: now + COMBAT_INVULNERABILITY_MS,
  };
}
