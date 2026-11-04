export const JUDGE_MAX_HEALTH = 7;
export const JUDGE_FURY_HEALTH = 3;

// The second phase trades recovery time for pressure. All attacks retain a
// visible windup, and the player's three hearts/invulnerability stay intact.
export function judgeCombatTuning(health) {
  return health <= JUDGE_FURY_HEALTH
    ? { attackInterval: .88, attackSpeed: 1.5, orbSpeed: 5.3, orbWindup: .6, waveWindup: 1, waveRadius: 3, chaseSpeed: 1.85, vanishTime: .36 }
    : { attackInterval: 1.15, attackSpeed: 1.25, orbSpeed: 4.4, orbWindup: .68, waveWindup: 1.1, waveRadius: 2.65, chaseSpeed: 1.35, vanishTime: .5 };
}

export const JUDGE_QUESTIONS = Object.freeze([
  { title: "EL PODER", prompt: "Decime, mortal... ¿qué convierte realmente a alguien en poderoso?", options: ["Dominar a los demás.", "Dominarse a sí mismo.", "Conseguir que todos lo teman."], preferred: 1, correct: "El dominio propio... Qué respuesta tan irritantemente sensata.", wrong: "¡Ja, ja, ja! Confundís el poder con la necesidad de controlar. Típico de los mortales." },
  { title: "EL MIEDO", prompt: "¿Qué es el verdadero valor?", options: ["No sentir miedo jamás.", "Enfrentar el miedo aunque puedas perder.", "Hacer que los demás tengan miedo."], preferred: 1, correct: "¡Maldita sea! Los valientes siempre arruinan mis mejores amenazas.", wrong: "¡Qué decepción! Hasta mis sombras saben más sobre el miedo que vos." },
  { title: "LA LIBERTAD", prompt: "¿Cuándo es verdaderamente libre un ser?", options: ["Cuando puede hacer cualquier cosa sin consecuencias.", "Cuando nadie le dice qué pensar.", "Cuando puede elegir y hacerse responsable."], preferred: 2, correct: "Responsabilidad... ¡Qué palabra desagradable! Por eso prefiero los contratos con letra chica.", wrong: "¡Ja! La libertad sin responsabilidad es una jaula que uno mismo construye." },
  { title: "LA OSCURIDAD", prompt: "Si todos llevan oscuridad dentro... ¿qué distingue a una buena persona?", options: ["No haber cometido nunca un error.", "Reconocer sus errores y tratar de hacer el bien.", "Ocultar sus defectos ante los demás."], preferred: 1, correct: "¿Redención? ¡Otra de esas ideas que me complican el trabajo!", wrong: "¡Ja, ja, ja! Pretender ser perfecto... Esa mentira siempre me ha resultado útil." },
  { title: "EL SENTIDO DE LA VIDA", prompt: "Última pregunta, NeonBoy... Si todo lo que construís algún día desaparece, ¿para qué crear algo?", options: ["Para alcanzar la fama.", "Porque crear le da sentido a nuestra existencia.", "Para demostrar que somos superiores."], preferred: 1, correct: "Crear... incluso sabiendo que todo termina. Quizás los humanos no sean tan inútiles después de todo.", wrong: "¡Qué existencia tan pequeña! Vivir para impresionar a otros... Casi me das lástima." },
]);

export function judgeAnswer(questionIndex, optionIndex) {
  const question = JUDGE_QUESTIONS[questionIndex];
  if (!question || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 2) return null;
  const correct = optionIndex === question.preferred;
  return { correct, reaction: correct ? question.correct : question.wrong };
}

export function judgeHit(health) {
  return health > 0 ? Math.max(0, health - 1) : null;
}
