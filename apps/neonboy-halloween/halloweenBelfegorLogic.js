export const BELFEGOR_REQUIRED_ATTEMPTS = 4;

const REACTIONS = [
  "Belfegor te observa en silencio.",
  "Belfegor gira apenas la cabeza, pero sigue callado.",
  "Belfegor golpea dos veces la rockola. Parece que te escucha.",
  "Un sonido rompe el silencio. Belfegor te respondi\u00f3.",
];

export function canRevealRealityKey(attempts) {
  return attempts >= BELFEGOR_REQUIRED_ATTEMPTS;
}

export function advanceBelfegorAttempt(current) {
  const attempts = Math.min(BELFEGOR_REQUIRED_ATTEMPTS, Math.max(0, current) + 1);
  return { attempts, responded: attempts === BELFEGOR_REQUIRED_ATTEMPTS };
}

export function belfegorReaction(attempts) {
  return REACTIONS[Math.max(0, Math.min(BELFEGOR_REQUIRED_ATTEMPTS, attempts) - 1)];
}
