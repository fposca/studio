// Deterministic flight simulation. No DOM, React, physics engine or render loop.
export const ESCAPE_DURATION = 180;
export const ESCAPE_CHASE_START = 16;
export const ESCAPE_JUMP_START = 164;
export const ESCAPE_COOLDOWN = 3.8;
export const ESCAPE_PULSE_DURATION = 1.05;
export const ESCAPE_BOLT_DURATION = 3.2;
// Surface and collision share dimensions: a wider, visibly open escape lane.
export const ESCAPE_BARRIER = Object.freeze({ width: 3.6, height: 7, offset: 2.1, clearance: .75, warning: 5.5 });
export const ESCAPE_PROFILES = { low: { drones: 2, bolts: 4, particles: 16 }, medium: { drones: 3, bolts: 6, particles: 28 }, high: { drones: 3, bolts: 8, particles: 40 } };
export const canStartEscape = p => !!(p?.vigilanteDefeated && p.fuegoKeyInstalled && p.fuegoPowerCellInstalled && p.fuegoNavigationModuleInstalled && p.fuegoRecordShown);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const ease = n => (n = clamp(n, 0, 1), n * n * (3 - 2 * n));
export function escapeStage(time) {
  return time < 9 ? 'startup' : time < 16 ? 'departure' : time < 52 ? 'avenue' : time < 132 ? 'interception' : time < 164 ? 'signal-break' : 'time-jump';
}
// Elevated oval over the existing avenues. No teleport at the seam. All lanes
// clear the widened Obelisk and buildings; friendly traffic stays below 18 m.
export function escapeRoute(time, lateral = 0, vertical = 0) {
  if (time < 9) return { x: -6, y: .88 + 2.62 * ease((time - 2) / 7), z: 23, yaw: Math.PI / 2 };
  if (time < 16) {
    const t = clamp((time - 9) / 7, 0, 1), u = 1 - t;
    const x = -6*u*u*u -18*u*u*t -30*u*t*t;
    const y = 3.5*u*u*u +75*u*u*t +70.5*u*t*t +23.5*t*t*t;
    const z = 23*u*u*u +90*u*u*t +171*u*t*t +57*t*t*t;
    const dx = 3*u*u*0 +6*u*t*(-4) +3*t*t*10;
    const dz = 3*u*u*7 +6*u*t*27;
    return { x, y, z, yaw: Math.atan2(dx, dz) };
  }
  const angle = (time - 16) * Math.PI * 2 / 33;
  const dx = 26 * Math.cos(angle), dz = -62 * Math.sin(angle), yaw = Math.atan2(dx, dz);
  // The chase camera looks along +Z: screen-right is (-cos(yaw), sin(yaw)).
  return { x: 26 * Math.sin(angle) - Math.cos(yaw) * lateral,
    y: 23.5 + 1.4 * Math.sin(angle * 2) + vertical,
    z: -5 + 62 * Math.cos(angle) + Math.sin(yaw) * lateral, yaw };
}
export function escapeDroneRoute(time, index) {
  return escapeRoute(time - .25 - index * .07, [-4.7, 4.7, 0][index], index === 2 ? 4.2 : .8 + Math.sin(time + index) * .2);
}
export function createEscapeState(tier = 'high', retry = false) {
  return { status: 'playing', time: retry ? 16 : 0, integrity: 100, lateral: 0, vertical: 0,
    targetLateral: 0, targetVertical: 0, cooldown: 0, invulnerable: 0, pulse: 0,
    barriers: [], bolts: [], nextBarrier: 31, nextBolt: 58, serial: 0,
    lastDamage: '', hits: 0, pulses: 0, tier, droneDisabledUntil: [0, 0, 0], originSent: false };
}
export function damageEscape(s, amount, reason) {
  if (s.status !== 'playing' || s.invulnerable > 0 || s.time >= ESCAPE_JUMP_START) return false;
  s.integrity = Math.max(0, s.integrity - amount); s.invulnerable = 1.35;
  s.lastDamage = reason; s.hits++;
  if (!s.integrity) s.status = 'failed';
  return true;
}
export function pulseEscape(s) {
  if (s.status !== 'playing' || s.time < 16 || s.time >= ESCAPE_JUMP_START || s.cooldown > 0) return false;
  s.cooldown = ESCAPE_COOLDOWN; s.pulse = ESCAPE_PULSE_DURATION; s.pulses++;
  // Only nearby aerial targets. Never dispatches ground combat events.
  s.bolts = s.bolts.filter(b => b.due - s.time > 1.65);
  s.droneDisabledUntil = s.droneDisabledUntil.map(() => s.time + 3);
  return true;
}
export function stepEscape(s, dt, input = {}) {
  if (s.status !== 'playing') return s;
  const step = clamp(Number.isFinite(dt) ? dt : 0, 0, .05), previous = s.time;
  if (!step) return s;
  s.time = Math.min(ESCAPE_DURATION, s.time + step);
  s.cooldown = Math.max(0, s.cooldown - step); s.invulnerable = Math.max(0, s.invulnerable - step); s.pulse = Math.max(0, s.pulse - step);
  const controls = s.time >= 16 && s.time < ESCAPE_JUMP_START;
  if (controls) {
    const horizontal = clamp(input.horizontal || 0, -1, 1), vertical = clamp(input.vertical || 0, -1, 1);
    // Stabilizers brake immediately on release: no hidden target continuing to
    // pull the car after the player lifts a finger or reverses direction.
    s.targetLateral = horizontal ? clamp(s.lateral + horizontal * .4, -3.3, 3.3) : s.lateral;
    s.targetVertical = vertical ? clamp(s.vertical + vertical * .3, -2, 2) : s.vertical;
    s.lateral = clamp(s.lateral + horizontal * 4.8 * step, -3.3, 3.3);
    s.vertical = clamp(s.vertical + vertical * 2.7 * step, -2, 2);
  } else {
    s.targetLateral = 0; s.targetVertical = 0;
    s.lateral += -s.lateral * (1 - Math.exp(-8 * step));
    s.vertical += -s.vertical * (1 - Math.exp(-6 * step));
  }
  if (controls && s.time >= s.nextBarrier && s.time < 153) {
    const id = s.serial++;
    s.barriers.push({ id, due: s.time + ESCAPE_BARRIER.warning, side: id % 2 ? 1 : -1, checked: false });
    s.nextBarrier += 9;
  }
  const profile = ESCAPE_PROFILES[s.tier] || ESCAPE_PROFILES.low;
  if (controls && s.time >= s.nextBolt && s.time < 158) {
    const drone = s.serial++ % profile.drones;
    if (s.droneDisabledUntil[drone] <= s.time && s.bolts.length < profile.bolts)
      s.bolts.push({ id: s.serial++, born: s.time, due: s.time + ESCAPE_BOLT_DURATION, lateral: s.lateral, vertical: s.vertical, drone });
    s.nextBolt += s.tier === 'low' ? 4.2 : 3.8;
  }
  for (const barrier of s.barriers) if (!barrier.checked && previous < barrier.due && s.time >= barrier.due) {
    barrier.checked = true;
    if (barrier.side * s.lateral > -ESCAPE_BARRIER.clearance) {
      barrier.hit = damageEscape(s, 20, 'BARRERA DE LA RED');
      barrier.impactLateral = s.lateral; barrier.impactVertical = s.vertical;
    }
  }
  for (const bolt of s.bolts) if (previous < bolt.due && s.time >= bolt.due && Math.hypot(s.lateral - bolt.lateral, s.vertical - bolt.vertical) < 1.0)
    damageEscape(s, 10, 'PROYECTIL DE INTERCEPCI\u00d3N');
  s.barriers = s.barriers.filter(b => s.time - b.due < 1.2);
  s.bolts = s.bolts.filter(b => s.time < b.due);
  if (s.time >= ESCAPE_DURATION && s.status === 'playing') s.status = 'complete';
  return s;
}

