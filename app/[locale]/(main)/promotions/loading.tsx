import React from "react";

export default function PromotionsLoading() {
  return (
    <div className="w-full min-h-screen bg-background animate-pulse">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10 space-y-8">
        <div className="space-y-3 text-center max-w-xl mx-auto">
          <div className="h-8 md:h-10 w-72 bg-muted rounded-2xl mx-auto" />
          <div className="h-4 w-96 bg-muted/60 rounded-xl mx-auto" />
        </div>

        {/* Promo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-separator overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-accent/20 rounded-lg" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
              <div className="h-5 w-4/5 bg-muted rounded" />
              <div className="h-4 w-full bg-muted/60 rounded" />
              <div className="flex items-center justify-between pt-4 border-t border-separator/60">
                <div className="h-8 w-28 bg-muted rounded-xl" />
                <div className="h-8 w-24 bg-accent/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
