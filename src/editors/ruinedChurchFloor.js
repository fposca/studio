import * as THREE from "three";
import concreteTextureUrl from "../assets/environments/concrete-texture.png";
import { applyChurchEngravings, churchTileEngraving } from "./ruinedChurchEngravings.js";
import { createRuinedChurchArchitecture } from "./ruinedChurchArchitecture.js";

const BED_Y = -0.19;
const COLUMNS = 64;
const ROWS = 64;
const DISTANT_COLUMNS = 160;
const DISTANT_ROWS = 160;
const STEP_X = 1.08;
const STEP_Z = 0.9;
export const RUINED_FLOOR_EXTENT = [DISTANT_COLUMNS * STEP_X / 2, DISTANT_ROWS * STEP_Z / 2];

function randomSource(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function stoneGeometry(outline, thickness = 0.148, bevel = 0.012) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, steps: 1, bevelEnabled: true,
    bevelSegments: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  geometry.translate(0, -geometry.boundingBox.min.y, 0);
  // A single stone texture spans each piece, including the exposed fracture faces.
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i += 1) {
    if (Math.abs(normals.getY(i)) > 0.6) uv.setXY(i, positions.getX(i) + 0.5, positions.getZ(i) + 0.5);
    else uv.setXY(i, positions.getX(i) + positions.getZ(i), positions.getY(i) * 2);
  }
  geometry.computeBoundingBox();
  return geometry;
}

function minimumTransformedY(geometry, matrix, point) {
  let minimum = Infinity;
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
    minimum = Math.min(minimum, point.y);
  }
  return minimum;
}

