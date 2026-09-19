import React from "react";
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
  onExport,
  onFpsChange,
  onPlayingChange,
  onSeek,
  exporting,
  fps,
  playing,
  selectedName
}) {
  const markers = [
    ...keyframes.map((keyframe) => ({ ...keyframe, kind: "object", left: `${(keyframe.time / duration) * 100}%` })),
    ...cameraKeyframes.map((keyframe) => ({ ...keyframe, kind: "camera", left: `${(keyframe.time / duration) * 100}%` }))
  ];

  return (
    <section className="three-animation" aria-label="Animacion 3D">
      <div className="three-animation-heading">
        <strong>Animacion</strong>
        <span>{selectedName || "Selecciona un objeto"}</span>
      </div>
      <div className="three-animation-controls">
        <button data-tooltip={playing ? "Pausar" : "Reproducir"} onClick={() => onPlayingChange(!playing)} type="button">{playing ? <Pause size={17} /> : <Play size={17} />}</button>
        <button data-tooltip="Volver al inicio" onClick={() => onSeek(0)} type="button"><RotateCcw size={17} /></button>
        <button disabled={!selectedName} onClick={onAddKeyframe} type="button"><Diamond size={16} /> Keyframe</button>
        <button disabled={!keyframes.length} data-tooltip="Borrar animacion del objeto" onClick={onClear} type="button"><Trash2 size={16} /></button>
        <button data-tooltip="Keyframe de camara" onClick={onAddCameraKeyframe} type="button"><Camera size={16} /></button>
        <button disabled={!cameraKeyframes.length} data-tooltip="Borrar animacion de camara" onClick={onClearCamera} type="button"><CameraOff size={16} /></button>
      </div>
      <div className="three-animation-timeline">
        <div className="three-animation-markers">
          {markers.map((marker) => <i className={marker.kind === "camera" ? "is-camera" : ""} key={marker.id} style={{ left: marker.left }} title={`${marker.kind === "camera" ? "Camara" : "Objeto"} ${marker.time.toFixed(2)} s`} />)}
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
