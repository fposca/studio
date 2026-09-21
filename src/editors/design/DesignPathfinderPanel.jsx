import React from "react";
import { Combine, Diff, Minus, Scissors, SquaresIntersect } from "lucide-react";

const TOOLS = [
  { id: "unite", label: "Unir", tooltip: "Unir todas las formas", icon: Combine },
  { id: "subtract", label: "Menos frente", tooltip: "Restar las formas superiores", icon: Minus },
  { id: "intersect", label: "Intersecar", tooltip: "Conservar solamente la superposicion", icon: SquaresIntersect },
  { id: "exclude", label: "Excluir", tooltip: "Eliminar la zona superpuesta", icon: Diff },
  { id: "divide", label: "Dividir", tooltip: "Cortar la superposicion en regiones independientes", icon: Scissors }
];

export default function DesignPathfinderPanel({ onApply, selectionCount }) {
  return (
    <section className="design-pathfinder">
      <div className="design-pathfinder-heading"><h3>Pathfinder</h3><span>{selectionCount} seleccionadas</span></div>
      <div className="design-pathfinder-tools">
        {TOOLS.map(({ icon: Icon, id, label, tooltip }) => (
          <button data-tooltip={tooltip} disabled={selectionCount < 2 || (id === "divide" && selectionCount !== 2)} key={id} onClick={() => onApply(id)} type="button">
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
