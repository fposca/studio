import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Box, Building2, Check, ChevronDown, Compass, Expand, GraduationCap, Headphones, Layers3, Menu, MessageCircle, MousePointer2, MoveUpRight, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { DEMO_COMPANY, PLATFORM } from "./branding/brand.js";
import ContactForm from "./ContactForm.jsx";
import "./landing.css";

const OfficeApp = lazy(() => import("./OfficeApp.jsx"));
const features = [
  { icon: Users, title: "Onboarding interactivo", text: "Dos avatares, bienvenida de Recursos Humanos y recorrido libre por la oficina.", status: "Disponible en la demo" },
  { icon: MessageCircle, title: "Buddy virtual", text: "Personajes que responden preguntas mediante conversaciones preconfiguradas y voces en castellano.", status: "Disponible en la demo" },
  { icon: Building2, title: "Oficinas virtuales", text: "Espacios 3D para explorar sectores, objetos y puntos de información.", status: "Disponible en la demo" },
  { icon: ShieldCheck, title: "Información y seguridad", text: "Orientación ilustrativa sobre espacios, servicios y evacuación con un personaje de seguridad.", status: "Disponible en la demo" },
  { icon: GraduationCap, title: "Capacitación interactiva", text: "Actividades, cuestionarios y situaciones simuladas diseñadas para cada organización.", status: "Desarrollo a medida" },
  { icon: Layers3, title: "Comunicación interna", text: "Novedades, mensajes y contenido audiovisual integrados en el entorno.", status: "En exploración" },
];
const steps = [
  ["01", "Elegí tu avatar", "Seleccioná a Fernando o Victoria para iniciar el recorrido."],
  ["02", "Ingresá a la empresa", "Entrá a la oficina y recibí la bienvenida de Roxy."],
  ["03", "Explorá e interactuá", "Caminá, conversá e inspeccioná espacios y objetos."],
  ["04", "Aprendé a tu ritmo", "Sumá actividades y desafíos según el proyecto contratado."]
];
const experiences = ["Bienvenida a nuevos empleados", "Recorridos de oficinas", "Seguridad y evacuación", "Prevención de phishing", "Protección de datos", "Normas de convivencia", "Cultura organizacional", "Evaluaciones interactivas", "Presentación de productos", "Capacitación comercial"];
const roadmap = ["Asistentes conversacionales con IA", "Documentación corporativa", "Panel para Recursos Humanos", "Edición de diálogos", "Seguimiento del progreso", "Estadísticas de capacitación", "Nuevos escenarios", "Integraciones internas", "Experiencias multijugador"];

function Brand({ compact = false }) {
  return <a className={compact ? "site-brand is-compact" : "site-brand"} href="#inicio" aria-label={`${PLATFORM.name}, ir al inicio`}>
    <img src={new URL("./branding/vertex.svg", import.meta.url).href} alt="" width="42" height="42" />
    <span><strong>{PLATFORM.name}</strong><small>{PLATFORM.descriptor}</small></span>
  </a>;
}

