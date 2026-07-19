"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={32} className="text-danger" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}
