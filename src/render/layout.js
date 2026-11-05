/** Fit landscape to 16:9; portrait uses the entire available viewport. */
export function stageSize(width, height) {
  if (height > width) return { width, height, portrait: true };
  const fittedWidth = Math.min(width, height * 16 / 9);
  return { width: fittedWidth, height: fittedWidth * 9 / 16, portrait: false };
}

/** Preserve at least 7 m horizontally and 12.5 m ahead/behind in portrait. */
export function playLayout(width, height) {
  const scale = Math.min(height / 12.5, width / 7);
  return { scale, centerX: width / 2, cartY: height * 0.75, columnWidth: 7 * scale };
}
