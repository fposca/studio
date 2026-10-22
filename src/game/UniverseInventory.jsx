import React, { useEffect, useRef, useState } from "react";
import { Archive, Backpack, CassetteTape, Coins, Disc3, IdCard, Ticket, X } from "lucide-react";
import { INVENTORY_CATEGORIES } from "./universeInventory.js";
import "./universeInventory.css";

const ICONS = {
  tape: CassetteTape, master: Disc3, badge: IdCard,
  "studio-token": Ticket, coin: Coins, archive: Archive,
};
const TYPE_LABELS = {
  mission: "OBJETO DE MISIÓN", access: "ACCESO", collectible: "COLECCIONABLE",
};

function ItemIcon({ item, size = 28 }) {
  const Icon = ICONS[item.icon] || Backpack;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}

export default function UniverseInventory({ items, onClose, resolveAction, onAction }) {
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  const visible = category === "all" ? items : items.filter((item) => item.category === category);
  const selected = visible.find((item) => item.id === selectedId) || visible[0] || null;
  const action = selected ? resolveAction?.(selected) : null;

  return <div className="universe-inventory-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="universe-inventory" role="dialog" aria-modal="true" aria-label="Inventario — NeonBoy">
      <header className="universe-inventory-header">
        <div className="universe-inventory-title"><Backpack size={29} aria-hidden="true" />
          <div><small>NEONBOY UNIVERSE · 1999</small><h2>INVENTARIO <em>— NEONBOY</em></h2></div>
        </div>
        <button type="button" ref={closeRef} className="universe-inventory-close" onClick={onClose} aria-label="Cerrar inventario"><X size={21} /></button>
      </header>
      <nav className="universe-inventory-categories" aria-label="Categorías del inventario">
        {INVENTORY_CATEGORIES.map((entry) => <button type="button" key={entry.id}
          aria-pressed={category === entry.id} onClick={() => { setCategory(entry.id); setSelectedId(null); }}>
          {entry.label}<span>{entry.id === "all" ? items.length : items.filter((item) => item.category === entry.id).length}</span>
        </button>)}
      </nav>
      <div className="universe-inventory-body">
        <div className="universe-inventory-list" aria-label="Objetos obtenidos">
          {visible.length ? <div className="universe-inventory-grid">{visible.map((item) => <button type="button" key={item.id}
            className={selected?.id === item.id ? "is-selected" : ""} aria-pressed={selected?.id === item.id}
            aria-label={`${item.name}, ${item.statusLabel}`} onClick={() => setSelectedId(item.id)}>
            <span className="universe-inventory-item-icon"><ItemIcon item={item} /></span>
            <strong>{item.name}</strong>
            <small>{item.stackable ? `${item.quantity}${item.capacity ? ` / ${item.capacity}` : ""}` : item.statusLabel}</small>
          </button>)}</div> : <div className="universe-inventory-empty"><Backpack size={36} strokeWidth={1.4} />
            <strong>AÚN NO HAY OBJETOS EN ESTA SECCIÓN</strong>
            <span>Explorá los escenarios y hablá con los personajes para encontrarlos.</span>
          </div>}
        </div>
        <aside className="universe-inventory-detail" aria-live="polite">
          {selected ? <>
            <div className="universe-inventory-detail-icon"><ItemIcon item={selected} size={53} /></div>
            <small>{TYPE_LABELS[selected.category]}{selected.mission ? ` · ${selected.mission}` : ""}</small>
            <h3>{selected.name}</h3>
            <p>{selected.description}</p>
            <dl>
              <div><dt>ESTADO</dt><dd>{selected.statusLabel}</dd></div>
              {selected.stackable && <div><dt>CANTIDAD</dt><dd>{selected.quantity}{selected.capacity ? ` / ${selected.capacity}` : ""}</dd></div>}
            </dl>
            {selected.note && <p className="universe-inventory-note">{selected.note}</p>}
            {action && <button type="button" className="universe-inventory-action" onClick={() => onAction(action.id)}>{action.label}</button>}
          </> : <p>Seleccioná un objeto para examinarlo.</p>}
        </aside>
      </div>
      <footer className="universe-inventory-footer"><span>LOS OBJETOS ENTREGADOS QUEDAN EN EL HISTORIAL</span><span>ESC · CERRAR</span></footer>
    </section>
  </div>;
}
