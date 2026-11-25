import * as THREE from "three";

/** Lightweight, owned resources. Caller attaches returned groups and calls update once/frame.
 * Items are centered in local coordinates (Y up, detailed face +Z).
 * Terminal floor is Y=0, front +Z; its socket is exposed as userData.itemSocket.
 * Vehicle attachment uses the flying vehicle group coordinates: +Z forward, hull bottom Y=-1.72.
 */
export function createFuegoArt() {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const terminals = [], vehicles = [], roots = [];
  let elapsed = 0, disposed = false;
  const geo = g => (geometries.add(g), g);
  const mat = m => (materials.add(m), m);
  const box = geo(new THREE.BoxGeometry(1, 1, 1));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 12));
  const ring = geo(new THREE.TorusGeometry(1, .1, 6, 24));
  const metal = mat(new THREE.MeshStandardMaterial({ color: 0xa7bdc7, metalness: .72, roughness: .31 }));
  const dark = mat(new THREE.MeshStandardMaterial({ color: 0x14212b, metalness: .45, roughness: .4 }));
  const board = mat(new THREE.MeshStandardMaterial({ color: 0x292137, metalness: .4, roughness: .4 }));
  const copper = mat(new THREE.MeshStandardMaterial({ color: 0xc9a476, metalness: .72, roughness: .3 }));
  const cyan = mat(new THREE.MeshBasicMaterial({ color: 0x73edff, toneMapped: false }));
  const violet = mat(new THREE.MeshBasicMaterial({ color: 0xbb92ff, toneMapped: false }));
  const white = mat(new THREE.MeshBasicMaterial({ color: 0xd9faff, toneMapped: false }));
  const halo = mat(new THREE.MeshBasicMaterial({ color: 0x53dbf4, transparent: true, opacity: .13,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  function group(name, parent) {
    const g = new THREE.Group(); g.name = name; g.userData.cityKeep = true;
    if (parent) parent.add(g); else roots.push(g);
    return g;
  }
  function part(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    const m = new THREE.Mesh(geometry, material); m.position.set(...position); m.scale.set(...scale); m.rotation.set(...rotation);
    m.userData.cityKeep = true; m.userData.invasionVisionPreserve = true;
    m.castShadow = false; parent.add(m); return m;
  }
  function block(parent, material, position, scale, rotation) { return part(parent, box, material, position, scale, rotation); }
  const labelCache = new Map();
  function label(parent, title, subtitle, position, size, color = "#8aefff") {
    const key = title + subtitle + color;
    let material = labelCache.get(key);
    if (!material) {
      const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#08151e"; ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(10, 10, 492, 236);
      ctx.fillStyle = color; ctx.textAlign = "center"; ctx.font = "bold 36px monospace";
      ctx.fillText(title, 256, 100, 470); ctx.font = "22px monospace";
      ctx.fillText(subtitle, 256, 155, 470);
      ctx.fillStyle = "#35616c"; ctx.fillRect(35, 199, 442, 4);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
      material = mat(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })); labelCache.set(key, material);
    }
    return part(parent, box, material, position, [size[0], size[1], .008]);
  }
  function createItem(id) {
    if (!["fuego_key", "fuego_power_cell", "fuego_navigation_module"].includes(id)) throw new Error(`Unknown Fuego item: ${id}`);
    const root = group(id); root.userData.itemId = id;
    if (id === "fuego_key") {
      root.name = "Fuego / llave dentada con chip";
      block(root, dark, [0, .115, 0], [.19, .20, .06]);
      block(root, metal, [0, -.115, 0], [.065, .27, .027]);
      // A continuous blade with three visibly different cuts, never an orb silhouette.
      for (let i = 0; i < 3; i++) block(root, metal, [.045, -.04 - i * .073, 0], [.045 + (i % 2) * .023, .035, .027]);
      block(root, dark, [-.012, -.115, .016], [.009, .24, .004]);
      block(root, metal, [0, .12, .034], [.10, .09, .012]);
      block(root, cyan, [0, .12, .043], [.065, .055, .008]).name = "Chip cian / detectable en frecuencia";
      for (const x of [-.065, .065]) block(root, copper, [x, .12, .035], [.009, .045, .012]);
      part(root, ring, metal, [0, .255, 0], [.065, .065, .065]);
    } else if (id === "fuego_power_cell") {
      root.name = "Fuego / celda de alta densidad";
      part(root, cylinder, dark, [0, 0, 0], [.17, .46, .17]);
      part(root, cylinder, cyan, [0, 0, 0], [.177, .27, .177]);
      for (const y of [-.205, .205]) {
        part(root, cylinder, metal, [0, y, 0], [.215, .11, .215]);
        part(root, ring, dark, [0, y, 0], [.215, .215, .215], [Math.PI / 2, 0, 0]);
      }
      for (const x of [-.085, .085]) part(root, cylinder, copper, [x, .295, 0], [.035, .075, .035]);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        block(root, metal, [Math.sin(a) * .18, 0, Math.cos(a) * .18], [.035, .36, .035]);
      }
      block(root, dark, [0, 0, .187], [.12, .17, .025]);
      block(root, white, [.009, .025, .204], [.025, .08, .006], [0, 0, -.45]);
      block(root, white, [-.009, -.035, .204], [.025, .08, .006], [0, 0, -.45]);
      part(root, cylinder, halo, [0, 0, 0], [.225, .29, .225]);
    } else {
      root.name = "Fuego / navegador independiente";
      block(root, metal, [0, 0, 0], [.58, .38, .065]);
      block(root, board, [0, 0, .039], [.53, .33, .02]);
      block(root, dark, [0, 0, .061], [.17, .17, .035]);
      block(root, violet, [0, 0, .082], [.12, .12, .008]);
      for (const sign of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const y = (i - 1) * .09;
          block(root, violet, [sign * .163, y, .054], [.14, .009, .008]);
          block(root, violet, [sign * .232, y + sign * .02, .054], [.009, .05, .008]);
        }
        for (let i = 0; i < 5; i++) block(root, copper, [(i - 2) * .075, sign * .202, .005], [.035, .04, .035]);
      }
      for (const x of [-.25, .25]) for (const y of [-.14, .14])
        part(root, cylinder, metal, [x, y, .056], [.014, .012, .014], [Math.PI / 2, 0, 0]);
    }
    return root;
  }
  /** kind: charge | maintenance. setOpen animates; setProgress drives a 0..1 meter.
   * Add the item to userData.itemSocket, then hide/remove it on collection.
   */
  function createTerminal(kind = "charge") {
    const charge = kind === "charge", accent = charge ? cyan : violet;
    const root = group(charge ? "Fuego / terminal de carga local" : "Fuego / mantenimiento urbano");
    block(root, dark, [0, .81, -.245], [.92, 1.62, .06]);
    for (const x of [-.43, .43]) block(root, dark, [x, .81, 0], [.06, 1.62, .55]);
    block(root, dark, [0, 1.35, 0], [.92, .54, .55]);
    block(root, dark, [0, .20, 0], [.92, .40, .55]);
    block(root, metal, [0, .055, 0], [1.05, .11, .69]);
    for (const x of [-.43, .43]) block(root, metal, [x, .84, .285], [.045, 1.46, .035]);
    label(root, charge ? "CARGA LOCAL" : "NAVEGACION", charge ? "MANTENIMIENTO SIN RED" : "ACCESO INDEPENDIENTE", [0, 1.36, .289], [.76, .35], charge ? "#8aefff" : "#c4a5ff");
    for (const y of [.37, 1.09]) block(root, metal, [0, y, .285], [.76, .04, .05]);
    block(root, dark, [0, .73, -.20], [.66, .62, .018]);
    const socket = group("Compartimento / objeto", root); socket.position.set(0, .72, .06);
    const pivot = group("Puerta articulada", root); pivot.position.set(-.36, .73, .37);
    block(pivot, dark, [.36, 0, 0], [.72, .67, .045]);
    block(pivot, metal, [.63, 0, .04], [.045, .23, .045]);
    block(pivot, accent, [.10, 0, .027], [.025, .45, .009]);
    label(pivot, charge ? "ENERGIA" : "MODULO", "ACCESO LOCAL", [.36, 0, .028], [.36, .19], charge ? "#8aefff" : "#c4a5ff");
    block(root, dark, [0, .245, .29], [.70, .08, .03]);
    const meter = block(root, accent, [-.325, .245, .311], [.001, .025, .009]);
    const entry = { pivot, meter, target: 0, fraction: 0 }; terminals.push(entry);
    root.userData.itemSocket = socket; root.userData.itemAnchor = socket;
    root.userData.setOpen = value => { entry.target = value ? 1 : 0; };
    root.userData.setProgress = value => { const v = THREE.MathUtils.clamp(Number(value) || 0, 0, 1); meter.scale.x = Math.max(.001, v * .65); meter.position.x = -.325 + v * .325; };
    return root;
  }
  /** Attach directly to vehicle.group, not modelPivot. All position vectors can be overridden
   * to fit a different hull. Returned .userData.setState accepts installation booleans.
   */
  function createVehicleSystems({ dashboardPosition = [0, -.10, .30], navigationPosition = [.55, .28, .35], thrusterY = -1.72, headlightZ = 1.9 } = {}) {
    const root = group("Fuego / sistemas independientes");
    const dashboard = group("Tablero encendido", root); dashboard.position.set(...dashboardPosition);
    block(dashboard, dark, [0, 0, 0], [1.03, .23, .09]);
    for (const x of [-.30, 0, .30]) {
      part(dashboard, ring, cyan, [x, 0, .055], [.065, .065, .065]);
      block(dashboard, white, [x + .015, .01, .063], [.035, .009, .008], [0, 0, .5]);
    }
    const energy = group("Propulsion cian", root);
    const headlights = group("Faros / sistema operativo", root);
    const thrusters = [];
    for (const x of [-.65, .65]) {
      part(energy, cylinder, metal, [x, thrusterY + .05, .55], [.19, .11, .19]);
      const beam = part(energy, cylinder, halo, [x, thrusterY - .10, .55], [.22, .20, .22]); thrusters.push(beam);
      part(energy, ring, cyan, [x, thrusterY, .55], [.17, .17, .17], [Math.PI / 2, 0, 0]);
      block(headlights, white, [x, -.65, headlightZ], [.31, .12, .025]);
    }
    const navigation = group("Navegacion independiente", root); navigation.position.set(...navigationPosition);
    block(navigation, metal, [0, 0, -.015], [.66, .38, .045]);
    label(navigation, "RUTA LOCAL", "SIN CONEXION A LA RED", [0, 0, .015], [.61, .33], "#c4a5ff");
    const entry = { dashboard, energy, navigation, headlights, thrusters }; vehicles.push(entry);
    root.userData.setState = ({ keyInstalled = false, powerInstalled = false, navigationInstalled = false, powered = false } = {}) => {
      dashboard.visible = !!keyInstalled; energy.visible = !!powerInstalled; navigation.visible = !!navigationInstalled; headlights.visible = !!powered;
    };
    root.userData.setState();
    return root;
  }
  return { createItem, createTerminal, createVehicleSystems,
    update(dt, progress) {
      if (disposed) return;
      const step = THREE.MathUtils.clamp(Number(dt) || 0, 0, .1); elapsed += step;
      for (const terminal of terminals) {
        terminal.fraction = THREE.MathUtils.damp(terminal.fraction, terminal.target, 7, step);
        terminal.pivot.rotation.y = -terminal.fraction * Math.PI * .66;
      }
      for (const vehicle of vehicles) {
        if (progress) { vehicle.dashboard.visible = !!progress.keyInstalled; vehicle.energy.visible = !!progress.powerInstalled; vehicle.navigation.visible = !!progress.navigationInstalled; vehicle.headlights.visible = !!progress.powered; }
        for (const beam of vehicle.thrusters) beam.scale.y = .20 + Math.sin(elapsed * 5) * .025;
      }
    },
    dispose() {
      if (disposed) return; disposed = true;
      roots.forEach(root => root.removeFromParent());
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      terminals.length = vehicles.length = roots.length = 0; labelCache.clear();
    },
  };
}
