import React, { useState } from "react";
import { STUDIO_ASSETS, resetStudioAssetTransforms, saveStudioAssetTransforms } from "./studioAssets.js";

const axes = ["X", "Y", "Z"];
const clone = (value) => JSON.parse(JSON.stringify(value));

export default function RecordingStudioDevPanel({ transforms, onChange }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("console");
  const [notice, setNotice] = useState("");
  const current = transforms[selected];

  function edit(field, index, raw) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const next = clone(transforms);
    if (field === "scale") next[selected].scale = Math.max(0.05, Math.min(value, 5));
    else next[selected][field][index] = value;
    onChange(next);
    setNotice("Cambios sin guardar");
  }

  function save() {
    try { saveStudioAssetTransforms(transforms); setNotice("Guardado en este navegador"); }
    catch { setNotice("No se pudo guardar en este navegador"); }
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify(transforms, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "studioAssetTransforms.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("JSON descargado: reemplazá el archivo de configuración del proyecto");
  }

  async function copy() {
    try { await navigator.clipboard.writeText(JSON.stringify(transforms, null, 2)); setNotice("Configuración copiada"); }
    catch { setNotice("No se pudo copiar; usá Descargar JSON"); }
  }

  function reset() {
    onChange(resetStudioAssetTransforms());
    setNotice("Valores originales restaurados");
  }

  return <aside className={"studio-dev-panel" + (open ? " is-open" : "")} aria-label="Ajustar modelos del estudio">
    <button type="button" className="studio-dev-toggle" onClick={() => setOpen(!open)}>{open ? "Cerrar editor" : "Ajustar modelos"}</button>
    {open && <div className="studio-dev-content">
      <strong>MODELOS · DESARROLLO</strong>
      <label>Objeto<select value={selected} onChange={(event) => setSelected(event.target.value)}>{STUDIO_ASSETS.map((asset) => <option key={asset.id} value={asset.id}>{asset.label}</option>)}</select></label>
      {[["position", "Posición", 0.1], ["rotation", "Rotación °", 5]].map(([field, label, step]) => <fieldset key={field}>
        <legend>{label}</legend>
        {axes.map((axis, index) => <label key={axis}>{axis}<input type="number" step={step} value={current[field][index]} onChange={(event) => edit(field, index, event.target.value)} /></label>)}
      </fieldset>)}
      <label>Escala<input type="number" min="0.05" max="5" step="0.05" value={current.scale} onChange={(event) => edit("scale", 0, event.target.value)} /></label>
      <div className="studio-dev-actions">
        <button type="button" onClick={save}>Guardar aquí</button>
        <button type="button" onClick={copy}>Copiar JSON</button>
        <button type="button" onClick={exportConfig}>Descargar JSON</button>
        <button type="button" onClick={reset}>Restablecer</button>
      </div>
      <p role="status">{notice || "Los cambios se ven al instante. Descargar JSON fija los valores en el proyecto al reemplazar studioAssetTransforms.json."}</p>
    </div>}
  </aside>;
}
