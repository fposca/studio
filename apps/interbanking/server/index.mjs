import express from "express";
import { createContactHandler } from "./contact.mjs";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "12kb", type: "application/json" }));
app.post("/api/contact", createContactHandler());
app.use((error, _req, res, _next) => {
  res.status(error.status || 400).json({ ok: false, message: "Solicitud inválida." });
});
const port = Number(process.env.CONTACT_PORT || 8787);
app.listen(port, "127.0.0.1", () => console.log(`Contact API listening on 127.0.0.1:${port}`));
