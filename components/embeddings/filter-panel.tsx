"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Filter state for embedding visualization
 */
export interface FilterState {
  chunkType: string;
  epsilon: number;
  minPoints: number;
  hiddenClusters: Set<number>;
  colorBy: "cluster" | "article";
  clusteringMethod: "high-dim" | "3d";
}

/**
 * Props for FilterPanel component
 */
export interface FilterPanelProps {
  /**
   * Current filter state
   */
  filters: FilterState;

  /**
   * Callback when filters change
   */
  onFiltersChange: (filters: FilterState) => void;

  /**
   * Available cluster IDs for filtering
   */
  clusterIds: number[];

  /**
   * Cluster color map for legend
   */
  clusterColors: Map<number, string>;

  /**
   * Statistics about the current visualization
   */
  stats?: {
    totalPoints: number;
    visiblePoints: number;
    clusterCount: number;
    noiseCount: number;
  };

  /**
   * Whether controls should be disabled (e.g., during loading)
   */
  disabled?: boolean;
}

/**
 * Filter controls panel for cluster visualization
 * Allows users to filter by chunk type, adjust clustering parameters,
 * and show/hide specific clusters
 *
 * @param props - Component props
 * @param props.filters - Current filter state
 * @param props.onFiltersChange - Callback when filters change
 * @param props.clusterIds - Available cluster IDs for filtering
 * @param props.clusterColors - Cluster color map for legend
 * @param props.stats - Statistics about the current visualization
 * @param props.disabled - Whether controls should be disabled during loading
 * @returns JSX element containing the filter panel
 * @example
 * <FilterPanel
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   clusterIds={[0, 1, 2, 3, 4]}
 *   clusterColors={colorMap}
 * />
 */
export function FilterPanel({
  filters,
  onFiltersChange,
  clusterIds,
  clusterColors,
  stats,
  disabled = false,
}: FilterPanelProps): React.JSX.Element {
  const handleChunkTypeChange = (chunkType: string): void => {
    const newFilters: FilterState = {
      ...filters,
      chunkType,
    };

    // If "full" is selected, force color by cluster
    if (chunkType === "full") {
      newFilters.colorBy = "cluster";
    }

    onFiltersChange(newFilters);
  };

  const handleColorByChange = (value: "cluster" | "article"): void => {
    onFiltersChange({
      ...filters,
      colorBy: value,
    });
  };

  const handleClusteringMethodChange = (value: "high-dim" | "3d"): void => {
    onFiltersChange({
      ...filters,
      clusteringMethod: value,
    });
  };

  const handleEpsilonChange = (value: number[]): void => {
    onFiltersChange({
      ...filters,
      epsilon: value[0] ?? 0.3,
    });
  };

  const handleMinPointsChange = (value: number[]): void => {
    onFiltersChange({
      ...filters,
      minPoints: value[0] ?? 5,
    });
  };

  const handleClusterToggle = (clusterId: number, show: boolean): void => {
    const newHidden = new Set(filters.hiddenClusters);
    if (show) {
      newHidden.delete(clusterId);
    } else {
      newHidden.add(clusterId);
    }

    onFiltersChange({
      ...filters,
      hiddenClusters: newHidden,
    });
  };

  const handleReset = (): void => {
    onFiltersChange({
      chunkType: "full",
      epsilon: 0.3,
      minPoints: 5,
      hiddenClusters: new Set(),
      colorBy: "cluster",
      clusteringMethod: "high-dim",
    });
  };

  return (
    <div className="relative space-y-6 rounded-lg border bg-card p-6">
      {/* Loading Overlay */}
      {disabled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium">Updating...</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-semibold">Filters</h3>

        {/* Statistics */}
        {stats !== undefined && (
          <div className="mb-6 rounded-md bg-muted p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Total Points:</span>
                <span className="ml-2 font-medium">{stats.totalPoints}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Visible:</span>
                <span className="ml-2 font-medium">{stats.visiblePoints}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Clusters:</span>
                <span className="ml-2 font-medium">{stats.clusterCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Noise:</span>
                <span className="ml-2 font-medium">{stats.noiseCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chunk Type Filter */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">Chunk Type</Label>
          <RadioGroup
            value={filters.chunkType}
            onValueChange={handleChunkTypeChange}
            className="space-y-2"
            disabled={disabled}
          >
            {["full", "paragraph", "sentence"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={`chunk-${type}`} />
                <label
                  htmlFor={`chunk-${type}`}
                  className="cursor-pointer text-sm capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {type}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Color By Filter */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">Color By</Label>
          <RadioGroup
            value={filters.colorBy}
            onValueChange={handleColorByChange}
            className="space-y-2"
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cluster" id="color-cluster" />
              <label htmlFor="color-cluster" className="cursor-pointer text-sm">
                Cluster
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="article"
                id="color-article"
                disabled={disabled || filters.chunkType === "full"}
              />
              <label htmlFor="color-article" className="cursor-pointer text-sm">
                Article
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Clustering Method */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">
            Clustering Method
          </Label>
          <RadioGroup
            value={filters.clusteringMethod}
            onValueChange={handleClusteringMethodChange}
            className="space-y-2"
            disabled={disabled || filters.colorBy === "article"}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high-dim" id="cluster-high-dim" />
              <label
                htmlFor="cluster-high-dim"
                className="cursor-pointer text-sm"
              >
                High-dimensional (better clusters)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3d" id="cluster-3d" />
              <label htmlFor="cluster-3d" className="cursor-pointer text-sm">
                3D projection (faster)
              </label>
            </div>
          </RadioGroup>
          <p className="mt-2 text-xs text-muted-foreground">
            High-dimensional: cluster in original embedding space before
            visualization. 3D: cluster after dimensionality reduction.
          </p>
        </div>

        {/* DBSCAN Parameters */}
        <fieldset
          className="mb-6"
          disabled={disabled || filters.colorBy === "article"}
        >
          <Label
            className="mb-3 block text-sm font-medium"
            aria-disabled={disabled || filters.colorBy === "article"}
          >
            Clustering Parameters
          </Label>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Epsilon (neighborhood size)</span>
                <span className="font-mono">{filters.epsilon.toFixed(2)}</span>
              </div>
              <Slider
                value={[filters.epsilon]}
                onValueChange={handleEpsilonChange}
                min={0.1}
                max={2.0}
                step={0.05}
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Min Points (cluster density)</span>
                <span className="font-mono">{filters.minPoints}</span>
              </div>
              <Slider
                value={[filters.minPoints]}
                onValueChange={handleMinPointsChange}
                min={2}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </fieldset>

        {/* Cluster Visibility */}
        {clusterIds.length > 0 && (
          <fieldset
            className="mb-6"
            disabled={disabled || filters.colorBy === "article"}
          >
            <Label
              className="mb-3 block text-sm font-medium"
              aria-disabled={disabled || filters.colorBy === "article"}
            >
              Show/Hide Clusters
            </Label>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {clusterIds.map((clusterId) => {
                const isVisible = !filters.hiddenClusters.has(clusterId);
                const color = clusterColors.get(clusterId) ?? "#999";
                const label =
                  clusterId === -1 ? "Noise" : `Cluster ${clusterId}`;

                return (
                  <div key={clusterId} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cluster-${clusterId}`}
                      checked={isVisible}
                      onCheckedChange={(checked: boolean) =>
                        handleClusterToggle(clusterId, checked === true)
                      }
                    />
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <label
                      htmlFor={`cluster-${clusterId}`}
                      className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Reset Button */}
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full"
          disabled={disabled}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
