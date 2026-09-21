"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // When route or searchParams changes, finish the progress
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Global click interceptor for internal links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Only trigger if going to a different path or query
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          setVisible(true);
          setProgress(25);

          const t1 = setTimeout(() => setProgress(65), 150);
          const t2 = setTimeout(() => setProgress(85), 400);

          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
          };
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px]">
      <div
        className="h-full bg-accent transition-all duration-300 ease-out shadow-[0_0_12px_var(--accent)]"
        style={{
          width: `${progress}%`,
          opacity: visible || progress > 0 ? 1 : 0,
        }}
      />
    </div>
  );
}

export default TopProgressBar;
