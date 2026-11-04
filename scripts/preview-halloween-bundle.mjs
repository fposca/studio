import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const workspace = resolve(fileURLToPath(new URL("../", import.meta.url)));
const extractedBundle = resolve(workspace, "neonboy-halloween-discografia");
const bundle = existsSync(resolve(extractedBundle, "index.html")) ? extractedBundle : resolve(workspace, "dist-halloween");
if (!existsSync(resolve(bundle, "index.html"))) {
  console.error("No encuentro el build de Halloween. Extraé el ZIP corregido o ejecutá build:halloween.");
  process.exit(1);
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const server = createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end("Ruta inválida"); return; }
  if (pathname === "/") { response.writeHead(302, { Location: "/discografia/" }).end(); return; }
  if (!pathname.startsWith("/discografia/")) { response.writeHead(404).end(); return; }
  const relative = pathname.slice("/discografia/".length) || "index.html";
  const file = resolve(bundle, relative);
  if (!file.startsWith(bundle + sep) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "Content-Type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
});

server.listen(0, "127.0.0.1", () => {
  const address = `http://127.0.0.1:${server.address().port}/discografia/`;
  console.log(`Halloween listo: ${address}`);
  console.log("Cerrá esta ventana cuando termines de probarlo.");
  if (process.platform === "win32" && !process.env.HALLOWEEN_NO_BROWSER) {
    const opener = spawn("cmd.exe", ["/c", "start", '""', address], { windowsHide: true, stdio: "ignore" });
    opener.unref();
  }
});
