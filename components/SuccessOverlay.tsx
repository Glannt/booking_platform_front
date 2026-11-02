"use client";

import React, { useEffect, useRef } from "react";

interface SuccessOverlayProps {
  bookingCode: string;
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}

export default function SuccessOverlay({ bookingCode, onComplete, title = "Booking Successful!", subtitle = "Redirecting..." }: SuccessOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onComplete, 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div
        className="flex flex-col items-center gap-6 bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-10 shadow-2xl"
        style={{ animation: "scaleIn 0.4s ease-out" }}
      >
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ strokeDasharray: 226, strokeDashoffset: 226, animation: "drawCircle 0.6s ease-in-out 0.2s forwards" }}
            />
            <polyline
              points="24,42 35,52 56,30"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: "drawCheck 0.4s ease-in-out 0.8s forwards" }}
            />
          </svg>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{title}</h3>
          <p className="text-sm sm:text-base text-muted-foreground font-semibold">{subtitle}</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
      ` }} />
    </div>
  );
}