const D = 'LA DESCONECTADA', N = 'NEONBOY';
export const ESCAPE_BRIEFING = [
  { speaker: D, text: 'Tenemos todo listo. Pero una vez que despeguemos, la Red va a detectarnos.' },
  { speaker: N, text: 'Despu\u00e9s de enfrentar demonios, robots y monstruos, no me va a asustar un control de tr\u00e1nsito.' },
  { speaker: D, text: 'Esto no es un control de tr\u00e1nsito.' },
  { speaker: N, text: 'Bueno... Entonces espero que este Fuego tenga buenos frenos.' },
];
// Non-modal timed captions; simulation continues, captions sit outside the road.
export const ESCAPE_CAPTIONS = [
  [0, N, '\u00a1Arranc\u00f3! \u00a1Cincuenta a\u00f1os despu\u00e9s y el Fuego sigue dando batalla!'],
  [5, D, 'Sujetate. Vamos a salir del per\u00edmetro de la Red.'],
  [10, N, '\u00bfEsta cosa tiene cintur\u00f3n de seguridad?'],
  [15, D, 'Tiene estabilizaci\u00f3n gravitacional.'],
  [19, N, '\u00a1Eso no responde mi pregunta!'],
  [23, D, '\u00a1Nos detectaron!'], [26, N, '\u00bfEn serio? \u00a1Si apenas levantamos un metro del suelo!'],
  [31, D, '\u00a1Cuidado con la barrera!'], [35, N, '\u00a1La estoy viendo! \u00a1No hace falta que me grites!'],
  [40, D, 'La Red controla todo el tr\u00e1fico a\u00e9reo.'], [45, N, 'Bueno... Hoy va a tener una excepci\u00f3n.'],
  [52, D, '\u00a1Tenemos drones detr\u00e1s!'], [57, N, '\u00a1Lo que me faltaba! \u00a1Multas de tr\u00e1nsito interdimensionales!'],
  [82, D, 'El sistema de navegaci\u00f3n est\u00e1 encontrando una salida.'],
  [88, N, '\u00a1M\u00e1s le vale! \u00a1Este Fuego no est\u00e1 para otra VTV!'],
  [110, D, 'Encontr\u00e9 algo... Una coordenada temporal.'], [115, N, '\u00bfA d\u00f3nde lleva?'],
  [119, D, 'Buenos Aires. A\u00f1o 1999.'], [123, N, '\u00a1Por fin una buena noticia!'],
  [132, D, 'Alguien manipul\u00f3 una grabaci\u00f3n de tu estudio.'], [138, N, '\u00bfQui\u00e9n?'],
  [142, D, 'El archivo est\u00e1 incompleto. Solo tenemos una coordenada y una marca temporal.'],
  [150, N, 'Entonces voy a tener que volver al principio.'],
  [164, D, 'Coordenadas fijadas. Buenos Aires, 1999.'], [168, N, '\u00a1Vamos a casa!'],
  [171, D, 'Hay algo que todav\u00eda no te dije...'], [175, N, '\u00a1Dec\u00edmelo despu\u00e9s, que estamos atravesando el tiempo!'],
];
export function escapeCaption(time) {
  const i = ESCAPE_CAPTIONS.findLastIndex(line => time >= line[0]);
  const line = ESCAPE_CAPTIONS[i];
  return line && time < line[0] + Math.min(8, Math.max(4, line[2].length / 13)) ? { id: i, speaker: line[1], text: line[2] } : null;
}
