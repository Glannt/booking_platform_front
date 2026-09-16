"use client";

import React from "react";
import { Info } from "lucide-react";
import type { TextsComponentData } from "@/types/routeComponents";

interface TextsComponentProps {
  data: TextsComponentData;
  className?: string;
}

export function TextsComponent({ data, className = "" }: TextsComponentProps) {
  if (!data) return null;

  const items = data.items || [];
  const renderObj = data.render_obj || [];

  if (items.length === 0 && renderObj.length === 0) return null;

  return (
    <div className={`p-5 rounded-2xl border bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800 space-y-3.5 ${className}`}>
      {data.title && (
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Info size={18} className="text-accent shrink-0" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
            {data.title}
          </h3>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[var(--bg-surface)] border border-slate-100 dark:border-slate-800/60"
            >
              {item.icon ? (
                <img src={item.icon} alt="" className="w-4 h-4 mt-0.5 shrink-0 object-contain" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              )}
              <div className="text-xs space-y-0.5">
                {item.title && (
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {item.title}
                  </span>
                )}
                {item.content && (
                  <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed block">
                    {item.content}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {renderObj.length > 0 && items.length === 0 && (
        <ul className="space-y-2.5">
          {renderObj.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
            >
              {item.icon ? (
                <img src={item.icon} alt="" className="w-4 h-4 mt-0.5 shrink-0 object-contain" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              )}
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
