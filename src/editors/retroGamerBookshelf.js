import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const BOOKS = [
  { title: ["DUNE"], author: "FRANK HERBERT", color: "#74352b", ink: "#ebd6ac", serif: true },
  { title: ["FUNDACION"], author: "ISAAC ASIMOV", color: "#264e52", ink: "#e8d5ac", serif: true },
  { title: ["EL HOBBIT"], author: "J. R. R. TOLKIEN", color: "#394635", ink: "#ead8a6", serif: true },
  { title: ["ATLAS DEL", "UNIVERSO"], author: "ASTRONOMIA", color: "#23374f", ink: "#cfdae1", serif: true },
  { title: ["HISTORIA", "UNIVERSAL"], author: "VOLUMEN II", color: "#653836", ink: "#d5b980", serif: true },
  { title: ["EL LENGUAJE", "C"], author: "PROGRAMACION", color: "#b5ad91", ink: "#862f28" },
  { title: ["MS-DOS", "6.22"], author: "MANUAL DE REFERENCIA", color: "#284d70", ink: "#f0e9d7" },
  { title: ["PC 486"], author: "HARDWARE Y REPARACION", color: "#aaa593", ink: "#263f4c" },
  { title: ["WINDOWS", "3.1"], author: "GUIA DEL USUARIO", color: "#d2c9ab", ink: "#304f83" },
  { title: ["3D STUDIO"], author: "MODELADO Y ANIMACION", color: "#314c52", ink: "#c7d9bb" },
  { title: ["AVENTURAS", "GRAFICAS"], author: "GUIA DE JUEGOS", color: "#92612f", ink: "#f0debb" },
  { title: ["DOOM"], author: "SECRETOS Y MAPAS", color: "#2f3130", ink: "#dfb47e" },
  { title: ["ENCICLOPEDIA", "DEL PC"], author: "01 / FUNDAMENTOS", color: "#5b3547", ink: "#e2cfb4" },
  { title: ["ENCICLOPEDIA", "DEL PC"], author: "02 / SISTEMAS", color: "#5b3547", ink: "#e2cfb4" },
  { title: ["REDES"], author: "CONCEPTOS Y PRACTICA", color: "#42594c", ink: "#e7d5ae" },
  { title: ["MICROMANIA"], author: "ESPECIAL AVENTURAS", color: "#8e3630", ink: "#eee1c0" }
];

function canvasMap(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"));
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

function bookAtlases() {
  const draw = (spine) => (ctx) => {
    const width = spine ? 128 : 512, height = 512;
    BOOKS.forEach((book, index) => {
      ctx.save();
      ctx.translate((index % 4) * width, Math.floor(index / 4) * height);
      ctx.fillStyle = book.color;
      ctx.fillRect(0, 0, width, height);
      // Small, deterministic scuffs and faded edges, without lighting baked into the print.
      let seed = 1709 + index * 919;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < 2800; i += 1) {
        ctx.fillStyle = i % 3 ? "rgba(239,225,193,0.1)" : "rgba(20,18,15,0.1)";
        ctx.fillRect(random() * width, random() * height, 0.5 + random(), 0.5 + random() * 1.5);
      }
      for (let i = 0; i < 90; i += 1) {
        ctx.fillStyle = "rgba(226,213,183,0.23)";
        ctx.fillRect(i % 2 ? width - 3 : 1, random() * (height - 9), random() * 2, random() * 8);
      }
      ctx.strokeStyle = "rgba(230,215,182,0.26)";
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 5, width - 8, height - 10);
      ctx.fillStyle = book.ink;
      ctx.strokeStyle = book.ink;
      ctx.textAlign = "center";
      if (spine) {
        ctx.fillRect(14, 32, width - 28, 2);
        ctx.fillRect(14, 461, width - 28, 2);
        ctx.font = "13px Georgia";
        ctx.fillText(String(index + 1).padStart(2, "0"), width / 2, 63);
        ctx.save();
        ctx.translate(width / 2, 270);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `bold ${book.serif ? 26 : 25}px ${book.serif ? "Georgia" : "Arial"}`;
        ctx.fillText(book.title.join(" "), 0, -2, 350);
        ctx.font = "11px Arial";
        ctx.fillText(book.author, 0, 20, 310);
        ctx.restore();
        ctx.font = "10px Georgia";
        ctx.fillText(book.serif ? "BIBLIOTECA" : "PC / MANUAL", width / 2, 484);
      } else {
        ctx.lineWidth = 1;
        ctx.strokeRect(27, 28, 458, 456);
        ctx.font = "16px Arial";
        ctx.fillText(book.author, 256, 66, 422);
        ctx.font = `bold 46px ${book.serif ? "Georgia" : "Arial"}`;
        book.title.forEach((line, i) => ctx.fillText(line, 256, 152 + i * 54, 424));
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          if (book.serif) ctx.ellipse(256, 330, 78 + i * 10, 34 + i * 10, i * 0.2, 0, Math.PI * 2);
          else { ctx.rect(151 + i * 15, 276 + i * 12, 156, 102); }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.font = "15px Georgia";
        ctx.fillText(book.serif ? "EDICION DE BIBLIOTECA" : "EDICION DE CONSULTA", 256, 456);
      }
      ctx.restore();
    });
  };
  return { cover: canvasMap(2048, 2048, draw(false)), spine: canvasMap(512, 2048, draw(true)) };
}

