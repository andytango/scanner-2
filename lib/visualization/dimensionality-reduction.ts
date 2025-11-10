import { UMAP } from "umap-js";

/**
 * Reduces high-dimensional vectors to 3D using UMAP
 *
 * @param vectors - Array of high-dimensional vectors
 * @param options - UMAP options
 * @param options.nNeighbors - The number of nearest neighbors to use for UMAP.
 * @param options.minDist - The effective minimum distance between embedded points.
 * @param options.nComponents - The number of components to reduce to.
 * @returns Array of 3D points
 */
export function reduceToThreeDimensions(
  vectors: number[][],
  options: {
    nNeighbors?: number;
    minDist?: number;
    nComponents?: number;
  }
): number[][] {
  if (vectors.length === 0) {
    return [];
  }

  const umap = new UMAP(options);
  const points3d = umap.fit(vectors);
  return Array.from(points3d);
}

/**
 * Normalizes coordinates to a [-1, 1] range
 *
 * @param points - Array of points
 * @returns Normalized array of points
 */
export function normalizeCoordinates(points: number[][]): number[][] {
  if (points.length === 0) {
    return [];
  }

  const dims = points[0]!.length;
  const min = new Array(dims).fill(Infinity);
  const max = new Array(dims).fill(-Infinity);

  for (const point of points) {
    for (let i = 0; i < dims; i++) {
      if (point[i]! < min[i]!) min[i] = point[i]!;
      if (point[i]! > max[i]!) max[i] = point[i]!;
    }
  }

  return points.map((point) => {
    return point.map((val, i) => {
      const range = max[i]! - min[i]!;
      if (range === 0) return 0;
      return (2 * (val - min[i]!)) / range - 1;
    });
  });
}
