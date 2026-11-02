"use client";

import React from "react";
import { useInView } from "@/hooks/useInView";

type RevealVariant = "up" | "left" | "right" | "scale" | "fade";

/** Tên class keyframes trong globals.css — viết đầy đủ từng biến thể. */
const hidden: Record<RevealVariant, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
  fade: "reveal-fade",
};

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Tag render ra (span badge phải kèm className inline-block/inline-flex). */
  as?: React.ElementType;
  variant?: RevealVariant;
  /** Stagger delay (ms) — lý tưởng 80–120ms mỗi phần tử. */
  delay?: number;
  /** Thời lượng animation (ms) — guideline 600–800. */
  duration?: number;
  children?: React.ReactNode;
}

/**
 * Hiện phần tử khi scroll tới (reveal một lần, không ẩn lại).
 * ponytail: IntersectionObserver + CSS animation thay vì transition, để
 * animation-delay không kéo chậm hover (shadow/border) của card.
 */
export function Reveal({
  as: Element = "div",
  variant = "up",
  delay = 0,
  duration = 700,
  className = "",
  style,
  children,
  ...rest
}: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <Element
      {...(rest as React.HTMLAttributes<HTMLElement>)}
      ref={ref as React.Ref<HTMLDivElement>}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        animationDuration: duration ? `${duration}ms` : undefined,
        ...style,
      }}
      className={`${hidden[variant]} ${inView ? "is-visible" : ""} ${className}`}
    >
      {children}
    </Element>
  );
}

export default Reveal;
