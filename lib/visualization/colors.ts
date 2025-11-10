/**
 * Generates a color map for clusters
 *
 * @param labels - Array of cluster labels
 * @returns Map of cluster labels to hex color strings
 */
export function generateClusterColorMap(labels: number[]): Map<number, string> {
  const uniqueLabels = [...new Set(labels)];
  const colorMap = new Map<number, string>();

  // Predefined, visually distinct colors
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];

  uniqueLabels.forEach((label, index) => {
    if (label === -1) {
      // Noise points are gray
      colorMap.set(label, "#808080");
    } else if (index < colors.length) {
      // Use predefined colors for the first few clusters
      colorMap.set(label, colors[index]!);
    } else {
      // Generate a deterministic color for additional clusters
      colorMap.set(
        label,
        `#${((label + 1) * 123456).toString(16).slice(0, 6)}`
      );
    }
  });

  return colorMap;
}
