import React from "react";

export default function ToursLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      {/* Hero Skeleton */}
      <div className="w-full h-48 md:h-64 bg-muted/60 flex flex-col justify-center items-center px-4">
        <div className="h-8 md:h-10 w-64 md:w-96 bg-muted-foreground/15 rounded-2xl mb-3" />
        <div className="h-4 w-48 md:w-80 bg-muted-foreground/15 rounded-xl" />
      </div>

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8">
        {/* Category Pills Skeleton */}
        <div className="flex items-center gap-3 overflow-hidden pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 w-32 bg-muted rounded-xl shrink-0" />
          ))}
        </div>

        {/* Filter & Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-separator shadow-xs">
          <div className="h-10 w-full sm:w-80 bg-muted rounded-xl" />
          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-hidden">
            <div className="h-10 w-28 bg-muted rounded-xl shrink-0" />
            <div className="h-10 w-28 bg-muted rounded-xl shrink-0" />
            <div className="h-10 w-28 bg-muted rounded-xl shrink-0" />
          </div>
        </div>

        {/* Tours Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-separator overflow-hidden space-y-3 p-3">
              <div className="aspect-[16/10] w-full bg-muted rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-4 w-12 bg-amber-500/20 rounded" />
                <div className="h-3 w-20 bg-muted/70 rounded" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-separator/60">
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-muted/60 rounded" />
                  <div className="h-5 w-24 bg-accent/20 rounded" />
                </div>
                <div className="h-8 w-20 bg-accent/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
