"use client";

import { useRef, useEffect } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe(options: SwipeOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = startX.current - endX;
      const diffY = startY.current - endY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > (options.threshold || 50)) {
          if (diffX > 0) {
            options.onSwipeLeft?.();
          } else {
            options.onSwipeRight?.();
          }
        }
      }
    };

    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [options]);

  return elementRef;
}