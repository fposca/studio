const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

export function outageLightLevel(age, reducedMotion = false) {
  if (age < 0 || age >= 6.4) return 1;
  if (age < 1.2) {
    const dip = reducedMotion ? 1 : 1 - Math.pow(Math.sin(age * Math.PI * 3.2), 4) * .28;
    return (1 - .72 * smooth(age / 1.2)) * dip;
  }
  if (age < 2.0) return .28 - .16 * smooth((age - 1.2) / .8);
  if (age < 3.6) return .12;
  if (age < 4.6) return reducedMotion ? .12 + .23 * smooth(age - 3.6) : .12 + .23 * Math.pow(Math.sin((age - 3.6) * Math.PI * 2), 4);
  return .12 + .88 * smooth((age - 4.6) / 1.8);
}
