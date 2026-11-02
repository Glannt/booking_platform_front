"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

interface TableLoadingStateProps {
  message?: string;
}

export function TableLoadingState({
  message = "Đang tải dữ liệu...",
}: TableLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw className="animate-spin text-primary" size={32} />
      <p className="text-sm font-bold text-foreground/60">{message}</p>
    </div>
  );
}

export default TableLoadingState;