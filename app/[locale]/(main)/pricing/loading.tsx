import React from "react";

export default function PricingLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10 space-y-8">
        <div className="space-y-3 text-center max-w-xl mx-auto">
          <div className="h-8 md:h-10 w-72 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-96 bg-muted/60 rounded-xl mx-auto" />
        </div>

        {/* Pricing Table / Card Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-3xl border border-separator overflow-hidden space-y-6 p-6">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded-lg" />
                <div className="h-4 w-48 bg-muted/60 rounded" />
              </div>
              <div className="h-10 w-36 bg-accent/25 rounded-2xl" />
              <div className="space-y-3 pt-4 border-t border-separator/60">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 w-full bg-muted/50 rounded" />
                ))}
              </div>
              <div className="h-12 w-full bg-accent/30 rounded-2xl pt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
