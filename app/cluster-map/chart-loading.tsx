import React from "react";

/**
 * Loading skeleton for the 3D chart component
 *
 * @returns JSX element containing the chart loading skeleton
 */
export function ChartLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="h-96 animate-pulse rounded-lg border bg-muted" />
      </div>
      <div className="lg:col-span-3">
        <div className="h-[800px] animate-pulse rounded-lg border bg-muted" />
      </div>
    </div>
  );
}
