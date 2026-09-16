/**
 * Unified Status Mapping & Configuration Constants
 * Dùng để chuẩn hóa toàn bộ trạng thái trong hệ thống (boolean active/isActive, chuỗi status enum)
 */

export type AppStatusValue = boolean | string | number | undefined | null;

export type StatusCategory =
  | "general"
  | "booking"
  | "publish"
  | "rental"
  | "payment"
  | "discount";

export type StatusKey =
  | "ACTIVE"
  | "INACTIVE"
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "PUBLISHED"
  | "PAUSED"
  | "HIDDEN"
  | "BLOCKED"
  | "UNKNOWN";

export interface StatusConfigItem {
  key: StatusKey;
  getLabel: (t: any) => string;
  color: "success" | "warning" | "danger" | "default" | "accent";
  variant: "soft" | "primary" | "secondary" | "tertiary";
  bgClass?: string;
  textClass?: string;
  borderClass?: string;
  dotColorClass?: string;
}

/**
 * Chuẩn hóa giá trị đầu vào (boolean, string, number) về key trạng thái duy nhất
 */
export function normalizeStatus(
  val: AppStatusValue,
  category: StatusCategory = "general"
): StatusKey {
  if (val === null || val === undefined) {
    return category === "booking" ? "PENDING" : "INACTIVE";
  }

  if (typeof val === "boolean") {
    return val ? "ACTIVE" : "INACTIVE";
  }

  if (typeof val === "number") {
    return val === 1 ? "ACTIVE" : "INACTIVE";
  }

  const s = String(val).trim().toUpperCase();

  // Boolean string variants
  if (s === "TRUE" || s === "1" || s === "ACTIVE" || s === "HOAT_DONG" || s === "HOATDONG" || s === "DANG_HOAT_DONG") {
    return "ACTIVE";
  }
  if (s === "FALSE" || s === "0" || s === "INACTIVE" || s === "KHONG_HOAT_DONG" || s === "DISABLED") {
    return "INACTIVE";
  }

  // Common status keywords
  if (s === "PAUSED" || s === "TAM_NGUNG" || s === "TAM_DUNG") {
    return "PAUSED";
  }
  if (s === "HIDDEN" || s === "TAM_AN" || s === "AN") {
    return "HIDDEN";
  }
  if (s === "DRAFT" || s === "BAN_NHAP" || s === "NHAP") {
    return "DRAFT";
  }
  if (s === "PUBLISHED" || s === "DA_XUAT_BAN" || s === "CONG_KHAI") {
    return "PUBLISHED";
  }
  if (s === "BLOCKED" || s === "KHOA" || s === "BI_KHOA" || s === "LOCKED" || s === "BANNED") {
    return "BLOCKED";
  }

  // Booking statuses
  if (s === "PENDING" || s === "CHO_XU_LY" || s === "CHO_XAC_NHAN") {
    return "PENDING";
  }
  if (s === "CONFIRMED" || s === "DA_XAC_NHAN") {
    return "CONFIRMED";
  }
  if (s === "COMPLETED" || s === "HOAN_THANH" || s === "DA_HOAN_THANH") {
    return "COMPLETED";
  }
  if (s === "CANCELLED" || s === "CANCELED" || s === "DA_HUY" || s === "HUY") {
    return "CANCELLED";
  }

  return "UNKNOWN";
}

/**
 * Bảng cấu hình giao diện mặc định cho từng StatusKey
 */
