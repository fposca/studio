import React from "react";
import { lostShipObjective, lostShipPressures, SHIP_ACCESS_ORDER, SHIP_CIRCUIT_ORDER, SHIP_LOCKER_ORDER, SHIP_NAVIGATION_ORDER } from "./lostShipQuest.js";
import "./lostShip.css";

const SYMBOL_NAMES = { pulse: "PULSO", coil: "BOBINA", gate: "COMPUERTA", triangle: "TRIÁNGULO", moon: "LUNA", wave: "ONDA" };
const CIRCUIT_NAMES = { internal: "SISTEMAS INTERNOS", life: "SOPORTE VITAL", bridge: "PUENTE DE MANDO" };
const SIGNAL_ROWS = [
  { name: "FREQUENCY 09", values: ["09", "01", "?"] },
  { name: "GRABACIÓN IMPOSIBLE", values: ["?", "09", "01"] },
  { name: "TRANSMISIÓN AZOTEA", values: ["01", "?", "09"] },
];
const HINTS = {
  signal: [
    "Los tres registros comparten una marca que aparece entre el ruido.",
    "Buscá el mismo valor en cada cinta y llevalo a la ventana central.",
    "La marca es 09. Girá los segmentos hasta que las tres ventanas muestren 09.",
  ],
  access: [
    "El registro describe un recorrido, no una contraseña.",
    "La corriente nace, se almacena y finalmente abre el acceso.",
    "La secuencia es PULSO → BOBINA → COMPUERTA.",
  ],
  circuit: [
    "El puente necesita una base de energía estable.",
    "Primero se alimentan los sistemas que permiten controlar el resto.",
    "Conectá SISTEMAS INTERNOS → SOPORTE VITAL → PUENTE.",
  ],
  locker: [
    "Tres pistas del almacén y el pasillo describen figuras distintas.",
    "La primera no tiene curvas; la segunda representa la noche; la última vibra.",
    "Seleccioná TRIÁNGULO → LUNA → ONDA.",
  ],
  life: [
    "Un regulador compensa a otro: mirá los tres medidores al mover uno.",
    "La presión objetivo es 5 en los tres sectores. Ajustá de a un paso.",
    "Poné los reguladores en 2, 1 y 2. La interacción entre válvulas dará 5/5/5.",
  ],
  navigation: [
    "Los tres registros guardados pertenecen a lugares distintos.",
    "Ordená la frecuencia, la puerta y el destino que muestran los archivos.",
    "Elegí 09 → 01 → TEMPLO. La lectura incompleta del puente confirma el último punto.",
  ],
};
const NAV_VALUES = ["09", "01", "temple", "void"];
const NAV_LABELS = { "09": "FRECUENCIA 09", "01": "PUERTA 01", temple: "TEMPLO", void: "VACÍO" };
const row = (label, text) => <div className="lost-ship-log-row"><strong>{label}</strong><span>{text}</span></div>;

