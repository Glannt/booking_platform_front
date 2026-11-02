import React from "react";

export default function AirportTransferLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      {/* Search Header Skeleton */}
      <div className="w-full bg-muted/60 py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-8 md:h-10 w-96 bg-muted-foreground/15 rounded-2xl mx-auto" />
          <div className="h-4 w-80 bg-muted-foreground/15 rounded-xl mx-auto" />
          <div className="w-full h-32 bg-surface rounded-2xl border border-separator shadow-md p-4 mt-6 flex flex-col justify-between">
            <div className="flex gap-2">
              <div className="h-8 w-32 bg-muted rounded-xl" />
              <div className="h-8 w-32 bg-muted rounded-xl" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="h-10 bg-muted rounded-xl" />
              <div className="h-10 bg-muted rounded-xl" />
              <div className="h-10 bg-muted rounded-xl" />
              <div className="h-10 bg-accent/30 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Packages Grid Skeleton */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10 space-y-6">
        <div className="h-7 w-72 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-separator overflow-hidden space-y-3 p-4">
              <div className="aspect-[16/10] w-full bg-muted rounded-xl" />
              <div className="h-3 w-24 bg-accent/20 rounded" />
              <div className="h-5 w-4/5 bg-muted rounded" />
              <div className="space-y-2 pt-2 border-t border-separator/60">
                <div className="h-3.5 w-3/4 bg-muted/60 rounded" />
                <div className="h-3.5 w-2/3 bg-muted/60 rounded" />
                <div className="h-3.5 w-4/5 bg-muted/60 rounded" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-separator/60">
                <div className="space-y-1">
                  <div className="h-3 w-12 bg-muted/60 rounded" />
                  <div className="h-6 w-24 bg-accent/20 rounded" />
                </div>
                <div className="h-9 w-24 bg-accent/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
