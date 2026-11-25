import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const OPTIONS = ["Oficina virtual preconfigurada", "Oficina virtual personalizada", "Capacitación interactiva", "Consultar otra solución"];

export default function ContactForm({ interest }) {
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  useEffect(() => { if (interest) setSelected(interest); }, [interest]);
  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || "No pudimos enviar tu consulta. Intentá de nuevo más tarde.");
      setStatus("success"); setMessage("Recibimos tu consulta. Te responderemos al correo que indicaste."); form.reset(); setSelected("");
    } catch (error) { setStatus("error"); setMessage(error.message || "No pudimos enviar tu consulta."); }
  }
  return <form className="contact-form reveal" onSubmit={submit} aria-label="Formulario de contacto">
    <div className="form-heading"><span>INICIEMOS UNA CONVERSACIÓN</span><CheckCircle2 size={21} /></div>
    <div className="form-grid"><label>Nombre y apellido <input name="name" required minLength="2" maxLength="100" autoComplete="name" placeholder="Tu nombre completo" /></label><label>Empresa <input name="company" required minLength="2" maxLength="120" autoComplete="organization" placeholder="Nombre de tu empresa" /></label></div>
    <div className="form-grid"><label>Email corporativo <input name="email" type="email" required maxLength="254" autoComplete="email" placeholder="nombre@empresa.com" /></label><label>Cargo o área <input name="role" required minLength="2" maxLength="100" autoComplete="organization-title" placeholder="Tu cargo o área" /></label></div>
    <label>Tipo de solución de interés <select name="interest" required value={selected} onChange={event => setSelected(event.target.value)}><option value="">Seleccioná una opción</option>{OPTIONS.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    <label>Tu mensaje <textarea name="message" required minLength="10" maxLength="3000" rows="5" placeholder="Contanos un poco sobre tu idea, equipo o proyecto…" /></label>
    <div className="form-trap" aria-hidden="true"><label>Sitio web <input name="website" tabIndex="-1" autoComplete="off" /></label></div>
    <p className="privacy-note">Usaremos estos datos para responder tu consulta comercial. El formulario no crea una cuenta ni guarda progreso de la demo.</p>
    <button type="submit" className="button button-primary" disabled={status === "sending"}>{status === "sending" ? "Enviando…" : "Enviar consulta"}<ArrowRight size={18} /></button>
    {message && <p className={status === "success" ? "form-feedback is-success" : "form-feedback is-error"} role="status">{message}</p>}
  </form>;
}
