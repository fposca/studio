const fill = (ctx, color, ...rectangles) => {
  ctx.fillStyle = color;
  for (const [x, y, width, height] of rectangles) ctx.fillRect(x, y, width, height);
};

const polygon = (ctx, color, points) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(...points[index]);
  ctx.closePath();
  ctx.fill();
};

export function drawMonkeyIslandMonitor(ctx, seconds) {
  const wave = Math.sin(seconds * 4.8);
  ctx.clearRect(0, 0, 160, 120);
  fill(ctx, "#1d304f", [0, 0, 160, 120]);
  fill(ctx, "#293e61", [0, 30, 160, 29]);
  fill(ctx, "#536785", [0, 59, 160, 12]);
  fill(ctx, "#db9c73", [0, 71, 160, 4]);
  fill(ctx, "#1b5265", [0, 75, 160, 27]);
  fill(ctx, "#153e54", [0, 89, 160, 13]);
  fill(ctx, "#f6d4a1", [126, 24, 10, 10], [124, 26, 14, 6]);
  fill(ctx, "#213653", [121, 23, 6, 3]);
  fill(ctx, "#8292a4", [12, 38, 13, 2], [18, 36, 14, 3], [29, 39, 10, 2], [99, 43, 15, 2], [107, 41, 16, 3]);
  polygon(ctx, "#203f4e", [[0, 77], [0, 64], [10, 61], [20, 64], [31, 58], [43, 65], [56, 63], [67, 73], [67, 78]]);
  polygon(ctx, "#152e3f", [[107, 77], [116, 65], [128, 60], [138, 64], [148, 56], [160, 61], [160, 79]]);
  fill(ctx, "#6a8d8c", [5, 82, 21, 1], [36, 88, 16, 1], [111, 86, 26, 1], [139, 80, 12, 1]);

  polygon(ctx, "#2c292c", [[16, 78], [18, 51], [22, 38], [25, 38], [21, 53], [20, 79]]);
  polygon(ctx, "#132e30", [[22, 42], [13, 31], [1, 34], [13, 34], [24, 41], [18, 27], [9, 23], [19, 28], [25, 39], [32, 27], [42, 23], [34, 30], [27, 41], [39, 35], [48, 37], [35, 38]]);
  fill(ctx, "#10242d", [135, 68, 2, 11], [127, 73, 20, 2], [131, 77, 13, 2]);
  polygon(ctx, "#c0b3a3", [[136, 68], [136, 56], [146, 67]]);
  fill(ctx, "#0e2636", [0, 98, 160, 22]);
  fill(ctx, "#573c35", [0, 98, 160, 5], [0, 110, 160, 4]);
  fill(ctx, "#8a5b41", [0, 102, 160, 3], [0, 114, 160, 3]);
  fill(ctx, "#332d32", [17, 103, 2, 17], [51, 103, 2, 17], [105, 103, 2, 17], [142, 103, 2, 17]);

  ctx.save();
  ctx.translate(0, Math.round(Math.sin(seconds * 2.4) * 0.7));
  // Guybrush's silhouette stays readable at the CRT's small on-screen size.
  fill(ctx, "#211f2c", [69, 98, 9, 11], [83, 98, 10, 11], [67, 108, 12, 4], [83, 108, 13, 4]);
  fill(ctx, "#6b4b40", [69, 102, 8, 7], [84, 102, 8, 7]);
  fill(ctx, "#22374f", [69, 84, 10, 20], [82, 84, 10, 20]);
  fill(ctx, "#4b6280", [72, 86, 3, 13], [85, 86, 3, 13]);
  fill(ctx, "#191f2f", [67, 62, 27, 26]);
  fill(ctx, "#eee0c6", [72, 63, 18, 24]);
  polygon(ctx, "#48394a", [[67, 61], [75, 61], [77, 76], [74, 88], [64, 86]]);
  polygon(ctx, "#48394a", [[87, 61], [96, 62], [99, 85], [86, 88], [84, 76]]);
  fill(ctx, "#a9937e", [78, 64, 3, 22]);
  fill(ctx, "#2b2631", [66, 86, 31, 5]);
  fill(ctx, "#c59e5e", [81, 86, 5, 5]);
  fill(ctx, "#ead7ba", [62, 67, 7, 16], [58, 78, 6, 9]);
  fill(ctx, "#8b6a56", [56, 83, 9, 6]);
  fill(ctx, "#3c3441", [64, 63, 7, 8]);

  ctx.save();
  ctx.translate(93, 67);
  ctx.rotate(-0.74 + wave * 0.33);
  fill(ctx, "#292735", [0, -5, 17, 10]);
  fill(ctx, "#e8d8b9", [4, -3, 15, 6]);
  fill(ctx, "#9b7b60", [18, -4, 9, 9]);
  fill(ctx, "#e9c69c", [21, -9, 4, 8], [26, -7, 3, 8], [29, -4, 3, 7]);
  ctx.restore();

  fill(ctx, "#c5a05f", [73, 40, 17, 7], [70, 44, 6, 12], [88, 43, 6, 14], [67, 48, 5, 12]);
  fill(ctx, "#f0cf9f", [74, 45, 17, 17]);
  fill(ctx, "#e0b784", [74, 54, 17, 8], [82, 61, 4, 4]);
  fill(ctx, "#f2d276", [72, 40, 19, 5], [76, 37, 13, 4], [88, 44, 5, 4], [68, 52, 5, 3]);
  fill(ctx, "#573f38", [77, 50, 2, 2], [86, 50, 2, 2]);
  fill(ctx, "#ad725c", [81, 56, 7, 1], [82, 58, 6, 1]);
  ctx.restore();

  ctx.textBaseline = "top";
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#332b38";
  ctx.fillText("MONKEY ISLAND", 8, 9);
  ctx.fillStyle = "#f5ce78";
  ctx.fillText("MONKEY ISLAND", 7, 8);
  ctx.font = "bold 5px monospace";
  ctx.fillStyle = "#c2d5d0";
  ctx.fillText("GUYBRUSH THREEPWOOD", 8, 20);
  fill(ctx, "#2a2e3d", [105, 30, 43, 17]);
  fill(ctx, "#d1a773", [104, 29, 43, 17], [108, 46, 4, 4]);
  fill(ctx, "#29384d", [106, 31, 39, 13], [109, 44, 3, 4]);
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "#ffe5ae";
  ctx.fillText("AHOY!", 110, 32);
}
