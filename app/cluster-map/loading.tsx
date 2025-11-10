import React from "react";

/**
 * Loading skeleton for cluster map page
 *
 * @returns JSX element containing the loading skeleton
 */
export default function Loading(): React.JSX.Element {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-6 w-96 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-4 rounded-lg border bg-card p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="h-96 animate-pulse rounded-lg border bg-muted" />
        </div>
        <div className="lg:col-span-3">
          <div className="h-[800px] animate-pulse rounded-lg border bg-muted" />
        </div>
      </div>
    </div>
  );
}
