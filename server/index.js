import cors from "cors";
import express from "express";
import ffmpegPath from "ffmpeg-static";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import multer from "multer";
import potrace from "potrace";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const workDir = path.join(root, "server", "work");
const uploadDir = path.join(workDir, "uploads");
const outputDir = path.join(workDir, "outputs");

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const app = express();
const maxUploadMb = 100;
const upload = multer({ dest: uploadDir, limits: { fileSize: maxUploadMb * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/outputs", express.static(outputDir));

const cleanName = (value) =>
  String(value || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const outputUrl = (fileName) => `http://127.0.0.1:5174/outputs/${fileName}`;

function videoEffectFilter(effect, pixelSize = 12, effectAmount = 100, range = null) {
  const strength = Math.max(0, Math.min(2, Number(effectAmount ?? 100) / 100));
  const enabled = range ? `:enable='between(t,${range.start},${range.end})'` : "";
  if (effect === "pixel-art") {
    const size = Math.max(2, Math.min(64, Number(pixelSize) || 12));
    return `,scale=w=max(2\,trunc(iw/${size})):h=max(2\,trunc(ih/${size})):flags=neighbor,scale=w=iw*${size}:h=ih*${size}:flags=neighbor`;
  }
  if (effect === "mirror") return `,hflip${enabled}`;
  if (!strength || effect === "none") return "";
  if (effect === "grayscale") return `,hue=s=${Math.max(0, 1 - Math.min(1, strength))}${enabled}`;
  if (effect === "warm") return `,eq=saturation=${1 + 0.18 * strength}:gamma_r=${1 + 0.08 * strength}:gamma_b=${Math.max(0.5, 1 - 0.06 * strength)}${enabled}`;
  if (effect === "bright") return `,eq=brightness=${0.08 * strength}:contrast=${1 + 0.08 * strength}${enabled}`;
  if (effect === "blur") return `,boxblur=${Math.max(0.1, 2 * strength)}:1${enabled}`;
  if (effect === "sharpen") return `,unsharp=5:5:${0.9 * strength}:3:3:${0.4 * strength}${enabled}`;
  if (effect === "cool") return `,eq=gamma_b=${1 + 0.12 * strength}:gamma_r=${Math.max(0.5, 1 - 0.06 * strength)}:saturation=${1 + 0.1 * strength}${enabled}`;
  if (effect === "vintage") return `,curves=vintage${enabled},eq=saturation=${Math.max(0.3, 1 - 0.18 * strength)}:contrast=${1 + 0.08 * strength}${enabled}`;
  if (effect === "contrast") return `,eq=contrast=${1 + 0.35 * strength}:saturation=${1 + 0.08 * strength}${enabled}`;
  if (effect === "vignette") return `,vignette=PI/${Math.max(3, 10 - 3 * strength)}${enabled}`;
  if (effect === "invert") {
    const amount = Math.min(1, strength);
    return `,lutrgb=r='val*(1-${amount})+(255-val)*${amount}':g='val*(1-${amount})+(255-val)*${amount}':b='val*(1-${amount})+(255-val)*${amount}'${enabled}`;
  }
  return "";
}

function timedZoomFilter(effects, width, height) {
  const zoomEffects = (effects || []).filter((effect) => effect.type === "zoom-in" || effect.type === "zoom-out");
  if (!zoomEffects.length) return "";
  const terms = zoomEffects.map((effect) => {
    const duration = Math.max(0.1, effect.end - effect.start);
    const progress = `if(lt(in_time\\,${effect.start})\\,0\\,if(gte(in_time\\,${effect.end})\\,1\\,(in_time-${effect.start})/${duration}))`;
    const delta = Math.max(0, Math.min(2, Number(effect.amount || 0) / 100));
    return `${effect.type === "zoom-in" ? "+" : "-"}${delta}*(${progress})`;
  }).join("");
  return `,zoompan=z='max(1\\,1${terms})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=30`;
}

function animatedMaskFilter(clip, duration) {
  if (!clip.maskType || clip.maskType === "none") return "";
  const intro = clip.maskInDuration > 0 ? `min(1,max(0,T/${clip.maskInDuration}))` : "1";
  const outro = clip.maskOutDuration > 0 ? `min(1,max(0,(${duration}-T)/${clip.maskOutDuration}))` : "1";
  const progress = `min(${intro},${outro})`;
  if (clip.maskType === "fade") {
    return `,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*(${progress})'`;
  }
  let condition;
  if (clip.maskType === "circle") {
    condition = `lte((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2),pow(max(W,H)*0.72*(${progress}),2))`;
  } else if (clip.maskType === "rect") {
    condition = `between(X,W*(1-(${progress}))/2,W*(1+(${progress}))/2)*between(Y,H*(1-(${progress}))/2,H*(1+(${progress}))/2)`;
  } else if (clip.maskType === "diamond") {
    condition = `lte(abs(X-W/2)/(W/2)+abs(Y-H/2)/(H/2),2*(${progress}))`;
  } else if (clip.maskType === "wipe-right") {
    condition = `gte(X,W*(1-(${progress})))`;
  } else if (clip.maskType === "wipe-up") {
    condition = `gte(Y,H*(1-(${progress})))`;
  } else {
    condition = `lte(X,W*(${progress}))`;
  }
  return `,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(${condition},255,0)'`;
}

function escapeDrawText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/\r?\n/g, "\\n");
}

function videoFontFile(item) {
  const family = String(item.fontFamily || "Arial");
  const weight = Number(item.fontWeight || 400);
  const italic = Boolean(item.italic);
  const nearest = (variants) => Object.entries(variants).sort(([a], [b]) => Math.abs(Number(a) - weight) - Math.abs(Number(b) - weight))[0][1];
  const styled = (regular, bold, regularItalic = regular, boldItalic = bold) => italic ? (weight >= 600 ? boldItalic : regularItalic) : (weight >= 600 ? bold : regular);
  let file;

  if (family.includes("Lato")) {
    const normal = { 100: "Lato-Hairline.ttf", 200: "Lato-Thin.ttf", 300: "Lato-Light.ttf", 400: "Lato-Regular.ttf", 500: "Lato-Medium.ttf", 600: "Lato-Semibold.ttf", 700: "Lato-Bold.ttf", 800: "Lato-Heavy.ttf", 900: "Lato-Black.ttf" };
    const italics = { 100: "Lato-HairlineItalic.ttf", 200: "Lato-ThinItalic.ttf", 300: "Lato-LightItalic.ttf", 400: "Lato-Italic.ttf", 500: "Lato-MediumItalic.ttf", 600: "Lato-SemiboldItalic.ttf", 700: "Lato-BoldItalic.ttf", 800: "Lato-HeavyItalic.ttf", 900: "Lato-BlackItalic.ttf" };
    file = nearest(italic ? italics : normal);
  } else if (family.includes("Source Code")) {
    file = nearest({ 200: "SourceCodePro-ExtraLight.ttf", 300: "SourceCodePro-Light.ttf", 400: "SourceCodePro-Regular.ttf", 500: "SourceCodePro-Medium.ttf", 600: "SourceCodePro-Semibold.ttf", 700: "SourceCodePro-Bold.ttf", 900: "SourceCodePro-Black.ttf" });
  } else if (family.includes("Segoe")) {
    file = italic
      ? nearest({ 300: "seguili.ttf", 400: "segoeuii.ttf", 600: "seguisbi.ttf", 700: "segoeuiz.ttf", 900: "seguibli.ttf" })
      : nearest({ 300: "segoeuil.ttf", 400: "segoeui.ttf", 600: "seguisb.ttf", 700: "segoeuib.ttf", 900: "seguibl.ttf" });
  } else if (family.includes("Calibri")) file = italic ? nearest({ 300: "calibrili.ttf", 400: "calibrii.ttf", 700: "calibriz.ttf" }) : nearest({ 300: "calibril.ttf", 400: "calibri.ttf", 700: "calibrib.ttf" });
  else if (family.includes("Candara")) file = italic ? nearest({ 300: "Candarali.ttf", 400: "Candarai.ttf", 700: "Candaraz.ttf" }) : nearest({ 300: "Candaral.ttf", 400: "Candara.ttf", 700: "Candarab.ttf" });
  else if (family.includes("Corbel")) file = italic ? nearest({ 300: "corbelli.ttf", 400: "corbeli.ttf", 700: "corbelz.ttf" }) : nearest({ 300: "corbell.ttf", 400: "corbel.ttf", 700: "corbelb.ttf" });
  else if (family.includes("Bahnschrift")) file = "bahnschrift.ttf";
  else if (family.includes("Georgia")) file = styled("georgia.ttf", "georgiab.ttf", "georgiai.ttf", "georgiaz.ttf");
  else if (family.includes("Cambria")) file = styled("cambria.ttc", "cambriab.ttf", "cambriai.ttf", "cambriaz.ttf");
  else if (family.includes("Palatino")) file = styled("pala.ttf", "palab.ttf", "palai.ttf", "palabi.ttf");
  else if (family.includes("Times")) file = styled("times.ttf", "timesbd.ttf", "timesi.ttf", "timesbi.ttf");
  else if (family.includes("Tahoma")) file = weight >= 600 ? "tahomabd.ttf" : "tahoma.ttf";
  else if (family.includes("Trebuchet")) file = styled("trebuc.ttf", "trebucbd.ttf", "trebucit.ttf", "trebucbi.ttf");
  else if (family.includes("Verdana")) file = styled("verdana.ttf", "verdanab.ttf", "verdanai.ttf", "verdanaz.ttf");
  else if (family.includes("Courier")) file = styled("cour.ttf", "courbd.ttf", "couri.ttf", "courbi.ttf");
  else if (family.includes("Consolas")) file = styled("consola.ttf", "consolab.ttf", "consolai.ttf", "consolaz.ttf");
  else if (family.includes("Academico")) file = styled("Academico-Regular.otf", "Academico-Bold.otf", "Academico-Italic.otf", "Academico-BoldItalic.otf");
  else if (family.includes("Impact")) file = "impact.ttf";
  else if (weight >= 900 && !italic) file = "ariblk.ttf";
  else file = styled("arial.ttf", "arialbd.ttf", "ariali.ttf", "arialbi.ttf");

  const fontPath = path.join(process.env.WINDIR || "C:/Windows", "Fonts", file);
  return fontPath.replace(/\\/g, "/").replace(":", "\\:");
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ["-y", ...args], { windowsHide: true });
    let log = "";

    child.stderr.on("data", (chunk) => {
      log += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(log);
      else reject(new Error(log || `ffmpeg finished with code ${code}`));
    });
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ffmpeg: Boolean(ffmpegPath) });
});