export const STATUS_CONFIG_MAP: Record<StatusKey, StatusConfigItem> = {
  ACTIVE: {
    key: "ACTIVE",
    getLabel: (t) => t?.status?.active || t?.common?.active || "Đang hoạt động",
    color: "success",
    variant: "soft",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-300/50 dark:border-emerald-800/50",
    dotColorClass: "bg-emerald-500",
  },
  INACTIVE: {
    key: "INACTIVE",
    getLabel: (t) => t?.status?.inactive || t?.common?.inactive || "Không hoạt động",
    color: "default",
    variant: "soft",
    bgClass: "bg-slate-100 dark:bg-[var(--bg-elevated)]",
    textClass: "text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-200 dark:border-slate-800",
    dotColorClass: "bg-slate-400",
  },
  PAUSED: {
    key: "PAUSED",
    getLabel: (t) => t?.status?.paused || "Tạm ngưng",
    color: "warning",
    variant: "soft",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-300/50 dark:border-amber-800/50",
    dotColorClass: "bg-amber-500",
  },
  HIDDEN: {
    key: "HIDDEN",
    getLabel: (t) => t?.status?.hidden || "Tạm ẩn",
    color: "default",
    variant: "soft",
    bgClass: "bg-slate-100/80 dark:bg-[var(--bg-card)]",
    textClass: "text-slate-500 dark:text-slate-400",
    borderClass: "border-slate-200 dark:border-slate-800",
    dotColorClass: "bg-slate-400",
  },
  DRAFT: {
    key: "DRAFT",
    getLabel: (t) => t?.status?.draft || "Bản nháp",
    color: "warning",
    variant: "soft",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-300/50 dark:border-amber-800/50",
    dotColorClass: "bg-amber-500",
  },
  PUBLISHED: {
    key: "PUBLISHED",
    getLabel: (t) => t?.status?.published || "Đã xuất bản",
    color: "success",
    variant: "soft",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-300/50 dark:border-emerald-800/50",
    dotColorClass: "bg-emerald-500",
  },
  PENDING: {
    key: "PENDING",
    getLabel: (t) => t?.status?.pending || "Chờ xử lý",
    color: "warning",
    variant: "soft",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-300/50 dark:border-amber-800/50",
    dotColorClass: "bg-amber-500",
  },
  CONFIRMED: {
    key: "CONFIRMED",
    getLabel: (t) => t?.status?.confirmed || "Đã xác nhận",
    color: "accent",
    variant: "soft",
    bgClass: "bg-accent/15",
    textClass: "text-accent-foreground font-bold",
    borderClass: "border-accent/40",
    dotColorClass: "bg-accent",
  },
  COMPLETED: {
    key: "COMPLETED",
    getLabel: (t) => t?.status?.completed || "Hoàn thành",
    color: "success",
    variant: "soft",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-300/50 dark:border-emerald-800/50",
    dotColorClass: "bg-emerald-500",
  },
  CANCELLED: {
    key: "CANCELLED",
    getLabel: (t) => t?.status?.cancelled || "Đã hủy",
    color: "danger",
    variant: "soft",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-700 dark:text-rose-400",
    borderClass: "border-rose-300/50 dark:border-rose-800/50",
    dotColorClass: "bg-rose-500",
  },
  BLOCKED: {
    key: "BLOCKED",
    getLabel: (t) => t?.status?.blocked || "Bị khóa",
    color: "danger",
    variant: "soft",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-700 dark:text-rose-400",
    borderClass: "border-rose-300/50 dark:border-rose-800/50",
    dotColorClass: "bg-rose-500",
  },
  UNKNOWN: {
    key: "UNKNOWN",
    getLabel: () => "Không rõ",
    color: "default",
    variant: "soft",
    bgClass: "bg-slate-100 dark:bg-[var(--bg-elevated)]",
    textClass: "text-slate-600 dark:text-slate-400",
    borderClass: "border-slate-200 dark:border-slate-800",
    dotColorClass: "bg-slate-400",
  },
};

/**
 * Lấy cấu hình đầy đủ cho một giá trị trạng thái
 */
export function getStatusConfig(
  val: AppStatusValue,
  category: StatusCategory = "general"
): StatusConfigItem {
  const normalizedKey = normalizeStatus(val, category);
  return STATUS_CONFIG_MAP[normalizedKey] || STATUS_CONFIG_MAP.UNKNOWN;
}
