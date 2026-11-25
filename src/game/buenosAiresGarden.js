import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cityLightPath } from "./buenosAiresLighting.js";
import { BA_GARDEN_LETTERS, OBELISK } from "./buenosAiresLayout.js";
import { citySurface } from "./buenosAiresArt.js";

function randomGenerator() {
  let state = 14049;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
}

function foliageMaps() {
  const random = randomGenerator();
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d"); ctx.fillStyle = "#1d351b"; ctx.fillRect(0, 0, 512, 512);
  const palette = ["#427239", "#6b8d42", "#3d6532", "#75994a", "#2f5527", "#507e35"];
  for (let i = 0; i < 2400; i++) {
    const x = random() * 512, y = random() * 512, angle = random() * Math.PI;
    const w = 2 + random() * 3, h = 4 + random() * 6;
    // Wrap the leaves at tile edges for seamless coverage of the letter sides.
    for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) {
      if (x + dx < -12 || x + dx > 524 || y + dy < -12 || y + dy > 524) continue;
      ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(angle);
      ctx.fillStyle = "rgba(6,20,10,.45)"; ctx.beginPath(); ctx.ellipse(1.2, 1.8, w + .7, h + .7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = palette[i % palette.length]; ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(175,192,110,.35)"; ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(0, -h * .8); ctx.lineTo(0, h * .8); ctx.stroke();
      ctx.restore();
    }
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(.55, .55); map.anisotropy = 8;
  const bumpMap = map.clone(); bumpMap.colorSpace = THREE.NoColorSpace;
  return { map, bumpMap };
}

function roundedHole(x, y, width, height) {
  const p = new THREE.Path(), r = .18;
  p.moveTo(x + r, y); p.lineTo(x + width - r, y); p.quadraticCurveTo(x + width, y, x + width, y + r);
  p.lineTo(x + width, y + height - r); p.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  p.lineTo(x + r, y + height); p.quadraticCurveTo(x, y + height, x, y + height - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath(); return p;
}

function letterShapes() {
  const b = new THREE.Shape();
  b.moveTo(0, 0); b.lineTo(2.65, 0);
  b.bezierCurveTo(3.8, 0, 4.1, .45, 4.1, 1.3);
  b.bezierCurveTo(4.1, 1.95, 3.75, 2.2, 3.25, 2.35);
  b.bezierCurveTo(3.75, 2.6, 3.95, 2.9, 3.95, 3.5);
  b.bezierCurveTo(3.95, 4.25, 3.45, 4.6, 2.65, 4.6); b.lineTo(0, 4.6); b.closePath();
  b.holes.push(roundedHole(1.12, .9, 1.6, 1.02), roundedHole(1.12, 2.8, 1.5, .92));
  const a = new THREE.Shape();
  a.moveTo(0, 0); a.lineTo(1.3, 0); a.lineTo(1.68, 1.25); a.lineTo(2.92, 1.25);
  a.lineTo(3.3, 0); a.lineTo(4.6, 0); a.lineTo(3.03, 4.6); a.lineTo(1.57, 4.6); a.closePath();
  const hole = new THREE.Path(); hole.moveTo(1.96, 2.23); hole.lineTo(2.64, 2.23); hole.lineTo(2.3, 3.48); hole.closePath(); a.holes.push(hole);
  return [b, a];
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const p = points[i], q = points[j];
    if ((p.y > y) !== (q.y > y) && x < (q.x - p.x) * (y - p.y) / (q.y - p.y) + p.x) inside = !inside;
  }
  return inside;
}

// A folded leaf gives the silhouette real relief with only four triangles per leaf.
function leafGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    0, -.11, 0, -.048, 0, 0, 0, 0, .025,
    -.048, 0, 0, 0, .11, 0, 0, 0, .025,
    0, .11, 0, .048, 0, 0, 0, 0, .025,
    .048, 0, 0, 0, -.11, 0, 0, 0, .025,
  ], 3)); geometry.computeVertexNormals(); return geometry;
}