function DemoFrame() {
  const frameRef = useRef(null);
  const expandRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [canRunDemo] = useState(() => {
    try {
      if (navigator.deviceMemory && navigator.deviceMemory < 2) return false;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(context);
    } catch { return false; }
  });
  useEffect(() => {
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "350px 0px" });
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = event => {
      if (event.key === "Escape" && !document.fullscreenElement && !frameRef.current?.querySelector(".office-dialogue")) {
        setExpanded(false);
        requestAnimationFrame(() => expandRef.current?.focus());
      }
      if (event.key !== "Tab") return;
      const items = [...frameRef.current.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')]
        .filter(item => !item.disabled && item.getClientRects().length);
      if (!items.length) return;
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement === frameRef.current) document.exitFullscreen().catch(() => {});
    };
  }, [expanded]);
  function expand() {
    setExpanded(true);
    requestAnimationFrame(() => frameRef.current?.querySelector(".office-canvas")?.focus({ preventScroll: true }));
  }
  function collapse() {
    setExpanded(false);
    requestAnimationFrame(() => expandRef.current?.focus());
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frameRef.current?.requestFullscreen();
    } catch { /* The browser may deny fullscreen; the office remains usable. */ }
  }
  return <div className={"demo-embed" + (expanded ? " is-expanded" : "")} ref={frameRef}
    role={expanded ? "dialog" : undefined} aria-modal={expanded ? "true" : undefined}
    aria-label={"Demo interactiva " + DEMO_COMPANY.name}>
    <div className="demo-toolbar"><span className="demo-toolbar-brand">DEMO EN VIVO <i /> {DEMO_COMPANY.name}</span><div>
      {expanded ? <><button type="button" onClick={toggleFullscreen}><Expand size={16} /> Pantalla completa</button>
        <button type="button" onClick={collapse}><X size={17} /> Volver a la página</button></>
        : <button type="button" onClick={expand} ref={expandRef}><Expand size={16} /> Ampliar ventana</button>}
    </div></div>
    {visible ? (canRunDemo ? <Suspense fallback={<div className="demo-loading" role="status"><span className="loading-orbit" />Cargando la oficina interactiva&hellip;</div>}><OfficeApp /></Suspense>
      : <div className="demo-unavailable"><div className="demo-unavailable-image" role="img" aria-label={"Vista previa de la oficina " + DEMO_COMPANY.name} /><h2>La demo 3D no se puede ejecutar en este dispositivo.</h2><p>Necesita WebGL 2.0 y memoria suficiente.</p></div>)
      : <div className="demo-loading" role="status"><span className="loading-orbit" />La oficina se prepara al llegar a esta sección.</div>}
  </div>;
}

