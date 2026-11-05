import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import HalloweenStoreApp from "./HalloweenStoreApp.jsx";
import HalloweenStartScreen from "./HalloweenStartScreen.jsx";
import { deleteHalloweenSave, readHalloweenSaves, writeHalloweenSave } from "./halloweenSaves.js";
import "./halloween.css";
import faviconUrl from "../../src/assets/neonboy-logo.png";

document.getElementById("halloween-favicon").href = faviconUrl;

function HalloweenExperience() {
  const [slots, setSlots] = useState(() => readHalloweenSaves());
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const refresh = () => setSlots(readHalloweenSaves());
  const onNew = (slot) => {
    try {
      const record = writeHalloweenSave(window.localStorage, slot, {});
      refresh();
      setError("");
      setSession({ slot, progress: record.progress, key: Date.now() });
    } catch {
      setError("No se pudo guardar en este dispositivo. Revisá el espacio disponible.");
    }
  };
  const onLoad = (slot) => {
    const record = readHalloweenSaves()[slot];
    if (!record) { refresh(); setError("Esa partida ya no está disponible."); return; }
    setError("");
    setSession({ slot, progress: record.progress, key: Date.now() });
  };
  const onDelete = (slot) => {
    try {
      deleteHalloweenSave(window.localStorage, slot);
      refresh();
      setError("");
      return true;
    } catch {
      setError("No se pudieron borrar los datos locales de esta partida.");
      return false;
    }
  };
  const onSave = (slot, progress) => {
    try {
      writeHalloweenSave(window.localStorage, slot, progress);
      refresh();
      setError("");
      return true;
    } catch {
      setError("No se pudo guardar la partida en este dispositivo.");
      return false;
    }
  };
  const onExit = () => { refresh(); setSession(null); };
  const onRetry = () => onLoad(session.slot);
  return session
    ? <HalloweenStoreApp key={session.key} initialSave={session.progress} saveSlot={session.slot}
        onSave={onSave} onExit={onExit} onRetry={onRetry} />
    : <HalloweenStartScreen slots={slots} onLoad={onLoad} onNew={onNew} onDelete={onDelete} error={error} />;
}
createRoot(document.getElementById("root")).render(<HalloweenExperience />);
