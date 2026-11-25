import React, { useEffect, useRef, useState } from "react";
import { X, KeyRound, BatteryCharging, CircuitBoard, Route, Cloud, Bird } from "lucide-react";
import { FUEGO_COMPONENTS, countFuegoInstalled } from "./buenosAiresFuegoQuest.js";
import { FUEGO_ITEM_ICONS } from "./buenosAiresFuegoIcons.js";
import "./buenosAiresFuego.css";

const symbols = [{ id: "cielo", label: "CIELO", Icon: Cloud }, { id: "libertad", label: "LIBERTAD", Icon: Bird }, { id: "calle", label: "CALLE", Icon: Route }];
const titles = { vehicle: "RENAULT FUEGO", power: "ESTACI\u00d3N DE CARGA", navigation: "NAVEGACI\u00d3N INDEPENDIENTE" };
export default function BuenosAiresFuegoPanel({ kind, progress: p, onAction, onClose, onInventory }) {
  const panel = useRef(null), [hint, setHint] = useState("");
  useEffect(() => {
    const previous = document.activeElement;
    document.exitPointerLock?.(); panel.current?.querySelector("button")?.focus();
    return () => previous?.isConnected && previous.focus?.();
  }, []);
  const locked = countFuegoInstalled(p) !== 3 || !p.fuegoRecordShown;
  function keyDown(event) {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key !== "Tab") return;
    const buttons = [...panel.current.querySelectorAll("button:not(:disabled)")];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    event.stopPropagation();
  }
  return <div className="city-fuego-backdrop" onKeyDown={keyDown}>
    <section ref={panel} className="city-fuego-panel" role="dialog" aria-modal="true" aria-label={titles[kind]}>
      <header><div><small>EL &Uacute;LTIMO FUEGO / ACCESO LOCAL</small><h2>{titles[kind]}</h2></div>
        <button type="button" className="city-fuego-close" onClick={onClose} aria-label="Cerrar panel"><X size={22} /></button></header>
      {kind === "vehicle" && <>
        <p className="city-fuego-intro">SISTEMA DE VUELO <span>{p.fuegoPowered ? "OPERATIVO" : "SIN CONEXI\u00d3N A LA RED"}</span></p>
        <div className="city-fuego-components">{FUEGO_COMPONENTS.map((part, index) => {
          const installed = p[part.installedFlag], taken = p[part.takenFlag];
          const Icon = [KeyRound, BatteryCharging, CircuitBoard][index];
          return <article key={part.id} data-component={part.id}>
            <img src={FUEGO_ITEM_ICONS[part.id]} alt="" /><div><h3>{part.name}</h3>
              <p>{installed ? "INSTALADA" : taken ? "EN TU INVENTARIO" : "PENDIENTE"}</p></div>
            <button type="button" disabled={!taken || installed} onClick={() => onAction("fuego-install:" + part.id)}>
              <Icon size={16} />{installed ? "Instalada" : "Instalar"}</button>
          </article>;
        })}</div>
        <p className="city-fuego-help">Las piezas recuperadas permanecen en tu inventario. Instalalas para habilitar el vuelo independiente.</p>
        <div className="city-fuego-actions"><button type="button" onClick={onInventory}>Abrir inventario</button>
          <button type="button" className="city-fuego-primary" disabled={locked} onClick={() => onAction("fuego-power-on")}>
            {p.completed ? "Repetir la fuga" : "Iniciar sistema de vuelo"}</button></div>
        {p.fuegoPowered && <p role="status">VEH&Iacute;CULO NO REGISTRADO / La Red activ&oacute; un protocolo de intercepci&oacute;n. La ruta de fuga queda preparada.</p>}
      </>}
      {kind === "power" && <>
        <p className="city-fuego-intro">CELDA DE ALTA DENSIDAD <span>{p.fuegoPowerMaintenanceOpen ? "COMPARTIMIENTO ABIERTO" : "COMPARTIMIENTO BLOQUEADO"}</span></p>
        <p>La terminal solicita una identidad digital. Una inscripci&oacute;n bajo el lector indica:</p>
        <blockquote>ACCESO DE MANTENIMIENTO DISPONIBLE SIN CONEXI&Oacute;N</blockquote>
        {!p.fuegoPowerMaintenanceOpen && <div className="city-fuego-options">
          <button type="button" onClick={() => setHint("IDENTIDAD NO REGISTRADA. El acceso a la Red fue rechazado.")}>Presentar identificaci&oacute;n digital</button>
          <button type="button" onClick={() => setHint("LA DESCONECTADA: Us\u00e1 el puerto local. El mantenimiento sin conexi\u00f3n no necesita una identidad de la Red.")}>Pedir ayuda a la Desconectada</button>
          <button type="button" onClick={() => { setHint("Modo local habilitado. El compartimiento se abre."); onAction("fuego-power-maintenance"); }}>Acceso local &middot; mantenimiento</button>
        </div>}
        {p.fuegoPowerMaintenanceOpen && <div className="city-fuego-recovered"><img src={FUEGO_ITEM_ICONS.fuego_power_cell} alt="Celda de energ&#237;a" />
          <button type="button" className="city-fuego-primary" disabled={p.fuegoPowerCellTaken} onClick={() => onAction("fuego-power-take")}>{p.fuegoPowerCellTaken ? "Celda recuperada" : "Recoger celda de energ\u00eda"}</button></div>}
      </>}
      {kind === "navigation" && <>
        <p className="city-fuego-intro">ARCHIVO URBANO <span>{p.fuegoNavigationTerminalOpen ? "ACCESO AUTORIZADO" : "TRES S\u00cdMBOLOS REQUERIDOS"}</span></p>
        <p>La navegaci&oacute;n a&eacute;rea depende de la Red. Este m&oacute;dulo permite elegir una ruta propia.</p>
        <blockquote>La memoria de Corrientes conserva el orden. Busc&aacute; los tres archivos urbanos junto a sus carteles.</blockquote>
        {!p.fuegoNavigationTerminalOpen && <>
          <div className="city-fuego-code" aria-label="Secuencia introducida">{[0, 1, 2].map(index => <span key={index}>{p.fuegoNavigationSequence[index]?.toUpperCase() || "\u2014"}</span>)}</div>
          <div className="city-fuego-symbols">{symbols.map(({ id, label, Icon }) => <button type="button" key={id} onClick={() => {
            if (p.fuegoNavigationClues.length < 3) { setHint("Todav\u00eda faltan archivos por investigar en Corrientes."); return; }
            onAction("fuego-navigation-symbol:" + id);
            setHint("La terminal comprueba la secuencia. Si se borra, revis\u00e1 el orden de las pistas.");
          }}><Icon size={28} />{label}</button>)}</div>
          <p className="city-fuego-help">ARCHIVOS INVESTIGADOS {p.fuegoNavigationClues.length}/3. Los textos quedan anotados en el diario.</p>
        </>}
        {p.fuegoNavigationTerminalOpen && <div className="city-fuego-recovered"><img src={FUEGO_ITEM_ICONS.fuego_navigation_module} alt="M&#243;dulo de navegaci&#243;n" />
          <button type="button" className="city-fuego-primary" disabled={p.fuegoNavigationModuleTaken} onClick={() => onAction("fuego-navigation-take")}>{p.fuegoNavigationModuleTaken ? "M\u00f3dulo recuperado" : "Recoger m\u00f3dulo de navegaci\u00f3n"}</button></div>}
      </>}
      {hint && <p className="city-fuego-hint" role="status">{hint}</p>}
      <footer><span>BUENOS AIRES 2049</span><span>ESC &middot; CERRAR</span></footer>
    </section>
  </div>;
}
