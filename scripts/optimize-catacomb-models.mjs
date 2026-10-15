import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const models = ["mummy-walk", "mummy-chief-walk", "platon", "ballesta", "guadana"];
const align4 = (length) => (length + 3) & ~3;
for (const name of models) {
  const folder = resolve("src/assets/neonboy-animaciones");
  const source = await readFile(resolve(folder, `${name}.glb`));
  if (source.toString("ascii", 0, 4) !== "glTF") throw new Error(`${name}: invalid GLB`);
  const jsonLength = source.readUInt32LE(12);
  const document = JSON.parse(source.toString("utf8", 20, 20 + jsonLength));
  const binaryStart = 28 + jsonLength;
  const imageByView = new Map((document.images || []).filter((image) => image.bufferView !== undefined)
    .map((image) => [image.bufferView, image]));
  const originalViews = document.bufferViews;
  const chunks = [];
  let binaryLength = 0;
  document.bufferViews = originalViews.map((view, index) => {
    const image = imageByView.get(index);
    let bytes = source.subarray(binaryStart + (view.byteOffset || 0), binaryStart + (view.byteOffset || 0) + view.byteLength);
    if (image) {
      const jpeg = image.mimeType === "image/jpeg";
      const result = spawnSync(ffmpegPath, ["-loglevel", "error", "-i", "pipe:0", "-vf", "scale=1024:-1:flags=lanczos",
        "-frames:v", "1", ...(jpeg ? ["-q:v", "5"] : []), "-f", "image2pipe", "-vcodec", jpeg ? "mjpeg" : "png", "pipe:1"],
      { input: bytes, maxBuffer: 24 * 1024 * 1024 });
      if (result.status !== 0 || !result.stdout.length) throw new Error(`${name}: texture conversion failed: ${result.stderr}`);
      bytes = result.stdout;
    }
    const start = align4(binaryLength);
    if (start > binaryLength) chunks.push(Buffer.alloc(start - binaryLength));
    chunks.push(bytes);
    binaryLength = start + bytes.length;
    return { ...view, byteOffset: start, byteLength: bytes.length };
  });
  const binary = Buffer.concat([...chunks, Buffer.alloc(align4(binaryLength) - binaryLength)]);
  document.buffers[0].byteLength = binary.length;
  document.asset.generator = `${document.asset.generator || "GLB"} / catacomb textures 1024`;
  const json = Buffer.from(JSON.stringify(document));
  const paddedJson = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
  const header = Buffer.alloc(20);
  header.write("glTF", 0, "ascii"); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + binary.length, 8);
  header.writeUInt32LE(paddedJson.length, 12); header.write("JSON", 16, "ascii");
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0); binaryHeader.write("BIN\0", 4, "ascii");
  await writeFile(resolve(folder, `${name}.game.glb`), Buffer.concat([header, paddedJson, binaryHeader, binary]));
  process.stdout.write(`${name}: ${(source.length / 1e6).toFixed(1)} MB -> ${((12 + 8 + paddedJson.length + 8 + binary.length) / 1e6).toFixed(1)} MB\n`);
}
