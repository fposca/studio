import React from "react";
import { FilePlus2, Monitor, Printer } from "lucide-react";

export const DESIGN_DOCUMENT_PRESETS = {
  a4: { label: "A4", unit: "mm", w: 210, h: 297 },
  a3: { label: "A3", unit: "mm", w: 297, h: 420 },
  fullhd: { label: "Full HD", unit: "px", w: 1920, h: 1080 },
  instagram: { label: "Post 1:1", unit: "px", w: 1080, h: 1080 },
  story: { label: "Historia 9:16", unit: "px", w: 1080, h: 1920 },
  social: { label: "Social 1.91:1", unit: "px", w: 1200, h: 628 }
};

export function documentPixelSize(settings) {
  const preset = DESIGN_DOCUMENT_PRESETS[settings.preset];
  const shortSide = Math.min(preset.w, preset.h);
  const longSide = Math.max(preset.w, preset.h);
  const width = settings.orientation === "landscape" ? longSide : shortSide;
  const height = settings.orientation === "landscape" ? shortSide : longSide;
  if (preset.unit === "px") return { w: width, h: height };
  return {
    w: Math.round((width / 25.4) * settings.dpi),
    h: Math.round((height / 25.4) * settings.dpi)
  };
}

export default function DesignDocumentPanel({ onChange, onCreate, settings }) {
  const print = DESIGN_DOCUMENT_PRESETS[settings.preset]?.unit === "mm";
  const size = documentPixelSize(settings);
  return (
    <section className="design-document-panel">
      <h3>Nuevo lienzo</h3>
      <div className="design-document-kind" role="group" aria-label="Tipo de documento">
        <button className={print ? "active" : ""} data-tooltip="Impresion" onClick={() => onChange({ ...settings, orientation: "portrait", preset: "a4" })} type="button"><Printer size={16} /></button>
        <button className={!print ? "active" : ""} data-tooltip="Pantalla y web" onClick={() => onChange({ ...settings, orientation: "landscape", preset: "fullhd", dpi: 72 })} type="button"><Monitor size={16} /></button>
      </div>
      <label>Formato
        <select value={settings.preset} onChange={(event) => onChange({ ...settings, preset: event.target.value })}>
          {Object.entries(DESIGN_DOCUMENT_PRESETS).filter(([, preset]) => (preset.unit === "mm") === print).map(([value, preset]) => <option key={value} value={value}>{preset.label}</option>)}
        </select>
      </label>
      <div className="field-grid">
        <label>Orientacion
          <select value={settings.orientation} onChange={(event) => onChange({ ...settings, orientation: event.target.value })}>
            <option value="portrait">Vertical</option>
            <option value="landscape">Horizontal</option>
          </select>
        </label>
        <label>DPI
          <select disabled={!print} value={print ? settings.dpi : 72} onChange={(event) => onChange({ ...settings, dpi: Number(event.target.value) })}>
            <option value="72">72</option>
            <option value="150">150</option>
            <option value="300">300</option>
          </select>
        </label>
      </div>
      <div className="design-document-size"><strong>{size.w} x {size.h} px</strong><span>{print ? `${settings.dpi} DPI` : "Web"}</span></div>
      <button className="primary-button" onClick={onCreate} type="button"><FilePlus2 size={16} /> Crear lienzo</button>
    </section>
  );
}
