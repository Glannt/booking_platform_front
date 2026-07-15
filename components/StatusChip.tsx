"use client";

import React from "react";

type StatusType = "booking" | "active" | "publish";

interface StatusChipProps {
  status: string;
  type?: StatusType;
}

const bookingColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
    label: "Chờ xử lý",
  },
  confirmed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
    label: "Đã xác nhận",
  },
  completed: {
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-100 dark:border-indigo-900/50",
    label: "Hoàn thành",
  },
  cancelled: {
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-100 dark:border-rose-900/50",
    label: "Đã hủy",
  },
};

const activeColors = {
  true: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
    label: "Hoạt động",
  },
  false: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
    label: "Ngưng",
  },
};

const publishColors = {
  published: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/50",
    label: "Hiển thị",
  },
  draft: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/50",
    label: "Bản nháp",
  },
};

export function StatusChip({ status, type = "active" }: StatusChipProps) {
  let colors;

  if (type === "booking") {
    colors = bookingColors[status] || bookingColors.pending;
  } else if (type === "publish") {
    colors = publishColors[status as keyof typeof publishColors] || publishColors.draft;
  } else {
    // active/inactive boolean
    colors = activeColors[status === "true" || status === "active" ? "true" : "false"];
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {colors.label}
    </span>
  );
}
