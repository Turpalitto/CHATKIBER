"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatMessage } from "@/lib/i18n";

interface ReconnectNoticeProps {
  isVisible: boolean;
  attempt: number;
  maxAttempts: number;
  title: string;
  retryLabel: string;
  attemptLabel: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function ReconnectNotice({
  isVisible,
  attempt,
  maxAttempts,
  title,
  retryLabel,
  attemptLabel,
  onRetry,
  onDismiss,
  dismissLabel
}: ReconnectNoticeProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-400/30 bg-[#0a0f17] px-5 py-2 text-sm text-amber-300 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>
            {title} {formatMessage(attemptLabel, { current: attempt, max: maxAttempts })}
          </span>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full border border-amber-400/30 px-3 py-0.5 text-xs hover:bg-amber-400/10"
            >
              {retryLabel}
            </button>
          ) : null}
          {onDismiss && dismissLabel ? (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-white/10 px-3 py-0.5 text-xs text-white/60 hover:bg-white/5"
            >
              {dismissLabel}
            </button>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
