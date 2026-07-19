"use client";

import React from "react";
import { useI18n } from "@/context/LanguageContext";

type StatusType = "booking" | "active" | "publish";

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
  true: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
  },
  false: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
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
  if (type === "booking") {
    const labels: Record<string, string> = {
      pending: t.status.pending,
      confirmed: t.status.confirmed,
      completed: t.status.completed,
      cancelled: t.status.cancelled,
    };
    return labels[status] || t.status.pending;
  }
  if (type === "publish") {
    const labels: Record<string, string> = {
      published: t.status.published,
      draft: t.status.draft,
    };
    return labels[status] || t.status.draft;
  }
  return status === "true" || status === "active" ? t.status.active : t.status.inactive;
}

export function StatusChip({ status, type = "active" }: StatusChipProps) {
  const { t } = useI18n();
  let colors;

  if (type === "booking") {
    colors = bookingColors[status] || bookingColors.pending;
  } else if (type === "publish") {
    colors = publishColors[status] || publishColors.draft;
  } else {
    colors = activeColors[status === "true" || status === "active" ? "true" : "false"];
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {getStatusLabel(type, status, t)}
    </span>
  );
}