export default function CommercialApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactInterest, setContactInterest] = useState("");
  const observerRef = useRef(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll(".reveal").forEach(element => element.classList.add("in-view")); return; }
    observerRef.current = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in-view"); observerRef.current?.unobserve(entry.target); }
    }), { threshold: .12 });
    document.querySelectorAll(".reveal").forEach(element => observerRef.current.observe(element));
    return () => observerRef.current?.disconnect();
  }, []);
  function openDemo() { setMenuOpen(false); document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" }); }
  function goContact(interest = "") { setContactInterest(interest); setMenuOpen(false); document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" }); }
  return <>
    <header className="site-header"><div className="site-header-inner">
      <Brand />
      <button type="button" className="mobile-menu-toggle" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Navegación principal">
        <a href="#plataforma" onClick={() => setMenuOpen(false)}>Plataforma</a><a href="#soluciones" onClick={() => setMenuOpen(false)}>Soluciones</a><a href="#experiencias" onClick={() => setMenuOpen(false)}>Experiencias</a>
        <button type="button" className="nav-demo" onClick={openDemo}>Explorar demo <ArrowUpRight size={16} /></button>
      </nav>
    </div></header>
    <main>
      <section className="hero" id="inicio"><div className="hero-grid" aria-hidden="true" /><div className="hero-glow" aria-hidden="true" />
        <div className="container hero-inner"><div className="hero-copy reveal">
          <p className="eyebrow"><span className="eyebrow-line" /> UNA NUEVA FORMA DE VIVIR LA EMPRESA</p>
          <h1>Tu empresa,<br /><em>un mundo por</em><br />descubrir<span className="hero-period">.</span></h1>
          <p className="hero-lead">Transformamos la bienvenida, la capacitación y la comunicación interna en experiencias 3D interactivas que tus empleados pueden explorar.</p>
          <div className="hero-actions"><button type="button" className="button button-primary" onClick={openDemo}>Explorar demo interactiva <ArrowUpRight size={18} /></button><button type="button" className="button button-outline" onClick={() => goContact()}>Solicitar una demostración <ArrowRight size={17} /></button></div>
          <div className="hero-facts"><span><i /> Demo sin registro</span><span><i /> Funciona en el navegador</span><span><i /> Voces en castellano</span></div>
        </div>
        <div className="hero-preview reveal"><div className="preview-top"><span><i /> EXPERIENCIA REAL · {DEMO_COMPANY.name}</span><span>3D / INTERACTIVO</span></div><div className="preview-image" role="img" aria-label={`Vista real de la oficina 3D ${DEMO_COMPANY.name}`}><div className="preview-shine" /><div className="preview-badge"><Box size={18} /> OFICINA EXPLORABLE</div></div><div className="preview-bottom"><span>01 <b>/</b> EXPERIENCIA CORPORATIVA</span><button type="button" onClick={openDemo}>Entrar en la demo <ArrowUpRight size={16} /></button></div></div>
        </div><a className="hero-scroll" href="#plataforma"><ArrowDown size={15} /> DESCUBRÍ LA PLATAFORMA</a>
      </section>

      <section className="intro-section section" id="plataforma"><div className="container intro-grid"><div className="reveal"><p className="section-kicker">01 / LA PLATAFORMA</p><h2>La información cobra sentido <em>cuando se explora.</em></h2></div><div className="intro-copy reveal"><p>Convertimos espacios, procesos y contenidos de tu organización en un entorno corporativo interactivo al que se accede desde el navegador.</p><p>Tu equipo puede recorrer, descubrir e interactuar a su ritmo. La demo {DEMO_COMPANY.name} muestra hoy un recorrido de bienvenida con dos avatares, personajes, diálogos grabados y objetos para inspeccionar.</p><button type="button" className="text-link" onClick={openDemo}>Ver cómo funciona <ArrowUpRight size={18} /></button></div></div></section>

      <section className="features-section section"><div className="container"><div className="section-heading reveal"><div><p className="section-kicker">CAPACIDADES</p><h2>Una experiencia que <em>abre posibilidades.</em></h2></div><p>Empezamos por la oficina. Diseñamos el recorrido y los módulos alrededor de cada necesidad.</p></div><div className="feature-grid">{features.map(({icon: Icon,title,text,status},i) => <article key={title} className="feature-card reveal"><div className="feature-top"><Icon size={25} strokeWidth={1.7} /><span>{String(i+1).padStart(2,"0")}</span></div><h3>{title}</h3><p>{text}</p><span className={status === "Disponible en la demo" ? "status-pill is-live" : "status-pill"}>{status === "Disponible en la demo" ? <Check size={12} /> : <Sparkles size={12} />}{status}</span></article>)}</div></div></section>

      <section className="demo-section section" id="demo"><div className="container demo-section-inner"><div className="demo-section-copy reveal"><p className="section-kicker">02 / PROBALO VOS</p><h2>Entrá a una oficina.<br /><em>Salí con una idea nueva.</em></h2><p>La oficina {DEMO_COMPANY.name} es una demo interactiva real. Elegí a Fernando o Victoria, caminá por el espacio, conversá con Roxy y conocé a Alfredo de seguridad.</p><div className="control-list"><span><kbd>W A S D</kbd> Caminar</span><span><MousePointer2 size={15} /> Arrastrar para mirar</span><span><kbd>E</kbd> Interactuar</span><span><kbd>C</kbd> Cambiar cámara</span></div><p className="demo-inline-note">Elegí tu avatar y comenzá el recorrido acá mismo. Podés ampliar la ventana cuando quieras.</p><small>En celulares: controles táctiles para desplazarte y arrastrá sobre la escena para mirar.</small></div><DemoFrame /></div></section>

      <section className="steps-section section"><div className="container"><p className="section-kicker reveal">EL RECORRIDO</p><div className="section-heading reveal"><h2>Simple de empezar.<br /><em>Fácil de explorar.</em></h2><p>Una experiencia clara desde el primer clic.</p></div><div className="steps-grid">{steps.map(([number,title,text]) => <article className="step-card reveal" key={number}><span className="step-number">{number}</span><div className="step-rule" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

      <section className="solutions-section section" id="soluciones"><div className="container"><div className="section-heading reveal"><div><p className="section-kicker">03 / SOLUCIONES</p><h2>Tu espacio virtual, <em>a tu manera.</em></h2></div><p>Dos caminos para construir una experiencia útil para tu equipo. El alcance se define en cada proyecto.</p></div><div className="solution-grid"><article className="solution-card reveal"><span className="solution-index">SOLUCIÓN 01 <ArrowUpRight size={18} /></span><div className="solution-symbol"><Building2 size={38} strokeWidth={1.3} /></div><h3>Oficina virtual<br />preconfigurada</h3><p>Una base de oficina interactiva lista para adaptar con la identidad y el contenido de tu organización.</p><ul><li>Escenario 3D prediseñado</li><li>Logo, colores y bienvenida personalizados</li><li>Personajes y diálogos configurados</li><li>Recorrido de orientación</li><li>Módulos adicionales según necesidad</li></ul><button type="button" className="solution-link" onClick={() => goContact("Oficina virtual preconfigurada")}>Consultar por esta solución <ArrowRight size={17} /></button></article><article className="solution-card is-accent reveal"><span className="solution-index">SOLUCIÓN 02 <ArrowUpRight size={18} /></span><div className="solution-symbol"><Compass size={38} strokeWidth={1.3} /></div><h3>Oficina virtual<br />personalizada</h3><p>Diseñamos un entorno a medida a partir de fotografías, planos y referencias de tus instalaciones.</p><ul><li>Modelado y adaptación del entorno 3D</li><li>Identidad corporativa y sectores reales</li><li>Personajes y conversaciones personalizados</li><li>Orientación e información de seguridad</li><li>Capacitaciones o funciones especiales</li></ul><button type="button" className="solution-link" onClick={() => goContact("Oficina virtual personalizada")}>Solicitar presupuesto personalizado <ArrowRight size={17} /></button></article></div><p className="solutions-note reveal"><Layers3 size={18} /> Para proyectos de mayor escala podemos diseñar múltiples escenarios y módulos. Evaluamos el alcance técnico y creativo junto a cada empresa.</p></div></section>

      <section className="experience-section section" id="experiencias"><div className="container experience-layout"><div className="reveal"><p className="section-kicker">04 / EXPERIENCIAS</p><h2>Un entorno.<br /><em>Muchas maneras</em><br />de aprender.</h2><p>Podemos desarrollar nuevos contenidos sobre la misma base de oficina, sin reconstruirla desde cero para cada iniciativa.</p></div><div className="experience-list reveal">{experiences.map((item,i) => <div key={item}><span>{String(i+1).padStart(2,"0")}</span>{item}<MoveUpRight size={16} /></div>)}</div></div></section>

      <section className="benefits-section section"><div className="container"><p className="section-kicker reveal">POR QUÉ ELEGIR UNA EXPERIENCIA 3D</p><h2 className="reveal">Más que un recorrido.<br /><em>Una forma de conectar.</em></h2><div className="benefit-grid">{[[Sparkles,"Experiencias memorables","El empleado participa activamente desde el comienzo."],[Compass,"Aprendizaje mediante exploración","La información se descubre al recorrer e interactuar."],[Layers3,"Contenido reutilizable","Un mismo entorno puede recibir a distintos equipos."],[Building2,"Personalización corporativa","Espacios, personajes y contenidos adaptados a tu organización."],[GraduationCap,"Capacitación centralizada","Los módulos pueden reunirse en una misma experiencia."],[MousePointer2,"Acceso desde el navegador","Sin instalaciones adicionales en equipos compatibles."]].map(([Icon,title,body]) => <article className="benefit-card reveal" key={title}><Icon size={23} strokeWidth={1.7} /><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

      <section className="roadmap-section section"><div className="container roadmap-layout"><div className="reveal"><p className="section-kicker">EL FUTURO DEL PRODUCTO</p><h2>La experiencia de hoy es <em>solo el comienzo.</em></h2><p>Estas ideas forman parte de la evolución posible de la plataforma. No están disponibles en la demo actual y su implementación requiere desarrollo específico.</p></div><div className="roadmap-tags reveal">{roadmap.map(item => <span key={item}>{item}<ArrowUpRight size={14} /></span>)}</div></div></section>

      <section className="contact-section section" id="contacto"><div className="container contact-layout"><div className="contact-copy reveal"><p className="section-kicker">05 / HABLEMOS</p><h2>Llevemos tu empresa<br /><em>a una nueva dimensión.</em></h2><p>Contanos qué experiencia querés crear y diseñemos juntos una solución para tu organización.</p><div className="contact-aside"><Headphones size={20} /><span>Una conversación puede ser el comienzo de algo extraordinario.</span></div></div><ContactForm interest={contactInterest} /></div></section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><Brand compact /><p>Experiencias corporativas interactivas, diseñadas para descubrir y aprender.</p><div><a href="#inicio">Volver arriba ↑</a><span>© {new Date().getFullYear()} {PLATFORM.name} · {PLATFORM.status}</span></div></div></footer>
  </>;
}
