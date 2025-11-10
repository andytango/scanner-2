"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ProcessedPoint } from "@/lib/visualization/server-processor";
import {
  getClusterStats,
  type ClusterResult,
} from "@/lib/visualization/clustering";
import type { ScatterDataPoint } from "@/components/embeddings/chart-3d";
import {
  FilterPanel,
  type FilterState,
} from "@/components/embeddings/filter-panel";
import { ArticleDrawer } from "@/components/embeddings/article-drawer";

// Dynamically import Chart3D with ssr disabled to prevent window reference errors
const Chart3D = dynamic(
  () =>
    import("@/components/embeddings/chart-3d").then((mod) => ({
      default: mod.Chart3D,
    })),
  { ssr: false }
);

/**
 * Props for ClusterMapClient component
 */
interface ClusterMapClientProps {
  initialPoints: ProcessedPoint[];
  clusterResult: ClusterResult;
  colorMap: Array<[number, string]>;
  initialChunkType: string;
  initialEpsilon: number;
  initialMinPoints: number;
  initialColorBy: "cluster" | "article";
  initialClusteringMethod: "high-dim" | "3d";
}

/**
 * Client component for cluster map visualization
 * Handles filtering and user interactions with pre-processed server data
 *
 * @param props - Component props
 * @param props.initialPoints - Pre-processed points from server
 * @param props.clusterResult - Clustering result from server
 * @param props.colorMap - Color map for clusters from server
 * @param props.initialChunkType - Initial chunk type filter
 * @param props.initialEpsilon - Initial epsilon value for DBSCAN
 * @param props.initialMinPoints - Initial minimum points for DBSCAN
 * @param props.initialColorBy - Initial color by mode
 * @param props.initialClusteringMethod - Initial clustering method
 * @returns JSX element containing the cluster map visualization
 */
export function ClusterMapClient({
  initialPoints,
  clusterResult,
  colorMap: colorMapArray,
  initialChunkType,
  initialEpsilon,
  initialMinPoints,
  initialColorBy,
  initialClusteringMethod,
}: ClusterMapClientProps): React.JSX.Element {
  console.log(
    "[Client] Initializing with",
    initialPoints.length,
    "pre-processed points"
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Convert serialized color map array back to Map
  const colorMap = useMemo(() => new Map(colorMapArray), [colorMapArray]);

  // Initialize filter state from server-provided initial values
  const [filters, setFilters] = useState<FilterState>({
    chunkType: initialChunkType,
    epsilon: initialEpsilon,
    minPoints: initialMinPoints,
    hiddenClusters: new Set(),
    colorBy: initialColorBy,
    clusteringMethod: initialClusteringMethod,
  });

  // Mark initial mount as complete
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Update URL when filters change (for parameters that require server-side re-processing)
  useEffect(() => {
    // Skip URL update on initial mount to prevent unnecessary reload
    if (isInitialMount) return;
    const params = new URLSearchParams(searchParams.toString());

    const currentEpsilon = parseFloat(searchParams.get("epsilon") ?? "0.3");
    const currentMinPoints = parseInt(searchParams.get("minPoints") ?? "5", 10);
    const currentChunkType = searchParams.get("chunkType") ?? "full";
    const rawColorBy = searchParams.get("colorBy");
    const currentColorBy =
      rawColorBy === "cluster" || rawColorBy === "article"
        ? rawColorBy
        : "cluster";
    const rawClusteringMethod = searchParams.get("clusteringMethod");
    const currentClusteringMethod =
      rawClusteringMethod === "high-dim" || rawClusteringMethod === "3d"
        ? rawClusteringMethod
        : "high-dim";

    if (
      filters.epsilon !== currentEpsilon ||
      filters.minPoints !== currentMinPoints ||
      filters.chunkType !== currentChunkType ||
      filters.colorBy !== currentColorBy ||
      filters.clusteringMethod !== currentClusteringMethod
    ) {
      params.set("epsilon", filters.epsilon.toString());
      params.set("minPoints", filters.minPoints.toString());
      params.set("chunkType", filters.chunkType);
      params.set("colorBy", filters.colorBy);
      params.set("clusteringMethod", filters.clusteringMethod);

      console.log("Updating URL with new parameters");
      setIsNavigating(true);
      // This will trigger a page reload with new parameters
      router.push(`/cluster-map?${params.toString()}`);
    }
  }, [
    isInitialMount,
    filters.epsilon,
    filters.minPoints,
    filters.chunkType,
    filters.colorBy,
    filters.clusteringMethod,
    router,
    searchParams,
  ]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ScatterDataPoint | null>(
    null
  );

  // Convert ProcessedPoint to ScatterDataPoint (they're compatible)
  const allScatterData: ScatterDataPoint[] = useMemo(() => {
    return initialPoints.map((point) => ({
      ...point,
    }));
  }, [initialPoints]);

  // Filter out hidden clusters
  const visibleScatterData = useMemo(() => {
    return allScatterData.filter(
      (point) => !filters.hiddenClusters.has(point.label)
    );
  }, [allScatterData, filters.hiddenClusters]);

  // Get unique cluster IDs for filter panel
  const clusterIds = useMemo(() => {
    const ids = new Set(allScatterData.map((point) => point.label));
    return Array.from(ids).sort((a, b) => {
      // Put noise (-1) at the end
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });
  }, [allScatterData]);

  // Calculate stats
  const stats = useMemo(() => {
    const clusterStats = getClusterStats(clusterResult);
    return {
      totalPoints: allScatterData.length,
      visiblePoints: visibleScatterData.length,
      clusterCount: clusterStats.clusterCount,
      noiseCount: clusterStats.noiseCount,
    };
  }, [allScatterData, visibleScatterData, clusterResult]);

  // Handle point click
  const handlePointClick = (point: ScatterDataPoint): void => {
    setSelectedPoint(point);
    setDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = (): void => {
    setDrawerOpen(false);
  };

  console.log(
    "[Client] Rendering with",
    visibleScatterData.length,
    "visible points"
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Filter Panel - Left Sidebar */}
      <div className="lg:col-span-1">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          clusterIds={clusterIds}
          clusterColors={colorMap}
          stats={stats}
          disabled={isNavigating}
        />
      </div>

      {/* 3D Visualization - Main Area */}
      <div className="lg:col-span-3">
        <Chart3D
          data={visibleScatterData}
          onPointClick={handlePointClick}
          height="800px"
          loading={isNavigating}
        />

        {visibleScatterData.length === 0 && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
            No data to display. Adjust your filters to see embeddings.
          </div>
        )}
      </div>

      {/* Article Drawer */}
      <ArticleDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        selectedPoint={selectedPoint}
      />
    </div>
  );
}
