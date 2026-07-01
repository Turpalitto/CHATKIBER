"use client";

import { motion, useReducedMotion } from "framer-motion";

interface NeuralHandshakeProps {
  progress?: number;
}

export function NeuralHandshake({ progress = 0.35 }: NeuralHandshakeProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="neural-handshake relative mx-auto flex h-28 w-28 items-center justify-center">
        <div className="h-16 w-16 rounded-full border border-[var(--cyan)]/30" />
      </div>
    );
  }

  return (
    <div className="neural-handshake relative mx-auto h-32 w-32">
      {[0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute inset-0 rounded-full border border-[var(--cyan)]/25"
          animate={{ scale: [0.55 + ring * 0.12, 1.05 + ring * 0.08, 0.55 + ring * 0.12], opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: 2.4 + ring * 0.4, repeat: Infinity, ease: "easeInOut", delay: ring * 0.25 }}
        />
      ))}
      <motion.div
        className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[var(--cyan)]/25 via-[var(--purple)]/20 to-transparent shadow-[0_0_40px_rgba(201,160,255,0.35)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)] shadow-[0_0_18px_var(--gold)]"
        animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-1 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-white/10"
        aria-hidden
      >
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--cyan)] via-[var(--gold)] to-[var(--purple)]"
          animate={{ width: `${Math.min(100, 20 + progress * 80)}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}
