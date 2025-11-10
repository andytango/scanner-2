import React from "react";
import { fetchEmbeddings } from "@/lib/visualization/data-fetcher";
import { processEmbeddings } from "@/lib/visualization/server-processor";
import { ClusterMapClient } from "./client";

/**
 * Cluster Map component
 * Fetches and processes embeddings data, then passes it to the client component
 *
 * @param props - Component props
 * @param props.searchParams - URL search parameters
 * @returns JSX element containing the cluster map client component
 */
export async function ClusterMap({
  searchParams,
}: {
  searchParams: Promise<{
    chunkType?: string;
    epsilon?: string;
    minPoints?: string;
    colorBy?: "cluster" | "article";
    clusteringMethod?: string;
  }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  // Parse URL parameters with defaults
  const chunkType = params.chunkType ?? "full";
  const epsilon = parseFloat(params.epsilon ?? "0.3");
  const minPoints = parseInt(params.minPoints ?? "5", 10);
  const colorBy = params.colorBy ?? "cluster";
  const rawClusteringMethod = params.clusteringMethod;
  const clusteringMethod =
    rawClusteringMethod === "high-dim" || rawClusteringMethod === "3d"
      ? rawClusteringMethod
      : "high-dim";

  console.log("[ClusterMap] Configuration:", {
    chunkType,
    epsilon,
    minPoints,
    colorBy,
    clusteringMethod,
  });
  console.log("[ClusterMap] Fetching embeddings from database...");

  // Fetch embeddings filtered by chunk type (pass as array for SQL IN clause)
  const embeddings = await fetchEmbeddings({
    chunkTypes: [chunkType],
    limit: 50000,
  });

  console.log("[ClusterMap] Fetched", embeddings.length, "embeddings");

  // Process embeddings on the server (UMAP + DBSCAN)
  // UMAP will use sensible defaults: nNeighbors=15, minDist=0.1
  console.log("[ClusterMap] Processing embeddings on server...");
  const processingResult = processEmbeddings(embeddings, {
    epsilon,
    minPoints,
    nNeighbors: 15, // Default UMAP parameter
    minDist: 0.1, // Default UMAP parameter
    colorBy,
    clusteringMethod,
  });

  console.log("[ClusterMap] Server processing complete");

  return (
    <ClusterMapClient
      initialPoints={processingResult.points}
      clusterResult={processingResult.clusterResult}
      colorMap={Array.from(processingResult.colorMap.entries())}
      initialChunkType={chunkType}
      initialEpsilon={epsilon}
      initialMinPoints={minPoints}
      initialColorBy={colorBy}
      initialClusteringMethod={clusteringMethod}
    />
  );
}