app.post("/api/vectorize", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibio imagen." });

  const fileName = `${Date.now()}-${cleanName(req.file.originalname)}.svg`;
  const outPath = path.join(outputDir, fileName);
  const params = {
    threshold: Number(req.body.threshold || 180),
    turdSize: Number(req.body.turdSize || 80),
    color: req.body.color || "#111111",
    background: req.body.background || "transparent"
  };

  potrace.trace(req.file.path, params, (error, svg) => {
    fs.rm(req.file.path, { force: true }, () => {});
    if (error) return res.status(500).json({ error: error.message });
    fs.writeFileSync(outPath, svg, "utf8");
    res.json({ url: outputUrl(fileName), fileName });
  });
});

app.post("/api/video/trim", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio video." });
    const start = Math.max(0, Number(req.body.start || 0));
    const duration = Math.max(0.1, Number(req.body.duration || 5));
    const codec = req.body.codec === "h265" ? "libx265" : "libx264";
    const extension = req.body.format === "mov" ? "mov" : "mp4";
    const fileName = `${Date.now()}-trim.${extension}`;
    const outPath = path.join(outputDir, fileName);

    await runFfmpeg([
      "-ss",
      String(start),
      "-i",
      req.file.path,
      "-t",
      String(duration),
      "-c:v",
      codec,
      "-preset",
      "medium",
      "-crf",
      String(req.body.crf || 24),
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outPath
    ]);

    fs.rm(req.file.path, { force: true }, () => {});
    res.json({ url: outputUrl(fileName), fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/video/concat", upload.array("videos", 20), async (req, res) => {
  const files = req.files || [];
  const listPath = path.join(uploadDir, `${Date.now()}-concat.txt`);

  try {
    if (files.length < 2) return res.status(400).json({ error: "Subi al menos dos videos." });

    const listContent = files
      .map((file) => `file '${file.path.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
      .join("\n");
    fs.writeFileSync(listPath, listContent, "utf8");

    const codec = req.body.codec === "h265" ? "libx265" : "libx264";
    const fileName = `${Date.now()}-union.mp4`;
    const outPath = path.join(outputDir, fileName);

    await runFfmpeg([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c:v",
      codec,
      "-preset",
      "medium",
      "-crf",
      String(req.body.crf || 24),
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outPath
    ]);

    res.json({ url: outputUrl(fileName), fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    for (const file of files) fs.rm(file.path, { force: true }, () => {});
    fs.rm(listPath, { force: true }, () => {});
  }
});

app.post(
  "/api/video/timeline",
  upload.fields([
    { name: "videos", maxCount: 50 },
    { name: "audio", maxCount: 1 }
  ]),
  async (req, res) => {
    const videos = req.files?.videos || [];
    const audio = req.files?.audio?.[0] || null;
    const listPath = path.join(uploadDir, `${Date.now()}-timeline.txt`);
    const tempVideo = path.join(outputDir, `${Date.now()}-timeline-video.mp4`);

    try {
      if (!videos.length) return res.status(400).json({ error: "Subi al menos un video." });

      const codec = req.body.codec === "h265" ? "libx265" : "libx264";
      const extension = req.body.format === "mov" ? "mov" : "mp4";
      const allowedResolutions = new Set(["1920:1080", "1280:720", "854:480", "1080:1080", "1080:1920"]);
      const resolution = allowedResolutions.has(req.body.resolution) ? req.body.resolution : "1280:720";
      const [outW, outH] = resolution.split(":").map(Number);
      const muteOriginal = req.body.muteOriginal === "true";
      const clips = JSON.parse(req.body.clips || "[]").map((clip, index) => ({
        index,
        start: Math.max(0, Number(clip.start || 0)),
        in: Math.max(0, Number(clip.in || 0)),
        out: Math.max(0.1, Number(clip.out || 0.1)),
        track: Math.max(0, Number(clip.track || 0)),
        muted: clip.muted === true || clip.muted === "true",
        effect: clip.effect || "none",
        effectAmount: Math.max(0, Math.min(200, Number(clip.effectAmount ?? 100))),
        effects: Array.isArray(clip.effects) ? clip.effects.map((effect) => ({
          type: ["grayscale", "warm", "bright", "blur", "sharpen", "cool", "vintage", "contrast", "vignette", "invert", "zoom-in", "zoom-out"].includes(effect.type) ? effect.type : "grayscale",
          amount: Math.max(0, Math.min(200, Number(effect.amount ?? 100))),
          start: Math.max(0, Number(effect.start || 0)),
          end: Math.max(0.1, Number(effect.end || 0.1)),
          fadeIn: Math.max(0, Math.min(5, Number(effect.fadeIn ?? 0.3))),
          fadeOut: Math.max(0, Math.min(5, Number(effect.fadeOut ?? 0.3)))
        })).filter((effect) => effect.end > effect.start) : [],
        pixelSize: Math.max(2, Math.min(64, Number(clip.pixelSize || 12))),
        positionX: Math.max(-200, Math.min(200, Number(clip.positionX || 0))),
        positionY: Math.max(-200, Math.min(200, Number(clip.positionY || 0))),
        scale: Math.max(0.1, Math.min(4, Number(clip.scale || 1))),
        maskType: ["fade", "circle", "rect", "diamond", "wipe", "wipe-right", "wipe-up"].includes(clip.maskType) ? clip.maskType : "none",
        maskInDuration: Math.max(0, Number(clip.maskInDuration || 0)),
        maskOutDuration: Math.max(0, Number(clip.maskOutDuration || 0))
      }));
      const textOverlays = JSON.parse(req.body.textOverlays || "[]").map((item) => ({
        text: String(item.text || "").slice(0, 500),
        start: Math.max(0, Number(item.start || 0)),
        duration: Math.max(0.1, Number(item.duration || 0.1)),
        x: Math.max(0, Math.min(100, Number(item.x ?? 50))),
        y: Math.max(0, Math.min(100, Number(item.y ?? 82))),
        fontSize: Math.max(10, Math.min(300, Number(item.fontSize || 54))),
        color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color.slice(1) : "ffffff",
        fontFamily: String(item.fontFamily || "Arial, sans-serif"),
        fontWeight: Math.max(300, Math.min(900, Number(item.fontWeight || 700))),
        italic: Boolean(item.italic),
        shadow: Boolean(item.shadow),
        shadowColor: /^#[0-9a-f]{6}$/i.test(item.shadowColor) ? item.shadowColor.slice(1) : "000000",
        shadowBlur: Math.max(0, Math.min(40, Number(item.shadowBlur || 0))),
        shadowX: Math.max(-100, Math.min(100, Number(item.shadowX || 0))),
        shadowY: Math.max(-100, Math.min(100, Number(item.shadowY || 0)))
      }));
      const timelineClips = clips.length === videos.length ? clips : videos.map((_file, index) => ({ index, start: index * 5, in: 0, out: 5, track: 0, muted: false, effect: "none" }));
      const totalDuration = Math.max(0.1, ...timelineClips.map((clip) => clip.start + Math.max(0.1, clip.out - clip.in)), ...textOverlays.map((item) => item.start + item.duration));
      const fileName = `${Date.now()}-timeline.${extension}`;
      const outPath = path.join(outputDir, fileName);
      const videoArgs = videos.flatMap((file) => ["-i", file.path]);
      const videoFilters = [
        `color=c=black:s=${outW}x${outH}:d=${totalDuration}[base]`,
        ...timelineClips.flatMap((clip) => {
          const duration = Math.max(0.1, clip.out - clip.in);
          const clipW = Math.max(2, Math.round(outW * (clip.scale || 1) / 2) * 2);
          const clipH = Math.max(2, Math.round(outH * (clip.scale || 1) / 2) * 2);
          const filters = [];
          let currentLabel = `clipbase${clip.index}`;
          filters.push(`[${clip.index}:v]trim=start=${clip.in}:duration=${duration},setpts=PTS-STARTPTS,scale=${clipW}:${clipH}:force_original_aspect_ratio=decrease${timedZoomFilter(clip.effects, clipW, clipH)}${videoEffectFilter(clip.effect, clip.pixelSize, clip.effectAmount)}[${currentLabel}]`);
          (clip.effects || []).filter((effect) => effect.type !== "zoom-in" && effect.type !== "zoom-out").forEach((effect, effectIndex) => {
            const sourceLabel = `fxsource${clip.index}_${effectIndex}`;
            const processLabel = `fxprocess${clip.index}_${effectIndex}`;
            const filteredLabel = `fxfiltered${clip.index}_${effectIndex}`;
            const outputLabel = `fxout${clip.index}_${effectIndex}`;
            const span = Math.max(0.1, effect.end - effect.start);
            const fadeIn = Math.min(effect.fadeIn, span / 2);
            const fadeOut = Math.min(effect.fadeOut, span / 2);
            const rise = fadeIn > 0 ? `(T-${effect.start})/${fadeIn}` : "1";
            const fall = fadeOut > 0 ? `(${effect.end}-T)/${fadeOut}` : "1";
            const mix = `if(lt(T\\,${effect.start})\\,0\\,if(lt(T\\,${effect.start + fadeIn})\\,${rise}\\,if(lt(T\\,${effect.end - fadeOut})\\,1\\,if(lt(T\\,${effect.end})\\,${fall}\\,0))))`;
            filters.push(`[${currentLabel}]split[${sourceLabel}][${processLabel}]`);
            filters.push(`[${processLabel}]${videoEffectFilter(effect.type, 12, effect.amount).slice(1)}[${filteredLabel}]`);
            filters.push(`[${sourceLabel}][${filteredLabel}]blend=all_expr='A*(1-(${mix}))+B*(${mix})'[${outputLabel}]`);
            currentLabel = outputLabel;
          });
          filters.push(`[${currentLabel}]${animatedMaskFilter(clip, duration).replace(/^,/, "") || "null"},setpts=PTS+${clip.start}/TB[v${clip.index}]`);
          return filters;
        })
      ];
      let previousVideo = "base";
      timelineClips
        .sort((a, b) => a.track - b.track || a.start - b.start)
        .forEach((clip, order) => {
          const outLabel = `mixv${order}`;
          const offsetX = Math.round(outW * (clip.positionX || 0) / 100);
          const offsetY = Math.round(outH * (clip.positionY || 0) / 100);
          videoFilters.push(`[${previousVideo}][v${clip.index}]overlay=x=(main_w-overlay_w)/2+${offsetX}:y=(main_h-overlay_h)/2+${offsetY}:shortest=0:eof_action=pass[${outLabel}]`);
          previousVideo = outLabel;
        });
      textOverlays.forEach((item, index) => {
        const outLabel = `textv${index}`;
        const fontSize = Math.max(10, Math.round(item.fontSize * outH / 1080));
        const fontFile = videoFontFile(item);
        const escapedText = escapeDrawText(item.text);
        const enable = `between(t,${item.start},${item.start + item.duration})`;
        if (item.shadow) {
          const shadowLayer = `shadowlayer${index}`;
          const shadowComposite = `shadowmix${index}`;
          const blur = Math.max(0.1, item.shadowBlur * outH / 1080);
          const shadowX = item.shadowX * outW / 1920;
          const shadowY = item.shadowY * outH / 1080;
          videoFilters.push(`color=c=black@0.0:s=${outW}x${outH}:d=${totalDuration},format=rgba,drawtext=fontfile='${fontFile}':text='${escapedText}':fontcolor=0x${item.shadowColor}:fontsize=${fontSize}:x=w*${item.x}/100-text_w/2+${shadowX}:y=h*${item.y}/100-text_h/2+${shadowY}:enable='${enable}',boxblur=luma_radius=${blur}:luma_power=1:chroma_radius=${blur}:chroma_power=1:alpha_radius=${blur}:alpha_power=1[${shadowLayer}]`);
          videoFilters.push(`[${previousVideo}][${shadowLayer}]overlay=shortest=1[${shadowComposite}]`);
          previousVideo = shadowComposite;
        }
        videoFilters.push(`[${previousVideo}]drawtext=fontfile='${fontFile}':text='${escapedText}':fontcolor=0x${item.color}:fontsize=${fontSize}:x=w*${item.x}/100-text_w/2:y=h*${item.y}/100-text_h/2:enable='${enable}'[${outLabel}]`);
        previousVideo = outLabel;
      });
      videoFilters.push(`[${previousVideo}]null[vout]`);

      const audioFilters = [];
      const audibleClips = timelineClips.filter((clip) => !clip.muted);
      if (!audio && !muteOriginal) {
        audibleClips.forEach((clip) => {
          const duration = Math.max(0.1, clip.out - clip.in);
          const delay = Math.round(clip.start * 1000);
          audioFilters.push(`[${clip.index}:a]atrim=start=${clip.in}:duration=${duration},asetpts=PTS-STARTPTS,adelay=${delay}|${delay}[a${clip.index}]`);
        });
        if (audibleClips.length) {
          audioFilters.push(`${audibleClips.map((clip) => `[a${clip.index}]`).join("")}amix=inputs=${audibleClips.length}:duration=longest[aout]`);
        }
      }

      if (audio) {
        videoArgs.push(
          "-filter_complex",
          videoFilters.join(";"),
          "-map",
          "[vout]",
          "-an",
          "-c:v",
          codec,
          "-preset",
          "medium",
          "-crf",
          String(req.body.crf || 24),
          tempVideo
        );
        await runFfmpeg(videoArgs);
        await runFfmpeg([
          "-i",
          tempVideo,
          "-i",
          audio.path,
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-shortest",
          "-movflags",
          "+faststart",
          outPath
        ]);
      } else {
        videoArgs.push(
          "-filter_complex",
          [...videoFilters, ...audioFilters].join(";"),
          "-map",
          "[vout]",
          ...(!muteOriginal && audibleClips.length ? ["-map", "[aout]"] : []),
          "-c:v",
          codec,
          "-preset",
          "medium",
          "-crf",
          String(req.body.crf || 24),
          muteOriginal ? "-an" : "-c:a",
          muteOriginal ? undefined : "aac",
          "-movflags",
          "+faststart",
          outPath
        );
        await runFfmpeg(videoArgs.filter(Boolean));
      }

      res.json({ url: outputUrl(fileName), fileName });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      for (const file of videos) fs.rm(file.path, { force: true }, () => {});
      if (audio) fs.rm(audio.path, { force: true }, () => {});
      fs.rm(listPath, { force: true }, () => {});
      fs.rm(tempVideo, { force: true }, () => {});
    }
  }
);

app.post("/api/video/export", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio video." });
    const codec = req.body.codec === "h265" ? "libx265" : "libx264";
    const extension = req.body.format === "mov" ? "mov" : "mp4";
    const resolution = req.body.resolution || "source";
    const fileName = `${Date.now()}-export.${extension}`;
    const outPath = path.join(outputDir, fileName);
    const args = ["-i", req.file.path];

    if (resolution !== "source") {
      args.push("-vf", `scale=${resolution}`);
    }

    args.push(
      "-c:v",
      codec,
      "-preset",
      "medium",
      "-crf",
      String(req.body.crf || 24),
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outPath
    );

    await runFfmpeg(args);
    fs.rm(req.file.path, { force: true }, () => {});
    res.json({ url: outputUrl(fileName), fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: `El archivo supera el limite de ${maxUploadMb} MB.` });
  }
  return next(error);
});

app.listen(5174, () => {
  console.log("API lista en http://127.0.0.1:5174");
});
