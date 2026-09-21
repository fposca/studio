import paper from "paper";

function segmentToPoint(segment, origin) {
  return {
    x: segment.point.x - origin.x,
    y: segment.point.y - origin.y,
    inX: segment.handleIn.x,
    inY: segment.handleIn.y,
    outX: segment.handleOut.x,
    outY: segment.handleOut.y,
    manualIn: !segment.handleIn.isZero(),
    manualOut: !segment.handleOut.isZero()
  };
}

export function convertSvgPathToEditable(item) {
  const scope = new paper.PaperScope();
  scope.setup(new scope.Size(1, 1));
  try {
    const source = scope.PathItem.create(item.d);
    const bounds = item.pathBounds;
    source.scale(item.scaleX || 1, item.scaleY || 1, new scope.Point(bounds.x, bounds.y));
    source.translate(new scope.Point(item.x || 0, item.y || 0));
    if (item.rotation) {
      const center = new scope.Point(
        item.x + bounds.x + bounds.w * (item.scaleX || 1) / 2,
        item.y + bounds.y + bounds.h * (item.scaleY || 1) / 2
      );
      source.rotate(item.rotation, center);
    }

    const contours = source instanceof scope.CompoundPath ? source.children : [source];
    const stamp = Date.now();
    return contours.filter((path) => path.segments?.length).map((path, index) => {
      const origin = { x: path.bounds.x, y: path.bounds.y };
      return {
        ...item,
        id: `path-${stamp}-${index}`,
        type: "path",
        name: contours.length > 1 ? `${item.name || "Trazado"} ${index + 1}` : item.name || "Trazado editable",
        x: origin.x,
        y: origin.y,
        points: path.segments.map((segment) => segmentToPoint(segment, origin)),
        closed: path.closed || (item.fillType !== "none" && Math.abs(path.area || 0) > 0.01),
        smooth: false,
        rotation: 0,
        scaleX: undefined,
        scaleY: undefined,
        pathBounds: undefined,
        d: undefined,
        groupId: contours.length > 1 ? `converted-path-${stamp}` : undefined
      };
    });
  } finally {
    scope.remove();
  }
}
