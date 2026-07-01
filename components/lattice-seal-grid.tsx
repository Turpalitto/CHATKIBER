"use client";

import { motion } from "framer-motion";
import { LatticeSeal } from "@/lib/consciousness/types";

interface LatticeSealGridProps {
  seal: LatticeSeal | null;
  compact?: boolean;
}

export function LatticeSealGrid({ seal, compact = false }: LatticeSealGridProps) {
  if (!seal) {
    return null;
  }

  const cell = compact ? "h-1 w-1" : "h-1.5 w-1.5";

  return (
    <div className={`grid gap-px ${compact ? "w-24" : "w-36"}`} style={{ gridTemplateColumns: `repeat(${seal.dimension}, minmax(0, 1fr))` }}>
      {seal.grid.map((lit, index) => (
        <motion.span
          key={index}
          className={`${cell} rounded-[1px] ${lit ? "bg-[var(--cyan)]/80 shadow-[0_0_6px_rgba(212,240,255,0.35)]" : "bg-white/5"}`}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: lit ? 0.95 : 0.25, scale: 1 }}
          transition={{ delay: (index % seal.dimension) * 0.01 + Math.floor(index / seal.dimension) * 0.008, duration: 0.2 }}
        />
      ))}
    </div>
  );
}
