// Accept the legacy key prefixes while giving every interaction the same layout.
export function interactionPromptText(label, subject = "") {
  const text = String(label || "Interactuar").replace(/^\s*(?:\[E\]|E\s*[·:])\s*/i, "").trim();
  const match = text.match(/^(hablar con|insistir con|examinar|recoger|ver|abrir|tomar|atender)\s+(.+)$/i);
  const verb = match ? match[1].replace(/ con$/i, "") : text;
  const action = /^(hablar|insistir|examinar|recoger|ver|abrir|tomar|atender)$/i.test(verb)
    ? verb[0].toUpperCase() + verb.slice(1).toLowerCase() : verb;
  return { action, detail: subject || match?.[2] || "", talking: /^(hablar|insistir)/i.test(action) };
}
