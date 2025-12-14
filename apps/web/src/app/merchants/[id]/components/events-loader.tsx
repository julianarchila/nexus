"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function EventsLoader() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
        {/* Header */}
        <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3 flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={`skeleton-row-${i}`}
            className="px-4 py-4 flex gap-4 border-b border-slate-100 last:border-0"
          >
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
