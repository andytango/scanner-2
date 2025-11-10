/**
 * ECharts GL 3D extensions to base ECharts types
 *
 * @see https://echarts.apache.org/en/option-gl.html
 */
import type { EChartsOption } from "echarts";

/**
 * ECharts GL 3D extensions to base ECharts types
 */
export interface Grid3DComponentOption {
  boxWidth?: number;
  boxHeight?: number;
  boxDepth?: number;
  environment?: string;
  viewControl?: {
    projection?: "perspective" | "orthographic";
    autoRotate?: boolean;
    distance?: number;
    minDistance?: number;
    maxDistance?: number;
    alpha?: number;
    beta?: number;
    center?: [number, number, number];
  };
  light?: {
    main?: {
      intensity?: number;
      shadow?: boolean;
    };
    ambient?: {
      intensity?: number;
    };
  };
  axisPointer?: {
    show?: boolean;
  };
}

/**
 * 3D axis configuration options for echarts-gl
 */
export interface Axis3DOption {
  type?: "value" | "category" | "time" | "log";
  name?: string;
  axisLabel?: {
    show?: boolean;
    color?: string;
  };
  axisLine?: {
    show?: boolean;
    lineStyle?: {
      color?: string;
    };
  };
  axisTick?: {
    show?: boolean;
  };
}

/**
 * 3D scatter series configuration options for echarts-gl
 */
export interface Scatter3DSeriesOption {
  type: "scatter3D";
  data: Array<{
    value: [number, number, number];
    itemStyle?: {
      color?: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }>;
  symbolSize?: number | ((value: number[]) => number);
  itemStyle?: {
    opacity?: number;
  };
  emphasis?: {
    itemStyle?: {
      opacity?: number;
      borderWidth?: number;
      borderColor?: string;
    };
  };
}

/**
 * Extended ECharts option type that includes echarts-gl 3D components
 */
export interface EChartsGL3DOption extends Omit<EChartsOption, "series"> {
  grid3D?: Grid3DComponentOption;
  xAxis3D?: Axis3DOption;
  yAxis3D?: Axis3DOption;
  zAxis3D?: Axis3DOption;
  series?: Scatter3DSeriesOption[];
}
