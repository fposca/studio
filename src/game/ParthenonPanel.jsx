import React, { useState } from "react";
import "./parthenon.css";

const CLUES = {
  guardianInscription: {
    title: "Inscripción de los guardianes",
    lines: ["Tres testigos custodian el primer umbral.", "La lechuza vio primero. La serpiente siguió su sombra. El sol selló el juramento."],
    hints: ["Observá los emblemas de los tres pedestales.", "Seguí la secuencia temporal de la inscripción: ver, seguir, sellar.", "Dispará a LECHUZA → SERPIENTE → SOL."],
  },
  mirrorTablet: {
    title: "Placa de los reflectores",
    lines: ["Una línea de luz llega desde el sur, gira hacia el este y luego entra en el receptáculo.", "Las dos superficies deben estar cargadas antes de guiar el Orbe."],
    hints: ["Cargá cada reflector con un disparo.", "Parate al sur del reflector izquierdo y apuntá a su centro.", "El rebote debe tocar el reflector derecho y luego el cristal detrás."],
  },
  courtRecord: { title: "Registro del patio", lines: ["El tiempo habló primero. La grieta cruzó los siglos después. Alguien observó desde afuera."] },
  reflectorRecord: { title: "Registro de los reflejos", lines: ["La puerta entre épocas no se abrió sola. Una frecuencia ajena siguió el rastro de la grieta."] },
  sanctuaryRecord: { title: "Registro del santuario", lines: ["El testigo no pertenece al templo. Vio lo que entró y quedó convertido en piedra."] },
  medusaShadow: { title: "La sombra", lines: ["Estas estatuas son demasiado realistas...", "Algo se mueve entre las columnas. No me gusta nada esto."] },
  sanctuaryAltar: { title: "Altar dimensional", lines: ["La corrupción no nació en la Antigua Grecia. El templo fue un punto de conexión entre épocas.", "REGISTRO DIMENSIONAL DETECTADO · ENTIDAD EXTERNA PRESENTE · CORRUPCIÓN EN PROGRESO"] },
};
export default function ParthenonPanel({ mode, progress, onClose, onReturn, onStartBoss }) {
  const [hints, setHints] = useState({});
  if (!mode) return null;
  const clue = CLUES[mode];
  const hint = hints[mode] || 0;
  return <div className="parthenon-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="parthenon-panel" role="dialog" aria-modal="true" aria-label={clue?.title || "Puerta 02"}>
      <header><small>PUERTA 02 / EL PARTENÓN MALDITO</small><button type="button" onClick={onClose} aria-label="Cerrar">&times;</button></header>
      <h2>{clue?.title || "Enlace dimensional"}</h2>
      {mode === "returnPortal" ? <><p>El portal sigue conectado a La Nave Perdida. Podés volver sin perder el progreso.</p><button type="button" className="parthenon-primary" onClick={onReturn}>Volver a la nave</button></>
        : mode === "sanctuaryAltar" && !progress.altarRead ? <p>Los símbolos del altar permanecen apagados. Falta comprender qué entró al templo.</p>
        : clue?.lines.map((line, index) => <p key={index}>{line}</p>)}
      {mode === "sanctuaryAltar" && !progress.altarRead && <p className="parthenon-warning">Investigá los sellos y la presencia de Medusa para completar el registro.</p>}
      {mode === "sanctuaryAltar" && progress.altarRead && progress.cursedHopliteHealth === 0 && !progress.medusaBossDefeated && <button type="button" className="parthenon-primary" onClick={onStartBoss}>Enfrentar a Medusa</button>}
      {clue?.hints && <div className="parthenon-hints">
        <button type="button" disabled={hint >= 3} onClick={() => setHints({ ...hints, [mode]: Math.min(3, hint + 1) })}>Pedir pista {hint}/3</button>
        {hint > 0 && <p>{clue.hints[hint - 1]}</p>}
      </div>}
      <footer><span>WASD explorar · E examinar · F / clic: Orbe Neón</span><button type="button" onClick={onClose}>Cerrar / Esc</button></footer>
    </section>
  </div>;
}
