"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@heroui/react";

interface ErrorOverlayProps {
  message: string;
  onClose: () => void;
}

export default function ErrorOverlay({ message, onClose }: ErrorOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div
        className="flex flex-col items-center gap-6 bg-white dark:bg-[var(--bg-surface)] rounded-3xl p-10 shadow-2xl max-w-sm mx-4"
        style={{ animation: "scaleIn 0.4s ease-out" }}
      >
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ strokeDasharray: 226, strokeDashoffset: 226, animation: "drawCircle 0.6s ease-in-out 0.2s forwards" }}
            />
            <line
              x1="28" y1="28" x2="52" y2="52"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ strokeDasharray: 34, strokeDashoffset: 34, animation: "drawX1 0.3s ease-in-out 0.8s forwards" }}
            />
            <line
              x1="52" y1="28" x2="28" y2="52"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ strokeDasharray: 34, strokeDashoffset: 34, animation: "drawX2 0.3s ease-in-out 1.1s forwards" }}
            />
          </svg>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Booking Failed</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{message}</p>
        </div>

        <Button
          onPress={onClose}
          className="bg-accent text-white rounded-2xl text-xs font-black border-none cursor-pointer h-10 px-6 inline-flex items-center gap-1"
        >
          <X size={14} />
          Close
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes drawCircle { to { stroke-dashoffset: 0; } }
        @keyframes drawX1 { to { stroke-dashoffset: 0; } }
        @keyframes drawX2 { to { stroke-dashoffset: 0; } }
      ` }} />
    </div>
  );
}
