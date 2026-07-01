"use client";

import { AnimatePresence, motion } from "framer-motion";

interface TemporalEchoFlashProps {
  strength: number | null;
  label: string;
}

export function TemporalEchoFlash({ strength, label }: TemporalEchoFlashProps) {
  return (
    <AnimatePresence>
      {strength ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          className="pointer-events-none absolute inset-x-4 top-24 z-30 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-3 text-center backdrop-blur"
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">{label}</p>
          <p className="mt-1 text-sm text-white/80">{strength}%</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
