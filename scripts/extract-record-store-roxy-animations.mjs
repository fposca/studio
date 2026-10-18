import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const assetDirectory = fileURLToPath(new URL("../src/assets/neonboy-animaciones/", import.meta.url));
const sources = process.argv.slice(2).length ? process.argv.slice(2) : ["mujer-caminando", "mujer-tocando-guitarra", "freddy-caminar", "jason-walk", "esqueleto-sosteniendo-disco-holyFire", "neonBoy-walking-alta", "neonboy-new-walk", "neonboy-new-jump", "newJump"];
const align4 = (value) => (value + 3) & ~3;

function extractAnimation(name) {
  const input = readFileSync(`${assetDirectory}${name}.glb`);
  if (input.toString("utf8", 0, 4) !== "glTF" || input.readUInt32LE(4) !== 2) throw new Error(`GLB invÃ¡lido: ${name}`);
  const jsonLength = input.readUInt32LE(12);
  const gltf = JSON.parse(input.toString("utf8", 20, 20 + jsonLength));
  const binaryHeader = 20 + jsonLength;
  if (input.readUInt32LE(binaryHeader + 4) !== 0x004e4942) throw new Error(`Falta BIN: ${name}`);
  const binaryStart = binaryHeader + 8;
  const animations = structuredClone(gltf.animations || []);
  if (name === "neonboy-new-walk" || name === "neonboy-new-jump") {
    const idle = readFileSync(assetDirectory + "neon-inactivo-hd.glb");
    const idleJsonLength = idle.readUInt32LE(12);
    const idleGltf = JSON.parse(idle.toString("utf8", 20, 20 + idleJsonLength));
    const compatibleBones = new Set(idleGltf.nodes.map((node) => node.name));
    for (const animation of animations) {
      const channels = animation.channels.filter((channel) => compatibleBones.has(gltf.nodes[channel.target.node]?.name));
      const usedSamplers = [...new Set(channels.map((channel) => channel.sampler))];
      const samplerMap = new Map(usedSamplers.map((id, index) => [id, index]));
      animation.channels = channels.map((channel) => ({ ...channel, sampler: samplerMap.get(channel.sampler) }));
      animation.samplers = usedSamplers.map((id) => animation.samplers[id]);
    }
  }
  if (!animations.length) throw new Error(`No hay animaciÃ³n: ${name}`);

  const accessorIds = [...new Set(animations.flatMap(({ samplers }) => samplers.flatMap(({ input, output }) => [input, output])))];
  const viewIds = [...new Set(accessorIds.map((id) => gltf.accessors[id].bufferView))];
  const views = [];
  const chunks = [];
  let binaryLength = 0;
  for (const id of viewIds) {
    const source = gltf.bufferViews[id];
    if (source.buffer !== 0) throw new Error(`Buffer externo inesperado: ${name}`);
    binaryLength = align4(binaryLength);
    const data = input.subarray(binaryStart + (source.byteOffset || 0), binaryStart + (source.byteOffset || 0) + source.byteLength);
    chunks.push({ offset: binaryLength, data });
    const { buffer, byteOffset, ...rest } = source;
    views.push({ ...rest, buffer: 0, byteOffset: binaryLength });
    binaryLength += data.length;
  }
  const viewMap = new Map(viewIds.map((id, index) => [id, index]));
  const accessorMap = new Map(accessorIds.map((id, index) => [id, index]));
  const accessors = accessorIds.map((id) => {
    const source = gltf.accessors[id];
    if (source.sparse) throw new Error(`Accessor disperso inesperado: ${name}`);
    return { ...source, bufferView: viewMap.get(source.bufferView) };
  });
  for (const animation of animations) for (const sampler of animation.samplers) {
    sampler.input = accessorMap.get(sampler.input);
    sampler.output = accessorMap.get(sampler.output);
  }

  const nodes = gltf.nodes.map((node) => {
    const copy = { ...node };
    delete copy.mesh;
    delete copy.skin;
    return copy;
  });
  const output = {
    asset: gltf.asset,
    scene: gltf.scene,
    scenes: gltf.scenes,
    nodes,
    animations,
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: align4(binaryLength) }]
  };
  const json = Buffer.from(JSON.stringify(output));
  const jsonPadded = align4(json.length);
  const binaryPadded = align4(binaryLength);
  const result = Buffer.alloc(12 + 8 + jsonPadded + 8 + binaryPadded);
  result.write("glTF", 0, 4, "ascii");
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(jsonPadded, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  result.fill(0x20, 20, 20 + jsonPadded);
  json.copy(result, 20);
  result.writeUInt32LE(binaryPadded, 20 + jsonPadded);
  result.writeUInt32LE(0x004e4942, 24 + jsonPadded);
  for (const { offset, data } of chunks) data.copy(result, 28 + jsonPadded + offset);
  writeFileSync(`${assetDirectory}${name}.anim.glb`, result);
  console.log(`${name}: ${(input.length / 1024 / 1024).toFixed(1)} MB â†’ ${(result.length / 1024 / 1024).toFixed(2)} MB`);
}

for (const name of sources) extractAnimation(name);
