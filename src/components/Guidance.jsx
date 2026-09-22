import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const WIZARD_SEEN_PREFIX = "studio:wizard-seen:";
const WIZARD_STEPS = {
  home: [{ title: "Inicio", body: "Desde aca elegis si vas a trabajar con imagenes, diseno, PDF o video." }, { title: "Recientes", body: "Si guardaste un proyecto, podes abrirlo directo desde la seccion Recientes." }, { title: "Plantillas", body: "Las plantillas preparan tamanos y ajustes comunes para empezar rapido." }],
  image: [{ title: "Lienzo e imagen", body: "Subi una imagen, movela en el canvas y ajusta su tamano con las manijas." }, { title: "Herramientas", body: "Tenes seleccion, borrar, clonar, cortar por formas, varita y quitar fondo." }, { title: "Exportar y proyecto", body: "Podes exportar PNG/JPG/WebP o guardar el proyecto para volver despues." }],
  design: [{ title: "Diseno vectorial", body: "Combina foto de fondo, textos y formas sobre un lienzo editable." }, { title: "Texto", body: "Agrega textos, elegi fuente, color, alineacion y tamano desde el panel derecho." }, { title: "Exportar", body: "Exporta como SVG para seguir editando o PNG para usar como imagen final." }],
  pdf: [{ title: "Cargar hojas", body: "Arrastra JPG, PNG o WebP sobre esta pantalla para sumarlos al PDF." }, { title: "Ordenar", body: "Reordena las hojas arrastrandolas, o usa subir/bajar en la lista lateral." }, { title: "Preparar salida", body: "Rota, duplica, optimiza y elegi tamano de pagina antes de crear el PDF." }],
  video: [{ title: "Importar clips", body: "Arrastra videos a la preview o timeline. Cada archivo tiene limite de 100 MB." }, { title: "Timeline", body: "Move clips entre pistas, recorta inicio/fin y usa zoom para cortes finos." }, { title: "Exportacion", body: "El play general reproduce la timeline y exporta todos los clips juntos." }],
  audio: [{ title: "Importar audio", body: "Abri MP3, WAV, M4A, AAC, OGG o FLAC desde la barra superior." }, { title: "Forma de onda", body: "Escucha el audio, busca un punto y define el tramo que queres conservar." }, { title: "Procesar y exportar", body: "Ajusta volumen, normalizacion, fundidos y exporta como MP3 o WAV." }],
  three: [{ title: "Escena 3D", body: "Orbita con el mouse, selecciona objetos y usa los gizmos para transformarlos." }, { title: "Objetos", body: "Agrega primitivas, luces o modelos GLB y GLTF desde el panel izquierdo." }, { title: "Exportar", body: "Guarda el proyecto o exporta la vista como PNG y la escena como GLB." }]
};
const WIZARD_TARGETS = { home: ["home-create", "home-recents", "home-templates"], image: ["image-canvas", "image-tools", "image-properties"], design: ["design-canvas", "design-add", "design-properties"], pdf: ["pdf-pages", "pdf-properties", "pdf-properties"], video: ["video-preview", "video-timeline", "video-export"], audio: ["audio-tools", "audio-waveform", "audio-export"], three: ["three-viewport", "three-objects", "three-properties"] };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function Wizard({ screen, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const steps = WIZARD_STEPS[screen] || WIZARD_STEPS.home;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const targetName = (WIZARD_TARGETS[screen] || WIZARD_TARGETS.home)[stepIndex];

  useEffect(() => {
    let frame;
    const updateTarget = () => {
      const target = document.querySelector(`[data-wizard="${targetName}"]`);
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const padding = 8;
      const left = Math.max(8, rect.left - padding);
      const top = Math.max(8, rect.top - padding);
      setTargetRect({
        left,
        top,
        width: Math.max(1, Math.min(window.innerWidth - left - 8, rect.width + padding * 2)),
        height: Math.max(1, Math.min(window.innerHeight - top - 8, rect.height + padding * 2))
      });
    };
    frame = requestAnimationFrame(updateTarget);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [screen, stepIndex, targetName]);

  function panelPosition() {
    if (!targetRect) return {};
    const panelWidth = Math.min(390, window.innerWidth - 32);
    const panelHeight = 280;
    const gap = 18;
    let left;
    let top;
    if (window.innerWidth - (targetRect.left + targetRect.width) >= panelWidth + gap) {
      left = targetRect.left + targetRect.width + gap;
      top = targetRect.top;
    } else if (targetRect.left >= panelWidth + gap) {
      left = targetRect.left - panelWidth - gap;
      top = targetRect.top;
    } else {
      left = Math.min(window.innerWidth - panelWidth - 16, Math.max(16, targetRect.left));
      top = targetRect.top + targetRect.height + gap;
      if (top + panelHeight > window.innerHeight - 16) top = Math.max(16, targetRect.top - panelHeight - gap);
    }
    return { left, top: Math.min(window.innerHeight - panelHeight - 16, Math.max(16, top)), width: panelWidth };
  }

  function closeWizard() {
    localStorage.setItem(`${WIZARD_SEEN_PREFIX}${screen}`, "true");
    onClose();
  }

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true">
      {targetRect && <div className="wizard-spotlight" style={targetRect} />}
      <section className="wizard-panel" style={panelPosition()}>
        <button className="wizard-close" onClick={closeWizard} data-tooltip="Cerrar wizard" type="button">
          <X size={18} />
        </button>
        <span className="wizard-kicker">Guia {stepIndex + 1} de {steps.length}</span>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="wizard-dots">
          {steps.map((item, index) => (
            <span className={index === stepIndex ? "active" : ""} key={item.title} />
          ))}
        </div>
        <div className="wizard-actions">
          <button onClick={closeWizard} type="button">Omitir</button>
          <button disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))} type="button">
            Atras
          </button>
          <button className="primary-button" onClick={() => (isLast ? closeWizard() : setStepIndex((value) => value + 1))} type="button">
            {isLast ? "Listo" : "Siguiente"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function CustomTooltip() {
  const [tooltip, setTooltip] = useState(null);
  const showTimerRef = useRef(null);

  useEffect(() => {
    function showFor(target) {
      const owner = target?.closest?.("[data-tooltip]");
      if (!owner) return;
      clearTimeout(showTimerRef.current);
      showTimerRef.current = setTimeout(() => {
        const rect = owner.getBoundingClientRect();
        let placement = "top";
        let x = rect.left + rect.width / 2;
        let y = rect.top - 10;
        if (rect.left < 150) {
          placement = "right";
          x = rect.right + 10;
          y = rect.top + rect.height / 2;
        } else if (window.innerWidth - rect.right < 150) {
          placement = "left";
          x = rect.left - 10;
          y = rect.top + rect.height / 2;
        } else if (rect.top < 82) {
          placement = "bottom";
          y = rect.bottom + 10;
        }
        setTooltip({
          text: owner.dataset.tooltip,
          x: placement === "top" || placement === "bottom" ? clamp(x, 140, window.innerWidth - 140) : x,
          y: placement === "left" || placement === "right" ? clamp(y, 32, window.innerHeight - 32) : y,
          placement
        });
      }, 260);
    }

    function hideFor(event) {
      const owner = event.target?.closest?.("[data-tooltip]");
      if (owner && event.relatedTarget && owner.contains(event.relatedTarget)) return;
      clearTimeout(showTimerRef.current);
      setTooltip(null);
    }

    function hideImmediately() {
      clearTimeout(showTimerRef.current);
      setTooltip(null);
    }

    const handlePointerOver = (event) => showFor(event.target);
    const handleFocusIn = (event) => showFor(event.target);

    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", hideFor);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", hideFor);
    document.addEventListener("pointerdown", hideImmediately);
    window.addEventListener("scroll", hideImmediately, true);
    window.addEventListener("resize", hideImmediately);
    return () => {
      clearTimeout(showTimerRef.current);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", hideFor);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", hideFor);
      document.removeEventListener("pointerdown", hideImmediately);
      window.removeEventListener("scroll", hideImmediately, true);
      window.removeEventListener("resize", hideImmediately);
    };
  }, []);

  if (!tooltip) return null;
  return (
    <div
      className={`custom-tooltip is-${tooltip.placement}`}
      role="tooltip"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {tooltip.text}
    </div>
  );
}
