"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createLatticeSeal, LatticeSeal } from "@/lib/consciousness";

interface LatticeSealBadgeProps {
  payload: string;
  scoreLabel: string;
  commitmentLabel: string;
}

export function LatticeSealBadge({ payload, scoreLabel, commitmentLabel }: LatticeSealBadgeProps) {
  const [seal, setSeal] = useState<LatticeSeal | null>(null);

  useEffect(() => {
    let cancelled = false;
    void createLatticeSeal(payload).then((next) => {
      if (!cancelled) {
        setSeal(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!seal) {
    return <div className="h-24 animate-pulse rounded-2xl bg-white/5" />;
  }

  return (
    <div className="rounded-2xl border border-[var(--cyan)]/15 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">{commitmentLabel}</p>
          <p className="mt-1 font-mono text-[11px] text-[var(--cyan)]/85">{seal.commitment}</p>
          <p className="mt-2 text-xs text-white/55">
            {scoreLabel}: <span className="text-[var(--gold)]">{seal.unlinkabilityScore}%</span>
          </p>
        </div>
        <motion.div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${seal.dimension}, minmax(0, 1fr))` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {seal.grid.map((lit, index) => (
            <span
              key={index}
              className={`h-1 w-1 rounded-[1px] ${lit ? "bg-[var(--purple)]/80" : "bg-white/5"}`}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
