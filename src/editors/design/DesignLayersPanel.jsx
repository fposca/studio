import React from "react";
import { ChevronDown, ChevronUp, Circle, Eye, EyeOff, GripVertical, Lock, Minus, PenTool, Square, Type, Unlock, Wand2 } from "lucide-react";

const TYPE_LABELS = { circle: "Circulo", curve: "Curva", line: "Linea", path: "Trazado", rect: "Rectangulo", star: "Estrella", svgPath: "Forma combinada", text: "Texto" };
const TYPE_ICONS = { circle: Circle, curve: Wand2, line: Minus, path: PenTool, rect: Square, star: Wand2, svgPath: PenTool, text: Type };

export default function DesignLayersPanel({ elements, onMove, onRename, onSelect, onToggleLocked, onToggleVisible, selectedId, selectedIds = [] }) {
  return (
    <aside className="design-layers" aria-label="Capas del diseno">
      <div className="design-layers-heading"><span>DOCUMENTO</span><strong>Capas</strong><small>{elements.length}</small></div>
      <div className="design-layer-list">
        {[...elements].reverse().map((item) => {
          const Icon = TYPE_ICONS[item.type] || Square;
          const index = elements.findIndex((element) => element.id === item.id);
          return (
            <div className={`design-layer-row ${selectedIds.includes(item.id) ? "active" : ""} ${item.visible === false ? "is-hidden" : ""}`} key={item.id}>
              <GripVertical className="design-layer-grip" size={14} />
              <button className="design-layer-main" onClick={(event) => onSelect(item.id, event.shiftKey)} type="button">
                <Icon size={15} />
                <span>{item.name || TYPE_LABELS[item.type] || "Elemento"}</span>
              </button>
              <button data-tooltip={item.visible === false ? "Mostrar capa" : "Ocultar capa"} onClick={() => onToggleVisible(item.id)} type="button">{item.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button data-tooltip={item.locked ? "Desbloquear capa" : "Bloquear capa"} onClick={() => onToggleLocked(item.id)} type="button">{item.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
              <div className="design-layer-order">
                <button data-tooltip="Subir capa" disabled={index === elements.length - 1} onClick={() => onMove(item.id, 1)} type="button"><ChevronUp size={13} /></button>
                <button data-tooltip="Bajar capa" disabled={index === 0} onClick={() => onMove(item.id, -1)} type="button"><ChevronDown size={13} /></button>
              </div>
              {selectedId === item.id && <input aria-label="Nombre de capa" maxLength="60" onChange={(event) => onRename(item.id, event.target.value)} value={item.name || TYPE_LABELS[item.type] || "Elemento"} />}
            </div>
          );
        })}
        {!elements.length && <p className="design-layers-empty">Todavia no hay capas.</p>}
      </div>
    </aside>
  );
}
