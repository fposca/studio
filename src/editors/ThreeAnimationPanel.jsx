import React, { useEffect, useState } from "react";
import { Camera, CameraOff, Copy, Diamond, Film, Loader2, Music, Pause, Play, Plus, RotateCcw, Square, Trash2, Upload } from "lucide-react";

export default function ThreeAnimationPanel({
  animationLoop,
  cameraFollow,
  cameraShake,
  currentTime,
  cameraKeyframes,
  duration,
  keyframes,
  onAddKeyframe,
  onAddCameraKeyframe,
  onAudioImport,
  onAnimationLoopChange,
  onAutoDirect,
  onBeatDirect,
  onClear,
  onClearCamera,
  onCameraFollowChange,
  onCameraShakeChange,
  onDurationChange,
  onDeleteMarker,
  onDuplicateMarker,
  onUpdateMarker,
  onExport,
  onFreezeMotionChange,
  onFreezeMotionAdd,
  onFreezeMotionDelete,
  onFpsChange,
  onPlayingChange,
  onRemoveAudio,
  onSeek,
  onSlowMotionChange,
  onStop,
  exporting,
  fps,
  freezeMotion,
  playing,
  soundtrack,
  slowMotion,
  selectedName
}) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedFreeze, setSelectedFreeze] = useState(null);
  const [directorPreset, setDirectorPreset] = useState("hollywood");
  const [directorTransition, setDirectorTransition] = useState("cinematic");
  const [exportFormat, setExportFormat] = useState("h264");
  const markers = [
    ...keyframes.map((keyframe) => ({ ...keyframe, kind: "object", left: `${(keyframe.time / duration) * 100}%` })),
    ...cameraKeyframes.map((keyframe) => ({ ...keyframe, kind: "camera", left: `${(keyframe.time / duration) * 100}%` }))
  ];
  const cameraClips = [...cameraKeyframes]
    .sort((a, b) => a.time - b.time)
    .map((keyframe, index, ordered) => ({
      ...keyframe,
      end: ordered[index + 1]?.time ?? duration
    }));
  const activeMarker = selectedMarker
    ? markers.find((marker) => marker.id === selectedMarker.id && marker.kind === selectedMarker.kind)
    : null;
  const activeFreeze = freezeMotion.find((segment) => segment.id === selectedFreeze) || null;
  useEffect(() => {
    if (selectedMarker && !markers.some((marker) => marker.id === selectedMarker.id && marker.kind === selectedMarker.kind)) setSelectedMarker(null);
  }, [keyframes, cameraKeyframes, selectedMarker]);
  useEffect(() => {
    if (selectedFreeze && !freezeMotion.some((segment) => segment.id === selectedFreeze)) setSelectedFreeze(null);
  }, [freezeMotion, selectedFreeze]);

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
        <button className={playing ? "active" : ""} data-tooltip="Reproducir todas las animaciones" onClick={() => onPlayingChange(true)} type="button"><Play size={17} /></button>
        <button className={!playing ? "active" : ""} data-tooltip="Congelar todas las animaciones" onClick={() => onPlayingChange(false)} type="button"><Pause size={17} /></button>
        <button data-tooltip="Detener y volver al inicio" onClick={onStop} type="button"><Square size={16} /></button>
        <button data-tooltip="Volver al inicio" onClick={() => onSeek(0)} type="button"><RotateCcw size={17} /></button>
        <label className="three-loop-toggle"><input checked={animationLoop} onChange={(event) => onAnimationLoopChange(event.target.checked)} type="checkbox" /><RotateCcw size={15} /> Bucle</label>
        <button disabled={!selectedName} onClick={onAddKeyframe} type="button"><Diamond size={16} /> Keyframe</button>
        <button disabled={!keyframes.length} data-tooltip="Borrar animacion del objeto" onClick={onClear} type="button"><Trash2 size={16} /></button>
        <button data-tooltip="Guardar rotacion y vista de la escena" onClick={onAddCameraKeyframe} type="button"><Camera size={16} /> Vista {cameraKeyframes.length}</button>
        <div className="three-director-control">
          <select aria-label="Estilo de direccion automatica" onChange={(event) => setDirectorPreset(event.target.value)} value={directorPreset}>
            <option value="hollywood">Hollywood</option>
            <option value="dialogue">Dialogo</option>
            <option value="action">Accion</option>
            <option value="suspense">Suspenso</option>
            <option value="orbit">Orbita</option>
            <option value="matrix">Matrix / Bullet time</option>
            <option value="rail-lateral">Riel lateral</option>
            <option value="rail-arc">Riel en arco</option>
            <option value="rock">Rock</option>
            <option value="hard-rock">Hard Rock</option>
            <option value="metal">Metal</option>
          </select>
          <select aria-label="Transicion entre tomas" onChange={(event) => setDirectorTransition(event.target.value)} value={directorTransition}>
            <option value="cinematic">Cinematica</option>
            <option value="smooth">Suave</option>
            <option value="cut">Cortes</option>
          </select>
          <button disabled={!selectedName} data-tooltip="Crear secuencia cinematografica para la seleccion" onClick={() => onAutoDirect(directorPreset, directorTransition)} type="button"><Film size={16} /> Director</button>
        </div>
        <button disabled={!selectedMarker} data-tooltip="Eliminar marcador seleccionado (Delete)" onClick={deleteSelectedMarker} type="button"><Trash2 size={16} /></button>
        <button disabled={!cameraKeyframes.length} data-tooltip="Borrar animacion de vista" onClick={onClearCamera} type="button"><CameraOff size={16} /></button>
      </div>
      <div className="three-animation-timeline" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        const freezeId = event.dataTransfer.getData("application/x-neon-freeze");
        if (freezeId) {
          const bounds = event.currentTarget.getBoundingClientRect();
          const start = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration));
          const segment = freezeMotion.find((item) => item.id === freezeId);
          if (segment) onFreezeMotionChange(freezeId, { start, end: Math.min(duration, start + segment.end - segment.start) });
          setSelectedFreeze(freezeId);
          return;
        }
        const markerId = event.dataTransfer.getData("application/x-neon-camera-marker");
        if (!markerId) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const time = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration));
        onUpdateMarker("camera", markerId, { time });
        setSelectedMarker({ id: markerId, kind: "camera" });
      }}>
        <div className="three-animation-clips">
          {freezeMotion.map((segment, index) => <button
            className={`is-freeze ${selectedFreeze === segment.id ? "selected" : ""}`}
            draggable
            key={`freeze:${segment.id}`}
            onClick={() => { setSelectedFreeze(segment.id); setSelectedMarker(null); onSeek(segment.start); }}
            onDragStart={(event) => { event.dataTransfer.setData("application/x-neon-freeze", segment.id); event.dataTransfer.effectAllowed = "move"; }}
            style={{ left: `${(segment.start / duration) * 100}%`, width: `${Math.max(((segment.end - segment.start) / duration) * 100, 1.5)}%` }}
            title={`Freeze ${index + 1}: ${segment.start.toFixed(2)} s - ${segment.end.toFixed(2)} s`}
            type="button"
          ><Pause size={9} /><span>F{index + 1}</span></button>)}
          {cameraClips.map((clip, index) => <button
            className={selectedMarker?.id === clip.id && selectedMarker?.kind === "camera" ? "selected" : ""}
            draggable
            key={`clip:${clip.id}`}
            onClick={() => { setSelectedMarker({ id: clip.id, kind: "camera" }); onSeek(clip.time); }}
            onDragStart={(event) => { event.dataTransfer.setData("application/x-neon-camera-marker", clip.id); event.dataTransfer.effectAllowed = "move"; }}
            style={{ left: `${(clip.time / duration) * 100}%`, width: `${Math.max(((clip.end - clip.time) / duration) * 100, 1.5)}%` }}
            title={`Toma ${index + 1}: ${clip.time.toFixed(2)} s - ${clip.end.toFixed(2)} s`}
            type="button"
          ><Camera size={10} /><span>{index + 1}</span></button>)}
        </div>
        <div className="three-animation-markers">
          {soundtrack?.beats.filter((beat) => beat.time <= duration).map((beat, index) => <span className="is-beat" key={`beat:${index}`} style={{ left: `${(beat.time / duration) * 100}%` }} />)}
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
      <div className="three-animation-audio">
        <label className="three-audio-upload"><Upload size={15} /><span>{soundtrack?.name || "Cargar musica"}</span><input accept="audio/*,.mp3,.wav,.m4a,.ogg" onChange={(event) => { onAudioImport(event.target.files?.[0]); event.target.value = ""; }} type="file" /></label>
        {soundtrack && <>
          <button disabled={!selectedName || !soundtrack.beats.length} onClick={() => onBeatDirect(directorPreset, directorTransition)} type="button"><Music size={16} /> Al ritmo</button>
          <span>{soundtrack.beats.length} beats</span>
          <button data-tooltip="Quitar audio" onClick={onRemoveAudio} type="button"><Trash2 size={15} /></button>
        </>}
        <div className="three-camera-shake">
          <label className="three-check"><input checked={cameraShake.enabled} onChange={(event) => onCameraShakeChange({ enabled: event.target.checked })} type="checkbox" /><Camera size={15} /> Camara en mano</label>
          <label><span>Intensidad</span><input disabled={!cameraShake.enabled} max="1" min="0.05" onChange={(event) => onCameraShakeChange({ intensity: Number(event.target.value) })} step="0.05" type="range" value={cameraShake.intensity} /></label>
          <label><span>Velocidad</span><input disabled={!cameraShake.enabled} max="3" min="0.25" onChange={(event) => onCameraShakeChange({ speed: Number(event.target.value) })} step="0.05" type="range" value={cameraShake.speed} /></label>
        </div>
        <div className="three-camera-follow">
          <label className="three-check"><input checked={cameraFollow.enabled} disabled={!selectedName} onChange={(event) => onCameraFollowChange({ enabled: event.target.checked })} type="checkbox" /><Camera size={15} /> Seguir seleccion</label>
          <label><span>Fuerza</span><input disabled={!cameraFollow.enabled} max="1" min="0.1" onChange={(event) => onCameraFollowChange({ strength: Number(event.target.value) })} step="0.05" type="range" value={cameraFollow.strength} /></label>
        </div>
        <div className="three-slow-motion">
          <label className="three-check"><input checked={slowMotion.enabled} onChange={(event) => onSlowMotionChange({ enabled: event.target.checked })} type="checkbox" /><Pause size={15} /> Camara lenta</label>
          <label><span>Desde</span><input disabled={!slowMotion.enabled} max={duration} min="0" onChange={(event) => onSlowMotionChange({ start: event.target.value })} step="0.1" type="number" value={slowMotion.start} /></label>
          <label><span>Hasta</span><input disabled={!slowMotion.enabled} max={duration} min={slowMotion.start} onChange={(event) => onSlowMotionChange({ end: event.target.value })} step="0.1" type="number" value={slowMotion.end} /></label>
          <label><span>Velocidad</span><input disabled={!slowMotion.enabled} max="1" min="0.05" onChange={(event) => onSlowMotionChange({ speed: Number(event.target.value) })} step="0.05" type="range" value={slowMotion.speed} /></label>
        </div>
        <div className="three-slow-motion three-freeze-editor">
          <button onClick={() => setSelectedFreeze(onFreezeMotionAdd())} type="button"><Plus size={14} /> Freeze</button>
          {activeFreeze && <>
            <label><span>Desde</span><input max={duration} min="0" onChange={(event) => onFreezeMotionChange(activeFreeze.id, { start: event.target.value })} step="0.1" type="number" value={activeFreeze.start} /></label>
            <label><span>Hasta</span><input max={duration} min={activeFreeze.start} onChange={(event) => onFreezeMotionChange(activeFreeze.id, { end: event.target.value })} step="0.1" type="number" value={activeFreeze.end} /></label>
            <label><span>Retorno</span><select onChange={(event) => onFreezeMotionChange(activeFreeze.id, { resume: event.target.value })} value={activeFreeze.resume}><option value="quick">Rapido</option><option value="smooth">Suave</option></select></label>
            {activeFreeze.resume === "smooth" && <label><span>Aceleracion</span><input max="5" min="0.1" onChange={(event) => onFreezeMotionChange(activeFreeze.id, { resumeDuration: event.target.value })} step="0.1" type="number" value={activeFreeze.resumeDuration} /></label>}
            <button data-tooltip="Eliminar freeze" onClick={() => onFreezeMotionDelete(activeFreeze.id)} type="button"><Trash2 size={14} /></button>
          </>}
        </div>
        {activeMarker && <div className="three-shot-editor">
          <strong>{activeMarker.kind === "camera" ? "Toma seleccionada" : "Keyframe seleccionado"}</strong>
          <label><span>Inicio</span><input max={duration} min="0" onChange={(event) => onUpdateMarker(activeMarker.kind, activeMarker.id, { time: event.target.value })} step="0.1" type="number" value={activeMarker.time} /></label>
          {activeMarker.kind === "camera" && <label><span>Transicion</span><select onChange={(event) => onUpdateMarker("camera", activeMarker.id, { transition: event.target.value })} value={activeMarker.transition || "linear"}>
            <option value="cinematic">Cinematica</option>
            <option value="smooth">Suave</option>
            <option value="linear">Lineal</option>
            <option value="cut">Corte</option>
          </select></label>}
          <button data-tooltip="Duplicar toma" onClick={() => onDuplicateMarker(activeMarker.kind, activeMarker.id)} type="button"><Copy size={14} /></button>
        </div>}
      </div>
      <div className="three-animation-export">
        <select aria-label="Formato de video" disabled={exporting} onChange={(event) => setExportFormat(event.target.value)} value={exportFormat}>
          <option value="h264">MP4 H.264</option>
          <option value="webm">WebM</option>
        </select>
        <select aria-label="Fotogramas por segundo" disabled={exporting} onChange={(event) => onFpsChange(Number(event.target.value))} value={fps}>
          <option value="30">30 FPS</option>
          <option value="60">60 FPS</option>
        </select>
        <button disabled={exporting} onClick={() => onExport(exportFormat)} type="button">{exporting ? <Loader2 className="spin" size={16} /> : <Film size={16} />} {exporting ? "Procesando" : `Exportar ${exportFormat === "h264" ? "H.264" : "WebM"}`}</button>
      </div>
    </section>
  );
}
