import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

const directory = fileURLToPath(new URL("../src/assets/neonboy-animaciones/", import.meta.url));
const models = ["vendedor", "metalero", "mujer-quieta", "freddy-quieto", "jason-respirado", "esuqeleto-bailando", "neon-inactivo-hd"];
const align4 = (value) => (value + 3) & ~3;

for (const name of models) {
  const source = readFileSync(`${directory}${name}.glb`);
  if (source.toString("ascii", 0, 4) !== "glTF" || source.readUInt32LE(4) !== 2) throw new Error(`GLB inválido: ${name}`);
  const jsonLength = source.readUInt32LE(12);
  const gltf = JSON.parse(source.toString("utf8", 20, 20 + jsonLength));
  const binaryHeader = 20 + jsonLength;
  if (source.readUInt32LE(binaryHeader + 4) !== 0x004e4942 || gltf.buffers.length !== 1) throw new Error(`BIN inválido: ${name}`);
  const binaryStart = binaryHeader + 8;
  const reduced = new Map();
  for (const image of gltf.images || []) {
    if (image.mimeType !== "image/png" || image.bufferView == null) continue;
    const view = gltf.bufferViews[image.bufferView];
    const offset = binaryStart + (view.byteOffset || 0);
    const original = source.subarray(offset, offset + view.byteLength);
    const width = original.readUInt32BE(16);
    if (width <= 1024) continue;
    const result = spawnSync(ffmpeg, ["-v", "error", "-threads", "2", "-f", "image2pipe", "-i", "pipe:0", "-vf", "scale=1024:1024:flags=lanczos", "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"], { input: original, maxBuffer: 32 * 1024 * 1024 });
    if (result.status !== 0) throw new Error(`${name}: ${result.stderr?.toString() || result.error}`);
    reduced.set(image.bufferView, result.stdout);
  }
  const chunks = [];
  let position = 0;
  gltf.bufferViews.forEach((view, index) => {
    if (view.buffer !== 0) throw new Error(`Buffer externo: ${name}`);
    const bytes = reduced.get(index) || source.subarray(binaryStart + (view.byteOffset || 0), binaryStart + (view.byteOffset || 0) + view.byteLength);
    position = align4(position);
    chunks.push({ position, bytes });
    view.byteOffset = position;
    view.byteLength = bytes.length;
    position += bytes.length;
  });
  const binaryLength = align4(position);
  gltf.buffers[0].byteLength = binaryLength;
  const json = Buffer.from(JSON.stringify(gltf));
  const jsonLengthPadded = align4(json.length);
  const output = Buffer.alloc(12 + 8 + jsonLengthPadded + 8 + binaryLength);
  output.write("glTF", 0, 4, "ascii");
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonLengthPadded, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  output.fill(0x20, 20, 20 + jsonLengthPadded);
  json.copy(output, 20);
  output.writeUInt32LE(binaryLength, 20 + jsonLengthPadded);
  output.writeUInt32LE(0x004e4942, 24 + jsonLengthPadded);
  for (const chunk of chunks) chunk.bytes.copy(output, 28 + jsonLengthPadded + chunk.position);
  writeFileSync(`${directory}${name}.store.glb`, output);
  console.log(`${name}: ${(source.length / 1048576).toFixed(1)} MB → ${(output.length / 1048576).toFixed(1)} MB`);
}
