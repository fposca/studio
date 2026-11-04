import React from "react";
import { AudioLines, CassetteTape, Check, ChevronRight, Radio, Ticket } from "lucide-react";
import "./universeMissionCard.css";

const ICONS = { signal: Radio, tape: CassetteTape, show: Ticket, sound: AudioLines };

export default function UniverseMissionCard({
  title, objective, description, details = [], kind = "signal", complete = false, className = "", label,
}) {
  const Icon = ICONS[kind] || Radio;
  const metadata = details.filter(Boolean);
  return <aside className={`universe-mission-card ${className}${complete ? " is-complete" : ""}`}
    role="status" aria-label={label || `Misión ${title}`}>
    <div className="universe-mission-card__header">
      <div className="universe-mission-card__icon" aria-hidden="true"><Icon size={19} strokeWidth={1.6} /></div>
      <div className="universe-mission-card__heading">
        <div className="universe-mission-card__status">
          {complete ? <Check size={11} strokeWidth={2.5} aria-hidden="true" /> : <i aria-hidden="true" />}
          {complete ? "COMPLETADA" : "MISIÓN EN CURSO"}
        </div>
        <h3>{title}</h3>
      </div>
    </div>
    {description && <p className="universe-mission-card__description">{description}</p>}
    {objective && <div className="universe-mission-card__objective">
      <ChevronRight size={15} aria-hidden="true" /><p>{objective}</p>
    </div>}
    {metadata.length > 0 && <div className="universe-mission-card__meta">
      {metadata.map((detail) => <span key={detail}>{detail}</span>)}
    </div>}
  </aside>;
}
