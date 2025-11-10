import {
  reduceToThreeDimensions,
  normalizeCoordinates,
} from "./dimensionality-reduction";
import { performClustering, type ClusterResult } from "./clustering";
import { generateClusterColorMap } from "./colors";
import type { EmbeddingDataPoint } from "./data-fetcher";

/**
 * Processed 3D point with cluster information
 */
export interface ProcessedPoint {
  id: number;
  position: [number, number, number];
  color: string;
  label: number;
  articleId: number;
  articleTitle: string | null;
  content: string;
  articleUrl: string;
  chunkType: string;
}

/**
 * Result of server-side processing
 */
export interface ProcessingResult {
  points: ProcessedPoint[];
  clusterResult: ClusterResult;
  colorMap: Map<number, string>;
}

/**
 * Configuration for server-side processing
 */
export interface ProcessingConfig {
  epsilon?: number;
  minPoints?: number;
  nNeighbors?: number;
  minDist?: number;
  colorBy?: "cluster" | "article";
  clusteringMethod?: "high-dim" | "3d";
}

/**
 * Processes embeddings on the server side
 * Performs UMAP dimensionality reduction and DBSCAN clustering
 *
 * @param embeddings - Array of embedding data points
 * @param config - Optional processing configuration
 * @returns Processed points with cluster information
 * @example
 * const result = processEmbeddings(embeddings, { epsilon: 0.3, minPoints: 5 });
 */
export function processEmbeddings(
  embeddings: EmbeddingDataPoint[],
  config: ProcessingConfig = {}
): ProcessingResult {
  const {
    epsilon = 0.3,
    minPoints = 5,
    nNeighbors = 15,
    minDist = 0.1,
    colorBy = "cluster",
    clusteringMethod = "high-dim",
  } = config;

  console.log(
    "[Server] Starting UMAP reduction for",
    embeddings.length,
    "embeddings"
  );
  const umapStart = performance.now();

  // Extract embedding vectors
  const vectors = embeddings.map((emb) => emb.embedding);

  if (vectors.length === 0) {
    return {
      points: [],
      clusterResult: {
        labels: [],
        clusterCount: 0,
        noiseCount: 0,
        clusterSizes: new Map(),
      },
      colorMap: new Map(),
    };
  }

  // Reduce to 3D using UMAP
  const points3dRaw = reduceToThreeDimensions(vectors, {
    nNeighbors,
    minDist,
    nComponents: 3,
  });

  // Normalize coordinates to [-1, 1] range
  const points3d = normalizeCoordinates(points3dRaw);

  const umapEnd = performance.now();
  console.log(
    `[Server] UMAP completed in ${((umapEnd - umapStart) / 1000).toFixed(2)}s`
  );

  let clusterResult: ClusterResult;
  let colorMap: Map<number, string>;

  if (colorBy === "article") {
    console.log("[Server] Coloring by article, skipping clustering.");
    const articleIds = embeddings.map((emb) => emb.articleId);
    const uniqueArticleIds = [...new Set(articleIds)];

    const clusterSizes = new Map<number, number>();
    for (const id of articleIds) {
      clusterSizes.set(id, (clusterSizes.get(id) ?? 0) + 1);
    }

    clusterResult = {
      labels: articleIds,
      clusterCount: uniqueArticleIds.length,
      noiseCount: 0,
      clusterSizes,
    };
    colorMap = generateClusterColorMap(articleIds);
  } else {
    console.log(
      `[Server] Starting DBSCAN clustering (method: ${clusteringMethod})...`
    );
    const dbscanStart = performance.now();

    // Perform DBSCAN clustering on either high-dimensional or 3D data
    if (clusteringMethod === "high-dim") {
      // Cluster in original high-dimensional space (better clusters)
      console.log(
        "[Server] Clustering in high-dimensional space before UMAP..."
      );
      clusterResult = performClustering(vectors, {
        epsilon,
        minPoints,
      });
    } else {
      // Cluster in 3D space after UMAP (faster, current behavior)
      console.log("[Server] Clustering in 3D space after UMAP...");
      clusterResult = performClustering(points3d, {
        epsilon,
        minPoints,
      });
    }

    const dbscanEnd = performance.now();
    console.log(
      `[Server] DBSCAN completed in ${(
        (dbscanEnd - dbscanStart) /
        1000
      ).toFixed(2)}s`
    );
    console.log("[Server] Found clusters:", clusterResult.clusterCount);
    console.log("[Server] Noise points:", clusterResult.noiseCount);

    // Generate color map
    colorMap = generateClusterColorMap(clusterResult.labels);
  }

  // Create processed points - filter out any invalid points
  const points: ProcessedPoint[] = embeddings
    .map((emb, index) => {
      const position = points3d[index];

      let label = -1;
      const currentLabel = clusterResult.labels[index];
      if (typeof currentLabel === "number") {
        label = currentLabel;
      }

      // Validate position
      if (
        position?.length !== 3 ||
        position.some((v) => isNaN(v) || !isFinite(v))
      ) {
        console.warn(
          `[Server] Skipping point ${index} with invalid position:`,
          position
        );
        return null;
      }

      return {
        id: emb.id,
        position: position as [number, number, number],
        color: colorMap.get(label) ?? "#999",
        label,
        articleId: emb.articleId,
        articleTitle: emb.articleTitle,
        content: emb.content,
        articleUrl: emb.articleUrl,
        chunkType: emb.chunkType,
      };
    })
    .filter((point): point is ProcessedPoint => point !== null);

  console.log(
    "[Server] Processing complete, returning",
    points.length,
    "points"
  );

  return {
    points,
    clusterResult,
    colorMap,
  };
}
