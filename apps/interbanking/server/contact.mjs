const allowedInterests = new Set(["Oficina virtual preconfigurada", "Oficina virtual personalizada", "Capacitación interactiva", "Consultar otra solución"]);
const emailPattern = /^[^\s@\r\n<>]+@[^\s@\r\n<>]+\.[^\s@\r\n<>]+$/;

function clean(value, max) {
  if (typeof value !== "string" || value.length > max) return "";
  return value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function validateContact(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (typeof body.website !== "string" || body.website.trim()) return null;
  const name = clean(body.name, 100), company = clean(body.company, 120);
  const email = clean(body.email, 254), role = clean(body.role, 100);
  const interest = clean(body.interest, 80), message = clean(body.message, 3000);
  if (name.length < 2 || company.length < 2 || role.length < 2 || message.length < 10) return null;
  if (!emailPattern.test(email) || !allowedInterests.has(interest)) return null;
  if (/[\r\n]/.test(body.email) || /[\r\n]/.test(body.name) || /[\r\n]/.test(body.company)) return null;
  return { name, company, email, role, interest, message };
}

export function createContactHandler({ now = Date.now } = {}) {
  const attempts = new Map();
  return function contactHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const origin = req.headers.origin;
    if (origin && process.env.CONTACT_ALLOWED_ORIGIN && origin !== process.env.CONTACT_ALLOWED_ORIGIN) return res.status(403).json({ ok: false, message: "Origen no permitido." });
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const current = now();
    if (attempts.size > 1000) for (const [key, value] of attempts) if (current - value.start > 3600000) attempts.delete(key);
    const record = attempts.get(ip) || { start: current, count: 0 };
    if (current - record.start > 3600000) { record.start = current; record.count = 0; }
    record.count += 1; attempts.set(ip, record);
    if (record.count > 5) return res.status(429).json({ ok: false, message: "Demasiados intentos. Probá de nuevo más tarde." });
    const data = validateContact(req.body);
    if (!data) return res.status(400).json({ ok: false, message: "Revisá los datos del formulario e intentá de nuevo." });
    return res.status(503).json({ ok: false, message: "El formulario todavía no está disponible. Intentá más tarde." });
  };
}
