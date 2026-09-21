import React from "react";

export default function HomeLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[400px] md:h-[450px] bg-muted/70 flex flex-col justify-between items-center pt-16 pb-0">
        <div className="space-y-4 text-center max-w-xl mx-auto px-4 w-full">
          <div className="h-10 md:h-12 bg-muted-foreground/15 rounded-2xl w-3/4 mx-auto" />
          <div className="h-4 bg-muted-foreground/15 rounded-xl w-1/2 mx-auto" />
        </div>

        {/* Booking Bar Skeleton */}
        <div className="w-full max-w-5xl mx-auto -mb-16 sm:-mb-20 px-4">
          <div className="w-full h-28 sm:h-32 bg-surface rounded-2xl sm:rounded-3xl border border-separator shadow-lg p-4 flex flex-col justify-between">
            <div className="flex gap-3">
              <div className="h-8 w-28 bg-muted rounded-xl" />
              <div className="h-8 w-28 bg-muted rounded-xl" />
              <div className="h-8 w-28 bg-muted rounded-xl" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div className="h-10 bg-muted/60 rounded-xl" />
              <div className="h-10 bg-muted/60 rounded-xl" />
              <div className="h-10 bg-muted/60 rounded-xl" />
              <div className="h-10 bg-accent/30 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Skeleton */}
      <div className="pt-24 sm:pt-28 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-muted" />
            <div className="w-14 h-3 rounded bg-muted/70" />
          </div>
        ))}
      </div>

      {/* Section 1 Skeleton */}
      <div className="mt-14 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-muted rounded-xl" />
            <div className="h-4 w-96 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-5 w-20 bg-muted rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-separator overflow-hidden space-y-3 p-3">
              <div className="aspect-[16/10] w-full bg-muted rounded-xl" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted/70 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 w-24 bg-accent/20 rounded" />
                <div className="h-8 w-20 bg-accent/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 Skeleton */}
      <div className="mt-14 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4 pb-20">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-7 w-72 bg-muted rounded-xl" />
            <div className="h-4 w-80 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-5 w-20 bg-muted rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-separator overflow-hidden space-y-3 p-3">
              <div className="aspect-[16/10] w-full bg-muted rounded-xl" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted/70 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 w-24 bg-accent/20 rounded" />
                <div className="h-8 w-20 bg-accent/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