// Closed books have separate boards, recessed paper blocks and rounded printed spines.
export function createRetroGamerBookshelfContents({ clothMap, postersMap }) {
  const contents = new THREE.Group();
  contents.name = "Libros y juegos retro";
  const atlases = bookAtlases();
  const clothRelief = clothMap.clone();
  clothRelief.colorSpace = THREE.NoColorSpace;
  const paperMap = canvasMap(256, 256, (ctx) => {
    ctx.fillStyle = "#d6cbb2";
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 2) {
      ctx.fillStyle = `rgba(88,72,48,${0.08 + (x % 7) * 0.022})`;
      ctx.fillRect(x, 0, 1, 256);
    }
    for (let i = 0; i < 180; i += 1) {
      ctx.fillStyle = "rgba(122,91,51,0.12)";
      ctx.fillRect((i * 79) % 256, (i * 31) % 256, 1, 2);
    }
  });
  const paper = new THREE.MeshStandardMaterial({ map: paperMap, roughness: 0.95 });
  const materialCache = new Map();
  const atlasMaterial = (atlas, index, roughness) => {
    const map = atlas.clone();
    map.repeat.set(0.25 - 0.002, 0.25 - 0.002);
    map.offset.set((index % 4) / 4 + 0.001, 1 - (Math.floor(index / 4) + 1) / 4 + 0.001);
    return new THREE.MeshStandardMaterial({ map, bumpMap: clothRelief, bumpScale: 0.0007, roughness });
  };
  const mesh = (parent, size, position, material, radius = 0) => {
    const geometry = radius ? new RoundedBoxGeometry(...size, 1, radius) : new THREE.BoxGeometry(...size);
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const stand = (object, x, bottom, z, rotation = 0, yaw = 0) => {
    object.rotation.set(0, yaw, rotation);
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    object.position.set(x, bottom - bounds.min.y, z);
    contents.add(object);
    return object;
  };
  const book = (index, width, height, depth) => {
    if (!materialCache.has(index)) {
      materialCache.set(index, {
        cover: atlasMaterial(atlases.cover, index, 0.77),
        spine: atlasMaterial(atlases.spine, index, 0.79),
        board: new THREE.MeshStandardMaterial({ color: BOOKS[index].color, bumpMap: clothRelief, bumpScale: 0.001, roughness: 0.85 })
      });
    }
    const materials = materialCache.get(index);
    const group = new THREE.Group();
    group.name = `Libro ${BOOKS[index].title.join(" ")}`;
    group.userData.shelfProp = "book";
    mesh(group, [width - 0.023, height - 0.027, depth - 0.048], [0, 0, -0.008], paper);
    for (const side of [-1, 1]) {
      mesh(group, [0.01, height, depth], [side * (width - 0.01) / 2, 0, 0], materials.board, 0.003);
      const print = new THREE.Mesh(new THREE.PlaneGeometry(depth - 0.008, height - 0.008), materials.cover);
      print.rotation.y = side * Math.PI / 2;
      print.position.x = side * (width / 2 + 0.0005);
      group.add(print);
    }
    mesh(group, [width, height, 0.04], [0, 0, depth / 2 - 0.017], materials.spine, 0.008);
    return group;
  };
  const upright = (index, x, bottom, width, height, tilt = 0, z = 0.055) =>
    stand(book(index, width, height, 0.52 + (index % 3) * 0.035), x, bottom, z, tilt);
  // Leave real gaps for leaning volumes; all bases rest on the shelf surfaces.
  upright(0, -1.1, 0.23, 0.23, 0.79);
  upright(1, -0.845, 0.23, 0.23, 0.8, 0, 0.08);
  upright(2, -0.61, 0.23, 0.2, 0.72);
  upright(3, -0.335, 0.23, 0.21, 0.83, -0.075);
  let bottom = 0.23;
  for (const [index, width, height, yaw] of [[10, 0.15, 0.79, -0.045], [15, 0.09, 0.82, 0.04], [11, 0.17, 0.72, -0.015]]) {
    const stacked = stand(book(index, width, height, 0.59), 0.63, bottom, 0.035, -Math.PI / 2, yaw);
    stacked.updateMatrixWorld(true);
    bottom = new THREE.Box3().setFromObject(stacked).max.y + 0.003;
  }
  upright(6, -1.095, 1.23, 0.25, 0.84);
  upright(7, -0.827, 1.23, 0.25, 0.77, 0, 0.085);
  upright(8, -0.56, 1.23, 0.25, 0.85);
  upright(5, -0.302, 1.23, 0.23, 0.72);
  upright(14, 0.025, 1.23, 0.18, 0.8, -0.12);
  upright(9, 0.345, 1.23, 0.2, 0.81);
  upright(12, 0.68, 1.23, 0.27, 0.86, 0, 0.025);
  upright(13, 0.975, 1.23, 0.27, 0.86, 0, 0.04);
  bottom = 2.25;
  for (const [index, width, height] of [[4, 0.2, 0.79], [3, 0.19, 0.74]]) {
    const stacked = stand(book(index, width, height, 0.6), -0.765, bottom, 0.05, -Math.PI / 2);
    stacked.updateMatrixWorld(true);
    bottom = new THREE.Box3().setFromObject(stacked).max.y + 0.003;
  }
  upright(10, -0.05, 2.25, 0.2, 0.78, -0.09);
  upright(11, 0.25, 2.25, 0.2, 0.8);
  upright(2, 0.485, 2.25, 0.18, 0.71, 0, 0.025);
  upright(1, 0.705, 2.25, 0.22, 0.75);
  upright(15, 1.015, 2.25, 0.09, 0.84, 0.1);

  const carton = new THREE.MeshStandardMaterial({ color: 0x423a2e, roughness: 0.85, bumpMap: clothRelief, bumpScale: 0.001 });
  for (const [index, x, title] of [[0, -0.79, "DOOM"], [1, -0.025, "INDIANA JONES"]]) {
    const group = new THREE.Group();
    group.name = `Caja de juego ${title}`;
    group.userData.shelfProp = "game";
    const front = postersMap.clone();
    front.wrapS = front.wrapT = THREE.ClampToEdgeWrapping;
    front.repeat.set(0.498, 0.998);
    front.offset.set(index * 0.5 + 0.001, 0.001);
    const artwork = new THREE.MeshStandardMaterial({ map: front, roughness: 0.65 });
    mesh(group, [0.61, 0.93, 0.2], [0, 0, 0], carton, 0.008);
    const cover = new THREE.Mesh(new THREE.PlaneGeometry(0.591, 0.906), artwork);
    cover.position.z = 0.101;
    group.add(cover);
    mesh(group, [0.603, 0.01, 0.192], [0, 0.436, 0], carton);
    const sideMap = canvasMap(128, 512, (ctx) => {
      ctx.fillStyle = "#242725"; ctx.fillRect(0, 0, 128, 512);
      ctx.translate(64, 250); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#e6d5ab"; ctx.textAlign = "center";
      ctx.font = "bold 32px Georgia"; ctx.fillText(title, 0, 0, 420);
      ctx.font = "16px Arial"; ctx.fillText("PC CD-ROM", 0, 32);
    });
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.9), new THREE.MeshStandardMaterial({ map: sideMap, roughness: 0.76 }));
    side.rotation.y = -Math.PI / 2; side.position.x = -0.306; group.add(side);
    stand(group, x, 3.27, 0.06, 0, index ? -0.035 : 0.045);
  }
  const jewel = new THREE.MeshPhysicalMaterial({ color: 0x808d90, roughness: 0.22, metalness: 0.15, clearcoat: 1 });
  const caseEdge = new THREE.MeshStandardMaterial({ color: 0x161c20, roughness: 0.5 });
  const cdInsert = new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasMap(512, 512, (ctx) => {
    ctx.fillStyle = "#233342"; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = "#cab78d"; ctx.fillRect(22, 22, 468, 84);
    ctx.fillStyle = "#233342"; ctx.font = "bold 34px Arial";
    ctx.textAlign = "center"; ctx.fillText("PC COLLECTION", 256, 76);
    const disc = ctx.createLinearGradient(120, 140, 390, 400);
    disc.addColorStop(0, "#8a9da8"); disc.addColorStop(0.35, "#e8e4d4");
    disc.addColorStop(0.6, "#909ba2"); disc.addColorStop(1, "#c9d5cc");
    ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(256, 282, 136, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#233342"; ctx.beginPath(); ctx.arc(256, 282, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e5dac3"; ctx.font = "18px Arial"; ctx.fillText("UTILIDADES / SHAREWARE / DEMOS", 256, 466);
  }) });
  for (let i = 0; i < 5; i += 1) {
    const group = new THREE.Group();
    group.name = "Caja de CD-ROM";
    group.userData.shelfProp = "cd";
    mesh(group, [0.049, 0.55, 0.51], [0, 0, 0], jewel, 0.004);
    for (const side of [-1, 1]) {
      const insert = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.49), cdInsert);
      insert.rotation.y = side * Math.PI / 2;
      insert.position.x = side * 0.025;
      group.add(insert);
    }
    mesh(group, [0.041, 0.53, 0.035], [0, 0, 0.243], caseEdge);
    const labelMaterial = atlasMaterial(atlases.spine, i + 6, 0.55);
    mesh(group, [0.027, 0.49, 0.004], [0, 0, 0.263], labelMaterial);
    stand(group, 0.62 + i * 0.064, 3.27, 0.03);
  }
  return contents;
}
