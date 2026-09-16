import React from "react";
import clsx from "clsx";

export type HighlightBadgeVariant = "default" | "accent" | "amber" | "outline" | "muted";

export interface HighlightBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Icon rendered before the value (Lucide icon, SvgIconRenderer, or any ReactNode) */
  icon?: React.ReactNode;
  /** Primary display value (string, number, or ReactNode) */
  value?: React.ReactNode;
  /** Children as an alternative to value for flexible composition */
  children?: React.ReactNode;
  /** Custom background class (overrides variant default) */
  bg?: string;
  /** Custom border class (overrides variant default) */
  border?: string;
  /** Custom border-radius class (defaults to "rounded-full") */
  rounded?: string;
  /** Custom text color / typography class (overrides variant default) */
  textColor?: string;
  /** Predefined visual style variant */
  variant?: HighlightBadgeVariant;
  /** Additional custom className */
  className?: string;
}

const variantStyles: Record<
  HighlightBadgeVariant,
  { bg: string; border: string; textColor: string }
> = {
  default: {
    bg: "bg-white dark:bg-[var(--bg-card)]",
    border: "border border-slate-200/80 dark:border-slate-800 shadow-2xs",
    textColor: "text-slate-700 dark:text-slate-300 font-semibold",
  },
  outline: {
    bg: "bg-transparent",
    border: "border border-slate-200 dark:border-slate-800",
    textColor: "text-slate-700 dark:text-slate-300 font-semibold",
  },
  accent: {
    bg: "bg-accent/10 dark:bg-accent/20",
    border: "border-transparent",
    textColor: "text-accent font-bold",
  },
  amber: {
    bg: "bg-amber-500/15",
    border: "border-transparent",
    textColor: "text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider",
  },
  muted: {
    bg: "bg-slate-100 dark:bg-[var(--bg-elevated)]",
    border: "border-transparent",
    textColor: "text-slate-600 dark:text-zinc-300 font-semibold",
  },
};

export const HighlightBadge: React.FC<HighlightBadgeProps> = ({
  icon,
  value,
  children,
  bg,
  border,
  rounded = "rounded-full",
  textColor,
  variant = "default",
  className,
  ...rest
}) => {
  const content = value ?? children;
  if (content === undefined || content === null || content === "") {
    return null;
  }

  const vStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm transition-colors",
        rounded,
        bg ?? vStyle.bg,
        border ?? vStyle.border,
        textColor ?? vStyle.textColor,
        className
      )}
      {...rest}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{content}</span>
    </span>
  );
};

export default HighlightBadge;
