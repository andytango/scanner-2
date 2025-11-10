import React, { Suspense } from "react";
import { getEmbeddingStats } from "@/lib/visualization/data-fetcher";
import { ChartLoadingSkeleton } from "./chart-loading";
import { ClusterMap } from "./cluster-map";

/**
 * Cluster Map Page
 * Server component that fetches embeddings data and passes it to client component
 * Displays 3D visualization of text embeddings with clustering
 *
 * @param props - Page props
 * @param props.searchParams - URL search parameters
 * @param props.searchParams.chunkTypes - Comma-separated list of chunk types to filter by
 * @param props.searchParams.epsilon - DBSCAN epsilon value
 * @param props.searchParams.minPoints - DBSCAN minPoints value
 * @param props.searchParams.nNeighbors - UMAP nNeighbors value
 * @param props.searchParams.minDist - UMAP minDist value
 * @param props.searchParams.colorBy - The property to color points by
 * @returns JSX element containing the cluster map page
 */
export default async function ClusterMapPage({
  searchParams,
}: {
  searchParams: {
    chunkTypes?: string;
    epsilon?: string;
    minPoints?: string;
    nNeighbors?: string;
    minDist?: string;
    colorBy?: "cluster" | "article";
  };
}): Promise<React.JSX.Element> {
  // Get statistics
  const stats = await getEmbeddingStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Embedding Cluster Map
        </h1>
        <p className="mt-2 text-muted-foreground">
          3D visualization of text embeddings using UMAP dimensionality
          reduction and DBSCAN clustering
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Embeddings</div>
          <div className="text-2xl font-bold">
            {stats.total.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Full Articles</div>
          <div className="text-2xl font-bold">
            {stats.full.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Paragraphs</div>
          <div className="text-2xl font-bold">
            {stats.paragraph.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Sentences</div>
          <div className="text-2xl font-bold">
            {stats.sentence.toLocaleString()}
          </div>
        </div>
      </div>

      <Suspense fallback={<ChartLoadingSkeleton />}>
        <ClusterMap searchParams={Promise.resolve(searchParams)} />
      </Suspense>
    </div>
  );
}
