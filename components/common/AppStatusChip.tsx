"use client";

import React from "react";
import { Chip } from "@heroui/react";
import { useI18n } from "@/context/LanguageContext";
import {
  type AppStatusValue,
  type StatusCategory,
  getStatusConfig,
} from "@/lib/constants/status.constants";
import clsx from "clsx";

export interface AppStatusChipProps {
  /** Giá trị trạng thái: boolean (active/isActive), số (1/0) hoặc chuỗi enum ("ACTIVE", "PENDING", v.v.) */
  status: AppStatusValue;
  /** Danh mục trạng thái nghiệp vụ */
  category?: StatusCategory;
  /** Nhãn tùy biến (nếu không truyền sẽ tự động lấy từ từ điển i18n chuẩn) */
  label?: string;
  /** Màu sắc HeroUI Chip */
  color?: "success" | "warning" | "danger" | "default" | "accent";
  /** Kiểu hiển thị Chip */
  variant?: "soft" | "primary" | "secondary" | "tertiary";
  /** Kích thước Chip */
  size?: "sm" | "md" | "lg";
  /** Hiển thị chấm tròn trạng thái (dot indicator) */
  showDot?: boolean;
  /** Icon tùy biến ở đầu Chip */
  icon?: React.ReactNode;
  /** Class tùy biến bổ sung */
  className?: string;
  /** Class nền tùy biến (nếu muốn override token) */
  bgClass?: string;
  /** Class màu chữ tùy biến (nếu muốn override token) */
  textColorClass?: string;
  /** Class viền tùy biến */
  borderClass?: string;
}

export function AppStatusChip({
  status,
  category = "general",
  label,
  color,
  variant,
  size = "sm",
  showDot = false,
  icon,
  className = "",
  bgClass,
  textColorClass,
  borderClass,
}: AppStatusChipProps) {
  const { t } = useI18n();
  const config = getStatusConfig(status, category);

  const finalLabel = label || config.getLabel(t);
  const finalColor = color || config.color;
  const finalVariant = variant || config.variant;

  return (
    <Chip
      size={size}
      variant={finalVariant}
      color={finalColor}
      className={clsx(
        "font-bold text-[10px] tracking-wide inline-flex items-center gap-1.5 transition-colors select-none",
        bgClass || config.bgClass,
        textColorClass || config.textClass,
        borderClass || config.borderClass,
        className
      )}
    >
      {icon ? (
        <span className="shrink-0">{icon}</span>
      ) : showDot ? (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            config.dotColorClass || "bg-current"
          )}
        />
      ) : null}
      <span className="truncate">{finalLabel}</span>
    </Chip>
  );
}
