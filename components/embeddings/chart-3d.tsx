"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as echarts from "echarts";
import "echarts-gl";
import type { EChartsGL3DOption } from "./echarts-gl";

/**
 * Data point for 3D scatter plot
 */
export interface ScatterDataPoint {
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
 * Props for Chart3D component
 */
export interface Chart3DProps {
  /**
   * Array of data points to visualize
   */
  data: ScatterDataPoint[];

  /**
   * Callback when a point is clicked
   */
  onPointClick?: (point: ScatterDataPoint) => void;

  /**
   * Callback when mouse hovers over a point
   */
  onPointHover?: (point: ScatterDataPoint | null) => void;

  /**
   * Height of the chart container
   * @default "600px"
   */
  height?: string;

  /**
   * Whether to show loading state
   * @default false
   */
  loading?: boolean;
}

/**
 * 3D scatter plot component using ECharts GL
 * Displays embeddings in 3D space with clustering colors
 *
 * @param props - Component props
 * @param props.data - Array of data points to visualize
 * @param props.onPointClick - Callback when a point is clicked
 * @param props.onPointHover - Callback when mouse hovers over a point
 * @param props.height - Height of the chart container
 * @param props.loading - Whether to show loading state
 * @returns JSX element containing the 3D chart
 * @example
 * <Chart3D
 *   data={scatterData}
 *   onPointClick={(point) => console.log(point)}
 *   height="800px"
 * />
 */
export function Chart3D({
  data,
  onPointClick,
  onPointHover,
  height = "600px",
  loading = false,
}: Chart3DProps): React.JSX.Element {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | undefined>(undefined);

  useEffect(() => {
    if (chartRef.current === null) return;

    // Initialize chart with theme
    const isDark = theme === "dark";
    const chart = echarts.init(chartRef.current, isDark ? "dark" : undefined);
    instanceRef.current = chart;

    // Prepare data for ECharts
    const scatterData = data.map((point) => ({
      value: point.position,
      itemStyle: {
        color: point.color,
      },
      _meta: point,
    }));

    // Configure chart options
    const option: EChartsGL3DOption = {
      tooltip: {
        show: true,
        backgroundColor: "transparent",
        borderWidth: 0,
        formatter: (params: unknown): HTMLDivElement => {
          const param = params as { data: { _meta: ScatterDataPoint } };
          const point = param.data._meta;

          // Create tooltip container with proper theme classes
          const container = document.createElement("div");
          container.className =
            "rounded-lg border shadow-lg bg-popover text-popover-foreground p-4";
          container.style.maxWidth = "320px";
          container.style.width = "320px";
          container.style.wordWrap = "break-word";
          container.style.overflowWrap = "break-word";

          // Title
          const titleEl = document.createElement("div");
          titleEl.className =
            "font-semibold text-sm mb-2 leading-tight break-words";
          titleEl.style.wordWrap = "break-word";
          titleEl.style.overflowWrap = "break-word";
          titleEl.style.whiteSpace = "normal";
          titleEl.textContent = point.articleTitle ?? "Untitled";
          container.appendChild(titleEl);

          // Snippet
          const trimmedContent = point.content.trim();
          const snippet =
            trimmedContent.length > 120
              ? trimmedContent.substring(0, 120) + "..."
              : trimmedContent;
          const snippetEl = document.createElement("div");
          snippetEl.className =
            "text-xs text-muted-foreground mb-3 leading-relaxed break-words";
          snippetEl.style.wordWrap = "break-word";
          snippetEl.style.overflowWrap = "break-word";
          snippetEl.style.whiteSpace = "normal";
          snippetEl.textContent = snippet;
          container.appendChild(snippetEl);

          // Metadata section with separator
          const metaContainer = document.createElement("div");
          metaContainer.className =
            "flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t flex-wrap";

          const clusterLabel = document.createElement("span");
          clusterLabel.textContent =
            point.label === -1 ? "Noise" : `Cluster ${point.label}`;
          metaContainer.appendChild(clusterLabel);

          const separator = document.createElement("span");
          separator.textContent = "•";
          metaContainer.appendChild(separator);

          const chunkTypeLabel = document.createElement("span");
          chunkTypeLabel.className = "capitalize";
          chunkTypeLabel.textContent = point.chunkType;
          metaContainer.appendChild(chunkTypeLabel);

          container.appendChild(metaContainer);

          return container;
        },
      },
      grid3D: {
        viewControl: {
          projection: "perspective",
          autoRotate: false,
          distance: 200,
          minDistance: 50,
          maxDistance: 400,
          alpha: 30,
          beta: 40,
          center: [0, 0, 0],
        },
        boxWidth: 100,
        boxDepth: 100,
        boxHeight: 100,
        axisPointer: {
          show: false,
        },
        environment: isDark ? "#1a1a1a" : "#f8f9fa",
        light: {
          main: {
            intensity: isDark ? 1.5 : 1.2,
            shadow: true,
          },
          ambient: {
            intensity: isDark ? 0.5 : 0.3,
          },
        },
      },
      xAxis3D: {
        type: "value",
        name: "",
        axisLabel: {
          show: true,
          color: "transparent",
        },
        axisLine: {
          lineStyle: {
            color: "transparent",
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis3D: {
        type: "value",
        name: "",
        axisLabel: {
          show: true,
          color: "transparent",
        },
        axisLine: {
          lineStyle: {
            color: "transparent",
          },
        },
        axisTick: {
          show: false,
        },
      },
      zAxis3D: {
        type: "value",
        name: "",
        axisLabel: {
          show: true,
          color: "transparent",
        },
        axisLine: {
          lineStyle: {
            color: "transparent",
          },
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          type: "scatter3D",
          data: scatterData,
          symbolSize: 6,
          itemStyle: {
            opacity: 0.8,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              borderColor: "#000",
              borderWidth: 1,
            },
          },
        },
      ],
    };

    chart.setOption(option);

    // Handle click events
    if (onPointClick !== undefined) {
      chart.on("click", (params: unknown) => {
        const param = params as { data?: { _meta?: ScatterDataPoint } };
        if (param.data?._meta !== undefined) {
          onPointClick(param.data._meta);
        }
      });
    }

    // Handle hover events
    if (onPointHover !== undefined) {
      chart.on("mouseover", (params: unknown) => {
        const param = params as { data?: { _meta?: ScatterDataPoint } };
        if (param.data?._meta !== undefined) {
          onPointHover(param.data._meta);
        }
      });

      chart.on("mouseout", () => {
        onPointHover(null);
      });
    }

    // Handle window resize
    const handleResize = (): void => {
      chart.resize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data, onPointClick, onPointHover, theme]);

  // Show loading state
  useEffect(() => {
    if (instanceRef.current !== undefined) {
      const isDark = theme === "dark";
      if (loading) {
        instanceRef.current.showLoading("default", {
          text: "Processing...",
          color: isDark ? "#fff" : "#333",
          textColor: isDark ? "#fff" : "#333",
          maskColor: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.8)",
          zlevel: 10,
        });
      } else {
        instanceRef.current.hideLoading();
      }
    }
  }, [loading, theme]);

  return (
    <div
      ref={chartRef}
      style={{ width: "100%", height }}
      className="rounded-lg border bg-background"
    />
  );
}
