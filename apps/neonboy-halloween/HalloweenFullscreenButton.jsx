import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeFullscreen = registerPlugin("NeonboyFullscreen");
const nativeAndroid = Capacitor.getPlatform() === "android";

export default function HalloweenFullscreenButton({ className = "" }) {
  const [enabled, setEnabled] = useState(() => !nativeAndroid && Boolean(document.fullscreenElement));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (nativeAndroid) {
      let mounted = true;
      NativeFullscreen.getState().then(({ enabled: current }) => {
        if (mounted) setEnabled(Boolean(current));
      }).catch(() => {});
      return () => { mounted = false; };
    }
    const sync = () => setEnabled(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  if (!nativeAndroid && !document.fullscreenEnabled) return null;
  const label = enabled ? "Salir de pantalla completa" : "Maximizar pantalla";
  const toggle = async () => {
    setBusy(true);
    try {
      if (nativeAndroid) {
        const result = await NativeFullscreen.setEnabled({ enabled: !enabled });
        setEnabled(Boolean(result.enabled));
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return <button type="button" className={`halloween-fullscreen-button ${className}`} title={label} aria-label={label}
    aria-pressed={enabled} disabled={busy} onClick={toggle}>
    {enabled ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    <span>{failed ? "NO DISPONIBLE" : enabled ? "RESTAURAR" : "PANTALLA COMPLETA"}</span>
  </button>;
}
