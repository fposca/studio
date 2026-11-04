import React from "react";
import { Hand, MessageCircle } from "lucide-react";
import { interactionPromptText } from "./interactionPromptText.js";
import "./interactionPrompt.css";

export default function InteractionPrompt({ children, className = "", onClick, disabled, ...props }) {
  const label = React.Children.toArray(children).join("");
  const { action, detail, talking } = interactionPromptText(label);
  const Tag = onClick ? "button" : "div";
  const Icon = talking ? MessageCircle : Hand;
  return <Tag {...props} className={`neon-interaction-prompt ${className}`} onClick={onClick}
    type={onClick ? "button" : undefined} disabled={onClick ? disabled : undefined}
    role={onClick ? undefined : "status"} aria-live={onClick ? undefined : "polite"} aria-atomic={onClick ? undefined : true} aria-keyshortcuts="E">
    <kbd className="neon-interaction-key">E</kbd>
    <span className="neon-interaction-copy"><span className="neon-interaction-action">{action}</span>{detail && <span className="neon-interaction-detail">{detail}</span>}</span>
    <Icon className="neon-interaction-icon" size={18} strokeWidth={1.6} aria-hidden="true" />
  </Tag>;
}
