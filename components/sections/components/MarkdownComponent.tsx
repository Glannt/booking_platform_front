"use client";

import React from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import type { MarkdownComponentData } from "@/types/routeComponents";

interface MarkdownComponentProps {
  data: MarkdownComponentData;
  className?: string;
}

export function MarkdownComponent({ data, className = "" }: MarkdownComponentProps) {
  if (!data) return null;

  const fieldKey = data.props?.field_key || "";
  const isInclusive = fieldKey === "inclusive_of";
  const isExclusive = fieldKey === "not_inclusive_of";

  const items = data.render_obj || [];
  if (items.length === 0) return null;

  const containerClasses = isInclusive
    ? "bg-emerald-50/40 dark:bg-[var(--bg-card)] border-emerald-100 dark:border-emerald-900/40"
    : isExclusive
    ? "bg-amber-50/40 dark:bg-[var(--bg-card)] border-amber-100 dark:border-amber-900/40"
    : "bg-white dark:bg-[var(--bg-card)] border-slate-200 dark:border-slate-800";

  return (
    <div className={`p-5 rounded-2xl border ${containerClasses} space-y-3.5 ${className}`}>
      <div className="flex items-center gap-2">
        {isInclusive ? (
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        ) : isExclusive ? (
          <XCircle size={18} className="text-amber-500 shrink-0" />
        ) : (
          <Info size={18} className="text-accent shrink-0" />
        )}
        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
          {data.title}
        </h3>
      </div>

      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
          >
            {item.icon ? (
              <img
                src={item.icon}
                alt=""
                className="w-4 h-4 mt-0.5 shrink-0 object-contain"
                loading="lazy"
              />
            ) : isInclusive ? (
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
            ) : isExclusive ? (
              <XCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
            )}
            <span>{item.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