export function addBuenosAiresGarden(root, { colliders, glowMap, lighting }) {
  const group = new THREE.Group(); group.name = "Plaza del Obelisco / BA vegetal con LED"; root.add(group);
  const random = randomGenerator(), box = new THREE.BoxGeometry(1, 1, 1);
  const vegetation = new THREE.MeshStandardMaterial({ name: "BA / jardín vertical", ...foliageMaps(), color: 0xe4eec9,
    bumpScale: .095, roughness: .94, emissive: 0x29431b, emissiveIntensity: .12 });
  const leafMaterial = new THREE.MeshStandardMaterial({ name: "BA / hojas con volumen", color: 0xffffff,
    side: THREE.DoubleSide, roughness: .88, emissive: 0x203315, emissiveIntensity: .1 });
  const curbMaterial = new THREE.MeshStandardMaterial({ color: 0x63777b, metalness: .3, roughness: .67 });
  const lawnMaterial = new THREE.MeshStandardMaterial({ color: 0xc1d395, ...citySurface("grass"), roughness: .98,
    emissive: 0x18311a, emissiveIntensity: .12 });
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x939b98, ...citySurface("paving"), roughness: .87 });
  const channelMaterial = new THREE.MeshStandardMaterial({ color: 0x213e40, metalness: .65, roughness: .32 });
  const channelGeometries = [];
  const leafTransforms = [], leafColors = [], temp = new THREE.Object3D(), color = new THREE.Color();
  const solid = (w, h, d, x, y, z, material) => {
    const mesh = new THREE.Mesh(box, material); mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
    mesh.castShadow = h > .4; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  const plane = new THREE.PlaneGeometry(1, 1);
  const ground = (w, d, x, z, y, material) => {
    const mesh = new THREE.Mesh(plane, material); mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(w, d, 1); mesh.position.set(x, y, z); mesh.receiveShadow = true; group.add(mesh); return mesh;
  };

  // The paved forecourts extend equally north and south of the monument.
  // Only the southern end continues into the BA's landscaped garden.
  const northOf = z => 2 * OBELISK.z - z;
  const islandShape = (inset = 0) => {
    const shape = new THREE.Shape(), w = 16 - inset;
    shape.moveTo(-w, northOf(14));
    shape.lineTo(-w, 18);
    shape.bezierCurveTo(-w, 34, -12 + inset, 48 - inset, 0, 55 - inset);
    shape.bezierCurveTo(12 - inset, 48 - inset, w, 34, w, 18);
    shape.lineTo(w, northOf(14));
    shape.bezierCurveTo(w, northOf(27), 10 - inset, northOf(35.2 - inset), 0, northOf(35.2 - inset));
    shape.bezierCurveTo(-10 + inset, northOf(35.2 - inset), -w, northOf(27), -w, northOf(14));
    shape.closePath(); return shape;
  };
  const plazaShape = new THREE.Shape();
  plazaShape.moveTo(-14, northOf(14)); plazaShape.lineTo(-14, 14);
  plazaShape.bezierCurveTo(-14, 25, -9, 33, 0, 33);
  plazaShape.bezierCurveTo(9, 33, 14, 25, 14, 14);
  plazaShape.lineTo(14, northOf(14));
  plazaShape.bezierCurveTo(14, northOf(25), 9, northOf(33), 0, northOf(33));
  plazaShape.bezierCurveTo(-9, northOf(33), -14, northOf(25), -14, northOf(14)); plazaShape.closePath();
  const plazaMaterial = new THREE.MeshStandardMaterial({ name: "Plaza / granito rosado",
    color: 0xb3a4a1, ...citySurface("paving"), roughness: .88 });
  // World-space UVs keep the same slab size on curved surfaces and footpaths.
  const surface = (shape, material, height, name) => {
    const geometry = new THREE.ShapeGeometry(shape, 32);
    const positions = geometry.getAttribute("position"), uv = geometry.getAttribute("uv");
    for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / 6, positions.getY(i) / 6);
    geometry.rotateX(Math.PI / 2);
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    geometry.computeVertexNormals(); geometry.translate(0, height, 0);
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.receiveShadow = true; group.add(mesh);
    return mesh;
  };
  surface(islandShape(), curbMaterial, .018, "Plaza / cordon ovalado continuo");
  surface(islandShape(.18), lawnMaterial, .026, "Plaza / jardines del extremo sur");
  const perimeterWalk = islandShape(.2);
  perimeterWalk.holes.push(new THREE.Path(islandShape(1.5).getPoints(32)));
  surface(perimeterWalk, pathMaterial, .032, "Plaza / paseo perimetral curvo");
  surface(plazaShape, plazaMaterial, .032, "Plaza / explanadas norte y sur del Obelisco");
  const border = new THREE.CatmullRomCurve3(plazaShape.getPoints(32).map(p => new THREE.Vector3(p.x, .043, p.y)), true, "centripetal");
  const borderMesh = new THREE.Mesh(new THREE.TubeGeometry(border, 240, .065, 5, true), curbMaterial);
  borderMesh.name = "Plaza / borde semicircular de la explanada"; group.add(borderMesh);
  const path = (x1, z1, x2, z2, width) => {
    const dx = x2 - x1, dz = z2 - z1, length = Math.hypot(dx, dz);
    const nx = -dz / length * width / 2, nz = dx / length * width / 2;
    const shape = new THREE.Shape(); shape.moveTo(x1 + nx, z1 + nz); shape.lineTo(x2 + nx, z2 + nz);
    shape.lineTo(x2 - nx, z2 - nz); shape.lineTo(x1 - nx, z1 - nz); shape.closePath();
    surface(shape, pathMaterial, .036, "Plaza / sendero entre canteros");
  };
  path(0, 31.5, 0, 54, 2.4);
  for (const side of [-1, 1]) {
    path(0, 43, side * 12.7, 33.4, 1.2);
    path(0, 50, side * 9.5, 42, 1.2);
  }
  // Low vegetation follows the semi-oval without occupying the central route.
  const shrubGeo = new THREE.IcosahedronGeometry(1, 1);
  for (const side of [-1, 1]) {
    for (const [x, z] of [[13.7, 27], [13.5, 29.5], [12.6, 32], [11.6, 36.5], [10.8, 38.5], [9.7, 40.2], [7.9, 44.6], [6.5, 46], [5, 47.5], [3.3, 49.2], [5.3, 35], [7.2, 34.2]]) {
      const shrub = new THREE.Mesh(shrubGeo, vegetation); shrub.position.set(side * x, .33, z); shrub.scale.set(.55, .32 + random() * .16, .58);
      shrub.castShadow = true; shrub.receiveShadow = true; group.add(shrub);
      for (let j = 0; j < 18; j++) {
        temp.position.set(side * x + (random() - .5) * 1.2, .24 + random() * .3, z + (random() - .5) * 1.1);
        temp.rotation.set(-Math.PI / 2 + random() * .8, random() * Math.PI, random() * Math.PI);
        temp.scale.set(.8, 1.1 + random() * 1.4, 1); temp.updateMatrix(); leafTransforms.push(temp.matrix.clone());
        color.setHSL(.24 + random() * .07, .35 + random() * .2, .22 + random() * .13); leafColors.push(color.clone());
      }
    }
  }

  const shapes = letterShapes();
  shapes.forEach((shape, index) => {
    const config = BA_GARDEN_LETTERS[index], width = config.hx * 2;
    const offsetX = config.x - width / 2, offsetY = .17;
    solid(width + .32, .14, 1.8, config.x, .07, config.z, curbMaterial);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1.16, bevelEnabled: true, bevelSize: .065, bevelThickness: .065, bevelSegments: 2, curveSegments: 14 });
    geometry.translate(offsetX, offsetY, config.z - .58);
    const letter = new THREE.Mesh(geometry, vegetation); letter.name = `BA vegetal / ${index ? "A" : "B"}`;
    letter.castShadow = letter.receiveShadow = true; group.add(letter); colliders.push(letter);
    const outer = shape.getPoints(36), holes = shape.holes.map(path => path.getPoints(24));
    const inLetter = (x, y) => insidePolygon(x, y, outer) && !holes.some(points => insidePolygon(x, y, points));
    // Leaf relief on both faces. Samples respect all letter openings.
    for (let y = .05; y < 4.6; y += .13) for (let x = .04; x < width; x += .13) {
      const px = x + (random() - .5) * .1, py = y + (random() - .5) * .1;
      if (!inLetter(px, py)) continue;
      for (const face of [-1, 1]) {
        temp.position.set(offsetX + px, offsetY + py, config.z + face * (.65 + random() * .025));
        temp.rotation.set((random() - .5) * .75, face < 0 ? Math.PI : (random() - .5) * .5, random() * Math.PI * 2);
        temp.scale.set(.65 + random() * .6, .55 + random() * .6, 1); temp.updateMatrix(); leafTransforms.push(temp.matrix.clone());
        color.setHSL(.22 + random() * .1, .4 + random() * .25, .19 + random() * .17); leafColors.push(color.clone());
      }
    }
    // Addressable diffusers follow both faces and every opening of the living letters.
    for (const [contour, points] of [outer, ...holes].entries()) for (const face of [-1, 1]) {
      const vertices = points.map(p => [offsetX + p.x, offsetY + p.y, config.z + face * .701]);
      if (points[0].distanceTo(points[points.length - 1]) > .001) vertices.push([...vertices[0]]);
      const curve = cityLightPath(vertices), segments = Math.min(144, Math.max(40, Math.ceil(curve.getLength() * 9)));
      channelGeometries.push(new THREE.TubeGeometry(curve, segments, .046, 3, false));
      const diffuser = cityLightPath(vertices.map(([x, y, z]) => [x, y, z + face * .061]));
      lighting.strip(group, diffuser, { radius: .045, style: "landmark", halo: true, phase: index * 2 + contour * 1.3, segments });
    }
    const glowMaterial = new THREE.MeshBasicMaterial({ map: glowMap, color: 0x59dfb3, transparent: true, opacity: .13,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    ground(6, 3, config.x, config.z + .8, .147, glowMaterial);
    const left = config.x - width / 2, right = config.x + width / 2;
    lighting.strip(group, cityLightPath([[left, .15, config.z + .94], [right, .15, config.z + .94],
      [right, .15, config.z - .94], [left, .15, config.z - .94], [left, .15, config.z + .94]]), { radius: .028, style: "landmark", phase: index * 2, segments: 80 });
  });
  const channels = new THREE.Mesh(mergeGeometries(channelGeometries), channelMaterial);
  channels.name = "BA / canales de aluminio de los LED"; group.add(channels);
  channelGeometries.forEach(geometry => geometry.dispose());
  const leaves = new THREE.InstancedMesh(leafGeometry(), leafMaterial, leafTransforms.length);
  leaves.name = "BA / follaje y plantas instanciadas"; leaves.receiveShadow = true;
  leafTransforms.forEach((matrix, i) => { leaves.setMatrixAt(i, matrix); leaves.setColorAt(i, leafColors[i]); });
  leaves.instanceMatrix.needsUpdate = true; leaves.instanceColor.needsUpdate = true; leaves.computeBoundingSphere(); group.add(leaves);
  const gardenLight = new THREE.SpotLight(0xd4f2ca, 135, 24, .82, .8, 2);
  gardenLight.position.set(0, 6.5, BA_GARDEN_LETTERS[0].z + 6.8); gardenLight.target.position.set(0, 2.2, BA_GARDEN_LETTERS[0].z); group.add(gardenLight, gardenLight.target);
  return group;
}
