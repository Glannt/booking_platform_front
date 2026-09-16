"use client";

import React from "react";
import { AppStatusChip, type AppStatusChipProps } from "@/components/common/AppStatusChip";
import type { StatusCategory } from "@/lib/constants/status.constants";

export type StatusType = "booking" | "active" | "publish" | "tour" | "general" | "rental" | "payment";

export interface StatusChipProps extends Omit<AppStatusChipProps, "status" | "category"> {
  status: boolean | string | number | undefined | null;
  type?: StatusType;
}

/**
 * StatusChip wrapper tương thích ngược với code cũ, sử dụng HeroUI Chip thông qua AppStatusChip
 */
export function StatusChip({ status, type = "active", ...rest }: StatusChipProps) {
  let category: StatusCategory = "general";
  if (type === "booking") category = "booking";
  else if (type === "publish") category = "publish";

  return <AppStatusChip status={status} category={category} {...rest} />;
}

export { AppStatusChip };
export default StatusChip;
