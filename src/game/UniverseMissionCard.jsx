import React, { useId } from "react";
import { AudioLines, CassetteTape, Check, ChevronDown, ChevronRight, Radio, Ticket } from "lucide-react";
import "./universeMissionCard.css";

const ICONS = { signal: Radio, tape: CassetteTape, show: Ticket, sound: AudioLines };

export default function UniverseMissionCard({
  title, objective, description, details = [], kind = "signal", complete = false, className = "", label,
  expanded = false, onToggle, footer,
}) {
  const Icon = ICONS[kind] || Radio;
  const metadata = details.filter(Boolean);
  const contentId = useId();
  const header = <div className="universe-mission-card__header">
    <div className="universe-mission-card__icon" aria-hidden="true"><Icon size={19} strokeWidth={1.6} /></div>
    <div className="universe-mission-card__heading">
      <div className="universe-mission-card__status">
        {complete ? <Check size={11} strokeWidth={2.5} aria-hidden="true" /> : <i aria-hidden="true" />}
        {complete ? "COMPLETADA" : "MISI\u00d3N EN CURSO"}
      </div>
      <h3>{title}</h3>
    </div>
  </div>;
  const content = <>
    {description && <p className="universe-mission-card__description">{description}</p>}
    {objective && <div className="universe-mission-card__objective">
      <ChevronRight size={15} aria-hidden="true" /><p>{objective}</p>
    </div>}
    {metadata.length > 0 && <div className="universe-mission-card__meta">
      {metadata.map((detail) => <span key={detail}>{detail}</span>)}
    </div>}
    {footer && <div className="universe-mission-card__footer">{footer}</div>}
  </>;
  const collapsible = typeof onToggle === "function";
  return <aside className={"universe-mission-card " + className + (complete ? " is-complete" : "") + (collapsible ? " is-collapsible" : "") + (expanded ? " is-expanded" : "")}
    role={collapsible ? undefined : "status"} aria-label={label || "Misi\u00f3n " + title}>
    {collapsible
      ? <button type="button" className="universe-mission-card__toggle" aria-expanded={expanded}
          aria-controls={contentId} onClick={onToggle}>{header}<ChevronDown className="universe-mission-card__expand-icon" size={17} aria-hidden="true" /></button>
      : header}
    {collapsible ? <div id={contentId} className="universe-mission-card__content" hidden={!expanded}>{content}</div> : content}
  </aside>;
}
