"use client";

import React from "react";

interface PaymentStatusChipProps {
  status?: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PAID: {
    label: "Đã thanh toán",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  DEPOSITED: {
    label: "Đã đặt cọc",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
};

const DEFAULT_STATUS = {
  label: "Chưa thanh toán",
  className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-border/50",
};

export function PaymentStatusChip({ status }: PaymentStatusChipProps) {
  const cfg = STATUS_MAP[status ?? ""] ?? DEFAULT_STATUS;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export default PaymentStatusChip;