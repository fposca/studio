import React, { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { LEVELS } from "./gameLevels.js";
import "./gameLevelIntro.css";

export default function GameLevelIntro({ level, name, onComplete }) {
  const number = String(level).padStart(2, "0");
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onComplete, reducedMotion ? 1400 : 3600);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return <div className="neon-game-level-intro" data-variant={(level - 1) % 4}
    role="dialog" aria-modal="true" aria-labelledby="neon-level-heading" aria-describedby="neon-level-name">
    <div className="neon-level-art" aria-hidden="true">
      <div className="neon-level-grid" />
      <div className="neon-level-plane neon-level-plane-main" />
      <div className="neon-level-plane neon-level-plane-gold" />
      <div className="neon-level-disc" />
      <div className="neon-level-steps"><i /><i /><i /></div>
      <div className="neon-level-ribbon"><span>NEONBOY / NIVEL {number} / NEONBOY / NIVEL {number}</span></div>
    </div>
    <header className="neon-level-header" aria-hidden="true">
      <span className="neon-level-brand"><i /> NEONBOY</span>
      <span>AVENTURA / {number}</span>
    </header>
    <div className="neon-level-composition">
      <div className="neon-level-copy">
        <span className="neon-level-kicker" aria-hidden="true">UNA NUEVA ETAPA</span>
        <h2 id="neon-level-heading" aria-label={`Nivel ${level}`}><span aria-hidden="true">NIVEL</span></h2>
        <div className="neon-level-name"><i aria-hidden="true" /><p id="neon-level-name">{name}</p></div>
      </div>
      <span className="neon-level-number" aria-hidden="true">{number}</span>
    </div>
    <footer className="neon-level-footer">
      <div className="neon-level-index" aria-hidden="true"><span>{number} / {String(LEVELS.length).padStart(2, "0")}</span><div><i /></div></div>
      <button type="button" onClick={onComplete}>Omitir intro <ArrowUpRight size={17} aria-hidden="true" /></button>
    </footer>
  </div>;
}