export function createRuinedChurchDebrisSystem() {
  const group = new THREE.Group();
  group.name = "Pavimento y mamposteria de iglesia";
  group.userData.editorHelper = true;
  group.visible = false;
  let built = false;
  let stoneTexture;
  let architecture;
  let architectureEnabled = false;
  let tint = new THREE.Color(0xffffff);
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const stoneMaterials = [];

  group.userData.setArchitectureEnabled = (enabled) => {
    architectureEnabled = enabled;
    if (enabled && stoneTexture && !architecture) {
      architecture = createRuinedChurchArchitecture(stoneTexture);
      group.add(architecture);
    }
    if (architecture) architecture.visible = enabled;
  };
  group.userData.animate = (time) => {
    if (group.visible && architecture?.visible) architecture.userData.animate(time);
  };

  group.userData.setTint = (color) => {
    tint.copy(color);
    for (const material of stoneMaterials) material.color.copy(tint);
  };

  group.userData.build = () => {
    if (built) return;
    built = true;
    const random = randomSource(61379);
    const texture = new THREE.TextureLoader().load(concreteTextureUrl);
    stoneTexture = texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1.4, 1.4);
    texture.anisotropy = 8;
    textures.add(texture);
    const top = new THREE.MeshStandardMaterial({
      color: tint, map: texture, bumpMap: texture, bumpScale: 0.035,
      roughness: 1, metalness: 0, envMapIntensity: 0.65
    });
    const edge = new THREE.MeshStandardMaterial({
      color: tint, map: texture, bumpMap: texture, bumpScale: 0.055,
      roughness: 1, metalness: 0, envMapIntensity: 0.65
    });
    applyChurchEngravings(top);
    materials.add(top);
    materials.add(edge);
    stoneMaterials.push(top, edge);
    const batches = new Map();
    const dummy = new THREE.Object3D();
    const point = new THREE.Vector3();
    const instanceColor = new THREE.Color();
    let largestSupportError = 0;
    let damagedCount = 0;
    let missingCount = 0;
    let engravedTiles = 0;

    const place = (geometry, x, z, rotation, scale, supportY, shade, label, engraving = [0, 0, 0]) => {
      geometries.add(geometry);
      dummy.position.set(x, 0, z);
      dummy.rotation.set(...rotation);
      dummy.scale.set(...scale);
      dummy.updateMatrix();
      const bottom = minimumTransformedY(geometry, dummy.matrix, point);
      // Settle the rotated geometry by its actual lowest vertex, never a guessed radius.
      dummy.position.y = supportY - bottom;
      dummy.updateMatrix();
      largestSupportError = Math.max(largestSupportError,
        Math.abs(minimumTransformedY(geometry, dummy.matrix, point) - supportY));
      if (!batches.has(geometry)) batches.set(geometry, { label, instances: [] });
      batches.get(geometry).instances.push({ matrix: dummy.matrix.clone(), shade, engraving });
    };

    const intact = [];
    const broken = [];
    for (let variant = 0; variant < 6; variant += 1) {
      const bevelCorner = 0.035 + random() * 0.07;
      intact.push(stoneGeometry([
        [-0.49 + bevelCorner, -0.395], [0.46 - bevelCorner, -0.39],
        [0.485, -0.39 + bevelCorner], [0.475, 0.38 - bevelCorner],
        [0.46 - bevelCorner, 0.395], [-0.47 + bevelCorner, 0.38],
        [-0.49, 0.36 - bevelCorner], [-0.485, -0.36 + bevelCorner]
      ]));
      const a = -0.3 + random() * 0.35;
      const b = -0.1 + random() * 0.35;
      const crack = Array.from({ length: 6 }, (_, i) => [
        THREE.MathUtils.lerp(a, b, i / 5) + (i === 0 || i === 5 ? 0 : (random() - 0.5) * 0.085),
        -0.385 + i * 0.153
      ]);
      broken.push([
        stoneGeometry([[-0.46, -0.385], ...crack.map(([x, z]) => [x - 0.025, z]), [-0.48, 0.37]]),
        stoneGeometry([...crack.map(([x, z]) => [x + 0.025, z]), [0.46, 0.38], [0.48, -0.37]])
      ]);
    }

    const damagePatches = [[-7, 3, 2.4], [6, -5, 2.7], [11, 8, 2.3], [-14, -10, 3.1], [20, -18, 3], [-21, 16, 3.2], [15, 23, 2.6]];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLUMNS; col += 1) {
        const x = (col - (COLUMNS - 1) / 2) * STEP_X;
        const z = (row - (ROWS - 1) / 2) * STEP_Z;
        const calm = Math.hypot(x, z) < 3.6;
        let damage = 0;
        let pileDistance = Infinity;
        for (const [px, pz, radius] of damagePatches) {
          const distance = Math.hypot(x - px, z - pz);
          damage = Math.max(damage, 1 - distance / radius);
          pileDistance = Math.min(pileDistance, distance);
        }
        const missing = !calm && (pileDistance < 2.3 || (damage > 0.28 && random() < 0.68) || random() < 0.018);
        if (missing) { missingCount += 1; continue; }
        const variant = Math.floor(random() * intact.length);
        const fractured = random() < (calm ? 0.14 : 0.17 + damage * 0.72);
        const tilt = calm ? 0.002 : damage > 0 ? 0.09 : 0.018;
        const sunk = !calm && random() < 0.1;
        const support = BED_Y - (sunk ? random() * 0.05 : 0);
        const scale = [0.97 + random() * 0.055, 0.94 + random() * 0.08, 0.94 + random() * 0.065];
        const yaw = (random() - 0.5) * (damage > 0 ? 0.07 : 0.018);
        const shade = 0.66 + random() * 0.27;
        const engraving = churchTileEngraving(col - COLUMNS / 2, row - ROWS / 2);
        if (engraving[0]) engravedTiles += 1;
        if (fractured) {
          damagedCount += 1;
          broken[variant].forEach((geometry, index) => {
            const shift = (index === 0 ? -1 : 1) * (calm ? 0.012 : 0.028 + damage * 0.025);
            place(geometry, x + shift, z, [(random() - 0.5) * tilt, yaw, (random() - 0.5) * tilt], scale, support, shade, "Baldosas fracturadas", engraving);
          });
        } else {
          place(intact[variant], x, z, [(random() - 0.5) * tilt, yaw, (random() - 0.5) * tilt], scale, support, shade, "Losas con juntas abiertas", engraving);
        }
      }
    }

    // Beyond the chipped foreground slabs, simple instances keep real joints and relief.
    const distantTile = new THREE.BoxGeometry(0.97, 0.15, 0.79);
    distantTile.translate(0, 0.075, 0);
    for (const face of distantTile.groups) face.materialIndex = face.materialIndex === 2 ? 0 : 1;
    const distantRandom = randomSource(8147);
    let distantTiles = 0;
    for (let row = 0; row < DISTANT_ROWS; row += 1) {
      for (let col = 0; col < DISTANT_COLUMNS; col += 1) {
        const x = (col - (DISTANT_COLUMNS - 1) / 2) * STEP_X;
        const z = (row - (DISTANT_ROWS - 1) / 2) * STEP_Z;
        if (Math.abs(x) < COLUMNS * STEP_X / 2 && Math.abs(z) < ROWS * STEP_Z / 2) continue;
        if (distantRandom() < 0.025) continue;
        place(distantTile, x, z,
          [(distantRandom() - 0.5) * 0.025, (distantRandom() - 0.5) * 0.03, 0],
          [0.98 + distantRandom() * 0.04, 0.8 + distantRandom() * 0.25, 0.96 + distantRandom() * 0.04],
          BED_Y, 0.66 + distantRandom() * 0.27, "Pavimento distante",
          churchTileEngraving(col - DISTANT_COLUMNS / 2, row - DISTANT_ROWS / 2));
        distantTiles += 1;
      }
    }

    const block = stoneGeometry([[-0.47, -0.22], [0.43, -0.25], [0.5, -0.14], [0.46, 0.23], [-0.44, 0.25], [-0.49, 0.12]], 0.28, 0.025);
    const column = new THREE.CylinderGeometry(0.3, 0.34, 1.2, 12, 1);
    for (const cap of column.groups) cap.materialIndex = Math.min(cap.materialIndex, 1);
    const columnPositions = column.attributes.position;
    for (let i = 0; i < columnPositions.count; i += 1) {
      if (columnPositions.getY(i) > 0.5) columnPositions.setY(i, 0.53 + 0.08 * Math.sin(columnPositions.getX(i) * 17 + columnPositions.getZ(i) * 11));
    }
    column.computeVertexNormals();
    const chips = stoneGeometry([[-0.4, -0.3], [0.43, -0.12], [0.12, 0.38]], 0.14, 0.015);
    // Masonry piles sit in missing-tile areas, so the visible support is the exposed bed.
    damagePatches.forEach(([px, pz], pile) => {
      for (let i = 0; i < 8; i += 1) {
        const angle = i * 2.39996;
        const radius = 0.12 + i * 0.13;
        place(i < 3 ? block : chips, px + Math.cos(angle) * radius, pz + Math.sin(angle) * radius,
          [(random() - 0.5) * 0.12, random() * Math.PI, (random() - 0.5) * 0.15],
          [0.6 + random() * 0.45, 0.75 + random() * 0.35, 0.7 + random() * 0.3], BED_Y, 0.7 + random() * 0.22, "Mamposteria caida");
      }
      if (pile % 2 === 0) {
        place(column, px, pz, [Math.PI / 2, pile * 0.73, 0.07], [1, 1.2, 1], BED_Y, 0.88, "Tambores de columna caidos");
      }
    });

    for (const [geometry, { label, instances }] of batches) {
      const mesh = new THREE.InstancedMesh(geometry, [top, edge], instances.length);
      mesh.name = label;
      const engravings = new Float32Array(instances.length * 3);
      instances.forEach(({ matrix, shade, engraving }, i) => {
        mesh.setMatrixAt(i, matrix);
        instanceColor.setRGB(shade, shade * 0.98, shade * 0.94);
        mesh.setColorAt(i, instanceColor);
        engravings.set(engraving, i * 3);
      });
      geometry.setAttribute("churchEngraving", new THREE.InstancedBufferAttribute(engravings, 3));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = geometry !== distantTile;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    // Include variants with zero instances in resource cleanup as well.
    intact.forEach((geometry) => geometries.add(geometry));
    broken.flat().forEach((geometry) => geometries.add(geometry));

    const fill = new THREE.HemisphereLight(0xc7d6e6, 0x403b33, 0.7);
    fill.name = "Rebote lunar de la nave";
    const rim = new THREE.DirectionalLight(0xd1dbe5, 0.55);
    rim.name = "Luz suave de las ruinas";
    rim.position.set(-4, 8, 10);
    group.add(fill, rim);
    group.userData.stats = {
      intactTiles: COLUMNS * ROWS - missingCount - damagedCount,
      brokenTiles: damagedCount, missingTiles: missingCount,
      engravedTiles,
      distantTiles,
      meshes: batches.size, maxSupportError: largestSupportError
    };
    group.userData.setArchitectureEnabled(architectureEnabled);
  };

  group.userData.dispose = () => {
    group.children.forEach((object) => { if (object.isInstancedMesh) object.dispose(); });
    architecture?.userData.dispose();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  };
  return group;
}

