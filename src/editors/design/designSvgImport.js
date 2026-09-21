import paper from "paper";

function colorToCss(color, fallback) {
  if (!color) return fallback;
  return color.toCSS(true);
}

function pathFromSource(scope, source) {
  let path = null;
  if (source instanceof scope.Path || source instanceof scope.CompoundPath) path = source.clone({ insert: false });
  else if (source instanceof scope.Shape) path = source.toPath(false);
  if (!path || !path.pathData) return null;
  path.applyMatrix = true;
  if (source.parent?.globalMatrix) path.transform(source.parent.globalMatrix);
  return path;
}

function fillDetails(source) {
  const color = source?.fillColor;
  if (!color) return { fill: "none", fill2: "#ff6a00", fillType: "none" };
  if (color.gradient) {
    const stops = color.gradient.stops || [];
    return {
      fill: colorToCss(stops[0]?.color, "#a100ff"),
      fill2: colorToCss(stops.at(-1)?.color, "#ff6a00"),
      fillType: color.gradient.radial ? "radial" : "linear"
    };
  }
  return { fill: colorToCss(color, "#a100ff"), fill2: "#ff6a00", fillType: "solid" };
}

function collectGeometry(scope, root) {
  const geometry = [];
  const descendants = root.getItems ? root.getItems({ recursive: true }) : [];
  const sources = descendants.filter((source, index, all) => all.indexOf(source) === index);
  sources.forEach((source) => {
    if (source.clipMask || source.visible === false) return;
    let ancestor = source.parent;
    let clippedAncestor = null;
    while (ancestor && ancestor !== root) {
      if (ancestor.clipped) {
        clippedAncestor = ancestor;
        break;
      }
      ancestor = ancestor.parent;
    }
    if (clippedAncestor) return;

    if (source.clipped) {
      const nested = source.getItems({ recursive: true });
      const clipSource = nested.find((item) => item.clipMask);
      const paintSource = nested.find((item) => !item.clipMask && item.fillColor);
      const path = clipSource && pathFromSource(scope, clipSource);
      if (!path || !paintSource) return;
      geometry.push({
        path,
        ...fillDetails(paintSource),
        stroke: "none",
        strokeWidth: 0,
        opacity: paintSource.opacity ?? 1,
        name: source.name || "Forma SVG"
      });
      return;
    }

    const path = pathFromSource(scope, source);
    if (!path) return;

    geometry.push({
      path,
      ...fillDetails(source),
      stroke: colorToCss(source.strokeColor, "none"),
      strokeWidth: source.strokeColor ? source.strokeWidth || 1 : 0,
      opacity: source.opacity ?? 1,
      name: source.name || "Forma SVG"
    });
  });
  return geometry;
}

export function importDesignSvg(svgText, board) {
  if (!/<svg[\s>]/i.test(svgText)) throw new Error("El archivo no contiene un SVG valido");
  const scope = new paper.PaperScope();
  scope.setup(new scope.Size(1, 1));

  try {
    const root = scope.project.importSVG(svgText, { expandShapes: true, insert: false });
    const geometry = collectGeometry(scope, root);
    if (!geometry.length) throw new Error("El SVG no contiene formas vectoriales compatibles");

    const sourceBounds = geometry.reduce((bounds, entry) => bounds ? bounds.unite(entry.path.bounds) : entry.path.bounds.clone(), null);
    const maxWidth = Math.max(1, board.w * 0.72);
    const maxHeight = Math.max(1, board.h * 0.72);
    const scale = Math.min(maxWidth / Math.max(1, sourceBounds.width), maxHeight / Math.max(1, sourceBounds.height), 1);
    const targetX = (board.w - sourceBounds.width * scale) / 2;
    const targetY = (board.h - sourceBounds.height * scale) / 2;
    const groupId = geometry.length > 1 ? `svg-import-${Date.now()}` : undefined;

    return geometry.map((entry, index) => {
      entry.path.translate(new scope.Point(-sourceBounds.x, -sourceBounds.y));
      entry.path.scale(scale, new scope.Point(0, 0));
      entry.path.translate(new scope.Point(targetX, targetY));
      const bounds = entry.path.bounds;
      return {
        id: `svg-path-${Date.now()}-${index}`,
        type: "svgPath",
        name: entry.name === "Forma SVG" && geometry.length > 1 ? `Forma SVG ${index + 1}` : entry.name,
        d: entry.path.pathData,
        pathBounds: { x: bounds.x, y: bounds.y, w: Math.max(1, bounds.width), h: Math.max(1, bounds.height) },
        x: 0,
        y: 0,
        fill: entry.fill === "none" ? "#a100ff" : entry.fill,
        fill2: entry.fill2,
        fillType: entry.fillType,
        stroke: entry.stroke,
        strokeWidth: entry.strokeWidth * scale,
        opacity: entry.opacity,
        rotation: 0,
        shadow: false,
        lineCap: "round",
        arrowMode: "none",
        groupId
      };
    });
  } finally {
    scope.remove();
  }
}
