"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ReconnectNoticeProps {
  isVisible: boolean;
  attempt: number;
  maxAttempts: number;
  onRetry?: () => void;
}

export function ReconnectNotice({ isVisible, attempt, maxAttempts, onRetry }: ReconnectNoticeProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-400/30 bg-[#0a0f17] px-5 py-2 text-sm text-amber-300 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <span>🔄 Восстанавливаем соединение... ({attempt}/{maxAttempts})</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-full border border-amber-400/30 px-3 py-0.5 text-xs hover:bg-amber-400/10"
            >
              Повторить
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}