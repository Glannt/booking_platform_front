"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * true khi element vào viewport (reveal một lần, không ẩn lại).
 * ponytail: IntersectionObserver thuần — không cần thư viện animation.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.2
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Không hỗ trợ observer => hiện ngay, không được để trống
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        io.disconnect(); // reveal once
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView];
}

export default useInView;
