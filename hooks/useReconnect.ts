"use client";

import { useEffect, useRef } from "react";

interface UseReconnectOptions {
  onReconnect?: () => void;
  maxRetries?: number;
}

export function useReconnect({ onReconnect, maxRetries = 5 }: UseReconnectOptions = {}) {
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const attemptReconnect = () => {
    if (retryCount.current >= maxRetries) {
      return false;
    }

    retryCount.current += 1;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const delay = Math.min(1000 * Math.pow(1.8, retryCount.current), 15000);

    timeoutRef.current = setTimeout(() => {
      if (onReconnect) onReconnect();
    }, delay);

    return true;
  };

  const resetRetries = () => {
    retryCount.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { attemptReconnect, resetRetries, retryCount: retryCount.current };
}