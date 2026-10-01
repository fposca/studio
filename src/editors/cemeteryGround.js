import * as THREE from "three";
import stoneTextureUrl from "../assets/environments/cemetery-stone-v2.png";
import barkTextureUrl from "../assets/environments/cemetery-bark-v1.png";
import ironTextureUrl from "../assets/environments/cemetery-iron-rust-v1.png";

const GROUND_Y = -0.015;

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function cemeteryGroundHeight(x, z) {
  const away = THREE.MathUtils.smoothstep(Math.hypot(x, z), 6, 22);
  return away * (
    Math.sin(x * 0.19 + z * 0.07) * 0.11 +
    Math.cos(z * 0.23 - x * 0.09) * 0.075 +
    Math.sin(x * 0.53 + z * 0.47) * 0.025
  );
}

export function createCemeteryTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(280, 280, 224, 224);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = -positions.getY(index);
    positions.setZ(index, cemeteryGroundHeight(x, z));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function graveMarkerGeometry(kind) {
  const shape = new THREE.Shape();
  if (kind === "cross") {
    [[-0.13, 0], [0.13, 0], [0.13, 0.61], [0.42, 0.61], [0.42, 0.83],
      [0.13, 0.83], [0.13, 1.34], [-0.13, 1.34], [-0.13, 0.83],
      [-0.42, 0.83], [-0.42, 0.61], [-0.13, 0.61]].forEach(([x, y], index) => {
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  } else if (kind === "broken") {
    [[-0.48, 0], [0.48, 0], [0.43, 0.93], [0.24, 1.14], [0.09, 0.91],
      [-0.04, 1.07], [-0.2, 0.86], [-0.38, 0.91]].forEach(([x, y], index) => {
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  } else {
    shape.moveTo(-0.43, 0);
    shape.lineTo(0.43, 0);
    shape.lineTo(0.43, 1.08);
    shape.quadraticCurveTo(0.4, 1.46, 0, 1.48);
    shape.quadraticCurveTo(-0.4, 1.46, -0.43, 1.08);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.17, steps: 1, bevelEnabled: true, bevelSegments: 1,
    bevelSize: 0.025, bevelThickness: 0.024
  });
  geometry.translate(0, 0, -0.085);
  geometry.computeVertexNormals();
  return geometry;
}

function grassTuftGeometry(bladeCount = 4, distant = false) {
  const vertices = [];
  const colors = [];
  const base = new THREE.Color("#344736");
  const tip = new THREE.Color("#849577");
  const addVertex = (x, y, z) => {
    vertices.push(x, y, z);
    const color = base.clone().lerp(tip, y * 0.82);
    colors.push(color.r, color.g, color.b);
  };
  for (let blade = 0; blade < bladeCount; blade += 1) {
    const angle = blade * Math.PI * 2 / bladeCount;
    const sideX = -Math.sin(angle), sideZ = Math.cos(angle);
    const radialX = Math.cos(angle), radialZ = Math.sin(angle);
    const height = 0.72 + (blade % 3) * 0.12;
    const rings = distant
      ? [[0, 0.017, 0.012], [height, 0, 0.15]]
      : [[0, 0.017, 0.012], [height * 0.52, 0.012, 0.07], [height, 0, 0.15]];
    for (let segment = 0; segment < rings.length - 1; segment += 1) {
      const [y0, w0, lean0] = rings[segment];
      const [y1, w1, lean1] = rings[segment + 1];
      const x0 = radialX * (0.045 + lean0), z0 = radialZ * (0.045 + lean0);
      const x1 = radialX * (0.045 + lean1), z1 = radialZ * (0.045 + lean1);
      addVertex(x0 - sideX * w0, y0, z0 - sideZ * w0);
      addVertex(x0 + sideX * w0, y0, z0 + sideZ * w0);
      addVertex(x1 - sideX * w1, y1, z1 - sideZ * w1);
      addVertex(x0 + sideX * w0, y0, z0 + sideZ * w0);
      addVertex(x1 + sideX * w1, y1, z1 + sideZ * w1);
      addVertex(x1 - sideX * w1, y1, z1 - sideZ * w1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createCemeteryDetails() {
  const group = new THREE.Group();
  group.name = "Tumbas, criptas y pasto de cementerio";
  group.userData.editorHelper = true;
  group.visible = false;
  let built = false;
  let texture;
  let barkTexture;
  let ironTexture;
  const geometries = [];
  const materials = [];
  let grassShader = null;

  group.userData.build = () => {
    if (built) return;
    built = true;
    const random = seededRandom(19173);
    texture = new THREE.TextureLoader().load(stoneTextureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    barkTexture = new THREE.TextureLoader().load(barkTextureUrl);
    barkTexture.colorSpace = THREE.SRGBColorSpace;
    barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
    barkTexture.anisotropy = 8;
    ironTexture = new THREE.TextureLoader().load(ironTextureUrl);
    ironTexture.colorSpace = THREE.SRGBColorSpace;
    ironTexture.wrapS = ironTexture.wrapT = THREE.RepeatWrapping;
    ironTexture.anisotropy = 8;
    const stone = new THREE.MeshStandardMaterial({
      map: texture, bumpMap: texture, bumpScale: 0.08,
      color: 0xc0c9be, roughness: 1, metalness: 0
    });
    const darkStone = new THREE.MeshStandardMaterial({
      map: texture, bumpMap: texture, bumpScale: 0.1,
      color: 0x798880, roughness: 1, metalness: 0
    });
    const interior = new THREE.MeshStandardMaterial({ color: 0x161c1f, roughness: 1, side: THREE.DoubleSide });
    const boneMaterial = new THREE.MeshLambertMaterial({ color: 0x8e8775 });
    const bark = new THREE.MeshStandardMaterial({
      map: barkTexture, bumpMap: barkTexture, bumpScale: 0.035,
      color: 0xb8b0a6, roughness: 1, metalness: 0, flatShading: true
    });
    const iron = new THREE.MeshStandardMaterial({
      map: ironTexture, bumpMap: ironTexture, bumpScale: 0.018,
      color: new THREE.Color().setRGB(1.65, 1.5, 1.38), roughness: 0.96, metalness: 0.08
    });
    materials.push(stone, darkStone, interior, boneMaterial, bark, iron);
    const markerGeometries = ["rounded", "broken", "cross"].map(graveMarkerGeometry);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const rubble = new THREE.DodecahedronGeometry(1, 0);
    const arch = new THREE.TorusGeometry(0.51, 0.065, 7, 20, Math.PI);
    const bone = new THREE.LatheGeometry([
      [0, -0.52], [0.11, -0.49], [0.15, -0.41], [0.08, -0.31],
      [0.065, -0.12], [0.065, 0.12], [0.08, 0.31], [0.15, 0.41],
      [0.11, 0.49], [0, 0.52]
    ].map(([radius, y]) => new THREE.Vector2(radius, y)), 9);
    bone.rotateZ(-Math.PI / 2);
    const rib = new THREE.TorusGeometry(0.23, 0.027, 5, 15, Math.PI * 1.6);
    rib.rotateX(-Math.PI / 2);
    const treeSegment = new THREE.CylinderGeometry(0.62, 1, 1, 7, 1);
    const spike = new THREE.ConeGeometry(0.08, 0.22, 4);
    geometries.push(...markerGeometries, box, rubble, arch, bone, rib, treeSegment, spike);
    const batches = new Map();
    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();
    const queue = (geometry, material, shade) => {
      const key = `${geometries.indexOf(geometry)}:${materials.indexOf(material)}`;
      if (!batches.has(key)) batches.set(key, { geometry, material, instances: [] });
      batches.get(key).instances.push({ matrix: dummy.matrix.clone(), shade });
    };
    const place = (geometry, material, x, y, z, sx, sy, sz, rotationY = 0, tilt = 0, shade = 1, pitch = 0) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(pitch, rotationY, tilt);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      queue(geometry, material, shade);
    };
    const up = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3();
    const placeSegment = (from, to, radius, shade) => {
      direction.subVectors(to, from);
      dummy.position.copy(from).addScaledVector(direction, 0.5);
      dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
      dummy.scale.set(radius, direction.length(), radius);
      dummy.updateMatrix();
      queue(treeSegment, bark, shade);
    };
    const support = (x, z) => GROUND_Y + cemeteryGroundHeight(x, z);
    const crypts = [[-14, -25, 0.96], [17, -34, 1.12], [-24, 22, 0.87], [26, 19, 1.04]];
    for (const [x, z, scale] of crypts) {
      const y = support(x, z);
      const s = scale;
      place(box, darkStone, x, y + 0.12 * s, z, 2.65 * s, 0.24 * s, 3.2 * s, 0, 0, 0.85);
      place(box, stone, x - 1.1 * s, y + 1.12 * s, z, 0.25 * s, 2.0 * s, 2.6 * s, 0, -0.025, 0.82);
      place(box, stone, x + 1.1 * s, y + 0.9 * s, z - 0.2 * s, 0.25 * s, 1.55 * s, 2.15 * s, 0, 0.075, 0.77);
      place(box, stone, x, y + 1.05 * s, z - 1.28 * s, 2.1 * s, 1.95 * s, 0.26 * s, 0, 0, 0.8);
      place(box, interior, x, y + 1.02 * s, z + 1.27 * s, 0.95 * s, 1.72 * s, 0.06 * s);
      for (const side of [-1, 1]) {
        place(box, stone, x + side * 0.83 * s, y + 1.04 * s, z + 1.28 * s,
          0.42 * s, 1.83 * s, 0.38 * s, 0, side * 0.025, 0.88);
      }
      place(arch, stone, x, y + 1.95 * s, z + 1.49 * s,
        1.0 * s, 0.9 * s, 1.0 * s, 0, 0, 0.83);
      place(box, stone, x - 0.53 * s, y + 2.25 * s, z, 1.48 * s, 0.25 * s, 2.9 * s, 0, -0.2, 0.76);
      place(box, darkStone, x + 0.58 * s, y + 2.12 * s, z - 0.4 * s,
        1.08 * s, 0.24 * s, 2.05 * s, 0, 0.25, 0.8);
      for (let fragment = 0; fragment < 7; fragment += 1) {
        const fx = x + (random() - 0.5) * 4.3 * s;
        const fz = z + (random() - 0.5) * 4.9 * s;
        const size = (0.14 + random() * 0.27) * s;
        place(rubble, darkStone, fx, support(fx, fz) + size * 0.75, fz,
          size, size * 0.75, size * 0.85, random() * 6.28, 0.12, 0.65 + random() * 0.3);
      }
    }

    let graves = 0, broken = 0;
    for (const side of [-1, 1]) for (let lane = 0; lane < 5; lane += 1) for (let row = 0; row < 19; row += 1) {
      if (random() < 0.14) continue;
      const x = side * (8.4 + lane * 4.4) + (random() - 0.5) * 0.95;
      const z = -58 + row * 6.2 + (random() - 0.5) * 1.4;
      if (Math.hypot(x, z) < 9) continue;
      const y = support(x, z);
      const variant = random() < 0.32 ? 1 : random() < 0.18 ? 2 : 0;
      const marker = markerGeometries[variant];
      const height = 0.78 + random() * 0.52;
      const shade = 0.67 + random() * 0.31;
      const lean = (random() - 0.5) * (variant === 1 ? 0.28 : 0.13);
      place(box, darkStone, x, y + 0.11, z, 1.03, 0.2, 0.41, 0, 0, shade * 0.83);
      place(marker, stone, x, y + 0.17, z, 1, height, 1, (random() - 0.5) * 0.15, lean, shade);
      place(box, darkStone, x, y + 0.085, z + 1.0, 0.96, 0.16, 1.32,
        (random() - 0.5) * 0.12, 0, shade * 0.72);
      graves += 1;
      if (variant === 1) {
        broken += 1;
        const fx = x + (random() - 0.5) * 0.8, fz = z + 0.65 + random() * 0.7;
        place(rubble, stone, fx, support(fx, fz) + 0.12, fz,
          0.27, 0.13, 0.23, random() * Math.PI, 0.18, shade * 0.84);
        if (random() < 0.55) place(markerGeometries[1], darkStone, x + 0.26,
          y + 0.1, z + 0.64, 0.48, 0.42, 0.86, random() * 0.4, 0, shade * 0.72, -1.34);
      }
    }
    for (let index = 0; index < 280; index += 1) {
      const x = (random() - 0.5) * 115;
      const z = (random() - 0.5) * 115;
      if (Math.hypot(x, z) < 7) continue;
      const radius = 0.07 + random() * 0.17;
      place(rubble, darkStone, x, support(x, z) + radius * 0.65, z,
        radius, radius * 0.7, radius, random() * 6.28, 0, 0.55 + random() * 0.35);
    }
    let bones = 0;
    for (let index = 0; index < 230; index += 1) {
      const x = (random() - 0.5) * 84;
      const z = (random() - 0.5) * 84;
      if (Math.hypot(x, z) < 4.5 || crypts.some(([cx, cz]) => Math.abs(x - cx) < 2 && Math.abs(z - cz) < 2.4)) continue;
      const isRib = random() < 0.34;
      const size = 0.55 + random() * 0.54;
      place(isRib ? rib : bone, boneMaterial, x, support(x, z) + (isRib ? 0.035 : 0.095), z,
        size, 0.75 + random() * 0.25, size, random() * Math.PI * 2, 0, 0.48 + random() * 0.3);
      bones += 1;
    }
    const trees = [[-12, -15, 0.94], [13, -17, 0.86], [-24, 20, 0.84], [27, 16, 0.77]];
    for (const [tx, tz, scale] of trees) {
      const yaw = random() * Math.PI * 2;
      const cos = Math.cos(yaw), sin = Math.sin(yaw);
      const treeBase = support(tx, tz);
      const at = (x, y, z) => new THREE.Vector3(
        tx + (x * cos - z * sin) * scale,
        treeBase + y * scale,
        tz + (x * sin + z * cos) * scale
      );
      const lean = (random() - 0.5) * 0.36;
      const spine = [[0, 0, 0], [0.13, 1.1, 0.03], [-0.13, 2.18, -0.16],
        [0.16 + lean, 3.26, -0.28], [0.03 + lean, 4.25, -0.38],
        [-0.1 + lean, 5.17, -0.43], [0.18 + lean, 5.86, -0.51]];
      for (let index = 0; index < spine.length - 1; index += 1) {
        const radius = (0.42 * (1 - index / 6) + 0.055) * scale;
        placeSegment(at(...spine[index]), at(...spine[index + 1]), radius, 0.78 + random() * 0.16);
      }
      for (const level of [2, 3, 4]) for (const side of [-1, 1]) {
        const start = at(...spine[level]);
        const azimuth = yaw + side * (0.9 + random() * 0.5) + level * 0.8 + (random() - 0.5) * 0.7;
        const reach = (1 + random() * 0.65) * scale;
        const mid = start.clone().add(new THREE.Vector3(Math.cos(azimuth) * reach,
          (0.65 + random() * 0.32) * scale, Math.sin(azimuth) * reach));
        const tip = mid.clone().add(new THREE.Vector3(Math.cos(azimuth + side * 0.3) * reach * 0.77,
          (0.55 + random() * 0.36) * scale, Math.sin(azimuth + side * 0.3) * reach * 0.77));
        const radius = (0.19 - level * 0.024) * scale;
        placeSegment(start, mid, radius, 0.77 + random() * 0.17);
        placeSegment(mid, tip, radius * 0.65, 0.72 + random() * 0.2);
        for (const twigSide of [-1, 1]) {
          const twigAzimuth = azimuth + twigSide * (0.42 + random() * 0.32);
          const twigTip = mid.clone().add(new THREE.Vector3(Math.cos(twigAzimuth) * reach * 0.56,
            (0.36 + random() * 0.36) * scale, Math.sin(twigAzimuth) * reach * 0.56));
          placeSegment(mid, twigTip, radius * 0.38, 0.7 + random() * 0.2);
          const endTip = tip.clone().add(new THREE.Vector3(Math.cos(twigAzimuth + twigSide * 0.3) * reach * 0.4,
            (0.3 + random() * 0.24) * scale, Math.sin(twigAzimuth + twigSide * 0.3) * reach * 0.4));
          placeSegment(tip, endTip, radius * 0.28, 0.68 + random() * 0.2);
        }
      }
      for (let root = 0; root < 6; root += 1) {
        const angle = yaw + root * Math.PI / 3 + (random() - 0.5) * 0.32;
        const middleX = tx + Math.cos(angle) * 0.65 * scale;
        const middleZ = tz + Math.sin(angle) * 0.65 * scale;
        const tipX = tx + Math.cos(angle + 0.18) * (1.35 + random() * 0.35) * scale;
        const tipZ = tz + Math.sin(angle + 0.18) * (1.35 + random() * 0.35) * scale;
        const middle = new THREE.Vector3(middleX, support(middleX, middleZ) + 0.16 * scale, middleZ);
        const tip = new THREE.Vector3(tipX, support(tipX, tipZ) + 0.045, tipZ);
        placeSegment(at(0, 0.25, 0), middle, 0.16 * scale, 0.65 + random() * 0.2);
        placeSegment(middle, tip, 0.09 * scale, 0.62 + random() * 0.2);
      }
    }
    const fencePanels = [[-10, -10, 0.24], [11, -11, -0.23], [-16, 10, 0.12],
      [24, 8, -0.17], [-16, -34, 0.45], [18, -34, -0.3], [-30, -24, 0.35], [30, -27, -0.25]];
    for (let panel = 0; panel < fencePanels.length; panel += 1) {
      const [fx, fz, yaw] = fencePanels[panel];
      const base = support(fx, fz);
      const at = (along) => [fx + Math.cos(yaw) * along, fz + Math.sin(yaw) * along];
      const brokenRail = panel % 3 === 1;
      for (const height of [0.49, 1.13]) {
        if (brokenRail && height > 1) {
          for (const section of [-1, 1]) {
            const [x, z] = at(section * 0.9);
            place(box, iron, x, base + height, z, 1.27, 0.06, 0.07, yaw, 0, 0.72);
          }
        } else place(box, iron, fx, base + height, fz, 3.3, 0.065, 0.075, yaw, 0, 0.78);
      }
      for (const end of [-1, 1]) {
        const [x, z] = at(end * 1.58);
        place(box, iron, x, base + 0.74, z, 0.12, 1.48, 0.13, yaw, 0, 0.7);
        place(spike, iron, x, base + 1.56, z, 1.25, 1, 1.25, yaw, 0, 0.67);
      }
      for (let picket = -3; picket <= 3; picket += 1) {
        if ((panel * 3 + picket + 12) % 8 === 0) continue;
        const [x, z] = at(picket * 0.39);
        const height = 1.23 + random() * 0.28 - (picket === 2 && brokenRail ? 0.35 : 0);
        place(box, iron, x, base + height * 0.5, z, 0.047, height, 0.05,
          yaw, (random() - 0.5) * 0.06, 0.64 + random() * 0.16);
        if (height > 1.25) place(spike, iron, x, base + height + 0.06, z,
          0.78, 0.78, 0.78, yaw, 0, 0.67);
      }
    }
    for (const { geometry, material, instances } of batches.values()) {
      const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
      mesh.name = material === bark ? "Arboles secos con raices" :
        material === iron ? "Rejas oxidadas y rotas" :
        geometry === markerGeometries[0] ? "Lapidas antiguas" :
        geometry === markerGeometries[1] ? "Lapidas fracturadas" :
          geometry === markerGeometries[2] ? "Cruces de piedra" :
            geometry === rubble ? "Piedras y fragmentos caidos" :
              geometry === bone || geometry === rib ? "Huesos dispersos" : "Criptas y losas";
      instances.forEach(({ matrix, shade }, index) => {
        mesh.setMatrixAt(index, matrix);
        mesh.setColorAt(index, tintColor.setScalar(shade));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = material !== interior && geometry !== rubble && geometry !== bone && geometry !== rib;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }

    const tuftGeometry = grassTuftGeometry();
    geometries.push(tuftGeometry);
    const grassMaterial = new THREE.MeshLambertMaterial({
      color: 0xb1bcaa, vertexColors: true, side: THREE.DoubleSide
    });
    grassMaterial.onBeforeCompile = (shader) => {
      grassShader = shader;
      shader.uniforms.uCemeteryTime = { value: 0 };
      shader.vertexShader = shader.vertexShader.replace("#include <common>",
        "#include <common>\nuniform float uCemeteryTime;");
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
        #include <begin_vertex>
        vec3 origin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float sway = sin(uCemeteryTime * 1.55 + origin.x * 0.37 + origin.z * 0.29)
          + sin(uCemeteryTime * 0.64 + origin.z * 0.53) * 0.38;
        float bend = pow(max(position.y, 0.0), 1.6);
        transformed.x += sway * bend * 0.13;
        transformed.z += sway * bend * 0.065;
      `);
    };
    grassMaterial.customProgramCacheKey = () => "cemetery-grass-wind-v2";
    materials.push(grassMaterial);
    const grassCount = 50000;
    const grass = new THREE.InstancedMesh(tuftGeometry, grassMaterial, grassCount);
    grass.name = "Maleza corta con viento";
    let placed = 0;
    for (let attempt = 0; placed < grassCount && attempt < grassCount * 3; attempt += 1) {
      const x = (random() - 0.5) * 56;
      const z = (random() - 0.5) * 56;
      if (crypts.some(([cx, cz]) => Math.abs(x - cx) < 1.9 && Math.abs(z - cz) < 2.3)) continue;
      const size = 0.2 + random() * 0.25;
      dummy.position.set(x, support(x, z) + 0.012, z);
      dummy.rotation.set(0, random() * Math.PI * 2, 0);
      dummy.scale.set(0.78 + random() * 0.55, size, 0.78 + random() * 0.55);
      dummy.updateMatrix();
      grass.setMatrixAt(placed, dummy.matrix);
      grass.setColorAt(placed, tintColor.setRGB(0.78 + random() * 0.22, 0.76 + random() * 0.24, 0.66 + random() * 0.29));
      placed += 1;
    }
    grass.count = placed;
    grass.instanceMatrix.needsUpdate = true;
    grass.receiveShadow = true;
    grass.frustumCulled = false;
    group.add(grass);
    const distantGeometry = grassTuftGeometry(2, true);
    geometries.push(distantGeometry);
    const distantCount = 60000;
    const distantGrass = new THREE.InstancedMesh(distantGeometry, grassMaterial, distantCount);
    distantGrass.name = "Maleza lejana con viento";
    let distantPlaced = 0;
    for (let attempt = 0; distantPlaced < distantCount && attempt < distantCount * 3; attempt += 1) {
      const reach = distantPlaced < 40000 ? 65 : 100;
      const x = (random() - 0.5) * reach * 2;
      const z = (random() - 0.5) * reach * 2;
      if (crypts.some(([cx, cz]) => Math.abs(x - cx) < 2 && Math.abs(z - cz) < 2.4)) continue;
      const size = 0.28 + random() * 0.34;
      dummy.position.set(x, support(x, z) + 0.012, z);
      dummy.rotation.set(0, random() * Math.PI * 2, 0);
      dummy.scale.set(0.85 + random() * 0.35, size, 0.85 + random() * 0.35);
      dummy.updateMatrix();
      distantGrass.setMatrixAt(distantPlaced, dummy.matrix);
      distantGrass.setColorAt(distantPlaced, tintColor.setRGB(0.81 + random() * 0.18, 0.79 + random() * 0.2, 0.69 + random() * 0.22));
      distantPlaced += 1;
    }
    distantGrass.count = distantPlaced;
    distantGrass.instanceMatrix.needsUpdate = true;
    distantGrass.frustumCulled = false;
    group.add(distantGrass);
    group.userData.stats = { graves, broken, crypts: crypts.length, bones,
      trees: trees.length, fencePanels: fencePanels.length, grass: placed + distantPlaced };
  };
  group.userData.animate = (time, reduced = false) => {
    if (grassShader) grassShader.uniforms.uCemeteryTime.value = time * 0.001;
    const nearGrass = group.getObjectByName("Maleza corta con viento");
    const farGrass = group.getObjectByName("Maleza lejana con viento");
    if (nearGrass) nearGrass.count = reduced ? 34000 : 50000;
    if (farGrass) farGrass.count = reduced ? 26000 : 60000;
  };
  group.userData.dispose = () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    texture?.dispose();
    barkTexture?.dispose();
    ironTexture?.dispose();
  };
  return group;
}
