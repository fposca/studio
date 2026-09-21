import React from "react";
import { Check, Grid3X3, Magnet, Maximize2, MousePointer2, Pencil, PenTool, ZoomIn, ZoomOut } from "lucide-react";

export default function DesignViewportControls({ drawingPath, gridEnabled, gridSize, mode, onFinishPath, onFit, onGridChange, onGridSizeChange, onModeChange, onSnapChange, onZoomChange, snapEnabled, zoom }) {
  return (
    <div className="design-viewport-controls">
      <button className={mode === "select" ? "active" : ""} data-tooltip="Seleccionar" onClick={() => onModeChange("select")} type="button"><MousePointer2 size={15} /></button>
      <button className={mode === "pencil" ? "active" : ""} data-tooltip="Lapiz: mantené apretado y dibujá libremente" onClick={() => onModeChange("pencil")} type="button"><Pencil size={17} /></button>
      <button className={mode === "pen" ? "active" : ""} data-tooltip="Pluma: clic para nodo, arrastrá para curvar" onClick={() => onModeChange("pen")} type="button"><PenTool size={17} /></button>
      {drawingPath && <button className="design-finish-path" data-tooltip="Finalizar trazado" onClick={onFinishPath} type="button"><Check size={15} /></button>}
      <i />
      <button data-tooltip="Alejar" disabled={zoom <= 0.25} onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))} type="button"><ZoomOut size={17} /></button>
      <span>{Math.round(zoom * 100)}%</span>
      <button data-tooltip="Acercar" disabled={zoom >= 4} onClick={() => onZoomChange(Math.min(4, zoom + 0.25))} type="button"><ZoomIn size={17} /></button>
      <button data-tooltip="Ajustar lienzo" onClick={onFit} type="button"><Maximize2 size={15} /></button>
      <i />
      <button className={gridEnabled ? "active" : ""} data-tooltip="Mostrar cuadricula" onClick={() => onGridChange(!gridEnabled)} type="button"><Grid3X3 size={15} /></button>
      <input aria-label="Tamano de cuadricula" max="200" min="2" onChange={(event) => onGridSizeChange(Math.max(2, Number(event.target.value) || 20))} type="number" value={gridSize} />
      <button className={snapEnabled ? "active" : ""} data-tooltip="Ajustar a cuadricula y objetos" onClick={() => onSnapChange(!snapEnabled)} type="button"><Magnet size={15} /></button>
    </div>
  );
}
