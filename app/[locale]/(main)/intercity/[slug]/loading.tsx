import React from "react";

export default function IntercityDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-44 bg-muted rounded" />
        </div>

        {/* Route Title & Highlights */}
        <div className="space-y-2">
          <div className="h-8 md:h-10 w-2/3 bg-muted rounded-2xl" />
          <div className="flex items-center gap-4">
            <div className="h-5 w-24 bg-accent/20 rounded" />
            <div className="h-5 w-32 bg-muted rounded" />
          </div>
        </div>

        {/* Route Details & Booking Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[16/9] w-full bg-muted rounded-3xl" />
            <div className="p-6 rounded-3xl bg-surface border border-separator space-y-4">
              <div className="h-6 w-44 bg-muted rounded-lg" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted/70 rounded" />
                <div className="h-4 w-5/6 bg-muted/70 rounded" />
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="p-6 rounded-3xl bg-surface border border-separator shadow-lg space-y-5 h-fit">
            <div className="space-y-1">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-36 bg-accent/25 rounded-xl" />
            </div>
            <div className="space-y-3">
              <div className="h-12 bg-muted/70 rounded-2xl" />
              <div className="h-12 bg-muted/70 rounded-2xl" />
              <div className="h-12 bg-muted/70 rounded-2xl" />
              <div className="h-12 bg-accent/40 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
