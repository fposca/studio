import React, { useEffect, useState } from "react";
import { Camera, CameraOff, Diamond, Film, Loader2, Pause, Play, RotateCcw, Trash2 } from "lucide-react";

export default function ThreeAnimationPanel({
  currentTime,
  cameraKeyframes,
  duration,
  keyframes,
  onAddKeyframe,
  onAddCameraKeyframe,
  onClear,
  onClearCamera,
  onDurationChange,
  onDeleteMarker,
  onExport,
  onFpsChange,
  onPlayingChange,
  onSeek,
  exporting,
  fps,
  playing,
  selectedName
}) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const markers = [
    ...keyframes.map((keyframe) => ({ ...keyframe, kind: "object", left: `${(keyframe.time / duration) * 100}%` })),
    ...cameraKeyframes.map((keyframe) => ({ ...keyframe, kind: "camera", left: `${(keyframe.time / duration) * 100}%` }))
  ];
  useEffect(() => {
    if (selectedMarker && !markers.some((marker) => marker.id === selectedMarker.id && marker.kind === selectedMarker.kind)) setSelectedMarker(null);
  }, [keyframes, cameraKeyframes, selectedMarker]);

  const deleteSelectedMarker = () => {
    if (!selectedMarker) return;
    onDeleteMarker(selectedMarker.kind, selectedMarker.id);
    setSelectedMarker(null);
  };

  return (
    <section className="three-animation" aria-label="Animacion 3D" onKeyDown={(event) => {
      if (event.key !== "Delete" || !selectedMarker) return;
      event.preventDefault();
      event.stopPropagation();
      deleteSelectedMarker();
    }}>
      <div className="three-animation-heading">
        <strong>Animacion</strong>
        <span>{selectedName || "Selecciona un objeto"}</span>
      </div>
      <div className="three-animation-controls">
        <button data-tooltip={playing ? "Pausar" : "Reproducir"} onClick={() => onPlayingChange(!playing)} type="button">{playing ? <Pause size={17} /> : <Play size={17} />}</button>
        <button data-tooltip="Volver al inicio" onClick={() => onSeek(0)} type="button"><RotateCcw size={17} /></button>
        <button disabled={!selectedName} onClick={onAddKeyframe} type="button"><Diamond size={16} /> Keyframe</button>
        <button disabled={!keyframes.length} data-tooltip="Borrar animacion del objeto" onClick={onClear} type="button"><Trash2 size={16} /></button>
        <button data-tooltip="Guardar rotacion y vista de la escena" onClick={onAddCameraKeyframe} type="button"><Camera size={16} /> Vista {cameraKeyframes.length}</button>
        <button disabled={!selectedMarker} data-tooltip="Eliminar marcador seleccionado (Delete)" onClick={deleteSelectedMarker} type="button"><Trash2 size={16} /></button>
        <button disabled={!cameraKeyframes.length} data-tooltip="Borrar animacion de vista" onClick={onClearCamera} type="button"><CameraOff size={16} /></button>
      </div>
      <div className="three-animation-timeline">
        <div className="three-animation-markers">
          {markers.map((marker) => <button
            aria-label={`${marker.kind === "camera" ? "Vista de escena" : "Keyframe de objeto"} en ${marker.time.toFixed(2)} segundos`}
            className={`${marker.kind === "camera" ? "is-camera" : ""} ${selectedMarker?.id === marker.id && selectedMarker?.kind === marker.kind ? "selected" : ""}`}
            key={`${marker.kind}:${marker.id}`}
            onClick={() => { setSelectedMarker({ id: marker.id, kind: marker.kind }); onSeek(marker.time); }}
            style={{ left: marker.left }}
            title={`${marker.kind === "camera" ? "Vista de escena" : "Objeto"} ${marker.time.toFixed(2)} s`}
            type="button"
          />)}
        </div>
        <input aria-label="Tiempo de animacion" max={duration} min="0" onChange={(event) => onSeek(Number(event.target.value))} step="0.01" type="range" value={currentTime} />
      </div>
      <div className="three-animation-time"><strong>{currentTime.toFixed(2)} s</strong><label>Duracion<input max="60" min="1" onChange={(event) => onDurationChange(Number(event.target.value))} step="1" type="number" value={duration} /></label></div>
      <div className="three-animation-export">
        <select aria-label="Fotogramas por segundo" disabled={exporting} onChange={(event) => onFpsChange(Number(event.target.value))} value={fps}>
          <option value="30">30 FPS</option>
          <option value="60">60 FPS</option>
        </select>
        <button disabled={exporting} onClick={onExport} type="button">{exporting ? <Loader2 className="spin" size={16} /> : <Film size={16} />} {exporting ? "Renderizando" : "Exportar WebM"}</button>
      </div>
    </section>
  );
}
