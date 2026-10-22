import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpeg from "ffmpeg-static";

// Keep the original Meshy exports. The club already caps these textures at
// 1024px in the browser, so bake that same limit into delivery-size copies.
const directory = fileURLToPath(new URL("../src/assets/neonboy-animaciones/club-de-rock/", import.meta.url));
const names = ["diego", "maxi", "gera", "pablo", "claudia"];
const align4 = (length) => (length + 3) & ~3;

for (const name of names) {
  const source = readFileSync(`${directory}${name}.glb`);
  if (source.toString("ascii", 0, 4) !== "glTF" || source.readUInt32LE(4) !== 2) throw new Error(`${name}: invalid GLB`);
  const jsonLength = source.readUInt32LE(12);
  const document = JSON.parse(source.toString("utf8", 20, 20 + jsonLength));
  const binaryStart = 28 + jsonLength;
  if (source.readUInt32LE(20 + jsonLength + 4) !== 0x004e4942 || document.buffers.length !== 1) {
    throw new Error(`${name}: unsupported GLB buffer`);
  }
  const images = new Map((document.images || []).filter((image) => image.bufferView !== undefined)
    .map((image) => [image.bufferView, image]));
  const chunks = [];
  let binaryLength = 0;
  document.bufferViews = document.bufferViews.map((view, index) => {
    if (view.buffer !== 0) throw new Error(`${name}: external buffer view`);
    const image = images.get(index);
    let bytes = source.subarray(binaryStart + (view.byteOffset || 0), binaryStart + (view.byteOffset || 0) + view.byteLength);
    if (image?.mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      const width = bytes.readUInt32BE(16);
      const height = bytes.readUInt32BE(20);
      if (Math.max(width, height) > 1024) {
        const result = spawnSync(ffmpeg, ["-v", "error", "-threads", "2", "-f", "image2pipe", "-i", "pipe:0",
          "-vf", "scale=1024:1024:flags=lanczos", "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"],
        { input: bytes, maxBuffer: 32 * 1024 * 1024 });
        if (result.status !== 0 || !result.stdout.length) throw new Error(`${name}: ${result.stderr?.toString() || result.error}`);
        bytes = result.stdout;
      }
    }
    const start = align4(binaryLength);
    if (start > binaryLength) chunks.push(Buffer.alloc(start - binaryLength));
    chunks.push(bytes);
    binaryLength = start + bytes.length;
    return { ...view, byteOffset: start, byteLength: bytes.length };
  });
  const binary = Buffer.concat([...chunks, Buffer.alloc(align4(binaryLength) - binaryLength)]);
  document.buffers[0].byteLength = binary.length;
  const json = Buffer.from(JSON.stringify(document));
  const paddedJson = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
  const header = Buffer.alloc(20);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + binary.length, 8);
  header.writeUInt32LE(paddedJson.length, 12);
  header.write("JSON", 16, "ascii");
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0);
  binaryHeader.write("BIN\0", 4, "ascii");
  writeFileSync(`${directory}${name}.club.glb`, Buffer.concat([header, paddedJson, binaryHeader, binary]));
  console.log(`${name}: ${(source.length / 1048576).toFixed(1)} -> ${((header.length + paddedJson.length + binaryHeader.length + binary.length) / 1048576).toFixed(1)} MiB`);
}
