import { test } from "node:test";
import assert from "node:assert/strict";
import { createContactHandler, validateContact } from "./contact.mjs";

const valid = { name: "Ana Perez", company: "Ejemplo SA", email: "ana@ejemplo.com", role: "RRHH", interest: "Oficina virtual personalizada", message: "Queremos evaluar una oficina virtual para el equipo.", website: "" };

test("validates contact fields and rejects honeypot or header injection", () => {
  assert.equal(validateContact(valid)?.email, valid.email);
  assert.equal(validateContact({ ...valid, website: "spam.example" }), null);
  assert.equal(validateContact({ ...valid, email: "ana@ejemplo.com\r\nBcc: spam@example.com" }), null);
  assert.equal(validateContact({ ...valid, interest: "otro" }), null);
  assert.equal(validateContact({ ...valid, message: "corto" }), null);
});

test("unconfigured delivery never returns a fake success; rate limit is enforced", () => {
  const handler = createContactHandler({ now: () => 1000 });
  const call = body => {
    const req = { body, ip: "127.0.0.1", headers: {}, socket: {} };
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; return this; }, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    handler(req, res);
    return res;
  };
  assert.equal(call(valid).statusCode, 503);
  assert.equal(call(valid).data.ok, false);
  for (let i = 0; i < 4; i++) call(valid);
  assert.equal(call(valid).statusCode, 429);
});
