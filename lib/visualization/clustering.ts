import clustering from "density-clustering";

/**
 * Result of a clustering operation
 */
export interface ClusterResult {
  labels: number[];
  clusterCount: number;
  noiseCount: number;
  clusterSizes: Map<number, number>;
}

/**
 * Performs DBSCAN clustering on 3D points
 *
 * @param points - Array of 3D points
 * @param options - DBSCAN options
 * @param options.epsilon - The maximum distance between two samples for them to be considered as in the same neighborhood.
 * @param options.minPoints - The number of samples in a neighborhood for a point to be considered as a core point.
 * @returns Clustering result
 */
export function performClustering(
  points: number[][],
  options: {
    epsilon?: number;
    minPoints?: number;
  }
): ClusterResult {
  if (points.length === 0) {
    return {
      labels: [],
      clusterCount: 0,
      noiseCount: 0,
      clusterSizes: new Map(),
    };
  }

  const epsilon = options.epsilon ?? 0.3;
  const minPoints = options.minPoints ?? 5;

  // Initialize DBSCAN from density-clustering library
  const dbscan = new clustering.DBSCAN();

  // Run DBSCAN clustering
  // Returns array of clusters: [[0, 1], [2, 3]] means points 0,1 in cluster 0, points 2,3 in cluster 1
  const clusters: number[][] = dbscan.run(points, epsilon, minPoints);

  // Convert clusters format to labels format
  // We need labels array: [0, 0, 1, 1] where index is point and value is cluster
  const labels = new Array(points.length).fill(-1); // Initialize all as noise (-1)

  clusters.forEach((cluster, clusterIndex) => {
    cluster.forEach((pointIndex) => {
      labels[pointIndex] = clusterIndex;
    });
  });

  return getClusterStats({
    labels,
    clusterCount: 0,
    noiseCount: 0,
    clusterSizes: new Map(),
  });
}

/**
 * Calculates statistics about a clustering result
 *
 * @param result - Clustering result
 * @returns Updated clustering result with stats
 */
export function getClusterStats(result: ClusterResult): ClusterResult {
  const clusterSizes = new Map<number, number>();
  let noiseCount = 0;
  const clusterIds = new Set<number>();

  for (const label of result.labels) {
    if (label === -1) {
      noiseCount++;
    } else {
      clusterIds.add(label);
      clusterSizes.set(label, (clusterSizes.get(label) ?? 0) + 1);
    }
  }

  return {
    ...result,
    clusterCount: clusterIds.size,
    noiseCount,
    clusterSizes,
  };
}
