"use client";

import React from "react";
import { Inbox, type LucideIcon } from "lucide-react";

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function TableEmptyState({
  icon: Icon = Inbox,
  title = "Không tìm thấy dữ liệu",
  description,
  action,
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <Icon className="text-foreground/30 dark:text-foreground/20 mb-4" size={48} />
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-foreground/60 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default TableEmptyState;