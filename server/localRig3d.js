import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

export function registerLocalRig3dRoutes(app, { workDir, outputDir, outputUrl, upload }) {
  const localDir = path.join(workDir, "local-ai");
  const jobs = new Map();

  const rigRepo = path.join(localDir, "SkinTokens");
  const rigPython = path.join(rigRepo, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  const rigReady = () => fs.existsSync(rigPython)
    && fs.existsSync(path.join(rigRepo, "demo.py"))
    && fs.existsSync(path.join(rigRepo, "experiments/articulation_xl_quantization_256_token_4/grpo_1400.ckpt"));

  app.get("/api/three/local-rig3d/status", (_req, res) => {
    res.json({ ready: rigReady(), running: [...jobs.values()].some((job) => job.status === "running") });
  });

  app.post("/api/three/local-rig3d", upload.single("model"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Selecciona un modelo GLB." });
    const header = Buffer.alloc(4);
    const handle = fs.openSync(req.file.path, "r");
    try { fs.readSync(handle, header, 0, 4, 0); } finally { fs.closeSync(handle); }
    if (header.toString("ascii") !== "glTF") {
      fs.rmSync(req.file.path, { force: true });
      return res.status(400).json({ error: "El archivo no es un GLB valido." });
    }
    if (!rigReady()) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(503).json({ error: "El motor de esqueleto local no esta instalado." });
    }
    if ([...jobs.values()].some((job) => job.status === "running")) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(409).json({ error: "La GPU ya esta ocupada generando otro modelo." });
    }

    const id = randomUUID();
    const jobDir = path.join(localDir, "jobs", id);
    const input = path.join(jobDir, "model.glb");
    const result = path.join(jobDir, "rigged.glb");
    const outputName = `${id}-rigged.glb`;
    const job = { id, status: "running", stage: "Preparando malla", error: null, url: null, log: "" };
    try {
      fs.mkdirSync(jobDir, { recursive: true });
      fs.renameSync(req.file.path, input);
      const run = (attempt) => {
        const child = spawn(rigPython, [
          "demo.py", "--input", input, "--output", result, "--use_transfer", "--num_beams", attempt ? "2" : "1"
        ], { cwd: rigRepo, windowsHide: true, env: { ...process.env, PYTHONUNBUFFERED: "1" } });
        let attemptLog = "";
        const onOutput = (chunk) => {
          attemptLog = (attemptLog + chunk.toString()).slice(-8192);
          job.log = (job.log + chunk.toString()).slice(-8192);
          if (attemptLog.includes("Loading model")) job.stage = "Cargando motor de esqueleto";
          if (attemptLog.includes("received load path")) job.stage = "Analizando geometria";
          if (attemptLog.includes("received transfer path")) job.stage = "Asignando huesos y pesos";
          if (attemptLog.includes("Starting glTF 2.0 export")) job.stage = "Guardando modelo articulado";
        };
        child.stdout.on("data", onOutput);
        child.stderr.on("data", onOutput);
        child.on("error", (error) => { job.status = "failed"; job.error = error.message; });
        child.on("close", (code) => {
          if (job.status !== "failed" && code === 0 && fs.existsSync(result)) {
            try {
              fs.copyFileSync(result, path.join(outputDir, outputName));
              job.status = "done";
              job.stage = "Esqueleto listo";
              job.url = outputUrl(outputName);
            } catch (error) {
              job.status = "failed";
              job.error = error.message;
            }
          } else if (job.status !== "failed" && attempt === 0 && attemptLog.includes("AssertionError")) {
            fs.rmSync(result, { force: true });
            job.stage = "Reintentando esqueleto";
            setTimeout(() => run(1), 1500);
            return;
          } else if (job.status !== "failed") {
            job.status = "failed";
            job.error = "No se pudo articular esta malla. Prueba con otro modelo.";
          }
          fs.rm(jobDir, { recursive: true, force: true }, () => {});
        });
      };
      run(0);
      jobs.set(id, job);
      res.status(202).json({ id, status: job.status });
    } catch (error) {
      fs.rm(req.file.path, { force: true }, () => {});
      fs.rm(jobDir, { recursive: true, force: true }, () => {});
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/three/local-rig3d/:id", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: "Tarea no encontrada." });
    const { id, status, stage, error, url } = job;
    res.json({ id, status, stage, error, url, diagnostic: status === "failed" ? job.log : undefined });
  });
}
