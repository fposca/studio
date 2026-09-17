import React, { useState } from "react";
import { ArrowRight, Check, Copy, FileText, Film, Image as ImageIcon, Square, Trash2, Type, X } from "lucide-react";
import logoIntro from "../assets/logo-intro.png";

const allowedLocalParts = new Set(["fposca", "jpaz", "fmachado"]);
const allowedDomain = "interbanking.com.ar";

export function isAllowedEmail(value) {
  const [local, domain, extra] = String(value).trim().toLowerCase().split("@");
  return !extra && domain === allowedDomain && allowedLocalParts.has(local);
}

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!isAllowedEmail(email)) {
      setError("Mail no autorizado para esta version.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    localStorage.setItem("studio:user", normalizedEmail);
    onLogin(normalizedEmail);
  }

  return (
    <main className="login-shell">
      <form className="login-panel" onSubmit={submit}>
        <div className="intro-logo-wrap"><img alt="Interbanking Studio" className="intro-logo" src={logoIntro} /></div>
        <h1>Interbanking Studio</h1>
        <p>Edicion de imagen y video para usuarios habilitados.</p>
        <label>Mail corporativo
          <input autoFocus value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="usuario@interbanking.com.ar" type="email" />
        </label>
        {error && <span className="form-error">{error}</span>}
        <button className="primary-button" type="submit"><Check size={18} /> Ingresar</button>
      </form>
    </main>
  );
}

export function ProjectSaveDialog({ defaultName, canUpdate, onClose, onSave, onUpdate }) {
  const [name, setName] = useState(defaultName || "Proyecto sin titulo");
  return (
    <div className="project-dialog-backdrop" role="dialog" aria-modal="true">
      <section className="project-dialog">
        <button className="wizard-close" onClick={onClose} type="button"><X size={18} /></button>
        <span className="wizard-kicker">ESPACIO DE TRABAJO</span>
        <h2>Guardar proyecto</h2>
        <label>Nombre<input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label>
        <div className="wizard-actions">
          <button onClick={onClose} type="button">Cancelar</button>
          {canUpdate && <button onClick={() => onUpdate(name.trim() || defaultName)} type="button">Actualizar actual</button>}
          <button className="primary-button" onClick={() => onSave(name.trim() || "Proyecto sin titulo")} type="button">Guardar nuevo</button>
        </div>
      </section>
    </div>
  );
}

export function Dashboard({ onCreate, onTemplate, projects, onOpenProject, onRenameProject, onDuplicateProject, onDeleteProject }) {
  const cards = [
    { id: "image", className: "dashboard-card-image", icon: ImageIcon, kicker: "EDITOR", title: "Imagen", text: "Editar, recortar, retocar y exportar." },
    { id: "design", className: "dashboard-card-design", icon: Type, kicker: "VECTORIAL", title: "Diseno", text: "Texto, formas vectoriales y fotos combinadas." },
    { id: "pdf", className: "dashboard-card-pdf", icon: FileText, kicker: "DOCUMENTOS", title: "PDF", text: "Ordenar hojas, convertir y optimizar." },
    { id: "video", className: "dashboard-card-video", icon: Film, kicker: "POSTPRODUCCION", title: "Video", text: "Timeline, cortes, efectos y exportacion." }
  ];
  return (
    <section className="dashboard">
      <div className="dashboard-hero"><div><h1>Interbanking Studio</h1><p>Elegi que queres crear o recupera un proyecto guardado.</p></div></div>
      <div className="dashboard-grid" data-wizard="home-create">
        {cards.map(({ id, className, icon: Icon, kicker, title, text }) => (
          <button className={`dashboard-card ${className}`} key={id} onClick={() => onCreate(id)} type="button">
            <span className="dashboard-card-icon"><Icon size={46} strokeWidth={1.5} /></span>
            <span className="dashboard-card-copy"><small>{kicker}</small><strong>{title}</strong><span>{text}</span></span>
            <span className="dashboard-card-action">Crear proyecto <ArrowRight size={18} /></span>
          </button>
        ))}
      </div>
      <div className="dashboard-section" data-wizard="home-recents">
        <h2>Recientes</h2>
        {projects.length ? <div className="recent-project-grid">{projects.map((project) => (
          <article className="recent-project-card" key={project.id}>
            <button className="recent-project-preview" onClick={() => onOpenProject(project)} type="button">{project.thumbnail ? <img alt="" src={project.thumbnail} /> : <Square size={38} />}</button>
            <div className="recent-project-info"><strong>{project.name}</strong><span>{project.tab} | {new Date(project.savedAt).toLocaleString()}</span></div>
            <div className="recent-project-actions">
              <button data-tooltip="Abrir proyecto" onClick={() => onOpenProject(project)} type="button"><ArrowRight size={15} /></button>
              <button data-tooltip="Renombrar" onClick={() => onRenameProject(project)} type="button"><Type size={15} /></button>
              <button data-tooltip="Duplicar" onClick={() => onDuplicateProject(project)} type="button"><Copy size={15} /></button>
              <button data-tooltip="Eliminar" onClick={() => onDeleteProject(project)} type="button"><Trash2 size={15} /></button>
            </div>
          </article>
        ))}</div> : <p className="file-hint">Todavia no hay proyectos guardados.</p>}
      </div>
      <div className="dashboard-section" data-wizard="home-templates">
        <h2>Plantillas</h2>
        <div className="template-grid">
          <button onClick={() => onTemplate("image", { name: "Cuadrada 1080", w: 1080, h: 1080, background: "checker" })} type="button">Imagen 1080x1080</button>
          <button onClick={() => onTemplate("image", { name: "Historia 1080x1920", w: 1080, h: 1920, background: "checker" })} type="button">Historia 9:16</button>
          <button onClick={() => onTemplate("design", { name: "Post con texto", w: 1080, h: 1080, backgroundColor: "#ffffff" })} type="button">Diseno 1080x1080</button>
          <button onClick={() => onTemplate("pdf", { name: "PDF A4", pageSize: "a4", fit: "contain", quality: 0.82, maxEdge: 1600 })} type="button">PDF A4</button>
          <button onClick={() => onTemplate("video", { name: "Video 1080p H.265", resolution: "1920:1080", codec: "h265", format: "mp4", crf: 24, timelineScale: 90 })} type="button">Video 1080p</button>
        </div>
      </div>
    </section>
  );
}
