import * as THREE from "three";
import { CUSTOM_AVATAR_DEFAULTS, normalizeAvatarCustomization } from "./avatarCustomization.js";

function addMesh(group, geometry, material, position, scale) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function strand(group, material, start, end, radius = .009) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const length = a.distanceTo(b);
  const mesh = addMesh(group, new THREE.CylinderGeometry(radius * .65, radius, length, 6), material,
    [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2]);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
}

function addHair(group, style, color) {
  if (style === "none") return;
  const material = new THREE.MeshStandardMaterial({ color, roughness: .88 });
  const cap = new THREE.Group();
  addMesh(cap, new THREE.SphereGeometry(.121, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), material, [0, .154, -.01], [1, 1, .94]);
  addMesh(cap, new THREE.SphereGeometry(.07, 16, 10), material, [0, .211, -.04], [1.25, .55, 1]);
  for (let i = -4; i <= 4; i++) {
    const x = i * .018;
    strand(cap, material, [x, .197 - Math.abs(i) * .004, .045], [x * .87, .12 - Math.abs(i) * .002, .083], .008);
  }
  if (style === "medium" || style === "long") {
    const endY = style === "long" ? -.13 : .01;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const z = -.075 + i * .037;
        strand(cap, material, [side * (.08 + i * .003), .15, z],
          [side * (.091 + i * .002), endY + (i % 2) * .012, z + .006], .014);
      }
    }
    for (let i = -4; i <= 4; i++) {
      strand(cap, material, [i * .019, .15, -.088],
        [i * .019, endY + (i % 2) * .01, -.09], .012);
    }
  }
  group.add(cap);
}

function addBeard(group, style, color) {
  if (style === "none") return;
  const material = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: style === "stubble", opacity: style === "stubble" ? .63 : 1 });
  addMesh(group, new THREE.SphereGeometry(1, 20, 12), material,
    [0, -.012, .087], [.063, style === "full" ? .046 : .019, .014]);
  if (style === "short" || style === "full") {
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.SphereGeometry(1, 12, 10), material,
        [side * .055, .021, .06], [.014, .028, .012]);
      strand(group, material, [side * .046, -.005, .082],
        [side * .03, style === "full" ? -.07 : -.025, .08], .015);
    }
  }
  if (style === "full") {
    addMesh(group, new THREE.ConeGeometry(.048, .079, 16), material, [0, -.047, .092]);
  }
}

function addGlasses(group, style) {
  if (style === "none") return;
  const frame = new THREE.MeshStandardMaterial({ color: "#152638", metalness: .55, roughness: .28 });
  const lens = new THREE.MeshPhysicalMaterial({ color: "#a6d5ef", transparent: true, opacity: .16,
    metalness: .06, roughness: .1, side: THREE.DoubleSide, depthWrite: false });
  for (const side of [-1, 1]) {
    const x = side * .031;
    if (style === "round") {
      addMesh(group, new THREE.TorusGeometry(.023, .0027, 8, 22), frame, [x, .084, .12]);
      addMesh(group, new THREE.CircleGeometry(.021, 20), lens, [x, .084, .119]);
    } else {
      const points = [[-.024, -.017], [.024, -.017], [.026, .016], [-.026, .016], [-.024, -.017]];
      const curve = new THREE.CatmullRomCurve3(points.map(([px, py]) => new THREE.Vector3(x + px, .084 + py, .12)), true, "centripetal");
      addMesh(group, new THREE.TubeGeometry(curve, 20, .0035, 5, true), frame, [0, 0, 0]);
      addMesh(group, new THREE.PlaneGeometry(.048, .032), lens, [x, .083, .119]);
    }
    strand(group, frame, [x + side * .023, .087, .115], [side * .087, .087, -.019], .0025);
  }
  strand(group, frame, [-.014, .088, .12], [.014, .088, .12], .0035);
}

