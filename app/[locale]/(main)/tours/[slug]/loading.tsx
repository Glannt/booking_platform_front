import React from "react";

export default function TourDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="h-8 md:h-10 w-3/4 bg-muted rounded-2xl" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-24 bg-amber-500/20 rounded" />
            <div className="h-5 w-32 bg-muted rounded" />
          </div>
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[320px] md:h-[420px]">
          <div className="md:col-span-2 md:row-span-2 bg-muted rounded-2xl w-full h-full" />
          <div className="hidden md:block bg-muted rounded-2xl w-full h-full" />
          <div className="hidden md:block bg-muted rounded-2xl w-full h-full" />
          <div className="hidden md:block bg-muted rounded-2xl w-full h-full" />
          <div className="hidden md:block bg-muted rounded-2xl w-full h-full" />
        </div>

        {/* Content & Sidebar Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4 border-b border-separator pb-3">
              <div className="h-6 w-24 bg-muted rounded-lg" />
              <div className="h-6 w-24 bg-muted rounded-lg" />
              <div className="h-6 w-24 bg-muted rounded-lg" />
              <div className="h-6 w-24 bg-muted rounded-lg" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
            <div className="p-6 rounded-2xl bg-surface border border-separator space-y-4">
              <div className="h-6 w-40 bg-muted rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-muted/60 rounded-xl" />
                <div className="h-10 bg-muted/60 rounded-xl" />
                <div className="h-10 bg-muted/60 rounded-xl" />
                <div className="h-10 bg-muted/60 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Sticky Booking Box */}
          <div className="p-6 rounded-3xl bg-surface border border-separator shadow-lg space-y-5 h-fit">
            <div className="space-y-1">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-36 bg-accent/25 rounded-xl" />
            </div>
            <div className="space-y-3">
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
