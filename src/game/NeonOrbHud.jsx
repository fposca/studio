import React from "react";
import { CircleDot } from "lucide-react";
import "./neonOrbHud.css";

export default function NeonOrbHud({ progress, status, onFire, onRecall, locked, label }) {
  if (!progress?.orbUnlocked) return null;
  const phase = status?.phase || "ready";
  const ready = phase === "ready";
  return <div className="neon-orb-hud" role="status" aria-label="Estado del Orbe Neon">
    <span className={"neon-orb-hud-icon" + (ready ? " is-ready" : "")}><CircleDot size={25} /></span>
    <div className="neon-orb-hud-copy"><strong>ORBE NEON</strong><small>{ready ? "LISTO" : phase === "cooldown" ? "RECARGANDO" : phase === "returning" ? "REGRESANDO" : "EN VUELO"}</small></div>
    <span className="neon-orb-hud-progress">{label || progress.orbNodes.filter(Boolean).length + "/3 NODOS"}</span>
    <button type="button" onClick={onFire} disabled={!ready || locked}>Lanzar <kbd>F</kbd></button>
    <button type="button" onClick={onRecall} disabled={ready || phase === "cooldown" || locked}>Recuperar <kbd>R</kbd></button>
    <span className="neon-orb-hud-help">Click izquierdo para lanzar</span>
  </div>;
}
