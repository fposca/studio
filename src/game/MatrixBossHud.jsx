import React from "react";
import { MATRIX_HEALTH, MATRIX_BOSS_PHASE } from "./matrixQuest.js";
import "./matrix.css";

export default function MatrixBossHud({ progress, status, hudRef }) {
  if (!progress.bossStarted || progress.bossDefeated) return null;
  const max = MATRIX_HEALTH.boss;
  const health = Math.max(0, Math.min(max, progress.bossHealth));
  const percent = Math.round(health / max * 100);
  const extraNodes = health <= MATRIX_BOSS_PHASE.nodes && !progress.bossNodes.every(Boolean);
  const needsVision = health <= MATRIX_BOSS_PHASE.unstable && !progress.visionActive;
  const vulnerable = Boolean(status?.shieldOpen);
  const cue = extraNodes ? `N\u00daCLEOS ${progress.bossNodes.filter(Boolean).length}/3 \u00b7 EXTRA`
    : needsVision ? "C: VISI\u00d3N DEL SUELO" : vulnerable ? "ESCUDO ABIERTO \u00b7 x2" : "ESCUDO CERRADO \u00b7 x1";

  return <section ref={hudRef} className={"matrix-boss-hud" + (vulnerable ? " is-vulnerable" : "")}
    aria-label="Vida de Neon Evil" data-critical={health <= MATRIX_BOSS_PHASE.nodes}>
    <div className="matrix-boss-heading">
      <strong>NEON EVIL</strong><span>{percent}%</span>
    </div>
    <div className="matrix-boss-health" role="progressbar" aria-label={"Energ\u00eda de Neon Evil"}
      aria-valuemin={0} aria-valuemax={max} aria-valuenow={health} aria-valuetext={`${health} de ${max}, ${percent}%`}
      style={{ "--boss-segment": `${100 / max}%` }}>
      <span className="matrix-boss-health-fill" style={{ width: `${health / max * 100}%` }} />
    </div>
    <div className="matrix-boss-state"><span>{health}/{max} VIDA</span><span>{cue}</span></div>
  </section>;
}
