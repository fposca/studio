import React, { useState } from "react";
import { saveConcertMotion } from "./rockClubConcertMotion.js";
import { CONCERT_POSE_ACTORS, CONCERT_POSE_BONES, saveConcertPose } from "./rockClubConcertPose.js";
import { CONCERT_EDITABLES, defaultConcertTransform, saveConcertTransforms } from "./rockClubConcertSettings.js";

export const CLOSED_CONCERT_EDITOR = { open: false, selected: "neonboy", poseActor: "neonboy",
  poseBone: "LeftArm", poseEditing: false, gizmo: false, frozen: false, angle: 0, distance: 2.7, scrub: 0 };
export default function RockClubConcertEditor({ transforms, onChange, view, onViewChange, motion,
  recording, cursor, onStartRecording, onStopRecording, onCaptureFrame, onDurationChange,
  onTogglePlayback, onLoadFrame, onDeleteFrame, pose, onPoseChange, onPoseReset, availablePoseBones = [] }) {
  const [notice, setNotice] = useState("");
  const current = transforms[view.selected];
  const track = motion?.[view.selected];
  const poseActor = view.poseActor || view.selected;
  const poseBone = availablePoseBones.includes(view.poseBone) ? view.poseBone : availablePoseBones[0];
  const joint = pose?.[poseActor]?.[poseBone] || [0, 0, 0];
  const recordingThis = recording?.id === view.selected;
  const recordingTime = recordingThis ? Math.min(track?.duration || 8, Math.max(0, cursor - recording.start)) : 0;
  const setView = (patch) => {
    if (view.open && patch.open === false && recording) onStopRecording();
    onViewChange({ ...view, ...patch });
  };
  const edit = (field, index, raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const next = structuredClone(transforms);
    if (field === "scale") next[view.selected].scale = Math.max(0.4, Math.min(2, value));
    else next[view.selected][field][index] = Math.max(field === "rotation" ? -360 : -2, Math.min(field === "rotation" ? 360 : 2, value));
    onChange(next); setView({ poseEditing: false }); setNotice("Cambios sin guardar");
  };
  const save = () => {
    try { saveConcertTransforms(transforms); saveConcertMotion(motion); saveConcertPose(pose); setNotice("Ajustes guardados en este navegador."); }
    catch { setNotice("No se pudo guardar. Podés descargar el JSON."); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(transforms, null, 2)); setNotice("JSON copiado."); }
    catch { setNotice("No se pudo copiar. Usá Descargar JSON."); }
  };
  const download = (filename, value) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Reemplazá src/game/" + filename + " con el archivo descargado para fijar estos ajustes.");
  };
  return <aside className={"studio-dev-panel concert-dev-panel" + (view.open ? " is-open" : "")} aria-label="Ajustar instrumentos del recital">
    <button className="studio-dev-toggle" type="button" onClick={() => setView({ open: !view.open, frozen: !view.open })}>{view.open ? "Cerrar ajuste" : "Ajustar recital"}</button>
    {view.open && <div className="studio-dev-content">
      <strong>INSTRUMENTOS Y ASIENTO</strong>
      <label>M&uacute;sico<select value={view.selected} disabled={Boolean(recording)} onChange={(event) =>
        setView({ selected: event.target.value, poseActor: event.target.value, poseEditing: false, gizmo: false })}>
        {CONCERT_EDITABLES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
      </select></label>
      <button type="button" className="concert-freeze" aria-pressed={view.frozen} onClick={() => setView({ frozen: !view.frozen })}>{view.frozen ? "Reanudar pose y música" : "Congelar pose y música"}</button>
      <p>{view.selected === "lujan" ? "Desplazamiento respecto del asiento. Para mover el conjunto, usá el banco en Ajustar modelos." : "Ejes locales: X costado, Y hacia el mástil, Z hacia afuera. El anclaje y los ajustes siguen la cintura o ambas manos."}</p>
      {[ ["position", "Posición", 0.01], ["rotation", "Rotación (grados)", 1] ].map(([field, label, step]) => <fieldset key={field}>
        <legend>{label}</legend>{["X", "Y", "Z"].map((axis, index) => <label key={axis}>{axis}<input aria-label={`${label} ${axis}`} type="number" step={step} value={current[field][index]} onChange={(event) => edit(field, index, event.target.value)} /></label>)}
      </fieldset>)}
      <label>Escala<input type="number" min="0.4" max="2" step="0.01" value={current.scale} onChange={(event) => edit("scale", 0, event.target.value)} /></label>
      {current.anchor && <label>Anclaje de guitarra<select aria-label="Anclaje de guitarra" value={current.anchor}
        onChange={(event) => { onChange({ ...transforms, [view.selected]: { ...current, anchor: event.target.value } }); setNotice("Cambios sin guardar"); }}>
        <option value="waist">Cintura</option><option value="hands">Ambas manos</option>
      </select></label>}
      {current.fretHand && <label>Mano en el m&aacute;stil<select value={current.fretHand} onChange={(event) => { onChange({ ...transforms, [view.selected]: { ...current, fretHand: event.target.value } }); setNotice("Cambios sin guardar"); }}><option value="left">Izquierda</option><option value="right">Derecha</option></select></label>}
      <fieldset className="concert-pose-editor"><legend>Pose del personaje</legend>
        <p>Girá cada articulación sobre la animación actual. El marcador rosa muestra el hueso seleccionado.</p>
        <label>Personaje<select aria-label="Personaje de la pose" value={poseActor} disabled={Boolean(recording)}
          onChange={(event) => setView({ poseActor: event.target.value, poseBone: "LeftArm", poseEditing: true, gizmo: false })}>
          {CONCERT_POSE_ACTORS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select></label>
        <label>Articulación<select aria-label="Articulacion" value={poseBone || ""} disabled={!poseBone}
          onChange={(event) => setView({ poseBone: event.target.value, poseEditing: true })}>
          {CONCERT_POSE_BONES.filter((entry) => availablePoseBones.includes(entry.id)).map((entry) =>
            <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select></label>
        {poseBone ? ["X", "Y", "Z"].map((axis, index) => <div className="concert-pose-axis" key={axis}>
          <label>Rotación {axis}
            <input aria-label={"Rotacion hueso " + axis} type="range" min="-180" max="180" step="1"
              value={joint[index]} onChange={(event) => { onPoseChange(poseActor, poseBone, index, Number(event.target.value)); setView({ poseBone, poseEditing: true }); setNotice("Pose sin guardar"); }} />
          </label>
          <input aria-label={"Grados hueso " + axis} type="number" min="-180" max="180" step="1"
            value={joint[index]} onChange={(event) => { onPoseChange(poseActor, poseBone, index, Number(event.target.value)); setView({ poseBone, poseEditing: true }); setNotice("Pose sin guardar"); }} />
        </div>) : <p>El modelo de este personaje todavia no ofrece esos huesos.</p>}
        <div className="concert-motion-actions">
          <button type="button" disabled={!poseBone} aria-pressed={Boolean(view.gizmo)}
            onClick={() => setView({ poseEditing: true, poseBone, gizmo: !view.gizmo })}>
            {view.gizmo ? "Cerrar rotador" : "Rotar en escena"}
          </button>
          <button type="button" disabled={!poseBone || Boolean(recording)} onClick={() => onPoseReset(poseActor, poseBone)}>Restaurar articulación</button>
          <button type="button" disabled={Boolean(recording)} onClick={() => onPoseReset(poseActor)}>Restaurar personaje</button>
        </div>
        <button type="button" onClick={() => download("rockClubConcertPose.json", pose)}>Descargar poses</button>
      </fieldset>
      {current.anchor && <fieldset className="concert-motion-editor"><legend>Movimiento de guitarra</legend>
        <label>Duración del bucle (segundos)<input aria-label="Duración del movimiento" type="number" min="2" max="30" step="0.5"
          value={track?.duration || 8} disabled={Boolean(recording)} onChange={(event) => onDurationChange(view.selected, Number(event.target.value))} /></label>
        <div className="concert-motion-actions">
          {recordingThis ? <button type="button" onClick={onStopRecording}>Detener grabación</button>
            : <button type="button" disabled={Boolean(recording)} onClick={onStartRecording}>Grabar nueva toma</button>}
          <button type="button" disabled={Boolean(recording)} onClick={onTogglePlayback}>
            {track?.enabled ? "Pausar movimiento" : "Reproducir movimiento"}</button>
        </div>
        <p role="status">{recordingThis ? `Grabando ${recordingTime.toFixed(1)} / ${(track?.duration || 8).toFixed(1)} s. Mové los controles para capturar fotogramas.`
          : `${track?.keyframes?.length || 0} fotogramas guardados. La toma se reproduce en bucle.`}</p>
        <label>Tiempo: {(view.scrub || 0).toFixed(1)} s<input aria-label="Tiempo del movimiento" type="range" min="0" max={track?.duration || 8}
          step="0.05" value={Math.min(view.scrub || 0, track?.duration || 8)} disabled={Boolean(recording)}
          onChange={(event) => setView({ scrub: Number(event.target.value), frozen: true })} /></label>
        <div className="concert-motion-actions">
          <button type="button" onClick={onCaptureFrame}>Marcar fotograma</button>
          <button type="button" disabled={!track?.keyframes?.length || Boolean(recording)} onClick={onLoadFrame}>Cargar fotograma</button>
          <button type="button" disabled={!track?.keyframes?.length || Boolean(recording)} onClick={onDeleteFrame}>Eliminar fotograma</button>
        </div>
        <div className="concert-motion-keyframes" aria-label="Fotogramas de guitarra">
          {(track?.keyframes || []).map((frame) => <button type="button" key={frame.time} onClick={() => setView({ scrub: frame.time, frozen: true })}>{frame.time.toFixed(1)}s</button>)}
        </div>
        <button type="button" onClick={() => download("rockClubConcertMotion.json", motion)}>Descargar movimiento</button>
      </fieldset>}
      <fieldset className="concert-editor-camera"><legend>C&aacute;mara de ajuste</legend>
        <label>Girar: {view.angle}&deg;<input aria-label="Girar cámara de ajuste" type="range" min="-180" max="180" step="1" value={view.angle} onChange={(event) => setView({ angle: Number(event.target.value) })} /></label>
        <label>Distancia: {view.distance.toFixed(1)} m<input aria-label="Distancia cámara de ajuste" type="range" min="1" max="5" step="0.1" value={view.distance} onChange={(event) => setView({ distance: Number(event.target.value) })} /></label>
      </fieldset>
      <div className="studio-dev-actions">
        <button type="button" onClick={save}>Guardar aqu&iacute;</button><button type="button" onClick={copy}>Copiar JSON</button>
        <button type="button" onClick={() => download("rockClubConcertTransforms.json", transforms)}>Descargar JSON</button><button type="button" onClick={() => { onChange({ ...transforms, [view.selected]: defaultConcertTransform(view.selected) }); setNotice("Objeto restaurado. Guardá para conservarlo."); }}>Restablecer objeto</button>
      </div>
      <p role="status">{notice || "Los ajustes se ven al instante. Guardar aquí los conserva para los próximos recitales."}</p>
    </div>}
  </aside>;
}