export default function LostShipPanel({ mode, progress: p, parthenonProgress, onFragmentAnalyze, onAction, onClose, onEnter }) {
  if (!mode) return null;
  const title = {
    hugo: "EL REGISTRO DE LA AZOTEA", "hugo-after": "PUERTA 01",
    signal: "COMPARADOR DE SEÑALES", link: "ENLACE DIMENSIONAL",
    access: "ACCESO A LA NAVE", circuit: "DISTRIBUCIÓN DE ENERGÍA",
    locker: "ARMARIO DE SEGURIDAD", life: "SOPORTE VITAL",
    navigation: "NAVEGACIÓN DIMENSIONAL", traveler: "EL VIAJERO",
    journal: "DIARIO DE PISTAS", return: "ENLACE DE REGRESO",
    fragment02: "FRAGMENTO DE FRECUENCIA 02",
    archive: "ARCHIVO 01", orb: "HABILIDAD DESBLOQUEADA", door02: "PUERTA 02 · TEMPLO ANTIGUO", arrival: "CÁMARA DE LLEGADA",
  }[mode] || "REGISTRO DE LA NAVE";
  const hintType = ["signal", "access", "circuit", "locker", "life", "navigation"].includes(mode) ? mode : null;
  const hintLevel = hintType ? p.hints[hintType] || 0 : 0;
  const hintText = hintType && hintLevel ? HINTS[hintType][hintLevel - 1] : null;
  const pressure = lostShipPressures(p.regulators);
  const signalWindow = SIGNAL_ROWS.map((segment, index) => segment.values[p.signalSegments[index]]);
  const errors = {
    access: p.accessSymbols.length === 3 && p.accessSymbols.join("|") !== SHIP_ACCESS_ORDER.join("|"),
    circuit: p.circuitPath.length === 3 && p.circuitPath.join("|") !== SHIP_CIRCUIT_ORDER.join("|"),
    locker: p.lockerSymbols.length === 3 && p.lockerSymbols.join("|") !== SHIP_LOCKER_ORDER.join("|"),
    navigation: p.navigationValues.every(Boolean) && p.navigationValues.join("|") !== SHIP_NAVIGATION_ORDER.join("|"),
  };
  return <div className="lost-ship-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="lost-ship-panel" role="dialog" aria-modal="true" aria-label={title}>
      <header><small>NEONBOY UNIVERSE / PUERTA 01</small><button type="button" onClick={onClose} aria-label="Cerrar">&times;</button></header>
      <h2>{title}</h2>

      {mode === "hugo" && <div className="lost-ship-dialogue">
        {row("NEONBOY", "¡Hugo! Volví de la azotea.")}
        {row("HUGO", "¿Y? ¿Encontraste de dónde viene la señal?")}
        {row("NEONBOY", "Encontré algo peor. La antena captó una transmisión imposible.")}
        {row("HUGO", "¿Imposible cómo?")}
        {row("NEONBOY", "Había algo en el cielo. Y el equipo mostró PUERTA 01.")}
        {row("HUGO", "¿Puerta 01? A ver, mostrame lo que registraste.")}
        {row("NEONBOY", "¿Vos podés descifrarlo?")}
        {row("HUGO", "Podemos intentar. Pero esto ya se está poniendo bastante raro.")}
        <button type="button" className="lost-ship-primary" onClick={() => { onAction("hugo"); onClose(); }}>Comparar los registros en la computadora</button>
      </div>}
      {mode === "hugo-after" && <div className="lost-ship-dialogue">
        {row("NEONBOY", "¿Entonces dónde queda PUERTA 01?")}
        {row("HUGO", "Por lo que muestra este registro, no parece una ubicación normal.")}
        {row("NEONBOY", "¿Y cómo llegamos?")}
        {row("HUGO", "La señal usa la antena como punto de enlace. Quizás podamos volver a activarla.")}
        <button type="button" className="lost-ship-primary" onClick={onClose}>Volver a la azotea</button>
      </div>}
      {mode === "signal" && <div>
        <p>Hugo recuperó tres fuentes de datos. La marca común debe ocupar la ventana central en las tres cintas.</p>
        <div className="lost-ship-signal-grid">{SIGNAL_ROWS.map((segment, index) => <button key={segment.name} type="button" onClick={() => onAction("signal-rotate", index)} disabled={p.signalDecoded}>
          <small>{segment.name}</small><strong>{signalWindow[index]}</strong><span>GIRAR SEGMENTO ↻</span>
        </button>)}</div>
        <p className="lost-ship-feedback">{signalWindow.every(value => value === "09") ? "Coincidencia 09 / tres fuentes sincronizadas." : "Las ventanas aún no muestran la misma marca."}</p>
        <button type="button" className="lost-ship-primary" disabled={!signalWindow.every(value => value === "09") || p.signalDecoded} onClick={() => onAction("signal-decode")}>DECODIFICAR TRANSMISIÓN</button>
        {p.signalDecoded && <div className="lost-ship-success">TRANSMISIÓN DECODIFICADA · PUERTA 01 · ENLACE DIMENSIONAL</div>}
      </div>}
      {mode === "link" && <div>
        <p>El código del estudio resuena en la antena. Las luces de Buenos Aires titilan; frente al receptor se abre una grieta violeta.</p>
        {!p.signalDecoded ? <div className="lost-ship-feedback">Hugo todavía no descifró el registro.</div> : <>
          <button type="button" className="lost-ship-primary" disabled={p.linkActivated} onClick={() => onAction("link")}>{p.linkActivated ? "ENLACE ACTIVO" : "[E] ACTIVAR ENLACE DIMENSIONAL"}</button>
          {p.linkActivated && <div className="lost-ship-choice"><p>NEONBOY: «Bueno... espero que esto tenga vuelta.»</p>
            <button type="button" onClick={() => onEnter("lost-ship")}>Entrar en PUERTA 01</button>
            <button type="button" onClick={onClose}>Todavía no</button>
          </div>}</>}
      </div>}
      {mode === "access" && <div>
        <p>La consola dañada todavía reconoce tres símbolos. El registro de mantenimiento describe el trayecto de la corriente.</p>
        {!p.accessLog ? <div className="lost-ship-feedback">Examiná primero el registro de mantenimiento en la cámara de llegada.</div> : <>
          <div className="lost-ship-slots">{[0,1,2].map(index => <span key={index}>{p.accessSymbols[index] ? SYMBOL_NAMES[p.accessSymbols[index]] : "?"}</span>)}</div>
          <div className="lost-ship-options">{["gate", "pulse", "coil"].map(symbol => <button key={symbol} type="button" disabled={p.accessGranted || p.accessSymbols.length === 3} onClick={() => onAction("access-symbol", symbol)}>{SYMBOL_NAMES[symbol]}</button>)}</div>
          {errors.access && <p className="lost-ship-error">La secuencia no sigue el flujo descrito por el registro.</p>}
          <div className="lost-ship-actions"><button type="button" onClick={() => onAction("access-reset")}>Reiniciar secuencia</button>
            <button type="button" disabled={p.accessGranted || p.accessSymbols.length !== 3 || errors.access} onClick={() => onAction("access-open")}>Abrir compuerta</button></div>
          {p.accessGranted && <div className="lost-ship-success">ACCESO CONCEDIDO · PASILLO CENTRAL ABIERTO</div>}
        </>}
      </div>}
      {mode === "circuit" && <div>
        <p>La fuente de emergencia admite una sola etapa nueva a la vez. El registro del reactor explica qué sistema estabiliza al siguiente.</p>
        {!p.moduleInstalled ? <p className="lost-ship-feedback">Falta el módulo energético. Buscalo en el almacén y usalo desde el inventario junto al reactor.</p> : <>
          <div className="lost-ship-slots">{[0,1,2].map(index => <span key={index}>{CIRCUIT_NAMES[p.circuitPath[index]] || "?"}</span>)}</div>
          <div className="lost-ship-options">{["bridge", "internal", "life"].map(id => <button type="button" key={id} disabled={p.powerRestored || p.circuitPath.length === 3} onClick={() => onAction("circuit-add", id)}>{CIRCUIT_NAMES[id]}</button>)}</div>
          {errors.circuit && <p className="lost-ship-error">Sobrecarga. Un sistema depende de otro que aún no está alimentado.</p>}
          <div className="lost-ship-actions"><button type="button" onClick={() => onAction("circuit-reset")}>Reiniciar distribución</button>
            <button type="button" disabled={p.powerRestored || p.circuitPath.length !== 3 || errors.circuit} onClick={() => onAction("circuit-restore")}>Restablecer energía</button></div>
          {p.powerRestored && <div className="lost-ship-success">ENERGÍA PRINCIPAL RESTABLECIDA</div>}
        </>}
      </div>}
      {mode === "locker" && <div>
        <p>El armario solicita tres marcas. Las pistas están en el registro del almacén, el cartel del pasillo y el monitor de símbolos.</p>
        <p className="lost-ship-feedback">Pistas examinadas: {p.lockerClues.length}/3. Se pueden volver a consultar desde el diario.</p>
        {p.lockerClues.length === 3 && <>
          <div className="lost-ship-slots">{[0,1,2].map(index => <span key={index}>{SYMBOL_NAMES[p.lockerSymbols[index]] || "?"}</span>)}</div>
          <div className="lost-ship-options">{["moon", "wave", "triangle"].map(id => <button type="button" key={id} disabled={p.lockerOpened || p.lockerSymbols.length === 3} onClick={() => onAction("locker-symbol", id)}>{SYMBOL_NAMES[id]}</button>)}</div>
          {errors.locker && <p className="lost-ship-error">Las tres marcas son válidas, pero el orden no coincide.</p>}
          <div className="lost-ship-actions"><button type="button" onClick={() => onAction("locker-reset")}>Borrar combinación</button>
            <button type="button" disabled={p.lockerOpened || p.lockerSymbols.length !== 3 || errors.locker} onClick={() => onAction("locker-open")}>Abrir armario</button></div>
        </>}
        {p.lockerOpened && <div className="lost-ship-success">TARJETA DE ACCESO DEL PUENTE OBTENIDA · Revisá el inventario.</div>}
      </div>}
      {mode === "life" && <div>
        <p>Cada válvula modifica su sector y compensa a otro. Ajustá los tres reguladores para conseguir presión 5 / 5 / 5.</p>
        {!p.powerRestored ? <p className="lost-ship-feedback">El sistema necesita energía principal. Restaurá el reactor primero.</p> : <>
          <div className="lost-ship-meters">{["CÁMARA", "PASILLO", "PUENTE"].map((label, index) => <div key={label}><label>{label}: <strong>{pressure[index]}</strong> / 5 · válvula {p.regulators[index]}</label>
            <input type="range" min="0" max="3" step="1" value={p.regulators[index]} disabled={p.lifeStable} onChange={event => onAction("regulator", { index, value: Number(event.target.value) })} /></div>)}</div>
          <p className="lost-ship-feedback">Flujo disponible: 3 derivaciones · estabilidad {pressure.every(value => value === 5) ? "ÓPTIMA" : pressure.some(value => value < 2 || value > 8) ? "CRÍTICA" : "INCOMPLETA"}</p>
          <div className="lost-ship-actions"><button type="button" onClick={() => onAction("life-reset")}>Reiniciar válvulas</button>
            <button type="button" disabled={p.lifeStable || !pressure.every(value => value === 5)} onClick={() => onAction("life-stabilize")}>Estabilizar soporte vital</button></div>
          {p.lifeStable && <div className="lost-ship-success">SOPORTE VITAL ESTABILIZADO</div>}
        </>}
      </div>}
      {mode === "navigation" && <div>
        <p>Reconstruí la coordenada con los registros encontrados en el reactor, el almacén y el puente. Cada columna representa una referencia.</p>
        <p className="lost-ship-feedback">Registros reunidos: {p.navigationClues.length}/3. Consultalos en el diario.</p>
        {!p.bridgeCardUsed ? <p className="lost-ship-feedback">La puerta del puente todavía está cerrada. Usá la tarjeta del inventario cuando los sistemas estén estabilizados.</p> : <>
          <div className="lost-ship-star-map" role="img" aria-label={"Mapa estelar ficticio: " + p.navigationValues.reduce((count, value, index) => count + Number(value === SHIP_NAVIGATION_ORDER[index]), 0) + " de 3 referencias alineadas"}>
            <svg viewBox="0 0 600 220" aria-hidden="true">
              <path className="lost-ship-grid" d="M0 55H600M0 110H600M0 165H600M100 0V220M200 0V220M300 0V220M400 0V220M500 0V220" />
              <circle className="lost-ship-orbit" cx="300" cy="108" r="82" />
              <circle className="lost-ship-orbit" cx="300" cy="108" r="35" />
              <path className={p.navigationValues[0] === SHIP_NAVIGATION_ORDER[0] ? "lost-ship-route is-aligned" : "lost-ship-route"} d="M112 155L300 108" />
              <path className={p.navigationValues[1] === SHIP_NAVIGATION_ORDER[1] ? "lost-ship-route is-aligned" : "lost-ship-route"} d="M300 108L492 72" />
              <path className={p.navigationValues[2] === SHIP_NAVIGATION_ORDER[2] ? "lost-ship-route is-aligned" : "lost-ship-route"} d="M492 72L510 170" />
              <circle className="lost-ship-node" cx="112" cy="155" r="8" />
              <circle className="lost-ship-node" cx="300" cy="108" r="10" />
              <circle className="lost-ship-node" cx="492" cy="72" r="8" />
              <circle className="lost-ship-node" cx="510" cy="170" r="6" />
              <text x="80" y="185">ORIGEN</text><text x="271" y="92">ENLACE</text><text x="475" y="54">DESTINO</text>
            </svg>
            <span>RECONSTRUCCIÓN DE COORDENADAS / REGISTRO 01</span>
          </div>
          <div className="lost-ship-nav">{["SEÑAL", "ENLACE", "DESTINO"].map((label, index) => <label key={label}>{label}<select value={p.navigationValues[index] || ""} disabled={p.navigationRestored} onChange={event => onAction("navigation-select", { index, value: event.target.value })}>
            <option value="">Seleccionar referencia</option>{NAV_VALUES.map(value => <option key={value} value={value}>{NAV_LABELS[value]}</option>)}</select></label>)}</div>
          <p className="lost-ship-feedback">Alineación: {p.navigationValues.reduce((count, value, index) => count + Number(value === SHIP_NAVIGATION_ORDER[index]), 0)} / 3 referencias coherentes.</p>
          {errors.navigation && <p className="lost-ship-error">La coordenada todavía apunta fuera del registro conocido.</p>}
          <button type="button" className="lost-ship-primary" disabled={p.navigationClues.length < 3 || p.navigationRestored || p.navigationValues.some(value => !value) || errors.navigation} onClick={() => onAction("navigation-restore")}>RECONSTRUIR COORDENADA</button>
          {p.navigationRestored && <div className="lost-ship-success">NAVEGACIÓN RESTABLECIDA · REGISTRO 01 RECUPERADO · DESTINO ANTERIOR: DESCONOCIDO</div>}
        </>}
      </div>}
      {mode === "traveler" && <div className="lost-ship-dialogue">
        {row("NEONBOY", "¡Eh! ¿Hay alguien acá?")}
        {row("VIAJERO", "¿Cómo llegaste hasta esta nave?")}
        {row("NEONBOY", "Me metí en una máquina de videojuegos, después en una antena y terminé acá.")}
        {row("VIAJERO", "Entonces encontraste PUERTA 01.")}
        {row("NEONBOY", "¿Qué es este lugar?")}
        {row("VIAJERO", "Una nave que quedó atrapada entre coordenadas. Ya no sé cuánto tiempo pasó.")}
        {row("NEONBOY", "¿Y cómo salimos?")}
        {row("VIAJERO", "Primero necesitás recuperar el registro de navegación.")}
        {row("NEONBOY", "¿Y después?")}
        {row("VIAJERO", "Después vas a entender por qué las puertas comenzaron a abrirse.")}
        <button type="button" className="lost-ship-primary" onClick={() => { onAction("traveler"); onClose(); }}>Continuar investigando</button>
      </div>}
      {mode === "archive" && <div className="lost-ship-archive">
        {!p.navigationRestored ? <p>El archivo está apagado. La navegación debe funcionar primero.</p> :
          !p.memoryInstalled ? <p>Falta instalar el fragmento de memoria. Buscalo en el puente y usalo desde el inventario junto al archivo.</p> : <>
            <div className="lost-ship-hologram"><span>PUERTA 02 · REGISTRO LOCALIZADO</span><span>DESTINO: TEMPLO ANTIGUO</span><strong>ESTADO: CORROMPIDO</strong><small>RUINAS · ESTATUAS · UNA SOMBRA ENTRE COLUMNAS</small></div>
            {!p.travelerMet && <p className="lost-ship-feedback">Antes de interpretar estas imágenes, hablá con el Viajero en el puente.</p>}
            {!p.archiveRecovered && <button type="button" className="lost-ship-primary" disabled={!p.travelerMet} onClick={() => onAction("archive-open")}>RECUPERAR ARCHIVO 01</button>}
            {p.archiveRecovered && <><div className="lost-ship-success">Misión completada: PUERTA 01 · LA NAVE PERDIDA</div>
              {row("NEONBOY", "¿Un templo? ¿Qué tiene que ver con esta nave?")}
              {row("VIAJERO", "Las puertas no conectan solamente lugares.")}
              {row("NEONBOY", "¿Qué conectan entonces?")}
              {row("VIAJERO", "También conectan épocas.")}
              {row("NEONBOY", "Entonces esa cosa que apareció en Buenos Aires...")}
              {row("VIAJERO", "Puede que sea solo el comienzo.")}
              <p className="lost-ship-feedback">{p.orbReceiverActivated ? "El receptor de PUERTA 02 quedó estabilizado. El diario conserva la coordenada." : p.orbAnnouncementSeen ? "La cámara de resonancia está a la derecha del puente. Activá los tres nodos, derrotá al eco y cargale el orbe al receptor." : "El archivo despertó una nueva frecuencia. Al cerrar este registro, el Viajero te mostrará la habilidad Orbe Neon."}</p></>}
          </>}
      </div>}
      {mode === "fragment02" && <div className="lost-ship-orb-unlock">
        <strong>LECTURA DIMENSIONAL / PUERTA 02</strong>
        {parthenonProgress?.frequencyFragment02Analyzed && <button type="button" className="lost-ship-primary" onClick={() => onEnter("matrix")}>Entrar en PUERTA 03 · La Realidad Fracturada</button>}
        {parthenonProgress?.frequencyFragment02Analyzed ? <><p><strong>ESTADO: CORRUPCIÓN CRÍTICA</strong> · ADVERTENCIA: ESTRUCTURA INESTABLE</p>{row("NEONBOY", "¿Otra dimensión? Espero que ésta no tenga otra Medusa.")}<p>La señal coincide con otra coordenada: PUERTA 03. El registro queda en el diario.</p></> : <>
          <p>El fragmento recuperado del altar de Medusa contiene una frecuencia imposible.</p>
          {row("NEONBOY", "Esto no parece parte del templo. La nave puede leerlo.")}
          <button type="button" className="lost-ship-primary" onClick={() => onFragmentAnalyze?.()}>Analizar fragmento</button>
        </>}
      </div>}
      {mode === "door02" && <div className="lost-ship-orb-unlock">
        <strong>ENTRENAMIENTO COMPLETADO · ORBE NEÓN ESTABILIZADO</strong>
        <p>La nave proyecta una coordenada sobre un templo griego corrompido. El enlace de Puerta 02 está listo.</p>
        <button type="button" className="lost-ship-primary" onClick={() => onEnter("parthenon")}>Entrar en PUERTA 02</button>
        <button type="button" onClick={onClose}>Seguir en la nave</button>
      </div>}
      {mode === "orb" && <div className="lost-ship-orb-unlock">
        <div className="lost-ship-orb-emblem" aria-hidden="true"><span /></div>
        <strong>HAS DESBLOQUEADO: ORBE NEON</strong>
        <p>La frecuencia responde a tu voluntad.</p>
        {row("VIAJERO", "La nave reconoció la frecuencia en vos. Probá los tres nodos de la cámara de resonancia, a la derecha del puente.")}
        <p>Click izquierdo o F: lanzar. R: recuperar el orbe. No consume munición.</p>
        <button type="button" className="lost-ship-primary" onClick={onClose}>Probar el Orbe Neon</button>
      </div>}
      {mode === "return" && <div><p>El enlace dimensional vuelve a la azotea. Los sistemas de la nave conservarán su estado.</p><div className="lost-ship-choice"><button type="button" onClick={() => onEnter("neonboy-rooftop")}>Regresar a la azotea</button><button type="button" onClick={onClose}>Seguir explorando</button></div></div>}
      {mode === "journal" && <div className="lost-ship-journal">
        {row("OBJETIVO", lostShipObjective(p))}
        {parthenonProgress?.frequencyFragment02Collected && row("EL FRAGMENTO DE MEDUSA", parthenonProgress.frequencyFragment02Analyzed ? "La lectura confirma una nueva señal: PUERTA 03." : "Al derrotar a Medusa, NeonBoy recuperó un fragmento de frecuencia que parece contener información sobre otra conexión dimensional.")}
        {p.orbUnlocked && row("NUEVA HABILIDAD", "Orbe Neon descubierto. La frecuencia responde a tu voluntad. Click izquierdo o F para lanzar; R para recuperar.")}
        {p.orbUnlocked && row("PUERTA 02", "Reactivá los tres nodos de la cámara de resonancia a la derecha del puente (" + p.orbNodes.filter(Boolean).length + "/3).")}
        {p.orbDoorOpen && row("CÁMARA DE RESONANCIA", "Compuerta abierta. El eco de frecuencia sigue activo hasta recibir tres impactos.")}
        {p.orbEnemyDefeated && row("ECO", "Eco de frecuencia disuelto. El receptor central acepta el orbe.")}
        {p.orbReceiverActivated && row("ENLACE", "Receptor cargado. La coordenada de PUERTA 02 quedó estabilizada para el próximo capítulo.")}
        {p.accessLog && row("CÁMARA DE LLEGADA", "El registro: la corriente nace en el pulso, se almacena en la bobina y libera la compuerta.")}
        {p.accessGranted && row("PASILLO", "Cartel: la segunda marca del armario representa la noche.")}
        {p.lockerClues.includes("log") && row("ALMACÉN", "Registro: la primera marca del armario no tiene curvas.")}
        {p.lockerClues.includes("monitor") && row("MONITOR", "El último símbolo vibra como una onda.")}
        {p.reactorExamined && row("REACTOR", "Falta un módulo. Orden de prioridad: sistemas internos → soporte vital → puente.")}
        {p.navigationClues.includes("reactor") && row("C/ REACTOR", "El patrón de origen es FREQUENCY 09.")}
        {p.navigationClues.includes("storage") && row("D/ ALMACÉN", "El número del enlace es PUERTA 01.")}
        {p.navigationClues.includes("bridge") && row("E/ PUENTE", "El destino parece una estructura antigua: TEMPLO.")}
        {p.moduleTaken && row("OBJETO", "Módulo energético recuperado en el almacén.")}
        {p.lockerOpened && row("OBJETO", "Tarjeta de acceso al puente obtenida.")}
        {p.memoryTaken && row("OBJETO", "Fragmento de memoria dimensional recuperado.")}
      </div>}
      {mode === "arrival" && <div><p>La nave no se mueve. Una compuerta cerrada bloquea el pasillo. Buscá un registro de mantenimiento y la consola de acceso.</p><p>NEONBOY: «¿Dónde estoy? Esto definitivamente no es Buenos Aires. Y espero que esta cosa tenga una salida.»</p></div>}
      {hintType && <div className="lost-ship-hint"><button type="button" disabled={hintLevel >= 3} onClick={() => onAction("hint", hintType)}>Pedir pista {Math.min(3, hintLevel + 1)} / 3</button>{hintText && <p>{hintText}</p>}</div>}
      <footer><span>WASD: EXPLORAR · E: INTERACTUAR · I: INVENTARIO</span><button type="button" onClick={onClose}>Cerrar / Esc</button></footer>
    </section>
  </div>;
}
