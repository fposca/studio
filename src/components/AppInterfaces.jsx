import React, { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowRight, Box, Check, Copy, Download, FileText, Film, HardDrive, Image as ImageIcon, Layers3, Loader2, Lock, LogOut, Monitor, ShieldCheck, Sparkles, Square, Trash2, Type, WifiOff, X } from "lucide-react";
import logoIntro from "../assets/logo-intro.png";
import neonboyVideo from "../assets/video/neonboy.mp4";
import { db } from "../lib/firebase.js";

function authErrorMessage(error) {
  const messages = {
    "auth/invalid-credential": "El email o la contrasena no son correctos.",
    "auth/invalid-email": "Ingresa un email valido.",
    "auth/missing-password": "Ingresa tu contrasena.",
    "auth/too-many-requests": "Hubo demasiados intentos. Proba nuevamente mas tarde.",
    "auth/user-disabled": "Esta cuenta fue deshabilitada.",
    "auth/user-not-found": "No encontramos una cuenta con ese email.",
    "auth/network-request-failed": "No se pudo conectar. Revisa tu conexion a internet."
  };
  return messages[error?.code] || "No se pudo completar la operacion. Intenta nuevamente.";
}

export function Login({ downloadUrl, onLogin, onResetPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [request, setRequest] = useState({ name: "", email: "", company: "" });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await onLogin(email, password);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function recoverPassword() {
    if (!email.trim()) {
      setError("Ingresa tu email para recuperar la contrasena.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await onResetPassword(email);
      setStatus("Te enviamos un enlace para restablecer tu contrasena.");
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function requestAccess(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const normalizedEmail = request.email.trim().toLowerCase();
      const emailBytes = new TextEncoder().encode(normalizedEmail);
      const emailHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", emailBytes)))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      await setDoc(doc(db, "accessRequests", emailHash), {
        name: request.name.trim(),
        email: normalizedEmail,
        company: request.company.trim(),
        status: "pending",
        createdAt: serverTimestamp()
      });
      setRequest({ name: "", email: "", company: "" });
      setRequestOpen(false);
      setStatus("Solicitud enviada. Te avisaremos por email cuando sea aprobada.");
    } catch (caught) {
      console.error("No se pudo enviar la solicitud.", caught);
      setError(caught?.code === "permission-denied" ? "Ya existe una solicitud para este email." : "No se pudo enviar la solicitud. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-panel" onSubmit={requestOpen ? requestAccess : submit}>
        <div className="intro-logo-wrap"><img alt="Neon Studio" className="intro-logo" src={logoIntro} /></div>
        <h1>Neon Studio</h1>
        <p>{requestOpen ? "Completa tus datos para solicitar acceso." : "Edicion de imagen y video para usuarios habilitados."}</p>
        {requestOpen ? (
          <>
            <label>Nombre y apellido<input autoFocus maxLength="100" minLength="2" required value={request.name} onChange={(event) => setRequest((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Email<input autoComplete="email" maxLength="254" required value={request.email} onChange={(event) => setRequest((current) => ({ ...current, email: event.target.value }))} type="email" /></label>
            <label>Empresa (opcional)<input maxLength="120" value={request.company} onChange={(event) => setRequest((current) => ({ ...current, company: event.target.value }))} /></label>
          </>
        ) : (
          <>
            <label>Email<input autoComplete="email" autoFocus value={email} onChange={(event) => { setEmail(event.target.value); setError(""); setStatus(""); }} placeholder="nombre@empresa.com" type="email" /></label>
            <label>Contrasena<input autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} type="password" /></label>
          </>
        )}
        {error && <span className="form-error">{error}</span>}
        {status && <span className="form-status">{status}</span>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? <Loader2 className="spin" size={18} /> : <Check size={18} />} {requestOpen ? "Enviar solicitud" : "Iniciar sesion"}</button>
        {!requestOpen && <button className="text-button" disabled={busy} onClick={recoverPassword} type="button">Recuperar contrasena</button>}
        <button className="text-button" disabled={busy} onClick={() => { setRequestOpen((current) => !current); setError(""); setStatus(""); }} type="button">
          {requestOpen ? "Volver al inicio de sesion" : "Solicitar acceso"}
        </button>
        {!requestOpen && downloadUrl && (
          <a className="login-download" href={downloadUrl} rel="noreferrer">
            <Download size={17} /> Descargar Neon Studio para Windows
          </a>
        )}
      </form>
    </main>
  );
}

export function AuthLoading() {
  return (
    <main className="login-shell">
      <div className="auth-loading" role="status">
        <Loader2 className="spin" size={30} />
        <span>Verificando sesion...</span>
      </div>
    </main>
  );
}

export function DesktopAccessDenied({ onLogout, user }) {
  return (
    <main className="login-shell">
      <section className="access-panel">
        <Lock size={34} />
        <h1>Acceso no habilitado</h1>
        <p>Tu cuenta no tiene acceso a la version de escritorio.</p>
        <span>{user?.email}</span>
        <button onClick={onLogout} type="button"><LogOut size={17} /> Cerrar sesion</button>
      </section>
    </main>
  );
}

export function ViewerDemo({ downloadUrl, onLogout, user }) {
  const modules = [
    { id: "image", icon: ImageIcon, name: "Imagen", description: "Recorta, retoca, elimina fondos y exporta en formatos modernos.", points: ["20 filtros listos", "Seleccion y clonado", "PNG, JPG, WebP y SVG"] },
    { id: "design", icon: Type, name: "Diseno", description: "Combina texto, formas e imagenes en un lienzo flexible.", points: ["Capas editables", "Tipografias y estilos", "Formatos para redes"] },
    { id: "pdf", icon: FileText, name: "PDF", description: "Organiza paginas y convierte documentos sin subir archivos.", points: ["Imagenes a PDF", "PDF a imagenes", "Orden y optimizacion"] },
    { id: "video", icon: Film, name: "Video", description: "Corta, organiza y exporta clips desde una timeline completa.", points: ["Multiples pistas", "Efectos por tramo", "Exportacion H.264 y H.265"] }
  ];

  return (
    <main className="app-shell">
      <header className="app-header viewer-header">
        <div><strong>Neon Studio</strong><span>{user?.email} | Presentacion</span></div>
        <button className="icon-button" data-tooltip="Cerrar sesion" onClick={onLogout} type="button"><LogOut size={18} /></button>
      </header>
      <div className="viewer-showcase">
        <section className="viewer-hero">
          <div className="viewer-hero-copy">
            <span className="viewer-kicker">EDICION LOCAL PARA WINDOWS</span>
            <h1>Neon Studio</h1>
            <p>Imagen, diseno, PDF y video en una sola aplicacion. Tus archivos se procesan directamente en tu computadora.</p>
            <div className="viewer-hero-actions">
              <a className="primary-button" href={downloadUrl} rel="noreferrer"><Download size={18} /> Descargar para Windows</a>
              <span>Windows 10/11 · Procesamiento local</span>
            </div>
          </div>
          <div className="viewer-brand-visual">
            <img alt="Neon Studio" src={logoIntro} />
          </div>
        </section>

        <section className="viewer-product" aria-labelledby="viewer-product-title">
          <div className="viewer-section-heading">
            <span>HERRAMIENTAS</span>
            <h2 id="viewer-product-title">Un espacio para cada trabajo</h2>
          </div>
          <div className="viewer-module-list">
            {modules.map((module) => {
              const ModuleIcon = module.icon;
              return (
                <article className="viewer-module-detail" key={module.id}>
                  <div className="viewer-module-copy">
                    <ModuleIcon size={34} />
                    <h3>{module.name}</h3>
                    <p>{module.description}</p>
                    <ul>{module.points.map((point) => <li key={point}><Check size={16} /> {point}</li>)}</ul>
                  </div>
                  <div className={`viewer-app-preview is-${module.id}`} aria-label={`Vista del editor de ${module.name}`}>
                    <div className="viewer-preview-toolbar"><span /><span /><span /><strong>{module.name}</strong></div>
                    <div className="viewer-preview-body">
                      <div className="viewer-preview-rail"><ImageIcon size={16} /><Type size={16} /><Layers3 size={16} /></div>
                      <div className="viewer-preview-canvas">
                        {module.id === "image" && <img alt="Logo editado en el lienzo" src={logoIntro} />}
                        {module.id === "design" && <div className="viewer-design-sample"><strong>IDEAS QUE<br />TOMAN FORMA</strong><span>Neon Studio</span></div>}
                        {module.id === "pdf" && <div className="viewer-pdf-sample"><span>1</span><span>2</span><span>3</span></div>}
                        {module.id === "video" && (
                          <video autoPlay controls loop muted playsInline>
                            <source src={neonboyVideo} type="video/mp4" />
                          </video>
                        )}
                      </div>
                      <div className="viewer-preview-controls"><span /><span /><span /><span /><span /></div>
                    </div>
                    {module.id === "video" && <div className="viewer-preview-timeline"><i /><i /><i /></div>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="viewer-benefits">
          <article><HardDrive size={24} /><strong>Procesamiento local</strong><span>La potencia viene de tu PC, no de un servidor remoto.</span></article>
          <article><ShieldCheck size={24} /><strong>Archivos privados</strong><span>Imagenes y videos no se envian a Firebase ni a la web.</span></article>
          <article><WifiOff size={24} /><strong>Trabajo sin conexion</strong><span>Despues de validar tu acceso, las herramientas trabajan localmente.</span></article>
          <article><Sparkles size={24} /><strong>Todo integrado</strong><span>Cuatro flujos creativos dentro del mismo espacio de trabajo.</span></article>
        </section>

        <section className="viewer-final-cta">
          <div><span>NEON STUDIO PARA WINDOWS</span><h2>Listo para trabajar en tu computadora</h2></div>
          <a className="primary-button" href={downloadUrl} rel="noreferrer"><Download size={18} /> Descargar aplicacion</a>
        </section>
      </div>
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

export function Dashboard({ downloadUrl, onCreate, onTemplate, projects, readOnly = false, onOpenProject, onRenameProject, onDuplicateProject, onDeleteProject }) {
  const cards = [
    { id: "image", className: "dashboard-card-image", icon: ImageIcon, kicker: "EDITOR", title: "Imagen", text: "Editar, recortar, retocar y exportar." },
    { id: "design", className: "dashboard-card-design", icon: Type, kicker: "VECTORIAL", title: "Diseno", text: "Texto, formas vectoriales y fotos combinadas." },
    { id: "pdf", className: "dashboard-card-pdf", icon: FileText, kicker: "DOCUMENTOS", title: "PDF", text: "Ordenar hojas, convertir y optimizar." },
    { id: "video", className: "dashboard-card-video", icon: Film, kicker: "POSTPRODUCCION", title: "Video", text: "Timeline, cortes, efectos y exportacion." },
    { id: "three", className: "dashboard-card-three", icon: Box, kicker: "ESPACIO", title: "3D", text: "Modela escenas, materiales, luces y camaras." }
  ];
  return (
    <section className="dashboard">
      <div className="dashboard-hero"><div><h1>Neon Studio</h1><p>{readOnly ? "Conoce las herramientas disponibles en la aplicacion." : "Elegi que queres crear o recupera un proyecto guardado."}</p></div></div>
      {downloadUrl && (
        <div className="desktop-download-band">
          <span className="desktop-download-icon"><Monitor size={28} /></span>
          <div>
            <strong>Neon Studio para Windows</strong>
            <span>Procesa imagenes y videos directamente en tu PC.</span>
          </div>
          <a className="primary-button" href={downloadUrl} rel="noreferrer">
            <Download size={17} /> Descargar para Windows
          </a>
        </div>
      )}
      <div className="dashboard-grid" data-wizard="home-create">
        {cards.map(({ id, className, icon: Icon, kicker, title, text }) => (
          <button className={`dashboard-card ${className}`} disabled={readOnly} key={id} onClick={() => onCreate(id)} type="button">
            <span className="dashboard-card-icon"><Icon size={46} strokeWidth={1.5} /></span>
            <span className="dashboard-card-copy"><small>{kicker}</small><strong>{title}</strong><span>{text}</span></span>
            <span className="dashboard-card-action">{readOnly ? "Disponible en escritorio" : "Crear proyecto"} <ArrowRight size={18} /></span>
          </button>
        ))}
      </div>
      <div className="dashboard-section" data-wizard="home-recents">
        <h2>Recientes</h2>
        {projects.length ? <div className="recent-project-grid">{projects.map((project) => (
          <article className="recent-project-card" key={project.id}>
            <button className="recent-project-preview" disabled={readOnly} onClick={() => onOpenProject(project)} type="button">{project.thumbnail ? <img alt="" src={project.thumbnail} /> : <Square size={38} />}</button>
            <div className="recent-project-info"><strong>{project.name}</strong><span>{project.tab} | {new Date(project.savedAt).toLocaleString()}</span></div>
            {!readOnly && <div className="recent-project-actions">
              <button data-tooltip="Abrir proyecto" onClick={() => onOpenProject(project)} type="button"><ArrowRight size={15} /></button>
              <button data-tooltip="Renombrar" onClick={() => onRenameProject(project)} type="button"><Type size={15} /></button>
              <button data-tooltip="Duplicar" onClick={() => onDuplicateProject(project)} type="button"><Copy size={15} /></button>
              <button data-tooltip="Eliminar" onClick={() => onDeleteProject(project)} type="button"><Trash2 size={15} /></button>
            </div>}
          </article>
        ))}</div> : <p className="file-hint">Todavia no hay proyectos guardados.</p>}
      </div>
      <div className="dashboard-section" data-wizard="home-templates">
        <h2>Plantillas</h2>
        <div className="template-grid">
          <button disabled={readOnly} onClick={() => onTemplate("image", { name: "Cuadrada 1080", w: 1080, h: 1080, background: "checker" })} type="button">Imagen 1080x1080</button>
          <button disabled={readOnly} onClick={() => onTemplate("image", { name: "Historia 1080x1920", w: 1080, h: 1920, background: "checker" })} type="button">Historia 9:16</button>
          <button disabled={readOnly} onClick={() => onTemplate("design", { name: "Post con texto", w: 1080, h: 1080, backgroundColor: "#ffffff" })} type="button">Diseno 1080x1080</button>
          <button disabled={readOnly} onClick={() => onTemplate("pdf", { name: "PDF A4", pageSize: "a4", fit: "contain", quality: 0.82, maxEdge: 1600 })} type="button">PDF A4</button>
          <button disabled={readOnly} onClick={() => onTemplate("video", { name: "Video 1080p H.265", resolution: "1920:1080", codec: "h265", format: "mp4", crf: 24, timelineScale: 90 })} type="button">Video 1080p</button>
          <button disabled={readOnly} onClick={() => onCreate("three")} type="button">Escena 3D</button>
        </div>
      </div>
    </section>
  );
}