function ensureColorMaterial(model) {
  if (model.userData.customAvatarMaterials) return;
  const materials = [];
  model.traverse(part => {
    if (!part.isMesh) return;
    const source = Array.isArray(part.material) ? part.material : [part.material];
    const cloned = source.map(original => {
      const material = original.clone();
      const colors = {
        shirt: new THREE.Color(CUSTOM_AVATAR_DEFAULTS.shirtColor),
        pants: new THREE.Color(CUSTOM_AVATAR_DEFAULTS.pantsColor),
        shoes: new THREE.Color(CUSTOM_AVATAR_DEFAULTS.shoesColor),
        shirtOn: { value: 0 }, pantsOn: { value: 0 }, shoesOn: { value: 0 },
      };
      material.userData.avatarColors = colors;
      material.onBeforeCompile = shader => {
        shader.uniforms.avatarShirt = { value: colors.shirt };
        shader.uniforms.avatarPants = { value: colors.pants };
        shader.uniforms.avatarShoes = { value: colors.shoes };
        shader.uniforms.avatarShirtOn = colors.shirtOn;
        shader.uniforms.avatarPantsOn = colors.pantsOn;
        shader.uniforms.avatarShoesOn = colors.shoesOn;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>", "#include <common>\nvarying float vAvatarRestY;")
          .replace("#include <skinning_vertex>", "#include <skinning_vertex>\nvAvatarRestY = transformed.y;");
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>", "#include <common>\nvarying float vAvatarRestY;\nuniform vec3 avatarShirt;\nuniform vec3 avatarPants;\nuniform vec3 avatarShoes;\nuniform float avatarShirtOn;\nuniform float avatarPantsOn;\nuniform float avatarShoesOn;")
          .replace("#include <map_fragment>", `#include <map_fragment>
            float avatarLight = dot(diffuseColor.rgb, vec3(.2126, .7152, .0722));
            float avatarSpread = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b) - min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
            if (avatarShirtOn > .5 && vAvatarRestY > .83 && vAvatarRestY < 1.5 && avatarLight > .32 && avatarSpread < .18) {
              diffuseColor.rgb = avatarShirt * (.48 + .78 * clamp(avatarLight, 0., 1.));
            } else if (avatarPantsOn > .5 && vAvatarRestY > .19 && vAvatarRestY < 1.04 && avatarLight < .35 && diffuseColor.b >= diffuseColor.r * .95) {
              diffuseColor.rgb = avatarPants * (.52 + .95 * clamp(avatarLight * 4., 0., 1.));
            } else if (avatarShoesOn > .5 && vAvatarRestY < .20 && avatarLight > .20 && avatarSpread < .2) {
              diffuseColor.rgb = avatarShoes * (.45 + .85 * clamp(avatarLight, 0., 1.));
            }
            `);
      };
      material.customProgramCacheKey = () => "office-custom-avatar-colors-v1";
      materials.push(material);
      return material;
    });
    part.material = Array.isArray(part.material) ? cloned : cloned[0];
  });
  model.userData.customAvatarMaterials = materials;
}

export function applyCustomAvatar(model, input) {
  if (!model) return;
  const config = normalizeAvatarCustomization(input);
  ensureColorMaterial(model);
  for (const material of model.userData.customAvatarMaterials) {
    const colors = material.userData.avatarColors;
    colors.shirt.set(config.shirtColor);
    colors.pants.set(config.pantsColor);
    colors.shoes.set(config.shoesColor);
    colors.shirtOn.value = Number(config.shirtColor !== CUSTOM_AVATAR_DEFAULTS.shirtColor);
    colors.pantsOn.value = Number(config.pantsColor !== CUSTOM_AVATAR_DEFAULTS.pantsColor);
    colors.shoesOn.value = Number(config.shoesColor !== CUSTOM_AVATAR_DEFAULTS.shoesColor);
  }
  const accessoryKey = [config.hairStyle, config.hairColor, config.beardStyle,
    config.beardColor, config.glasses].join("|");
  if (model.userData.customAvatarAccessoriesKey === accessoryKey) return;
  let head = null;
  model.traverse(part => { if (part.isBone && /Head$/i.test(part.name)) head = part; });
  if (!head) return;
  const old = head.getObjectByName("custom-avatar-accessories");
  if (old) {
    head.remove(old);
    old.traverse(part => { part.geometry?.dispose(); part.material?.dispose(); });
  }
  const accessories = new THREE.Group();
  accessories.name = "custom-avatar-accessories";
  addHair(accessories, config.hairStyle, config.hairColor);
  addBeard(accessories, config.beardStyle, config.beardColor);
  addGlasses(accessories, config.glasses);
  head.add(accessories);
  model.userData.customAvatarAccessoriesKey = accessoryKey;
}
