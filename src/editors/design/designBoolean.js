import paper from "paper";

export function runDesignBoolean(operands, operation) {
  const scope = new paper.PaperScope();
  scope.setup(new scope.Size(1, 1));
  const paths = operands.map(({ center, d, offset = { x: 0, y: 0 }, rotation = 0 }) => {
    const path = new scope.Path({ pathData: d, insert: false });
    path.translate(new scope.Point(offset.x || 0, offset.y || 0));
    if (rotation) path.rotate(rotation, new scope.Point(center.x, center.y));
    return path;
  });
  let result = paths[0];
  for (let index = 1; index < paths.length; index += 1) {
    if (operation === "unite") result = result.unite(paths[index], { insert: false });
    if (operation === "subtract") result = result.subtract(paths[index], { insert: false });
    if (operation === "intersect") result = result.intersect(paths[index], { insert: false });
    if (operation === "exclude") result = result.exclude(paths[index], { insert: false });
  }
  const bounds = result.bounds;
  const output = {
    d: result.pathData,
    bounds: { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height }
  };
  scope.remove();
  return output;
}

export function runDesignDivide(operands) {
  if (operands.length !== 2) throw new Error("Divide requires exactly two operands");
  const scope = new paper.PaperScope();
  scope.setup(new scope.Size(1, 1));
  const paths = operands.map(({ center, d, offset = { x: 0, y: 0 }, rotation = 0 }) => {
    const path = new scope.Path({ pathData: d, insert: false });
    path.translate(new scope.Point(offset.x || 0, offset.y || 0));
    if (rotation) path.rotate(rotation, new scope.Point(center.x, center.y));
    return path;
  });
  const fragments = [
    paths[0].subtract(paths[1], { insert: false }),
    paths[0].intersect(paths[1], { insert: false }),
    paths[1].subtract(paths[0], { insert: false })
  ].filter((path) => Math.abs(path.area || 0) > 0.01).map((path) => ({
    d: path.pathData,
    bounds: { x: path.bounds.x, y: path.bounds.y, w: path.bounds.width, h: path.bounds.height }
  }));
  scope.remove();
  return fragments;
}
