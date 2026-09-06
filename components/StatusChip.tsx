"use client";

import React from "react";
import { useI18n } from "@/context/LanguageContext";

type StatusType = "booking" | "active" | "publish" | "tour";

interface StatusChipProps {
  status: string;
  type?: StatusType;
}

const bookingColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
  },
  confirmed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
  },
  completed: {
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-100 dark:border-indigo-900/50",
  },
  cancelled: {
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-100 dark:border-rose-900/50",
  },
};

const activeColors: Record<string, { bg: string; text: string; border: string }> = {
  active: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
  },
  draft: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
  },
  inactive: {
    bg: "bg-slate-100 dark:bg-slate-800/80",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
};

const publishColors: Record<string, { bg: string; text: string; border: string }> = {
  published: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
  },
  draft: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
  },
};

function getStatusLabel(
  type: StatusType,
  status: string,
  t: ReturnType<typeof useI18n>["t"]
): string {
  const s = (status || "").toLowerCase().trim();

  if (type === "booking") {
    const labels: Record<string, string> = {
      pending: t.status.pending,
      confirmed: t.status.confirmed,
      completed: t.status.completed,
      cancelled: t.status.cancelled,
    };
    return labels[s] || t.status.pending;
  }
  if (type === "publish") {
    const labels: Record<string, string> = {
      published: t.status.published,
      draft: t.status.draft,
    };
    return labels[s] || t.status.draft;
  }

  if (s === "draft") return t.status.draft;
  if (s === "true" || s === "active") return t.status.active;
  return t.status.inactive;
}

export function StatusChip({ status, type = "active" }: StatusChipProps) {
  const { t } = useI18n();
  const s = (status || "").toLowerCase().trim();
  let colors;

  if (type === "booking") {
    colors = bookingColors[s] || bookingColors.pending;
  } else if (type === "publish") {
    colors = publishColors[s] || publishColors.draft;
  } else {
    if (s === "draft") {
      colors = activeColors.draft;
    } else if (s === "true" || s === "active") {
      colors = activeColors.active;
    } else {
      colors = activeColors.inactive;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {getStatusLabel(type, status, t)}
    </span>
  );
}