export function createRuinedChurchBedMaterial(map, color) {
  const material = new THREE.MeshStandardMaterial({
    color, map, bumpMap: map, bumpScale: 0.025, roughness: 1, metalness: 0, envMapIntensity: 0.55
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
      #include <common>
      varying vec2 vChurchFloor;
    `).replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vChurchFloor = position.xy;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
      #include <common>
      varying vec2 vChurchFloor;
      float churchHash(vec2 cell) {
        return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      }
      float churchNoise(vec2 p) {
        vec2 cell = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(churchHash(cell), churchHash(cell + vec2(1.0, 0.0)), f.x),
          mix(churchHash(cell + vec2(0.0, 1.0)), churchHash(cell + vec2(1.0, 1.0)), f.x), f.y);
      }
      float churchJointIntegral(float x, float gap) {
        return floor(x) * (2.0 * gap) + min(fract(x), gap) + max(fract(x) - (1.0 - gap), 0.0);
      }
      float churchJoint(float x, float gap) {
        float width = max(fwidth(x), 0.0001);
        return clamp((churchJointIntegral(x + width * 0.5, gap) -
          churchJointIntegral(x - width * 0.5, gap)) / width, 0.0, 1.0);
      }
    `).replace("#include <map_fragment>", `
      #include <map_fragment>
      vec2 edgeDistance = abs(vChurchFloor) - vec2(${RUINED_FLOOR_EXTENT[0]}, ${RUINED_FLOOR_EXTENT[1]});
      float soil = 1.0 - smoothstep(-0.18, 0.12, max(edgeDistance.x, edgeDistance.y));
      float grain = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 earth = vec3(0.06, 0.051, 0.04) * (0.55 + grain * 2.2);
      vec2 grid = vChurchFloor / vec2(${STEP_X}, ${STEP_Z});
      vec2 cell = floor(grid);
      // Filter each family of joints independently instead of erasing the whole pattern.
      float tile = (1.0 - churchJoint(grid.x, 0.05 / ${STEP_X})) *
        (1.0 - churchJoint(grid.y, 0.05 / ${STEP_Z}));
      float footprint = max(fwidth(grid.x), fwidth(grid.y));
      float distant = smoothstep(0.5, 1.8, footprint);
      float variation = mix(0.66 + churchHash(cell) * 0.27, 0.79, distant);
      float weathering = 0.65 + churchNoise(vChurchFloor * 0.08) * 0.5 +
        churchNoise(vChurchFloor * 0.27) * 0.2;
      vec3 stone = diffuseColor.rgb * vec3(1.0, 0.98, 0.94) * variation * weathering;
      diffuseColor.rgb = mix(mix(earth, stone, tile), earth, soil);
    `);
  };
  material.customProgramCacheKey = () => "ruined-church-soil-v2";
  return material;
}
