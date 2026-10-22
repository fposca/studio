import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const folder = fileURLToPath(new URL("../src/assets/neonboy-animaciones/club-de-rock/", import.meta.url));
const names = ["neon-boy-playing", "john-zool-playing", "lilith-9-playing", "revenant-playing",
  "lujan-playing", "rulo-palying", "charly-playing", "npc-drunk-playing", "diego-playing"];
const align4 = (number) => (number + 3) & ~3;

for (const name of (process.argv.length > 2 ? process.argv.slice(2) : names)) {
  const source = readFileSync(`${folder}${name}.glb`);
  if (source.toString("ascii", 0, 4) !== "glTF" || source.readUInt32LE(4) !== 2) throw new Error(`${name}: invalid GLB`);
  const jsonLength = source.readUInt32LE(12);
  const input = JSON.parse(source.toString("utf8", 20, 20 + jsonLength));
  if (input.buffers.length !== 1 || !input.animations?.length) throw new Error(`${name}: no embedded animation`);
  const binaryStart = 28 + jsonLength;
  const accessorIds = new Set(input.animations.flatMap((clip) => clip.samplers.flatMap((sampler) => [sampler.input, sampler.output])));
  const accessorMap = new Map([...accessorIds].map((id, index) => [id, index]));
  const viewIds = new Set([...accessorIds].map((id) => input.accessors[id].bufferView));
  if (viewIds.has(undefined) || [...accessorIds].some((id) => input.accessors[id].sparse)) throw new Error(`${name}: sparse animation not supported`);
  const viewMap = new Map([...viewIds].map((id, index) => [id, index]));
  const chunks = [];
  let length = 0;
  const bufferViews = [...viewIds].map((id) => {
    const view = input.bufferViews[id];
    if (view.buffer !== 0) throw new Error(`${name}: external animation buffer`);
    const start = align4(length);
    if (start > length) chunks.push(Buffer.alloc(start - length));
    const bytes = source.subarray(binaryStart + (view.byteOffset || 0), binaryStart + (view.byteOffset || 0) + view.byteLength);
    chunks.push(bytes);
    length = start + bytes.length;
    return { ...view, byteOffset: start };
  });
  const binary = Buffer.concat([...chunks, Buffer.alloc(align4(length) - length)]);
  const document = {
    asset: { version: "2.0", generator: "NeonBoy show clip extractor" },
    scene: input.scene,
    scenes: input.scenes,
    nodes: input.nodes.map(({ mesh, skin, camera, extensions, ...node }) => node),
    animations: input.animations.map((clip) => ({ ...clip, samplers: clip.samplers.map((sampler) => ({
      ...sampler, input: accessorMap.get(sampler.input), output: accessorMap.get(sampler.output),
    })) })),
    accessors: [...accessorIds].map((id) => ({ ...input.accessors[id], bufferView: viewMap.get(input.accessors[id].bufferView) })),
    bufferViews,
    buffers: [{ byteLength: binary.length }],
  };
  const json = Buffer.from(JSON.stringify(document));
  const paddedJson = Buffer.concat([json, Buffer.alloc(align4(json.length) - json.length, 0x20)]);
  const output = Buffer.alloc(28 + paddedJson.length + binary.length);
  output.write("glTF", 0, 4, "ascii");
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(output, 20);
  output.writeUInt32LE(binary.length, 20 + paddedJson.length);
  output.writeUInt32LE(0x004e4942, 24 + paddedJson.length);
  binary.copy(output, 28 + paddedJson.length);
  writeFileSync(`${folder}${name}.show-anim.glb`, output);
  console.log(`${name}: ${(source.length / 1048576).toFixed(1)} -> ${(output.length / 1048576).toFixed(2)} MiB`);
}
